import {
  RestRootAgent,
  RestRootAgentWithTenants,
} from '@credo-ts/rest/build/utils/agent';
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { AgentService } from '../agent.service';
import {
  Agent,
  AutoAcceptProof,
  CreateOutOfBandInvitationConfig,
  OutOfBandRecord,
} from '@credo-ts/core';
import {
  parseIndyCredentialDefinitionId,
  getUnqualifiedCredentialDefinitionId,
} from '@credo-ts/anoncreds';
import { IssuanceService } from '../issuance/issuance.service';
import axios from 'axios';

@Injectable()
export class VerificationService {
  constructor(
    private readonly agentService: AgentService,
    private logger: Logger,
    private readonly issuanceService: IssuanceService,
  ) {}

  public async getAgent(): Promise<RestRootAgent | RestRootAgentWithTenants> {
    return await this.agentService.getAgent();
  }

  async verifyCourseCredential(connectionId: string, courseTag: string) {
    try {
      const agent = (await this.getAgent()) as Agent;

      const credentialDefinition =
        await this.issuanceService.getCredentialDefinitionByTag(courseTag);
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

      const verifyCourseResponse = await agent.proofs.requestProof({
        autoAcceptProof: AutoAcceptProof.Always,
        comment: `Verifying ${courseTag} Credential`,
        willConfirm: true,
        protocolVersion: 'v2',
        connectionId: connectionId,
        proofFormats: {
          anoncreds: {
            name: `Validating ${courseTag} Credential`,
            version: '1.0',
            requested_predicates: {
              'Validating timestamp': {
                name: 'Timestamp',
                p_type: '<=',
                p_value: currentTimeInSeconds,
                restrictions: [
                  {
                    cred_def_id: `${getCredentialDefinitionId}`,
                  },
                ],
              },
            },
          },
        },
      });

      return {
        statusCode: HttpStatus.CREATED,
        message: `Proof request for ${courseTag} initiated successfully`,
        data: {
          proofRecord: verifyCourseResponse,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async verifyStudentAccessCard(connectionId: string) {
    try {
      const agent = (await this.getAgent()) as Agent;

      const credentialDefinition =
        await this.issuanceService.getCredentialDefinitionByTag(
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
      const verifyPHCResponse = await agent.proofs.requestProof({
        autoAcceptProof: AutoAcceptProof.Always,
        comment: 'string',
        willConfirm: true,
        protocolVersion: 'v2',
        connectionId: connectionId,
        proofFormats: {
          anoncreds: {
            name: 'Validating Student Access Card',
            version: '1.0',
            requested_predicates: {
              'Validating expiration': {
                name: 'Expiry',
                p_type: '>',
                p_value: currentTimeInSeconds,
                restrictions: [
                  {
                    cred_def_id: `${getCredentialDefinitionId}`,
                  },
                ],
              },
            },
          },
        },
      });

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Proof request initiated successfully (OOB)',
        data: {
          proofRecord: verifyPHCResponse,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async verifyPHC(connectionId: string) {
    try {
      const agent = (await this.getAgent()) as Agent;

      const credentialDefinition =
        await this.issuanceService.getCredentialDefinitionByTag(
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
      const currentTimeInSeconds = Math.floor(Date.now() / 1000); // Current time in seconds
      const verifyPHCResponse = await agent.proofs.requestProof({
        autoAcceptProof: AutoAcceptProof.Always,
        comment: 'string',
        willConfirm: true,
        protocolVersion: 'v2',
        connectionId,
        proofFormats: {
          anoncreds: {
            name: 'Validating PHC',
            version: '1.0',
            requested_predicates: {
              'Validating expiration': {
                name: 'Expiry',
                p_type: '>',
                p_value: currentTimeInSeconds,
                restrictions: [
                  {
                    cred_def_id: `${getCredentialDefinitionId}`,
                  },
                ],
              },
            },
          },
        },
      });

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Proof request initiated successfully (OOB)',
        data: {
          proofRecord: verifyPHCResponse,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async getVerificationState(id: string) {
    try {
      const agent = (await this.getAgent()) as Agent;

      const verificationRecord = await agent.proofs.getById(id);
      const state = verificationRecord?.state;
      return {
        statusCode: HttpStatus.OK,
        message: 'Verification state fetched successfully',
        data: {
          state,
          verified: verificationRecord?.isVerified,
          errorMessage: verificationRecord?.errorMessage,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async getRequestedData(id: string) {
    try {
      const agent = (await this.getAgent()) as Agent;

      const data = (await agent?.proofs.getFormatData(id)) as any;
      return {
        statusCode: HttpStatus.OK,
        message: 'Requested data fetched successfully!',
        data: {
          requestedProof: data?.presentation?.anoncreds?.requested_proof,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async checkPerformance(connectionId: string) {
    try {
      const agent = (await this.getAgent()) as Agent;

      const proofResponse = await agent?.proofs.requestProof({
        autoAcceptProof: AutoAcceptProof.Always,
        comment: 'string',
        willConfirm: true,
        protocolVersion: 'v2',
        proofFormats: {
          anoncreds: {
            name: 'Requesting Marks',
            version: '1.0',
            requested_attributes: {
              'Requesting Marks of Module 1': {
                name: 'Marks Scored',
                restrictions: [
                  {
                    cred_def_id:
                      'JM9L6HL2QCexjbn9WB46h9:3:CL:2286400:Introduction to SSI V2',
                  },
                ],
              },
              'Requesting Marks of Module 2': {
                name: 'Marks Scored',
                restrictions: [
                  {
                    cred_def_id:
                      'JM9L6HL2QCexjbn9WB46h9:3:CL:2286411:Digital Identity Fundamentals V2',
                  },
                ],
              },
              'Requesting Marks of Module 3': {
                name: 'Marks Scored',
                restrictions: [
                  {
                    cred_def_id:
                      'JM9L6HL2QCexjbn9WB46h9:3:CL:2286422:Blockchain and SSI V2',
                  },
                ],
              },
              'Requesting Marks of Module 4': {
                name: 'Marks Scored',
                restrictions: [
                  {
                    cred_def_id:
                      'JM9L6HL2QCexjbn9WB46h9:3:CL:2286427:Privacy and Security in SSI V2',
                  },
                ],
              },
              'Requesting Marks of Module 5': {
                name: 'Marks Scored',
                restrictions: [
                  {
                    cred_def_id:
                      'JM9L6HL2QCexjbn9WB46h9:3:CL:2286438:Implementing SSI Solutions V2',
                  },
                ],
              },
            },
          },
        },
        connectionId,
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Proof requested successfully!',
        data: { proofRecord: proofResponse },
      };
    } catch (error) {
      throw error;
    }
  }

  async getSkills(connectionId: string) {
    try {
      const agent = (await this.getAgent()) as Agent;
      const proofRecord = await agent.proofs.requestProof({
        autoAcceptProof: AutoAcceptProof.Always,
        comment: 'string',
        willConfirm: true,
        protocolVersion: 'v2',
        proofFormats: {
          anoncreds: {
            name: 'Requesting Course Details',
            version: '1.0',
            requested_attributes: {
              'Requesting Course Details of Module 1': {
                names: ['Course Name', 'Timestamp'],
                restrictions: [
                  {
                    cred_def_id:
                      'JM9L6HL2QCexjbn9WB46h9:3:CL:2286400:Introduction to SSI V2',
                  },
                ],
              },
              'Requesting Course Details of Module 2': {
                names: ['Course Name', 'Timestamp'],
                restrictions: [
                  {
                    cred_def_id:
                      'JM9L6HL2QCexjbn9WB46h9:3:CL:2286411:Digital Identity Fundamentals V2',
                  },
                ],
              },
              'Requesting Course Details of Module 3': {
                names: ['Course Name', 'Timestamp'],
                restrictions: [
                  {
                    cred_def_id:
                      'JM9L6HL2QCexjbn9WB46h9:3:CL:2286422:Blockchain and SSI V2',
                  },
                ],
              },
              'Requesting Course Details of Module 4': {
                names: ['Course Name', 'Timestamp'],
                restrictions: [
                  {
                    cred_def_id:
                      'JM9L6HL2QCexjbn9WB46h9:3:CL:2286427:Privacy and Security in SSI V2',
                  },
                ],
              },
              'Requesting Course Details of Module 5': {
                names: ['Course Name', 'Timestamp'],
                restrictions: [
                  {
                    cred_def_id:
                      'JM9L6HL2QCexjbn9WB46h9:3:CL:2286438:Implementing SSI Solutions V2',
                  },
                ],
              },
            },
          },
        },
        connectionId,
      });
      return {
        statusCode: HttpStatus.OK,
        message: 'Proof requested successfully!',
        data: {
          proofRecord,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async bankVerification(ifsc: string, accountNumber: string) {
    try {
      const bankVerificationResponse = await axios.post(
        'https://api.trential.app/verification/api/1.0/verifications/bank-account',
        {
          ifsc,
          accountNumber,
          pennyLess: true,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'x-api-key': `${process.env.TRENTIAL_API_KEY}`,
          },
        },
      );
      return bankVerificationResponse.data;
    } catch (error: any) {
      throw new BadRequestException(
        'Error verifying bank account ',
        error.response?.data?.message || error.message,
      );
    }
  }
}
