import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { User } from './auth.model';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
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
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    console.log('accessToken', accessToken);
    console.log('refreshToken', refreshToken);

    const { name, emails } = profile;
    const user: User = {
      email: emails[0].value,
      username: name.givenName + name.familyName,
      accessToken,
      refreshToken,
    };

    const savedUser: User = await this.authService.validateOAuthLogin(user);
    const token = 'exemple_token'; // TODO: implement JWT token generation

    done(null, { user: savedUser, token });
  }
}
