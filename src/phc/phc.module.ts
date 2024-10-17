import { Module } from '@nestjs/common';
import { PhcService } from './phc.service';
import { PhcRepository } from './phc.repository';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [PhcService, PhcRepository, PrismaService],
  exports: [PhcService],
})
export class PhcModule {}
