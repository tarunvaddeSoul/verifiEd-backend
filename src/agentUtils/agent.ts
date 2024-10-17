import type { AnonCredsRegistry } from "@credo-ts/anoncreds";
import type {
  Agent,
  AutoAcceptCredential,
  AutoAcceptProof,
} from "@credo-ts/core";
import type { IndyVdrPoolConfig } from "@credo-ts/indy-vdr";
import {
  AnonCredsCredentialFormatService,
  AnonCredsProofFormatService,
  V1CredentialProtocol,
  AnonCredsModule,
  LegacyIndyCredentialFormatService,
  LegacyIndyProofFormatService,
  V1ProofProtocol,
} from "@credo-ts/anoncreds";
import { AskarModule, AskarMultiWalletDatabaseScheme } from "@credo-ts/askar";
import {
  V2CredentialProtocol,
  V2ProofProtocol,
  ConnectionsModule,
  CredentialsModule,
  MediatorModule,
  ProofsModule,
  DidsModule,
  KeyDidRegistrar,
  JwkDidRegistrar,
  PeerDidRegistrar,
  WebDidResolver,
  KeyDidResolver,
  JwkDidResolver,
  PeerDidResolver,
  DifPresentationExchangeProofFormatService,
} from "@credo-ts/core";
import {
  IndyVdrAnonCredsRegistry,
  IndyVdrModule,
  IndyVdrIndyDidResolver,
  IndyVdrSovDidResolver,
  IndyVdrIndyDidRegistrar,
} from "@credo-ts/indy-vdr";
import { anoncreds } from "@hyperledger/anoncreds-nodejs";
import { ariesAskar } from "@hyperledger/aries-askar-nodejs";
import { indyVdr } from "@hyperledger/indy-vdr-nodejs";


export function getAgentModules(options: {
  autoAcceptConnections: boolean;
  autoAcceptProofs: AutoAcceptProof;
  autoAcceptCredentials: AutoAcceptCredential;
  autoAcceptMediationRequests: boolean;
  indyLedgers?: [IndyVdrPoolConfig, ...IndyVdrPoolConfig[]];
  extraAnonCredsRegistries?: AnonCredsRegistry[];
  multiTenant: boolean;
  baseUrl: string;
}) {
  const legacyIndyCredentialFormatService =
    new LegacyIndyCredentialFormatService();
  const legacyIndyProofFormatService = new LegacyIndyProofFormatService();

  const baseUrlWithoutSlash = options.baseUrl.endsWith("/")
    ? options.baseUrl.slice(0, -1)
    : options.baseUrl;

  const baseModules = {
    connections: new ConnectionsModule({
      autoAcceptConnections: options.autoAcceptConnections,
    }),
    proofs: new ProofsModule({
      autoAcceptProofs: options.autoAcceptProofs,
      proofProtocols: [
        new V1ProofProtocol({
          indyProofFormat: legacyIndyProofFormatService,
        }),
        new V2ProofProtocol({
          proofFormats: [
            legacyIndyProofFormatService,
            new AnonCredsProofFormatService(), new DifPresentationExchangeProofFormatService()
          ],
        }),
      ],
    }),
    credentials: new CredentialsModule({
      autoAcceptCredentials: options.autoAcceptCredentials,
      credentialProtocols: [
        new V1CredentialProtocol({
          indyCredentialFormat: legacyIndyCredentialFormatService,
        }),
        new V2CredentialProtocol({
          credentialFormats: [
            legacyIndyCredentialFormatService,
            new AnonCredsCredentialFormatService(),
          ],
        }),
      ],
    }),
    anoncreds: new AnonCredsModule({
      registries: [
        new IndyVdrAnonCredsRegistry()
      ],
      anoncreds,
    }),
    askar: new AskarModule({
      ariesAskar,
      multiWalletDatabaseScheme:
        AskarMultiWalletDatabaseScheme.ProfilePerWallet,
    }),
    mediator: new MediatorModule({
      autoAcceptMediationRequests: options.autoAcceptMediationRequests,
    }),
    dids: new DidsModule({
      registrars: [
        new KeyDidRegistrar(),
        new JwkDidRegistrar(),
        new PeerDidRegistrar(),
      ],
      resolvers: [
        new WebDidResolver(),
        new KeyDidResolver(),
        new JwkDidResolver(),
        new PeerDidResolver(),
      ],
    }),
  } as const;

  const modules: typeof baseModules & {
    // tenants?: TenantsModule<typeof baseModules>;
    indyVdr?: IndyVdrModule;
  } = baseModules;


  // Register indy module and related resolvers/registrars
  if (options.indyLedgers) {
    modules.indyVdr = new IndyVdrModule({
      indyVdr,
      networks: options.indyLedgers,
    });
    modules.dids.config.addRegistrar(new IndyVdrIndyDidRegistrar());
    modules.dids.config.addResolver(new IndyVdrIndyDidResolver());
    modules.dids.config.addResolver(new IndyVdrSovDidResolver());
    modules.anoncreds.config.registries.push(new IndyVdrAnonCredsRegistry());
  }

  return modules;
}
