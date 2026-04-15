import { Router, Request, Response } from 'express';
import { spawn } from 'child_process';
import { authMiddleware } from './auth.js';

const router = Router();

const PYTHON_BIN = '/app/venv/bin/python3';
const SPIDER_XHS_PATH = '/app/spider_xhs';

function getCookies(): string {
  return process.env.XHS_COOKIES || '';
}

function getCreatorCookies(): string {
  return process.env.XHS_CREATOR_COOKIES || '';
}

async function runPython(script: string, args: string[] = []): Promise<{ success: boolean; output: any; error?: string }> {
  return new Promise((resolve) => {
    // Prepend sys.path insertion to script
    const fullScript = `
import sys
sys.path.insert(0, '${SPIDER_XHS_PATH}')
${script}
`;
    const ps = spawn(PYTHON_BIN, ['-c', fullScript, ...args], { timeout: 120000 });
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
import sys, os, json
os.environ['COOKIES'] = sys.argv[1]
api = XHS_Apis()
success, msg, data = api.get_user_self_info()
print(json.dumps({'success': success, 'data': data, 'error': msg}))
`;
    const result = await runPython(script, [cookies]);

    if (result.success && result.output?.success) {
      return res.json({
        installed: true,
        loggedIn: true,
        user: result.output.data?.data || result.output.data,
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

// Login endpoint - Spider_XHS uses cookies
router.post('/login', authMiddleware, async (req: Request, res: Response) => {
  try {
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

// Get user profile (whoami)
router.get('/whoami', authMiddleware, async (req: Request, res: Response) => {
  try {
    const cookies = getCookies();
    if (!cookies) return res.status(400).json({ error: 'XHS_COOKIES not configured' });

    const script = `
from apis.xhs_pc_apis import XHS_Apis
import sys, os, json
os.environ['COOKIES'] = sys.argv[1]
api = XHS_Apis()
success, msg, data = api.get_user_self_info()
print(json.dumps({'success': success, 'data': data, 'error': msg}))
`;
    const result = await runPython(script, [cookies]);

    if (result.success && result.output?.success) {
      return res.json({ success: true, user: result.output.data?.data || result.output.data });
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
    if (!cookies) return res.status(400).json({ error: 'XHS_COOKIES not configured' });

    // sort: 0=综合, 1=最新, 2=最多点赞, 3=最多评论, 4=最多收藏
    const sortMap: Record<string, number> = { popular: 2, recent: 1, general: 0 };
    const sortArg = sort ? (sortMap[sort] ?? 0) : 0;
    const pageArg = page ? String(page) : '10';

    const script = `
from apis.xhs_pc_apis import XHS_Apis
import sys, os, json
os.environ['COOKIES'] = sys.argv[1]
api = XHS_Apis()
success, msg, data = api.search_some_note(
    query=sys.argv[2],
    require_num=int(sys.argv[3]),
    sort_type_choice=int(sys.argv[4])
)
print(json.dumps({'success': success, 'data': data, 'error': msg}))
`;
    const result = await runPython(script, [cookies, keyword, pageArg, String(sortArg)]);

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
    if (!cookies) return res.status(400).json({ error: 'XHS_COOKIES not configured' });

    const script = `
from apis.xhs_pc_apis import XHS_Apis
import sys, os, json
os.environ['COOKIES'] = sys.argv[1]
api = XHS_Apis()
success, msg, data = api.search_some_user(query=sys.argv[2], require_num=20)
print(json.dumps({'success': success, 'data': data, 'error': msg}))
`;
    const result = await runPython(script, [cookies, keyword]);

    if (result.success && result.output?.success) {
      return res.json({ success: true, data: result.output.data });
    }
    return res.status(400).json({ error: 'User search failed', details: result.output?.error });
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
    if (!cookies) return res.status(400).json({ error: 'XHS_COOKIES not configured' });

    // Spider_XHS doesn't have direct topic search in PC APIs
    // Return search results as topics
    const script = `
from apis.xhs_pc_apis import XHS_Apis
import sys, os, json
os.environ['COOKIES'] = sys.argv[1]
api = XHS_Apis()
success, msg, data = api.search_some_note(query=sys.argv[2], require_num=20)
print(json.dumps({'success': success, 'data': data, 'error': msg}))
`;
    const result = await runPython(script, [cookies, keyword]);

    if (result.success && result.output?.success) {
      return res.json({ success: true, data: result.output.data });
    }
    return res.status(400).json({ error: 'Topic search failed', details: result.output?.error });
  } catch (error: any) {
    console.error('[xhs/topics] Error:', error);
    res.status(500).json({ error: 'Topic search failed', details: error.message });
  }
});

// Get note details
router.get('/read/:noteId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { noteId } = req.params;
    const cookies = getCookies();
    if (!cookies) return res.status(400).json({ error: 'XHS_COOKIES not configured' });

    const script = `
from apis.xhs_pc_apis import XHS_Apis
import sys, os, json
os.environ['COOKIES'] = sys.argv[1]
api = XHS_Apis()
# Build note URL
note_id = sys.argv[2]
url = f'https://www.xiaohongshu.com/explore/{note_id}' if not note_id.startswith('http') else note_id
success, msg, data = api.get_note_info(url)
print(json.dumps({'success': success, 'data': data, 'error': msg}))
`;
    const result = await runPython(script, [cookies, noteId]);

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
    const { all } = req.query;

    const cookies = getCookies();
    if (!cookies) return res.status(400).json({ error: 'XHS_COOKIES not configured' });

    const script = `
from apis.xhs_pc_apis import XHS_Apis
import sys, os, json
os.environ['COOKIES'] = sys.argv[1]
api = XHS_Apis()
note_id = sys.argv[2]
url = f'https://www.xiaohongshu.com/explore/{note_id}' if not note_id.startswith('http') else note_id
success, msg, data = api.get_note_all_comment(url)
print(json.dumps({'success': success, 'data': data, 'error': msg}))
`;
    const result = await runPython(script, [cookies, noteId]);

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
    if (!cookies) return res.status(400).json({ error: 'XHS_COOKIES not configured' });

    const script = `
from apis.xhs_pc_apis import XHS_Apis
import sys, os, json
os.environ['COOKIES'] = sys.argv[1]
api = XHS_Apis()
note_id = sys.argv[2]
url = f'https://www.xiaohongshu.com/explore/{note_id}' if not note_id.startswith('http') else note_id
success, msg, data = api.get_note_all_comment(url)
print(json.dumps({'success': success, 'data': data, 'error': msg}))
`;
    const result = await runPython(script, [cookies, noteId]);

    if (result.success && result.output?.success) {
      const allComments = result.output.data || [];
      const targetComment = allComments.find((c: any) => c.id === commentId || c.comment_id === commentId);
      return res.json({ success: true, data: targetComment?.sub_comments || [] });
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
    if (!cookies) return res.status(400).json({ error: 'XHS_COOKIES not configured' });

    const script = `
from apis.xhs_pc_apis import XHS_Apis
import sys, os, json
os.environ['COOKIES'] = sys.argv[1]
api = XHS_Apis()
success, msg, data = api.get_user_info(user_id=sys.argv[2])
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
    const cookies = getCookies();
    if (!cookies) return res.status(400).json({ error: 'XHS_COOKIES not configured' });

    const script = `
from apis.xhs_pc_apis import XHS_Apis
import sys, os, json
os.environ['COOKIES'] = sys.argv[1]
api = XHS_Apis()
user_url = f'https://www.xiaohongshu.com/user/profile/{sys.argv[2]}'
success, msg, data = api.get_user_all_notes(user_url)
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
    const cookies = getCreatorCookies() || getCookies();

    if (!cookies) {
      return res.status(400).json({ error: 'XHS_CREATOR_COOKIES not configured for post operations' });
    }

    const script = `
from apis.xhs_creator_apis import XHS_Creator_Apis
from apis.xhs_utils.cookie_util import trans_cookies
import sys, os, json
cookies_str = sys.argv[1]
cookies = trans_cookies(cookies_str)
api = XHS_Creator_Apis()
success, msg, data = api.get_publish_note_info(page=sys.argv[2] if len(sys.argv) > 2 and sys.argv[2] else None, cookies_str=cookies_str)
print(json.dumps({'success': success, 'data': data, 'error': msg}))
`;
    const result = await runPython(script, [cookies, page ? String(page) : '']);

    if (result.success && result.output?.success) {
      return res.json({ success: true, data: result.output.data });
    }
    return res.status(400).json({ error: 'Failed to get my notes', details: result.output?.error });
  } catch (error: any) {
    console.error('[xhs/my-notes] Error:', error);
    res.status(500).json({ error: 'Failed to get my notes', details: error.message });
  }
});

// Get feed / homepage
router.get('/feed', authMiddleware, async (req: Request, res: Response) => {
  try {
    const cookies = getCookies();
    if (!cookies) return res.status(400).json({ error: 'XHS_COOKIES not configured' });

    const script = `
from apis.xhs_pc_apis import XHS_Apis
import sys, os, json
os.environ['COOKIES'] = sys.argv[1]
api = XHS_Apis()
success, msg, data = api.get_homefeed_recommend_by_num(category='', require_num=20)
print(json.dumps({'success': success, 'data': data, 'error': msg}))
`;
    const result = await runPython(script, [cookies]);

    if (result.success && result.output?.success) {
      return res.json({ success: true, data: result.output.data });
    }
    return res.status(400).json({ error: 'Failed to get feed', details: result.output?.error });
  } catch (error: any) {
    console.error('[xhs/feed] Error:', error);
    res.status(500).json({ error: 'Failed to get feed', details: error.message });
  }
});

// Get hot notes
router.get('/hot', authMiddleware, async (req: Request, res: Response) => {
  try {
    const cookies = getCookies();
    if (!cookies) return res.status(400).json({ error: 'XHS_COOKIES not configured' });

    const script = `
from apis.xhs_pc_apis import XHS_Apis
import sys, os, json
os.environ['COOKIES'] = sys.argv[1]
api = XHS_Apis()
success, msg, data = api.get_homefeed_recommend_by_num(category='64cdf9d5000000001e00db38', require_num=30)
print(json.dumps({'success': success, 'data': data, 'error': msg}))
`;
    const result = await runPython(script, [cookies]);

    if (result.success && result.output?.success) {
      return res.json({ success: true, data: result.output.data });
    }
    return res.status(400).json({ error: 'Failed to get hot notes', details: result.output?.error });
  } catch (error: any) {
    console.error('[xhs/hot] Error:', error);
    res.status(500).json({ error: 'Failed to get hot notes', details: error.message });
  }
});

// Like a note - Spider_XHS does NOT support posting likes, only getting likes list
router.post('/like', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { noteId, undo } = req.body;
    if (!noteId) return res.status(400).json({ error: 'Note ID is required' });

    return res.status(501).json({
      error: 'Like/Unlike action is not supported by Spider_XHS',
      supported: 'Spider_XHS only supports data collection (GET), not interactions (POST/PUT/DELETE)',
      note: 'You can use Spider_XHS to GET likes lists, but cannot POST likes',
    });
  } catch (error: any) {
    console.error('[xhs/like] Error:', error);
    res.status(500).json({ error: 'Failed to like note', details: error.message });
  }
});

// Favorite a note - Spider_XHS does NOT support posting favorites
router.post('/favorite', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { noteId, undo } = req.body;
    if (!noteId) return res.status(400).json({ error: 'Note ID is required' });

    return res.status(501).json({
      error: 'Favorite/Collect action is not supported by Spider_XHS',
      supported: 'Spider_XHS only supports data collection (GET), not interactions (POST/PUT/DELETE)',
    });
  } catch (error: any) {
    console.error('[xhs/favorite] Error:', error);
    res.status(500).json({ error: 'Failed to favorite note', details: error.message });
  }
});

// Comment on a note - Spider_XHS does NOT support posting comments
router.post('/comment', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { noteId, content } = req.body;
    if (!noteId || !content) return res.status(400).json({ error: 'Note ID and content are required' });

    return res.status(501).json({
      error: 'Post comment is not supported by Spider_XHS',
      supported: 'Spider_XHS only supports data collection (GET), not interactions (POST/PUT/DELETE)',
    });
  } catch (error: any) {
    console.error('[xhs/comment] Error:', error);
    res.status(500).json({ error: 'Failed to post comment', details: error.message });
  }
});

// Reply to a comment - Spider_XHS does NOT support posting replies
router.post('/reply', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { noteId, commentId, content } = req.body;
    if (!noteId || !commentId || !content) return res.status(400).json({ error: 'Note ID, comment ID, and content are required' });

    return res.status(501).json({
      error: 'Post reply is not supported by Spider_XHS',
      supported: 'Spider_XHS only supports data collection (GET), not interactions (POST/PUT/DELETE)',
    });
  } catch (error: any) {
    console.error('[xhs/reply] Error:', error);
    res.status(500).json({ error: 'Failed to post reply', details: error.message });
  }
});

// Follow a user - Spider_XHS does NOT support posting follows
router.post('/follow', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID is required' });

    return res.status(501).json({
      error: 'Follow action is not supported by Spider_XHS',
      supported: 'Spider_XHS only supports data collection (GET), not interactions (POST/PUT/DELETE)',
    });
  } catch (error: any) {
    console.error('[xhs/follow] Error:', error);
    res.status(500).json({ error: 'Failed to follow user', details: error.message });
  }
});

// Unfollow a user - Spider_XHS does NOT support posting unfollows
router.post('/unfollow', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID is required' });

    return res.status(501).json({
      error: 'Unfollow action is not supported by Spider_XHS',
      supported: 'Spider_XHS only supports data collection (GET), not interactions (POST/PUT/DELETE)',
    });
  } catch (error: any) {
    console.error('[xhs/unfollow] Error:', error);
    res.status(500).json({ error: 'Failed to unfollow user', details: error.message });
  }
});

// Get favorites - GET user's liked notes
router.get('/favorites', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    const cookies = getCookies();
    if (!cookies) return res.status(400).json({ error: 'XHS_COOKIES not configured' });

    // If userId provided, get that user's liked notes
    // Otherwise get own liked notes (need own user_id first)
    if (userId) {
      const script = `
from apis.xhs_pc_apis import XHS_Apis
import sys, os, json
os.environ['COOKIES'] = sys.argv[1]
api = XHS_Apis()
user_url = f'https://www.xiaohongshu.com/user/profile/{sys.argv[2]}?xsec_source=pc_user'
success, msg, data = api.get_user_all_like_note_info(user_url)
print(json.dumps({'success': success, 'data': data, 'error': msg}))
`;
      const result = await runPython(script, [cookies, String(userId)]);
      if (result.success && result.output?.success) {
        return res.json({ success: true, data: result.output.data });
      }
      return res.status(400).json({ error: 'Failed to get favorites', details: result.output?.error });
    }

    return res.json({ success: true, data: [], message: 'Provide userId to get favorites' });
  } catch (error: any) {
    console.error('[xhs/favorites] Error:', error);
    res.status(500).json({ error: 'Failed to get favorites', details: error.message });
  }
});

// Get likes - GET likes notifications
router.get('/likes', authMiddleware, async (req: Request, res: Response) => {
  try {
    const cookies = getCookies();
    if (!cookies) return res.status(400).json({ error: 'XHS_COOKIES not configured' });

    const script = `
from apis.xhs_pc_apis import XHS_Apis
import sys, os, json
os.environ['COOKIES'] = sys.argv[1]
api = XHS_Apis()
success, msg, data = api.get_all_likesAndcollects()
print(json.dumps({'success': success, 'data': data, 'error': msg}))
`;
    const result = await runPython(script, [cookies]);

    if (result.success && result.output?.success) {
      return res.json({ success: true, data: result.output.data });
    }
    return res.status(400).json({ error: 'Failed to get likes', details: result.output?.error });
  } catch (error: any) {
    console.error('[xhs/likes] Error:', error);
    res.status(500).json({ error: 'Failed to get likes', details: error.message });
  }
});

// Get notifications - @ mentions and comments
router.get('/notifications', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { type } = req.query;
    const cookies = getCookies();
    if (!cookies) return res.status(400).json({ error: 'XHS_COOKIES not configured' });

    if (type === 'mentions') {
      const script = `
from apis.xhs_pc_apis import XHS_Apis
import sys, os, json
os.environ['COOKIES'] = sys.argv[1]
api = XHS_Apis()
success, msg, data = api.get_all_metions()
print(json.dumps({'success': success, 'data': data, 'error': msg}))
`;
      const result = await runPython(script, [cookies]);
      if (result.success && result.output?.success) {
        return res.json({ success: true, data: result.output.data });
      }
      return res.status(400).json({ error: 'Failed to get mentions', details: result.output?.error });
    }

    const script = `
from apis.xhs_pc_apis import XHS_Apis
import sys, os, json
os.environ['COOKIES'] = sys.argv[1]
api = XHS_Apis()
success, msg, data = api.get_all_metions()
print(json.dumps({'success': success, 'data': data, 'error': msg}))
`;
    const result = await runPython(script, [cookies]);

    if (result.success && result.output?.success) {
      return res.json({ success: true, data: result.output.data });
    }
    return res.status(400).json({ error: 'Failed to get notifications', details: result.output?.error });
  } catch (error: any) {
    console.error('[xhs/notifications] Error:', error);
    res.status(500).json({ error: 'Failed to get notifications', details: error.message });
  }
});

// Get unread counts
router.get('/unread', authMiddleware, async (req: Request, res: Response) => {
  try {
    const cookies = getCookies();
    if (!cookies) return res.status(400).json({ error: 'XHS_COOKIES not configured' });

    const script = `
from apis.xhs_pc_apis import XHS_Apis
import sys, os, json
os.environ['COOKIES'] = sys.argv[1]
api = XHS_Apis()
success, msg, data = api.get_unread_message()
print(json.dumps({'success': success, 'data': data, 'error': msg}))
`;
    const result = await runPython(script, [cookies]);

    if (result.success && result.output?.success) {
      return res.json({ success: true, data: result.output.data?.data || result.output.data });
    }
    return res.status(400).json({ error: 'Failed to get unread counts', details: result.output?.error });
  } catch (error: any) {
    console.error('[xhs/unread] Error:', error);
    res.status(500).json({ error: 'Failed to get unread counts', details: error.message });
  }
});

// Post a new note - via Spider_XHS creator APIs
router.post('/post', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { title, body, images, topics, location, type } = req.body;
    if (!title || !body) return res.status(400).json({ error: 'Title and body are required' });

    const cookies = getCreatorCookies();
    if (!cookies) return res.status(400).json({ error: 'XHS_CREATOR_COOKIES not configured. Creator cookies are needed for posting.' });

    // topics format: ['话题1', '话题2'] - will be formatted for API
    const topicsJson = JSON.stringify(topics || []);

    const script = `
from apis.xhs_creator_apis import XHS_Creator_Apis
from apis.xhs_utils.cookie_util import trans_cookies
import sys, os, json

cookies_str = sys.argv[1]
noteInfo = {
    "title": sys.argv[2],
    "desc": sys.argv[3],
    "postTime": None,
    "location": sys.argv[4] if sys.argv[4] != 'null' else None,
    "type": int(sys.argv[5]) if sys.argv[5] else 0,
    "media_type": "image",
    "topics": json.loads(sys.argv[6]) if sys.argv[6] else [],
}

# Handle images - read from URLs or local paths
image_urls = json.loads(sys.argv[7]) if len(sys.argv) > 7 and sys.argv[7] else []
# For now, pass image data as empty since we can't upload files through exec
noteInfo["images"] = []

api = XHS_Creator_Apis()
success, msg, result = api.post_note(noteInfo, cookies_str)
print(json.dumps({'success': success, 'data': result, 'error': msg}))
`;
    const locationArg = location || 'null';
    const typeArg = type !== undefined ? String(type) : '0';
    const imagesJson = JSON.stringify(images || []);

    const result = await runPython(script, [cookies, title, body, locationArg, typeArg, topicsJson, imagesJson]);

    if (result.success && result.output?.success) {
      return res.json({ success: true, message: 'Note posted successfully', data: result.output.data });
    }
    return res.status(400).json({ error: 'Failed to post note', details: result.output?.error });
  } catch (error: any) {
    console.error('[xhs/post] Error:', error);
    res.status(500).json({ error: 'Failed to post note', details: error.message });
  }
});

// Delete a note - Spider_XHS does NOT support deleting
router.delete('/delete/:noteId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { noteId } = req.params;
    return res.status(501).json({
      error: 'Delete action is not supported by Spider_XHS',
      supported: 'Spider_XHS only supports data collection (GET), not interactions (POST/PUT/DELETE)',
    });
  } catch (error: any) {
    console.error('[xhs/delete] Error:', error);
    res.status(500).json({ error: 'Failed to delete note', details: error.message });
  }
});

export default router;
