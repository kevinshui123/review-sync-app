import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  Clock,
  XCircle,
  Send,
  LogOut,
  BarChart3,
  RefreshCw,
  Image,
  Tag,
  Search,
  BookOpen,
  ThumbsUp,
  MessageCircle,
  Bookmark,
  User,
  ChevronDown,
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
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const fetchSubmissions = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const url = statusFilter !== 'all'
        ? `/admin/real-rednote?status=${statusFilter}`
        : '/admin/real-rednote';
      const res = await apiGet(url);
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions || []);
      } else {
        console.error('[admin] Failed to fetch, status:', res.status);
      }
    } catch (err) {
      console.error('[admin] Failed to fetch submissions:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [statusFilter]);

  const handleRefresh = () => {
    fetchSubmissions(true);
  };

  const handlePublish = async (id: string) => {
    setPublishingId(id);
    try {
      const account = prompt('请输入发布用的小红书账号：');
      if (!account || !account.trim()) {
        setPublishingId(null);
        return;
      }

      const res = await apiPut(`/admin/real-rednote/${id}/publish`, { publishedAccount: account });
      if (res.ok) {
        setSubmissions(prev => prev.map(s =>
          s.id === id ? { ...s, status: 'published', publishedAccount: account } : s
        ));
      } else {
        const err = await res.json();
        alert('发布失败: ' + (err.error || '未知错误'));
      }
    } catch (err) {
      console.error('Failed to publish:', err);
      alert('操作失败');
    } finally {
      setPublishingId(null);
    }
  };

  const openRejectModal = (id: string) => {
    setRejectingId(id);
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!rejectingId) return;
    setProcessing(rejectingId);
    try {
      const res = await apiPut(`/admin/real-rednote/${rejectingId}/reject`, { adminNote: rejectNote });
      if (res.ok) {
        setSubmissions(prev => prev.map(s =>
          s.id === rejectingId ? { ...s, status: 'rejected' } : s
        ));
        setShowRejectModal(false);
        setRejectNote('');
        setRejectingId(null);
      }
    } catch (err) {
      console.error('Failed to reject:', err);
      alert('操作失败');
    } finally {
      setProcessing(null);
    }
  };

  const filteredSubmissions = submissions.filter(s => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      s.location.toLowerCase().includes(term) ||
      s.content.toLowerCase().includes(term) ||
      s.title.toLowerCase().includes(term) ||
      (s.publishedAccount && s.publishedAccount.toLowerCase().includes(term))
    );
  });

  const pendingCount = submissions.filter(s => s.status === 'pending').length;
  const publishedCount = submissions.filter(s => s.status === 'published').length;
  const rejectedCount = submissions.filter(s => s.status === 'rejected').length;

  const statusTabClass = (status: string) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer border ${
      statusFilter === status
        ? 'bg-red-500 text-white border-red-500'
        : 'bg-white text-slate-600 border-slate-200 hover:border-red-300 hover:text-red-500'
    }`;

  const getStatusDot = (status: string) => {
    if (status === 'pending') return <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />;
    if (status === 'published') return <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />;
    if (status === 'rejected') return <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />;
    return <span className="w-2 h-2 rounded-full bg-slate-400 flex-shrink-0" />;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="admin-layout">
      <AdminSidebar active="rednote-posts" />

      <main className="admin-content" style={{ background: '#f5f5f7', minHeight: '100vh' }}>
        {/* Header */}
        <div style={{
          background: '#fff',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          padding: '24px 32px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Rednote Logo */}
              <div style={{
                width: '40px', height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(238,90,36,0.3)',
              }}>
                <BookOpen size={20} color="#fff" />
              </div>
              <div>
                <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a1a', margin: 0, lineHeight: 1.2 }}>
                  小红书笔记管理
                </h1>
                <p style={{ fontSize: '13px', color: '#999', margin: 0, marginTop: '2px' }}>
                  审核用户提交的小红书笔记发布申请
                </p>
              </div>
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 16px',
                background: '#fff', border: '1px solid rgba(0,0,0,0.10)',
                borderRadius: '8px', cursor: 'pointer',
                fontSize: '13px', fontWeight: 500, color: '#666',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#ee5a24';
                e.currentTarget.style.color = '#ee5a24';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(0,0,0,0.10)';
                e.currentTarget.style.color = '#666';
              }}
            >
              <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
              {refreshing ? '刷新中...' : '刷新'}
            </button>
          </div>

          {/* Stats Row */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            {[
              { label: '全部', count: submissions.length, color: '#666', bg: '#f5f5f5' },
              { label: '待发布', count: pendingCount, color: '#f59e0b', bg: '#fffbeb' },
              { label: '已发布', count: publishedCount, color: '#22c55e', bg: '#f0fdf4' },
              { label: '已拒绝', count: rejectedCount, color: '#ef4444', bg: '#fef2f2' },
            ].map(stat => (
              <div key={stat.label} style={{
                padding: '8px 16px', borderRadius: '10px',
                background: stat.bg, border: '1px solid rgba(0,0,0,0.05)',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <span style={{ fontSize: '13px', color: stat.color, fontWeight: 600 }}>{stat.count}</span>
                <span style={{ fontSize: '13px', color: '#999' }}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: '16px 32px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            background: '#fff', borderRadius: '12px',
            border: '1px solid rgba(0,0,0,0.06)',
            padding: '0 16px',
          }}>
            <Search size={16} color="#999" />
            <input
              type="text"
              placeholder="搜索门店、标题、内容或发布账号..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                flex: 1, border: 'none', outline: 'none',
                padding: '12px 0', fontSize: '14px',
                color: '#1a1a1a', background: 'transparent',
              }}
            />
          </div>
        </div>

        {/* Status Tabs */}
        <div style={{ padding: '0 32px 16px', display: 'flex', gap: '8px' }}>
          {[
            { key: 'all', label: '全部' },
            { key: 'pending', label: '待发布' },
            { key: 'published', label: '已发布' },
            { key: 'rejected', label: '已拒绝' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={statusTabClass(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: '0 32px 32px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#999' }}>
              <div style={{ marginBottom: '12px' }}>
                <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', color: '#ee5a24' }} />
              </div>
              <p style={{ fontSize: '14px' }}>加载中...</p>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '80px 0',
              background: '#fff', borderRadius: '16px',
              border: '1px solid rgba(0,0,0,0.06)',
            }}>
              <div style={{ marginBottom: '16px' }}>
                <BookOpen size={48} color="#ddd" style={{ margin: '0 auto' }} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1a1a1a', margin: '0 0 8px' }}>
                暂无笔记
              </h3>
              <p style={{ fontSize: '13px', color: '#999', margin: 0 }}>
                {searchTerm ? '尝试其他搜索词' : statusFilter !== 'all' ? '该状态下暂无笔记' : '用户提交后将在此显示'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredSubmissions.map(sub => (
                <div
                  key={sub.id}
                  style={{
                    background: '#fff', borderRadius: '16px',
                    border: '1px solid rgba(0,0,0,0.06)',
                    overflow: 'hidden',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.03)';
                  }}
                >
                  {/* Card Header */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 20px',
                    borderBottom: expandedId === sub.id ? '1px solid rgba(0,0,0,0.05)' : 'none',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                      {/* Status dot */}
                      <div style={{ flexShrink: 0 }}>{getStatusDot(sub.status)}</div>

                      {/* Location name */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a' }}>
                          {sub.location}
                        </span>
                      </div>

                      {/* Title */}
                      {sub.title && (
                        <span style={{
                          fontSize: '13px', color: '#666',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          borderLeft: '1px solid #e5e5e5', paddingLeft: '10px',
                        }}>
                          {sub.title}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                      {/* Status badge */}
                      <span style={{
                        padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                        background: sub.status === 'published' ? '#f0fdf4' : sub.status === 'pending' ? '#fffbeb' : '#fef2f2',
                        color: sub.status === 'published' ? '#22c55e' : sub.status === 'pending' ? '#f59e0b' : '#ef4444',
                        border: `1px solid ${sub.status === 'published' ? '#bbf7d0' : sub.status === 'pending' ? '#fde68a' : '#fecaca'}`,
                      }}>
                        {sub.status === 'published' ? '已发布' : sub.status === 'pending' ? '待发布' : '已拒绝'}
                      </span>

                      {/* Date */}
                      <span style={{ fontSize: '12px', color: '#bbb', flexShrink: 0 }}>
                        {new Date(sub.createdAt).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}
                      </span>

                      {/* Expand/Collapse */}
                      <button
                        onClick={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: '28px', height: '28px', borderRadius: '50%',
                          background: '#f5f5f5', border: 'none', cursor: 'pointer',
                          transition: 'all 0.2s', flexShrink: 0,
                          transform: expandedId === sub.id ? 'rotate(180deg)' : 'rotate(0deg)',
                        }}
                      >
                        <ChevronDown size={14} color="#999" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedId === sub.id && (
                    <div style={{ padding: '0 20px 20px' }}>
                      {/* Cover Photos Preview */}
                      {sub.photos && sub.photos.length > 0 && (
                        <div style={{
                          display: 'flex', gap: '8px', marginBottom: '16px',
                          overflowX: 'auto', paddingBottom: '4px',
                        }}>
                          {sub.photos.map((photo, idx) => (
                            <div
                              key={idx}
                              onClick={() => window.open(photo, '_blank')}
                              style={{
                                width: '80px', height: '80px', borderRadius: '8px',
                                overflow: 'hidden', flexShrink: 0, cursor: 'pointer',
                                position: 'relative',
                              }}
                            >
                              <img
                                src={photo}
                                alt=""
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Note Content */}
                      <div style={{
                        fontSize: '14px', lineHeight: 1.8, color: '#333',
                        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                        background: '#fafafa', borderRadius: '10px',
                        padding: '14px 16px', marginBottom: '14px',
                        border: '1px solid rgba(0,0,0,0.04)',
                      }}>
                        {sub.content}
                      </div>

                      {/* Topics */}
                      {sub.topics && sub.topics.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
                          {sub.topics.map((topic, idx) => (
                            <span key={idx} style={{
                              padding: '4px 12px', borderRadius: '20px',
                              fontSize: '12px', fontWeight: 500,
                              background: 'rgba(238,90,36,0.08)', color: '#ee5a24',
                            }}>
                              {topic}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Published Account */}
                      {sub.publishedAccount && (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          padding: '10px 14px', borderRadius: '10px',
                          background: '#f0fdf4', border: '1px solid #bbf7d0',
                          marginBottom: '14px', fontSize: '13px',
                        }}>
                          <User size={14} color="#22c55e" />
                          <span style={{ color: '#666' }}>发布账号：</span>
                          <span style={{ color: '#22c55e', fontWeight: 600 }}>@{sub.publishedAccount}</span>
                        </div>
                      )}

                      {/* Admin Note */}
                      {sub.adminNote && (
                        <div style={{
                          padding: '10px 14px', borderRadius: '10px',
                          background: '#fffbeb', border: '1px solid #fde68a',
                          marginBottom: '14px', fontSize: '13px', color: '#92400e',
                        }}>
                          <strong>备注：</strong>{sub.adminNote}
                        </div>
                      )}

                      {/* Meta Info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                        <span style={{ fontSize: '12px', color: '#bbb' }}>
                          提交时间：{formatDate(sub.createdAt)}
                        </span>
                        {sub.userEmail && (
                          <span style={{ fontSize: '12px', color: '#bbb' }}>
                            用户：{sub.userEmail}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: '10px' }}>
                        {sub.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handlePublish(sub.id)}
                              disabled={publishingId === sub.id}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '10px 20px', borderRadius: '10px',
                                background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
                                border: 'none', color: '#fff', fontSize: '14px', fontWeight: 600,
                                cursor: publishingId === sub.id ? 'not-allowed' : 'pointer',
                                opacity: publishingId === sub.id ? 0.6 : 1,
                                boxShadow: '0 4px 12px rgba(238,90,36,0.3)',
                                transition: 'all 0.2s',
                              }}
                              onMouseEnter={e => {
                                if (publishingId !== sub.id) {
                                  e.currentTarget.style.transform = 'translateY(-1px)';
                                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(238,90,36,0.4)';
                                }
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(238,90,36,0.3)';
                              }}
                            >
                              {publishingId === sub.id ? (
                                <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                              ) : (
                                <Send size={14} />
                              )}
                              {publishingId === sub.id ? '发布中...' : '标记已发布'}
                            </button>
                            <button
                              onClick={() => openRejectModal(sub.id)}
                              disabled={processing === sub.id}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '10px 20px', borderRadius: '10px',
                                background: '#fff', border: '1px solid #e5e5e5',
                                color: '#666', fontSize: '14px', fontWeight: 500,
                                cursor: processing === sub.id ? 'not-allowed' : 'pointer',
                                opacity: processing === sub.id ? 0.6 : 1,
                                transition: 'all 0.2s',
                              }}
                            >
                              <XCircle size={14} />
                              拒绝
                            </button>
                          </>
                        )}
                        {sub.status === 'published' && (
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '10px 20px', borderRadius: '10px',
                            background: '#f0fdf4', border: '1px solid #bbf7d0',
                            color: '#22c55e', fontSize: '14px', fontWeight: 600,
                          }}>
                            <CheckCircle size={14} />
                            已发布 {sub.publishedAccount ? `· @${sub.publishedAccount}` : ''}
                          </div>
                        )}
                        {sub.status === 'rejected' && (
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '10px 20px', borderRadius: '10px',
                            background: '#fef2f2', border: '1px solid #fecaca',
                            color: '#ef4444', fontSize: '14px', fontWeight: 500,
                          }}>
                            <XCircle size={14} />
                            已拒绝
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {!loading && filteredSubmissions.length > 0 && (
            <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#bbb' }}>
              共 {filteredSubmissions.length} 条笔记
            </p>
          )}
        </div>

        {/* Reject Modal */}
        {showRejectModal && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, backdropFilter: 'blur(4px)',
          }}>
            <div style={{
              background: '#fff', borderRadius: '16px', padding: '24px',
              width: '100%', maxWidth: '440px', margin: '0 20px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1a1a1a', margin: '0 0 16px' }}>
                拒绝笔记
              </h3>
              <textarea
                value={rejectNote}
                onChange={e => setRejectNote(e.target.value)}
                placeholder="请输入拒绝原因（可选）..."
                rows={4}
                style={{
                  width: '100%', border: '1px solid rgba(0,0,0,0.10)',
                  borderRadius: '10px', padding: '12px', fontSize: '14px',
                  resize: 'none', outline: 'none', fontFamily: 'inherit',
                  lineHeight: 1.6, color: '#333',
                }}
              />
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button
                  onClick={() => { setShowRejectModal(false); setRejectNote(''); setRejectingId(null); }}
                  style={{
                    padding: '10px 20px', borderRadius: '10px',
                    background: '#fff', border: '1px solid #e5e5e5',
                    color: '#666', fontSize: '14px', fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  取消
                </button>
                <button
                  onClick={handleReject}
                  disabled={processing !== null}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '10px 20px', borderRadius: '10px',
                    background: '#ef4444', border: 'none',
                    color: '#fff', fontSize: '14px', fontWeight: 600,
                    cursor: processing !== null ? 'not-allowed' : 'pointer',
                    opacity: processing !== null ? 0.6 : 1,
                  }}
                >
                  {processing !== null ? '处理中...' : '确认拒绝'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Keyframes */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
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
        <div className="sidebar-brand-icon" style={{
          background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
        }}>⚙️</div>
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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          Google评论
        </Link>
        <Link to="/admin/real-rednote" className={`sidebar-nav-item ${active === 'rednote-posts' ? 'active' : ''}`} style={{
          background: active === 'rednote-posts' ? 'rgba(238,90,36,0.1)' : undefined,
          color: active === 'rednote-posts' ? '#ee5a24' : undefined,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
            <line x1="7" y1="7" x2="7.01" y2="7"/>
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
