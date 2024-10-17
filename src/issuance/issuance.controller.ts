import { Body, Controller, Get, Param, Post, Res, HttpException, HttpStatus, UsePipes, ValidationPipe } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { IssuanceService } from "./issuance.service";
import { IssueCourseCredentialDto } from "../dtos/IssueCourseCredential.dto";
import { Response } from 'express';
import { Logger } from '@nestjs/common';

@ApiTags('Issuance')
@Controller('issuance')
export class IssuanceController {
  private readonly logger = new Logger(IssuanceController.name);

  constructor(private readonly issuanceService: IssuanceService) {}

  @Post('issue-phc/name/:name/expiry/:expiry/verificationMethod/:verificationMethod/connectionId/:connectionId')
  @ApiOperation({ summary: 'Issue Personhood Credential' })
  @ApiResponse({ status: 201, description: 'Credential offer created successfully (OOB)' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async issuePHC(@Param('name') name: string, @Param('expiry') expiry: string, @Param('verificationMethod') verificationMethod: string, @Param('connectionId') connectionId: string, @Res() res: Response) {
    this.logger.log(`Issuing Personhood Credential for name: ${name}`);
    try {
      const result = await this.issuanceService.issuePHC(name, expiry, verificationMethod, connectionId);
      return res.status(HttpStatus.CREATED).json(result); // Send a 201 response
    } catch (error: any) {
      this.logger.error(`Failed to issue Personhood Credential: ${error.message}`);
      throw new HttpException(error.message || 'Failed to issue Personhood Credential', HttpStatus.BAD_REQUEST);
    }
  }

  @Post('issue-student-access-card/name/:name')
  @ApiOperation({ summary: 'Issue Student Access Card' })
  @ApiResponse({ status: 201, description: 'Credential offer created successfully (OOB)' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async issueStudentAccessCard(@Param('name') name: string, @Res() res: Response) {
    this.logger.log(`Issuing Student Access Card for name: ${name}`);
    try {
      const result = await this.issuanceService.issueStudentAccessCard(name);
      return res.status(HttpStatus.CREATED).json(result); // Send a 201 response
    } catch (error: any) {
      this.logger.error(`Failed to issue Student Access Card: ${error.message}`);
      throw new HttpException(error.message || 'Failed to issue Student Access Card', HttpStatus.BAD_REQUEST);
    }
  }

  @Post('issue/:courseTag')
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Issue Course Credential' })
  @ApiResponse({ status: 201, description: 'Course Credential issued successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async issueCourseCredential(
    @Param('courseTag') courseTag: string,
    @Body() issueCourseCredentialDto: IssueCourseCredentialDto,
    @Res() res: Response
  ) {
    const { name, marks, connectionId } = issueCourseCredentialDto;
    this.logger.log(`Issuing Course Credential for name: ${name}, courseTag: ${courseTag}, connectionId: ${connectionId}`);
    try {
      const result = await this.issuanceService.issueCourseCredential(name, marks, courseTag, connectionId);
      return res.status(HttpStatus.CREATED).json(result);
    } catch (error: any) {
      this.logger.error(`Failed to issue Course Credential: ${error.message}`);
      throw new HttpException(error.message || 'Failed to issue Course Credential', HttpStatus.BAD_REQUEST);
    }
  }

  @Get('credential-state/id/:id')
  @ApiOperation({ summary: 'Get Credential State' })
  @ApiResponse({ status: 200, description: 'Credential state fetched successfully' })
  @ApiResponse({ status: 404, description: 'Credential state not found' })
  async getCredentialState(@Param('id') id: string, @Res() res: Response) {
    this.logger.log(`Fetching credential state for ID: ${id}`);
    try {
      const result = await this.issuanceService.getCredentialState(id);
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      this.logger.error(`Failed to fetch credential state: ${error.message}`);
      throw new HttpException(error.message || 'Credential state not found', HttpStatus.NOT_FOUND);
    }
  }

  @Get('credential-definitions')
  @ApiOperation({ summary: 'Retrieve All Credential Definitions' })
  @ApiResponse({ status: 200, description: 'List of credential definitions returned successfully' })
  async getAllCredentialDefinitions(@Res() res: Response) {
    this.logger.log('Fetching all credential definitions');
    try {
      const result = await this.issuanceService.getAllCredentialDefinitions();
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      this.logger.error(`Failed to fetch credential definitions: ${error.message}`);
      throw new HttpException(error.message || 'Failed to fetch credential definitions', HttpStatus.BAD_REQUEST);
    }
  }

  @Get('credential-definitions/tag/:tag')
  @ApiOperation({ summary: 'Retrieve Credential Definition by Tag' })
  @ApiResponse({ status: 200, description: 'Credential definition returned successfully' })
  @ApiResponse({ status: 404, description: 'Credential definition not found' })
  async getCredentialDefinitionByTag(@Param('tag') tag: string, @Res() res: Response) {
    this.logger.log(`Fetching credential definition for tag: ${tag}`);
    try {
      const result = await this.issuanceService.getCredentialDefinitionByTag(tag);
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      this.logger.error(`Failed to fetch credential definition by tag: ${error.message}`);
      throw new HttpException(error.message || 'Credential definition not found', HttpStatus.NOT_FOUND);
    }
  }
}
