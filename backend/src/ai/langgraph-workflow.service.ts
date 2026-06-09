import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AiService } from './ai.service';
import { ApplicationStatus } from '@prisma/client';

// Define the State structure
export interface WorkflowState {
  userId: string;
  emailSubject: string;
  emailBody: string;
  gmailMessageId?: string;
  gmailThreadId?: string;
  sender?: string;
  receivedAt?: Date;

  // Processing outputs
  classification: string;
  confidence: number;
  extractedEntities: any;
  matchedApplicationId?: string;
  insightsGenerated: any[];
}

@Injectable()
export class LangGraphWorkflowService {
  private readonly logger = new Logger(LangGraphWorkflowService.name);

  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  // Node 1: Fetch/Sanitize Email (Agent 1)
  private async fetchEmailNode(state: WorkflowState): Promise<Partial<WorkflowState>> {
    this.logger.log(`[Agent 1: Email Fetch] Sanitize input. Subject: "${state.emailSubject}"`);
    return {
      emailSubject: state.emailSubject.trim(),
      emailBody: state.emailBody.trim(),
    };
  }

  // Node 2: Email Classification (Agent 2)
  private async classifyEmailNode(state: WorkflowState): Promise<Partial<WorkflowState>> {
    this.logger.log(`[Agent 2: Email Classification] Running parser. Subject: "${state.emailSubject}"`);
    const analysis = await this.aiService.analyzeEmail(state.emailSubject, state.emailBody);
    
    return {
      classification: analysis.classification,
      confidence: analysis.confidence,
      extractedEntities: {
        companyName: analysis.companyName,
        role: analysis.role,
        ...analysis.extractedDetails,
      },
    };
  }

  // Node 3: Entity Extraction (Agent 3)
  private async extractEntitiesNode(state: WorkflowState): Promise<Partial<WorkflowState>> {
    this.logger.log(`[Agent 3: Entity Extraction] Refining parsing. Company: ${state.extractedEntities?.companyName}`);
    const entities = { ...state.extractedEntities };
    if (!entities.location && state.emailBody.toLowerCase().includes('remote')) {
      entities.location = 'Remote';
    }
    return { extractedEntities: entities };
  }

  // Node 4: Application Matching (Agent 4)
  private async matchApplicationNode(state: WorkflowState): Promise<Partial<WorkflowState>> {
    this.logger.log(`[Agent 4: Application Matcher] Database query. Company: ${state.extractedEntities?.companyName}`);
    
    const userId = state.userId;
    const companyName = state.extractedEntities?.companyName || 'Unknown';
    const role = state.extractedEntities?.role || 'Software Engineer';
    const classification = state.classification;

    const statusMap: Record<string, ApplicationStatus> = {
      'APPLIED': ApplicationStatus.APPLIED,
      'ASSESSMENT': ApplicationStatus.ASSESSMENT,
      'INTERVIEWING': ApplicationStatus.INTERVIEWING,
      'OFFERED': ApplicationStatus.OFFERED,
      'REJECTED': ApplicationStatus.REJECTED,
    };
    const targetStatus = statusMap[classification] || ApplicationStatus.APPLIED;

    // Match or create application
    let app = await this.prisma.application.findFirst({
      where: {
        userId,
        companyName: {
          equals: companyName,
          mode: 'insensitive',
        },
      },
    });

    if (!app) {
      this.logger.log(`[Agent 4] Creating new application for ${companyName}`);
      app = await this.prisma.application.create({
        data: {
          userId,
          companyName,
          role,
          source: 'Gmail Auto-sync',
          status: targetStatus,
        },
      });
      await this.prisma.statusHistory.create({
        data: {
          applicationId: app.id,
          newStatus: targetStatus,
        },
      });
    } else if (app.status !== targetStatus) {
      this.logger.log(`[Agent 4] Updating status to ${targetStatus}`);
      const prevStatus = app.status;
      await this.prisma.application.update({
        where: { id: app.id },
        data: { status: targetStatus },
      });
      await this.prisma.statusHistory.create({
        data: {
          applicationId: app.id,
          previousStatus: prevStatus,
          newStatus: targetStatus,
        },
      });
    }

    // Save Email mapping
    if (state.gmailMessageId) {
      await this.prisma.email.upsert({
        where: { gmailMessageId: state.gmailMessageId },
        update: { applicationId: app.id },
        create: {
          gmailMessageId: state.gmailMessageId,
          applicationId: app.id,
          gmailThreadId: state.gmailThreadId || state.gmailMessageId,
          sender: state.sender || 'unknown@example.com',
          subject: state.emailSubject,
          snippet: state.emailBody.substring(0, 100),
          classification: state.classification,
          confidence: state.confidence || 1.0,
          receivedAt: state.receivedAt || new Date(),
        },
      });
    }

    // Add sub-records
    if (targetStatus === ApplicationStatus.INTERVIEWING && state.extractedEntities?.round) {
      await this.prisma.interview.create({
        data: {
          applicationId: app.id,
          interviewDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          round: state.extractedEntities.round,
          meetingLink: state.extractedEntities.meetingLink || null,
        },
      });
    }

    if (targetStatus === ApplicationStatus.OFFERED) {
      await this.prisma.offer.upsert({
        where: { applicationId: app.id },
        update: {
          ctc: state.extractedEntities?.ctc || null,
          location: state.extractedEntities?.location || null,
        },
        create: {
          applicationId: app.id,
          ctc: state.extractedEntities?.ctc || null,
          location: state.extractedEntities?.location || null,
        },
      });
    }

    return { matchedApplicationId: app.id };
  }

  // Node 5: Insight Generation (Agent 5)
  private async generateInsightsNode(state: WorkflowState): Promise<Partial<WorkflowState>> {
    this.logger.log('[Agent 5: Insight Agent] Triggering pipeline recommendations.');
    const userApps = await this.prisma.application.findMany({
      where: { userId: state.userId },
    });

    const aiInsights = await this.aiService.generateInsights(userApps);

    const insightsCreated = [];
    for (const insight of aiInsights) {
      const dbInsight = await this.prisma.insight.create({
        data: {
          userId: state.userId,
          title: insight.title,
          description: insight.description,
        },
      });
      insightsCreated.push(dbInsight);
    }

    return { insightsGenerated: insightsCreated };
  }

  // Executing the State Graph workflow pipeline sequentially
  async runWorkflow(input: {
    userId: string;
    subject: string;
    body: string;
    gmailMessageId?: string;
    gmailThreadId?: string;
    sender?: string;
    receivedAt?: Date;
  }): Promise<WorkflowState> {
    this.logger.log(`Invoking Workflow State Machine for User: ${input.userId}`);
    
    // Initial State
    let state: WorkflowState = {
      userId: input.userId,
      emailSubject: input.subject,
      emailBody: input.body,
      gmailMessageId: input.gmailMessageId,
      gmailThreadId: input.gmailThreadId,
      sender: input.sender,
      receivedAt: input.receivedAt,
      
      classification: 'OTHER',
      confidence: 0.0,
      extractedEntities: null,
      matchedApplicationId: undefined,
      insightsGenerated: [],
    };

    // Transition 1: Fetch
    state = { ...state, ...(await this.fetchEmailNode(state)) };

    // Transition 2: Classify
    state = { ...state, ...(await this.classifyEmailNode(state)) };

    // Conditional Routing
    if (state.classification === 'OTHER') {
      this.logger.log('[Workflow State Machine] Classified as OTHER. Routing to END.');
      return state;
    }

    // Transition 3: Extract
    state = { ...state, ...(await this.extractEntitiesNode(state)) };

    // Transition 4: Match application
    state = { ...state, ...(await this.matchApplicationNode(state)) };

    // Transition 5: Generate insights
    state = { ...state, ...(await this.generateInsightsNode(state)) };

    this.logger.log('[Workflow State Machine] Workflow finished at END node.');
    return state;
  }
}
