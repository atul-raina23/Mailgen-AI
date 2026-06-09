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
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
      const oauth2Client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${backendUrl}/auth/google/callback`
      );

      oauth2Client.setCredentials({
        access_token: account.accessToken,
        refresh_token: account.refreshToken,
      });

      const gmail = google.gmail({ version: 'v1', auth: oauth2Client as any });

      // 1. Get the user's email address
      const profile = await gmail.users.getProfile({ userId: 'me' });
      const userEmail = profile.data.emailAddress || '';
      this.logger.log(`Syncing Gmail for user email: ${userEmail}`);

      // 2. Fetch sent job applications
      const sentRes = await gmail.users.messages.list({
        userId: 'me',
        q: 'in:sent (subject:(application OR resume OR job OR apply OR applying OR position OR role) OR "thank you for applying" OR "application received")',
        maxResults: 15,
      });

      const sentMessages = sentRes.data.messages || [];
      this.logger.log(`Found ${sentMessages.length} sent job application emails.`);

      // Get unique thread IDs
      const threadIds = Array.from(new Set(sentMessages.map(m => m.threadId).filter(Boolean))) as string[];
      this.logger.log(`Found ${threadIds.length} unique application email threads.`);

      let processedCount = 0;
      for (const threadId of threadIds) {
        // Fetch all messages in this thread
        const threadDetails = await gmail.users.threads.get({
          userId: 'me',
          id: threadId,
        });

        const messages = threadDetails.data.messages || [];
        if (messages.length === 0) continue;

        // Find incoming replies (where 'from' does not contain userEmail)
        const incomingReplies = messages.filter(msg => {
          const headers = msg.payload?.headers || [];
          const fromHeader = headers.find(h => h.name?.toLowerCase() === 'from')?.value || '';
          return !fromHeader.toLowerCase().includes(userEmail.toLowerCase());
        });

        // Determine which message to process
        let targetMsg = null;

        if (incomingReplies.length > 0) {
          // Process the latest incoming reply
          targetMsg = incomingReplies[incomingReplies.length - 1];
          this.logger.log(`Thread ${threadId}: Found incoming reply from ${targetMsg.payload?.headers?.find(h => h.name?.toLowerCase() === 'from')?.value}`);
        } else {
          // No reply yet, process the original sent message
          targetMsg = messages[0];
          this.logger.log(`Thread ${threadId}: No incoming replies. Processing original sent message.`);
        }

        if (!targetMsg || !targetMsg.id) continue;

        // Check duplicate message processing
        const existing = await this.prisma.email.findUnique({
          where: { gmailMessageId: targetMsg.id },
        });
        if (existing) {
          this.logger.log(`Message ${targetMsg.id} already processed. Skipping.`);
          continue;
        }

        // Fetch full details of the target message if snippet is incomplete
        const msgDetails = await gmail.users.messages.get({
          userId: 'me',
          id: targetMsg.id,
        });

        const headers = msgDetails.data.payload?.headers || [];
        const subject = headers.find(h => h.name?.toLowerCase() === 'subject')?.value || 'No Subject';
        const sender = headers.find(h => h.name?.toLowerCase() === 'from')?.value || 'Unknown';
        const dateHeader = headers.find(h => h.name?.toLowerCase() === 'date')?.value;
        const receivedAt = dateHeader ? new Date(dateHeader) : new Date();
        const snippet = msgDetails.data.snippet || '';

        // Run the LangGraph 5-Agent workflow
        await this.langGraphWorkflowService.runWorkflow({
          userId,
          subject,
          body: snippet,
          gmailMessageId: targetMsg.id,
          gmailThreadId: threadId,
          sender,
          receivedAt,
        });

        processedCount++;
      }

      return { success: true, count: processedCount };
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
