import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  AccountCircle,
  Publish,
  Comment,
  Search,
  Logout,
  Login,
  AutoAwesome,
  Image as ImageIcon,
  Tag,
  Send,
  Refresh,
  CheckCircle,
  Error as ErrorIcon,
  Favorite,
  ThumbUp,
  Chat,
  Visibility,
  Person,
  LocalFireDepartment,
  Delete,
  ContentCopy,
  Warning,
  Edit,
  CameraAlt,
  Brush,
} from '@mui/icons-material';
import { Loader2, Sparkles } from 'lucide-react';
import { apiGet, apiPost } from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import { PageLoader } from './PageLoader';

interface XHSUser {
  userId?: string;
  nickname?: string;
  avatar?: string;
  redId?: string;
  followers?: number;
  following?: number;
  likes?: number;
  [key: string]: any;
}

interface XHSNote {
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
  [key: string]: any;
}

interface XHSComment {
  id?: string;
  commentId?: string;
  userInfo?: {
    userId?: string;
    nickname?: string;
    avatar?: string;
  };
  content?: string;
  subCommentCount?: number;
  likeCount?: number;
  createTime?: number;
  [key: string]: any;
}

interface XHSTopic {
  id?: string;
  topicId?: string;
  name?: string;
  tag?: string;
  noteCount?: number;
}

interface PublishForm {
  title: string;
  body: string;
  topics: string[];
  images: string[];
}

interface AIGeneratedContent {
  title: string;
  body: string;
  topics: string[];
}

const PRESET_TOPICS = [
  '美食', '探店', '穿搭', '美妆', '旅行', '健身', '摄影', '家居',
  '母婴', '职场', '科技', '游戏', '宠物', '读书', '电影', '音乐',
];

const CONTENT_TEMPLATES = [
  { label: '探店分享', icon: '📍', prompt: '分享你的探店体验，包括环境、菜品、服务等' },
  { label: '好物推荐', icon: '✨', prompt: '推荐你喜欢的产品或服务' },
  { label: '生活记录', icon: '📝', prompt: '记录日常生活中的小确幸' },
  { label: '教程分享', icon: '📚', prompt: '分享你的技能或知识教程' },
];

export function RedNoteSEO() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'account' | 'publish' | 'comments' | 'monitor'>('account');
  
  // Account state
  const [xhsInstalled, setXhsInstalled] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<XHSUser | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  
  // Publish state
  const [publishForm, setPublishForm] = useState<PublishForm>({
    title: '',
    body: '',
    topics: [],
    images: [],
  });
  const [publishing, setPublishing] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiContent, setAiContent] = useState<AIGeneratedContent | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Comments state
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<XHSNote[]>([]);
  const [selectedNote, setSelectedNote] = useState<XHSNote | null>(null);
  const [comments, setComments] = useState<XHSComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [submittingReply, setSubmittingReply] = useState<string | null>(null);
  
  // Monitor state
  const [monitorKeyword, setMonitorKeyword] = useState('');
  const [monitorResults, setMonitorResults] = useState<XHSNote[]>([]);
  const [topicSearch, setTopicSearch] = useState('');
  const [topicResults, setTopicResults] = useState<XHSTopic[]>([]);
  
  // My notes
  const [myNotes, setMyNotes] = useState<XHSNote[]>([]);
  const [myNotesLoading, setMyNotesLoading] = useState(false);
  
  // Toast/notification
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Check XHS status
  const checkStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiGet('/api/xhs/status');
      if (res.ok) {
        const data = await res.json();
        setXhsInstalled(data.installed);
        setLoggedIn(data.loggedIn);
        if (data.user) {
          setUser(data.user);
        }
      }
    } catch (error) {
      console.error('[RedNoteSEO] Check status error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Login handler
  const handleLogin = async () => {
    try {
      setLoginLoading(true);
      const res = await apiPost('/api/xhs/login', {});
      if (res.ok) {
        showToast('success', '登录成功！');
        await checkStatus();
      } else {
        const err = await res.json();
        showToast('error', err.error || '登录失败');
      }
    } catch (error) {
      showToast('error', '登录失败');
    } finally {
      setLoginLoading(false);
    }
  };

  // AI Generate content
  const handleAIGenerate = async (template?: string) => {
    setAiGenerating(true);
    try {
      const templateContext = template || selectedTemplate;
      let contextPrompt = '';
      
      if (templateContext) {
        const tmpl = CONTENT_TEMPLATES.find(t => t.label === templateContext);
        if (tmpl) {
          contextPrompt = `主题类型：${tmpl.prompt}`;
        }
      }

      const prompt = `你是一个专业的小红书内容创作者。请根据以下信息生成一篇小红书笔记：

${contextPrompt}
商家/品牌信息：${publishForm.title || '待填写'}

请生成：
1. 一个吸引人的标题（带emoji，不超过30字）
2. 正文内容（包含开头引人、主体描述、结尾号召，200-500字，带适当话题标签 #标签）
3. 推荐的话题标签（3-5个，用#开头）

请用JSON格式返回，格式如下：
{
  "title": "标题",
  "body": "正文内容",
  "topics": ["#标签1", "#标签2", "#标签3"]
}`;

      const res = await apiPost('/api/reviews/generate-reply', {
        reviewId: 'xhs-ai-generate',
        reviewerName: 'AI Assistant',
        rating: 5,
        comment: prompt,
        businessName: 'Content Generation',
      });

      if (res.ok) {
        const data = await res.json();
        if (data.replies?.professional) {
          try {
            const parsed = JSON.parse(data.replies.professional);
            setAiContent(parsed);
            setPublishForm(prev => ({
              ...prev,
              title: parsed.title || prev.title,
              body: parsed.body || prev.body,
              topics: parsed.topics || prev.topics,
            }));
            showToast('success', 'AI内容已生成');
          } catch {
            // If not JSON, use as raw content
            setPublishForm(prev => ({
              ...prev,
              body: data.replies.professional,
            }));
            showToast('success', 'AI内容已生成');
          }
        }
      }
    } catch (error) {
      showToast('error', 'AI生成失败');
    } finally {
      setAiGenerating(false);
    }
  };

  // File handling
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;
    const newImages: string[] = [];
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/') && publishForm.images.length + newImages.length < 9) {
        const reader = new FileReader();
        reader.onload = () => {
          newImages.push(reader.result as string);
          if (newImages.length === Array.from(files).filter(f => f.type.startsWith('image/')).length) {
            setPublishForm(prev => ({
              ...prev,
              images: [...prev.images, ...newImages],
            }));
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }, [publishForm.images.length]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleRemoveImage = (index: number) => {
    setPublishForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  // Topic handlers
  const toggleTopic = (topic: string) => {
    setPublishForm(prev => ({
      ...prev,
      topics: prev.topics.includes(topic)
        ? prev.topics.filter(t => t !== topic)
        : [...prev.topics, topic],
    }));
  };

  // Publish note
  const handlePublish = async () => {
    if (!publishForm.title.trim() || !publishForm.body.trim()) {
      showToast('error', '标题和正文不能为空');
      return;
    }

    try {
      setPublishing(true);
      const res = await apiPost('/api/xhs/post', {
        title: publishForm.title,
        body: publishForm.body,
        images: publishForm.images,
        topics: publishForm.topics,
      });

      if (res.ok) {
        showToast('success', '发布成功！');
        setPublishForm({ title: '', body: '', topics: [], images: [] });
        setAiContent(null);
        fetchMyNotes();
      } else {
        const err = await res.json();
        showToast('error', err.error || '发布失败');
      }
    } catch (error) {
      showToast('error', '发布失败');
    } finally {
      setPublishing(false);
    }
  };

  // Search notes
  const handleSearch = async () => {
    if (!searchKeyword.trim()) return;

    try {
      setLoading(true);
      const res = await apiPost('/api/xhs/search', { keyword: searchKeyword });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.data?.items || data.data?.notes || []);
      }
    } catch (error) {
      showToast('error', '搜索失败');
    } finally {
      setLoading(false);
    }
  };

  // Get comments for a note
  const handleGetComments = async (note: XHSNote) => {
    setSelectedNote(note);
    setCommentsLoading(true);
    try {
      const noteId = note.noteId || note.id;
      const res = await apiGet(`/api/xhs/comments/${noteId}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.data?.comments || data.data?.items || []);
      }
    } catch (error) {
      showToast('error', '获取评论失败');
    } finally {
      setCommentsLoading(false);
    }
  };

  // Reply to comment
  const handleReply = async (comment: XHSComment) => {
    const content = replyText[comment.commentId || comment.id || ''];
    if (!content?.trim()) return;

    try {
      setSubmittingReply(comment.commentId || comment.id || '');
      const noteId = selectedNote?.noteId || selectedNote?.id;
      const commentId = comment.commentId || comment.id;
      
      const res = await apiPost('/api/xhs/reply', { noteId, commentId, content });
      if (res.ok) {
        showToast('success', '回复成功！');
        setReplyText(prev => ({ ...prev, [commentId || '']: '' }));
        // Refresh comments
        if (noteId) handleGetComments({ noteId, id: noteId } as XHSNote);
      } else {
        showToast('error', '回复失败');
      }
    } catch (error) {
      showToast('error', '回复失败');
    } finally {
      setSubmittingReply(null);
    }
  };

  // Monitor search
  const handleMonitorSearch = async () => {
    if (!monitorKeyword.trim()) return;

    try {
      setLoading(true);
      const res = await apiPost('/api/xhs/search', { keyword: monitorKeyword });
      if (res.ok) {
        const data = await res.json();
        setMonitorResults(data.data?.items || data.data?.notes || []);
      }
    } catch (error) {
      showToast('error', '搜索失败');
    } finally {
      setLoading(false);
    }
  };

  // Topic search
  const handleTopicSearch = async () => {
    if (!topicSearch.trim()) return;

    try {
      setLoading(true);
      const res = await apiPost('/api/xhs/topics', { keyword: topicSearch });
      if (res.ok) {
        const data = await res.json();
        setTopicResults(data.data?.topics || data.data?.items || []);
      }
    } catch (error) {
      showToast('error', '话题搜索失败');
    } finally {
      setLoading(false);
    }
  };

  // Fetch my notes
  const fetchMyNotes = async () => {
    setMyNotesLoading(true);
    try {
      const res = await apiGet('/api/xhs/my-notes');
      if (res.ok) {
        const data = await res.json();
        setMyNotes(data.data?.items || data.data?.notes || []);
      }
    } catch (error) {
      console.error('[RedNoteSEO] fetchMyNotes error:', error);
    } finally {
      setMyNotesLoading(false);
    }
  };

  // Delete note
  const handleDeleteNote = async (note: XHSNote) => {
    const noteId = note.noteId || note.id;
    if (!confirm('确定要删除这篇笔记吗？')) return;

    try {
      const res = await apiPost(`/api/xhs/delete/${noteId}`, { confirm: true });
      if (res.ok) {
        showToast('success', '删除成功');
        fetchMyNotes();
      } else {
        showToast('error', '删除失败');
      }
    } catch (error) {
      showToast('error', '删除失败');
    }
  };

  // Like/Unlike note
  const handleLikeNote = async (note: XHSNote, undo = false) => {
    const noteId = note.noteId || note.id;
    try {
      const res = await apiPost('/api/xhs/like', { noteId, undo });
      if (res.ok) {
        showToast('success', undo ? '已取消点赞' : '已点赞');
      }
    } catch (error) {
      showToast('error', '操作失败');
    }
  };

  // Copy content
  const handleCopyContent = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('info', '已复制到剪贴板');
  };

  if (loading && !xhsInstalled) {
    return <PageLoader message="加载中..." subMessage="正在检查小红书账号状态" />;
  }

  return (
    <div className="real-comment-container" style={{ padding: '24px 24px 24px 280px', maxWidth: '1600px', margin: '0 auto', minHeight: '100vh', background: 'var(--color-surface)' }}>
      <div className="animate-fade-in">
        {/* Toast Notification */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fade-in ${
            toast.type === 'success' ? 'bg-green-500 text-white' :
            toast.type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
          }`}>
            {toast.type === 'success' && <CheckCircle className="w-5 h-5" />}
            {toast.type === 'error' && <ErrorIcon className="w-5 h-5" />}
            {toast.type === 'info' && <ErrorIcon className="w-5 h-5" />}
            {toast.message}
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                RedNote SEO
              </h1>
              <p className="text-slate-500 mt-1">小红书内容创作与账号管理</p>
            </div>
            {!xhsInstalled && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 flex items-center gap-2">
                <Warning className="text-amber-500" />
                <span className="text-amber-700 text-sm">请先安装 xhs CLI</span>
              </div>
            )}
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'account', label: '账号管理', icon: AccountCircle },
            { id: 'publish', label: '发布笔记', icon: Publish },
            { id: 'comments', label: '评论管理', icon: Comment },
            { id: 'monitor', label: '品牌监控', icon: Search },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
                activeSection === tab.id
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Account Section */}
        {activeSection === 'account' && (
          <div className="space-y-6 animate-fade-in">
            {/* Status Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50 p-8">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <AccountCircle className="text-primary" />
                账号状态
              </h2>
              
              {!xhsInstalled ? (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Warning className="text-amber-500 w-6 h-6" />
                    <h3 className="font-bold text-amber-800">XHS CLI 未安装</h3>
                  </div>
                  <p className="text-amber-700 mb-4">
                    请在服务器上运行以下命令安装小红书 CLI：
                  </p>
                  <code className="bg-amber-100 px-4 py-2 rounded-lg text-amber-900 font-mono text-sm block">
                    uv tool install xiaohongshu-cli
                  </code>
                </div>
              ) : loggedIn && user ? (
                <div className="flex items-start gap-6">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-400 to-red-500 flex items-center justify-center text-white text-3xl font-bold">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.nickname} className="w-full h-full rounded-2xl object-cover" />
                    ) : (
                      user.nickname?.[0]?.toUpperCase() || 'U'
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-slate-900">{user.nickname || '小红书用户'}</h3>
                    {user.redId && <p className="text-slate-500">小红书号：{user.redId}</p>}
                    <div className="flex gap-6 mt-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-slate-900">{user.followers || 0}</div>
                        <div className="text-sm text-slate-500">粉丝</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-slate-900">{user.following || 0}</div>
                        <div className="text-sm text-slate-500">关注</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-slate-900">{user.likes || 0}</div>
                        <div className="text-sm text-slate-500">获赞</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={checkStatus}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
                    >
                      <Refresh className="w-4 h-4" />
                      刷新
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <AccountCircle className="w-10 h-10 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">未登录</h3>
                  <p className="text-slate-500 mb-6">点击下方按钮从 Chrome 浏览器提取 Cookie 登录</p>
                  <button
                    onClick={handleLogin}
                    disabled={loginLoading}
                    className="flex items-center gap-2 mx-auto px-8 py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                  >
                    {loginLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Login className="w-5 h-5" />
                    )}
                    {loginLoading ? '登录中...' : '从 Chrome 登录'}
                  </button>
                </div>
              )}
            </div>

            {/* My Notes */}
            {loggedIn && (
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Publish className="text-primary" />
                    我的笔记
                  </h2>
                  <button
                    onClick={fetchMyNotes}
                    disabled={myNotesLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    <Refresh className={`w-4 h-4 ${myNotesLoading ? 'animate-spin' : ''}`} />
                    刷新
                  </button>
                </div>

                {myNotesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : myNotes.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    暂无笔记，快去发布第一篇吧！
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {myNotes.map((note, idx) => (
                      <div key={idx} className="bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors">
                        <h4 className="font-bold text-slate-900 truncate">{note.title || '无标题'}</h4>
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <ThumbUp className="w-4 h-4" /> {note.likedCount || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Favorite className="w-4 h-4" /> {note.collectedCount || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Chat className="w-4 h-4" /> {note.commentCount || 0}
                          </span>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleDeleteNote(note)}
                            className="flex items-center gap-1 px-3 py-1 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100"
                          >
                            <Delete className="w-4 h-4" />
                            删除
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Publish Section */}
        {activeSection === 'publish' && (
          <div className="space-y-6 animate-fade-in">
            {/* AI Generate Section */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl p-8 text-white">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Sparkles className="w-6 h-6" />
                AI 智能生成内容
              </h2>
              
              {/* Content Templates */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {CONTENT_TEMPLATES.map(template => (
                  <button
                    key={template.label}
                    onClick={() => setSelectedTemplate(selectedTemplate === template.label ? '' : template.label)}
                    className={`p-4 rounded-xl text-left transition-all ${
                      selectedTemplate === template.label
                        ? 'bg-white text-purple-600 shadow-lg'
                        : 'bg-white/20 hover:bg-white/30'
                    }`}
                  >
                    <div className="text-2xl mb-1">{template.icon}</div>
                    <div className="font-medium text-sm">{template.label}</div>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-4">
                <input
                  type="text"
                  value={publishForm.title}
                  onChange={e => setPublishForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="输入商家/品牌名称作为参考..."
                  className="flex-1 px-4 py-3 rounded-xl bg-white/20 placeholder-white/60 text-white border border-white/30 focus:border-white focus:outline-none"
                />
                <button
                  onClick={() => handleAIGenerate()}
                  disabled={aiGenerating}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-purple-600 rounded-xl font-bold hover:bg-white/90 transition-colors disabled:opacity-50"
                >
                  {aiGenerating ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <AutoAwesome className="w-5 h-5" />
                  )}
                  {aiGenerating ? '生成中...' : 'AI 生成'}
                </button>
              </div>
            </div>

            {/* Publish Form */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50 p-8">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Edit className="text-primary" />
                编辑笔记内容
              </h2>

              {/* Title */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">标题</label>
                <input
                  type="text"
                  value={publishForm.title}
                  onChange={e => setPublishForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="输入笔记标题..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              {/* Body */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">正文内容</label>
                <textarea
                  value={publishForm.body}
                  onChange={e => setPublishForm(prev => ({ ...prev, body: e.target.value }))}
                  rows={8}
                  placeholder="输入笔记正文内容..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                />
              </div>

              {/* Topics */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  话题标签
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_TOPICS.map(topic => (
                    <button
                      key={topic}
                      onClick={() => toggleTopic(`#${topic}`)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        publishForm.topics.includes(`#${topic}`)
                          ? 'bg-pink-500 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      #{topic}
                    </button>
                  ))}
                </div>
                {publishForm.topics.length > 0 && (
                  <div className="mt-3 text-sm text-slate-500">
                    已选：{publishForm.topics.join(' ')}
                  </div>
                )}
              </div>

              {/* Images */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  图片上传 ({publishForm.images.length}/9)
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    dragOver
                      ? 'border-primary bg-primary/5'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={e => handleFileSelect(e.target.files)}
                    className="hidden"
                  />
                  <CameraAlt className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-600">拖拽图片到此处，或点击上传</p>
                  <p className="text-sm text-slate-400 mt-1">支持 JPG、PNG 格式，最多 9 张</p>
                </div>

                {publishForm.images.length > 0 && (
                  <div className="grid grid-cols-5 gap-3 mt-4">
                    {publishForm.images.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <span className="text-white text-xs">×</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-4">
                <button
                  onClick={() => setPublishForm({ title: '', body: '', topics: [], images: [] })}
                  className="px-6 py-3 text-slate-600 font-medium hover:text-slate-900"
                >
                  清空
                </button>
                <button
                  onClick={handlePublish}
                  disabled={publishing || !publishForm.title.trim() || !publishForm.body.trim()}
                  className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                >
                  {publishing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                  {publishing ? '发布中...' : '发布笔记'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Comments Section */}
        {activeSection === 'comments' && (
          <div className="space-y-6 animate-fade-in">
            {/* Search */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50 p-8">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Search className="text-primary" />
                搜索笔记
              </h2>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={e => setSearchKeyword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="输入关键词搜索笔记..."
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  搜索
                </button>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-6 space-y-3">
                  <h3 className="font-medium text-slate-700">搜索结果 ({searchResults.length})</h3>
                  {searchResults.map((note, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleGetComments(note)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        selectedNote?.noteId === note.noteId || selectedNote?.id === note.id
                          ? 'border-primary bg-primary/5'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <h4 className="font-bold text-slate-900">{note.title || '无标题'}</h4>
                      <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
                        {note.user?.nickname && <span>@{note.user.nickname}</span>}
                        <span className="flex items-center gap-1">
                          <ThumbUp className="w-4 h-4" /> {note.likedCount || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Chat className="w-4 h-4" /> {note.commentCount || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Visibility className="w-4 h-4" /> {note.shareCount || 0}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Comments List */}
            {selectedNote && (
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50 p-8">
                <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Chat className="text-primary" />
                  评论详情
                  <span className="text-slate-500 text-base font-normal">
                    - {selectedNote.title || '无标题'}
                  </span>
                </h2>

                {commentsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    暂无评论
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comments.map((comment, idx) => (
                      <div key={idx} className="bg-slate-50 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-red-500 flex items-center justify-center text-white font-bold">
                            {comment.userInfo?.nickname?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">
                                {comment.userInfo?.nickname || '匿名用户'}
                              </span>
                              {comment.likeCount && comment.likeCount > 0 && (
                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                  <ThumbUp className="w-3 h-3" /> {comment.likeCount}
                                </span>
                              )}
                            </div>
                            <p className="text-slate-700 mt-1">{comment.content}</p>
                            
                            {/* Reply Input */}
                            <div className="mt-3 flex gap-2">
                              <input
                                type="text"
                                value={replyText[comment.commentId || comment.id || ''] || ''}
                                onChange={e => setReplyText(prev => ({
                                  ...prev,
                                  [comment.commentId || comment.id || '']: e.target.value
                                }))}
                                placeholder="输入回复..."
                                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm"
                              />
                              <button
                                onClick={() => handleReply(comment)}
                                disabled={submittingReply === (comment.commentId || comment.id)}
                                className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50"
                              >
                                {submittingReply === (comment.commentId || comment.id) ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  '回复'
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Monitor Section */}
        {activeSection === 'monitor' && (
          <div className="space-y-6 animate-fade-in">
            {/* Brand Search */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50 p-8">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <LocalFireDepartment className="text-primary" />
                品牌监控
              </h2>
              <div className="flex gap-3 mb-6">
                <input
                  type="text"
                  value={monitorKeyword}
                  onChange={e => setMonitorKeyword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleMonitorSearch()}
                  placeholder="输入品牌/竞品关键词..."
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <button
                  onClick={handleMonitorSearch}
                  disabled={loading}
                  className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  搜索
                </button>
              </div>

              {monitorResults.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium text-slate-700">相关笔记 ({monitorResults.length})</h3>
                  {monitorResults.slice(0, 20).map((note, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-900">{note.title || '无标题'}</h4>
                          <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
                            {note.user?.nickname && (
                              <span className="flex items-center gap-1">
                                <Person className="w-4 h-4" /> @{note.user.nickname}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <ThumbUp className="w-4 h-4" /> {note.likedCount || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <Favorite className="w-4 h-4" /> {note.collectedCount || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <Chat className="w-4 h-4" /> {note.commentCount || 0}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleLikeNote(note)}
                            className="p-2 text-slate-400 hover:text-pink-500 transition-colors"
                            title="点赞"
                          >
                            <ThumbUp className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleGetComments(note)}
                            className="p-2 text-slate-400 hover:text-primary transition-colors"
                            title="查看评论"
                          >
                            <Chat className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Topic Search */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50 p-8">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Tag className="text-primary" />
                话题热度
              </h2>
              <div className="flex gap-3 mb-6">
                <input
                  type="text"
                  value={topicSearch}
                  onChange={e => setTopicSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleTopicSearch()}
                  placeholder="输入话题关键词..."
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <button
                  onClick={handleTopicSearch}
                  disabled={loading}
                  className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  搜索
                </button>
              </div>

              {topicResults.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {topicResults.map((topic, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div className="font-bold text-slate-900 truncate">
                        #{topic.name || topic.tag || '未知话题'}
                      </div>
                      {topic.noteCount && (
                        <div className="text-sm text-slate-500 mt-1">
                          {topic.noteCount.toLocaleString()} 笔记
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
