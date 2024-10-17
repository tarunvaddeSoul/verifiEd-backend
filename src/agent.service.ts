import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import axios from 'axios';
import { AgentDto } from './dtos/agent.dto';
import { NYM_URL, ledgerOptions } from './agentUtils/ledgerConfig';
import { NetworkOptions } from './enums';
import { setupApp, CredoRestAgentConfig } from '@credo-ts/rest';
import {
  Agent,
  AutoAcceptCredential,
  AutoAcceptProof,
  CreateOutOfBandInvitationConfig,
  KeyType,
  LogLevel,
  OutOfBandRecord,
  TypedArrayEncoder,
} from '@credo-ts/core';
import express from 'express';
import {
  RestRootAgent,
  RestRootAgentWithTenants,
} from '@credo-ts/rest/build/utils/agent';
import { createRestAgent } from './agentUtils/restAgent';
import { connect } from 'ngrok';
import { IndyVdrPoolConfig } from './interface/agent.interface';
// strategy (terraform, kubernetes), expectations from client and what we offer, platform to deploy on (AWS, Azure. Changes to aws to azure should be minimal), how are we developing (functionality, )
export class AgentWrapper {
  public agent: Agent | RestRootAgent | null = null;

  constructor(
    public readonly id: string,
    public readonly adminPort: number,
    public readonly inboundPort: number,
    private config: CredoRestAgentConfig,
  ) {}

  async initialize(): Promise<void> {
    this.agent = await createRestAgent(this.config);
    await this.setupExpressApp();
  }

  getAgent(): RestRootAgent | RestRootAgentWithTenants {
    if (!this.agent) {
      throw new Error('Agent not initialized');
    }
    return this.agent;
  }

  getEndpoints(): string[] {
    return this.getAgent().config.endpoints;
  }

  private async setupExpressApp(): Promise<void> {
    const app = express();
    try {
      const { start } = await setupApp({
        baseApp: app,
        adminPort: this.adminPort,
        enableCors: true,
        agent: this.getAgent(),
        // webhookUrl: "http://localhost:5000/agent-events",
      });
      start();
    } catch (error: any) {
      if (error.code === 'EADDRINUSE') {
        throw new HttpException(
          `Admin port ${this.adminPort} is already in use. Please try again with a different port.`,
          HttpStatus.BAD_REQUEST,
        );
      }
      throw error;
    }
  }
}

@Injectable()
export class AgentService {
  private agentWrapper: AgentWrapper | null = null;
  public agent: Agent | RestRootAgent | null = null;

  private readonly agentHost: string;
  private readonly adminPort: number;
  private readonly inboundPort: number;
  // private readonly dbHost: string;
  // private readonly dbUser: string;
  // private readonly dbPassword: string;

  constructor(private readonly logger: Logger) {
    const { AGENT_HOST, ADMIN_PORT, INBOUND_PORT } = process.env;

    if (!AGENT_HOST || !ADMIN_PORT || !INBOUND_PORT) {
      throw new Error(
        'Missing required environment variables to initialize the agent',
      );
    }

    this.agentHost = AGENT_HOST;
    this.adminPort = parseInt(ADMIN_PORT);
    this.inboundPort = parseInt(INBOUND_PORT);
  }

  async agentInitialize(agentDto: AgentDto) {
    const { seed, network } = agentDto;

    try {
      const inboundPort = this.inboundPort;
      const adminPort = this.adminPort;
      // const agentId = uuidv4();
      const agentId = '401';
      const agentLabel = `agent-${agentId}`;
      const walletId = `wallet-${agentId}`;

      const endpoint = await connect(inboundPort);
      // const endpoint = `${this.agentHost}${inboundPort}`;

      const agentConfig = this.createAgentConfig(
        agentLabel,
        walletId,
        inboundPort,
        network,
        endpoint,
      );
      const agentWrapper = new AgentWrapper(
        agentId,
        adminPort,
        inboundPort,
        await agentConfig,
      );

      if (this.agent) {
        throw new HttpException(
          `An agent already initialized at port ${adminPort}. Agent endpoint: ${this.agent.config.endpoints}.`,
          HttpStatus.CONFLICT,
        );
      }
      await agentWrapper.initialize();
      const agent = agentWrapper.getAgent();

      this.setAgent(agent);

      const did = await this.didRegistration(agent, network, seed);

      this.logger.debug(
        `Agent initialized - ID: ${agentId}, Admin Port: ${adminPort}, Inbound Port: ${inboundPort}`,
      );
      this.logger.debug(
        `Agent endpoints: ${JSON.stringify(agent.config.endpoints)}`,
      );

      const agentDetails = { agentId, adminPort, inboundPort, did, endpoint };
      return {
        statusCode: HttpStatus.CREATED,
        message: 'Agent initialized successfully',
        data: agentDetails,
      };
    } catch (error: any) {
      this.logger.error(`Failed to initialize agent: ${error.message}`);
      throw new HttpException(
        `Agent initialization failed: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async createInvitation() {
    try {
      const createInvitationPayload = {
        autoAcceptConnection: true,
        multiUseInvitation: true,
      } as CreateOutOfBandInvitationConfig;

      const outOfBandRecord: OutOfBandRecord =
        (await this.agent?.oob.createInvitation(
          createInvitationPayload,
        )) as OutOfBandRecord;
      const invitationUrl = outOfBandRecord.outOfBandInvitation.toUrl({
        domain: this.agent?.config.endpoints[0] as string,
      });
      return {
        statusCode: HttpStatus.CREATED,
        message: 'Connection invitation created successfully!',
        data: { invitationUrl, outOfBandId: outOfBandRecord.id },
      };
    } catch (error) {
      throw error;
    }
  }

  async getConnectionById(id: string) {
    try {
      const connectionRecord = await this.agent?.connections.getById(id);
      if (!connectionRecord) {
        throw new NotFoundException(`Connection record with ID: ${id} not found`);
      }
      return connectionRecord;
    } catch (error) {
      throw error;
    }
  }

  async getConnectionState(id: string) {
    try {
      const connectionRecord = await this.agent?.connections.findAllByQuery({
        outOfBandId: id,
      });
      console.log(JSON.stringify(connectionRecord, null, 2));
      return {
        statusCode: HttpStatus.OK,
        message: 'Connection state fetched successfully!',
        data: {
          state: connectionRecord?.[0]?.state,
          connectionId: connectionRecord?.[0]?.id,
          theirLabel: connectionRecord?.[0]?.theirLabel,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  private async createAgentConfig(
    agentLabel: string,
    walletId: string,
    inboundPort: number,
    network: NetworkOptions,
    endpoint: string,
  ): Promise<CredoRestAgentConfig> {
    return {
      label: agentLabel,
      walletConfig: {
        id: walletId,
        key: `key-${walletId}`,
        // storage: {
        //   type: "postgres",
        //   config: {
        //     host: this.dbHost || "localhost:5432",
        //   },
        //   credentials: {
        //     account: this.dbUser || "postgres",
        //     password: this.dbPassword || "postgres",
        //   },
        // },
      },
      indyLedgers: [ledgerOptions[network] as IndyVdrPoolConfig],
      multiTenant: false,
      endpoints: [endpoint],
      autoAcceptConnections: false,
      autoAcceptCredentials: AutoAcceptCredential.ContentApproved,
      autoUpdateStorageOnStartup: true,
      autoAcceptProofs: AutoAcceptProof.ContentApproved,
      logLevel: LogLevel.debug,
      inboundTransports: [{ transport: 'http', port: inboundPort }],
      outboundTransports: ['http'],
    } satisfies CredoRestAgentConfig;
  }

  private async didRegistration(
    agent: Agent,
    network: NetworkOptions,
    seed: string,
  ): Promise<string> {
    try {
      this.logger.debug(`Registering DID for network: ${network}`);
      let did: string;
      if (network === NetworkOptions.BCOVRIN_TESTNET) {
        did = await this.registerBcovrinDid(agent, seed);
      } else if (network === NetworkOptions.INDICIO_TESTNET) {
        did = await this.registerIndicioDid(agent, seed);
      } else {
        throw new HttpException(
          `Unsupported network: ${network}`,
          HttpStatus.BAD_REQUEST,
        );
      }
      this.logger.debug('DID registration completed successfully');
      return did;
    } catch (error: any) {
      this.logger.error(`DID registration failed: ${error.message}`);
      throw new HttpException(
        `DID registration failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async registerBcovrinDid(
    agent: Agent,
    seed: string,
  ): Promise<string> {
    try {
      const response = await axios.post(NYM_URL.NYM_BCOVRIN_TESTNET, {
        role: 'ENDORSER',
        alias: 'Alias',
        seed: seed,
      });
      if (response.data && response.data.did) {
        const did = await this.importDid(
          agent,
          'bcovrin:testnet',
          response.data.did,
          seed,
        );
        return did;
      } else {
        throw new HttpException(
          'Invalid response from Bcovrin registration',
          HttpStatus.BAD_GATEWAY,
        );
      }
    } catch (error: any) {
      throw new HttpException(
        `Bcovrin DID registration failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async registerIndicioDid(
    agent: Agent,
    seed: string,
  ): Promise<string> {
    try {
      const indicioBody = await this.createIndicioKey(agent, seed);
      const response = await axios.post(
        NYM_URL.NYM_INDICIO_TESTNET,
        indicioBody,
      );
      if (response.data.statusCode === 200) {
        const did = await this.importDid(
          agent,
          'indicio:testnet',
          indicioBody.did,
          seed,
        );
        return did;
      } else {
        throw new HttpException(
          'Indicio DID registration failed',
          HttpStatus.BAD_GATEWAY,
        );
      }
    } catch (error: any) {
      throw new HttpException(
        `Indicio DID registration failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async importDid(
    agent: Agent,
    didMethod: string,
    did: string,
    seed: string,
  ): Promise<string> {
    await agent.dids.import({
      did: `did:indy:${didMethod}:${did}`,
      overwrite: true,
      privateKeys: [
        {
          keyType: KeyType.Ed25519,
          privateKey: TypedArrayEncoder.fromString(seed),
        },
      ],
    });
    return `did:indy:${didMethod}:${did}`;
  }

  private async createIndicioKey(agent: Agent, seed: string) {
    const key = await agent.wallet.createKey({
      privateKey: TypedArrayEncoder.fromString(seed),
      keyType: KeyType.Ed25519,
    });
    const buffer = TypedArrayEncoder.fromBase58(key.publicKeyBase58);
    const did = TypedArrayEncoder.toBase58(buffer.slice(0, 16));
    return {
      network: 'testnet',
      did,
      verkey: TypedArrayEncoder.toBase58(buffer),
    };
  }

  public async getAgent(): Promise<RestRootAgent> {
    if (!this.agent) {
      throw new BadRequestException('Agent is not initialized.');
    }
    return this.agent;
  }

  async setAgent(agent: RestRootAgent | RestRootAgentWithTenants) {
    this.agent = agent;
  }
}
