import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class IssueCourseCredentialDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  marks!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  connectionId!: string;
}
