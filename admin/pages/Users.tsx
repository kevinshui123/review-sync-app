import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  ChevronRight,
  Trash2,
  Eye,
  BarChart3,
  MessageSquare,
  MapPin,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import { apiGet, apiDelete } from '../utils/api';

interface Tenant {
  id: string;
  name: string;
  locationCount: number;
  taskCount: number;
  isConfigured: boolean;
}

interface User {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  createdAt: string;
  tenants: Tenant[];
}

export default function UsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await apiGet('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('确定要删除这个用户吗？此操作不可撤销。')) {
      return;
    }

    setDeleting(userId);
    try {
      const res = await apiDelete(`/api/admin/users/${userId}`);
      if (res.ok) {
        setUsers(users.filter(u => u.id !== userId));
        if (selectedUser?.id === userId) {
          setSelectedUser(null);
        }
      } else {
        const data = await res.json();
        alert(data.error || '删除失败');
      }
    } catch (err) {
      console.error('Failed to delete user:', err);
      alert('删除失败');
    } finally {
      setDeleting(null);
    }
  };

  const filteredUsers = users.filter(user => {
    const term = searchTerm.toLowerCase();
    return (
      user.email.toLowerCase().includes(term) ||
      (user.name && user.name.toLowerCase().includes(term))
    );
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  if (selectedUser) {
    return (
      <UserDetail
        user={selectedUser}
        onBack={() => setSelectedUser(null)}
      />
    );
  }

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <AdminSidebar active="users" />

      {/* Content */}
      <main className="admin-content">
        <div className="page-header">
          <h1 className="page-title">用户管理</h1>
          <p className="page-subtitle">管理所有注册用户和他们的数据</p>
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
              placeholder="搜索用户邮箱或名称..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '48px' }}
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="card">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p className="text-muted">加载中...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="empty-state">
              <Users size={64} />
              <h3>没有找到用户</h3>
              <p>{searchTerm ? '尝试其他搜索词' : '暂无注册用户'}</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>用户</th>
                    <th>邮箱</th>
                    <th>租户</th>
                    <th>门店数</th>
                    <th>任务数</th>
                    <th>状态</th>
                    <th>注册时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, var(--primary), #7c3aed)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: '600',
                            }}
                          >
                            {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold">{user.name || '-'}</span>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        {user.tenants.length > 0 ? (
                          <span className="badge badge-info">{user.tenants[0].name}</span>
                        ) : (
                          <span className="text-muted">无</span>
                        )}
                      </td>
                      <td>
                        {user.tenants.reduce((sum, t) => sum + t.locationCount, 0)}
                      </td>
                      <td>
                        {user.tenants.reduce((sum, t) => sum + t.taskCount, 0)}
                      </td>
                      <td>
                        {user.tenants.some(t => t.isConfigured) ? (
                          <span className="badge badge-success">已配置</span>
                        ) : (
                          <span className="badge badge-warning">未配置</span>
                        )}
                      </td>
                      <td className="text-muted">{formatDate(user.createdAt)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="btn btn-secondary btn-sm"
                          >
                            <Eye size={14} />
                            查看
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="btn btn-danger btn-sm"
                            disabled={deleting === user.id}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-sm text-muted mt-4">
          共 {filteredUsers.length} 个用户
        </p>
      </main>
    </div>
  );
}

// User Detail Component
function UserDetail({ user, onBack }: { user: User; onBack: () => void }) {
  const totalLocations = user.tenants.reduce((sum, t) => sum + t.locationCount, 0);
  const totalTasks = user.tenants.reduce((sum, t) => sum + t.taskCount, 0);

  return (
    <div className="admin-layout">
      <AdminSidebar active="users" />

      <main className="admin-content">
        <button onClick={onBack} className="btn btn-secondary" style={{ marginBottom: '24px' }}>
          <ArrowLeft size={18} />
          返回用户列表
        </button>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px', marginBottom: '32px' }}>
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary), #7c3aed)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '32px',
                fontWeight: '600',
              }}
            >
              {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
                {user.name || '未命名用户'}
              </h2>
              <p className="text-muted">{user.email}</p>
              <p className="text-sm text-muted mt-4">
                注册于 {new Date(user.createdAt).toLocaleDateString('zh-CN')}
              </p>
            </div>
          </div>

          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="stat-card">
              <div className="stat-label">租户数</div>
              <div className="stat-value">{user.tenants.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">门店总数</div>
              <div className="stat-value">{totalLocations}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">任务总数</div>
              <div className="stat-value">{totalTasks}</div>
            </div>
          </div>

          <h3 style={{ fontSize: '18px', fontWeight: '700', marginTop: '32px', marginBottom: '16px' }}>
            租户详情
          </h3>

          {user.tenants.length === 0 ? (
            <div className="empty-state">
              <MapPin size={48} />
              <p>暂无租户数据</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>租户名称</th>
                    <th>门店数</th>
                    <th>任务数</th>
                    <th>配置状态</th>
                  </tr>
                </thead>
                <tbody>
                  {user.tenants.map((tenant) => (
                    <tr key={tenant.id}>
                      <td className="font-semibold">{tenant.name}</td>
                      <td>{tenant.locationCount}</td>
                      <td>{tenant.taskCount}</td>
                      <td>
                        {tenant.isConfigured ? (
                          <span className="badge badge-success">已配置</span>
                        ) : (
                          <span className="badge badge-warning">未配置</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
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
          <Users size={20} />
          用户管理
        </Link>
        <Link to="/admin/real-comments" className={`sidebar-nav-item ${active === 'comments' ? 'active' : ''}`}>
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
  );
}
