import React, { useState, useRef, useEffect } from 'react';
import { Menu, Search, Notifications, Person, Translate, Logout, Settings, KeyboardArrowDown, PhotoCamera, Lock, DarkMode, LightMode, CameraAlt } from '@mui/icons-material';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { apiPost } from '../utils/api';

interface HeaderProps {
  title: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onMenuClick: () => void;
  theme?: 'light' | 'dark';
  onThemeChange?: (theme: 'light' | 'dark') => void;
}

export function Header({ title, activeTab, setActiveTab, onMenuClick, theme = 'light', onThemeChange }: HeaderProps) {
  const { t, language, setLanguage } = useLanguage();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  return (
    <header className="hdr">
      {/* Left */}
      <div className="hdr-left">
        <button onClick={toggleLanguage} className="hdr-lang-btn">
          <Translate sx={{ fontSize: 16 }} />
          <span>{language === 'en' ? '中文' : 'EN'}</span>
        </button>
        <button className="hdr-menu-btn lg-hidden" onClick={onMenuClick}>
          <Menu sx={{ fontSize: 20 }} />
        </button>
        <h1 className="hdr-title">{title}</h1>
        {activeTab === 'seo' && (
          <div className="hdr-breadcrumb">
            <span>/</span>
            <span className="hdr-breadcrumb-active">SEO Management</span>
          </div>
        )}
      </div>

      {/* Right */}
      <div className="hdr-right">
        {/* Search */}
        <div className="hdr-search">
          <Search sx={{ fontSize: 16, color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            placeholder={t('header.search')}
            className="hdr-search-input"
          />
        </div>

        {/* Notifications */}
        <button className="hdr-icon-btn">
          <Notifications sx={{ fontSize: 20 }} />
          <span className="hdr-notif-dot" />
        </button>

        {/* User Dropdown */}
        <div className="hdr-user" ref={dropdownRef}>
          <button
            className="hdr-user-btn"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div className="hdr-user-info">
              <span className="hdr-user-name">{user?.name || user?.email || 'User'}</span>
              <span className="hdr-user-role">User</span>
            </div>
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name || 'User'} className="hdr-avatar" />
            ) : (
              <div className="hdr-avatar hdr-avatar-initials">
                {(user?.name || user?.email || 'U')[0].toUpperCase()}
              </div>
            )}
            <KeyboardArrowDown sx={{ fontSize: 18, color: 'var(--color-text-muted)', className: `hdr-arrow ${dropdownOpen ? 'open' : ''}` }} />
          </button>

          {dropdownOpen && (
            <div className="hdr-dropdown">
              {/* User Info Header */}
              <div className="hdr-dropdown-user">
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="hdr-dropdown-avatar" />
                ) : (
                  <div className="hdr-dropdown-avatar hdr-dropdown-avatar-initials">
                    {(user?.name || user?.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="hdr-dropdown-name">{user?.name || user?.email || 'User'}</div>
                  <div className="hdr-dropdown-email">{user?.email || ''}</div>
                </div>
              </div>

              <div className="hdr-dropdown-divider" />

              {/* Menu Items */}
              <button className="hdr-dropdown-item" onClick={() => { setActiveTab('settings'); setDropdownOpen(false); }}>
                <Settings sx={{ fontSize: 18 }} />
                <span>{t('nav.settings')}</span>
              </button>

              <button className="hdr-dropdown-item" onClick={() => { setShowAvatarModal(true); setDropdownOpen(false); }}>
                <PhotoCamera sx={{ fontSize: 18 }} />
                <span>{t('nav.changeAvatar')}</span>
              </button>

              <button className="hdr-dropdown-item" onClick={() => { setShowPasswordModal(true); setDropdownOpen(false); }}>
                <Lock sx={{ fontSize: 18 }} />
                <span>{t('nav.changePassword')}</span>
              </button>

              <div className="hdr-dropdown-divider" />

              {/* Theme */}
              <div className="hdr-dropdown-label">{t('nav.theme')}</div>
              <div className="hdr-dropdown-theme">
                <button
                  className={`hdr-theme-btn ${theme === 'light' ? 'active' : ''}`}
                  onClick={() => onThemeChange?.('light')}
                >
                  <LightMode sx={{ fontSize: 16 }} />
                  <span>{t('nav.light')}</span>
                </button>
                <button
                  className={`hdr-theme-btn ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => onThemeChange?.('dark')}
                >
                  <DarkMode sx={{ fontSize: 16 }} />
                  <span>{t('nav.dark')}</span>
                </button>
              </div>

              <div className="hdr-dropdown-divider" />

              {/* Sign Out */}
              <button className="hdr-dropdown-item hdr-dropdown-item-danger" onClick={logout}>
                <Logout sx={{ fontSize: 18 }} />
                <span>{t('nav.signOut')}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .hdr {
          position: sticky; top: 0; z-index: 40; background: var(--color-surface-raised);
          border-bottom: 1px solid var(--color-border); height: 60px;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 20px; gap: 12px;
          flex-shrink: 0;
        }

        .hdr-left { display: flex; align-items: center; gap: 12px; min-width: 0; flex-shrink: 1; }
        .hdr-title {
          font-family: var(--font-headline); font-size: 16px; font-weight: 700;
          color: var(--color-text-primary); margin: 0; white-space: nowrap;
          flex-shrink: 0;
        }
        .hdr-breadcrumb {
          display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--color-text-muted);
        }
        .hdr-breadcrumb-active { color: var(--color-primary); font-weight: 600; }

        .hdr-lang-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 6px 12px; background: var(--color-primary-muted); color: var(--color-primary);
          border: none; border-radius: 6px; font-size: 12px; font-weight: 700;
          cursor: pointer; white-space: nowrap; transition: all 0.15s ease;
          flex-shrink: 0;
        }
        .hdr-lang-btn:hover { background: var(--color-border); }

        .hdr-menu-btn {
          display: flex; padding: 8px; border: none; background: transparent;
          color: var(--color-text-muted); cursor: pointer; border-radius: 8px;
          flex-shrink: 0;
        }
        .hdr-menu-btn:hover { background: var(--color-surface); }
        @media (min-width: 1024px) { .hdr-menu-btn { display: none; } }

        .hdr-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

        .hdr-search {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 12px; background: var(--color-surface); border: 1px solid var(--color-border);
          border-radius: 8px; min-width: 180px; max-width: 280px;
        }
        @media (max-width: 640px) { .hdr-search { display: none; } }

        .hdr-search-input {
          flex: 1; border: none; background: transparent; font-size: 13px;
          color: var(--color-text-primary); outline: none;
        }
        .hdr-search-input::placeholder { color: var(--color-text-muted); }

        .hdr-icon-btn {
          position: relative; width: 36px; height: 36px; border: none;
          background: transparent; color: var(--color-text-muted); cursor: pointer;
          border-radius: 8px; display: flex; align-items: center; justify-content: center;
          transition: all 0.15s ease;
        }
        .hdr-icon-btn:hover { background: var(--color-surface); color: var(--color-text-primary); }

        .hdr-notif-dot {
          position: absolute; top: 6px; right: 6px; width: 8px; height: 8px;
          background: var(--color-error); border-radius: 999px;
        }

        .hdr-user { position: relative; }

        .hdr-user-btn {
          display: flex; align-items: center; gap: 10px;
          padding: 6px 10px 6px 6px; border: none; background: transparent;
          cursor: pointer; border-radius: 8px; transition: all 0.15s ease;
        }
        .hdr-user-btn:hover { background: var(--color-surface); }

        .hdr-user-info { display: none; text-align: right; }
        @media (min-width: 768px) { .hdr-user-info { display: block; } }

        .hdr-user-name {
          display: block; font-size: 13px; font-weight: 600;
          color: var(--color-text-primary); max-width: 120px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .hdr-user-role { display: block; font-size: 11px; color: var(--color-text-muted); }

        .hdr-avatar {
          width: 36px; height: 36px; border-radius: 999px; object-fit: cover; flex-shrink: 0;
        }
        .hdr-avatar-initials {
          background: var(--color-primary); color: white;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 700;
        }

        .hdr-arrow { transition: transform 0.2s ease; }
        .hdr-arrow.open { transform: rotate(180deg); }

        .hdr-dropdown {
          position: absolute; top: calc(100% + 8px); right: 0;
          width: 260px; background: var(--color-surface-raised);
          border: 1px solid var(--color-border); border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12); overflow: hidden;
          animation: dropdownIn 0.15s ease;
          z-index: 100;
        }

        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .hdr-dropdown-user {
          display: flex; align-items: center; gap: 12px;
          padding: 16px;
        }
        .hdr-dropdown-avatar {
          width: 44px; height: 44px; border-radius: 999px; object-fit: cover; flex-shrink: 0;
        }
        .hdr-dropdown-avatar-initials {
          background: var(--color-primary); color: white;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; font-weight: 700;
        }
        .hdr-dropdown-name {
          font-size: 14px; font-weight: 600; color: var(--color-text-primary);
        }
        .hdr-dropdown-email {
          font-size: 12px; color: var(--color-text-muted);
        }

        .hdr-dropdown-divider { height: 1px; background: var(--color-divider); }

        .hdr-dropdown-label {
          padding: 8px 16px 4px; font-size: 10px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-text-muted);
        }

        .hdr-dropdown-theme {
          display: flex; gap: 4px; padding: 4px 12px 8px;
        }
        .hdr-theme-btn {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
          padding: 6px; font-size: 12px; font-weight: 500; border: 1px solid var(--color-border);
          border-radius: 6px; background: transparent; color: var(--color-text-muted);
          cursor: pointer; transition: all 0.15s ease;
        }
        .hdr-theme-btn:hover { border-color: var(--color-border-strong); color: var(--color-text-primary); }
        .hdr-theme-btn.active { background: var(--color-primary); color: white; border-color: var(--color-primary); }

        .hdr-dropdown-item {
          display: flex; align-items: center; gap: 10px; width: 100%;
          padding: 10px 16px; font-size: 14px; font-weight: 500;
          border: none; background: transparent; color: var(--color-text-primary);
          cursor: pointer; text-align: left; transition: all 0.15s ease;
        }
        .hdr-dropdown-item:hover { background: var(--color-surface); }

        .hdr-dropdown-item-danger { color: var(--color-error); }
        .hdr-dropdown-item-danger:hover { background: var(--color-error-bg); }

        /* Modal Styles */
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000; animation: fadeIn 0.15s ease;
        }
        .modal-content {
          background: var(--color-surface-raised); border-radius: 16px;
          padding: 24px; width: 90%; max-width: 400px; box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        }
        .modal-header {
          display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;
        }
        .modal-title {
          font-family: var(--font-headline); font-size: 18px; font-weight: 700;
          color: var(--color-text-primary); margin: 0;
        }
        .modal-close {
          width: 32px; height: 32px; border: none; background: var(--color-surface);
          border-radius: 8px; cursor: pointer; display: flex; align-items: center;
          justify-content: center; color: var(--color-text-muted); transition: all 0.15s ease;
        }
        .modal-close:hover { background: var(--color-border); color: var(--color-text-primary); }
        .modal-body { margin-bottom: 20px; }
        .modal-footer { display: flex; gap: 8px; justify-content: flex-end; }

        /* Avatar Upload */
        .avatar-upload-area {
          border: 2px dashed var(--color-border); border-radius: 12px;
          padding: 32px; text-align: center; cursor: pointer; transition: all 0.15s ease;
        }
        .avatar-upload-area:hover { border-color: var(--color-accent); background: var(--color-surface); }
        .avatar-upload-area.dragover { border-color: var(--color-accent); background: var(--color-accent-muted); }
        .avatar-preview {
          width: 100px; height: 100px; border-radius: 999px; margin: 0 auto 16px;
          object-fit: cover; background: var(--color-surface);
        }
        .avatar-preview-initials {
          width: 100px; height: 100px; border-radius: 999px; margin: 0 auto 16px;
          background: var(--color-primary); color: white;
          display: flex; align-items: center; justify-content: center;
          font-size: 32px; font-weight: 700;
        }
        .avatar-upload-text { font-size: 14px; color: var(--color-text-secondary); margin-bottom: 8px; }
        .avatar-upload-hint { font-size: 12px; color: var(--color-text-muted); }

        /* Dark Mode Styles */
        [data-theme="dark"] {
          --color-surface: #0f172a;
          --color-surface-raised: #1e293b;
          --color-surface-sunken: #020617;
          --color-primary: #3b82f6;
          --color-primary-hover: #2563eb;
          --color-primary-muted: #1e3a5f;
          --color-on-primary: #ffffff;
          --color-accent: #38bdf8;
          --color-accent-hover: #0ea5e9;
          --color-accent-muted: #0c2d4a;
          --color-on-accent: #0f172a;
          --color-text-primary: #f1f5f9;
          --color-text-secondary: #94a3b8;
          --color-text-muted: #64748b;
          --color-text-disabled: #475569;
          --color-border: #334155;
          --color-border-strong: #475569;
          --color-divider: #1e293b;
          --color-success: #22c55e;
          --color-success-bg: #052e16;
          --color-success-text: #4ade80;
          --color-warning: #f59e0b;
          --color-warning-bg: #1c1408;
          --color-warning-text: #fbbf24;
          --color-error: #ef4444;
          --color-error-bg: #1c0a0a;
          --color-error-text: #fca5a5;
          --color-info: #38bdf8;
          --color-info-bg: #0c2d4a;
          --color-info-text: #7dd3fc;
        }
      `}</style>

      {/* Change Avatar Modal */}
      {showAvatarModal && (
        <ChangeAvatarModal
          user={user}
          onClose={() => setShowAvatarModal(false)}
          isZh={language === 'zh'}
        />
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <ChangePasswordModal
          onClose={() => setShowPasswordModal(false)}
          isZh={language === 'zh'}
        />
      )}
    </header>
  );
}

// Change Avatar Modal Component
function ChangeAvatarModal({ user, onClose, isZh }: { user: any; onClose: () => void; isZh: boolean }) {
  const { user: currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: isZh ? '请选择图片文件' : 'Please select an image file' });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: isZh ? '图片大小不能超过5MB' : 'Image must be less than 5MB' });
        return;
      }
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await apiPost('/api/auth/avatar', formData);
      if (res.ok) {
        setMessage({ type: 'success', text: isZh ? '头像更新成功！' : 'Avatar updated successfully!' });
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || (isZh ? '上传失败' : 'Upload failed') });
      }
    } catch {
      setMessage({ type: 'error', text: isZh ? '上传失败' : 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{isZh ? '更换头像' : 'Change Avatar'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {message && (
            <div className={`alert ${message.type}`} style={{ marginBottom: 16 }}>
              {message.text}
            </div>
          )}
          <div
            className="avatar-upload-area"
            onClick={() => fileInputRef.current?.click()}
          >
            {preview ? (
              <img src={preview} alt="Preview" className="avatar-preview" />
            ) : user?.avatar ? (
              <img src={user.avatar} alt="Current" className="avatar-preview" />
            ) : (
              <div className="avatar-preview-initials">
                {(user?.name || user?.email || 'U')[0].toUpperCase()}
              </div>
            )}
            <p className="avatar-upload-text">
              {preview ? (isZh ? '点击更换图片' : 'Click to change image') : (isZh ? '点击上传图片' : 'Click to upload image')}
            </p>
            <p className="avatar-upload-hint">{isZh ? '支持 JPG、PNG，最大 5MB' : 'Supports JPG, PNG, max 5MB'}</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>{isZh ? '取消' : 'Cancel'}</button>
          <button
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={!preview || uploading}
          >
            {uploading ? (isZh ? '上传中...' : 'Uploading...') : (isZh ? '保存' : 'Save')}
          </button>
        </div>
      </div>
    </div>
  );
}

// Change Password Modal Component
function ChangePasswordModal({ onClose, isZh }: { onClose: () => void; isZh: boolean }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage({ type: 'error', text: isZh ? '请填写所有字段' : 'Please fill in all fields' });
      return;
    }

    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: isZh ? '新密码至少8位' : 'Password must be at least 8 characters' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: isZh ? '两次密码不一致' : 'Passwords do not match' });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const res = await apiPost('/api/auth/change-password', {
        currentPassword,
        newPassword,
      });
      if (res.ok) {
        setMessage({ type: 'success', text: isZh ? '密码修改成功！' : 'Password changed successfully!' });
        setTimeout(onClose, 1500);
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || (isZh ? '修改失败' : 'Change failed') });
      }
    } catch {
      setMessage({ type: 'error', text: isZh ? '修改失败' : 'Change failed' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{isZh ? '修改密码' : 'Change Password'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {message && (
              <div className={`alert ${message.type}`} style={{ marginBottom: 16 }}>
                {message.text}
              </div>
            )}
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">{isZh ? '当前密码' : 'Current Password'}</label>
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">{isZh ? '新密码' : 'New Password'}</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="input"
                placeholder={isZh ? '至少8位' : 'Min 8 characters'}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{isZh ? '确认新密码' : 'Confirm New Password'}</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>{isZh ? '取消' : 'Cancel'}</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? (isZh ? '保存中...' : 'Saving...') : (isZh ? '保存' : 'Save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
