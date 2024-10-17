import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PHC, Prisma } from '@prisma/client';

@Injectable()
export class PhcRepository {
  constructor(private prisma: PrismaService) {}

  async createPHC(data: Prisma.PHCCreateInput): Promise<PHC> {
    return this.prisma.pHC.create({ data });
  }

  async findByTheirLabel(theirLabel: string): Promise<PHC | null> {
    return this.prisma.pHC.findUnique({
      where: { theirLabel },
    });
  }

  async getAllPHCs(): Promise<PHC[]> {
    return this.prisma.pHC.findMany();
  }

  async updatePHC(theirLabel: string, data: Prisma.PHCUpdateInput): Promise<PHC> {
    return this.prisma.pHC.update({
      where: { theirLabel },
      data,
    });
  }

  async deletePHC(theirLabel: string): Promise<PHC> {
    return this.prisma.pHC.delete({
      where: { theirLabel },
    });
  }
}
