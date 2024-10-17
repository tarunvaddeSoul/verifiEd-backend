import { Body, Controller, Get, Param, Post, Res, HttpException, HttpStatus, UsePipes, ValidationPipe } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { VerificationService } from "./verification.service";
import { VerifyCourseCredentialDto } from "../dtos/VerifyCourseCredential.dto";
import { Response } from 'express';
import { Logger } from '@nestjs/common';

@ApiTags('Verification')
@Controller('verification')
export class VerificationController {
  private readonly logger = new Logger(VerificationController.name);

  constructor(private readonly verificationService: VerificationService) {}

  @Post('verify-student-access-card/connectionId/:connectionId')
  @ApiOperation({ summary: 'Verify Student Access Card' })
  @ApiResponse({ status: 201, description: 'Proof request initiated successfully (OOB)' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async verifyStudentAccessCard(@Param('connectionId') connectionId: string, @Res() res: Response) {
    this.logger.log(`Verifying Student Access Card for connectionId: ${connectionId}`);
    try {
      const result = await this.verificationService.verifyStudentAccessCard(connectionId);
      return res.status(HttpStatus.CREATED).json(result); // Send a 201 response
    } catch (error: any) {
      this.logger.error(`Failed to verify Student Access Card: ${error.message}`);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('verify-phc/connectionId/:connectionId')
  @ApiOperation({ summary: 'Verify Personhood Credential' })
  @ApiResponse({ status: 201, description: 'Proof request initiated successfully (OOB)' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async verifyPHC(@Param('connectionId') connectionId: string, @Res() res: Response) {
    this.logger.log('Verifying Personhood Credential');
    try {
      const result = await this.verificationService.verifyPHC(connectionId);
      return res.status(HttpStatus.CREATED).json(result); // Send a 201 response
    } catch (error: any) {
      this.logger.error(`Failed to verify Personhood Credential: ${error.message}`);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('verify/:courseTag')
  @ApiOperation({ summary: 'Verify Course Credential' })
  @ApiResponse({ status: 201, description: 'Course Credential verified successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async verifyCourseCredential(
    @Param('courseTag') courseTag: string,
    @Body() verifyCourseCredentialDto: VerifyCourseCredentialDto,
    @Res() res: Response
  ) {
    const { connectionId } = verifyCourseCredentialDto;
    this.logger.log(`Verifying Course Credential for connectionId: ${connectionId} and courseTag: ${courseTag}`);
    try {
      const result = await this.verificationService.verifyCourseCredential(connectionId, courseTag);
      return res.status(HttpStatus.CREATED).json(result); 
    } catch (error: any) {
      this.logger.error(`Failed to verify Course Credential: ${error.message}`);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('bank-verification/ifsc/:ifsc/accountNumber/:accountNumber')
  async bankVerification(@Param('ifsc') ifsc: string, @Param('accountNumber') accountNumber: string, @Res() res: Response) {
    this.logger.log(`Verifying bank: IFSC: ${ifsc} and Account Number: ${accountNumber}`);
    try {
      const result = await this.verificationService.bankVerification(ifsc, accountNumber);
      return res.status(HttpStatus.CREATED).json(result); 
    } catch (error: any) {
      this.logger.error(`Failed to verify bank account: ${error.message}`);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('check-performance/connectionId/:connectionId')
  @ApiOperation({ summary: 'Check Performance' })
  @ApiResponse({ status: 200, description: 'Performance checked successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async checkPerformance(@Param('connectionId') connectionId: string, @Res() res: Response) {
    this.logger.log(`Checking performance for connectionId: ${connectionId}`);
    try {
      const result = await this.verificationService.checkPerformance(connectionId);
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      this.logger.error(`Failed to check performance: ${error.message}`);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('skills/connectionId/:connectionId')
  async getSkills(@Param('connectionId') connectionId: string, @Res() res: Response) {
    try {
      const result = await this.verificationService.getSkills(connectionId);
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      this.logger.error(`Failed to check skills: ${error.message}`);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('requested-data/id/:id')
  @ApiOperation({ summary: 'Get Requested Data' })
  @ApiResponse({ status: 200, description: 'Requested data fetched successfully' })
  @ApiResponse({ status: 404, description: 'Data not found' })
  async getRequestedData(@Param('id') id: string, @Res() res: Response) {
    this.logger.log(`Fetching requested data for ID: ${id}`);
    try {
      const result = await this.verificationService.getRequestedData(id);
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      this.logger.error(`Failed to fetch requested data: ${error.message}`);
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  @Get('verification-state/id/:id')
  @ApiOperation({ summary: 'Get Verification State' })
  @ApiResponse({ status: 200, description: 'Verification state fetched successfully' })
  @ApiResponse({ status: 404, description: 'Verification state not found' })
  async getVerificationState(@Param('id') id: string, @Res() res: Response) {
    this.logger.log(`Fetching verification state for ID: ${id}`);
    try {
      const result = await this.verificationService.getVerificationState(id);
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      this.logger.error(`Failed to fetch verification state: ${error.message}`);
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }
}
