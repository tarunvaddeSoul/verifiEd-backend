import {
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AgentService } from '../agent.service';
import {
  RestRootAgent,
  RestRootAgentWithTenants,
} from '@credo-ts/rest/build/utils/agent';
import {
  Agent,
  AutoAcceptCredential,
  AutoAcceptProof,
  CreateOutOfBandInvitationConfig,
  OutOfBandRecord,
} from '@credo-ts/core';
import {
  AnonCredsCredentialDefinitionRecord,
  parseIndyCredentialDefinitionId,
  getUnqualifiedCredentialDefinitionId,
} from '@credo-ts/anoncreds';
import * as turl from 'turl';

@Injectable()
export class IssuanceService {
  constructor(
    private readonly agentService: AgentService,
    private logger: Logger,
  ) {}

  public async getAgent(): Promise<RestRootAgent | RestRootAgentWithTenants> {
    return await this.agentService.getAgent();
  }

  async getAllCredentialDefinitions() {
    try {
      const agent = (await this.getAgent()) as Agent;

      if (!agent.modules || !agent.modules.anoncreds) {
        throw new Error('Agent modules or anoncreds module not available.');
      }

      const credentialDefinitions =
        await agent?.modules.anoncreds.getCreatedCredentialDefinitions({});
      if (credentialDefinitions.length == 0) {
        throw new NotFoundException(`Credential definitions not found.`);
      }
      return credentialDefinitions;
    } catch (error) {
      throw error;
    }
  }

  public async getCredentialDefinitionByTag(tag: string) {
    try {
      const agent = (await this.getAgent()) as Agent;

      const credentialDefinitions: AnonCredsCredentialDefinitionRecord[] =
        await agent?.modules.anoncreds.getCreatedCredentialDefinitions({});
      if (credentialDefinitions.length == 0) {
        throw new NotFoundException(`Credential definitions not found.`);
      }
      const credentialDefinition = credentialDefinitions.find(
        (x) => x.credentialDefinition.tag === tag,
      );
      if (!credentialDefinition) {
        throw new NotFoundException(`Credential definition not found.`);
      }
      return credentialDefinition;
    } catch (error) {
      throw error;
    }
  }

  async issuePHC(
    name: string,
    expiry: string,
    verificationMethod: string,
    connectionId: string,
  ) {
    try {
      const agent = (await this.getAgent()) as Agent;

      const credentialDefinition = await this.getCredentialDefinitionByTag(
        'PHC Credential V2',
      );
      const indyCredDefId = parseIndyCredentialDefinitionId(
        credentialDefinition.credentialDefinitionId,
      );
      const getCredentialDefinitionId =
        await getUnqualifiedCredentialDefinitionId(
          indyCredDefId.namespaceIdentifier,
          indyCredDefId.schemaSeqNo,
          indyCredDefId.tag,
        );

      const issuePHCResponse = await agent?.credentials.offerCredential({
        protocolVersion: 'v2' as never,
        autoAcceptCredential: AutoAcceptCredential.Always,
        connectionId,
        credentialFormats: {
          anoncreds: {
            credentialDefinitionId: `${getCredentialDefinitionId}`,
            attributes: [
              {
                name: 'Name',
                mimeType: 'text/plain',
                value: name,
              },
              {
                name: 'Issued By',
                mimeType: 'text/plain',
                value: 'VerifiEd',
              },
              {
                name: 'Expiry',
                mimeType: 'text/plain',
                value: expiry,
              },
              {
                name: 'Verification Method',
                mimeType: 'text/plain',
                value: verificationMethod,
              },
            ],
          },
        },
      });

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Credential offer created successfully',
        data: {
          credentialRecord: issuePHCResponse,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async issueStudentAccessCard(name: string) {
    try {
      const agent = (await this.getAgent()) as Agent;

      const credentialDefinition = await this.getCredentialDefinitionByTag(
        'Student Access Card',
      );
      const indyCredDefId = parseIndyCredentialDefinitionId(
        credentialDefinition.credentialDefinitionId,
      );
      const getCredentialDefinitionId =
        await getUnqualifiedCredentialDefinitionId(
          indyCredDefId.namespaceIdentifier,
          indyCredDefId.schemaSeqNo,
          indyCredDefId.tag,
        );
      const currentTimeInSeconds = Math.floor(Date.now() / 1000); // Current time in seconds
      const expiryTimeInSeconds = currentTimeInSeconds + 60 * 60 * 60; // Adding 60 minutes (3600 seconds)
      const ID = Math.floor(1000 + Math.random() * 9000).toString();

      const issueStudentAccessCardResponse =
        await agent?.credentials.createOffer({
          protocolVersion: 'v2' as never,
          autoAcceptCredential: AutoAcceptCredential.Always,
          credentialFormats: {
            anoncreds: {
              credentialDefinitionId: `${getCredentialDefinitionId}`,
              attributes: [
                {
                  name: 'Name',
                  mimeType: 'text/plain',
                  value: name,
                },
                {
                  name: 'ID',
                  mimeType: 'text/plain',
                  value: ID,
                },
                {
                  name: 'Expiry',
                  mimeType: 'text/plain',
                  value: expiryTimeInSeconds.toString(),
                },
              ],
            },
          },
          comment: 'string',
        });
      const message = issueStudentAccessCardResponse?.message;

      const createInvitationPayload = {
        autoAcceptConnection: true,
        messages: [message],
      } as CreateOutOfBandInvitationConfig;

      const outOfBandRecord: OutOfBandRecord =
        (await agent?.oob.createInvitation(
          createInvitationPayload,
        )) as OutOfBandRecord;
      const invitationUrl = outOfBandRecord.outOfBandInvitation.toUrl({
        domain: agent?.config.endpoints[0] as string,
      });

      const shortUrl = turl
        .shorten(invitationUrl)
        .then((res) => res)
        .catch((err) => {
          this.logger.error(err);
        });

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Credential offer created successfully (OOB)',
        data: {
          credentialUrl: await shortUrl,
          credentialRecord: issueStudentAccessCardResponse?.credentialRecord,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async issueCourseCredential(
    name: string,
    marks: string,
    courseTag: string,
    connectionId: string,
  ) {
    try {
      const agent = (await this.getAgent()) as Agent;

      const credentialDefinition = await this.getCredentialDefinitionByTag(
        courseTag,
      );
      const indyCredDefId = parseIndyCredentialDefinitionId(
        credentialDefinition.credentialDefinitionId,
      );
      const getCredentialDefinitionId =
        await getUnqualifiedCredentialDefinitionId(
          indyCredDefId.namespaceIdentifier,
          indyCredDefId.schemaSeqNo,
          indyCredDefId.tag,
        );
      const timestamp = Math.floor(Date.now() / 1000); // Current time in epoch

      const courseCredentialResponse = await agent?.credentials.offerCredential(
        {
          protocolVersion: 'v2' as never,
          autoAcceptCredential: AutoAcceptCredential.Always,
          connectionId,
          credentialFormats: {
            anoncreds: {
              credentialDefinitionId: `${getCredentialDefinitionId}`,
              attributes: [
                {
                  name: 'Student Name',
                  mimeType: 'text/plain',
                  value: name,
                },
                {
                  name: 'Marks Scored',
                  mimeType: 'text/plain',
                  value: marks,
                },
                {
                  name: 'Timestamp',
                  mimeType: 'text/plain',
                  value: timestamp.toString(),
                },
                {
                  name: 'Course Name',
                  mimeType: 'text/plain',
                  value: courseTag,
                },
              ],
            },
          },
          comment: `Issuing ${courseTag} Credential`,
        },
      );

      return {
        statusCode: HttpStatus.CREATED,
        message: `Credential for ${courseTag} issued successfully`,
        data: {
          credentialRecord: courseCredentialResponse,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async getCredentialState(id: string) {
    try {
      const agent = (await this.getAgent()) as Agent;
      const credentialRecord = await agent?.credentials.getById(id);
      const state = credentialRecord?.state;
      return {
        statusCode: HttpStatus.OK,
        message: 'Credential state fetched successfully',
        data: {
          state,
          errorMessage: credentialRecord?.errorMessage,
        },
      };
    } catch (error) {
      throw error;
    }
  }
}
