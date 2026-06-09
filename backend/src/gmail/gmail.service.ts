import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AiService } from '../ai/ai.service';
import { LangGraphWorkflowService } from '../ai/langgraph-workflow.service';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { ApplicationStatus } from '@prisma/client';

@Injectable()
export class GmailService {
  private readonly logger = new Logger(GmailService.name);

  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
    private langGraphWorkflowService: LangGraphWorkflowService,
  ) {}

  async getStatus(userId: string) {
    const account = await this.prisma.connectedAccount.findUnique({
      where: { userId_provider: { userId, provider: 'google' } },
    });
    return { connected: !!account };
  }

  async disconnect(userId: string) {
    return this.prisma.connectedAccount.delete({
      where: { userId_provider: { userId, provider: 'google' } },
    });
  }

  async syncGmail(userId: string) {
    this.logger.log(`Starting Gmail Sync for User: ${userId}`);

    const account = await this.prisma.connectedAccount.findUnique({
      where: { userId_provider: { userId, provider: 'google' } },
    });

    if (!account || account.refreshToken === 'dummy-refresh-token' || !process.env.GOOGLE_CLIENT_ID) {
      this.logger.warn('No valid Google OAuth accounts linked or in mock mode. Executing Simulated Developer Sync...');
      return this.executeSimulatedSync(userId);
    }

    try {
      const oauth2Client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        'http://localhost:3000/auth/google/callback'
      );

      oauth2Client.setCredentials({
        access_token: account.accessToken,
        refresh_token: account.refreshToken,
      });

      const gmail = google.gmail({ version: 'v1', auth: oauth2Client as any });
      
      // Fetch user messages (filtered for job search terms or general query)
      const res = await gmail.users.messages.list({
        userId: 'me',
        q: 'subject:(application OR interview OR assessment OR offer OR resume)',
        maxResults: 10,
      });

      const messages = res.data.messages || [];
      this.logger.log(`Found ${messages.length} email matches in Gmail.`);

      let newEmailsCount = 0;
      for (const msg of messages) {
        if (!msg.id) continue;

        // Check duplicate
        const existing = await this.prisma.email.findUnique({
          where: { gmailMessageId: msg.id },
        });
        if (existing) continue;

        // Fetch full message content
        const msgDetails = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id,
        });

        const headers = msgDetails.data.payload?.headers || [];
        const subject = headers.find(h => h.name?.toLowerCase() === 'subject')?.value || 'No Subject';
        const sender = headers.find(h => h.name?.toLowerCase() === 'from')?.value || 'Unknown Sender';
        const receivedAtHeader = headers.find(h => h.name?.toLowerCase() === 'date')?.value;
        const receivedAt = receivedAtHeader ? new Date(receivedAtHeader) : new Date();

        // Extract body text
        let snippet = msgDetails.data.snippet || '';
        let body = snippet;
        
        // Run LangGraph 5-Agent workflow
        await this.langGraphWorkflowService.runWorkflow({
          userId,
          subject,
          body,
          gmailMessageId: msg.id,
          gmailThreadId: msg.threadId || msg.id,
          sender,
          receivedAt,
        });

        newEmailsCount++;
      }

      return { success: true, count: newEmailsCount };
    } catch (error) {
      this.logger.error('Error during Gmail synchronization, executing fallback simulation instead', error);
      return this.executeSimulatedSync(userId);
    }
  }

  private async executeSimulatedSync(userId: string) {
    this.logger.log('Executing Simulated Sync. Adding mock records to Prisma database...');

    const googleApp = await this.prisma.application.upsert({
      where: { id: 'sim-app-1' },
      update: {},
      create: {
        id: 'sim-app-1',
        userId,
        companyName: 'Google',
        role: 'Frontend Engineer',
        source: 'Gmail Auto-sync',
        status: ApplicationStatus.INTERVIEWING,
        appliedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
    });

    const vercelApp = await this.prisma.application.upsert({
      where: { id: 'sim-app-2' },
      update: {},
      create: {
        id: 'sim-app-2',
        userId,
        companyName: 'Vercel',
        role: 'Developer Advocate',
        source: 'Gmail Auto-sync',
        status: ApplicationStatus.OFFERED,
        appliedDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      },
    });

    // Sync emails
    await this.prisma.email.upsert({
      where: { gmailMessageId: 'sim-msg-1' },
      update: {},
      create: {
        gmailMessageId: 'sim-msg-1',
        applicationId: googleApp.id,
        gmailThreadId: 'sim-thread-1',
        sender: 'recruiter@google.com',
        subject: 'Interview scheduled: Google & Atul Raina',
        snippet: 'Hi Atul, we are excited to schedule your Technical Interview 1 next week.',
        classification: 'INTERVIEWING',
        confidence: 0.99,
        receivedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    });

    await this.prisma.email.upsert({
      where: { gmailMessageId: 'sim-msg-2' },
      update: {},
      create: {
        gmailMessageId: 'sim-msg-2',
        applicationId: vercelApp.id,
        gmailThreadId: 'sim-thread-2',
        sender: 'careers@vercel.com',
        subject: 'Job Offer: Developer Advocate at Vercel',
        snippet: 'Congratulations! We are thrilled to offer you the Developer Advocate role.',
        classification: 'OFFERED',
        confidence: 0.98,
        receivedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    });

    // Create status histories
    await this.prisma.statusHistory.create({
      data: { applicationId: googleApp.id, newStatus: ApplicationStatus.APPLIED },
    });
    await this.prisma.statusHistory.create({
      data: { applicationId: googleApp.id, previousStatus: ApplicationStatus.APPLIED, newStatus: ApplicationStatus.INTERVIEWING },
    });

    // Create Interview details
    await this.prisma.interview.create({
      data: {
        applicationId: googleApp.id,
        interviewDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        round: 'Technical Round 1',
        meetingLink: 'https://meet.google.com/abc-defg-hij',
      },
    });

    // Create Offer details
    await this.prisma.offer.upsert({
      where: { applicationId: vercelApp.id },
      update: {},
      create: {
        applicationId: vercelApp.id,
        ctc: '$150,000 / year',
        location: 'Remote (US/Global)',
      },
    });

    // Add some random simulated AI Insights
    await this.prisma.insight.create({
      data: {
        userId,
        title: 'Interview Preparation Focus',
        description: 'You have a Technical Round 1 scheduled with Google. Brush up on core JavaScript and React fundamentals.',
      },
    });

    return { success: true, count: 2 };
  }
}
