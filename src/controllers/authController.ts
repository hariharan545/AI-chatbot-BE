import { Request, Response } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { signJwt } from '../utils/jwt';

dotenv.config();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:4000/api/auth/google/callback';

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: GOOGLE_CALLBACK_URL
    },
    async (_accessToken: string, _refreshToken: string, profile: Profile, done) => {
      try {
        const existing = await User.findOne({ googleId: profile.id });
        if (existing) return done(null, existing);
        const created = await User.create({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails?.[0]?.value,
          photo: profile.photos?.[0]?.value
        });
        return done(null, created);
      } catch (e) {
        return done(e as any, undefined);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  const user = await User.findById(id);
  done(null, user);
});

export const googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false
});

export const googleCallback = [
  passport.authenticate('google', { session: false, failureRedirect: '/' }),
  async (req: Request, res: Response) => {
    const user = (req as any).user;
    const token = signJwt({ userId: user.id });
    res
      .cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      })
      .redirect(process.env.FRONTEND_ORIGIN || 'http://localhost:5173');
  }
];


