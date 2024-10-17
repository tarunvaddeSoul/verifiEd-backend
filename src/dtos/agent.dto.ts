import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { NetworkOptions } from '../enums';

export class AgentDto {
  @ApiProperty({
    description: 'The seed for the agent (should be 32 characters long)',
    example: 'stringstringstringstringstringst',
  })
  @IsString()
  @IsNotEmpty({ message: 'Seed is required' })
  @Length(32, 32, { message: 'Seed must be exactly 32 characters long' })
  @Matches(/^[a-zA-Z0-9]+$/, { message: 'Seed must contain only alphanumeric characters' })
  seed!: string;

  @ApiProperty({
    description: 'The network for the agent',
    enum: NetworkOptions,
    example: NetworkOptions.BCOVRIN_TESTNET,
  })
  @IsEnum(NetworkOptions, { message: 'Invalid network option' })
  @IsNotEmpty({ message: 'Network is required' })
  network!: NetworkOptions;
}
