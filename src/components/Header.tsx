import React, { useState, useRef, useEffect } from 'react';
import { Menu, Search, Notifications, Person, Translate, Logout, Settings, KeyboardArrowDown, PhotoCamera, Lock, DarkMode, LightMode } from '@mui/icons-material';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  title: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onMenuClick: () => void;
}

export function Header({ title, activeTab, setActiveTab, onMenuClick }: HeaderProps) {
  const { t, language, setLanguage } = useLanguage();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
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
                <Person sx={{ fontSize: 18 }} />
                <span>{t('nav.profile')}</span>
              </button>

              <button className="hdr-dropdown-item" onClick={() => { setDropdownOpen(false); }}>
                <PhotoCamera sx={{ fontSize: 18 }} />
                <span>{t('nav.changeAvatar')}</span>
              </button>

              <button className="hdr-dropdown-item" onClick={() => { setDropdownOpen(false); }}>
                <Lock sx={{ fontSize: 18 }} />
                <span>{t('nav.changePassword')}</span>
              </button>

              <div className="hdr-dropdown-divider" />

              {/* Theme */}
              <div className="hdr-dropdown-label">{t('nav.theme')}</div>
              <div className="hdr-dropdown-theme">
                <button
                  className={`hdr-theme-btn ${theme === 'light' ? 'active' : ''}`}
                  onClick={() => setTheme('light')}
                >
                  <LightMode sx={{ fontSize: 16 }} />
                  <span>{t('nav.light')}</span>
                </button>
                <button
                  className={`hdr-theme-btn ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => setTheme('dark')}
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
        }

        .hdr-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .hdr-title {
          font-family: var(--font-headline); font-size: 16px; font-weight: 700;
          color: var(--color-text-primary); margin: 0; white-space: nowrap;
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
        }
        .hdr-lang-btn:hover { background: var(--color-border); }

        .hdr-menu-btn {
          display: none; padding: 8px; border: none; background: transparent;
          color: var(--color-text-muted); cursor: pointer; border-radius: 8px;
        }
        .hdr-menu-btn:hover { background: var(--color-surface); }
        @media (max-width: 1024px) { .hdr-menu-btn { display: flex; } }

        .hdr-right { display: flex; align-items: center; gap: 8px; }

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
      `}</style>
    </header>
  );
}
