import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PhcDto {
  @ApiProperty({ description: 'Unique PHC label' })
  @IsString()
  @IsNotEmpty()
  theirLabel!: string;

  @ApiProperty({ description: 'Expiry date' })
  @IsString()
  @IsNotEmpty()
  expiry!: string;
}
