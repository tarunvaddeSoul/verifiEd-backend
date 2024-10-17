import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { PhcService } from './phc.service';
import { PhcDto } from '../dtos/phc.dto';
import { PhcUpdateDto } from '../dtos/phc-update.dto';

@ApiTags('PHC')
@Controller('phc')
export class PhcController {
  constructor(private readonly phcService: PhcService) {}

  @ApiOperation({ summary: 'Create a new PHC' })
  @ApiResponse({ status: 201, description: 'PHC created successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @Post()
  async createPHC(@Body() body: PhcDto) {
    try {
      const phc = await this.phcService.createPHC(body);
      return {
        statusCode: HttpStatus.CREATED,
        data: phc,
        message: 'PHC created successfully',
      };
    } catch (error) {
      throw new HttpException(
        { statusCode: HttpStatus.BAD_REQUEST, message: 'Failed to create PHC' },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('check-and-issue/theirLabel/:theirLabel')
  async checkAndIssuePHC(@Param('theirLabel') theirLabel: string) {
    try {
      return await this.phcService.checkAndIssuePHC(theirLabel);
    } catch (error) {
      throw new HttpException(
        { statusCode: HttpStatus.BAD_REQUEST, message: 'Failed to check PHC' },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @ApiOperation({ summary: 'Fetch a PHC by theirLabel' })
  @ApiResponse({ status: 200, description: 'PHC fetched successfully.' })
  @ApiResponse({ status: 404, description: 'PHC not found.' })
  @Get(':theirLabel')
  async findPHCByLabel(@Param('theirLabel') theirLabel: string) {
    const phc = await this.phcService.findPHCByLabel(theirLabel);
    if (!phc) {
      throw new HttpException(
        { statusCode: HttpStatus.NOT_FOUND, message: 'PHC not found' },
        HttpStatus.NOT_FOUND,
      );
    }
    return {
      statusCode: HttpStatus.OK,
      data: phc,
      message: 'PHC fetched successfully',
    };
  }

  @ApiOperation({ summary: 'Fetch all PHCs' })
  @ApiResponse({ status: 200, description: 'List of all PHCs.' })
  @Get()
  async getAllPHCs() {
    const phcs = await this.phcService.getAllPHCs();
    return {
      statusCode: HttpStatus.OK,
      data: phcs,
      message: 'PHCs fetched successfully',
    };
  }

  @ApiOperation({ summary: 'Update a PHC by theirLabel' })
  @ApiResponse({ status: 200, description: 'PHC updated successfully.' })
  @ApiResponse({ status: 404, description: 'PHC not found.' })
  @Patch(':theirLabel')
  async updatePHC(
    @Param('theirLabel') theirLabel: string,
    @Body() body: PhcUpdateDto,
  ) {
    try {
      const updatedPHC = await this.phcService.updatePHC(theirLabel, body);
      return {
        statusCode: HttpStatus.OK,
        data: updatedPHC,
        message: 'PHC updated successfully',
      };
    } catch (error) {
      throw new HttpException(
        { statusCode: HttpStatus.NOT_FOUND, message: 'PHC not found' },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @ApiOperation({ summary: 'Delete a PHC by theirLabel' })
  @ApiResponse({ status: 200, description: 'PHC deleted successfully.' })
  @ApiResponse({ status: 404, description: 'PHC not found.' })
  @Delete(':theirLabel')
  async deletePHC(@Param('theirLabel') theirLabel: string) {
    try {
      await this.phcService.deletePHC(theirLabel);
      return {
        statusCode: HttpStatus.OK,
        message: 'PHC deleted successfully',
      };
    } catch (error) {
      throw new HttpException(
        { statusCode: HttpStatus.NOT_FOUND, message: 'PHC not found' },
        HttpStatus.NOT_FOUND,
      );
    }
  }
}
