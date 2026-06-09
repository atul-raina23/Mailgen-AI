import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { LangGraphWorkflowService } from './langgraph-workflow.service';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [AiService, LangGraphWorkflowService, PrismaService],
  exports: [AiService, LangGraphWorkflowService],
})
export class AiModule {}
