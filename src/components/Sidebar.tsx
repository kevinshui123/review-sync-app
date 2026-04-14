import React, { useState } from 'react';
import {
  Dashboard,
  PushPin,
  RateReview,
  Edit,
  CalendarToday,
  History,
  BarChart,
  Public,
  Settings,
  Help,
  Bolt,
  AutoAwesome,
  Logout,
  Map,
  Description,
  LocalOffer,
  Star,
  Article,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import { useLanguage } from '../contexts/LanguageContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

interface NavItem {
  id: string;
  labelKey: string;
  icon: React.ElementType;
  badge?: string;
}

interface SubNavItem {
  id: string;
  labelKey: string;
  icon: React.ElementType;
  parent: string;
  badge?: string;
}

const MAIN_NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', labelKey: 'nav.dashboard', icon: Dashboard },
  { id: 'listings', labelKey: 'nav.listings', icon: PushPin },
  { id: 'reviews', labelKey: 'nav.reviews', icon: RateReview },
  { id: 'bulk-edits', labelKey: 'nav.bulkEdits', icon: Edit },
  { id: 'edits-log', labelKey: 'nav.editsLog', icon: History },
  { id: 'publishing', labelKey: 'nav.publishing', icon: CalendarToday },
  { id: 'reports', labelKey: 'nav.reports', icon: BarChart },
];

const SEO_LOCAL_ITEMS: SubNavItem[] = [
  { id: 'seo-grid', labelKey: 'seo.localSearchGrid', icon: Map, parent: 'seo' },
  { id: 'seo-citations', labelKey: 'seo.localCitations', icon: Description, parent: 'seo', badge: 'BETA' },
  { id: 'seo-optimization', labelKey: 'seo.optimization', icon: LocalOffer, parent: 'seo' },
];

const SEO_TOP_ITEMS: NavItem[] = [
  { id: 'seo', labelKey: 'nav.localSeo', icon: Public },
  { id: 'seo-real-comment', labelKey: 'nav.realComment', icon: Star, badge: 'NEW' },
  { id: 'seo-rednote-seo', labelKey: 'nav.rednoteSeo', icon: Article },
];

export function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen }: SidebarProps) {
  const { t } = useLanguage();
  const [seoLocalExpanded, setSeoLocalExpanded] = useState(true);

  const isSeoLocal = ['seo-grid', 'seo-citations', 'seo-optimization'].includes(activeTab);
  const isSeoRealComment = activeTab === 'seo-real-comment';
  const isSeoRednote = activeTab === 'seo-rednote-seo';
  const isSeoTopActive = activeTab === 'seo' || isSeoLocal || isSeoRealComment || isSeoRednote;

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setIsOpen(false);
  };

  const handleSeoLocalClick = () => {
    if (seoLocalExpanded) {
      setSeoLocalExpanded(false);
    } else {
      setSeoLocalExpanded(true);
      if (!isSeoLocal) {
        setActiveTab('seo-grid');
      }
    }
  };

  const navItem = (id: string, labelKey: string, Icon: React.ElementType, isActive: boolean, badge?: string) => {
    return (
      <button
        key={id}
        onClick={() => handleNavClick(id)}
        className={`nav-item ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`}
      >
        <Icon sx={{ fontSize: 20 }} />
        <span className="nav-label">{t(labelKey)}</span>
        {badge && (
          <span className={`nav-badge ${isActive ? 'nav-badge-active' : 'nav-badge-inactive'}`}>
            {badge}
          </span>
        )}
      </button>
    );
  };

  const subNavItem = (item: SubNavItem, isActive: boolean) => {
    const Icon = item.icon;
    return (
      <button
        key={item.id}
        onClick={() => handleNavClick(item.id)}
        className={`nav-sub-item ${isActive ? 'nav-sub-item-active' : 'nav-sub-item-inactive'}`}
      >
        <Icon sx={{ fontSize: 18 }} />
        <span className="nav-sub-label">{t(item.labelKey)}</span>
        {item.badge && (
          <span className={`nav-badge ${isActive ? 'nav-badge-active' : 'nav-badge-inactive'}`}>
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  const sidebarContent = (
    <div className="sidebar-content">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-icon">
          <AutoAwesome sx={{ fontSize: 22, color: '#fff' }} />
        </div>
        <div className="brand-text">
          <h1 className="brand-name">PinKernel</h1>
          <p className="brand-tagline">Local SEO Platform</p>
        </div>
      </div>

      {/* Credits */}
      <div className="sidebar-credits">
        <div className="credits-inner">
          <span className="credits-label">100 Credits</span>
          <Bolt sx={{ fontSize: 16, color: '#0ea5e9', fontVariationSettings: "'FILL' 1" }} />
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="sidebar-nav">
        {MAIN_NAV_ITEMS.map(({ id, labelKey, icon }) =>
          navItem(id, labelKey, icon, activeTab === id)
        )}

        {/* SEO Section */}
        <div className="sidebar-section">
          <div className="sidebar-section-items">
            {SEO_TOP_ITEMS.map(({ id, labelKey, icon, badge }) => {
              const Icon = icon;
              const isActive = activeTab === id;
              const isLocalSeo = id === 'seo';
              return (
                <div key={id}>
                  {isLocalSeo ? (
                    <>
                      <button
                        onClick={handleSeoLocalClick}
                        className={`nav-item ${isSeoTopActive && seoLocalExpanded ? 'nav-item-active' : isSeoTopActive ? 'nav-item-active-muted' : 'nav-item-inactive'}`}
                      >
                        <Icon sx={{ fontSize: 20 }} />
                        <span className="nav-label">{t(labelKey)}</span>
                        {seoLocalExpanded ? (
                          <ExpandLess sx={{ fontSize: 18 }} />
                        ) : (
                          <ExpandMore sx={{ fontSize: 18 }} />
                        )}
                      </button>

                      {seoLocalExpanded && (
                        <div className="nav-submenu">
                          {SEO_LOCAL_ITEMS.map((item) => {
                            const SubIcon = item.icon;
                            const isSubActive = activeTab === item.id;
                            return (
                              <button
                                key={item.id}
                                onClick={() => handleNavClick(item.id)}
                                className={`nav-sub-item ${isSubActive ? 'nav-sub-item-active' : 'nav-sub-item-inactive'}`}
                              >
                                <SubIcon sx={{ fontSize: 18 }} />
                                <span className="nav-sub-label">{t(item.labelKey)}</span>
                                {item.badge && (
                                  <span className={`nav-badge ${isSubActive ? 'nav-badge-active' : 'nav-badge-inactive'}`}>
                                    {item.badge}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => handleNavClick(id)}
                      className={`nav-item ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`}
                    >
                      <Icon sx={{ fontSize: 20 }} />
                      <span className="nav-label">{t(labelKey)}</span>
                      {badge && (
                        <span className={`nav-badge ${isActive ? 'nav-badge-active' : 'nav-badge-inactive'}`}>
                          {badge}
                        </span>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Bottom Links */}
      <div className="sidebar-bottom">
        <div className="sidebar-divider" />
        {navItem('settings', 'nav.settings', Settings, activeTab === 'settings')}
        {navItem('help', 'nav.help', Help, activeTab === 'help')}
        <button className="nav-item nav-item-inactive">
          <Logout sx={{ fontSize: 20 }} />
          <span className="nav-label">{t('nav.signOut')}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        .sidebar-content {
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 0;
        }

        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px 16px;
          margin-bottom: 8px;
        }

        .brand-icon {
          width: 40px;
          height: 40px;
          background: var(--color-primary);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .brand-text {
          min-width: 0;
        }

        .brand-name {
          font-family: var(--font-headline);
          font-size: 18px;
          font-weight: 800;
          color: var(--color-text-primary);
          letter-spacing: -0.02em;
          margin: 0;
          line-height: 1.2;
        }

        .brand-tagline {
          font-size: 11px;
          font-weight: 500;
          color: var(--color-text-muted);
          letter-spacing: 0.02em;
          text-transform: uppercase;
          margin: 0;
        }

        .sidebar-credits {
          margin: 0 16px 16px;
        }

        .credits-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          background: var(--color-accent-muted);
          border-radius: 8px;
        }

        .credits-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--color-accent);
        }

        .sidebar-nav {
          flex: 1;
          overflow-y: auto;
          padding: 0 8px;
        }

        .sidebar-section {
          margin-top: 4px;
        }

        .sidebar-section-items {
          display: flex;
          flex-direction: column;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 10px 12px;
          border-radius: 8px;
          font-family: var(--font-sans);
          font-size: 14px;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: left;
          color: inherit;
        }

        .nav-item-active {
          background: var(--color-primary);
          color: var(--color-on-primary);
          font-weight: 600;
        }

        .nav-item-active:hover {
          background: var(--color-primary-hover);
        }

        .nav-item-active-muted {
          background: var(--color-primary-muted);
          color: var(--color-primary);
          font-weight: 600;
        }

        .nav-item-inactive {
          color: var(--color-text-secondary);
        }

        .nav-item-inactive:hover {
          background: var(--color-surface);
          color: var(--color-text-primary);
        }

        .nav-label {
          flex: 1;
        }

        .nav-badge {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 999px;
          letter-spacing: 0.02em;
        }

        .nav-badge-active {
          background: rgba(255, 255, 255, 0.2);
          color: inherit;
        }

        .nav-badge-inactive {
          background: var(--color-warning);
          color: white;
        }

        .nav-submenu {
          padding-left: 16px;
          margin-top: 2px;
        }

        .nav-sub-item {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 8px 12px;
          border-radius: 6px;
          font-family: var(--font-sans);
          font-size: 13px;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: left;
          color: inherit;
        }

        .nav-sub-item-active {
          background: var(--color-primary-muted);
          color: var(--color-primary);
          font-weight: 600;
        }

        .nav-sub-item-inactive {
          color: var(--color-text-muted);
        }

        .nav-sub-item-inactive:hover {
          background: var(--color-surface);
          color: var(--color-text-primary);
        }

        .nav-sub-label {
          flex: 1;
        }

        .sidebar-bottom {
          padding: 8px;
          margin-top: auto;
        }

        .sidebar-divider {
          height: 1px;
          background: var(--color-divider);
          margin: 8px;
        }
      `}</style>

      {/* Desktop Sidebar */}
      <aside className="sidebar-desktop">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <>
          <div
            onClick={() => setIsOpen(false)}
            className="sidebar-overlay"
          />
          <aside className="sidebar-mobile">
            {sidebarContent}
          </aside>
        </>
      )}

      <style>{`
        .sidebar-desktop {
          display: none;
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          width: 240px;
          background: var(--color-surface-raised);
          border-right: 1px solid var(--color-border);
          z-index: 50;
        }

        @media (min-width: 1024px) {
          .sidebar-desktop {
            display: flex;
          }
        }

        .sidebar-mobile {
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          width: 280px;
          background: var(--color-surface-raised);
          border-right: 1px solid var(--color-border);
          z-index: 50;
          box-shadow: var(--shadow-lg);
          animation: slideInRight 0.2s ease-out;
        }

        .sidebar-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          z-index: 49;
          animation: fadeIn 0.2s ease-out;
        }

        @media (min-width: 1024px) {
          .sidebar-overlay,
          .sidebar-mobile {
            display: none;
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
}
