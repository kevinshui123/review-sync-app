import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Search,
  CheckCircle,
  Clock,
  XCircle,
  Star,
  MapPin,
  Calendar,
  Image,
  Check,
  X,
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Eye,
  Send,
} from 'lucide-react';
import { apiGet, apiPut } from '../utils/api';

interface Submission {
  id: string;
  tenantId: string;
  userId: string | null;
  userEmail: string | null;
  location: string;
  locationId: string | null;
  title: string;
  content: string;
  rating: number;
  photos: string[];
  topics: string[];
  submitDate: string | null;
  status: string;
  adminNote: string | null;
  publishedAccount: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function RealRednotePostsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchSubmissions();
  }, [statusFilter]);

  const fetchSubmissions = async () => {
    try {
      const url = statusFilter !== 'all'
        ? `/admin/real-rednote?status=${statusFilter}`
        : '/admin/real-rednote';
      const res = await apiGet(url);
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions);
      }
    } catch (err) {
      console.error('Failed to fetch submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (id: string) => {
    const account = prompt('请输入发布用的小红书账号：');
    if (!account || !account.trim()) {
      alert('请输入有效的小红书账号');
      return;
    }

    setProcessing(id);
    try {
      const res = await apiPut(`/admin/real-rednote/${id}/publish`, { publishedAccount: account });
      if (res.ok) {
        setSubmissions(submissions.map(s =>
          s.id === id ? { ...s, status: 'published', publishedAccount: account } : s
        ));
        if (selectedSubmission?.id === id) {
          setSelectedSubmission({ ...selectedSubmission, status: 'published', publishedAccount: account });
        }
      } else {
        const err = await res.json();
        alert('发布失败: ' + (err.error || '未知错误'));
      }
    } catch (err) {
      console.error('Failed to publish:', err);
      alert('操作失败');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: string, note: string) => {
    setProcessing(id);
    try {
      const res = await apiPut(`/admin/real-rednote/${id}/reject`, { adminNote: note });
      if (res.ok) {
        setSubmissions(submissions.map(s =>
          s.id === id ? { ...s, status: 'rejected' } : s
        ));
        if (selectedSubmission?.id === id) {
          setSelectedSubmission({ ...selectedSubmission, status: 'rejected' });
        }
        setShowRejectModal(false);
        setRejectNote('');
      }
    } catch (err) {
      console.error('Failed to reject:', err);
      alert('操作失败');
    } finally {
      setProcessing(null);
    }
  };

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const openRejectModal = (id: string) => {
    setRejectingId(id);
    setShowRejectModal(true);
  };

  const filteredSubmissions = submissions.filter(s => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      s.location.toLowerCase().includes(term) ||
      s.content.toLowerCase().includes(term) ||
      s.title.toLowerCase().includes(term) ||
      (s.userEmail && s.userEmail.toLowerCase().includes(term))
    );
  });

  const pendingCount = submissions.filter(s => s.status === 'pending').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="badge badge-warning"><Clock size={12} /> 待处理</span>;
      case 'published':
        return <span className="badge badge-success"><CheckCircle size={12} /> 已发布</span>;
      case 'rejected':
        return <span className="badge badge-error"><XCircle size={12} /> 已拒绝</span>;
      case 'failed':
        return <span className="badge badge-error"><XCircle size={12} /> 失败</span>;
      default:
        return <span className="badge badge-info">{status}</span>;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div style={{ display: 'flex', gap: '2px' }}>
        {[1, 2, 3, 4, 5].map(i => (
          <Star
            key={i}
            size={16}
            fill={i <= rating ? '#f59e0b' : 'none'}
            color={i <= rating ? '#f59e0b' : '#e2e8f0'}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="admin-layout">
      <AdminSidebar active="rednote-posts" />

      <main className="admin-content">
        <div className="page-header">
          <h1 className="page-title">小红书笔记管理</h1>
          <p className="page-subtitle">审核用户提交的小红书笔记内容</p>
        </div>

        {/* Status Tabs */}
        <div className="tabs">
          <button
            className={`tab ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            全部
          </button>
          <button
            className={`tab ${statusFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setStatusFilter('pending')}
          >
            <Clock size={16} style={{ marginRight: '4px' }} />
            待处理 {pendingCount > 0 && <span style={{ background: '#f59e0b', color: 'white', borderRadius: '10px', padding: '2px 8px', fontSize: '11px', marginLeft: '8px' }}>{pendingCount}</span>}
          </button>
          <button
            className={`tab ${statusFilter === 'published' ? 'active' : ''}`}
            onClick={() => setStatusFilter('published')}
          >
            <CheckCircle size={16} style={{ marginRight: '4px' }} />
            已发布
          </button>
          <button
            className={`tab ${statusFilter === 'rejected' ? 'active' : ''}`}
            onClick={() => setStatusFilter('rejected')}
          >
            <XCircle size={16} style={{ marginRight: '4px' }} />
            已拒绝
          </button>
        </div>

        {/* Search */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ position: 'relative' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              className="form-input"
              placeholder="搜索门店名称、标题或内容..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '48px' }}
            />
          </div>
        </div>

        {/* Submissions */}
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="text-muted">加载中...</p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <MessageSquare size={64} />
              <h3>暂无笔记</h3>
              <p>{searchTerm ? '尝试其他搜索词' : statusFilter !== 'all' ? '该状态下暂无笔记' : '暂无笔记提交'}</p>
            </div>
          </div>
        ) : (
          <div>
            {filteredSubmissions.map((submission) => (
              <div key={submission.id} className="review-card">
                <div className="review-header">
                  <div>
                    <div className="review-location">
                      <MapPin size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                      {submission.location}
                    </div>
                    <div className="text-sm text-muted" style={{ marginTop: '4px', marginLeft: '24px' }}>
                      {submission.submitDate && (
                        <span><Calendar size={12} style={{ marginRight: '4px' }} />{submission.submitDate}</span>
                      )}
                      <span style={{ marginLeft: '12px' }}>{formatDate(submission.createdAt)}</span>
                    </div>
                  </div>
                  {getStatusBadge(submission.status)}
                </div>

                {/* Title */}
                {submission.title && (
                  <div style={{ marginBottom: '8px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {submission.title}
                  </div>
                )}

                <div style={{ marginBottom: '16px' }}>
                  {renderStars(submission.rating)}
                </div>

                <div className="review-content">
                  {submission.content}
                </div>

                {/* Topics */}
                {submission.topics && submission.topics.length > 0 && (
                  <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {submission.topics.map((topic, idx) => (
                      <span key={idx} style={{
                        background: 'var(--primary-light)',
                        color: 'var(--primary)',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 500,
                      }}>
                        {topic}
                      </span>
                    ))}
                  </div>
                )}

                {submission.photos && submission.photos.length > 0 && (
                  <div className="review-photos">
                    {submission.photos.map((photo, idx) => (
                      <img
                        key={idx}
                        src={photo}
                        alt={`Photo ${idx + 1}`}
                        className="review-photo"
                        style={{ cursor: 'pointer' }}
                        onClick={() => window.open(photo, '_blank')}
                      />
                    ))}
                  </div>
                )}

                {/* Published Account */}
                {submission.publishedAccount && (
                  <div style={{
                    padding: '12px',
                    background: '#dcfce7',
                    borderRadius: '8px',
                    marginTop: '16px',
                    fontSize: '14px',
                  }}>
                    <strong>已发布账号：</strong>{submission.publishedAccount}
                  </div>
                )}

                {submission.adminNote && (
                  <div style={{
                    padding: '12px',
                    background: submission.status === 'rejected' ? '#fee2e2' : '#dcfce7',
                    borderRadius: '8px',
                    marginTop: '16px',
                    fontSize: '14px',
                  }}>
                    <strong>管理员备注：</strong>{submission.adminNote}
                  </div>
                )}

                <div className="review-actions">
                  {submission.status === 'pending' && (
                    <>
                      <button
                        className="btn btn-success"
                        onClick={() => handlePublish(submission.id)}
                        disabled={processing === submission.id}
                      >
                        {processing === submission.id ? (
                          <span>处理中...</span>
                        ) : (
                          <>
                            <Send size={18} />
                            标记已发布
                          </>
                        )}
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => openRejectModal(submission.id)}
                        disabled={processing === submission.id}
                      >
                        <X size={18} />
                        拒绝
                      </button>
                    </>
                  )}
                  {submission.status === 'published' && (
                    <span className="badge badge-success" style={{ padding: '10px 16px' }}>
                      <CheckCircle size={16} style={{ marginRight: '6px' }} />
                      此笔记已发布 {submission.publishedAccount && `(账号: ${submission.publishedAccount})`}
                    </span>
                  )}
                  {submission.status === 'rejected' && (
                    <span className="badge badge-error" style={{ padding: '10px 16px' }}>
                      <XCircle size={16} style={{ marginRight: '6px' }} />
                      此笔记已被拒绝
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-sm text-muted mt-4">
          共 {filteredSubmissions.length} 条笔记
        </p>
      </main>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">拒绝笔记</h3>
              <button className="modal-close" onClick={() => setShowRejectModal(false)}>×</button>
            </div>
            <div className="form-group">
              <label className="form-label">拒绝原因（可选）</label>
              <textarea
                className="form-input"
                rows={4}
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="请输入拒绝原因..."
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowRejectModal(false)}>
                取消
              </button>
              <button
                className="btn btn-danger"
                onClick={() => rejectingId && handleReject(rejectingId, rejectNote)}
                disabled={processing === rejectingId}
              >
                {processing === rejectingId ? '处理中...' : '确认拒绝'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Admin Sidebar Component
function AdminSidebar({ active }: { active: string }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/admin/login');
  };

  const adminUser = (() => {
    try {
      const user = localStorage.getItem('admin_user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  })();

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">⚙️</div>
        <div className="sidebar-brand-text">
          <h1>Admin Panel</h1>
          <p>PinKernel SEO</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        <Link to="/admin" className={`sidebar-nav-item ${active === 'dashboard' ? 'active' : ''}`}>
          <BarChart3 size={20} />
          仪表盘
        </Link>
        <Link to="/admin/users" className={`sidebar-nav-item ${active === 'users' ? 'active' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          用户管理
        </Link>
        <Link to="/admin/real-comments" className={`sidebar-nav-item ${active === 'comments' ? 'active' : ''}`}>
          <MessageSquare size={20} />
          评论管理
        </Link>
        <Link to="/admin/real-rednote" className={`sidebar-nav-item ${active === 'rednote-posts' ? 'active' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          小红书笔记
        </Link>
      </nav>

      <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
        <div style={{ padding: '12px', marginBottom: '12px' }}>
          <div className="text-sm text-muted">登录为</div>
          <div className="font-semibold">{adminUser?.name || 'Admin'}</div>
          <div className="text-sm text-muted">{adminUser?.email}</div>
        </div>
        <button onClick={handleLogout} className="sidebar-nav-item" style={{ width: '100%' }}>
          <LogOut size={20} />
          退出登录
        </button>
      </div>
    </aside>
  );
}
