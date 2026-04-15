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
  ArrowForward,
  ArrowBack,
  MoreVert,
  TrendingUp,
} from '@mui/icons-material';
import { Loader2 } from 'lucide-react';
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
  lastUpdateTime?: string;
  cover?: string;
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
  { label: '探店分享', icon: '📍', desc: '分享探店体验，环境菜品服务' },
  { label: '好物推荐', icon: '✨', desc: '推荐喜欢的产品或服务' },
  { label: '生活记录', icon: '📝', desc: '记录日常生活中的小确幸' },
  { label: '教程分享', icon: '📚', desc: '分享技能或知识教程' },
];

// Step definitions for workflow
const WORKFLOW_STEPS = [
  { id: 'account', labelKey: 'rednote.step.account', icon: AccountCircle },
  { id: 'publish', labelKey: 'rednote.step.publish', icon: Publish },
  { id: 'comments', labelKey: 'rednote.step.comments', icon: Comment },
  { id: 'monitor', labelKey: 'rednote.step.monitor', icon: LocalFireDepartment },
];

export function RedNoteSEO() {
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState<'account' | 'publish' | 'comments' | 'monitor'>('account');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  
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
  const [monitorHistory, setMonitorHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('xhs_monitor_history');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  
  // My notes
  const [myNotes, setMyNotes] = useState<XHSNote[]>([]);
  const [myNotesLoading, setMyNotesLoading] = useState(false);
  
  // Toast notification
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Save monitor history
  useEffect(() => {
    localStorage.setItem('xhs_monitor_history', JSON.stringify(monitorHistory));
  }, [monitorHistory]);

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

  // Sync user data when logged in
  const syncUserData = useCallback(async () => {
    if (!loggedIn) return;
    
    setSyncing(true);
    try {
      // Get whoami data
      const whoamiRes = await apiGet('/api/xhs/whoami');
      if (whoamiRes.ok) {
        const whoamiData = await whoamiRes.json();
        if (whoamiData.user) {
          setUser(whoamiData.user);
        }
      }
      
      // Fetch my notes
      const notesRes = await apiGet('/api/xhs/my-notes');
      if (notesRes.ok) {
        const notesData = await notesRes.json();
        setMyNotes(notesData.data?.items || notesData.data?.notes || []);
      }
    } catch (error) {
      console.error('[RedNoteSEO] Sync error:', error);
    } finally {
      setSyncing(false);
    }
  }, [loggedIn]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Auto-sync when logged in
  useEffect(() => {
    if (loggedIn) {
      syncUserData();
    }
  }, [loggedIn, syncUserData]);

  // Login handler
  const handleLogin = async () => {
    try {
      setLoginLoading(true);
      const res = await apiPost('/api/xhs/login', {});
      if (res.ok) {
        showToast('success', t('rednote.loginSuccess'));
        await checkStatus();
      } else {
        const err = await res.json();
        showToast('error', err.error || t('rednote.loginFailed'));
      }
    } catch (error) {
      showToast('error', t('rednote.loginFailed'));
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
          contextPrompt = `主题类型：${tmpl.desc}`;
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
            setPublishForm(prev => ({
              ...prev,
              title: parsed.title || prev.title,
              body: parsed.body || prev.body,
              topics: parsed.topics || prev.topics,
            }));
            showToast('success', t('rednote.aiGenerated'));
          } catch {
            setPublishForm(prev => ({
              ...prev,
              body: data.replies.professional,
            }));
            showToast('success', t('rednote.aiGenerated'));
          }
        }
      }
    } catch (error) {
      showToast('error', t('rednote.aiGenerateFailed'));
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
      showToast('error', t('rednote.titleBodyRequired'));
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
        showToast('success', t('rednote.publishSuccess'));
        setPublishForm({ title: '', body: '', topics: [], images: [] });
        syncUserData();
      } else {
        const err = await res.json();
        showToast('error', err.error || t('rednote.publishFailed'));
      }
    } catch (error) {
      showToast('error', t('rednote.publishFailed'));
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
      showToast('error', t('rednote.searchFailed'));
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
      showToast('error', t('rednote.getCommentsFailed'));
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
        showToast('success', t('rednote.replySuccess'));
        setReplyText(prev => ({ ...prev, [commentId || '']: '' }));
        if (noteId) handleGetComments({ noteId, id: noteId } as XHSNote);
      } else {
        showToast('error', t('rednote.replyFailed'));
      }
    } catch (error) {
      showToast('error', t('rednote.replyFailed'));
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
        
        if (!monitorHistory.includes(monitorKeyword)) {
          setMonitorHistory(prev => [monitorKeyword, ...prev].slice(0, 10));
        }
      }
    } catch (error) {
      showToast('error', t('rednote.searchFailed'));
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
      showToast('error', t('rednote.topicSearchFailed'));
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
    if (!confirm(t('rednote.confirmDelete'))) return;

    try {
      const res = await apiPost(`/api/xhs/delete/${noteId}`, { confirm: true });
      if (res.ok) {
        showToast('success', t('rednote.deleteSuccess'));
        fetchMyNotes();
      } else {
        showToast('error', t('rednote.deleteFailed'));
      }
    } catch (error) {
      showToast('error', t('rednote.deleteFailed'));
    }
  };

  // Like/Unlike note
  const handleLikeNote = async (note: XHSNote, undo = false) => {
    const noteId = note.noteId || note.id;
    try {
      const res = await apiPost('/api/xhs/like', { noteId, undo });
      if (res.ok) {
        showToast('success', undo ? t('rednote.undoLike') : t('rednote.liked'));
      }
    } catch (error) {
      showToast('error', t('rednote.operationFailed'));
    }
  };

  // Copy content
  const handleCopyContent = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('info', t('rednote.copySuccess'));
  };

  // Format number
  const formatNumber = (num?: number) => {
    if (!num) return '0';
    if (num >= 10000) return (num / 10000).toFixed(1) + 'w';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  if (loading && !xhsInstalled) {
    return <PageLoader message={t('app.loading')} subMessage={t('rednote.checkingAccountStatus')} />;
  }

  const currentStepIndex = WORKFLOW_STEPS.findIndex(s => s.id === activeSection);

  return (
    <div className="rednote-seo-page animate-fade-in">
      <style>{`
        .rednote-seo-page {
          padding: 16px 20px 24px;
          max-width: 1600px;
          margin: 0 auto;
        }
        .rednote-seo-page .page-header {
          margin-bottom: 16px;
        }
        .rednote-seo-page .page-title {
          font-size: 1.25rem;
          margin-bottom: 2px;
        }
        .rednote-seo-page .page-subtitle {
          font-size: 12px;
        }
        .rednote-seo-page .card {
          border-radius: 10px;
        }
        .rednote-seo-page .card-body {
          padding: 16px;
        }
        .rednote-seo-page .card-header {
          padding: 12px 16px;
        }
        .rednote-seo-page .card-header .heading {
          font-size: 14px;
        }
        .rednote-seo-page .mb-6 {
          margin-bottom: 16px;
        }
        .rednote-seo-page .mb-4 {
          margin-bottom: 12px;
        }
        .rednote-seo-page .gap-6 {
          gap: 16px;
        }
        .rednote-seo-page .lg\\:col-span-2 {
          grid-column: span 2;
        }
        .rednote-seo-page .lg\\:col-span-3 {
          grid-column: span 3;
        }
        .rednote-seo-page .step-icon {
          width: 40px !important;
          height: 40px !important;
        }
        .rednote-seo-page .step-icon svg {
          width: 20px !important;
          height: 20px !important;
        }
        .rednote-seo-page .step-label {
          font-size: 12px !important;
        }
        .rednote-seo-page .stat-card {
          padding: 12px !important;
        }
        .rednote-seo-page .stat-value {
          font-size: 1.1rem !important;
        }
        .rednote-seo-page .empty-state {
          padding: 24px 0 !important;
        }
        .rednote-seo-page .empty-state-title {
          font-size: 15px !important;
        }
        .rednote-seo-page .empty-state-description {
          font-size: 12px !important;
        }
        .rednote-seo-page .heading.text-lg {
          font-size: 14px;
        }
        .rednote-seo-page .btn-lg {
          padding: 8px 16px;
          font-size: 13px;
        }
        @media (max-width: 1023px) {
          .rednote-seo-page {
            padding: 12px 16px;
          }
          .rednote-seo-page .lg\\:col-span-2,
          .rednote-seo-page .lg\\:col-span-3 {
            grid-column: span 1;
          }
        }
        @media (max-width: 640px) {
          .rednote-seo-page {
            padding: 8px 12px;
          }
          .rednote-seo-page .step-icon {
            width: 32px !important;
            height: 32px !important;
          }
          .rednote-seo-page .step-icon svg {
            width: 16px !important;
            height: 16px !important;
          }
          .rednote-seo-page .step-label {
            font-size: 10px !important;
          }
        }
      `}</style>
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-up ${
          toast.type === 'success' ? 'bg-[var(--color-success-bg)] text-[var(--color-success-text)] border border-[var(--color-success)]/20' :
          toast.type === 'error' ? 'bg-[var(--color-error-bg)] text-[var(--color-error-text)] border border-[var(--color-error)]/20' :
          'bg-[var(--color-info-bg)] text-[var(--color-info-text)] border border-[var(--color-info)]/20'
        }`}>
          {toast.type === 'success' && <CheckCircle style={{ width: 18, height: 18 }} />}
          {toast.type === 'error' && <ErrorIcon style={{ width: 18, height: 18 }} />}
          {toast.type === 'info' && <CheckCircle style={{ width: 18, height: 18 }} />}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">{t('rednote.pageTitle')}</h1>
            <p className="page-subtitle">{t('rednote.pageSubtitle')}</p>
          </div>
          {xhsInstalled && (
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                loggedIn 
                  ? 'bg-[var(--color-success-bg)] text-[var(--color-success-text)]' 
                  : 'bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]'
              }`}>
                <div className={`w-2 h-2 rounded-full ${loggedIn ? 'bg-[var(--color-success)]' : 'bg-[var(--color-warning)]'}`} />
                {loggedIn ? t('rednote.loggedIn') : t('rednote.notLoggedInStatus')}
              </div>
              {syncing && (
                <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                  <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" />
                  {t('rednote.syncing')}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Step Indicator */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            {WORKFLOW_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = activeSection === step.id;
              const isPast = index < currentStepIndex;
              
              return (
                <React.Fragment key={step.id}>
                  <button
                    onClick={() => setActiveSection(step.id as any)}
                    className={`flex flex-col items-center gap-2 group`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all step-icon ${
                      isActive
                        ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/30'
                        : isPast
                        ? 'bg-[var(--color-success)] text-white'
                        : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] group-hover:bg-[var(--color-border)]'
                    }`}>
                      {isPast ? <CheckCircle style={{ width: 20, height: 20 }} /> : <Icon style={{ width: 20, height: 20 }} />}
                    </div>
                    <span className={`text-xs font-medium step-label ${
                      isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'
                    }`}>{t(step.labelKey)}</span>
                  </button>
                  
                  {index < WORKFLOW_STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 ${
                      isPast ? 'bg-[var(--color-success)]' : 'bg-[var(--color-border)]'
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Account Section */}
      {activeSection === 'account' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-in">
          {/* Status Card */}
          <div className="lg:col-span-2 card">
            <div className="card-header">
              <h3 className="heading text-lg">{t('rednote.accountStatusTitle')}</h3>
            </div>
            <div className="card-body">
              {!xhsInstalled ? (
                <div className="flex items-start gap-4 p-3 bg-[var(--color-warning-bg)] rounded-xl">
                  <Warning style={{ width: 20, height: 20, color: 'var(--color-warning)' }} />
                  <div className="flex-1">
                    <h4 className="font-semibold text-[var(--color-warning-text)] mb-1 text-sm">{t('rednote.notInstalled')}</h4>
                    <p className="text-xs text-[var(--color-text-secondary)] mb-2">
                      {t('rednote.notInstalledDesc')}
                    </p>
                    <code className="block bg-[var(--color-surface)] px-3 py-1.5 rounded-lg text-xs font-mono">
                      {t('rednote.installCommand')}
                    </code>
                  </div>
                </div>
              ) : !loggedIn ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface)] flex items-center justify-center mx-auto mb-3">
                    <AccountCircle style={{ width: 36, height: 36, color: 'var(--color-text-disabled)' }} />
                  </div>
                  <h3 className="heading text-base mb-1">{t('rednote.connectAccount')}</h3>
                  <p className="text-[var(--color-text-muted)] mb-4 max-w-sm mx-auto text-xs">
                    {t('rednote.notLoggedInDesc')}
                  </p>
                  <button
                    onClick={handleLogin}
                    disabled={loginLoading}
                    className="btn btn-primary btn-sm"
                  >
                    {loginLoading ? (
                      <>
                        <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />
                        {t('rednote.login')}...
                      </>
                    ) : (
                      <>
                        <Login style={{ width: 14, height: 14 }} />
                        {t('rednote.loginFromChrome')}
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-[var(--color-primary-muted)] flex-shrink-0">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.nickname} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-[var(--color-primary)]">
                        {user?.nickname?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="heading text-base mb-0.5">{user?.nickname || t('rednote.defaultNickname')}</h3>
                    {user?.redId && (
                      <p className="text-xs text-[var(--color-text-muted)] mb-2">{t('rednote.redId')} {user.redId}</p>
                    )}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="stat-card !p-2">
                        <div className="stat-value text-base">{formatNumber(user?.followers)}</div>
                        <div className="stat-label text-xs">{t('rednote.followers')}</div>
                      </div>
                      <div className="stat-card !p-2">
                        <div className="stat-value text-base">{formatNumber(user?.following)}</div>
                        <div className="stat-label text-xs">{t('rednote.following')}</div>
                      </div>
                      <div className="stat-card !p-2">
                        <div className="stat-value text-base">{formatNumber(user?.likes)}</div>
                        <div className="stat-label text-xs">{t('rednote.likes')}</div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => { checkStatus(); syncUserData(); }}
                    className="btn btn-secondary btn-sm self-start"
                  >
                    <Refresh style={{ width: 12, height: 12 }} />
                    {t('rednote.refresh')}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="card">
            <div className="card-header">
              <h3 className="heading text-sm">{t('rednote.dataOverview')}</h3>
            </div>
            <div className="card-body space-y-2">
              <div className="flex items-center justify-between p-2 bg-[var(--color-surface)] rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-md bg-[var(--color-primary-muted)] flex items-center justify-center">
                    <Publish style={{ width: 14, height: 14, color: 'var(--color-primary)' }} />
                  </div>
                  <span className="text-xs font-medium">{t('rednote.notesPublished')}</span>
                </div>
                <span className="text-base font-bold">{myNotes.length}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[var(--color-surface)] rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-md bg-[var(--color-success-bg)] flex items-center justify-center">
                    <ThumbUp style={{ width: 14, height: 14, color: 'var(--color-success)' }} />
                  </div>
                  <span className="text-xs font-medium">{t('rednote.totalLikes')}</span>
                </div>
                <span className="text-base font-bold">
                  {formatNumber(myNotes.reduce((sum, n) => sum + (n.likedCount || 0), 0))}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[var(--color-surface)] rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-md bg-[var(--color-accent-muted)] flex items-center justify-center">
                    <Favorite style={{ width: 14, height: 14, color: 'var(--color-accent)' }} />
                  </div>
                  <span className="text-xs font-medium">{t('rednote.totalCollections')}</span>
                </div>
                <span className="text-base font-bold">
                  {formatNumber(myNotes.reduce((sum, n) => sum + (n.collectedCount || 0), 0))}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[var(--color-surface)] rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-md bg-[var(--color-warning-bg)] flex items-center justify-center">
                    <Chat style={{ width: 14, height: 14, color: 'var(--color-warning)' }} />
                  </div>
                  <span className="text-xs font-medium">{t('rednote.totalComments')}</span>
                </div>
                <span className="text-base font-bold">
                  {formatNumber(myNotes.reduce((sum, n) => sum + (n.commentCount || 0), 0))}
                </span>
              </div>
            </div>
          </div>

          {/* My Notes */}
          <div className="lg:col-span-3 card">
            <div className="card-header flex items-center justify-between">
              <h3 className="heading text-sm">{t('rednote.myNotes')}</h3>
              <button
                onClick={fetchMyNotes}
                disabled={myNotesLoading}
                className="btn btn-secondary btn-sm"
              >
                <Refresh style={{ width: 16, height: 16 }} className={myNotesLoading ? 'animate-spin' : ''} />
                {t('rednote.refresh')}
              </button>
            </div>
            <div className="card-body">
              {myNotesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 style={{ width: 32, height: 32 }} className="animate-spin text-[var(--color-primary)]" />
                </div>
              ) : myNotes.length === 0 ? (
                <div className="empty-state">
                  <Publish style={{ width: 64, height: 64 }} className="empty-state-icon" />
                  <h4 className="empty-state-title">{t('rednote.noNotesYet')}</h4>
                  <p className="empty-state-description">{t('rednote.goPublishFirst')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myNotes.map((note, idx) => (
                    <div key={idx} className="p-4 bg-[var(--color-surface)] rounded-xl hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-[var(--color-text-primary)] truncate mb-2">
                            {note.title || t('rednote.noTitle')}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-[var(--color-text-muted)]">
                            <span className="flex items-center gap-1">
                              <ThumbUp style={{ width: 14, height: 14 }} /> {formatNumber(note.likedCount)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Favorite style={{ width: 14, height: 14 }} /> {formatNumber(note.collectedCount)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Chat style={{ width: 14, height: 14 }} /> {formatNumber(note.commentCount)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDeleteNote(note)}
                            className="btn-icon !w-8 !h-8"
                          >
                            <Delete style={{ width: 16, height: 16 }} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Publish Section */}
      {activeSection === 'publish' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* AI Generate */}
          <div className="lg:col-span-2 card">
            <div className="card-header">
              <h3 className="heading text-lg flex items-center gap-2">
                <AutoAwesome style={{ width: 20, height: 20, color: 'var(--color-primary)' }} />
                AI {t('rednote.aiSmartGenerate')}
              </h3>
            </div>
            <div className="card-body space-y-6">
              {/* Templates */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {CONTENT_TEMPLATES.map(template => (
                  <button
                    key={template.label}
                    onClick={() => setSelectedTemplate(selectedTemplate === template.label ? '' : template.label)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selectedTemplate === template.label
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary-muted)]'
                        : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
                    }`}
                  >
                    <div className="text-2xl mb-2">{template.icon}</div>
                    <div className="font-semibold text-sm mb-1">{template.label}</div>
                    <div className="text-xs text-[var(--color-text-muted)]">{template.desc}</div>
                  </button>
                ))}
              </div>

              {/* Generate Input */}
              <div className="flex gap-3">
                <input
                  type="text"
                  value={publishForm.title}
                  onChange={e => setPublishForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder={t('rednote.businessNamePlaceholder')}
                  className="input flex-1"
                />
                <button
                  onClick={() => handleAIGenerate()}
                  disabled={aiGenerating}
                  className="btn btn-primary"
                >
                  {aiGenerating ? (
                    <Loader2 style={{ width: 18, height: 18 }} className="animate-spin" />
                  ) : (
                    <AutoAwesome style={{ width: 18, height: 18 }} />
                  )}
                  {aiGenerating ? t('rednote.aiGenerating') : t('rednote.aiGenerate')}
                </button>
              </div>
            </div>
          </div>

          {/* Publish Form */}
          <div className="card">
            <div className="card-header">
              <h3 className="heading text-base">{t('rednote.editContent')}</h3>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">{t('rednote.contentTitle')}</label>
                <input
                  type="text"
                  value={publishForm.title}
                  onChange={e => setPublishForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder={t('rednote.titlePlaceholder')}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">{t('rednote.contentBody')}</label>
                <textarea
                  value={publishForm.body}
                  onChange={e => setPublishForm(prev => ({ ...prev, body: e.target.value }))}
                  rows={5}
                  placeholder={t('rednote.bodyPlaceholder')}
                  className="input resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">{t('rednote.topics')}</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_TOPICS.slice(0, 8).map(topic => (
                    <button
                      key={topic}
                      onClick={() => toggleTopic(`#${topic}`)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        publishForm.topics.includes(`#${topic}`)
                          ? 'bg-[var(--color-primary)] text-white'
                          : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'
                      }`}
                    >
                      #{topic}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">{t('rednote.imageUpload')} ({publishForm.images.length}/9)</label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${
                    dragOver
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-muted)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
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
                  <CameraAlt style={{ width: 24, height: 24, color: 'var(--color-text-disabled)' }} className="mx-auto mb-1" />
                  <p className="text-xs text-[var(--color-text-muted)]">{t('rednote.imageHint')}</p>
                </div>

                {publishForm.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {publishForm.images.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <span className="text-white text-xs">×</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setPublishForm({ title: '', body: '', topics: [], images: [] })}
                  className="btn btn-secondary btn-sm flex-1"
                >
                  {t('rednote.clear')}
                </button>
                <button
                  onClick={handlePublish}
                  disabled={publishing || !publishForm.title.trim() || !publishForm.body.trim()}
                  className="btn btn-primary btn-sm flex-1"
                >
                  {publishing ? (
                    <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />
                  ) : (
                    <Send style={{ width: 14, height: 14 }} />
                  )}
                  {publishing ? t('rednote.publishing') : t('rednote.publishBtn')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comments Section */}
      {activeSection === 'comments' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
          {/* Search */}
          <div className="card">
            <div className="card-header">
              <h3 className="heading text-base">{t('rednote.searchNotes')}</h3>
            </div>
            <div className="card-body space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={e => setSearchKeyword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                    placeholder={t('rednote.searchPlaceholder')}
                  className="input flex-1"
                />
                <button onClick={handleSearch} disabled={loading} className="btn btn-primary">
                  <Search style={{ width: 18, height: 18 }} />
                </button>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {searchResults.map((note, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleGetComments(note)}
                      className={`w-full p-4 rounded-xl border text-left transition-all ${
                        selectedNote?.noteId === note.noteId || selectedNote?.id === note.id
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary-muted)]'
                          : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
                      }`}
                    >
                          <h4 className="font-semibold truncate">{note.title || t('rednote.noTitle')}</h4>
                          <div className="flex items-center gap-2 mt-1 text-xs text-[var(--color-text-muted)]">
                            {note.user?.nickname && <span>@{note.user.nickname}</span>
                            }
                            <span>{formatNumber(note.likedCount)} {t('rednote.likes')}</span>
                            <span>{formatNumber(note.commentCount)} {t('rednote.comments')}</span>
                          </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Comments */}
          <div className="card">
            <div className="card-header">
              <h3 className="heading text-base">{t('rednote.commentDetail')}</h3>
              {selectedNote && (
                <span className="text-xs text-[var(--color-text-muted)]">- {selectedNote.title || t('rednote.noTitle')}</span>
              )}
            </div>
            <div className="card-body">
              {!selectedNote ? (
                <div className="empty-state">
                  <Chat style={{ width: 40, height: 40 }} className="empty-state-icon" />
                  <h4 className="empty-state-title">{t('rednote.selectNote')}</h4>
                  <p className="empty-state-description">{t('rednote.selectNoteHint')}</p>
                </div>
              ) : commentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 style={{ width: 24, height: 24 }} className="animate-spin text-[var(--color-primary)]" />
                </div>
              ) : comments.length === 0 ? (
                <div className="empty-state">
                  <Chat style={{ width: 40, height: 40 }} className="empty-state-icon" />
                  <h4 className="empty-state-title">{t('rednote.noComments')}</h4>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {comments.map((comment, idx) => (
                    <div key={idx} className="p-4 bg-[var(--color-surface)] rounded-xl">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--color-primary-muted)] flex items-center justify-center text-[var(--color-primary)] font-bold">
                          {comment.userInfo?.nickname?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{comment.userInfo?.nickname || t('rednote.anonymousUser')}</span>
                            {comment.likeCount && comment.likeCount > 0 && (
                              <span className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                                <ThumbUp style={{ width: 12, height: 12 }} /> {comment.likeCount}
                              </span>
                            )}
                          </div>
                          <p className="text-[var(--color-text-secondary)]">{comment.content}</p>
                          
                          <div className="mt-3 flex gap-2">
                            <input
                              type="text"
                              value={replyText[comment.commentId || comment.id || ''] || ''}
                              onChange={e => setReplyText(prev => ({
                                ...prev,
                                [comment.commentId || comment.id || '']: e.target.value
                              }))}
                              placeholder={t('rednote.replyPlaceholder')}
                              className="input flex-1 !py-2"
                            />
                            <button
                              onClick={() => handleReply(comment)}
                              disabled={submittingReply === (comment.commentId || comment.id)}
                              className="btn btn-primary btn-sm"
                            >
                              {submittingReply === (comment.commentId || comment.id) ? (
                                <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />
                              ) : t('rednote.reply')}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Monitor Section */}
      {activeSection === 'monitor' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
          {/* Brand Search */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="heading text-lg flex items-center gap-2">
                <LocalFireDepartment style={{ width: 16, height: 16, color: 'var(--color-primary)' }} />
                {t('rednote.brandMonitor')}
              </h3>
            </div>
            <div className="card-body space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={monitorKeyword}
                  onChange={e => setMonitorKeyword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleMonitorSearch()}
                  placeholder={t('rednote.brandPlaceholder')}
                  className="input flex-1"
                />
                <button onClick={handleMonitorSearch} disabled={loading} className="btn btn-primary">
                  <Search style={{ width: 18, height: 18 }} />
                </button>
              </div>

              {/* History */}
              {monitorHistory.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  <span className="text-xs text-[var(--color-text-muted)]">{t('rednote.recent')}</span>
                  {monitorHistory.map((keyword, idx) => (
                    <button
                      key={idx}
                      onClick={() => { setMonitorKeyword(keyword); handleMonitorSearch(); }}
                      className="px-3 py-1 bg-[var(--color-surface)] rounded-full text-sm hover:bg-[var(--color-border)] transition-colors"
                    >
                      {keyword}
                    </button>
                  ))}
                </div>
              )}

              {monitorResults.length > 0 && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  <div className="text-sm text-[var(--color-text-muted)] mb-2">
                    {t('rednote.relatedNotes').replace('{count}', String(monitorResults.length))}
                  </div>
                  {monitorResults.slice(0, 20).map((note, idx) => (
                    <div key={idx} className="p-4 bg-[var(--color-surface)] rounded-xl">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate text-sm">{note.title || t('rednote.noTitle')}</h4>
                          <div className="flex items-center gap-3 mt-2 text-sm text-[var(--color-text-muted)]">
                            {note.user?.nickname && <span>@{note.user.nickname}</span>}
                            <span className="flex items-center gap-1">
                              <ThumbUp style={{ width: 12, height: 12 }} /> {formatNumber(note.likedCount)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Favorite style={{ width: 12, height: 12 }} /> {formatNumber(note.collectedCount)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Chat style={{ width: 12, height: 12 }} /> {formatNumber(note.commentCount)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleLikeNote(note)}
                            className="btn-icon !w-8 !h-8"
                          >
                            <ThumbUp style={{ width: 16, height: 16 }} />
                          </button>
                          <button
                            onClick={() => handleGetComments(note)}
                            className="btn-icon !w-8 !h-8"
                          >
                            <Chat style={{ width: 16, height: 16 }} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Topic Search */}
          <div className="card">
            <div className="card-header">
              <h3 className="heading text-lg flex items-center gap-2">
                <Tag style={{ width: 16, height: 16, color: 'var(--color-primary)' }} />
                {t('rednote.topicHeat')}
              </h3>
            </div>
            <div className="card-body space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={topicSearch}
                  onChange={e => setTopicSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleTopicSearch()}
                  placeholder={t('rednote.topicPlaceholder')}
                  className="input flex-1"
                />
                <button onClick={handleTopicSearch} disabled={loading} className="btn btn-primary">
                  <Search style={{ width: 18, height: 18 }} />
                </button>
              </div>

              {topicResults.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {topicResults.map((topic, idx) => (
                    <div key={idx} className="p-4 bg-[var(--color-surface)] rounded-xl">
                      <div className="font-semibold truncate mb-1">
                        #{topic.name || topic.tag || t('rednote.unknownTopic')}
                      </div>
                      {topic.noteCount && (
                        <div className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                          <TrendingUp style={{ width: 12, height: 12 }} />
                          {topic.noteCount.toLocaleString()} {t('rednote.notes')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
