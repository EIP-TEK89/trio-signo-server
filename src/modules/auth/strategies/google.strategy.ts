import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { AuthMethodType } from '@prisma/client';
import { IOAuthUser } from '../interfaces/auth.interface';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);
  
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GOOGLE_REDIRECT_URI'),
      scope: ['email', 'profile'],
    });
    this.logger.log('Google Strategy initialized');
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    this.logger.debug(`Processing Google OAuth validation for profile ID: ${profile.id}`);
    const { name, emails, photos } = profile;
    
    this.logger.debug(`Google profile email: ${emails[0].value}`);
    
    const oauthUser: IOAuthUser = {
      email: emails[0].value,
      username: `${name.givenName}${name.familyName}`.toLowerCase(),
      firstName: name.givenName,
      lastName: name.familyName,
      avatarUrl: photos[0]?.value,
      provider: AuthMethodType.GOOGLE,
      providerId: profile.id,
    };

    try {
      this.logger.log(`Validating Google OAuth login for email: ${oauthUser.email}`);
      const { user, accessToken: token } = await this.authService.validateOAuthLogin(
        oauthUser,
        accessToken,
        refreshToken,
      );

      this.logger.log(`Google OAuth validation successful for user: ${user.username}`);
      // Pass both user and token to the controller
      done(null, { user, token });
    } catch (error) {
      this.logger.error(`Google OAuth validation failed: ${error.message}`, error.stack);
      done(error, false);
    }
  }
}