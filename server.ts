import 'dotenv/config';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { google } from 'googleapis';
import { GoogleGenAI } from '@google/genai';

// Instantiate the Prisma Client
const prisma = new PrismaClient();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON bodies
  app.use(express.json());

  // ==========================================
  // API Routes
  // ==========================================
  
  // Basic Health Check Route
  app.get('/api/health', async (req, res) => {
    try {
      // Optional: Verify database connection
      await prisma.$queryRaw`SELECT 1`;
      res.json({ 
        status: 'ok', 
        message: 'Server is running', 
        database: 'connected' 
      });
    } catch (error) {
      console.error('Database connection failed:', error);
      res.status(500).json({ 
        status: 'error', 
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // ==========================================
  // Google OAuth Routes
  // ==========================================

  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

  // ==========================================
  // Settings API Routes
  // ==========================================

  app.get('/api/settings', async (req, res) => {
    try {
      let tenant = await prisma.tenant.findFirst();
      if (!tenant) {
        tenant = await prisma.tenant.create({ data: { name: 'My Business' } });
      }
      res.json(tenant);
    } catch (error) {
      console.error('Fetch settings error:', error);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  app.post('/api/settings', async (req, res) => {
    try {
      const { syncWebhookUrl, replyWebhookUrl, yelpApiKey, openaiApiKey, geminiApiKey } = req.body;
      let tenant = await prisma.tenant.findFirst();
      if (!tenant) {
        tenant = await prisma.tenant.create({ data: { name: 'My Business' } });
      }

      const isConfigured = !!(syncWebhookUrl && replyWebhookUrl);

      const updated = await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          syncWebhookUrl,
          replyWebhookUrl,
          yelpApiKey,
          openaiApiKey,
          geminiApiKey,
          isConfigured
        }
      });
      res.json(updated);
    } catch (error) {
      console.error('Update settings error:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });

  // ==========================================
  // Team Members API Routes
  // ==========================================

  app.get('/api/team', async (req, res) => {
    try {
      let tenant = await prisma.tenant.findFirst();
      if (!tenant) {
        return res.json([]);
      }
      const users = await prisma.user.findMany({
        where: { tenants: { some: { id: tenant.id } } },
        select: { id: true, email: true, createdAt: true }
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
      if (!tenant) {
        tenant = await prisma.tenant.create({ data: { name: 'My Business' } });
      }

      // Check if user already exists
      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        // Create user with dummy password for now
        user = await prisma.user.create({
          data: {
            email,
            passwordHash: 'dummy_hash',
            tenants: { connect: { id: tenant.id } }
          }
        });
      } else {
        // Connect existing user to tenant
        user = await prisma.user.update({
          where: { id: user.id },
          data: { tenants: { connect: { id: tenant.id } } }
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
      let tenant = await prisma.tenant.findFirst();
      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      await prisma.user.update({
        where: { id },
        data: { tenants: { disconnect: { id: tenant.id } } }
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
      const { name, address, phone } = req.body;
      let tenant = await prisma.tenant.findFirst();
      if (!tenant) {
        tenant = await prisma.tenant.create({ data: { name: 'My Business' } });
      }

      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }

      const newLocation = await prisma.location.create({
        data: {
          tenantId: tenant.id,
          name,
          address,
          phone,
          isSynced: true, // Mark as true so it shows up normally
          googlePlaceId: `manual-${Date.now()}` // Generate a dummy ID
        }
      });

      res.json(newLocation);
    } catch (error) {
      console.error('Add location error:', error);
      res.status(500).json({ error: 'Failed to add location' });
    }
  });

  app.get('/api/locations', async (req, res) => {
    try {
      const locations = await prisma.location.findMany({
        orderBy: { name: 'asc' }
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
      const { phone, businessHours } = req.body;
      
      const updatedLocation = await prisma.location.update({
        where: { id },
        data: {
          phone,
          businessHours
        }
      });
      
      res.json(updatedLocation);
    } catch (error) {
      console.error('Update location error:', error);
      res.status(500).json({ error: 'Failed to update location' });
    }
  });

  // ==========================================
  // Reviews API Routes (Make.com Webhook Integration)
  // ==========================================

  // ==========================================
  // Reviews API Routes
  // ==========================================

  app.get('/api/reviews', async (req, res) => {
    try {
      const reviews = await prisma.review.findMany({
        include: { location: true },
        orderBy: { createdAt: 'desc' }
      });
      res.json(reviews);
    } catch (error) {
      console.error('Fetch reviews error:', error);
      res.status(500).json({ error: 'Failed to fetch reviews' });
    }
  });

  // Public Webhook Receiver for Zapier (Sync Reviews)
  // Zapier will POST to this URL whenever a new review is created in Google Business Profile
  app.post('/api/webhooks/zapier/reviews', async (req, res) => {
    try {
      // Zapier sends the review data in the request body
      const reviewData = req.body;
      
      console.log('Received webhook from Zapier:', reviewData);

      if (!reviewData || !reviewData.reviewId) {
        return res.status(400).json({ error: 'Invalid review data received from Zapier' });
      }

      const tenant = await prisma.tenant.findFirst();
      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      const defaultLocation = await prisma.location.findFirst({ where: { tenantId: tenant.id } });
      if (!defaultLocation) {
        return res.status(400).json({ error: 'No location found to attach the review to' });
      }

      // Map Zapier's Google My Business payload to our database schema
      const ratingNum = typeof reviewData.starRating === 'number' ? reviewData.starRating : 
                        (reviewData.starRating === 'FIVE' ? 5 : 
                         reviewData.starRating === 'FOUR' ? 4 : 
                         reviewData.starRating === 'THREE' ? 3 : 
                         reviewData.starRating === 'TWO' ? 2 : 1);

      const review = await prisma.review.upsert({
        where: { googleReviewId: reviewData.reviewId },
        update: { 
          reviewerName: reviewData.reviewer?.displayName || 'Anonymous', 
          rating: ratingNum, 
          comment: reviewData.comment || '',
          createdAt: reviewData.createTime ? new Date(reviewData.createTime) : new Date()
        },
        create: { 
          locationId: defaultLocation.id,
          googleReviewId: reviewData.reviewId,
          reviewerName: reviewData.reviewer?.displayName || 'Anonymous',
          rating: ratingNum, 
          comment: reviewData.comment || '',
          createdAt: reviewData.createTime ? new Date(reviewData.createTime) : new Date()
        }
      });

      console.log('Successfully saved review from Zapier:', review.id);
      res.status(200).json({ success: true, message: 'Review processed successfully' });
    } catch (error) {
      console.error('Zapier webhook error:', error);
      res.status(500).json({ error: 'Internal server error processing webhook' });
    }
  });

  app.post('/api/reviews/sync', async (req, res) => {
    try {
      const tenant = await prisma.tenant.findFirst();
      if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

      if (!tenant.syncWebhookUrl) {
        // Since Zapier pushes automatically, we don't strictly need a syncWebhookUrl.
        // Return a friendly message instead of an error.
        return res.json({ 
          success: true, 
          reviews: [],
          message: 'Zapier is set up to automatically push new reviews in real-time. Please refresh the page to see any new reviews.' 
        });
      }

      // Call Webhook to trigger the Zap
      const response = await fetch(tenant.syncWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'sync_reviews' })
      });

      if (!response.ok) {
        console.error('Sync Webhook failed:', response.statusText);
        return res.status(500).json({ error: 'Failed to trigger sync via Webhook' });
      }

      // Zapier Webhooks usually return a success status, not the actual data immediately.
      // For a true sync, we would need a separate endpoint to receive the data from Zapier.
      // For now, we'll return a success message indicating the sync was triggered.
      res.json({ 
        success: true, 
        reviews: [],
        message: 'Sync triggered successfully. Reviews will be updated shortly.'
      });
    } catch (error) {
      console.error('Sync reviews error:', error);
      res.status(500).json({ error: 'Failed to sync reviews' });
    }
  });

  app.post('/api/reviews/:id/reply', async (req, res) => {
    try {
      const { id } = req.params;
      const { replyText, isRepliedByAI } = req.body;

      const tenant = await prisma.tenant.findFirst();
      if (!tenant || !tenant.replyWebhookUrl) {
        return res.status(400).json({ error: 'Reply Webhook URL is not configured in Settings.' });
      }

      const review = await prisma.review.findUnique({ where: { id } });
      if (!review) {
        return res.status(404).json({ error: 'Review not found' });
      }

      // Call Webhook to post the reply
      const response = await fetch(tenant.replyWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewId: review.googleReviewId,
          replyText
        })
      });

      if (!response.ok) {
        console.error('Reply Webhook failed:', response.statusText);
        return res.status(500).json({ error: 'Failed to send reply via Webhook' });
      }

      const updatedReview = await prisma.review.update({
        where: { id },
        data: { 
          replyText,
          isRepliedByAI: isRepliedByAI || false
        }
      });

      res.json({ success: true, review: updatedReview });
    } catch (error) {
      console.error('Submit reply error:', error);
      res.status(500).json({ error: 'Failed to submit reply' });
    }
  });

  // ==========================================
  // Posts API Routes
  // ==========================================

  app.get('/api/posts', async (req, res) => {
    try {
      const posts = await prisma.post.findMany({
        include: { location: true },
        orderBy: { createdAt: 'desc' }
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
          imageUrl
        },
        include: { location: true }
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
          imageUrl
        },
        include: { location: true }
      });
      
      res.json(post);
    } catch (error) {
      console.error('Update post error:', error);
      res.status(500).json({ error: 'Failed to update post' });
    }
  });

  app.delete('/api/posts/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.post.delete({ where: { id } });
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
        orderBy: { name: 'asc' }
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
        where: {
          tenantId: tenant.id,
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      });

      res.json({
        total: 20,
        used: usedQuota,
        remaining: Math.max(0, 20 - usedQuota)
      });
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
      if (!apiKey) {
        return res.status(500).json({ error: 'Gemini API key not configured' });
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const langInstruction = language === 'zh' 
        ? 'Please write the review in Simplified Chinese.' 
        : 'Please write the review in English.';

      const prompt = `Write a Google Maps review for a business. 
Keywords/Context: ${keywords}
${langInstruction}
The review should sound natural, authentic, and written by a real customer. Do not include placeholders like [Business Name]. Keep it concise (2-4 sentences).`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
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
      
      if (!googleAccountId || !content) {
        return res.status(400).json({ error: 'Google Account and content are required' });
      }

      const tenant = await prisma.tenant.findFirst();
      if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

      // Check quota
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      const usedQuota = await prisma.commentTask.count({
        where: {
          tenantId: tenant.id,
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      });

      if (usedQuota >= 20) {
        return res.status(403).json({ error: 'Monthly quota exceeded (20/20)' });
      }

      const task = await prisma.commentTask.create({
        data: {
          tenantId: tenant.id,
          googleAccountId,
          locationId: locationId || null,
          keywords,
          content,
          imageUrls: imageUrls || [],
          status: 'DRAFT'
        },
        include: {
          googleAccount: true,
          location: true
        }
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
        include: {
          googleAccount: true,
          location: true
        },
        orderBy: { createdAt: 'desc' }
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
        where: { location: { tenantId: tenant.id } }
      });

      const totalReviews = reviews.length;
      const averageRating = totalReviews > 0 
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1) 
        : '0.0';
      
      const repliedReviews = reviews.filter(r => r.replyText).length;
      const replyRate = totalReviews > 0 
        ? Math.round((repliedReviews / totalReviews) * 100) 
        : 0;

      res.json({
        locationsCount,
        totalReviews,
        averageRating,
        replyRate,
        repliedReviews,
        unrepliedReviews: totalReviews - repliedReviews
      });
    } catch (error) {
      console.error('Fetch dashboard stats error:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
  });

  // Example API Route (Placeholder for future implementation)
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
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: 'Missing query parameter' });
      }

      const serpApiKey = process.env.SERPAPI_KEY || '603217379ed95d286aef18d62c3d3ade08714b176e486c26933ce51aa1186010';
      
      const url = new URL('https://serpapi.com/search.json');
      url.searchParams.append('engine', 'google_maps');
      url.searchParams.append('q', q);
      url.searchParams.append('type', 'search');
      url.searchParams.append('api_key', serpApiKey);

      const response = await fetch(url.toString());
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch from SerpApi');
      }

      const results = (data.local_results || []).map((result: any) => ({
        title: result.title,
        address: result.address,
        lat: result.gps_coordinates?.latitude,
        lng: result.gps_coordinates?.longitude,
        rating: result.rating,
        reviews: result.reviews,
        place_id: result.place_id
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

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch from SerpApi');
      }

      let rank = 21; // Default to 21+ (not found in top 20)
      
      if (data.local_results && Array.isArray(data.local_results)) {
        const index = data.local_results.findIndex((result: any) => 
          result.title && result.title.toLowerCase().includes(businessName.toLowerCase())
        );
        
        if (index !== -1) {
          rank = index + 1; // 1-based ranking
        }
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

      if (!apiKey) {
        return res.status(400).json({ error: 'Gemini API Key not configured' });
      }

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
        Do not just give generic advice; tailor it to the visibility score. 
        For example:
        - If visibility is 0% or very low, focus on foundational Google Business Profile optimization, initial local citations, and getting the first few reviews.
        - If visibility is moderate, focus on keyword-rich review generation, adding photos, and posting Google Business updates.
        - If visibility is high, focus on expanding the service radius, targeting secondary keywords, or maintaining review velocity.
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
        include: { location: true }
      });

      if (!review) return res.status(404).json({ error: 'Review not found' });

      const tenant = await prisma.tenant.findFirst();
      if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

      const apiKey = tenant.geminiApiKey || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'Gemini API key not configured' });
      }

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
    // Development mode: Use Vite's middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve static files from dist
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
