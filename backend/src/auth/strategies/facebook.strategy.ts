import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor() {
    super({
      clientID: process.env.FACEBOOK_APP_ID!,
      clientSecret: process.env.FACEBOOK_APP_SECRET!,
      callbackURL: `${process.env.BACKEND_URL || 'http://localhost:4000'}/auth/facebook/callback`,
      profileFields: ['id', 'displayName', 'photos', 'email'],
      scope: ['email'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile, done: (err: any, user: any, info?: any) => void): Promise<any> {
    const { id, displayName, emails, photos } = profile;
    const user = {
      provider: 'facebook',
      providerId: id,
      email: emails?.[0]?.value,
      displayName: displayName,
      avatarUrl: photos?.[0]?.value,
    };
    done(null, user);
  }
}
