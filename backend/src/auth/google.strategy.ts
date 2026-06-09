import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private authService: AuthService) {
    const clientID = process.env.GOOGLE_CLIENT_ID || 'dummy-client-id';
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || 'dummy-client-secret';
    
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    super({
      clientID,
      clientSecret,
      callbackURL: `${backendUrl}/auth/google/callback`,
      scope: ['email', 'profile', 'https://www.googleapis.com/auth/gmail.readonly'],
      accessType: 'offline',
      prompt: 'consent',
    } as any);
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, photos } = profile;
    const email = emails[0].value;
    console.log(`[GoogleStrategy] Validate called for ${email}. AccessToken: ${!!accessToken}, RefreshToken: ${!!refreshToken}`);

    const user = await this.authService.validateUser(
      email,
      `${name.givenName} ${name.familyName}`,
      photos[0]?.value || '',
    );
    
    // Store tokens
    if (accessToken) {
      console.log(`[GoogleStrategy] Linking Google Account for user ${user.id}...`);
      await this.authService.linkGoogleAccount(user.id, accessToken, refreshToken || 'dummy-refresh-token');
    }
    
    done(null, {
      ...user,
      accessToken,
      refreshToken,
    });
  }
}
