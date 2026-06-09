import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ApplicationStatus } from '@prisma/client';

@Injectable()
export class ApplicationsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: {
    companyName: string;
    role: string;
    source: string;
    status: ApplicationStatus;
    appliedDate?: string;
    notes?: string;
  }) {
    const appliedDate = data.appliedDate ? new Date(data.appliedDate) : new Date();
    
    const app = await this.prisma.application.create({
      data: {
        userId,
        companyName: data.companyName,
        role: data.role,
        source: data.source,
        status: data.status,
        appliedDate,
      },
    });

    // Record initial status in history
    await this.prisma.statusHistory.create({
      data: {
        applicationId: app.id,
        newStatus: data.status,
      },
    });

    return app;
  }

  async findAll(userId: string) {
    return this.prisma.application.findMany({
      where: { userId },
      include: {
        emails: true,
        interviews: true,
        offers: true,
        history: true,
      },
      orderBy: { appliedDate: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const app = await this.prisma.application.findFirst({
      where: { id, userId },
      include: {
        emails: true,
        interviews: true,
        offers: true,
        history: true,
      },
    });
    if (!app) throw new NotFoundException('Application not found');
    return app;
  }

  async update(userId: string, id: string, data: {
    companyName?: string;
    role?: string;
    source?: string;
    status?: ApplicationStatus;
    appliedDate?: string;
  }) {
    const existing = await this.findOne(userId, id);
    
    const updateData: any = {};
    if (data.companyName) updateData.companyName = data.companyName;
    if (data.role) updateData.role = data.role;
    if (data.source) updateData.source = data.source;
    if (data.appliedDate) updateData.appliedDate = new Date(data.appliedDate);
    
    if (data.status && data.status !== existing.status) {
      updateData.status = data.status;
      // Record transition in history
      await this.prisma.statusHistory.create({
        data: {
          applicationId: id,
          previousStatus: existing.status,
          newStatus: data.status,
        },
      });
    }

    return this.prisma.application.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.application.delete({
      where: { id },
    });
  }
}
