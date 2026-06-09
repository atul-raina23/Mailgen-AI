import { Controller, Get, UseGuards, Req, Res, Post, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './google-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth(@Req() req: any) {
    // Initiates Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@Req() req: any, @Res() res: any) {
    const loginRes = await this.authService.login(req.user);
    // Redirect to frontend with token, refresh_token, and user details query params
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const redirectUrl = `${frontendUrl}/auth?token=${loginRes.access_token}&refresh_token=${loginRes.refresh_token}&user=${encodeURIComponent(JSON.stringify(loginRes.user))}`;
    return res.redirect(redirectUrl);
  }

  // Manual Email & Password Signup
  @Post('signup')
  async signup(@Body() body: { email: string; password: string; name?: string }) {
    return this.authService.signup(body.email, body.password, body.name);
  }

  // Manual Email & Password Login
  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.loginWithPassword(body.email, body.password);
  }

  // Developer simulation bypass for offline running
  @Post('simulate-login')
  async simulateLogin(@Body() body: { email: string; name?: string }) {
    const user = await this.authService.validateUser(
      body.email,
      body.name || 'Developer User',
      '',
    );
    return this.authService.login(user);
  }

  // Refresh tokens endpoint
  @Post('refresh')
  async refresh(@Body() body: { userId: string; refreshToken: string }) {
    return this.authService.refreshTokens(body.userId, body.refreshToken);
  }

  // Logout endpoint to revoke tokens
  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  async logout(@Req() req: any) {
    return this.authService.logout(req.user.userId);
  }
}
