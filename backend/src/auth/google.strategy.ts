import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private authService: AuthService) {
    const clientID = process.env.GOOGLE_CLIENT_ID || 'dummy-client-id';
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || 'dummy-client-secret';
    
    super({
      clientID,
      clientSecret,
      callbackURL: 'http://localhost:3000/auth/google/callback',
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
    const user = await this.authService.validateUser(
      emails[0].value,
      `${name.givenName} ${name.familyName}`,
      photos[0]?.value || '',
    );
    
    // Store tokens
    if (accessToken && refreshToken) {
      await this.authService.linkGoogleAccount(user.id, accessToken, refreshToken);
    }
    
    done(null, {
      ...user,
      accessToken,
      refreshToken,
    });
  }
}
