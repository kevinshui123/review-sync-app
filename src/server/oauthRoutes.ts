import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateToken, authMiddleware, AuthRequest } from './auth';

const prisma = new PrismaClient();
const router = Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const APP_URL = process.env.APP_URL || 'http://localhost:5173';

// Initiate Google OAuth
router.get('/google', (req: Request, res: Response) => {
  if (!GOOGLE_CLIENT_ID) {
    return res.status(500).json({ error: 'Google OAuth not configured' });
  }

  const redirectUri = `${APP_URL}/api/auth/google/callback`;
  const scope = encodeURIComponent('email profile');

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${redirectUri}` +
    `&response_type=code` +
    `&scope=${scope}` +
    `&access_type=offline` +
    `&prompt=consent`;

  res.json({ authUrl });
});

// Google OAuth Callback
router.get('/google/callback', async (req: Request, res: Response) => {
  try {
    const { code, error } = req.query;

    if (error) {
      console.error('[oauth/google] Error:', error);
      return res.redirect(`${APP_URL}/auth?error=${encodeURIComponent(String(error))}`);
    }

    if (!code) {
      return res.redirect(`${APP_URL}/auth?error=no_code`);
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: String(code),
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${APP_URL}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      console.error('[oauth/google] No access token:', tokens);
      return res.redirect(`${APP_URL}/auth?error=token_exchange_failed`);
    }

    // Get user info
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    const googleUser = await userResponse.json();
    console.log('[oauth/google] User:', googleUser);

    // Find or create user
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: googleUser.email },
          { oauthId: googleUser.id, oauthProvider: 'google' },
        ],
      },
      include: { tenants: true },
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name,
          avatar: googleUser.picture,
          oauthProvider: 'google',
          oauthId: googleUser.id,
          tenants: {
            create: {
              name: `${googleUser.name || googleUser.email.split('@')[0]}'s Business`,
            },
          },
        },
        include: { tenants: true },
      });
    } else if (!user.oauthId) {
      // Link OAuth to existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          oauthProvider: 'google',
          oauthId: googleUser.id,
          avatar: googleUser.picture || user.avatar,
        },
        include: { tenants: true },
      });
    }

    // Get or create tenant
    let tenant = user.tenants[0];
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: `${user.name || user.email.split('@')[0]}'s Business`,
        },
      });
    }

    // Generate JWT
    const token = generateToken(user.id, tenant.id);

    // Redirect to app with token
    res.redirect(`${APP_URL}/auth/callback?token=${token}&tenantId=${tenant.id}`);
  } catch (error: any) {
    console.error('[oauth/google] Callback error:', error);
    res.redirect(`${APP_URL}/auth?error=${encodeURIComponent(error.message)}`);
  }
});

// Get OAuth status
router.get('/status', (req: Request, res: Response) => {
  res.json({
    googleConfigured: !!GOOGLE_CLIENT_ID,
  });
});

export default router;
