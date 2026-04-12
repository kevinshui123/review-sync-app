import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { generateToken, authMiddleware, AuthRequest } from './auth';

const prisma = new PrismaClient();
const router = Router();

// Register with email/password
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user and default tenant
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: name || email.split('@')[0],
        tenants: {
          create: {
            name: `${name || email.split('@')[0]}'s Business`,
          },
        },
      },
      include: {
        tenants: true,
      },
    });

    // Get the created tenant
    const tenant = user.tenants[0];

    // Generate token
    const token = generateToken(user.id, tenant.id);

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
      tenantId: tenant.id,
    });
  } catch (error: any) {
    console.error('[auth] Register error:', error);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

// Login with email/password
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenants: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password (if password hash exists)
    if (user.passwordHash) {
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
    } else {
      // User registered via OAuth without password
      return res.status(401).json({ error: 'Please use OAuth login or reset your password' });
    }

    // Get first tenant or create one
    let tenant = user.tenants[0];
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: `${user.name || user.email.split('@')[0]}'s Business`,
        },
      });
    }

    // Generate token
    const token = generateToken(user.id, tenant.id);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
      token,
      tenantId: tenant.id,
    });
  } catch (error: any) {
    console.error('[auth] Login error:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { tenants: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        oauthProvider: user.oauthProvider,
      },
      tenants: user.tenants.map(t => ({
        id: t.id,
        name: t.name,
        isConfigured: t.isConfigured,
      })),
      currentTenantId: req.tenantId,
    });
  } catch (error: any) {
    console.error('[auth] Get user error:', error);
    res.status(500).json({ error: 'Failed to get user', details: error.message });
  }
});

// Switch tenant
router.post('/switch-tenant', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId } = req.body;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    // Verify user has access to this tenant
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { tenants: true },
    });

    const hasAccess = user?.tenants.some(t => t.id === tenantId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this tenant' });
    }

    // Generate new token with new tenant
    const token = generateToken(req.userId!, tenantId);

    res.json({ token, tenantId });
  } catch (error: any) {
    console.error('[auth] Switch tenant error:', error);
    res.status(500).json({ error: 'Failed to switch tenant', details: error.message });
  }
});

export default router;
