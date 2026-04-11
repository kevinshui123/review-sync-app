import 'dotenv/config';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { Auth } from 'googleapis';
import { GoogleGenAI } from '@google/genai';

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
      } catch (e) {
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
  } catch (e) {
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
  const base = (process.env.EMBEDSOCIAL_BASE_URL || 'https://app.embedsocial.com').replace(/\/$/, '');

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
  const base = (process.env.EMBEDSOCIAL_BASE_URL || 'https://app.embedsocial.com').replace(/\/$/, '');

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
    googleReviewId: review.identifier || String(review.id),
    reviewerName: review.author || review.name || 'Anonymous',
    rating: review.rating || 0,
    comment: review.message || review.text || null,
    createdAt: review.published_on ? new Date(review.published_on) : new Date(),
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
  // Settings API Routes
  // ==========================================
  app.get('/api/settings', async (req, res) => {
    try {
      let tenant = await prisma.tenant.findFirst();
      if (!tenant) {
        tenant = await prisma.tenant.create({ data: { name: 'My Business' } });
      }
      res.json({
        ...tenant,
        googleConnected: !!(tenant.googleAccessToken && tenant.googleRefreshToken),
        embedSocialConnected: !!tenant.embedSocialApiKey,
      });
    } catch (error) {
      console.error('Fetch settings error:', error);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  app.post('/api/settings', async (req, res) => {
    try {
      const { yelpApiKey, openaiApiKey, geminiApiKey, googlePlacesApiKey, embedSocialApiKey } = req.body;
      let tenant = await prisma.tenant.findFirst();
      if (!tenant) {
        tenant = await prisma.tenant.create({ data: { name: 'My Business' } });
      }

      const updated = await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          yelpApiKey,
          openaiApiKey,
          geminiApiKey,
          googlePlacesApiKey,
          embedSocialApiKey,
          isConfigured: !!(yelpApiKey || openaiApiKey || geminiApiKey || googlePlacesApiKey || embedSocialApiKey),
        },
      });
      res.json(updated);
    } catch (error) {
      console.error('Update settings error:', error);
      res.status(500).json({ error: 'Failed to update settings' });
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

      let tenant = await prisma.tenant.findFirst();
      if (!tenant) {
        tenant = await prisma.tenant.create({ data: { name: 'My Business' } });
      }

      await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          googleAccessToken: tokens.access_token || '',
          googleRefreshToken: tokens.refresh_token || tenant.googleRefreshToken || '',
          googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          isConfigured: true,
        },
      });

      res.redirect(`${APP_URL}?googleAuthSuccess=true`);
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

  app.get('/api/reviews', async (req, res) => {
    try {
      const reviews = await prisma.review.findMany({
        include: { location: true },
        orderBy: { createdAt: 'desc' },
      });
      res.json(reviews);
    } catch (error) {
      console.error('Fetch reviews error:', error);
      res.status(500).json({ error: 'Failed to fetch reviews' });
    }
  });

  // Sync reviews from EmbedSocial
  app.post('/api/reviews/sync', async (req, res) => {
    try {
      const apiKey = await getEmbedSocialApiKey();
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

          const reviewsData = await embedSocialFetchWithKey(
            apiKey,
            `/rest/v1/reviews?location_id=${loc.embedSocialLocationId}&source_names[]=Google&page=1`,
          );

          const reviewList: any[] = reviewsData.data || reviewsData.reviews || reviewsData.items || [];
          console.log(`[syncReviews] Got ${reviewList.length} reviews for location "${loc.name}"`);
          console.log(`[syncReviews] Raw reviewsData keys: ${Object.keys(reviewsData).join(', ')}`);
          console.log(`[syncReviews] Raw reviewsData response:`, JSON.stringify(reviewsData));

          for (const r of reviewList) {
            const normalized = normalizeEmbedSocialReview(r, loc.id);
            const existing = await prisma.review.findFirst({
              where: { embedSocialReviewId: normalized.embedSocialReviewId },
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
          const allReviews = await embedSocialFetchWithKey(
            apiKey,
            `/rest/v1/reviews?source_names[]=Google&page=1`,
          );

          const reviewList: any[] = allReviews.data || allReviews.reviews || allReviews.items || [];
          console.log(`[syncReviews] Got ${reviewList.length} total Google reviews from EmbedSocial`);
          console.log(`[syncReviews] Raw allReviews keys: ${Object.keys(allReviews).join(', ')}`);
          console.log(`[syncReviews] Raw allReviews response:`, JSON.stringify(allReviews));

          for (const r of reviewList) {
            // Try to find a matching local location by name
            const matchedLoc = locationsWithoutId.find(
              (l) => l.name.toLowerCase() === (r.location_name || '').toLowerCase(),
            ) || locationsWithoutId[0]; // fallback to first

            const normalized = normalizeEmbedSocialReview(r, matchedLoc?.id || '');

            const existing = await prisma.review.findFirst({
              where: { embedSocialReviewId: normalized.embedSocialReviewId },
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
  app.post('/api/reviews/:id/reply', async (req, res) => {
    try {
      const { id } = req.params;
      const { replyText } = req.body;

      if (!replyText?.trim()) {
        return res.status(400).json({ error: 'Reply text is required' });
      }

      const apiKey = await getEmbedSocialApiKey();
      if (!apiKey) {
        return res.status(401).json({
          error: 'EmbedSocial API key not configured. Please add it in Settings.',
        });
      }

      const review = await prisma.review.findUnique({ where: { id } });
      if (!review) return res.status(404).json({ error: 'Review not found' });

      // EmbedSocial reply: the review reply endpoint depends on the platform.
      // For Google reviews via EmbedSocial, we POST to /reviews/:id/reply.
      // We store the embedSocial review id in review.embedSocialReviewId.
      const esReviewId = review.embedSocialReviewId || review.googleReviewId;

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
        // If EmbedSocial rejects the reply (e.g. wrong endpoint), still save locally
        if (e.status !== 404) {
          console.warn(`[reply] EmbedSocial reply failed (${e.status}): ${e.message}`);
        }
      }

      const updatedReview = await prisma.review.update({
        where: { id },
        data: { replyText: replyText.trim() },
      });

      res.json({ success: true, review: updatedReview });
    } catch (error: any) {
      console.error('Submit reply error:', error);
      res.status(500).json({ error: 'Failed to submit reply', details: error.message });
    }
  });

  // ==========================================
  // EmbedSocial API Endpoints
  // ==========================================

  // Verify EmbedSocial API key and list organizations
  app.get('/api/embedsocial/organizations', async (req, res) => {
    try {
      const apiKey = await getEmbedSocialApiKey();
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

  // List locations (sources) from EmbedSocial
  app.get('/api/embedsocial/locations', async (req, res) => {
    try {
      const apiKey = await getEmbedSocialApiKey();
      if (!apiKey) {
        return res.status(401).json({ error: 'EmbedSocial API key not configured.' });
      }
      // EmbedSocial uses "sources" for the connected Google Business locations
      const data = await embedSocialFetchWithKey(apiKey, '/rest/v1/sources');
      res.json(data);
    } catch (error: any) {
      console.error('EmbedSocial sources error:', error);
      res.status(500).json({ error: 'Failed to fetch sources', details: error.message });
    }
  });

  // Get reviews for a specific location from EmbedSocial
  app.get('/api/embedsocial/reviews', async (req, res) => {
    try {
      const apiKey = await getEmbedSocialApiKey();
      if (!apiKey) {
        return res.status(401).json({ error: 'EmbedSocial API key not configured.' });
      }
      const { location_id, source_names, page } = req.query;
      const params = new URLSearchParams();
      if (location_id) params.set('location_id', String(location_id));
      if (source_names) params.set('source_names[]', String(source_names));
      if (page) params.set('page', String(page));
      const data = await embedSocialFetchWithKey(apiKey, `/rest/v1/reviews?${params}`);
      res.json(data);
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
  // Locations API Routes
  // ==========================================
  app.post('/api/locations', async (req, res) => {
    try {
      const { name, address, phone, googlePlaceId } = req.body;
      let tenant = await prisma.tenant.findFirst();
      if (!tenant) tenant = await prisma.tenant.create({ data: { name: 'My Business' } });

      if (!name) return res.status(400).json({ error: 'Name is required' });

      const newLocation = await prisma.location.create({
        data: {
          tenantId: tenant.id,
          name,
          address,
          phone,
          isSynced: true,
          googlePlaceId: googlePlaceId || null,
        },
      });

      if (googlePlaceId) {
        const mappings: Record<string, string> = JSON.parse(tenant.locationMappings || '{}');
        mappings[newLocation.id] = googlePlaceId;
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: { locationMappings: JSON.stringify(mappings) },
        });
      }

      res.json(newLocation);
    } catch (error) {
      console.error('Add location error:', error);
      res.status(500).json({ error: 'Failed to add location' });
    }
  });

  app.get('/api/locations', async (req, res) => {
    try {
      const locations = await prisma.location.findMany({ orderBy: { name: 'asc' } });
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

      const ai = new GoogleGenAI({ apiKey });
      const langInstruction = language === 'zh' ? '请用简体中文撰写。' : 'Please write the review in English.';

      const prompt = `Write a Google Maps review for a business.
Keywords/Context: ${keywords}
${langInstruction}
The review should sound natural, authentic, and written by a real customer. Keep it concise (2-4 sentences).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      res.json({ content: response.text });
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
  app.get('/api/dashboard/stats', async (req, res) => {
    try {
      const tenant = await prisma.tenant.findFirst();
      if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

      const locationsCount = await prisma.location.count({ where: { tenantId: tenant.id } });

      const reviews = await prisma.review.findMany({
        where: { location: { tenantId: tenant.id } },
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

      const ai = new GoogleGenAI({ apiKey });

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

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      res.json({ insight: response.text });
    } catch (error) {
      console.error('Insight generation error:', error);
      res.status(500).json({ error: 'Failed to generate insight' });
    }
  });

  app.post('/api/reviews/generate-reply', async (req, res) => {
    try {
      const { reviewId } = req.body;
      if (!reviewId) return res.status(400).json({ error: 'Review ID is required' });

      const review = await prisma.review.findUnique({
        where: { id: reviewId },
        include: { location: true },
      });

      if (!review) return res.status(404).json({ error: 'Review not found' });

      const tenant = await prisma.tenant.findFirst();
      if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

      const apiKey = tenant.geminiApiKey || process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: 'Gemini API key not configured' });

      const ai = new GoogleGenAI({ apiKey });

      const prompt = `
        You are a professional customer service representative for a local business named "${review.location.name}".
        Please write a polite, professional, and empathetic reply to the following customer review.

        Customer Name: ${review.reviewerName}
        Rating: ${review.rating} out of 5 stars
        Review Comment: "${review.comment || 'No comment provided.'}"

        Guidelines:
        - Keep it concise (2-4 sentences).
        - If the rating is positive (4-5 stars), express gratitude and invite them back.
        - If the rating is negative (1-3 stars), apologize for their experience, address their specific concern if mentioned, and offer a way to make it right.
        - Do not include any placeholders like [Your Name] or [Manager Name]. Just the reply text.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      res.json({ replyText: response.text });
    } catch (error) {
      console.error('Generate reply error:', error);
      res.status(500).json({ error: 'Failed to generate AI reply' });
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
