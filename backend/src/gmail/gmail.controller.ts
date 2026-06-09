import { Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GmailService } from './gmail.service';

@Controller('gmail')
@UseGuards(AuthGuard('jwt'))
export class GmailController {
  constructor(private readonly gmailService: GmailService) {}

  @Get('status')
  getStatus(@Req() req: any) {
    return this.gmailService.getStatus(req.user.userId);
  }

  @Post('sync')
  syncGmail(@Req() req: any) {
    return this.gmailService.syncGmail(req.user.userId);
  }

  @Post('disconnect')
  disconnect(@Req() req: any) {
    return this.gmailService.disconnect(req.user.userId);
  }
}
