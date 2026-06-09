import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApplicationsService } from './applications.service';
import { ApplicationStatus } from '@prisma/client';

@Controller('applications')
@UseGuards(AuthGuard('jwt'))
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  create(@Req() req: any, @Body() body: {
    companyName: string;
    role: string;
    source: string;
    status: ApplicationStatus;
    appliedDate?: string;
    notes?: string;
  }) {
    return this.applicationsService.create(req.user.userId, body);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.applicationsService.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.applicationsService.findOne(req.user.userId, id);
  }

  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() body: {
    companyName?: string;
    role?: string;
    source?: string;
    status?: ApplicationStatus;
    appliedDate?: string;
  }) {
    return this.applicationsService.update(req.user.userId, id, body);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.applicationsService.remove(req.user.userId, id);
  }
}
