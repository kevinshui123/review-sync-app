import { Router, Request, Response } from 'express';
import { execSync } from 'child_process';
import { authMiddleware, AuthRequest } from './auth.js';

const router = Router();

// Check if xhs CLI is installed
function isXhsInstalled(): boolean {
  try {
    execSync('which xhs', { encoding: 'utf-8' });
    return true;
  } catch {
    return false;
  }
}

// Run xhs command and return output
async function runXhsCommand(args: string[]): Promise<{ success: boolean; output: string; error?: string }> {
  try {
    const cmd = ['xhs', ...args].join(' ');
    console.log(`[xhs] Running: ${cmd}`);
    const output = execSync(cmd, { encoding: 'utf-8', timeout: 60000 });
    return { success: true, output: output.trim() };
  } catch (error: any) {
    const errorMessage = error.stderr || error.message || 'Unknown error';
    console.error(`[xhs] Command failed: ${errorMessage}`);
    return { success: false, output: '', error: errorMessage };
  }
}

// Get XHS installation and login status
router.get('/status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const installed = isXhsInstalled();
    
    if (!installed) {
      return res.json({
        installed: false,
        loggedIn: false,
        message: 'XHS CLI not installed. Run: uv tool install xiaohongshu-cli',
      });
    }

    // Check login status
    const statusResult = await runXhsCommand(['status', '--json']);
    
    if (statusResult.success) {
      try {
        const statusData = JSON.parse(statusResult.output);
        return res.json({
          installed: true,
          loggedIn: true,
          user: statusData,
        });
      } catch {
        return res.json({
          installed: true,
          loggedIn: false,
          message: 'Not logged in',
        });
      }
    }

    return res.json({
      installed: true,
      loggedIn: false,
      message: 'Not logged in or session expired',
    });
  } catch (error: any) {
    console.error('[xhs/status] Error:', error);
    res.status(500).json({ error: 'Failed to check XHS status', details: error.message });
  }
});

// Login to XHS (extract cookies from Chrome)
router.post('/login', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!isXhsInstalled()) {
      return res.status(400).json({ 
        error: 'XHS CLI not installed',
        installCommand: 'uv tool install xiaohongshu-cli',
      });
    }

    const { method } = req.body; // 'browser' or 'qrcode'
    
    if (method === 'qrcode') {
      const result = await runXhsCommand(['login', '--qrcode']);
      if (result.success) {
        return res.json({ success: true, message: 'QR code login completed' });
      }
      return res.status(400).json({ error: 'QR code login failed', details: result.error });
    }

    // Default: browser login
    const result = await runXhsCommand(['login']);
    
    if (result.success) {
      return res.json({ success: true, message: 'Login successful' });
    }
    
    return res.status(400).json({ error: 'Login failed', details: result.error });
  } catch (error: any) {
    console.error('[xhs/login] Error:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// Get user profile (whoami)
router.get('/whoami', authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await runXhsCommand(['whoami', '--json']);
    
    if (result.success) {
      try {
        const userData = JSON.parse(result.output);
        return res.json({ success: true, user: userData });
      } catch {
        return res.json({ success: true, raw: result.output });
      }
    }
    
    return res.status(400).json({ error: 'Failed to get user info', details: result.error });
  } catch (error: any) {
    console.error('[xhs/whoami] Error:', error);
    res.status(500).json({ error: 'Failed to get user info', details: error.message });
  }
});

// Search notes
router.post('/search', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { keyword, sort, type, page } = req.body;
    
    if (!keyword) {
      return res.status(400).json({ error: 'Keyword is required' });
    }

    const args = ['search', keyword, '--json'];
    if (sort) args.push('--sort', sort);
    if (type) args.push('--type', type);
    if (page) args.push('--page', String(page));

    const result = await runXhsCommand(args);
    
    if (result.success) {
      try {
        const data = JSON.parse(result.output);
        return res.json({ success: true, data });
      } catch {
        return res.json({ success: true, raw: result.output });
      }
    }
    
    return res.status(400).json({ error: 'Search failed', details: result.error });
  } catch (error: any) {
    console.error('[xhs/search] Error:', error);
    res.status(500).json({ error: 'Search failed', details: error.message });
  }
});

// Search users
router.post('/search-user', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { keyword } = req.body;
    
    if (!keyword) {
      return res.status(400).json({ error: 'Keyword is required' });
    }

    const result = await runXhsCommand(['search-user', keyword, '--json']);
    
    if (result.success) {
      try {
        const data = JSON.parse(result.output);
        return res.json({ success: true, data });
      } catch {
        return res.json({ success: true, raw: result.output });
      }
    }
    
    return res.status(400).json({ error: 'User search failed', details: result.error });
  } catch (error: any) {
    console.error('[xhs/search-user] Error:', error);
    res.status(500).json({ error: 'User search failed', details: error.message });
  }
});

// Search topics/hashtags
router.post('/topics', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { keyword } = req.body;
    
    if (!keyword) {
      return res.status(400).json({ error: 'Keyword is required' });
    }

    const result = await runXhsCommand(['topics', keyword, '--json']);
    
    if (result.success) {
      try {
        const data = JSON.parse(result.output);
        return res.json({ success: true, data });
      } catch {
        return res.json({ success: true, raw: result.output });
      }
    }
    
    return res.status(400).json({ error: 'Topic search failed', details: result.error });
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
    
    const args = ['read', noteId, '--json'];
    if (xsecToken) args.push('--xsec-token', String(xsecToken));

    const result = await runXhsCommand(args);
    
    if (result.success) {
      try {
        const data = JSON.parse(result.output);
        return res.json({ success: true, data });
      } catch {
        return res.json({ success: true, raw: result.output });
      }
    }
    
    return res.status(400).json({ error: 'Failed to read note', details: result.error });
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
    
    const args = ['comments', noteId, '--json'];
    if (xsecToken) args.push('--xsec-token', String(xsecToken));
    if (all === 'true') args.push('--all');

    const result = await runXhsCommand(args);
    
    if (result.success) {
      try {
        const data = JSON.parse(result.output);
        return res.json({ success: true, data });
      } catch {
        return res.json({ success: true, raw: result.output });
      }
    }
    
    return res.status(400).json({ error: 'Failed to get comments', details: result.error });
  } catch (error: any) {
    console.error('[xhs/comments] Error:', error);
    res.status(500).json({ error: 'Failed to get comments', details: error.message });
  }
});

// Get sub-comments (replies)
router.get('/sub-comments/:noteId/:commentId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { noteId, commentId } = req.params;
    
    const result = await runXhsCommand(['sub-comments', noteId, commentId, '--json']);
    
    if (result.success) {
      try {
        const data = JSON.parse(result.output);
        return res.json({ success: true, data });
      } catch {
        return res.json({ success: true, raw: result.output });
      }
    }
    
    return res.status(400).json({ error: 'Failed to get sub-comments', details: result.error });
  } catch (error: any) {
    console.error('[xhs/sub-comments] Error:', error);
    res.status(500).json({ error: 'Failed to get sub-comments', details: error.message });
  }
});

// Get user profile
router.get('/user/:userId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const result = await runXhsCommand(['user', userId, '--json']);
    
    if (result.success) {
      try {
        const data = JSON.parse(result.output);
        return res.json({ success: true, data });
      } catch {
        return res.json({ success: true, raw: result.output });
      }
    }
    
    return res.status(400).json({ error: 'Failed to get user profile', details: result.error });
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
    
    const args = ['user-posts', userId, '--json'];
    if (cursor) args.push('--cursor', String(cursor));

    const result = await runXhsCommand(args);
    
    if (result.success) {
      try {
        const data = JSON.parse(result.output);
        return res.json({ success: true, data });
      } catch {
        return res.json({ success: true, raw: result.output });
      }
    }
    
    return res.status(400).json({ error: 'Failed to get user posts', details: result.error });
  } catch (error: any) {
    console.error('[xhs/user-posts] Error:', error);
    res.status(500).json({ error: 'Failed to get user posts', details: error.message });
  }
});

// Get my notes (creator)
router.get('/my-notes', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { page } = req.query;
    
    const args = ['my-notes', '--json'];
    if (page) args.push('--page', String(page));

    const result = await runXhsCommand(args);
    
    if (result.success) {
      try {
        const data = JSON.parse(result.output);
        return res.json({ success: true, data });
      } catch {
        return res.json({ success: true, raw: result.output });
      }
    }
    
    return res.status(400).json({ error: 'Failed to get my notes', details: result.error });
  } catch (error: any) {
    console.error('[xhs/my-notes] Error:', error);
    res.status(500).json({ error: 'Failed to get my notes', details: error.message });
  }
});

// Get feed
router.get('/feed', authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await runXhsCommand(['feed', '--json']);
    
    if (result.success) {
      try {
        const data = JSON.parse(result.output);
        return res.json({ success: true, data });
      } catch {
        return res.json({ success: true, raw: result.output });
      }
    }
    
    return res.status(400).json({ error: 'Failed to get feed', details: result.error });
  } catch (error: any) {
    console.error('[xhs/feed] Error:', error);
    res.status(500).json({ error: 'Failed to get feed', details: error.message });
  }
});

// Get hot notes
router.get('/hot', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    
    const args = ['hot', '--json'];
    if (category) args.push('-c', String(category));

    const result = await runXhsCommand(args);
    
    if (result.success) {
      try {
        const data = JSON.parse(result.output);
        return res.json({ success: true, data });
      } catch {
        return res.json({ success: true, raw: result.output });
      }
    }
    
    return res.status(400).json({ error: 'Failed to get hot notes', details: result.error });
  } catch (error: any) {
    console.error('[xhs/hot] Error:', error);
    res.status(500).json({ error: 'Failed to get hot notes', details: error.message });
  }
});

// Like a note
router.post('/like', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { noteId, undo } = req.body;
    
    if (!noteId) {
      return res.status(400).json({ error: 'Note ID is required' });
    }

    const args = undo ? ['like', noteId, '--undo'] : ['like', noteId];
    const result = await runXhsCommand(args);
    
    if (result.success) {
      return res.json({ success: true, message: undo ? 'Like removed' : 'Note liked' });
    }
    
    return res.status(400).json({ error: 'Failed to like note', details: result.error });
  } catch (error: any) {
    console.error('[xhs/like] Error:', error);
    res.status(500).json({ error: 'Failed to like note', details: error.message });
  }
});

// Favorite a note
router.post('/favorite', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { noteId, undo } = req.body;
    
    if (!noteId) {
      return res.status(400).json({ error: 'Note ID is required' });
    }

    const args = undo ? ['unfavorite', noteId] : ['favorite', noteId];
    const result = await runXhsCommand(args);
    
    if (result.success) {
      return res.json({ success: true, message: undo ? 'Removed from favorites' : 'Note favorited' });
    }
    
    return res.status(400).json({ error: 'Failed to favorite note', details: result.error });
  } catch (error: any) {
    console.error('[xhs/favorite] Error:', error);
    res.status(500).json({ error: 'Failed to favorite note', details: error.message });
  }
});

// Comment on a note
router.post('/comment', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { noteId, content } = req.body;
    
    if (!noteId || !content) {
      return res.status(400).json({ error: 'Note ID and content are required' });
    }

    const result = await runXhsCommand(['comment', noteId, '-c', content]);
    
    if (result.success) {
      return res.json({ success: true, message: 'Comment posted' });
    }
    
    return res.status(400).json({ error: 'Failed to post comment', details: result.error });
  } catch (error: any) {
    console.error('[xhs/comment] Error:', error);
    res.status(500).json({ error: 'Failed to post comment', details: error.message });
  }
});

// Reply to a comment
router.post('/reply', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { noteId, commentId, content } = req.body;
    
    if (!noteId || !commentId || !content) {
      return res.status(400).json({ error: 'Note ID, comment ID, and content are required' });
    }

    const result = await runXhsCommand(['reply', noteId, '--comment-id', commentId, '-c', content]);
    
    if (result.success) {
      return res.json({ success: true, message: 'Reply posted' });
    }
    
    return res.status(400).json({ error: 'Failed to post reply', details: result.error });
  } catch (error: any) {
    console.error('[xhs/reply] Error:', error);
    res.status(500).json({ error: 'Failed to post reply', details: error.message });
  }
});

// Follow a user
router.post('/follow', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const result = await runXhsCommand(['follow', userId]);
    
    if (result.success) {
      return res.json({ success: true, message: 'User followed' });
    }
    
    return res.status(400).json({ error: 'Failed to follow user', details: result.error });
  } catch (error: any) {
    console.error('[xhs/follow] Error:', error);
    res.status(500).json({ error: 'Failed to follow user', details: error.message });
  }
});

// Unfollow a user
router.post('/unfollow', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const result = await runXhsCommand(['unfollow', userId]);
    
    if (result.success) {
      return res.json({ success: true, message: 'User unfollowed' });
    }
    
    return res.status(400).json({ error: 'Failed to unfollow user', details: result.error });
  } catch (error: any) {
    console.error('[xhs/unfollow] Error:', error);
    res.status(500).json({ error: 'Failed to unfollow user', details: error.message });
  }
});

// Get favorites
router.get('/favorites', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    
    const args = ['favorites'];
    if (userId) args.push(String(userId));
    args.push('--json');

    const result = await runXhsCommand(args);
    
    if (result.success) {
      try {
        const data = JSON.parse(result.output);
        return res.json({ success: true, data });
      } catch {
        return res.json({ success: true, raw: result.output });
      }
    }
    
    return res.status(400).json({ error: 'Failed to get favorites', details: result.error });
  } catch (error: any) {
    console.error('[xhs/favorites] Error:', error);
    res.status(500).json({ error: 'Failed to get favorites', details: error.message });
  }
});

// Get likes
router.get('/likes', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    
    const args = ['likes'];
    if (userId) args.push(String(userId));
    args.push('--json');

    const result = await runXhsCommand(args);
    
    if (result.success) {
      try {
        const data = JSON.parse(result.output);
        return res.json({ success: true, data });
      } catch {
        return res.json({ success: true, raw: result.output });
      }
    }
    
    return res.status(400).json({ error: 'Failed to get likes', details: result.error });
  } catch (error: any) {
    console.error('[xhs/likes] Error:', error);
    res.status(500).json({ error: 'Failed to get likes', details: error.message });
  }
});

// Get notifications
router.get('/notifications', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { type } = req.query;
    
    const args = ['notifications', '--json'];
    if (type) args.push('--type', String(type));

    const result = await runXhsCommand(args);
    
    if (result.success) {
      try {
        const data = JSON.parse(result.output);
        return res.json({ success: true, data });
      } catch {
        return res.json({ success: true, raw: result.output });
      }
    }
    
    return res.status(400).json({ error: 'Failed to get notifications', details: result.error });
  } catch (error: any) {
    console.error('[xhs/notifications] Error:', error);
    res.status(500).json({ error: 'Failed to get notifications', details: error.message });
  }
});

// Get unread counts
router.get('/unread', authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await runXhsCommand(['unread', '--json']);
    
    if (result.success) {
      try {
        const data = JSON.parse(result.output);
        return res.json({ success: true, data });
      } catch {
        return res.json({ success: true, raw: result.output });
      }
    }
    
    return res.status(400).json({ error: 'Failed to get unread counts', details: result.error });
  } catch (error: any) {
    console.error('[xhs/unread] Error:', error);
    res.status(500).json({ error: 'Failed to get unread counts', details: error.message });
  }
});

// Post a new note (requires images)
router.post('/post', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { title, body, images, topics } = req.body;
    
    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    // Build command arguments
    const args = ['post', '--title', title, '--body', body];
    
    if (images && images.length > 0) {
      // For images, we need to handle them specially
      // The xhs CLI expects local file paths for images
      // For now, we'll pass the image URLs/paths
      args.push('--images');
      args.push(images.join(','));
    }

    if (topics && topics.length > 0) {
      // Add topic flags
      topics.forEach((topic: string) => {
        args.push('--topic', topic);
      });
    }

    const result = await runXhsCommand(args);
    
    if (result.success) {
      return res.json({ success: true, message: 'Note posted successfully' });
    }
    
    return res.status(400).json({ error: 'Failed to post note', details: result.error });
  } catch (error: any) {
    console.error('[xhs/post] Error:', error);
    res.status(500).json({ error: 'Failed to post note', details: error.message });
  }
});

// Delete a note
router.delete('/delete/:noteId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { noteId } = req.params;
    const { confirm } = req.query;
    
    const args = confirm === 'true' ? ['delete', noteId, '-y'] : ['delete', noteId];
    const result = await runXhsCommand(args);
    
    if (result.success) {
      return res.json({ success: true, message: 'Note deleted' });
    }
    
    return res.status(400).json({ error: 'Failed to delete note', details: result.error });
  } catch (error: any) {
    console.error('[xhs/delete] Error:', error);
    res.status(500).json({ error: 'Failed to delete note', details: error.message });
  }
});

export default router;
