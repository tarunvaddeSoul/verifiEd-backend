import { Logger, Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { ConfigModule } from '@nestjs/config';
import { IssuanceController } from './issuance/issuance.controller';
import { VerificationController } from './verification/verification.controller';
import { IssuanceService } from './issuance/issuance.service';
import { VerificationService } from './verification/verification.service';
import { PrismaService } from './prisma.service';
import { PhcModule } from './phc/phc.module';
import { PhcController } from './phc/phc.controller';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';

@Module({
  imports: [ConfigModule.forRoot(), PhcModule],
  controllers: [AgentController, IssuanceController, VerificationController, PhcController, AuthController],
  providers: [
    AgentService,
    Logger,
    IssuanceService,
    VerificationService,
    PrismaService,
    AuthService
  ],
})
export class AppModule {}
