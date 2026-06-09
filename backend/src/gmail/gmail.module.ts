import { Module } from '@nestjs/common';
import { GmailService } from './gmail.service';
import { GmailController } from './gmail.controller';
import { PrismaService } from '../prisma.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [GmailController],
  providers: [GmailService, PrismaService],
  exports: [GmailService],
})
export class GmailModule {}
