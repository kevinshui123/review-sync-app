import { useState, useCallback, useEffect } from 'react';
import { apiGet, apiPost } from '../utils/api';
import { xhsConfig, getXhsApiUrl } from '../utils/xhsConfig';

// XHS User type
export interface XHSUser {
  userId?: string;
  nickname?: string;
  avatar?: string;
  followers?: number;
  following?: number;
  likes?: number;
  redId?: string;
  [key: string]: any;
}

// XHS Note type
export interface XHSNote {
  noteId?: string;
  id?: string;
  title?: string;
  type?: string;
  user?: {
    userId?: string;
    nickname?: string;
    avatar?: string;
  };
  likedCount?: number;
  collectedCount?: number;
  commentCount?: number;
  shareCount?: number;
  time?: string;
  lastUpdateTime?: string;
  [key: string]: any;
}

// XHS Comment type
export interface XHSComment {
  id?: string;
  commentId?: string;
  userInfo?: {
    userId?: string;
    nickname?: string;
    avatar?: string;
    [key: string]: any;
  };
  content?: string;
  subCommentCount?: number;
  likeCount?: number;
  createTime?: number;
  [key: string]: any;
}

// XHS Topic type
export interface XHSTopic {
  id?: string;
  topicId?: string;
  name?: string;
  tag?: string;
  noteCount?: number;
  [key: string]: any;
}

// XHS API Response types
export interface XHSStatusResponse {
  installed: boolean;
  loggedIn: boolean;
  user?: XHSUser;
  message?: string;
}

export interface XHSSearchResponse {
  success: boolean;
  data?: {
    items?: XHSNote[];
    notes?: XHSNote[];
    [key: string]: any;
  };
  raw?: string;
}

export interface XHSCommentsResponse {
  success: boolean;
  data?: {
    comments?: XHSComment[];
    items?: XHSComment[];
    [key: string]: any;
  };
  raw?: string;
}

// Hook return type
export interface UseRedNoteReturn {
  // State
  status: XHSStatusResponse | null;
  loading: boolean;
  error: string | null;
  
  // User data
  user: XHSUser | null;
  myNotes: XHSNote[];
  
  // Search results
  searchResults: XHSNote[];
  topicResults: XHSTopic[];
  commentResults: XHSComment[];
  
  // Actions
  checkStatus: () => Promise<void>;
  login: (method?: 'browser' | 'qrcode') => Promise<boolean>;
  logout: () => Promise<void>;
  getWhoami: () => Promise<XHSUser | null>;
  
  // Search
  search: (keyword: string, options?: { sort?: string; type?: string; page?: number }) => Promise<void>;
  searchUsers: (keyword: string) => Promise<void>;
  searchTopics: (keyword: string) => Promise<void>;
  
  // Notes
  getMyNotes: (page?: number) => Promise<void>;
  getNote: (noteId: string, xsecToken?: string) => Promise<any>;
  getComments: (noteId: string, xsecToken?: string, all?: boolean) => Promise<void>;
  getSubComments: (noteId: string, commentId: string) => Promise<void>;
  
  // Interactions
  likeNote: (noteId: string, undo?: boolean) => Promise<boolean>;
  favoriteNote: (noteId: string, undo?: boolean) => Promise<boolean>;
  postComment: (noteId: string, content: string) => Promise<boolean>;
  replyComment: (noteId: string, commentId: string, content: string) => Promise<boolean>;
  followUser: (userId: string) => Promise<boolean>;
  unfollowUser: (userId: string) => Promise<boolean>;
  
  // Publishing
  postNote: (data: { title: string; body: string; images?: string[]; topics?: string[] }) => Promise<boolean>;
  deleteNote: (noteId: string, confirm?: boolean) => Promise<boolean>;
  
  // Feed & Discovery
  getFeed: () => Promise<void>;
  getHot: (category?: string) => Promise<void>;
  
  // Notifications
  getNotifications: (type?: string) => Promise<void>;
  getUnread: () => Promise<void>;
}

export function useRedNote(): UseRedNoteReturn {
  const [status, setStatus] = useState<XHSStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<XHSUser | null>(null);
  const [myNotes, setMyNotes] = useState<XHSNote[]>([]);
  const [searchResults, setSearchResults] = useState<XHSNote[]>([]);
  const [topicResults, setTopicResults] = useState<XHSTopic[]>([]);
  const [commentResults, setCommentResults] = useState<XHSComment[]>([]);

  // Check XHS login status
  const checkStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiGet('/api/xhs/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        if (data.loggedIn && data.user) {
          setUser(data.user);
        }
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to check status');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to check status');
    } finally {
      setLoading(false);
    }
  }, []);

  // Login to XHS
  const login = useCallback(async (method: 'browser' | 'qrcode' = 'browser'): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiPost('/api/xhs/login', { method });
      if (res.ok) {
        await checkStatus();
        return true;
      } else {
        const err = await res.json();
        setError(err.error || 'Login failed');
        return false;
      }
    } catch (e: any) {
      setError(e.message || 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, [checkStatus]);

  // Logout (clear cookies)
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiPost('/api/xhs/login', {});
      if (res.ok) {
        setUser(null);
        setStatus({ installed: true, loggedIn: false });
      }
    } catch (e: any) {
      setError(e.message || 'Logout failed');
    } finally {
      setLoading(false);
    }
  }, []);

  // Get user profile
  const getWhoami = useCallback(async (): Promise<XHSUser | null> => {
    try {
      const res = await apiGet('/api/xhs/whoami');
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          return data.user;
        }
      }
    } catch (e: any) {
      console.error('[useRedNote] getWhoami error:', e);
    }
    return null;
  }, []);

  // Search notes
  const search = useCallback(async (
    keyword: string,
    options?: { sort?: string; type?: string; page?: number }
  ) => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiPost('/api/xhs/search', { keyword, ...options });
      if (res.ok) {
        const data: XHSSearchResponse = await res.json();
        const items = data.data?.items || data.data?.notes || [];
        setSearchResults(Array.isArray(items) ? items : []);
      } else {
        const err = await res.json();
        setError(err.error || 'Search failed');
      }
    } catch (e: any) {
      setError(e.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  // Search users
  const searchUsers = useCallback(async (keyword: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiPost('/api/xhs/search-user', { keyword });
      if (res.ok) {
        const data = await res.json();
        // Handle user search results
        console.log('[useRedNote] searchUsers:', data);
      }
    } catch (e: any) {
      setError(e.message || 'User search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  // Search topics
  const searchTopics = useCallback(async (keyword: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiPost('/api/xhs/topics', { keyword });
      if (res.ok) {
        const data = await res.json();
        const topics = data.data?.topics || data.data?.items || [];
        setTopicResults(Array.isArray(topics) ? topics : []);
      } else {
        const err = await res.json();
        setError(err.error || 'Topic search failed');
      }
    } catch (e: any) {
      setError(e.message || 'Topic search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  // Get my notes
  const getMyNotes = useCallback(async (page?: number) => {
    try {
      setLoading(true);
      const res = await apiGet(`/api/xhs/my-notes${page ? `?page=${page}` : ''}`);
      if (res.ok) {
        const data = await res.json();
        const notes = data.data?.items || data.data?.notes || [];
        setMyNotes(Array.isArray(notes) ? notes : []);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to get my notes');
    } finally {
      setLoading(false);
    }
  }, []);

  // Get note details
  const getNote = useCallback(async (noteId: string, xsecToken?: string): Promise<any> => {
    try {
      setLoading(true);
      const url = xsecToken 
        ? `/api/xhs/read/${noteId}?xsecToken=${xsecToken}`
        : `/api/xhs/read/${noteId}`;
      const res = await apiGet(url);
      if (res.ok) {
        const data = await res.json();
        return data.data || data;
      }
    } catch (e: any) {
      setError(e.message || 'Failed to get note');
    } finally {
      setLoading(false);
    }
    return null;
  }, []);

  // Get comments
  const getComments = useCallback(async (noteId: string, xsecToken?: string, all?: boolean) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (xsecToken) params.append('xsecToken', xsecToken);
      if (all) params.append('all', 'true');
      const query = params.toString();
      const res = await apiGet(`/api/xhs/comments/${noteId}${query ? `?${query}` : ''}`);
      if (res.ok) {
        const data: XHSCommentsResponse = await res.json();
        const comments = data.data?.comments || data.data?.items || [];
        setCommentResults(Array.isArray(comments) ? comments : []);
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to get comments');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to get comments');
    } finally {
      setLoading(false);
    }
  }, []);

  // Get sub-comments
  const getSubComments = useCallback(async (noteId: string, commentId: string) => {
    try {
      setLoading(true);
      const res = await apiGet(`/api/xhs/sub-comments/${noteId}/${commentId}`);
      if (res.ok) {
        const data = await res.json();
        return data.data || data;
      }
    } catch (e: any) {
      setError(e.message || 'Failed to get sub-comments');
    } finally {
      setLoading(false);
    }
    return null;
  }, []);

  // Like note
  const likeNote = useCallback(async (noteId: string, undo = false): Promise<boolean> => {
    try {
      setLoading(true);
      const res = await apiPost('/api/xhs/like', { noteId, undo });
      return res.ok;
    } catch (e: any) {
      setError(e.message || 'Failed to like note');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Favorite note
  const favoriteNote = useCallback(async (noteId: string, undo = false): Promise<boolean> => {
    try {
      setLoading(true);
      const res = await apiPost('/api/xhs/favorite', { noteId, undo });
      return res.ok;
    } catch (e: any) {
      setError(e.message || 'Failed to favorite note');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Post comment
  const postComment = useCallback(async (noteId: string, content: string): Promise<boolean> => {
    try {
      setLoading(true);
      const res = await apiPost('/api/xhs/comment', { noteId, content });
      return res.ok;
    } catch (e: any) {
      setError(e.message || 'Failed to post comment');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Reply comment
  const replyComment = useCallback(async (
    noteId: string,
    commentId: string,
    content: string
  ): Promise<boolean> => {
    try {
      setLoading(true);
      const res = await apiPost('/api/xhs/reply', { noteId, commentId, content });
      return res.ok;
    } catch (e: any) {
      setError(e.message || 'Failed to reply');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Follow user
  const followUser = useCallback(async (userId: string): Promise<boolean> => {
    try {
      setLoading(true);
      const res = await apiPost('/api/xhs/follow', { userId });
      return res.ok;
    } catch (e: any) {
      setError(e.message || 'Failed to follow');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Unfollow user
  const unfollowUser = useCallback(async (userId: string): Promise<boolean> => {
    try {
      setLoading(true);
      const res = await apiPost('/api/xhs/unfollow', { userId });
      return res.ok;
    } catch (e: any) {
      setError(e.message || 'Failed to unfollow');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Post note
  const postNote = useCallback(async (data: {
    title: string;
    body: string;
    images?: string[];
    topics?: string[];
  }): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiPost('/api/xhs/post', data);
      if (res.ok) {
        return true;
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to post note');
        return false;
      }
    } catch (e: any) {
      setError(e.message || 'Failed to post note');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete note
  const deleteNote = useCallback(async (noteId: string, confirm = false): Promise<boolean> => {
    try {
      setLoading(true);
      const res = await apiPost('/api/xhs/delete/' + noteId, { confirm });
      if (res.ok) {
        setMyNotes(prev => prev.filter(n => n.id !== noteId && n.noteId !== noteId));
        return true;
      }
      return false;
    } catch (e: any) {
      setError(e.message || 'Failed to delete note');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get feed
  const getFeed = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiGet('/api/xhs/feed');
      if (res.ok) {
        const data = await res.json();
        const items = data.data?.items || data.data?.notes || [];
        setSearchResults(Array.isArray(items) ? items : []);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to get feed');
    } finally {
      setLoading(false);
    }
  }, []);

  // Get hot notes
  const getHot = useCallback(async (category?: string) => {
    try {
      setLoading(true);
      setError(null);
      const url = category ? `/api/xhs/hot?category=${category}` : '/api/xhs/hot';
      const res = await apiGet(url);
      if (res.ok) {
        const data = await res.json();
        const items = data.data?.items || data.data?.notes || [];
        setSearchResults(Array.isArray(items) ? items : []);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to get hot notes');
    } finally {
      setLoading(false);
    }
  }, []);

  // Get notifications
  const getNotifications = useCallback(async (type?: string) => {
    try {
      setLoading(true);
      const url = type ? `/api/xhs/notifications?type=${type}` : '/api/xhs/notifications';
      const res = await apiGet(url);
      if (res.ok) {
        const data = await res.json();
        return data.data || data;
      }
    } catch (e: any) {
      setError(e.message || 'Failed to get notifications');
    } finally {
      setLoading(false);
    }
    return null;
  }, []);

  // Get unread counts
  const getUnread = useCallback(async () => {
    try {
      const res = await apiGet('/api/xhs/unread');
      if (res.ok) {
        const data = await res.json();
        return data.data || data;
      }
    } catch (e: any) {
      setError(e.message || 'Failed to get unread counts');
    }
    return null;
  }, []);

  // Auto-check status on mount
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  return {
    // State
    status,
    loading,
    error,
    
    // User data
    user,
    myNotes,
    
    // Search results
    searchResults,
    topicResults,
    commentResults,
    
    // Actions
    checkStatus,
    login,
    logout,
    getWhoami,
    
    // Search
    search,
    searchUsers,
    searchTopics,
    
    // Notes
    getMyNotes,
    getNote,
    getComments,
    getSubComments,
    
    // Interactions
    likeNote,
    favoriteNote,
    postComment,
    replyComment,
    followUser,
    unfollowUser,
    
    // Publishing
    postNote,
    deleteNote,
    
    // Feed & Discovery
    getFeed,
    getHot,
    
    // Notifications
    getNotifications,
    getUnread,
  };
}
