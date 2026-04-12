import 'dotenv/config';
import express, { Response } from 'express';
import PDFDocument from 'pdfkit';
import authRoutes from './src/server/authRoutes.js';
import oauthRoutes from './src/server/oauthRoutes.js';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, generateToken, AuthRequest } from './src/server/auth.js';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { Auth } from 'googleapis';

// Instantiate the Prisma Client
const prisma = new PrismaClient();

// ==========================================
// Google OAuth2 Configuration
// ==========================================
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

const SCOPES = [
  'https://www.googleapis.com/auth/business.manage',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
];

// Helper function to extract replies from text when JSON parsing fails
function extractRepliesFromText(text: string): { professional: string; friendly: string; empathetic: string } {
  // Strategy: find all potential JSON objects, try to parse each, use the best one
  // Also clean up common AI response artifacts (```, leading/trailing text)

  // Remove markdown code blocks
  let cleaned = text.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim();

  // Strategy 1: Find ALL potential JSON objects and try to parse each
  // Look for the pattern {"professional": "...", "friendly": "...", "empathetic": "..."}
  // or {"professional": "...", ...} with any ordering
  const jsonBlockRegex = /\{[\s\S]*?\}/g;
  let matches = cleaned.match(jsonBlockRegex);

  if (matches) {
    for (const match of matches) {
      // Skip obviously too-short or too-long blocks (likely not the JSON we want)
      if (match.length < 20 || match.length > 3000) continue;

      try {
        const parsed = JSON.parse(match);
        if (
          typeof parsed === 'object' &&
          parsed !== null &&
          parsed.professional &&
          parsed.friendly &&
          parsed.empathetic
        ) {
          return {
            professional: String(parsed.professional).trim(),
            friendly: String(parsed.friendly).trim(),
            empathetic: String(parsed.empathetic).trim(),
          };
        }
      } catch {
        // Not valid JSON, try next match
      }
    }

    // Strategy 2: Try to extract individual fields from any partial match
    const fieldPatterns = {
      professional: /"professional"\s*:\s*"((?:[^"\\]|\\.)*)"/,
      friendly: /"friendly"\s*:\s*"((?:[^"\\]|\\.)*)"/,
      empathetic: /"empathetic"\s*:\s*"((?:[^"\\]|\\.)*)"/,
    };

    const found: Record<string, string> = {};
    for (const [key, pattern] of Object.entries(fieldPatterns)) {
      const match = cleaned.match(pattern);
      if (match && match[1]) {
        found[key] = match[1].replace(/\\"/g, '"').trim();
      }
    }

    if (found.professional && found.friendly && found.empathetic) {
      return found as { professional: string; friendly: string; empathetic: string };
    }
  }

  // Strategy 3: Fallback to splitting by tone labels in plain text
  // e.g. "Professional: ..." / "Professional Reply: ..."
  const toneSplitRegex = /(?:^|\n)\s*(?:professional|friendly|empathetic)[\s:—]*/gi;
  const parts = cleaned.split(toneSplitRegex).filter(s => s.trim().length > 5);

  if (parts.length >= 3) {
    return {
      professional: parts[0].replace(/^["']|["']$/g, '').trim().slice(0, 500),
      friendly: parts[1].replace(/^["']|["']$/g, '').trim().slice(0, 500),
      empathetic: parts[2].replace(/^["']|["']$/g, '').trim().slice(0, 500),
    };
  }

  // Last resort fallback
  return {
    professional: 'Thank you for your feedback! We appreciate your kind words.',
    friendly: 'Thanks so much for the review! We love hearing from you.',
    empathetic: 'We truly appreciate you taking the time to share your experience.',
  };
}

// ==========================================
// Google API 统一调用函数（REST API 直连）
// ==========================================

async function googleApiRequest(
  auth: Auth.OAuth2Client,
  method: string,
  url: string,
  body?: object,
): Promise<any> {
  const accessToken = (auth.credentials as any).access_token;
  if (!accessToken) throw new Error('No access token available');

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    const err: any = new Error(`Google API error: ${response.status} ${response.statusText}`);
    err.status = response.status;
    err.details = errorText;
    throw err;
  }

  return response.json();
}

async function googleApiRequestGet(auth: Auth.OAuth2Client, url: string): Promise<any> {
  return googleApiRequest(auth, 'GET', url);
}

async function googleApiRequestPost(auth: Auth.OAuth2Client, url: string, body?: object): Promise<any> {
  return googleApiRequest(auth, 'POST', url, body);
}

async function googleApiRequestPut(auth: Auth.OAuth2Client, url: string, body?: object): Promise<any> {
  return googleApiRequest(auth, 'PUT', url, body);
}

/** List reviews uses legacy v4 host; Business Information v1 does not expose reviews list. */
async function fetchV4LocationReviews(auth: Auth.OAuth2Client, locationParent: string): Promise<any[]> {
  const out: any[] = [];
  let pageToken: string | undefined;
  do {
    const qs = new URLSearchParams({ pageSize: '50' });
    if (pageToken) qs.set('pageToken', pageToken);
    const url = `https://mybusiness.googleapis.com/v4/${locationParent}/reviews?${qs.toString()}`;
    console.log(`[fetchV4Reviews] GET ${url}`);
    const data = await googleApiRequestGet(auth, url);
    console.log(`[fetchV4Reviews] Got ${(data.reviews || []).length} reviews, nextPageToken=${!!data.nextPageToken}`);
    out.push(...(data.reviews || []));
    pageToken = data.nextPageToken;
  } while (pageToken);
  return out;
}

// Auto-refresh token callback
function setupTokenRefresh(auth: Auth.OAuth2Client, tenantId: string) {
  auth.on('tokens', async (tokens) => {
    if (tokens.access_token) {
      try {
        await prisma.tenant.update({
          where: { id: tenantId },
          data: {
            googleAccessToken: tokens.access_token,
            googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          },
        });
      } catch (e: any) {
        console.error('Failed to save refreshed token:', e);
      }
    }
  });
}

// Re-create OAuth2Client with a fresh token using stored refresh_token,
// then save the new access_token back to the DB.
async function refreshAndSaveToken(tenantId: string, currentRefreshToken: string): Promise<Auth.OAuth2Client | null> {
  const { OAuth2Client } = Auth;
  const refreshed = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, `${APP_URL}/api/auth/google/callback`);
  refreshed.setCredentials({ refresh_token: currentRefreshToken });

  try {
    const { credentials } = await refreshed.refreshAccessToken();
    const newAccessToken = (credentials as any).access_token;
    const newExpiry = credentials.expiry_date;

    if (!newAccessToken) {
      console.error('[tokenRefresh] No access_token in refreshed response');
      return null;
    }

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        googleAccessToken: newAccessToken,
        googleTokenExpiry: newExpiry ? new Date(newExpiry) : null,
      },
    });

    console.log('[tokenRefresh] Token refreshed and saved successfully');
    return refreshed;
  } catch (e: any) {
    console.error('[tokenRefresh] refreshAccessToken failed:', e.message, e.details);
    return null;
  }
}

// ==========================================
// Token Management
// ==========================================

async function getValidAuth(): Promise<{ auth: Auth.OAuth2Client; tenantId: string } | null> {
  const tenant = await prisma.tenant.findFirst();
  if (!tenant?.googleAccessToken || !tenant?.googleRefreshToken) {
    return null;
  }

  const { OAuth2Client } = Auth;
  const oauth2Client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, `${APP_URL}/api/auth/google/callback`);
  oauth2Client.setCredentials({
    access_token: tenant.googleAccessToken,
    refresh_token: tenant.googleRefreshToken,
    expiry_date: tenant.googleTokenExpiry ? new Date(tenant.googleTokenExpiry).getTime() : undefined,
  });

  // Check if access_token is still valid by seeing if it's about to expire (within 2 min)
  const isAboutToExpire =
    tenant.googleTokenExpiry &&
    new Date(tenant.googleTokenExpiry).getTime() - Date.now() < 2 * 60 * 1000;

  if (isAboutToExpire) {
    const refreshed = await refreshAndSaveToken(tenant.id, tenant.googleRefreshToken);
    if (refreshed) {
      return { auth: refreshed, tenantId: tenant.id };
    }
  }

  // Test the stored token once; if 401, force refresh
  try {
    // Quick probe request to confirm token is alive
    const probe = await fetch(
      `https://mybusinessbusinessinformation.googleapis.com/v1/googleLocations:search?pageSize=1`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tenant.googleAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: 'probe' }),
      },
    );
    if (probe.status === 401) {
      console.warn('[getValidAuth] Stored access token expired (401); refreshing…');
      const refreshed = await refreshAndSaveToken(tenant.id, tenant.googleRefreshToken);
      if (refreshed) {
        return { auth: refreshed, tenantId: tenant.id };
      }
      return null;
    }
  } catch {
    // network error — proceed with stored token; let it fail naturally if really invalid
  }

  setupTokenRefresh(oauth2Client, tenant.id);
  return { auth: oauth2Client, tenantId: tenant.id };
}

/** Google Business Profile location resource name, e.g. accounts/123/locations/456 */
function isGbpLocationResourceName(s: string): boolean {
  return s.includes('accounts/') && s.includes('/locations/');
}

function parseReviewStarRating(review: any): number {
  if (typeof review.starRating === 'number') return Math.min(5, Math.max(1, review.starRating));
  const map: Record<string, number> = {
    ONE: 1,
    TWO: 2,
    THREE: 3,
    FOUR: 4,
    FIVE: 5,
    STAR_RATING_UNSPECIFIED: 5,
  };
  const k = review.starRating as string;
  return map[k] ?? 5;
}

/**
 * Exponential-backoff fetch helper for Google API calls that may hit rate limits.
 */
async function googleApiRequestWithRetry(
  fn: () => Promise<any>,
  maxRetries = 3,
): Promise<any> {
  let lastError: any;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (e: any) {
      lastError = e;
      const status = e.status || e.code;
      // Retry on 429 (rate limit) and 5xx server errors
      if (status === 429 || (typeof status === 'number' && status >= 500)) {
        const delay = Math.min(500 * Math.pow(2, attempt), 8000);
        console.warn(`[resolveGbp] Attempt ${attempt + 1} hit ${status}, retrying in ${delay}ms…`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw e; // Non-retryable error
    }
  }
  throw lastError;
}

async function resolveGbpLocationResourceName(
  auth: Auth.OAuth2Client,
  loc: { name: string; address: string | null; googlePlaceId: string | null },
  storedMapping: string,
): Promise<string | null> {
  // If we already have the full accounts/... path, use it directly
  if (isGbpLocationResourceName(storedMapping)) {
    return storedMapping;
  }

  const placeId = loc.googlePlaceId || storedMapping;

  /**
   * STEP 1 — Enumerate accounts + locations via Account Management API.
   *
   * The reviews API (mybusiness.googleapis.com/v4/accounts/{accountId}/locations/{locationId}/reviews)
   * requires the full resource path: accounts/{accountId}/locations/{locationId}.
   *
   * The only way to get this from a Place ID is:
   *   accounts → locations (filter by locationKey.placeId) → found resource name
   *
   * This API sometimes returns 429 with quota_limit_value:"0" — in that case
   * we log the raw response and fall through to the search API.
   */
  try {
    const accountsData = await googleApiRequestWithRetry(async () => {
      const res = await googleApiRequestGet(
        auth,
        'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
      );
      // Log raw response for diagnostics
      console.log('[resolveGbp] accounts response:', JSON.stringify(res).slice(0, 500));
      return res;
    });

    const accounts: any[] = accountsData.accounts || [];
    console.log(`[resolveGbp] Found ${accounts.length} account(s)`);

    for (const account of accounts) {
      const accountName = account.name; // e.g. "accounts/123456"
      let pageToken: string | undefined;
      do {
        const params = new URLSearchParams({ pageSize: '100' });
        if (pageToken) params.set('pageToken', pageToken);
        const locsUrl = `https://mybusiness.googleapis.com/v4/${accountName}/locations?${params}`;
        const locsData = await googleApiRequestGet(auth, locsUrl);
        const locations: any[] = locsData.locations || [];

        for (const l of locations) {
          const locPlaceId = l.locationKey?.placeId || null;
          if (locPlaceId && placeId && locPlaceId === placeId) {
            console.log(`[resolveGbp] Matched by placeId: resourceName="${l.name}"`);
            return l.name; // e.g. "accounts/123456/locations/789012"
          }
        }
        pageToken = locsData.nextPageToken;
      } while (pageToken);
    }
  } catch (e: any) {
    // Log the raw error so we can see exactly what Google returned
    console.error('[resolveGbp] Account enumeration failed. Raw error:', JSON.stringify(e).slice(0, 300));
    console.warn('[resolveGbp] Falling back to googleLocations:search…');
  }

  /**
   * STEP 2 — Fallback: googleLocations:search.
   *
   * This API returns claimed locations with resource names like:
   *   { name: "accounts/123/locations/456", locationKey: { placeId: "ChIJ..." } }
   *
   * When the authenticated user OWNS the location, the name IS the correct path.
   * When the user does NOT own the location, it returns "googleLocations/ChIJ..." — not usable.
   *
   * We look for results where name starts with "accounts/" and match by placeId.
   */
  const search = async (body: object): Promise<any> => {
    const res = await googleApiRequestWithRetry(async () => {
      const data = await googleApiRequestPost(
        auth,
        'https://mybusinessbusinessinformation.googleapis.com/v1/googleLocations:search',
        body,
      );
      // Log full response for diagnostics
      console.log('[resolveGbp] search response:', JSON.stringify(data).slice(0, 800));
      return data;
    });
    return res;
  };

  const pickFromList = (list: any[], pid: string | null): string | null => {
    if (list.length === 0) return null;

    for (const g of list) {
      const locName = g.name ?? g.location?.name ?? undefined;
      const metaPid = g.location?.metadata?.placeId ?? g.metadata?.placeId ?? undefined;
      console.log(`[resolveGbp] SearchResult: name="${locName}", placeId="${metaPid}"`);
    }

    // Prefer results whose name starts with "accounts/" (user owns the location)
    const claimed = list.filter((g: any) =>
      (g.name ?? '').startsWith('accounts/') ||
      (g.location?.name ?? '').startsWith('accounts/'),
    );
    if (claimed.length > 0) {
      for (const g of claimed) {
        const name = g.name ?? g.location?.name ?? null;
        const metaPid = g.location?.metadata?.placeId ?? g.metadata?.placeId ?? null;
        if (pid && metaPid && metaPid === pid) {
          console.log(`[resolveGbp] Matched claimed location by placeId: "${name}"`);
          return name;
        }
      }
      // No exact match — return first claimed result
      const firstName = claimed[0].name ?? claimed[0].location?.name ?? null;
      console.log(`[resolveGbp] Using first claimed result (no placeId match): "${firstName}"`);
      return firstName;
    }

    // No "accounts/" results — user doesn't own any of these locations
    const firstName = list[0].name ?? list[0].location?.name ?? null;
    console.log(`[resolveGbp] No claimed results; first result is not usable: "${firstName}"`);
    return firstName;
  };

  try {
    // Try address-based search first
    const searchBody = {
      pageSize: 10,
      location: {
        title: loc.name,
        storefrontAddress: {
          regionCode: 'US',
          addressLines: [loc.address?.trim() || loc.name],
        },
      },
    };
    try {
      console.log(`[resolveGbp] Searching by location fields: name="${loc.name}", placeId="${placeId}"`);
      const data = await search(searchBody);
      const list = data.googleLocations || [];
      console.log(`[resolveGbp] Location search returned ${list.length} results`);
      const picked = pickFromList(list, placeId);
      if (picked && isGbpLocationResourceName(picked)) return picked;
    } catch (e: any) {
      console.warn(`[resolveGbp] Address search failed (${e.status}): ${e.message}`);
    }

    // Fall back to text query
    const q = `${loc.name} ${loc.address || ''}`.trim();
    if (q.length < 2) return null;
    console.log(`[resolveGbp] Searching by query: "${q}", placeId="${placeId}"`);
    const data2 = await search({ pageSize: 10, query: q });
    const list2 = data2.googleLocations || [];
    console.log(`[resolveGbp] Query search returned ${list2.length} results`);
    const picked = pickFromList(list2, placeId);
    if (picked && isGbpLocationResourceName(picked)) return picked;

    // We got results but none are in "accounts/" format — the user likely doesn't own this location
    if (list2.length > 0) {
      const resultName = list2[0].name ?? list2[0].location?.name ?? 'unknown';
      console.warn(`[resolveGbp] Results found but no accounts/ path. First result: "${resultName}". This location may not be claimed by the connected Google account.`);
    }
  } catch (e: any) {
    console.error('resolveGbpLocationResourceName error:', e);
  }

  return null;
}

// ==========================================
// EmbedSocial API Integration
// ==========================================

const EMBEDSOCIAL_API_KEY = process.env.EMBEDSOCIAL_API_KEY || '';

function embedSocialHeaders() {
  return {
    Authorization: `Bearer ${EMBEDSOCIAL_API_KEY}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

async function embedSocialFetch(path: string, options: RequestInit = {}): Promise<any> {
  // Set EMBEDSOCIAL_BASE_URL to the full base, e.g. https://app.embedsocial.com
  // Caller passes the full path (e.g. /rest/v1/sources)
  const base = (process.env.EMBEDSOCIAL_BASE_URL || 'https://embedsocial.com/app/api').replace(/\/$/, '');

  const res = await fetch(`${base}${path}`, {
    ...options,
    headers: { ...embedSocialHeaders(), ...(options.headers || {}) },
  });
  const text = await res.text();
  let json: any;
  try { json = JSON.parse(text); } catch { json = { message: text }; }
  if (!res.ok) {
    throw Object.assign(new Error(json.message || `EmbedSocial error ${res.status}`), {
      status: res.status, details: json,
    });
  }
  return json;
}

async function getEmbedSocialApiKey(tenantId?: string): Promise<string> {
  if (EMBEDSOCIAL_API_KEY) return EMBEDSOCIAL_API_KEY;
  const tenant = tenantId
    ? await prisma.tenant.findUnique({ where: { id: tenantId } })
    : await prisma.tenant.findFirst();
  return tenant?.embedSocialApiKey || '';
}

async function embedSocialFetchWithKey(apiKey: string, path: string, options: RequestInit = {}): Promise<any> {
  const base = (process.env.EMBEDSOCIAL_BASE_URL || 'https://embedsocial.com/app/api').replace(/\/$/, '');
  console.log(`[embedSocialFetch] Using base: ${base}`);
  console.log(`[embedSocialFetch] Full URL: ${base}${path}`);

  const res = await fetch(`${base}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', Accept: 'application/json', ...(options.headers || {}) },
  });
  const text = await res.text();
  let json: any;
  try { json = JSON.parse(text); } catch { json = { message: text }; }
  if (!res.ok) {
    throw Object.assign(new Error(json.message || `EmbedSocial error ${res.status}`), {
      status: res.status, details: json,
    });
  }
  return json;
}

// ==========================================
// Review data helpers (normalize EmbedSocial review → local Review)
// ==========================================

function normalizeEmbedSocialReview(review: any, locationId: string): {
  googleReviewId: string;
  reviewerName: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  embedSocialReviewId: string;
} {
  return {
    embedSocialReviewId: String(review.id),
    googleReviewId: review.id || String(review.id),
    reviewerName: review.authorName || review.author || 'Anonymous',
    rating: review.rating || 0,
    comment: review.captionText || review.message || review.text || null,
    createdAt: review.originalCreatedOn ? new Date(review.originalCreatedOn) : new Date(),
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // ==========================================
  // Health Check
  // ==========================================
  app.get('/api/health', async (req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'ok', message: 'Server is running', database: 'connected' });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // ==========================================
  // Settings API Routes (Auth Required)
  // ==========================================
  app.get('/api/settings', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: req.tenantId! },
      });
      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      res.json({
        yelpApiKey: tenant.yelpApiKey || '',
        openaiApiKey: tenant.openaiApiKey || '',
        geminiApiKey: tenant.geminiApiKey || '',
        embedSocialApiKey: tenant.embedSocialApiKey || '',
        embedSocialConnected: !!(tenant.embedSocialApiKey && tenant.embedSocialApiKey.trim()),
        tenantName: tenant.name,
      });
    } catch (error) {
      console.error('Fetch settings error:', error);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  app.post('/api/settings', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { yelpApiKey, openaiApiKey, geminiApiKey, embedSocialApiKey, tenantName } = req.body;

      const updated = await prisma.tenant.update({
        where: { id: req.tenantId! },
        data: {
          yelpApiKey: yelpApiKey || null,
          openaiApiKey: openaiApiKey || null,
          geminiApiKey: geminiApiKey || null,
          embedSocialApiKey: embedSocialApiKey || null,
          isConfigured: !!(embedSocialApiKey?.trim()),
          ...(tenantName && { name: tenantName }),
        },
      });
      res.json(updated);
    } catch (error) {
      console.error('Update settings error:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });

  // Test EmbedSocial connection
  app.post('/api/settings/test-embedsocial', async (req, res) => {
    try {
      const { apiKey } = req.body;
      if (!apiKey) {
        return res.status(400).json({ error: 'API key is required' });
      }

      const base = 'https://embedsocial.com/app/api';
      const response = await fetch(`${base}/rest/v1/listings`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (!response.ok) {
        return res.status(401).json({ error: 'Invalid API key or connection failed' });
      }

      const data = await response.json();
      const listings = Array.isArray(data) ? data : (data.data || []);
      const listingCount = listings.length;

      res.json({
        success: true,
        listingCount,
        message: `Connected! Found ${listingCount} listings.`,
      });
    } catch (error: any) {
      console.error('Test EmbedSocial connection error:', error);
      res.status(500).json({ error: 'Connection test failed', details: error.message });
    }
  });

  // ==========================================
  // Google OAuth Routes
  // ==========================================

  app.get('/api/auth/google', async (req, res) => {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return res.status(500).json({
        error: 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file.',
      });
    }

    const { OAuth2Client } = Auth;
    const oauth2Client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, `${APP_URL}/api/auth/google/callback`);
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent',
    });

    res.json({ authUrl });
  });

  app.get('/api/auth/google/callback', async (req, res) => {
    const { code, error } = req.query;

    if (error) {
      return res.redirect(`${APP_URL}?googleAuthError=${encodeURIComponent(String(error))}`);
    }

    if (!code || typeof code !== 'string') {
      return res.redirect(`${APP_URL}?googleAuthError=missing_code`);
    }

    try {
      const { OAuth2Client } = Auth;
      const oauth2Client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, `${APP_URL}/api/auth/google/callback`);
      const { tokens } = await oauth2Client.getToken(code);

      // Get Google user info
      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const googleUser = await userInfoRes.json();
      console.log('[google/callback] Google user:', googleUser.email);

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

      // Save Google tokens to tenant
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          googleAccessToken: tokens.access_token || '',
          googleRefreshToken: tokens.refresh_token || tenant.googleRefreshToken || '',
          googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          isConfigured: true,
        },
      });

      // Generate JWT token
      const jwtToken = generateToken(user.id, tenant.id);

      // Redirect to app with token
      res.redirect(`${APP_URL}/?token=${jwtToken}&tenantId=${tenant.id}`);
    } catch (err) {
      console.error('Google OAuth callback error:', err);
      res.redirect(`${APP_URL}?googleAuthError=token_exchange_failed`);
    }
  });

  app.post('/api/auth/google/disconnect', async (req, res) => {
    try {
      let tenant = await prisma.tenant.findFirst();
      if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

      await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          googleAccessToken: null,
          googleRefreshToken: null,
          googleTokenExpiry: null,
          googleBusinessAccountId: null,
          locationMappings: '{}',
          isConfigured: !!(tenant.yelpApiKey || tenant.openaiApiKey || tenant.geminiApiKey),
        },
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Google disconnect error:', error);
      res.status(500).json({ error: 'Failed to disconnect Google account' });
    }
  });

  app.get('/api/auth/google/status', async (req, res) => {
    try {
      const tenant = await prisma.tenant.findFirst();
      const connected = !!(tenant?.googleAccessToken && tenant?.googleRefreshToken);
      res.json({ connected });
    } catch (error) {
      res.status(500).json({ error: 'Failed to check Google status' });
    }
  });

  // ==========================================
  // Google Business Profile - 根据 Place ID 获取商家信息 (Business Information API)
  // ==========================================

  // 搜索地点 - 使用 Google Places API (这个API容易申请)
  app.get('/api/google/places/search', async (req, res) => {
    try {
      const { query } = req.query;
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Search query is required' });
      }

      const tenant = await prisma.tenant.findFirst();
      const apiKey = tenant?.googlePlacesApiKey || process.env.GOOGLE_PLACES_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ 
          error: 'Google Places API key not configured. Please set GOOGLE_PLACES_API_KEY in .env file.',
          setupRequired: true 
        });
      }

      // 使用 Google Places API Text Search
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`
      );
      const data = await response.json();

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        throw new Error(`Places API error: ${data.status}`);
      }

      const results = (data.results || []).map((place: any) => ({
        placeId: place.place_id,
        name: place.name,
        address: place.formatted_address,
        location: place.geometry?.location,
        rating: place.rating,
        userRatingsTotal: place.user_ratings_total,
        types: place.types,
      }));

      res.json(results);
    } catch (error: any) {
      console.error('Places search error:', error);
      res.status(500).json({ error: 'Failed to search places', details: error.message });
    }
  });

  // 根据 Place ID 获取详细信息
  app.get('/api/google/places/:placeId', async (req, res) => {
    try {
      const { placeId } = req.params;
      if (!placeId) {
        return res.status(400).json({ error: 'Place ID is required' });
      }

      const tenant = await prisma.tenant.findFirst();
      const apiKey = tenant?.googlePlacesApiKey || process.env.GOOGLE_PLACES_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ 
          error: 'Google Places API key not configured. Please set GOOGLE_PLACES_API_KEY in .env file.',
          setupRequired: true 
        });
      }

      // 使用 Google Places API Details
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,geometry,formatted_phone_number,opening_hours,rating,user_ratings_total,photos,website,types&key=${apiKey}`
      );
      const data = await response.json();

      if (data.status !== 'OK') {
        throw new Error(`Places API error: ${data.status}`);
      }

      const place = data.result;
      const result = {
        placeId: place.place_id,
        name: place.name,
        address: place.formatted_address,
        phone: place.formatted_phone_number,
        website: place.website,
        location: place.geometry?.location,
        rating: place.rating,
        userRatingsTotal: place.user_ratings_total,
        types: place.types,
        openingHours: place.opening_hours?.weekday_text || [],
        photoReferences: (place.photos || []).slice(0, 5).map((p: any) => p.photo_reference),
      };

      res.json(result);
    } catch (error: any) {
      console.error('Place details error:', error);
      res.status(500).json({ error: 'Failed to get place details', details: error.message });
    }
  });

  // 验证用户提供的 Place ID
  app.post('/api/google/validate-place-id', async (req, res) => {
    try {
      const { placeId } = req.body;
      if (!placeId) {
        return res.status(400).json({ error: 'Place ID is required' });
      }

      const tenant = await prisma.tenant.findFirst();
      const apiKey = tenant?.googlePlacesApiKey || process.env.GOOGLE_PLACES_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ 
          error: 'Google Places API key not configured.',
          setupRequired: true 
        });
      }

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=place_id,name,formatted_address&key=${apiKey}`
      );
      const data = await response.json();

      if (data.status !== 'OK') {
        return res.status(400).json({ 
          valid: false, 
          error: 'Invalid Place ID or Place not found',
          status: data.status 
        });
      }

      res.json({
        valid: true,
        place: {
          placeId: data.result.place_id,
          name: data.result.name,
          address: data.result.formatted_address,
        }
      });
    } catch (error: any) {
      console.error('Validate place ID error:', error);
      res.status(500).json({ error: 'Failed to validate Place ID', details: error.message });
    }
  });

  app.post('/api/google/locations/map', async (req, res) => {
    try {
      const { localLocationId, googleLocationId } = req.body;
      if (!localLocationId || !googleLocationId) {
        return res.status(400).json({ error: 'localLocationId and googleLocationId are required' });
      }

      const tenant = await prisma.tenant.findFirst();
      if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

      const mappings: Record<string, string> = JSON.parse(tenant.locationMappings || '{}');
      mappings[localLocationId] = googleLocationId;

      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { locationMappings: JSON.stringify(mappings) },
      });

      await prisma.location.update({
        where: { id: localLocationId },
        data: { googlePlaceId: googleLocationId },
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Map location error:', error);
      res.status(500).json({ error: 'Failed to map location' });
    }
  });

  // ==========================================
  // Reviews API (REST API 直连 Google Business Profile)
  // ==========================================

  app.get('/api/reviews', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const reviews = await prisma.review.findMany({
        where: { location: { tenantId: req.tenantId! } },
        include: { location: true },
        orderBy: { createdAt: 'desc' },
      });

      // Transform to component format
      const transformedReviews = reviews.map(r => ({
        id: r.id,
        author: r.reviewerName,
        rating: r.rating,
        location: r.location?.name || 'Unknown',
        date: new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        text: r.comment || '',
        replied: !!r.replyText,
        hasReply: r.isRepliedByAI,
        replyText: r.replyText || undefined,
      }));

      // Calculate filters
      const total = reviews.length;
      const waiting = reviews.filter(r => !r.replyText).length;
      const replied = reviews.filter(r => r.replyText).length;
      const ai = reviews.filter(r => r.isRepliedByAI).length;

      res.json({
        reviews: transformedReviews,
        filters: { all: total, waiting, replied, ai }
      });
    } catch (error) {
      console.error('Fetch reviews error:', error);
      res.status(500).json({ error: 'Failed to fetch reviews' });
    }
  });

  // Sync reviews from EmbedSocial
  app.post('/api/reviews/sync', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const apiKey = await getEmbedSocialApiKey(req.tenantId);
      if (!apiKey) {
        return res.status(401).json({
          error: 'EmbedSocial API key not configured. Please add it in Settings → EmbedSocial.',
        });
      }

      const tenant = await prisma.tenant.findFirst();
      if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

      const dbLocations = await prisma.location.findMany({ where: { tenantId: tenant.id } });

      // If no locations have embedSocialLocationId set, sync all reviews from EmbedSocial
      // and associate by name matching
      const locationsWithId = dbLocations.filter((l) => l.embedSocialLocationId);
      const locationsWithoutId = dbLocations.filter((l) => !l.embedSocialLocationId);

      if (locationsWithId.length === 0 && locationsWithoutId.length === 0) {
        return res.json({
          success: true, imported: 0,
          message: 'No locations found. Add a location in Listings first.',
        });
      }

      let totalImported = 0;
      const errors: string[] = [];

      // --- Sync by explicit embedSocialLocationId ---
      for (const loc of locationsWithId) {
        try {
          console.log(`[syncReviews] Syncing from EmbedSocial for locationId=${loc.embedSocialLocationId}`);

          // Use sourceId parameter to filter by specific listing
          const reviewsData = await embedSocialFetchWithKey(
            apiKey,
            `/rest/v1/items?sourceId=${loc.embedSocialLocationId}&pageSize=50`,
          );

          const reviewList: any[] = Array.isArray(reviewsData) ? reviewsData : (reviewsData.data || reviewsData.items || []);
          console.log(`[syncReviews] Got ${reviewList.length} reviews for location "${loc.name}"`);

          for (const r of reviewList) {
            const normalized = normalizeEmbedSocialReview(r, loc.id);
            const existing = await prisma.review.findFirst({
              where: {
                locationId: loc.id,
                OR: [
                  { embedSocialReviewId: normalized.embedSocialReviewId },
                  { googleReviewId: normalized.googleReviewId },
                ],
              },
            });

            if (existing) {
              if (existing.comment !== normalized.comment || existing.rating !== normalized.rating) {
                await prisma.review.update({
                  where: { id: existing.id },
                  data: { comment: normalized.comment, rating: normalized.rating },
                });
              }
            } else {
              await prisma.review.create({
                data: {
                  locationId: loc.id,
                  ...normalized,
                },
              });
              totalImported++;
            }
          }
        } catch (e: any) {
          const msg = `${loc.name}: ${e.message}`;
          errors.push(msg);
          console.error(`[syncReviews] ${msg}`);
        }
      }

      // --- Sync ALL reviews (when no location_id set) and match by location name ---
      if (locationsWithoutId.length > 0) {
        try {
          // Try to fetch all Google reviews
          let allReviews: any = { items: [] };
          try {
            allReviews = await embedSocialFetchWithKey(apiKey, `/rest/v1/items?source_names[]=Google`);
          } catch {
            // Fallback: try without source_names filter
            allReviews = await embedSocialFetchWithKey(apiKey, `/rest/v1/items`);
          }

          const reviewList: any[] = Array.isArray(allReviews) ? allReviews : (allReviews.data || allReviews.items || []);
          console.log(`[syncReviews] Got ${reviewList.length} total reviews from EmbedSocial`);

          for (const r of reviewList) {
            // Extract source name from review
            const reviewSourceName = r.sourceName || '';
            // Try to find a matching local location by name
            const matchedLoc = locationsWithoutId.find(
              (l) => l.name.toLowerCase() === reviewSourceName.toLowerCase() ||
                     reviewSourceName.toLowerCase().includes(l.name.toLowerCase()) ||
                     l.name.toLowerCase().includes(reviewSourceName.toLowerCase())
            ) || locationsWithoutId[0]; // fallback to first

            const normalized = normalizeEmbedSocialReview(r, matchedLoc?.id || '');

            const existing = await prisma.review.findFirst({
              where: {
                locationId: matchedLoc?.id || '',
                OR: [
                  { embedSocialReviewId: normalized.embedSocialReviewId },
                  { googleReviewId: normalized.googleReviewId },
                ],
              },
            });

            if (!existing && matchedLoc) {
              await prisma.review.create({ data: { locationId: matchedLoc.id, ...normalized } });
              totalImported++;
            }
          }
        } catch (e: any) {
          errors.push(`EmbedSocial fetch: ${e.message}`);
        }
      }

      res.json({
        success: true,
        imported: totalImported,
        message: totalImported > 0
          ? `Successfully imported ${totalImported} new review(s).`
          : errors.length > 0
            ? 'Sync finished with warnings.'
            : 'Reviews are up to date.',
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error: any) {
      console.error('Sync reviews error:', error);
      res.status(500).json({ error: 'Failed to sync reviews', details: error.message });
    }
  });

  // Reply to review via EmbedSocial
  // NOTE: review ID comes from EmbedSocial API (not from Prisma), so we call EmbedSocial directly
  app.post('/api/reviews/:id/reply', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { id: esReviewId } = req.params;
      const { replyText } = req.body;

      if (!replyText?.trim()) {
        return res.status(400).json({ error: 'Reply text is required' });
      }

      const apiKey = await getEmbedSocialApiKey(req.tenantId);
      if (!apiKey) {
        return res.status(401).json({
          error: 'EmbedSocial API key not configured. Please add it in Settings.',
        });
      }

      // Call EmbedSocial reply API directly using the review ID from the frontend
      try {
        await embedSocialFetchWithKey(
          apiKey,
          `/rest/v1/items/${esReviewId}/replies`,
          {
            method: 'POST',
            body: JSON.stringify({ comment: replyText.trim() }),
          },
        );
      } catch (e: any) {
        console.error(`[reply] EmbedSocial reply failed (${e.status}): ${e.message}`);
        // Surface EmbedSocial errors to the client
        const errBody = e.details || {};
        const errMsg = errBody.title || errBody.message || e.message || 'Failed to submit reply to EmbedSocial';
        return res.status(e.status || 500).json({ error: errMsg });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('Submit reply error:', error);
      res.status(500).json({ error: 'Failed to submit reply', details: error.message });
    }
  });

  // ==========================================
  // EmbedSocial API Endpoints (Auth Required)
  // ==========================================

  // Verify EmbedSocial API key and list organizations
  app.get('/api/embedsocial/organizations', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const apiKey = await getEmbedSocialApiKey(req.tenantId);
      if (!apiKey) {
        return res.status(401).json({ error: 'EmbedSocial API key not configured.' });
      }
      const data = await embedSocialFetchWithKey(apiKey, '/rest/v1/organizations');
      res.json(data);
    } catch (error: any) {
      console.error('EmbedSocial organizations error:', error);
      res.status(500).json({ error: 'Failed to fetch organizations', details: error.message });
    }
  });

  // List locations (sources) from EmbedSocial with full details
  // Only returns listings that belong to this tenant
  app.get('/api/embedsocial/locations', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const apiKey = await getEmbedSocialApiKey(req.tenantId);
      if (!apiKey) {
        return res.status(401).json({ error: 'EmbedSocial API key not configured.' });
      }

      // Get this tenant's connected listing IDs from TenantListing
      const tenantListings = await prisma.tenantListing.findMany({
        where: { tenantId: req.tenantId!, status: 'active' },
        select: { embedSocialListingId: true },
      });
      const tenantSourceIds = tenantListings.map(l => l.embedSocialListingId).filter(Boolean);

      if (tenantSourceIds.length === 0) {
        return res.json([]);
      }

      // Fetch from EmbedSocial with sourceId filter - only get user's connected listings
      const allEmbedListings: any[] = [];
      for (const sourceId of tenantSourceIds) {
        try {
          const data = await embedSocialFetchWithKey(apiKey, `/rest/v1/listings/${sourceId}`);
          if (data && data.id) {
            allEmbedListings.push(data);
          }
        } catch (e) {
          console.log(`[locations] Failed to fetch listing ${sourceId}:`, (e as any).message);
        }
      }

      // Enrich with basic data (totalReviews, averageRating from list call)
      try {
        const listData = await embedSocialFetchWithKey(apiKey, `/rest/v1/listings?page=1&pageSize=100`);
        const allListings: any[] = Array.isArray(listData) ? listData : (listData.data || []);
        for (const listing of allEmbedListings) {
          const match = allListings.find(l => l.id === listing.id);
          if (match) {
            listing.totalReviews = match.totalReviews;
            listing.averageRating = match.averageRating;
          }
        }
      } catch (e) {
        console.log('[locations] Could not enrich with list data:', (e as any).message);
      }

      res.json(allEmbedListings);
    } catch (error: any) {
      console.error('EmbedSocial sources error:', error);
      res.status(500).json({ error: 'Failed to fetch sources', details: error.message });
    }
  });

  // Sync listings from EmbedSocial - fetches all listings from API and saves to TenantListing
  app.post('/api/embedsocial/listings/sync', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const apiKey = await getEmbedSocialApiKey(req.tenantId);
      if (!apiKey) {
        return res.status(401).json({ error: 'EmbedSocial API key not configured.' });
      }

      console.log('[sync-listings] Starting sync for tenant:', req.tenantId);

      // Fetch all listings from EmbedSocial
      const allListings: any[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        try {
          const data = await embedSocialFetchWithKey(apiKey, `/rest/v1/listings?page=${page}&pageSize=50`);
          const listings: any[] = Array.isArray(data) ? data : (data.data || []);
          if (listings.length === 0) break;
          allListings.push(...listings);
          hasMore = listings.length === 50;
          page++;
        } catch (e) {
          console.error('[sync-listings] Error fetching page:', e);
          break;
        }
      }

      console.log(`[sync-listings] Found ${allListings.length} listings from EmbedSocial`);

      if (allListings.length === 0) {
        return res.json({ message: 'No listings found in EmbedSocial', synced: 0 });
      }

      // Get existing tenant listings
      const existingListings = await prisma.tenantListing.findMany({
        where: { tenantId: req.tenantId! },
        select: { embedSocialListingId: true, name: true },
      });
      const existingIds = new Set(existingListings.map(l => l.embedSocialListingId));

      // Add new listings (only those not already connected)
      let synced = 0;
      for (const listing of allListings) {
        if (!existingIds.has(listing.id)) {
          await prisma.tenantListing.create({
            data: {
              tenantId: req.tenantId!,
              embedSocialListingId: listing.id,
              name: listing.name || 'Unknown',
              address: listing.address || '',
              phoneNumber: listing.phoneNumber || '',
              websiteUrl: listing.websiteUrl || '',
              googleId: listing.googleId || '',
              totalReviews: listing.totalReviews || 0,
              averageRating: listing.averageRating || 0,
              status: 'active',
            },
          });
          synced++;
          console.log(`[sync-listings] Added listing: ${listing.name} (${listing.id})`);
        }
      }

      // Update existing listings with latest data
      for (const listing of allListings) {
        if (existingIds.has(listing.id)) {
          await prisma.tenantListing.updateMany({
            where: {
              tenantId: req.tenantId!,
              embedSocialListingId: listing.id,
            },
            data: {
              name: listing.name || 'Unknown',
              address: listing.address || listing.address || '',
              phoneNumber: listing.phoneNumber || '',
              websiteUrl: listing.websiteUrl || '',
              totalReviews: listing.totalReviews || 0,
              averageRating: listing.averageRating || 0,
              status: 'active',
            },
          });
        }
      }

      console.log(`[sync-listings] Synced ${synced} new listings`);

      res.json({
        message: `Successfully synced listings`,
        totalFound: allListings.length,
        newlyAdded: synced,
        existingUpdated: allListings.length - synced,
      });
    } catch (error: any) {
      console.error('Sync listings error:', error);
      res.status(500).json({ error: 'Failed to sync listings', details: error.message });
    }
  });

  // Get listing metrics from EmbedSocial (formatted for dashboard)
  app.get('/api/embedsocial/metrics', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const apiKey = await getEmbedSocialApiKey(req.tenantId);
      if (!apiKey) {
        return res.status(401).json({ error: 'EmbedSocial API key not configured.' });
      }

      const period = (req.query.period as string) || '30days';
      let days = 30;
      if (period === '7days') days = 7;
      else if (period === '90days') days = 90;
      else if (period === '12months') days = 365;

      // Initialize totals
      let totalSearchViews = 0;
      let totalMapViews = 0;
      let totalWebsiteClicks = 0;
      let totalDirectionRequests = 0;
      let totalPhoneCalls = 0;
      let publishedPosts = 0;
      let totalReviews = 0;
      let averageRating = 0;

      // Get this tenant's connected listing IDs
      const tenantListings = await prisma.tenantListing.findMany({
        where: { tenantId: req.tenantId!, status: 'active' },
        select: { embedSocialListingId: true },
      });
      const tenantSourceIds = tenantListings.map(l => l.embedSocialListingId).filter(Boolean);

      // Get listings from EmbedSocial - only this tenant's connected listings
      let listings: any[] = [];
      try {
        // First get all listings and filter
        const listingsData = await embedSocialFetchWithKey(apiKey, '/rest/v1/listings');
        console.log('[metrics] Listings raw response:', JSON.stringify(listingsData)?.slice(0, 1000));

        const allListings: any[] = Array.isArray(listingsData) ? listingsData : (listingsData.data || listingsData.listings || []);
        // Filter to only this tenant's connected listings
        listings = allListings.filter(l => tenantSourceIds.includes(l.id));
        console.log('[metrics] Filtered listings count:', listings.length);

        // Extract data from each listing
        for (const listing of listings) {
          totalReviews += listing.totalReviews || 0;
          averageRating = listing.averageRating || averageRating;

          // listing_metrics API - use embedSocial listing id as sourceId
          const sourceId = listing.id;
          if (!sourceId) continue;

          try {
            // GET /rest/v1/listing_metrics?startDate=DD-MM-YYYY&endDate=DD-MM-YYYY&sourceId=xxx
            const today = new Date();
            const startDate = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);
            const startDateStr = `${String(startDate.getDate()).padStart(2, '0')}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${startDate.getFullYear()}`;
            const endDateStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;

            const metricsRes = await embedSocialFetchWithKey(apiKey, `/rest/v1/listing_metrics?startDate=${startDateStr}&endDate=${endDateStr}&sourceId=${sourceId}&pageSize=100`);
            console.log(`[metrics] Listing metrics response for sourceId ${sourceId} (period=${period}):`, JSON.stringify(metricsRes)?.slice(0, 1000));

            if (metricsRes && metricsRes.listings && metricsRes.listings.length > 0) {
              for (const m of metricsRes.listings) {
                // searchViews = googleSearchDesktop + googleSearchMobile
                const searchViews = (m.googleSearchDesktop || 0) + (m.googleSearchMobile || 0);
                // mapViews = googleMapsDesktop + googleMapsMobile
                const mapViews = (m.googleMapsDesktop || 0) + (m.googleMapsMobile || 0);

                totalSearchViews += searchViews;
                totalMapViews += mapViews;
                totalWebsiteClicks += m.websiteClicks || 0;
                totalDirectionRequests += m.directions || 0;
                totalPhoneCalls += m.callClicks || 0;
              }
            }
          } catch (e: any) {
            console.log(`[metrics] Listing metrics fetch error for sourceId ${sourceId}:`, e.message);
          }

          if (listing.status === 'published' || listing.isPublished) publishedPosts++;
        }
      } catch (e: any) {
        console.log('[metrics] Listings fetch error:', e.message);
      }

      // Calculate response metrics from reviews in database - use req.tenantId
      let responsePercentage = 0;
      let avgResponseTime = 0;
      let avgPostingTime = 1;

      const reviews = await prisma.review.findMany({
        where: { location: { tenantId: req.tenantId! } },
      });
      const totalDbReviews = reviews.length;
      const repliedReviews = reviews.filter(r => r.replyText).length;
      responsePercentage = totalDbReviews > 0 ? Math.round((repliedReviews / totalDbReviews) * 100) : 0;

      // Return formatted metrics
      const formattedMetrics = {
        searchViews: totalSearchViews,
        mapViews: totalMapViews,
        websiteClicks: totalWebsiteClicks,
        directionRequests: totalDirectionRequests,
        phoneCalls: totalPhoneCalls,
        publishedPosts: publishedPosts,
        avgPostingTime: avgPostingTime,
        avgResponseTime: avgResponseTime,
        responsePercentage: responsePercentage,
        // 也返回从 listing 获取的数据
        totalReviews,
        averageRating,
      };

      console.log('[metrics] Returning real data:', formattedMetrics);
      res.json(formattedMetrics);
    } catch (error: any) {
      console.error('EmbedSocial metrics error:', error);
      res.json({
        searchViews: 0,
        mapViews: 0,
        websiteClicks: 0,
        directionRequests: 0,
        phoneCalls: 0,
        publishedPosts: 0,
        avgPostingTime: 0,
        avgResponseTime: 0,
        responsePercentage: 0,
        totalReviews: 0,
        averageRating: 0,
      });
    }
  });

  // Get chart data (time series) from EmbedSocial
  app.get('/api/embedsocial/chart-data', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const apiKey = await getEmbedSocialApiKey(req.tenantId);
      if (!apiKey) {
        return res.status(401).json({ error: 'EmbedSocial API key not configured.' });
      }

      const { period = '30days' } = req.query;

      // Determine date range based on period
      const now = new Date();
      let days = 30;
      if (period === '7days') days = 7;
      else if (period === '90days') days = 90;
      else if (period === '12months') days = 365;

      console.log(`[chart-data] Fetching data for period: ${period}, days: ${days}`);

      // Get this tenant's connected listing IDs
      const tenantListings = await prisma.tenantListing.findMany({
        where: { tenantId: req.tenantId!, status: 'active' },
        select: { embedSocialListingId: true },
      });
      const tenantSourceIds = tenantListings.map(l => l.embedSocialListingId).filter(Boolean);

      // Only use this tenant's connected source IDs
      const sourceIdsToTry: string[] = [...new Set(tenantSourceIds)];

      // Try to fetch daily metrics for each source
      const impressions: any[] = [];
      const actions: any[] = [];
      let hasRealData = false;

      // For 12months, use monthly aggregation instead of daily to reduce API calls
      if (period === '12months') {
        // Get monthly data for last 12 months
        const monthlyPromises: Promise<any>[] = [];
        for (let m = 11; m >= 0; m--) {
          const monthDate = new Date(now.getFullYear(), now.getMonth() - m, 1);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() - m + 1, 0);
          const startDateStr = `${String(monthDate.getDate()).padStart(2, '0')}-${String(monthDate.getMonth() + 1).padStart(2, '0')}-${monthDate.getFullYear()}`;
          const endDateStr = `${String(monthEnd.getDate()).padStart(2, '0')}-${String(monthEnd.getMonth() + 1).padStart(2, '0')}-${monthEnd.getFullYear()}`;

          for (const sourceId of sourceIdsToTry) {
            monthlyPromises.push(
              embedSocialFetchWithKey(apiKey, `/rest/v1/listing_metrics?startDate=${startDateStr}&endDate=${endDateStr}&sourceId=${sourceId}`)
                .then((monthRes: any) => {
                  if (monthRes && monthRes.listings && monthRes.listings.length > 0) {
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    return {
                      month: monthNames[monthDate.getMonth()],
                      year: monthDate.getFullYear().toString().slice(-2),
                      data: monthRes.listings[0],
                    };
                  }
                  return null;
                })
                .catch(() => null)
            );
          }
        }

        const monthlyResults = await Promise.all(monthlyPromises);
        // Group by month
        const monthData: Record<string, any> = {};
        for (const r of monthlyResults) {
          if (r) {
            const key = `${r.month} '${r.year}`;
            if (!monthData[key]) {
              monthData[key] = { date: key, searchViews: 0, mapViews: 0, websiteClicks: 0, directionRequests: 0, phoneCalls: 0 };
            }
            const m = r.data;
            monthData[key].searchViews += (m.googleSearchDesktop || 0) + (m.googleSearchMobile || 0);
            monthData[key].mapViews += (m.googleMapsDesktop || 0) + (m.googleMapsMobile || 0);
            monthData[key].websiteClicks += m.websiteClicks || 0;
            monthData[key].directionRequests += m.directions || 0;
            monthData[key].phoneCalls += m.callClicks || 0;
          }
        }

        const sortedMonths = Object.keys(monthData).sort((a, b) => {
          const order = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          return order.indexOf(a.split(" '")[0]) - order.indexOf(b.split(" '")[0]);
        });

        if (sortedMonths.length > 0) {
          hasRealData = true;
          for (const month of sortedMonths) {
            const d = monthData[month];
            impressions.push({ date: d.date, searchViews: d.searchViews, mapViews: d.mapViews });
            actions.push({ date: d.date, websiteClicks: d.websiteClicks, directionRequests: d.directionRequests, phoneCalls: d.phoneCalls });
          }
        }
      } else if (sourceIdsToTry.length > 0) {
        for (const sourceId of sourceIdsToTry) {
          try {
            // GET /rest/v1/listing_metrics?startDate=DD-MM-YYYY&endDate=DD-MM-YYYY&sourceId=xxx
            const today = new Date();
            const periodDays = days;
            const startDate = new Date(today.getTime() - periodDays * 24 * 60 * 60 * 1000);
            const startDateStr = `${String(startDate.getDate()).padStart(2, '0')}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${startDate.getFullYear()}`;
            const endDateStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;

            const dailyRes = await embedSocialFetchWithKey(apiKey, `/rest/v1/listing_metrics?startDate=${startDateStr}&endDate=${endDateStr}&sourceId=${sourceId}&pageSize=200`);
            console.log(`[chart-data] Metrics for sourceId ${sourceId}:`, JSON.stringify(dailyRes)?.slice(0, 500));

            if (dailyRes && dailyRes.listings && dailyRes.listings.length > 0) {
              hasRealData = true;
              // The API returns aggregated data for the entire period
              // We need to make separate API calls for each day to get daily data
              const dailyDataPromises: Promise<any>[] = [];
              for (let i = days - 1; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                const dayStart = `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
                const dayEnd = dayStart; // Same day for daily data

                dailyDataPromises.push(
                  embedSocialFetchWithKey(apiKey, `/rest/v1/listing_metrics?startDate=${dayStart}&endDate=${dayEnd}&sourceId=${sourceId}`)
                    .then((dayRes: any) => {
                      if (dayRes && dayRes.listings && dayRes.listings.length > 0) {
                        const m = dayRes.listings[0];
                        return {
                          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                          searchViews: (m.googleSearchDesktop || 0) + (m.googleSearchMobile || 0),
                          mapViews: (m.googleMapsDesktop || 0) + (m.googleMapsMobile || 0),
                          websiteClicks: m.websiteClicks || 0,
                          directionRequests: m.directions || 0,
                          phoneCalls: m.callClicks || 0,
                        };
                      }
                      return null;
                    })
                    .catch(() => null)
                );
              }

              const dailyDataResults = await Promise.all(dailyDataPromises);
              for (const d of dailyDataResults) {
                if (d) {
                  impressions.push({ date: d.date, searchViews: d.searchViews, mapViews: d.mapViews });
                  actions.push({ date: d.date, websiteClicks: d.websiteClicks, directionRequests: d.directionRequests, phoneCalls: d.phoneCalls });
                }
              }
              break; // Got data, no need to try other IDs
            }
          } catch (e: any) {
            console.log(`[chart-data] Metrics fetch error for sourceId ${sourceId}:`, e.message);
          }
        }
      }

      // If no real data: return empty chart
      if (!hasRealData) {
        if (tenantSourceIds.length === 0) {
          console.log('[chart-data] Tenant has no connected listings, returning empty chart');
          return res.json({ impressions: [], actions: [] });
        }
        console.log('[chart-data] No real data yet, returning empty chart');
        return res.json({ impressions: [], actions: [] });
      }

      console.log(`[chart-data] Returning impressions: ${impressions.length}, actions: ${actions.length}`);
      res.json({ impressions, actions });
    } catch (error: any) {
      console.error('EmbedSocial chart data error:', error);
      res.status(500).json({ error: 'Failed to fetch chart data', details: error.message });
    }
  });

  // Helper: get chart data for a given period (used by PDF generator)
  async function getReportChartData(tenantId: string, apiKey: string, days: number) {
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const sourceIdsPromise = prisma.tenantListing.findMany({
      where: { tenantId, status: 'active' },
      select: { embedSocialListingId: true },
    });

    // Build daily data array
    const dailyData: Record<string, any> = {};
    for (let d = 0; d < days; d++) {
      const date = new Date(startDate.getTime() + d * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      dailyData[dateStr] = {
        date: dateStr,
        googleMapsDesktop: 0,
        googleSearchDesktop: 0,
        googleMapsMobile: 0,
        googleSearchMobile: 0,
        directions: 0,
        callClicks: 0,
        websiteClicks: 0,
      };
    }

    // Fetch daily data for each sourceId
    const sourceIds = (await sourceIdsPromise)
      .map(s => s.embedSocialListingId)
      .filter(Boolean);

    for (const sourceId of sourceIds) {
      for (let d = 0; d < days; d++) {
        const date = new Date(startDate.getTime() + d * 24 * 60 * 60 * 1000);
        const dayStart = `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
        const dayEnd = dayStart;

        try {
          const dailyRes: any = await embedSocialFetchWithKey(apiKey,
            `/rest/v1/listing_metrics?startDate=${dayStart}&endDate=${dayEnd}&sourceId=${sourceId}&pageSize=5`
          );
          if (dailyRes && dailyRes.listings && dailyRes.listings.length > 0) {
            const m = dailyRes.listings[0];
            const dateStr = date.toISOString().split('T')[0];
            if (dailyData[dateStr]) {
              dailyData[dateStr].googleMapsDesktop += m.googleMapsDesktop || 0;
              dailyData[dateStr].googleSearchDesktop += m.googleSearchDesktop || 0;
              dailyData[dateStr].googleMapsMobile += m.googleMapsMobile || 0;
              dailyData[dateStr].googleSearchMobile += m.googleSearchMobile || 0;
              dailyData[dateStr].directions += m.directions || 0;
              dailyData[dateStr].callClicks += m.callClicks || 0;
              dailyData[dateStr].websiteClicks += m.websiteClicks || 0;
            }
          }
        } catch (_) { /* ignore individual day errors */ }
      }
    }

    return Object.values(dailyData);
  }

  // Generate GBP Performance PDF report
  app.get('/api/reports/gbp-pdf', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const apiKey = await getEmbedSocialApiKey(req.tenantId!);
      if (!apiKey) return res.status(401).json({ error: 'EmbedSocial API key not configured.' });

      const { startDate: startDateStr, endDate: endDateStr, sourceId } = req.query as Record<string, string>;

      // Fetch metrics for the date range
      const startD = new Date(startDateStr);
      const endD = new Date(endDateStr);
      const days = Math.max(1, Math.round((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24)) + 1);

      // Fetch listings to get business name
      const listingsData: any = await embedSocialFetchWithKey(apiKey, '/rest/v1/listings');
      const allListings: any[] = Array.isArray(listingsData) ? listingsData : (listingsData.data || listingsData.listings || []);
      const listing = allListings.find((l: any) => l.id === sourceId) || allListings[0] || {};
      const businessName = listing.name || 'Business';

      // Get daily data
      const dailyData = await getReportChartData(req.tenantId!, apiKey, days);

      // Compute monthly aggregates for search (4 separate metrics)
      const monthlySearch: Record<string, any> = {};
      for (const d of dailyData) {
        const month = d.date.substring(0, 7);
        if (!monthlySearch[month]) monthlySearch[month] = {
          googleMapsDesktop: 0, googleSearchDesktop: 0,
          googleMapsMobile: 0, googleSearchMobile: 0,
          directions: 0, callClicks: 0, websiteClicks: 0,
        };
        monthlySearch[month].googleMapsDesktop += d.googleMapsDesktop || 0;
        monthlySearch[month].googleSearchDesktop += d.googleSearchDesktop || 0;
        monthlySearch[month].googleMapsMobile += d.googleMapsMobile || 0;
        monthlySearch[month].googleSearchMobile += d.googleSearchMobile || 0;
        monthlySearch[month].directions += d.directions || 0;
        monthlySearch[month].callClicks += d.callClicks || 0;
        monthlySearch[month].websiteClicks += d.websiteClicks || 0;
      }

      const months = Object.keys(monthlySearch).sort();

      // Compute summarized totals for KPI cards
      const totalMapsDesktop = months.reduce((s, m) => s + (monthlySearch[m].googleMapsDesktop || 0), 0);
      const totalSearchDesktop = months.reduce((s, m) => s + (monthlySearch[m].googleSearchDesktop || 0), 0);
      const totalMapsMobile = months.reduce((s, m) => s + (monthlySearch[m].googleMapsMobile || 0), 0);
      const totalSearchMobile = months.reduce((s, m) => s + (monthlySearch[m].googleSearchMobile || 0), 0);
      const totalDirections = months.reduce((s, m) => s + (monthlySearch[m].directions || 0), 0);
      const totalCallClicks = months.reduce((s, m) => s + (monthlySearch[m].callClicks || 0), 0);
      const totalWebsiteClicks = months.reduce((s, m) => s + (monthlySearch[m].websiteClicks || 0), 0);

      // Period-over-period change for search (all 4 combined)
      const currentMonth = months[months.length - 1];
      const prevMonth = months[months.length - 2];
      const curTotal = (months.reduce((s, m) => {
        if (m === currentMonth) return s +
          (monthlySearch[m].googleMapsDesktop || 0) + (monthlySearch[m].googleSearchDesktop || 0) +
          (monthlySearch[m].googleMapsMobile || 0) + (monthlySearch[m].googleSearchMobile || 0);
        return s;
      }, 0));
      const prevTotal = (months.reduce((s, m) => {
        if (m === prevMonth) return s +
          (monthlySearch[m].googleMapsDesktop || 0) + (monthlySearch[m].googleSearchDesktop || 0) +
          (monthlySearch[m].googleMapsMobile || 0) + (monthlySearch[m].googleSearchMobile || 0);
        return s;
      }, 0));
      const periodChange = prevTotal > 0 ? Math.round(((curTotal - prevTotal) / prevTotal) * 100) : 0;

      // Last 7 days
      const last7 = dailyData.slice(-7);

      // Build PDF
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="GBP_Insights_Report_${startDateStr}_to_${endDateStr}.pdf"`);
      doc.pipe(res);

      const W = doc.page.width - 80;
      const dark = '#1e293b', lightBg = '#f8fafc';

      // ── Page 1: Title ──
      doc.rect(0, 0, doc.page.width, 120).fill('#2563eb');
      doc.fillColor('white').fontSize(24).font('Helvetica-Bold').text('GMB Insights Report', 40, 40);
      doc.fontSize(11).font('Helvetica').text(`${businessName}`, 40, 75);
      doc.text(`Selected Date Range: ${startDateStr} - ${endDateStr}`, 40, 92);

      // ── Page 2: Search Performance Overview ──
      doc.addPage();
      doc.fillColor(dark).fontSize(14).font('Helvetica-Bold').text(`Search Performance: ${startDateStr} - ${endDateStr}`, 40, 40);
      let y = 70;

      // 4 KPI cards in a row
      const kpiW = (W - 30) / 4;
      const kpis = [
        { label: 'Google Maps Desktop', value: totalMapsDesktop, color: '#9333ea' },
        { label: 'Google Search Desktop', value: totalSearchDesktop, color: '#2563eb' },
        { label: 'Google Maps Mobile', value: totalMapsMobile, color: '#c084fc' },
        { label: 'Google Search Mobile', value: totalSearchMobile, color: '#93c5fd' },
      ];
      for (let i = 0; i < kpis.length; i++) {
        const k = kpis[i];
        const kx = 40 + i * (kpiW + 10);
        doc.rect(kx, y, kpiW, 60).fill(k.color);
        doc.fillColor('white').fontSize(9).font('Helvetica').text(k.label, kx + 8, y + 8, { width: kpiW - 16 });
        doc.fontSize(16).font('Helvetica-Bold').text(k.value.toLocaleString(), kx + 8, y + 28, { width: kpiW - 16 });
      }
      y += 68;

      // Period change banner
      const changeColor = periodChange >= 0 ? '#16a34a' : '#dc2626';
      doc.rect(40, y, W, 22).fill(changeColor);
      doc.fillColor('white').fontSize(10).font('Helvetica-Bold')
        .text(`Period Change: ${periodChange >= 0 ? '+' : ''}${periodChange}% vs Previous Period`, 50, y + 5);
      y += 30;

      // Monthly table: Date | Maps Desktop | Search Desktop | Maps Mobile | Search Mobile | Total | % Chg
      doc.rect(40, y, W, 20).fill('#e2e8f0');
      doc.fillColor(dark).fontSize(8).font('Helvetica-Bold');
      doc.text('Date', 45, y + 6);
      doc.text('Maps Desktop', 105, y + 6);
      doc.text('Search Desktop', 175, y + 6);
      doc.text('Maps Mobile', 245, y + 6);
      doc.text('Search Mobile', 315, y + 6);
      doc.text('Total', 385, y + 6);
      doc.text('% Chg', 440, y + 6);
      y += 20;

      for (let i = 0; i < months.length; i++) {
        const m = months[i];
        const md = monthlySearch[m];
        const rowTotal = (md.googleMapsDesktop || 0) + (md.googleSearchDesktop || 0) + (md.googleMapsMobile || 0) + (md.googleSearchMobile || 0);
        const prevMd = monthlySearch[months[i - 1]];
        const prevRowTotal = prevMd ? (prevMd.googleMapsDesktop || 0) + (prevMd.googleSearchDesktop || 0) + (prevMd.googleMapsMobile || 0) + (prevMd.googleSearchMobile || 0) : 0;
        const pctChange = prevRowTotal > 0 ? Math.round(((rowTotal - prevRowTotal) / prevRowTotal) * 100) : 0;
        if (i % 2 === 0) doc.rect(40, y, W, 16).fill(lightBg);
        doc.fillColor(dark).fontSize(8).font('Helvetica').text(m, 45, y + 4);
        doc.text((md.googleMapsDesktop || 0).toLocaleString(), 105, y + 4);
        doc.text((md.googleSearchDesktop || 0).toLocaleString(), 175, y + 4);
        doc.text((md.googleMapsMobile || 0).toLocaleString(), 245, y + 4);
        doc.text((md.googleSearchMobile || 0).toLocaleString(), 315, y + 4);
        doc.text(rowTotal.toLocaleString(), 385, y + 4);
        doc.text(`${pctChange > 0 ? '+' : ''}${pctChange}%`, 440, y + 4);
        y += 16;
      }

      // Total row
      const grandTotal = (totalMapsDesktop + totalSearchDesktop + totalMapsMobile + totalSearchMobile);
      doc.rect(40, y, W, 16).fill('#e2e8f0');
      doc.font('Helvetica-Bold').text('Total', 45, y + 4);
      doc.text(totalMapsDesktop.toLocaleString(), 105, y + 4);
      doc.text(totalSearchDesktop.toLocaleString(), 175, y + 4);
      doc.text(totalMapsMobile.toLocaleString(), 245, y + 4);
      doc.text(totalSearchMobile.toLocaleString(), 315, y + 4);
      doc.text(grandTotal.toLocaleString(), 385, y + 4);

      // ── Page 3: Search Performance Chart (stacked bar) ──
      doc.addPage();
      doc.fillColor(dark).fontSize(14).font('Helvetica-Bold').text('Search Performance', 40, 40);
      doc.fillColor('#64748b').fontSize(10).font('Helvetica').text(`${startDateStr} - ${endDateStr}`, 40, 58);
      y = 85;
      drawStackedBarChart(doc,
        dailyData.map((d: any) => d.date),
        [
          { key: 'googleMapsDesktop', label: 'Google Maps Desktop', color: '#9333ea' },
          { key: 'googleSearchDesktop', label: 'Google Search Desktop', color: '#2563eb' },
          { key: 'googleMapsMobile', label: 'Google Maps Mobile', color: '#c084fc' },
          { key: 'googleSearchMobile', label: 'Google Search Mobile', color: '#93c5fd' },
        ],
        40, y, W, 240, dailyData as Record<string, any>[]);

      // ── Page 4: Weekly Search Performance ──
      doc.addPage();
      doc.fillColor(dark).fontSize(14).font('Helvetica-Bold').text('Weekly Search Performance', 40, 40);
      doc.fillColor('#64748b').fontSize(10).font('Helvetica').text(`${last7[0]?.date} - ${last7[last7.length - 1]?.date}`, 40, 58);
      y = 85;
      drawGroupedBarChart(doc,
        last7.map((d: any) => d.date),
        [
          { key: 'googleMapsDesktop', label: 'Google Maps Desktop', color: '#9333ea' },
          { key: 'googleSearchDesktop', label: 'Google Search Desktop', color: '#2563eb' },
          { key: 'googleMapsMobile', label: 'Google Maps Mobile', color: '#c084fc' },
          { key: 'googleSearchMobile', label: 'Google Search Mobile', color: '#93c5fd' },
        ],
        40, y, W, 240, last7 as Record<string, any>[]);
      y += 248;

      // Weekly table: Date | Maps Desktop | Search Desktop | Maps Mobile | Search Mobile | Total
      doc.rect(40, y, W, 20).fill('#e2e8f0');
      doc.fillColor(dark).fontSize(8).font('Helvetica-Bold');
      doc.text('Date', 45, y + 6);
      doc.text('Maps Desktop', 105, y + 6);
      doc.text('Search Desktop', 175, y + 6);
      doc.text('Maps Mobile', 245, y + 6);
      doc.text('Search Mobile', 315, y + 6);
      doc.text('Total', 385, y + 6);
      y += 20;
      for (let i = 0; i < last7.length; i++) {
        const d = last7[i];
        const wTotal = (d.googleMapsDesktop || 0) + (d.googleSearchDesktop || 0) + (d.googleMapsMobile || 0) + (d.googleSearchMobile || 0);
        if (i % 2 === 0) doc.rect(40, y, W, 16).fill(lightBg);
        doc.fillColor(dark).fontSize(8).font('Helvetica').text(d.date, 45, y + 4);
        doc.text((d.googleMapsDesktop || 0).toLocaleString(), 105, y + 4);
        doc.text((d.googleSearchDesktop || 0).toLocaleString(), 175, y + 4);
        doc.text((d.googleMapsMobile || 0).toLocaleString(), 245, y + 4);
        doc.text((d.googleSearchMobile || 0).toLocaleString(), 315, y + 4);
        doc.text(wTotal.toLocaleString(), 385, y + 4);
        y += 16;
      }

      // ── Page 5: Actions Performance ──
      doc.addPage();
      doc.fillColor(dark).fontSize(14).font('Helvetica-Bold').text(`Actions Performance: ${startDateStr} - ${endDateStr}`, 40, 40);
      y = 70;

      // 3 KPI cards
      const actKpiW = (W - 20) / 3;
      const actKpis = [
        { label: 'Directions', value: totalDirections, color: '#f97316' },
        { label: 'Phone Calls', value: totalCallClicks, color: '#ef4444' },
        { label: 'Website Clicks', value: totalWebsiteClicks, color: '#2563eb' },
      ];
      for (let i = 0; i < actKpis.length; i++) {
        const k = actKpis[i];
        const kx = 40 + i * (actKpiW + 10);
        doc.rect(kx, y, actKpiW, 60).fill(k.color);
        doc.fillColor('white').fontSize(9).font('Helvetica').text(k.label, kx + 8, y + 8, { width: actKpiW - 16 });
        doc.fontSize(16).font('Helvetica-Bold').text(k.value.toLocaleString(), kx + 8, y + 28, { width: actKpiW - 16 });
      }
      y += 68;

      // Monthly table: Date | Directions | Phone Calls | Website Clicks | Total | % Chg
      doc.rect(40, y, W, 20).fill('#e2e8f0');
      doc.fillColor(dark).fontSize(8).font('Helvetica-Bold');
      doc.text('Date', 45, y + 6);
      doc.text('Directions', 125, y + 6);
      doc.text('Phone Calls', 210, y + 6);
      doc.text('Website Clicks', 295, y + 6);
      doc.text('Total', 390, y + 6);
      doc.text('% Chg', 450, y + 6);
      y += 20;

      for (let i = 0; i < months.length; i++) {
        const m = months[i];
        const md = monthlySearch[m];
        const atotal = (md.directions || 0) + (md.callClicks || 0) + (md.websiteClicks || 0);
        const prevMd = monthlySearch[months[i - 1]];
        const prevAtotal = prevMd ? (prevMd.directions || 0) + (prevMd.callClicks || 0) + (prevMd.websiteClicks || 0) : 0;
        const pctChange = prevAtotal > 0 ? Math.round(((atotal - prevAtotal) / prevAtotal) * 100) : 0;
        if (i % 2 === 0) doc.rect(40, y, W, 16).fill(lightBg);
        doc.fillColor(dark).fontSize(8).font('Helvetica').text(m, 45, y + 4);
        doc.text((md.directions || 0).toLocaleString(), 125, y + 4);
        doc.text((md.callClicks || 0).toLocaleString(), 210, y + 4);
        doc.text((md.websiteClicks || 0).toLocaleString(), 295, y + 4);
        doc.text(atotal.toLocaleString(), 390, y + 4);
        doc.text(`${pctChange > 0 ? '+' : ''}${pctChange}%`, 450, y + 4);
        y += 16;
      }

      // Total row
      const actGrandTotal = totalDirections + totalCallClicks + totalWebsiteClicks;
      doc.rect(40, y, W, 16).fill('#e2e8f0');
      doc.font('Helvetica-Bold').text('Total', 45, y + 4);
      doc.text(totalDirections.toLocaleString(), 125, y + 4);
      doc.text(totalCallClicks.toLocaleString(), 210, y + 4);
      doc.text(totalWebsiteClicks.toLocaleString(), 295, y + 4);
      doc.text(actGrandTotal.toLocaleString(), 390, y + 4);

      // ── Page 6: Actions Performance Charts ──
      doc.addPage();
      doc.fillColor(dark).fontSize(14).font('Helvetica-Bold').text('Actions Performance', 40, 40);
      doc.fillColor('#64748b').fontSize(10).font('Helvetica').text(`${startDateStr} - ${endDateStr}`, 40, 58);
      y = 85;
      drawLineChart(doc,
        dailyData.map((d: any) => d.date),
        [
          { key: 'directions', label: 'Directions', color: '#f97316' },
          { key: 'callClicks', label: 'Phone Calls', color: '#ef4444' },
          { key: 'websiteClicks', label: 'Website Clicks', color: '#2563eb' },
        ],
        40, y, W, 240, dailyData as Record<string, any>[]);
      y += 248;

      // Weekly breakdown table: Date | Directions | Phone Calls | Website Clicks | Total
      doc.rect(40, y, W, 20).fill('#e2e8f0');
      doc.fillColor(dark).fontSize(8).font('Helvetica-Bold');
      doc.text('Date', 45, y + 6);
      doc.text('Directions', 125, y + 6);
      doc.text('Phone Calls', 210, y + 6);
      doc.text('Website Clicks', 295, y + 6);
      doc.text('Total', 390, y + 6);
      y += 20;
      for (let i = 0; i < last7.length; i++) {
        const d = last7[i];
        const wTotal = (d.directions || 0) + (d.callClicks || 0) + (d.websiteClicks || 0);
        if (i % 2 === 0) doc.rect(40, y, W, 16).fill(lightBg);
        doc.fillColor(dark).fontSize(8).font('Helvetica').text(d.date, 45, y + 4);
        doc.text((d.directions || 0).toLocaleString(), 125, y + 4);
        doc.text((d.callClicks || 0).toLocaleString(), 210, y + 4);
        doc.text((d.websiteClicks || 0).toLocaleString(), 295, y + 4);
        doc.text(wTotal.toLocaleString(), 390, y + 4);
        y += 16;
      }

      doc.end();
    } catch (error: any) {
      console.error('PDF generation error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to generate PDF', details: error.message });
      } else {
        try { res.end(); } catch {}
      }
    }
  });

  // PDF chart drawing helpers
  function drawLineChart(doc: any, labels: string[], series: { key: string; label: string; color: string }[], x: number, y: number, width: number, height: number, data: Record<string, any>[]) {
    // Chart area bounds
    const chartX = x + 50;
    const chartY = y + 10;
    const chartW = width - 60;
    const chartH = height - 30;

    doc.rect(x, y, width, height).fill('#f8fafc').stroke('#e2e8f0');

    if (!data || data.length === 0) {
      doc.fillColor('#94a3b8').fontSize(10).font('Helvetica').text('No data', x + chartW / 2 - 20, y + chartH / 2);
      return;
    }

    // Collect all values across all series to compute scale
    let maxVal = 0;
    for (const d of data) {
      for (const s of series) {
        const v = d[s.key] || 0;
        if (v > maxVal) maxVal = v;
      }
    }
    if (maxVal === 0) maxVal = 1;

    // Y-axis grid lines (5 lines)
    doc.font('Helvetica').fontSize(7).fillColor('#94a3b8');
    for (let i = 0; i <= 4; i++) {
      const gy = chartY + chartH - (i / 4) * chartH;
      const gVal = Math.round((i / 4) * maxVal);
      doc.moveTo(chartX, gy).lineTo(chartX + chartW, gy).stroke('#e2e8f0');
      doc.text(gVal.toLocaleString(), x + 2, gy - 4, { width: 45, align: 'right' });
    }

    // X-axis labels (show every Nth label to avoid crowding)
    const step = Math.max(1, Math.ceil(labels.length / 8));
    doc.fillColor('#64748b').fontSize(7);
    for (let i = 0; i < labels.length; i += step) {
      const gx = chartX + (i / (data.length - 1 || 1)) * chartW;
      doc.moveTo(gx, chartY + chartH).lineTo(gx, chartY + chartH + 4).stroke('#cbd5e1');
      doc.text(labels[i], gx - 10, chartY + chartH + 5, { width: 60 });
    }

    // Draw lines for each series
    for (const s of series) {
      const pts: [number, number][] = [];
      for (let i = 0; i < data.length; i++) {
        const v = data[i][s.key] || 0;
        const px = chartX + (i / (data.length - 1 || 1)) * chartW;
        const py = chartY + chartH - (v / maxVal) * chartH;
        pts.push([px, py]);
      }
      // Line path
      let pathStr = `M ${pts[0][0]} ${pts[0][1]}`;
      for (let i = 1; i < pts.length; i++) pathStr += ` L ${pts[i][0]} ${pts[i][1]}`;
      doc.path(pathStr).stroke(s.color);

      // Dots
      for (const [px, py] of pts) {
        doc.circle(px, py, 2.5).fill(s.color);
      }
    }

    // Legend
    const legendBoxW = (series.length * 70);
    let legendX = x + (width - legendBoxW) / 2;
    doc.fontSize(8).font('Helvetica');
    for (const s of series) {
      doc.rect(legendX, y + height - 18, 10, 10).fill(s.color);
      doc.fillColor('#1e293b').text(s.label || s.key, legendX + 13, y + height - 16);
      legendX += 70;
    }
  }

  function drawGroupedBarChart(doc: any, labels: string[], series: { key: string; label: string; color: string }[], x: number, y: number, width: number, height: number, data: Record<string, any>[]) {
    const chartX = x + 50;
    const chartY = y + 10;
    const chartW = width - 60;
    const chartH = height - 30;

    doc.rect(x, y, width, height).fill('#f8fafc').stroke('#e2e8f0');

    if (!data || data.length === 0) {
      doc.fillColor('#94a3b8').fontSize(10).font('Helvetica').text('No data', x + chartW / 2 - 20, y + chartH / 2);
      return;
    }

    let maxVal = 0;
    for (const d of data) {
      for (const s of series) {
        const v = d[s.key] || 0;
        if (v > maxVal) maxVal = v;
      }
    }
    if (maxVal === 0) maxVal = 1;

    // Y-axis grid
    doc.font('Helvetica').fontSize(7).fillColor('#94a3b8');
    for (let i = 0; i <= 4; i++) {
      const gy = chartY + chartH - (i / 4) * chartH;
      const gVal = Math.round((i / 4) * maxVal);
      doc.moveTo(chartX, gy).lineTo(chartX + chartW, gy).stroke('#e2e8f0');
      doc.text(gVal.toLocaleString(), x + 2, gy - 4, { width: 45, align: 'right' });
    }

    const n = series.length;
    const groupW = chartW / (data.length || 1);
    const barW = Math.min(groupW * 0.7 / n, 20);
    const gap = (groupW - barW * n) / 2;

    for (let gi = 0; gi < data.length; gi++) {
      const d = data[gi];
      const groupX = chartX + gi * groupW;
      for (let si = 0; si < series.length; si++) {
        const v = d[series[si].key] || 0;
        const barH = (v / maxVal) * chartH;
        const barX = groupX + gap + si * barW;
        const barY = chartY + chartH - barH;
        doc.rect(barX, barY, barW - 1, barH).fill(series[si].color);
      }
    }

    // X-axis labels
    const step = Math.max(1, Math.ceil(labels.length / 8));
    doc.fillColor('#64748b').fontSize(7);
    for (let i = 0; i < labels.length; i += step) {
      const gx = chartX + i * groupW + groupW / 2;
      doc.text(labels[i], gx - 15, chartY + chartH + 5, { width: 60 });
    }

    // Legend
    const legendBoxW = (series.length * 70);
    let legendX = x + (width - legendBoxW) / 2;
    doc.fontSize(8).font('Helvetica');
    for (const s of series) {
      doc.rect(legendX, y + height - 18, 10, 10).fill(s.color);
      doc.fillColor('#1e293b').text(s.label || s.key, legendX + 13, y + height - 16);
      legendX += 70;
    }
  }

  function drawStackedBarChart(doc: any, labels: string[], series: { key: string; label: string; color: string }[], x: number, y: number, width: number, height: number, data: Record<string, any>[]) {
    const chartX = x + 50;
    const chartY = y + 10;
    const chartW = width - 60;
    const chartH = height - 30;

    doc.rect(x, y, width, height).fill('#f8fafc').stroke('#e2e8f0');

    if (!data || data.length === 0) {
      doc.fillColor('#94a3b8').fontSize(10).font('Helvetica').text('No data', x + chartW / 2 - 20, y + chartH / 2);
      return;
    }

    let maxVal = 0;
    for (const d of data) {
      let rowSum = 0;
      for (const s of series) rowSum += d[s.key] || 0;
      if (rowSum > maxVal) maxVal = rowSum;
    }
    if (maxVal === 0) maxVal = 1;

    // Y-axis grid
    doc.font('Helvetica').fontSize(7).fillColor('#94a3b8');
    for (let i = 0; i <= 4; i++) {
      const gy = chartY + chartH - (i / 4) * chartH;
      const gVal = Math.round((i / 4) * maxVal);
      doc.moveTo(chartX, gy).lineTo(chartX + chartW, gy).stroke('#e2e8f0');
      doc.text(gVal.toLocaleString(), x + 2, gy - 4, { width: 45, align: 'right' });
    }

    const barW = Math.min(chartW / (data.length || 1) * 0.7, 30);
    const groupW = chartW / (data.length || 1);
    const gap = (groupW - barW) / 2;

    for (let gi = 0; gi < data.length; gi++) {
      const d = data[gi];
      const groupX = chartX + gi * groupW;
      let stackY = chartY + chartH;
      for (const s of series) {
        const v = d[s.key] || 0;
        const segH = (v / maxVal) * chartH;
        const barY = stackY - segH;
        doc.rect(groupX + gap, barY, barW, segH).fill(s.color);
        stackY = barY;
      }
    }

    // X-axis labels
    const step = Math.max(1, Math.ceil(labels.length / 8));
    doc.fillColor('#64748b').fontSize(7);
    for (let i = 0; i < labels.length; i += step) {
      const gx = chartX + i * groupW + groupW / 2;
      doc.text(labels[i], gx - 15, chartY + chartH + 5, { width: 60 });
    }

    // Legend
    const legendBoxW = (series.length * 70);
    let legendX = x + (width - legendBoxW) / 2;
    doc.fontSize(8).font('Helvetica');
    for (const s of series) {
      doc.rect(legendX, y + height - 18, 10, 10).fill(s.color);
      doc.fillColor('#1e293b').text(s.label || s.key, legendX + 13, y + height - 16);
      legendX += 70;
    }
  }

  // Get review trends from EmbedSocial listing_item_metrics API
  app.get('/api/embedsocial/review-trends', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const apiKey = await getEmbedSocialApiKey(req.tenantId);
      if (!apiKey) {
        return res.status(401).json({ error: 'EmbedSocial API key not configured.' });
      }

      const { period = '30days' } = req.query;
      let days = 30;
      if (period === '7days') days = 7;
      else if (period === '90days') days = 90;
      else if (period === '12months') days = 365;

      const now = new Date();
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      const startDateStr = `${String(startDate.getDate()).padStart(2, '0')}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${startDate.getFullYear()}`;
      const endDateStr = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;

      console.log(`[review-trends] Fetching for period: ${period}, start: ${startDateStr}, end: ${endDateStr}`);

      // Get this tenant's connected listing IDs
      const tenantListings = await prisma.tenantListing.findMany({
        where: { tenantId: req.tenantId!, status: 'active' },
        select: { embedSocialListingId: true },
      });
      const tenantSourceIds = tenantListings.map(l => l.embedSocialListingId).filter(Boolean);

      // Only use this tenant's connected source IDs
      const sourceIdsToTry: string[] = [...new Set(tenantSourceIds)];

      if (sourceIdsToTry.length === 0) {
        return res.json({ reviewTrends: [] });
      }

      const reviewTrends: any[] = [];
      for (const sourceId of sourceIdsToTry) {
        try {
          const metricsRes = await embedSocialFetchWithKey(apiKey, `/rest/v1/listing_item_metrics?startDate=${startDateStr}&endDate=${endDateStr}&sourceId=${sourceId}&pageSize=100`);
          console.log(`[review-trends] Metrics response for ${sourceId}:`, JSON.stringify(metricsRes)?.slice(0, 500));

          if (metricsRes && metricsRes.listings && metricsRes.listings.length > 0) {
            // Use listing_item_metrics for review trends
            const m = metricsRes.listings[0];

            // For 7days/30days, generate daily/weekly data
            if (period === '7days') {
              // Show daily data for last 7 days
              for (let i = 6; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                reviewTrends.push({
                  date: dateStr,
                  reviews: Math.floor((m.numberOfReviews || 0) / 30),
                  replies: Math.floor((m.numberReplies || 0) / 30),
                });
              }
            } else if (period === '30days') {
              // Show weekly data for last 4 weeks
              for (let i = 3; i >= 0; i--) {
                const weekDate = new Date(now);
                weekDate.setDate(weekDate.getDate() - (i * 7 + 7));
                const weekEnd = new Date(now);
                weekEnd.setDate(weekEnd.getDate() - (i * 7));
                const dateStr = `${weekDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
                reviewTrends.push({
                  date: dateStr,
                  reviews: Math.floor((m.numberOfReviews || 0) / 4),
                  replies: Math.floor((m.numberReplies || 0) / 4),
                });
              }
            } else if (period === '90days') {
              // Show monthly data for last 3 months
              for (let i = 2; i >= 0; i--) {
                const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const dateStr = monthNames[monthDate.getMonth()];
                reviewTrends.push({
                  date: dateStr,
                  reviews: Math.floor((m.numberOfReviews || 0) / 3),
                  replies: Math.floor((m.numberReplies || 0) / 3),
                });
              }
            } else {
              // 12months - show all 12 months
              const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              for (let i = 11; i >= 0; i--) {
                const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const dateStr = monthNames[monthDate.getMonth()];
                reviewTrends.push({
                  date: dateStr,
                  reviews: Math.floor((m.numberOfReviews || 0) / 12),
                  replies: Math.floor((m.numberReplies || 0) / 12),
                });
              }
            }

            break; // Got data, no need to try other IDs
          }
        } catch (e: any) {
          console.log(`[review-trends] Metrics fetch error for ${sourceId}:`, e.message);
        }
      }

      console.log('[review-trends] No real data yet');
      console.log(`[review-trends] Returning: ${reviewTrends.length} data points`);
      res.json({ reviewTrends });
    } catch (error: any) {
      console.error('EmbedSocial review trends error:', error);
      res.status(500).json({ error: 'Failed to fetch review trends', details: error.message });
    }
  });

  // Get reviews for a specific location from EmbedSocial
  // Filters by this tenant's connected listings
  app.get('/api/embedsocial/reviews', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const apiKey = await getEmbedSocialApiKey(req.tenantId);
      if (!apiKey) {
        return res.status(401).json({ error: 'EmbedSocial API key not configured.' });
      }

      const { location_id, source_names } = req.query;

      const tenantListings = await prisma.tenantListing.findMany({
        where: { tenantId: req.tenantId!, status: 'active' },
        select: { embedSocialListingId: true },
      });
      const tenantSourceIds = tenantListings.map(l => l.embedSocialListingId).filter(Boolean);

      if (tenantSourceIds.length === 0) {
        return res.json([]);
      }

      let filterSourceIds: string[] | undefined;
      if (location_id) {
        const loc = tenantListings.find(l => l.embedSocialListingId === String(location_id));
        if (loc) {
          filterSourceIds = [loc.embedSocialListingId];
        }
      }

      const allReviews: any[] = [];
      let page = 1;
      let hasMore = true;
      const maxPages = 10;
      const sourceIdsToFilter = filterSourceIds || tenantSourceIds;

      while (hasMore && page <= maxPages) {
        let pageUrl = `/rest/v1/items?page=${page}&pageSize=50`;
        if (source_names) {
          pageUrl += `&source_names[]=${encodeURIComponent(String(source_names))}`;
        }
        if (sourceIdsToFilter.length > 0) {
          pageUrl += `&sourceId=${sourceIdsToFilter.join(',')}`;
        }
        console.log(`[reviews] Fetching page ${page}:`, pageUrl);

        const data = await embedSocialFetchWithKey(apiKey, pageUrl);

        let items: any[] = [];
        if (Array.isArray(data)) {
          items = data;
        } else if (data.data) {
          items = Array.isArray(data.data) ? data.data : [];
        } else if (data.items) {
          items = Array.isArray(data.items) ? data.items : [];
        }

        console.log(`[reviews] Page ${page} returned ${items.length} items`);

        if (items.length > 0) {
          allReviews.push(...items);
          page++;
          if (items.length < 50) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }

      console.log(`[reviews] Total reviews fetched: ${allReviews.length}`);
      
      // Log sample review to see field structure
      if (allReviews.length > 0) {
        console.log('[reviews] Sample review fields:', Object.keys(allReviews[0]));
        console.log('[reviews] Sample review:', JSON.stringify(allReviews[0]).slice(0, 500));
      }
      
      res.json(allReviews);
    } catch (error: any) {
      console.error('EmbedSocial reviews error:', error);
      res.status(500).json({ error: 'Failed to fetch reviews', details: error.message });
    }
  });

  // Update a location's EmbedSocial location ID
  app.put('/api/locations/:id/embed-social', async (req, res) => {
    try {
      const { id } = req.params;
      const { embedSocialLocationId } = req.body;
      const updated = await prisma.location.update({
        where: { id },
        data: { embedSocialLocationId: embedSocialLocationId || null },
      });
      res.json(updated);
    } catch (error: any) {
      console.error('Update location embedSocialId error:', error);
      res.status(500).json({ error: 'Failed to update location', details: error.message });
    }
  });

  // Update a listing in EmbedSocial (for Edit Business Info)
  app.put('/api/embedsocial/locations/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      console.log(`[update-location] PUT /api/embedsocial/locations/${id}`);
      console.log(`[update-location] Body:`, JSON.stringify(req.body, null, 2));
      
      const apiKey = await getEmbedSocialApiKey(req.tenantId);
      if (!apiKey) {
        return res.status(401).json({ error: 'EmbedSocial API key not configured.' });
      }

      // PATCH the listing with the provided data
      const data = await embedSocialFetchWithKey(
        apiKey,
        `/rest/v1/listings/${id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(req.body),
        },
      );

      console.log(`[update-location] Success:`, JSON.stringify(data, null, 2));
      res.json(data);
    } catch (error: any) {
      console.error('[update-location] Error:', error);
      res.status(500).json({ error: 'Failed to update location', details: error.message });
    }
  });

  // Update a listing in EmbedSocial (bulk edit)
  app.patch('/api/embedsocial/listings/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const apiKey = await getEmbedSocialApiKey(req.tenantId);
      if (!apiKey) {
        return res.status(401).json({ error: 'EmbedSocial API key not configured.' });
      }

      const data = await embedSocialFetchWithKey(
        apiKey,
        `/rest/v1/listings/${id}`,
        {
          method: 'PATCH',
          body: JSON.stringify(req.body),
        },
      );

      res.json(data);
    } catch (error: any) {
      console.error('EmbedSocial update listing error:', error);
      res.status(500).json({ error: 'Failed to update listing', details: error.message });
    }
  });

  // ==========================================
  // Team Members API Routes
  // ==========================================
  app.get('/api/team', async (req, res) => {
    try {
      const tenant = await prisma.tenant.findFirst();
      if (!tenant) return res.json([]);
      const users = await prisma.user.findMany({
        where: { tenants: { some: { id: tenant.id } } },
        select: { id: true, email: true, createdAt: true },
      });
      res.json(users);
    } catch (error) {
      console.error('Fetch team error:', error);
      res.status(500).json({ error: 'Failed to fetch team members' });
    }
  });

  app.post('/api/team', async (req, res) => {
    try {
      const { email } = req.body;
      let tenant = await prisma.tenant.findFirst();
      if (!tenant) tenant = await prisma.tenant.create({ data: { name: 'My Business' } });

      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.create({
          data: { email, passwordHash: 'dummy_hash', tenants: { connect: { id: tenant.id } } },
        });
      } else {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { tenants: { connect: { id: tenant.id } } },
        });
      }
      res.json({ id: user.id, email: user.email, createdAt: user.createdAt });
    } catch (error) {
      console.error('Add team member error:', error);
      res.status(500).json({ error: 'Failed to add team member' });
    }
  });

  app.delete('/api/team/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const tenant = await prisma.tenant.findFirst();
      if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

      await prisma.user.update({
        where: { id },
        data: { tenants: { disconnect: { id: tenant.id } } },
      });
      res.json({ success: true });
    } catch (error) {
      console.error('Remove team member error:', error);
      res.status(500).json({ error: 'Failed to remove team member' });
    }
  });

  // ==========================================
  // Locations API Routes (Auth Required)
  // ==========================================
  app.post('/api/locations', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { name, address, phone, googlePlaceId } = req.body;

      if (!name) return res.status(400).json({ error: 'Name is required' });

      const newLocation = await prisma.location.create({
        data: {
          tenantId: req.tenantId!,
          name,
          address,
          phone,
          isSynced: true,
          googlePlaceId: googlePlaceId || null,
        },
      });

      if (googlePlaceId) {
        const tenant = await prisma.tenant.findUnique({ where: { id: req.tenantId! } });
        if (tenant) {
          const mappings: Record<string, string> = JSON.parse(tenant.locationMappings || '{}');
          mappings[newLocation.id] = googlePlaceId;
          await prisma.tenant.update({
            where: { id: req.tenantId! },
            data: { locationMappings: JSON.stringify(mappings) },
          });
        }
      }

      res.json(newLocation);
    } catch (error) {
      console.error('Add location error:', error);
      res.status(500).json({ error: 'Failed to add location' });
    }
  });

  app.get('/api/locations', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const locations = await prisma.location.findMany({
        where: { tenantId: req.tenantId! },
        orderBy: { name: 'asc' },
      });
      res.json(locations);
    } catch (error) {
      console.error('Fetch locations error:', error);
      res.status(500).json({ error: 'Failed to fetch locations' });
    }
  });

  app.put('/api/locations/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { phone, businessHours, googlePlaceId } = req.body;

      const updatedLocation = await prisma.location.update({
        where: { id },
        data: { phone, businessHours, googlePlaceId },
      });

      if (googlePlaceId !== undefined) {
        const tenant = await prisma.tenant.findFirst();
        if (tenant) {
          const mappings: Record<string, string> = JSON.parse(tenant.locationMappings || '{}');
          mappings[id] = googlePlaceId;
          await prisma.tenant.update({
            where: { id: tenant.id },
            data: { locationMappings: JSON.stringify(mappings) },
          });
        }
      }

      res.json(updatedLocation);
    } catch (error) {
      console.error('Update location error:', error);
      res.status(500).json({ error: 'Failed to update location' });
    }
  });

  app.delete('/api/locations/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.location.delete({ where: { id } });
      res.json({ success: true });
    } catch (error) {
      console.error('Delete location error:', error);
      res.status(500).json({ error: 'Failed to delete location' });
    }
  });

  // ==========================================
  // Posts API Routes
  // ==========================================
  app.get('/api/posts', async (req, res) => {
    try {
      const posts = await prisma.post.findMany({
        include: { location: true },
        orderBy: { createdAt: 'desc' },
      });
      res.json(posts);
    } catch (error) {
      console.error('Fetch posts error:', error);
      res.status(500).json({ error: 'Failed to fetch posts' });
    }
  });

  app.post('/api/posts', async (req, res) => {
    try {
      const { locationId, content, type, status, scheduledFor, imageUrl } = req.body;

      const post = await prisma.post.create({
        data: {
          locationId,
          content,
          type: type || 'UPDATE',
          status: status || 'DRAFT',
          scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
          imageUrl,
        },
        include: { location: true },
      });

      res.json(post);
    } catch (error) {
      console.error('Create post error:', error);
      res.status(500).json({ error: 'Failed to create post' });
    }
  });

  app.put('/api/posts/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { content, type, status, scheduledFor, imageUrl } = req.body;

      const post = await prisma.post.update({
        where: { id },
        data: {
          content,
          type,
          status,
          scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
          imageUrl,
        },
        include: { location: true },
      });

      res.json(post);
    } catch (error) {
      console.error('Update post error:', error);
      res.status(500).json({ error: 'Failed to update post' });
    }
  });

  app.delete('/api/posts/:id', async (req, res) => {
    try {
      await prisma.post.delete({ where: { id: req.params.id } });
      res.json({ success: true });
    } catch (error) {
      console.error('Delete post error:', error);
      res.status(500).json({ error: 'Failed to delete post' });
    }
  });

  // Publish a post via EmbedSocial
  app.post('/api/posts/:id/publish', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const post = await prisma.post.findUnique({
        where: { id },
        include: { location: true },
      });
      if (!post) return res.status(404).json({ error: 'Post not found' });

      const apiKey = await getEmbedSocialApiKey(req.tenantId);
      if (!apiKey) return res.status(401).json({ error: 'EmbedSocial API key not configured. Please add it in Settings.' });

      // Find the TenantListing that matches this post's location (by embedSocialLocationId)
      let embedSourceIds: string[] = [];
      if (post.location?.embedSocialLocationId) {
        const tenantListing = await prisma.tenantListing.findFirst({
          where: { embedSocialListingId: post.location.embedSocialLocationId, tenantId: req.tenantId! },
        });
        if (tenantListing?.embedSocialListingId) {
          embedSourceIds = [tenantListing.embedSocialListingId];
        }
      }

      // Fallback: look up by embedSocialListingId stored on the location itself
      if (embedSourceIds.length === 0 && post.locationId) {
        const tenantListing = await prisma.tenantListing.findFirst({
          where: { embedSocialListingId: post.locationId, tenantId: req.tenantId! },
        });
        if (tenantListing?.embedSocialListingId) {
          embedSourceIds = [tenantListing.embedSocialListingId];
        }
      }

      if (embedSourceIds.length === 0) {
        return res.status(400).json({ error: 'No connected listing found for this post. Please reconnect your location in Settings.' });
      }

      // Call EmbedSocial Content Publishing API
      const publishBody: any = {
        type: post.type === 'OFFER' ? 'offer' : post.type === 'EVENT' ? 'event' : 'update',
        sourceIds: embedSourceIds,
        captionText: post.content || '',
      };

      if (post.scheduledFor) {
        publishBody.scheduledOn = new Date(post.scheduledFor).toISOString();
      }

      console.log(`[publish] Publishing post ${id} to EmbedSocial:`, JSON.stringify(publishBody));

      const esResponse = await embedSocialFetchWithKey(
        apiKey,
        '/rest/v1/content_publishing_media',
        {
          method: 'POST',
          body: JSON.stringify(publishBody),
        },
      );

      console.log(`[publish] EmbedSocial response:`, JSON.stringify(esResponse).slice(0, 300));

      // Update post status to PUBLISHED
      const updatedPost = await prisma.post.update({
        where: { id },
        data: { status: 'PUBLISHED' },
        include: { location: true },
      });

      res.json({ success: true, post: updatedPost, embedResponse: esResponse });
    } catch (error: any) {
      console.error('[publish] Publish error:', error);
      const errMsg = error?.details?.title || error?.message || 'Failed to publish post';
      res.status(500).json({ error: errMsg });
    }
  });

  // ==========================================
  // Comments Gen API Routes
  // ==========================================
  app.get('/api/google-accounts', async (req, res) => {
    try {
      const accounts = await prisma.googleAccount.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { name: 'asc' },
      });
      res.json(accounts);
    } catch (error) {
      console.error('Fetch google accounts error:', error);
      res.status(500).json({ error: 'Failed to fetch google accounts' });
    }
  });

  app.get('/api/comment-tasks/quota', async (req, res) => {
    try {
      const tenant = await prisma.tenant.findFirst();
      if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      const usedQuota = await prisma.commentTask.count({
        where: { tenantId: tenant.id, createdAt: { gte: startOfMonth, lte: endOfMonth } },
      });

      res.json({ total: 20, used: usedQuota, remaining: Math.max(0, 20 - usedQuota) });
    } catch (error) {
      console.error('Fetch quota error:', error);
      res.status(500).json({ error: 'Failed to fetch quota' });
    }
  });

  app.post('/api/comment-tasks/generate', async (req, res) => {
    try {
      const { keywords, language } = req.body;
      if (!keywords) return res.status(400).json({ error: 'Keywords are required' });

      const tenant = await prisma.tenant.findFirst();
      if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

      const apiKey = tenant.geminiApiKey || process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: 'Gemini API key not configured' });

      const langInstruction = language === 'zh' ? '请用简体中文撰写。' : 'Please write the review in English.';

      const prompt = `Write a Google Maps review for a business.
Keywords/Context: ${keywords}
${langInstruction}
The review should sound natural, authentic, and written by a real customer. Keep it concise (2-4 sentences).`;

      // Use REST API directly
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.8,
              maxOutputTokens: 256,
            },
          }),
        }
      );

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        console.error('[generate-comment] Gemini API error:', errorText);
        throw new Error('Gemini API request failed');
      }

      const geminiData = await geminiResponse.json();
      const content = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

      res.json({ content });
    } catch (error) {
      console.error('Generate comment error:', error);
      res.status(500).json({ error: 'Failed to generate comment' });
    }
  });

  app.post('/api/comment-tasks', async (req, res) => {
    try {
      const { googleAccountId, locationId, keywords, content, imageUrls } = req.body;
      if (!googleAccountId || !content) return res.status(400).json({ error: 'Google Account and content are required' });

      const tenant = await prisma.tenant.findFirst();
      if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      const usedQuota = await prisma.commentTask.count({
        where: { tenantId: tenant.id, createdAt: { gte: startOfMonth, lte: endOfMonth } },
      });

      if (usedQuota >= 20) return res.status(403).json({ error: 'Monthly quota exceeded (20/20)' });

      const task = await prisma.commentTask.create({
        data: {
          tenantId: tenant.id,
          googleAccountId,
          locationId: locationId || null,
          keywords,
          content,
          imageUrls: imageUrls || [],
          status: 'DRAFT',
        },
        include: { googleAccount: true, location: true },
      });

      res.json(task);
    } catch (error) {
      console.error('Create comment task error:', error);
      res.status(500).json({ error: 'Failed to create comment task' });
    }
  });

  app.get('/api/comment-tasks', async (req, res) => {
    try {
      const tenant = await prisma.tenant.findFirst();
      if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

      const tasks = await prisma.commentTask.findMany({
        where: { tenantId: tenant.id },
        include: { googleAccount: true, location: true },
        orderBy: { createdAt: 'desc' },
      });

      res.json(tasks);
    } catch (error) {
      console.error('Fetch comment tasks error:', error);
      res.status(500).json({ error: 'Failed to fetch comment tasks' });
    }
  });

  // ==========================================
  // Dashboard API Routes
  // ==========================================
  app.get('/api/dashboard/stats', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const locationsCount = await prisma.location.count({ where: { tenantId: req.tenantId! } });

      const reviews = await prisma.review.findMany({
        where: { location: { tenantId: req.tenantId! } },
      });

      const totalReviews = reviews.length;
      const averageRating = totalReviews > 0
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
        : '0.0';

      const repliedReviews = reviews.filter((r) => r.replyText).length;
      const replyRate = totalReviews > 0 ? Math.round((repliedReviews / totalReviews) * 100) : 0;

      res.json({
        locationsCount,
        totalReviews,
        averageRating,
        replyRate,
        repliedReviews,
        unrepliedReviews: totalReviews - repliedReviews,
      });
    } catch (error) {
      console.error('Fetch dashboard stats error:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
  });

  app.get('/api/tenants', async (req, res) => {
    try {
      const tenants = await prisma.tenant.findMany();
      res.json(tenants);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch tenants' });
    }
  });

  // ==========================================
  // Rank Tracker API Routes (SerpApi)
  // ==========================================
  app.get('/api/places/search', async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') return res.status(400).json({ error: 'Missing query parameter' });

      const serpApiKey = process.env.SERPAPI_KEY || '603217379ed95d286aef18d62c3d3ade08714b176e486c26933ce51aa1186010';

      const url = new URL('https://serpapi.com/search.json');
      url.searchParams.append('engine', 'google_maps');
      url.searchParams.append('q', q);
      url.searchParams.append('type', 'search');
      url.searchParams.append('api_key', serpApiKey);

      const response = await fetch(url.toString());
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to fetch from SerpApi');

      const results = (data.local_results || []).map((result: any) => ({
        title: result.title,
        address: result.address,
        lat: result.gps_coordinates?.latitude,
        lng: result.gps_coordinates?.longitude,
        rating: result.rating,
        reviews: result.reviews,
        place_id: result.place_id,
      })).filter((r: any) => r.lat && r.lng);

      res.json(results);
    } catch (error) {
      console.error('Places search error:', error);
      res.status(500).json({ error: 'Failed to search places' });
    }
  });

  // ==========================================
  // Local Search Grid — SEO API
  // Uses SerpApi Google Maps to scan grid points and competitor rankings
  // ==========================================
  app.post('/api/seo/local-search-grid', async (req, res) => {
    try {
      const { keyword, lat, lng, businessName, gridSize = 9 } = req.body;
      if (!keyword || lat === undefined || lng === undefined || !businessName) {
        return res.status(400).json({ error: 'Missing required parameters: keyword, lat, lng, businessName' });
      }

      const serpApiKey = process.env.SERPAPI_KEY || '603217379ed95d286aef18d62c3d3ade08714b176e486c26933ce51aa1186010';

      // Build grid points (3x3 grid around center point)
      const gridOffsets9: number[][] = [[-0.005, -0.005], [-0.005, 0], [-0.005, 0.005], [0, -0.005], [0, 0], [0, 0.005], [0.005, -0.005], [0.005, 0], [0.005, 0.005]];
      const gridOffsets16: number[][] = [[-0.008, -0.008], [-0.008, 0], [-0.008, 0.008], [0, -0.008], [0, 0], [0, 0.008], [0.008, -0.008], [0.008, 0], [0.008, 0.008]];
      const gridOffsets = gridSize === 16 ? gridOffsets16 : gridOffsets9;

      // Scan each grid point in parallel
      const scanPoint = async (offset: number[], idx: number) => {
        const pointLat = parseFloat(lat) + offset[0];
        const pointLng = parseFloat(lng) + offset[1];

        try {
          const url = new URL('https://serpapi.com/search.json');
          url.searchParams.append('engine', 'google_maps');
          url.searchParams.append('q', keyword);
          url.searchParams.append('ll', `@${pointLat},${pointLng},15z`);
          url.searchParams.append('type', 'search');
          url.searchParams.append('api_key', serpApiKey);
          url.searchParams.append('num', '20');

          const response = await fetch(url.toString());
          const data = await response.json();

          if (!response.ok) throw new Error(data.error || 'SerpApi error');

          const localResults = data.local_results || [];
          let businessRank = null;
          const competitors = localResults.slice(0, 5).map((r: any, i: number) => {
            const isTarget = r.title?.toLowerCase().includes(businessName.toLowerCase());
            if (isTarget) businessRank = i + 1;
            return {
              rank: i + 1,
              name: r.title,
              address: r.address,
              rating: r.rating,
              reviews: r.reviews,
              phone: r.phone,
              isTarget,
            };
          });

          // If business not found in top 20, try to find it
          if (businessRank === null) {
            const targetIdx = localResults.findIndex((r: any) =>
              r.title?.toLowerCase().includes(businessName.toLowerCase()),
            );
            if (targetIdx !== -1) businessRank = targetIdx + 1;
          }

          return {
            idx,
            lat: pointLat,
            lng: pointLng,
            businessRank,
            totalResults: localResults.length,
            competitors,
            hasData: localResults.length > 0,
          };
        } catch (err) {
          console.error(`[local-search-grid] Point ${idx} error:`, err);
          return {
            idx,
            lat: pointLat,
            lng: pointLng,
            businessRank: null,
            totalResults: 0,
            competitors: [],
            hasData: false,
          };
        }
      };

      // Run all grid scans in parallel
      const results = await Promise.all(gridOffsets.map((offset, i) => scanPoint(offset, i)));

      // Calculate summary stats
      const ranked = results.filter(r => r.businessRank !== null);
      const avgRank = ranked.length > 0
        ? Math.round(ranked.reduce((s, r) => s + r.businessRank!, 0) / ranked.length)
        : null;
      const top3Count = ranked.filter(r => r.businessRank <= 3).length;
      const top3Percent = ranked.length > 0 ? Math.round((top3Count / ranked.length) * 100) : 0;
      const top10Count = ranked.filter(r => r.businessRank <= 10).length;
      const top10Percent = ranked.length > 0 ? Math.round((top10Count / ranked.length) * 100) : 0;

      res.json({
        keyword,
        center: { lat: parseFloat(lat), lng: parseFloat(lng) },
        gridSize,
        points: results,
        summary: {
          totalPoints: results.length,
          pointsWithData: results.filter(r => r.hasData).length,
          pointsRanked: ranked.length,
          averageRank: avgRank,
          top3Percent,
          top10Percent,
        },
      });
    } catch (error: any) {
      console.error('Local search grid error:', error);
      res.status(500).json({ error: 'Failed to generate local search grid', details: error.message });
    }
  });

  app.post('/api/rank-tracker/scan', async (req, res) => {
    try {
      const { keyword, lat, lng, businessName } = req.body;
      if (!keyword || !lat || !lng || !businessName) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      const serpApiKey = process.env.SERPAPI_KEY || '603217379ed95d286aef18d62c3d3ade08714b176e486c26933ce51aa1186010';

      const url = new URL('https://serpapi.com/search.json');
      url.searchParams.append('engine', 'google_maps');
      url.searchParams.append('q', keyword);
      url.searchParams.append('ll', `@${lat},${lng},15z`);
      url.searchParams.append('type', 'search');
      url.searchParams.append('api_key', serpApiKey);

      const response = await fetch(url.toString());
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to fetch from SerpApi');

      let rank = 21;
      if (data.local_results && Array.isArray(data.local_results)) {
        const index = data.local_results.findIndex((result: any) =>
          result.title && result.title.toLowerCase().includes(businessName.toLowerCase()),
        );
        if (index !== -1) rank = index + 1;
      }

      res.json({ rank, lat, lng });
    } catch (error) {
      console.error('Rank tracker scan error:', error);
      res.status(500).json({ error: 'Failed to scan rank' });
    }
  });

  app.post('/api/rank-tracker/insight', async (req, res) => {
    try {
      const { keyword, businessName, gridPoints } = req.body;

      const tenant = await prisma.tenant.findFirst();
      const apiKey = tenant?.geminiApiKey || process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(400).json({ error: 'Gemini API Key not configured' });

      const validRanks = gridPoints.filter((p: any) => p.rank !== undefined && p.rank <= 20);
      const avgRank = validRanks.length > 0
        ? (validRanks.reduce((a: any, b: any) => a + b.rank, 0) / validRanks.length).toFixed(1)
        : '20+';

      const top3 = gridPoints.filter((p: any) => p.rank !== undefined && p.rank <= 3).length;
      const top3Percent = Math.round((top3 / gridPoints.length) * 100);

      const prompt = `
        You are an expert Local SEO consultant. Analyze the local SEO ranking data for a business.
        Business Name: ${businessName}
        Target Keyword: ${keyword}
        Average Rank across grid: ${avgRank}
        Top 3 Presence (Visibility): ${top3Percent}%

        Provide a detailed, step-by-step action plan to improve or maintain these rankings.
        Format your response in Markdown. Include 3 to 4 specific, actionable steps.
      `;

      // Use REST API directly
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1024,
            },
          }),
        }
      );

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        console.error('[insight] Gemini API error:', errorText);
        throw new Error('Gemini API request failed');
      }

      const geminiData = await geminiResponse.json();
      const insight = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

      res.json({ insight });
    } catch (error) {
      console.error('Insight generation error:', error);
      res.status(500).json({ error: 'Failed to generate insight' });
    }
  });

  app.post('/api/reviews/generate-reply', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { reviewId, reviewerName, rating, comment, businessName } = req.body;
      
      if (!reviewId) return res.status(400).json({ error: 'Review ID is required' });
      if (!comment) return res.status(400).json({ error: 'Review comment is required' });

      // Get tenant settings for AI
      const tenant = await prisma.tenant.findFirst();
      if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

      const apiKey = tenant.geminiApiKey || process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: 'AI API key not configured. Please add Gemini API key in Settings.' });

      // Get business name from tenant listings if not provided
      let business = businessName;
      if (!business) {
        const listings = await prisma.tenantListing.findFirst({
          where: { tenantId: req.tenantId!, status: 'active' },
        });
        if (listings) {
          business = listings.name;
        } else {
          business = 'our business';
        }
      }

      const prompt = `
You are a professional customer service AI assistant for a local business named "${business}".
Generate exactly 3 different reply options for the following customer review.

Customer Name: ${reviewerName || 'Customer'}
Rating: ${rating || 5} out of 5 stars
Review Comment: "${comment}"

Generate 3 replies in JSON format with these exact keys: "professional", "friendly", "empathetic"
Each reply should be 2-4 sentences. Do not include any placeholders.

- "professional": Formal, business-like tone. Suitable for corporate or upscale businesses.
- "friendly": Casual, warm tone. Shows genuine enthusiasm and approachability.
- "empathetic": Compassionate, understanding tone. Great for acknowledging concerns and showing care.

Return ONLY valid JSON like this, nothing else:
{
  "professional": "Reply text here...",
  "friendly": "Reply text here...",
  "empathetic": "Reply text here..."
}
`;

      console.log('[generate-reply] Generating 3 AI replies for review:', reviewId);

      // Use REST API directly
      // Use AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.9,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1024,
            },
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        console.error('[generate-reply] Gemini API error:', errorText);
        throw new Error('Gemini API request failed: ' + errorText);
      }

      const geminiData = await geminiResponse.json();
      let replyText = (geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
      
      // Parse JSON response robustly
      let replies: { professional: string; friendly: string; empathetic: string } | null = null;
      
      // Clean up the response - remove markdown code blocks
      replyText = replyText.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim();
      
      // Try direct JSON parse first
      try {
        const parsed = JSON.parse(replyText);
        if (typeof parsed === 'object' && parsed !== null) {
          replies = {
            professional: String(parsed.professional || '').trim(),
            friendly: String(parsed.friendly || '').trim(),
            empathetic: String(parsed.empathetic || '').trim(),
          };
        }
      } catch {
        // Try to extract a well-formed JSON object (handle cases where Gemini adds text before/after the JSON)
        replies = extractRepliesFromText(replyText);
      }

      // Validate and ensure all fields exist
      if (!replies || !replies.professional || !replies.friendly || !replies.empathetic) {
        replies = {
          professional: replies?.professional || 'Thank you for your feedback! We appreciate your kind words.',
          friendly: replies?.friendly || 'Thanks so much for the review! We love hearing from you.',
          empathetic: replies?.empathetic || 'We truly appreciate you taking the time to share your experience.',
        };
      }

      console.log('[generate-reply] Generated replies successfully');
      res.json({ replies });
    } catch (error: any) {
      console.error('Generate reply error:', error);
      res.status(500).json({ error: 'Failed to generate AI reply: ' + (error.message || 'Unknown error') });
    }
  });

  // ==========================================
  // Tenant Listing Management (multi-tenant EmbedSocial)
  // ==========================================

  // Generate invite link for a tenant to share with their clients
  app.get('/api/embedsocial/invite-link', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const tenant = await prisma.tenant.findUnique({ where: { id: req.tenantId! } });
      if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

      const baseInviteUrl = 'https://embedsocial.com/app/public/grant_listing_access';
      const inviteToken = process.env.EMBEDSOCIAL_INVITE_TOKEN || 'esb7ebfffb58b61f1e223b7dabf36a48';
      const inviteUrl = `${baseInviteUrl}?token=${inviteToken}`;

      const connectedListings = await prisma.tenantListing.count({
        where: { tenantId: req.tenantId! }
      });

      res.json({ inviteUrl, connectedListings, message: 'Share this link with your client.' });
    } catch (error: any) {
      console.error('[invite-link] Error:', error);
      res.status(500).json({ error: 'Failed to generate invite link', details: error.message });
    }
  });

  // Get tenant's connected listings from local DB
  app.get('/api/tenant/listings', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const listings = await prisma.tenantListing.findMany({
        where: { tenantId: req.tenantId!, status: 'active' },
        orderBy: { connectedAt: 'desc' },
      });
      res.json(listings);
    } catch (error: any) {
      console.error('[tenant-listings] Error:', error);
      res.status(500).json({ error: 'Failed to fetch listings', details: error.message });
    }
  });

  // Webhook from EmbedSocial when a listing is connected
  app.post('/api/webhook/embedsocial', async (req, res) => {
    try {
      console.log('[embedsocial-webhook] Received:', JSON.stringify(req.body, null, 2));
      res.json({ received: true });
    } catch (error: any) {
      console.error('[embedsocial-webhook] Error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  // Auth routes
  app.use('/api/auth', authRoutes);
  app.use('/api/auth', oauthRoutes);

  // ==========================================
  // EmbedSocial Listings Management (Multi-tenant)
  // ==========================================

  // Get available listings from EmbedSocial that can be connected
  app.get('/api/embedsocial/listings/available', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const apiKey = await getEmbedSocialApiKey(req.tenantId);
      if (!apiKey) {
        return res.status(401).json({ error: 'EmbedSocial API key not configured.' });
      }

      // Get all listings from EmbedSocial
      const allListings: any[] = [];
      let page = 1;
      let hasMore = true;
      while (hasMore) {
        const data = await embedSocialFetchWithKey(apiKey, `/rest/v1/listings?page=${page}&pageSize=50`);
        const listings: any[] = Array.isArray(data) ? data : (data.data || []);
        if (listings.length === 0) break;
        allListings.push(...listings);
        hasMore = listings.length === 50;
        page++;
        if (page > 20) break;
      }

      // Get already connected listing IDs
      const connectedListings = await prisma.tenantListing.findMany({
        where: { tenantId: req.tenantId!, status: 'active' },
        select: { embedSocialListingId: true },
      });
      const connectedIds = new Set(connectedListings.map(l => l.embedSocialListingId));

      // Filter out already connected listings
      const availableListings = allListings
        .filter(l => !connectedIds.has(l.id))
        .map(l => ({
          id: l.id,
          name: l.name,
          address: l.address,
          phoneNumber: l.phoneNumber,
          totalReviews: l.totalReviews,
          averageRating: l.averageRating,
        }));

      res.json(availableListings);
    } catch (error: any) {
      console.error('[available-listings] Error:', error);
      res.status(500).json({ error: 'Failed to fetch available listings', details: error.message });
    }
  });

  // Connect a listing to the tenant
  app.post('/api/embedsocial/listings/connect', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { embedSocialListingId, name, address, phoneNumber, websiteUrl, googleId } = req.body;

      if (!embedSocialListingId) {
        return res.status(400).json({ error: 'embedSocialListingId is required' });
      }

      // Check if already connected
      const existing = await prisma.tenantListing.findFirst({
        where: {
          tenantId: req.tenantId!,
          embedSocialListingId,
          status: 'active',
        },
      });

      if (existing) {
        return res.status(400).json({ error: 'Listing already connected' });
      }

      const listing = await prisma.tenantListing.create({
        data: {
          tenantId: req.tenantId!,
          embedSocialListingId,
          name: name || 'Unknown',
          address: address || null,
          phoneNumber: phoneNumber || null,
          websiteUrl: websiteUrl || null,
          googleId: googleId || null,
          status: 'active',
        },
      });

      res.json(listing);
    } catch (error: any) {
      console.error('[connect-listing] Error:', error);
      res.status(500).json({ error: 'Failed to connect listing', details: error.message });
    }
  });

  // Disconnect a listing from the tenant
  app.delete('/api/embedsocial/listings/:id/disconnect', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      await prisma.tenantListing.updateMany({
        where: {
          id,
          tenantId: req.tenantId!,
        },
        data: { status: 'disconnected' },
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error('[disconnect-listing] Error:', error);
      res.status(500).json({ error: 'Failed to disconnect listing', details: error.message });
    }
  });

  // ==========================================
  // SEO Optimization Report — Gemini AI Analysis
  // ==========================================

  app.post('/api/reports/seo-optimization', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const tenant = req.tenantId
        ? await prisma.tenant.findUnique({ where: { id: req.tenantId } })
        : await prisma.tenant.findFirst();
      if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

      const apiKey = tenant.geminiApiKey || process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: 'AI API key not configured. Please add Gemini API key in Settings.' });

      const embedSocialKey = tenant.embedSocialApiKey || process.env.EMBEDSOCIAL_API_KEY;
      if (!embedSocialKey) return res.status(500).json({ error: 'EmbedSocial API key not configured.' });

      const lang = req.body?.lang || 'en';

      // --- Fetch all real data from EmbedSocial ---
      let listingsData: any[] = [];
      let listingMetrics: any[] = [];
      let reviewMetrics: any[] = [];
      let recentReviews: any[] = [];

      try {
        const listingsRes = await embedSocialFetchWithKey(embedSocialKey, '/rest/v1/listings');
        listingsData = Array.isArray(listingsRes) ? listingsRes : (listingsRes.data || []);
      } catch (e) { console.error('[seo-report] listings error:', (e as any).message); }

      try {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const startStr = `${String(thirtyDaysAgo.getDate()).padStart(2,'0')}-${String(thirtyDaysAgo.getMonth()+1).padStart(2,'0')}-${thirtyDaysAgo.getFullYear()}`;
        const endStr = `${String(now.getDate()).padStart(2,'0')}-${String(now.getMonth()+1).padStart(2,'0')}-${now.getFullYear()}`;
        const metricsRes = await embedSocialFetchWithKey(embedSocialKey, `/rest/v1/listing_metrics?startDate=${startStr}&endDate=${endStr}&pageSize=100`);
        listingMetrics = metricsRes?.listings || [];
      } catch (e) { console.error('[seo-report] listing_metrics error:', (e as any).message); }

      try {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const startStr = `${String(thirtyDaysAgo.getDate()).padStart(2,'0')}-${String(thirtyDaysAgo.getMonth()+1).padStart(2,'0')}-${thirtyDaysAgo.getFullYear()}`;
        const endStr = `${String(now.getDate()).padStart(2,'0')}-${String(now.getMonth()+1).padStart(2,'0')}-${now.getFullYear()}`;
        const reviewMetricsRes = await embedSocialFetchWithKey(embedSocialKey, `/rest/v1/listing_item_metrics?startDate=${startStr}&endDate=${endStr}&pageSize=100`);
        reviewMetrics = reviewMetricsRes?.listings || [];
      } catch (e) { console.error('[seo-report] listing_item_metrics error:', (e as any).message); }

      try {
        const reviewsRes = await embedSocialFetchWithKey(embedSocialKey, '/rest/v1/items?pageSize=20');
        recentReviews = Array.isArray(reviewsRes) ? reviewsRes : (reviewsRes.data || reviewsRes.items || []);
      } catch (e) { console.error('[seo-report] items error:', (e as any).message); }

      const langInstruction = lang === 'zh'
        ? '请用简体中文撰写所有分析和建议。'
        : 'Please write all analysis and recommendations in English.';

      const prompt = `You are a Google Business Profile (Local SEO) expert analyst. Analyze the following business data and generate a comprehensive SEO optimization report.

${langInstruction}

--- BUSINESS LISTINGS DATA ---
${JSON.stringify(listingsData.slice(0, 10), null, 2)}

--- LISTING METRICS (Search Visibility - Last 30 Days) ---
${JSON.stringify(listingMetrics, null, 2)}

--- REVIEW METRICS (Review Performance - Last 30 Days) ---
${JSON.stringify(reviewMetrics, null, 2)}

--- RECENT REVIEWS (Latest 20) ---
${JSON.stringify(recentReviews.slice(0, 10).map((r: any) => ({
  rating: r.rating,
  text: r.captionText,
  source: r.sourceName,
  date: r.originalCreatedOn,
  hasReply: Array.isArray(r.replies) && r.replies.length > 0,
})), null, 2)}

---

Generate a detailed SEO optimization report in the following EXACT JSON format. Do NOT add any text outside the JSON:

{
  "overallScore": <number 0-100>,
  "overallSummary": "<2-3 sentence summary of the business's current local SEO health>",
  "insights": [
    {
      "type": "categories",
      "priority": "high|medium|low",
      "title": "<Insight title>",
      "description": "<Detailed explanation of why this matters>",
      "currentValue": "<What they currently have>",
      "suggestedValue": "<Specific recommendations>",
      "actionType": "editable|citation|content|review",
      "actionLabel": "<Short label for the action button>",
      "potentialImpact": "<Expected outcome if fixed>"
    },
    ...more insights
  ],
  "competitiveInsights": [
    {
      "title": "<Opportunity title>",
      "description": "<Detailed description>",
      "actionSteps": ["<step 1>", "<step 2>", ...],
      "priority": "high|medium|low"
    }
  ],
  "quickWins": [
    {
      "action": "<Action description>",
      "impact": "high|medium|low",
      "effort": "low|medium|high",
      "actionType": "editable|citation|content|review"
    }
  ]
}

IMPORTANT RULES:
1. Return ONLY the JSON object, no markdown, no code blocks, no explanations outside the JSON
2. For "categories" type insights, set actionType to "editable" and actionLabel to "Update Categories"
3. For "description" type insights, set actionType to "editable" and actionLabel to "Update Description"
4. For "reviews" type insights (negative reviews needing replies), set actionType to "review"
5. For citation-related insights, set actionType to "citation"
6. Each insight should reference SPECIFIC data from the provided data above when possible
7. Generate at least 3 "insights" items covering: categories, description, photos, review response rate, and any unique opportunities
8. Generate at least 2 "competitiveInsights" with actionable steps
9. Generate at least 3 "quickWins"
10. If no real data is available for a section, use your expertise to provide general recommendations based on common local SEO best practices
11. "overallScore" should reflect the business's local SEO health based on available data`;

      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 8192 },
          }),
        }
      );

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        console.error('[seo-optimization] Gemini API error:', errorText);
        return res.status(500).json({ error: 'AI analysis failed', details: errorText });
      }

      const geminiData = await geminiResponse.json();
      let aiText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      aiText = aiText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

      let report;
      try {
        report = JSON.parse(aiText);
      } catch {
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try { report = JSON.parse(jsonMatch[0]); }
          catch {
            return res.status(500).json({ error: 'Failed to parse AI response', raw: aiText.slice(0, 500) });
          }
        } else {
          return res.status(500).json({ error: 'Failed to parse AI response', raw: aiText.slice(0, 500) });
        }
      }

      report._raw = {
        listingsCount: listingsData.length,
        metricsAvailable: listingMetrics.length > 0,
        reviewMetricsAvailable: reviewMetrics.length > 0,
        reviewsAvailable: recentReviews.length,
      };

      res.json(report);
    } catch (error: any) {
      console.error('[seo-optimization] Error:', error);
      res.status(500).json({ error: 'Failed to generate SEO optimization report', details: error.message });
    }
  });

  // ==========================================
  // Vite Middleware (For Frontend Integration)
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Start the server
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

startServer().catch(console.error);
