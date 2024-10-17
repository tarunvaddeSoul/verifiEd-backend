import { Body, Controller, Get, Param, Post, Res, HttpException, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AgentService } from './agent.service';
import { AgentDto } from './dtos/agent.dto';
import { Response } from 'express'; // Import Response type
import { Logger } from '@nestjs/common'; // Logger for logging requests and errors

@ApiTags('Agent')
@Controller('agent')
export class AgentController {
  private readonly logger = new Logger(AgentController.name); // Initialize logger

  constructor(private readonly agentService: AgentService) {}

  @Post('spinup')
  @ApiOperation({ summary: 'Spin up a new agent with given seed and network' })
  @ApiResponse({ status: 201, description: 'Agent successfully initialized' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async agentInitialize(@Body() agentDto: AgentDto, @Res() res: Response) {
    this.logger.log(`Initializing agent with data: ${JSON.stringify(agentDto)}`);
    try {
      const result = await this.agentService.agentInitialize(agentDto);
      return res.status(HttpStatus.CREATED).json(result); // Send a 201 response
    } catch (error) {
      this.logger.error(`Failed to initialize agent: ${JSON.stringify(error)}`);
      const message = (error instanceof Error) ? error.message : 'Failed to initialize agent';
      throw new HttpException(message, HttpStatus.BAD_REQUEST); // Throw a 400 error with the message
    }
  }

  @Post('create-invitation')
  @ApiOperation({ summary: 'Create an invitation for a new connection' })
  @ApiResponse({ status: 201, description: 'Invitation created successfully' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async createInvitation(@Res() res: Response) {
    this.logger.log(`Creating invitation`);
    try {
      const result = await this.agentService.createInvitation();
      return res.status(HttpStatus.CREATED).json(result); // Send a 201 response
    } catch (error) {
      this.logger.error(`Failed to create invitation: ${JSON.stringify(error)}`);
      const message = (error instanceof Error) ? error.message : 'Failed to create invitation';
      throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR); // Throw a 500 error with the message
    }
  }

  @Get('connection-state/id/:id')
  @ApiOperation({ summary: 'Get the connection state of an agent by ID' })
  @ApiResponse({ status: 200, description: 'Connection state fetched successfully' })
  @ApiResponse({ status: 404, description: 'Connection state not found' })
  async getConnectionState(@Param('id') id: string, @Res() res: Response) {
    this.logger.log(`Fetching connection state for ID: ${id}`);
    try {
      const result = await this.agentService.getConnectionState(id);
      return res.status(HttpStatus.OK).json(result); // Send a 200 response
    } catch (error) {
      this.logger.error(`Failed to fetch connection state for ID ${id}: ${JSON.stringify(error)}`);
      const message = (error instanceof Error) ? error.message : 'Failed to fetch connection state';
      throw new HttpException(message, HttpStatus.NOT_FOUND); // Throw a 404 error with the message
    }
  }

  @Get('connection/id/:id')
  async getConnectionById(@Param('id') id: string) {
    return await this.agentService.getConnectionById(id);
  }
}
