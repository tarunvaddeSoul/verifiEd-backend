import {
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { PhcRepository } from './phc.repository';
import { Prisma, PHC } from '@prisma/client';
import { PhcDto } from '../dtos/phc.dto';
import { PhcUpdateDto } from '../dtos/phc-update.dto';

@Injectable()
export class PhcService {
  constructor(private readonly phcRepository: PhcRepository) {}

  async createPHC(data: PhcDto): Promise<PHC> {
    try {
      return await this.phcRepository.createPHC(data);
    } catch (error) {
      throw new HttpException('Failed to create PHC', HttpStatus.BAD_REQUEST);
    }
  }

  async findPHCByLabel(theirLabel: string): Promise<PHC | null> {
    try {
      const phc = await this.phcRepository.findByTheirLabel(theirLabel);
      if (!phc) {
        throw new HttpException('PHC not found', HttpStatus.NOT_FOUND);
      }
      return phc;
    } catch (error) {
      throw new HttpException('Error fetching PHC', HttpStatus.NOT_FOUND);
    }
  }

  async checkAndIssuePHC(
    theirLabel: string,
  ): Promise<{ statusCode: number; message: string; data: any }> {
    try {
      // Fetch the PHC record based on theirLabel
      const phc = await this.phcRepository.findByTheirLabel(theirLabel);

      // Get the current Unix timestamp (seconds since epoch)
      const currentTimestamp = Math.floor(Date.now() / 1000);

      // If PHC does not exist, respond that a new PHC needs to be issued
      if (!phc) {
        return {
          statusCode: 200,
          message: 'No PHC found. New PHC needs to be issued.',
          data: { shouldIssueNewPHC: true },
        };
      }

      // Check if the stored expiry has passed (i.e., PHC has expired)
      if (currentTimestamp > Number(phc.expiry)) {
        return {
          statusCode: 200,
          message: 'PHC has expired. New PHC needs to be issued.',
          data: { shouldIssueNewPHC: true },
        };
      }

      // If PHC exists and has not expired, return that no new PHC is needed
      return {
        statusCode: 200,
        message: 'PHC is valid. No new PHC needs to be issued.',
        data: { shouldIssueNewPHC: false, phc },
      };
    } catch (error) {
      throw error;
    }
  }

  async getAllPHCs(): Promise<PHC[]> {
    try {
      return await this.phcRepository.getAllPHCs();
    } catch (error) {
      throw new HttpException(
        'Error fetching PHCs',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updatePHC(theirLabel: string, data: PhcUpdateDto): Promise<PHC> {
    try {
      return await this.phcRepository.updatePHC(theirLabel, data);
    } catch (error) {
      throw new HttpException('PHC not found', HttpStatus.NOT_FOUND);
    }
  }

  async deletePHC(theirLabel: string): Promise<void> {
    try {
      await this.phcRepository.deletePHC(theirLabel);
    } catch (error) {
      throw new HttpException('PHC not found', HttpStatus.NOT_FOUND);
    }
  }
}
