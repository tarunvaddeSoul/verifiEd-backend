import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PhcUpdateDto {
  @ApiPropertyOptional({ description: 'Unique PHC label' })
  @IsString()
  @IsOptional()
  theirLabel?: string;

  @ApiPropertyOptional({ description: 'Expiry date' })
  @IsString()
  @IsOptional()
  expiry?: string;
}
