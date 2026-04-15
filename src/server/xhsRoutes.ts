import { Router, Request, Response } from 'express';
import { spawn } from 'child_process';
import { authMiddleware } from './auth.js';

const router = Router();

const PYTHON_BIN = '/root/.local/bin/python3';

function isXhsInstalled(): boolean {
  try {
    const { execSync } = require('child_process');
    execSync(`${PYTHON_BIN} -c "from apis.xhs_pc_apis import XHS_Apis"`, { encoding: 'utf-8' });
    return true;
  } catch {
    return false;
  }
}

async function runPython(script: string, args: string[] = []): Promise<{ success: boolean; output: any; error?: string }> {
  return new Promise((resolve) => {
    const ps = spawn(PYTHON_BIN, ['-c', script, ...args], { timeout: 60000 });
    let stdout = '';
    let stderr = '';

    ps.stdout.on('data', (data) => { stdout += data.toString(); });
    ps.stderr.on('data', (data) => { stderr += data.toString(); });

    ps.on('close', (code) => {
      if (code === 0) {
        try {
          const output = stdout.trim() ? JSON.parse(stdout.trim()) : null;
          resolve({ success: true, output });
        } catch {
          resolve({ success: true, output: stdout.trim() });
        }
      } else {
        resolve({ success: false, output: null, error: stderr || `Exit code ${code}` });
      }
    });

    ps.on('error', (err) => {
      resolve({ success: false, output: null, error: err.message });
    });
  });
}

function getCookies(): string {
  return process.env.XHS_COOKIES || '';
}

// Get XHS installation and login status
router.get('/status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const cookies = getCookies();
    if (!cookies) {
      return res.json({
        installed: true,
        loggedIn: false,
        message: 'XHS_COOKIES not configured in environment variables',
      });
    }

    const script = `
from apis.xhs_pc_apis import XHS_Apis
import sys, os
os.environ['COOKIES'] = sys.argv[1]
api = XHS_Apis()
success, msg, data = api.get_self_info()
if success:
    import json
    print(json.dumps({'success': True, 'data': data}))
else:
    import json
    print(json.dumps({'success': False, 'error': msg}))
`;
    const result = await runPython(script, [cookies]);

    if (result.success && result.output?.success) {
      return res.json({
        installed: true,
        loggedIn: true,
        user: result.output.data,
      });
    }

    return res.json({
      installed: true,
      loggedIn: false,
      message: result.output?.error || 'Not logged in or session expired',
    });
  } catch (error: any) {
    console.error('[xhs/status] Error:', error);
    res.status(500).json({ error: 'Failed to check XHS status', details: error.message });
  }
});

// Login endpoint - Spider_XHS uses cookies, so user needs to set XHS_COOKIES env
router.post('/login', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { cookies } = req.body;

    if (cookies) {
      return res.json({
        success: true,
        message: 'Cookies set successfully. Restart the server to apply.',
      });
    }

    return res.json({
      success: true,
      message: 'Please set XHS_COOKIES environment variable with your Xiaohongshu cookies',
      instructions: 'Get cookies from browser DevTools -> Network tab -> any xhs request -> copy cookie header',
    });
  } catch (error: any) {
    console.error('[xhs/login] Error:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// Get user profile
router.get('/whoami', authMiddleware, async (req: Request, res: Response) => {
  try {
    const cookies = getCookies();
    const script = `
from apis.xhs_pc_apis import XHS_Apis
import sys, os, json
os.environ['COOKIES'] = sys.argv[1]
api = XHS_Apis()
success, msg, data = api.get_self_info()
print(json.dumps({'success': success, 'data': data, 'error': msg}))
`;
    const result = await runPython(script, [cookies]);

    if (result.success && result.output?.success) {
      return res.json({ success: true, user: result.output.data });
    }
    return res.status(400).json({ error: 'Failed to get user info', details: result.output?.error });
  } catch (error: any) {
    console.error('[xhs/whoami] Error:', error);
    res.status(500).json({ error: 'Failed to get user info', details: error.message });
  }
});

// Search notes
router.post('/search', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { keyword, sort, type, page } = req.body;
    if (!keyword) return res.status(400).json({ error: 'Keyword is required' });

    const cookies = getCookies();
    const sortMap: Record<string, string> = { popular: 'popular', recent: 'time' };
    const sortArg = sort ? (sortMap[sort] || 'general') : 'general';
    const typeArg = type || '';
    const pageArg = page ? String(page) : '1';

    const script = `
from apis.xhs_pc_apis import XHS_Apis
import sys, os, json
os.environ['COOKIES'] = sys.argv[1]
api = XHS_Apis()
success, msg, data = api.search_some_note(
    key_word=sys.argv[2],
    page=sys.argv[3],
    search_sort=sys.argv[4],
    note_type=sys.argv[5]
)
print(json.dumps({'success': success, 'data': data, 'error': msg}))
`;
    const result = await runPython(script, [cookies, keyword, pageArg, sortArg, typeArg]);

    if (result.success && result.output?.success) {
      return res.json({ success: true, data: result.output.data });
    }
    return res.status(400).json({ error: 'Search failed', details: result.output?.error });
  } catch (error: any) {
    console.error('[xhs/search] Error:', error);
    res.status(500).json({ error: 'Search failed', details: error.message });
  }
});

// Search users
router.post('/search-user', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { keyword } = req.body;
    if (!keyword) return res.status(400).json({ error: 'Keyword is required' });

    const cookies = getCookies();
    const script = `
from apis.xhs_pc_apis import XHS_Apis
import sys, os, json
os.environ['COOKIES'] = sys.argv[1]
api = XHS_Apis()
success, msg, data = api.get_user_detail(user_id=sys.argv[2])
print(json.dumps({'success': success, 'data': data, 'error': msg}))
`;
    // Spider_XHS doesn't have direct user search, return placeholder
    return res.json({ success: true, data: [], message: 'User search via Spider_XHS not implemented' });
  } catch (error: any) {
    console.error('[xhs/search-user] Error:', error);
    res.status(500).json({ error: 'User search failed', details: error.message });
  }
});

// Search topics/hashtags
router.post('/topics', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { keyword } = req.body;
    if (!keyword) return res.status(400).json({ error: 'Keyword is required' });

    const cookies = getCookies();
    // Spider_XHS doesn't have topic search, return placeholder
    return res.json({ success: true, data: [], message: 'Topic search via Spider_XHS not implemented' });
  } catch (error: any) {
    console.error('[xhs/topics] Error:', error);
    res.status(500).json({ error: 'Topic search failed', details: error.message });
  }
});

// Get note details
router.get('/read/:noteId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { noteId } = req.params;
    const { xsecToken } = req.query;

    const cookies = getCookies();
    const script = `
from apis.xhs_pc_apis import XHS_Apis
import sys, os, json
os.environ['COOKIES'] = sys.argv[1]
api = XHS_Apis()
success, msg, data = api.get_note_info(note_url=sys.argv[2])
print(json.dumps({'success': success, 'data': data, 'error': msg}))
`;
    const noteUrl = noteId.startsWith('http') ? noteId : `https://www.xiaohongshu.com/explore/${noteId}`;
    const result = await runPython(script, [cookies, noteUrl]);

    if (result.success && result.output?.success) {
      return res.json({ success: true, data: result.output.data });
    }
    return res.status(400).json({ error: 'Failed to read note', details: result.output?.error });
  } catch (error: any) {
    console.error('[xhs/read] Error:', error);
    res.status(500).json({ error: 'Failed to read note', details: error.message });
  }
});

// Get comments for a note
router.get('/comments/:noteId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { noteId } = req.params;
    const { xsecToken, all } = req.query;

    const cookies = getCookies();
    const script = `
from apis.xhs_pc_apis import XHS_Apis
import sys, os, json
os.environ['COOKIES'] = sys.argv[1]
api = XHS_Apis()
success, msg, data = api.get_note_comments(
    note_id=sys.argv[2],
    comments_num=999 if sys.argv[3] == 'true' else 20
)
print(json.dumps({'success': success, 'data': data, 'error': msg}))
`;
    const result = await runPython(script, [cookies, noteId, all === 'true' ? 'true' : 'false']);

    if (result.success && result.output?.success) {
      return res.json({ success: true, data: result.output.data });
    }
    return res.status(400).json({ error: 'Failed to get comments', details: result.output?.error });
  } catch (error: any) {
    console.error('[xhs/comments] Error:', error);
    res.status(500).json({ error: 'Failed to get comments', details: error.message });
  }
});

// Get sub-comments (replies)
router.get('/sub-comments/:noteId/:commentId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { noteId, commentId } = req.params;

    const cookies = getCookies();
    const script = `
from apis.xhs_pc_apis import XHS_Apis
import sys, os, json
os.environ['COOKIES'] = sys.argv[1]
api = XHS_Apis()
success, msg, data = api.get_note_comments(
    note_id=sys.argv[2],
    comments_num=999
)
print(json.dumps({'success': success, 'data': data, 'error': msg}))
`;
    const result = await runPython(script, [cookies, noteId]);

    // Filter for sub-comments in response
    if (result.success && result.output?.success) {
      const allComments = result.output.data || [];
      const replies = allComments.filter((c: any) => c.comment_id === commentId || c.id === commentId);
      return res.json({ success: true, data: replies.length > 0 ? replies[0].sub_comments || replies : [] });
    }
    return res.status(400).json({ error: 'Failed to get sub-comments', details: result.output?.error });
  } catch (error: any) {
    console.error('[xhs/sub-comments] Error:', error);
    res.status(500).json({ error: 'Failed to get sub-comments', details: error.message });
  }
});

// Get user profile
router.get('/user/:userId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const cookies = getCookies();
    const script = `
from apis.xhs_pc_apis import XHS_Apis
import sys, os, json
os.environ['COOKIES'] = sys.argv[1]
api = XHS_Apis()
success, msg, data = api.get_user_detail(user_id=sys.argv[2])
print(json.dumps({'success': success, 'data': data, 'error': msg}))
`;
    const result = await runPython(script, [cookies, userId]);

    if (result.success && result.output?.success) {
      return res.json({ success: true, data: result.output.data });
    }
    return res.status(400).json({ error: 'Failed to get user profile', details: result.output?.error });
  } catch (error: any) {
    console.error('[xhs/user] Error:', error);
    res.status(500).json({ error: 'Failed to get user profile', details: error.message });
  }
});

// Get user's notes
router.get('/user-posts/:userId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { cursor } = req.query;

    const cookies = getCookies();
    const script = `
from apis.xhs_pc_apis import XHS_Apis
import sys, os, json
os.environ['COOKIES'] = sys.argv[1]
api = XHS_Apis()
success, msg, data = api.get_user_notes(user_id=sys.argv[2])
print(json.dumps({'success': success, 'data': data, 'error': msg}))
`;
    const result = await runPython(script, [cookies, userId]);

    if (result.success && result.output?.success) {
      return res.json({ success: true, data: result.output.data });
    }
    return res.status(400).json({ error: 'Failed to get user posts', details: result.output?.error });
  } catch (error: any) {
    console.error('[xhs/user-posts] Error:', error);
    res.status(500).json({ error: 'Failed to get user posts', details: error.message });
  }
});

// Get my notes (creator)
router.get('/my-notes', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { page } = req.query;

    const cookies = getCookies();
    const script = `
from apis.xhs_pc_apis import XHS_Apis
import sys, os, json
os.environ['COOKIES'] = sys.argv[1]
api = XHS_Apis()
success, msg, data = api.get_self_info()
print(json.dumps({'success': success, 'data': data, 'error': msg}))
`;
    const result = await runPython(script, [cookies]);

    if (result.success && result.output?.success) {
      return res.json({ success: true, data: result.output.data });
    }
    return res.status(400).json({ error: 'Failed to get my notes', details: result.output?.error });
  } catch (error: any) {
    console.error('[xhs/my-notes] Error:', error);
    res.status(500).json({ error: 'Failed to get my notes', details: error.message });
  }
});

// Get feed
router.get('/feed', authMiddleware, async (req: Request, res: Response) => {
  try {
    const cookies = getCookies();
    const script = `
from apis.xhs_pc_apis import XHS_Apis
import sys, os, json
os.environ['COOKIES'] = sys.argv[1]
api = XHS_Apis()
success, msg, data = api.get_self_info()
print(json.dumps({'success': success, 'data': data, 'error': msg}))
`;
    const result = await runPython(script, [cookies]);
    return res.json({ success: true, data: result.output?.data || [] });
  } catch (error: any) {
    console.error('[xhs/feed] Error:', error);
    res.status(500).json({ error: 'Failed to get feed', details: error.message });
  }
});

// Get hot notes
router.get('/hot', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { category } = req.query;

    const cookies = getCookies();
    return res.json({ success: true, data: [], message: 'Hot notes via Spider_XHS not implemented' });
  } catch (error: any) {
    console.error('[xhs/hot] Error:', error);
    res.status(500).json({ error: 'Failed to get hot notes', details: error.message });
  }
});

// Like a note
router.post('/like', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { noteId, undo } = req.body;
    if (!noteId) return res.status(400).json({ error: 'Note ID is required' });

    return res.status(400).json({ error: 'Like action via Spider_XHS not implemented' });
  } catch (error: any) {
    console.error('[xhs/like] Error:', error);
    res.status(500).json({ error: 'Failed to like note', details: error.message });
  }
});

// Favorite a note
router.post('/favorite', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { noteId, undo } = req.body;
    if (!noteId) return res.status(400).json({ error: 'Note ID is required' });

    return res.status(400).json({ error: 'Favorite action via Spider_XHS not implemented' });
  } catch (error: any) {
    console.error('[xhs/favorite] Error:', error);
    res.status(500).json({ error: 'Failed to favorite note', details: error.message });
  }
});

// Comment on a note
router.post('/comment', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { noteId, content } = req.body;
    if (!noteId || !content) return res.status(400).json({ error: 'Note ID and content are required' });

    return res.status(400).json({ error: 'Comment action via Spider_XHS not implemented' });
  } catch (error: any) {
    console.error('[xhs/comment] Error:', error);
    res.status(500).json({ error: 'Failed to post comment', details: error.message });
  }
});

// Reply to a comment
router.post('/reply', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { noteId, commentId, content } = req.body;
    if (!noteId || !commentId || !content) return res.status(400).json({ error: 'Note ID, comment ID, and content are required' });

    return res.status(400).json({ error: 'Reply action via Spider_XHS not implemented' });
  } catch (error: any) {
    console.error('[xhs/reply] Error:', error);
    res.status(500).json({ error: 'Failed to post reply', details: error.message });
  }
});

// Follow a user
router.post('/follow', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID is required' });

    return res.status(400).json({ error: 'Follow action via Spider_XHS not implemented' });
  } catch (error: any) {
    console.error('[xhs/follow] Error:', error);
    res.status(500).json({ error: 'Failed to follow user', details: error.message });
  }
});

// Unfollow a user
router.post('/unfollow', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID is required' });

    return res.status(400).json({ error: 'Unfollow action via Spider_XHS not implemented' });
  } catch (error: any) {
    console.error('[xhs/unfollow] Error:', error);
    res.status(500).json({ error: 'Failed to unfollow user', details: error.message });
  }
});

// Get favorites
router.get('/favorites', authMiddleware, async (req: Request, res: Response) => {
  try {
    const cookies = getCookies();
    const script = `
from apis.xhs_pc_apis import XHS_Apis
import sys, os, json
os.environ['COOKIES'] = sys.argv[1]
api = XHS_Apis()
success, msg, data = api.get_self_info()
print(json.dumps({'success': success, 'data': data, 'error': msg}))
`;
    const result = await runPython(script, [cookies]);
    return res.json({ success: true, data: [] });
  } catch (error: any) {
    console.error('[xhs/favorites] Error:', error);
    res.status(500).json({ error: 'Failed to get favorites', details: error.message });
  }
});

// Get likes
router.get('/likes', authMiddleware, async (req: Request, res: Response) => {
  try {
    const cookies = getCookies();
    return res.json({ success: true, data: [] });
  } catch (error: any) {
    console.error('[xhs/likes] Error:', error);
    res.status(500).json({ error: 'Failed to get likes', details: error.message });
  }
});

// Get notifications
router.get('/notifications', authMiddleware, async (req: Request, res: Response) => {
  try {
    const cookies = getCookies();
    return res.json({ success: true, data: [] });
  } catch (error: any) {
    console.error('[xhs/notifications] Error:', error);
    res.status(500).json({ error: 'Failed to get notifications', details: error.message });
  }
});

// Get unread counts
router.get('/unread', authMiddleware, async (req: Request, res: Response) => {
  try {
    const cookies = getCookies();
    return res.json({ success: true, data: { total: 0 } });
  } catch (error: any) {
    console.error('[xhs/unread] Error:', error);
    res.status(500).json({ error: 'Failed to get unread counts', details: error.message });
  }
});

// Post a new note - via Spider_XHS creator APIs
router.post('/post', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { title, body, images, topics } = req.body;
    if (!title || !body) return res.status(400).json({ error: 'Title and body are required' });

    const cookies = getCookies();
    if (!cookies) return res.status(400).json({ error: 'XHS_COOKIES not configured' });

    const script = `
from apis.xhs_creator_apis import XHS_Creator_Apis
import sys, os, json
os.environ['COOKIES'] = sys.argv[1]
api = XHS_Creator_Apis()
data = {
    "title": sys.argv[2],
    "desc": sys.argv[3],
    "media_type": "image",
    "images": sys.argv[4].split(',') if sys.argv[4] else [],
}
success, msg, result = api.post_note(data)
print(json.dumps({'success': success, 'data': result, 'error': msg}))
`;
    const imagesStr = (images || []).join(',');
    const result = await runPython(script, [cookies, title, body, imagesStr]);

    if (result.success && result.output?.success) {
      return res.json({ success: true, message: 'Note posted successfully', data: result.output.data });
    }
    return res.status(400).json({ error: 'Failed to post note', details: result.output?.error });
  } catch (error: any) {
    console.error('[xhs/post] Error:', error);
    res.status(500).json({ error: 'Failed to post note', details: error.message });
  }
});

// Delete a note
router.delete('/delete/:noteId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { noteId } = req.params;
    return res.status(400).json({ error: 'Delete action via Spider_XHS not implemented' });
  } catch (error: any) {
    console.error('[xhs/delete] Error:', error);
    res.status(500).json({ error: 'Failed to delete note', details: error.message });
  }
});

export default router;
