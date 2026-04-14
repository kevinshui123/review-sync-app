import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  FileText,
  CheckCircle,
  Clock,
  Settings,
  LogOut,
  BarChart3,
  MessageSquare,
} from 'lucide-react';
import { apiGet } from '../utils/api';

interface Stats {
  totalUsers: number;
  totalTenants: number;
  totalSubmissions: number;
  pendingSubmissions: number;
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    const user = localStorage.getItem('admin_user');
    if (user) {
      setAdminUser(JSON.parse(user));
    }

    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await apiGet('/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/admin/login');
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">⚙️</div>
          <div className="sidebar-brand-text">
            <h1>Admin Panel</h1>
            <p>PinKernel SEO</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <Link to="/admin" className="sidebar-nav-item active">
            <BarChart3 size={20} />
            仪表盘
          </Link>
          <Link to="/admin/users" className="sidebar-nav-item">
            <Users size={20} />
            用户管理
          </Link>
          <Link to="/admin/real-comments" className="sidebar-nav-item">
            <MessageSquare size={20} />
            评论管理
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

      {/* Content */}
      <main className="admin-content">
        <div className="page-header">
          <h1 className="page-title">仪表盘</h1>
          <p className="page-subtitle">系统总览和统计数据</p>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="text-muted">加载中...</p>
          </div>
        ) : stats ? (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">总用户数</div>
                <div className="stat-value">{stats.totalUsers}</div>
                <div className="stat-change">注册用户</div>
              </div>

              <div className="stat-card">
                <div className="stat-label">租户数量</div>
                <div className="stat-value">{stats.totalTenants}</div>
                <div className="stat-change">活跃商家</div>
              </div>

              <div className="stat-card">
                <div className="stat-label">评论提交</div>
                <div className="stat-value">{stats.totalSubmissions}</div>
                <div className="stat-change">总提交数</div>
              </div>

              <div className="stat-card">
                <div className="stat-label">待处理</div>
                <div className="stat-value" style={{ color: stats.pendingSubmissions > 0 ? 'var(--warning)' : 'inherit' }}>
                  {stats.pendingSubmissions}
                </div>
                <div className="stat-change">待审核评论</div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">快速操作</h3>
              </div>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <Link to="/admin/users" className="btn btn-primary">
                  <Users size={18} />
                  管理用户
                </Link>
                <Link to="/admin/real-comments" className="btn btn-secondary">
                  <FileText size={18} />
                  查看评论提交
                </Link>
                {stats.pendingSubmissions > 0 && (
                  <Link to="/admin/real-comments?status=pending" className="btn btn-success">
                    <Clock size={18} />
                    {stats.pendingSubmissions} 条待处理
                  </Link>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <BarChart3 size={64} />
            <h3>加载失败</h3>
            <p>无法获取统计数据</p>
          </div>
        )}
      </main>
    </div>
  );
}
