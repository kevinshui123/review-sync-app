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
  AccountCircle,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'motion/react';
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
  { id: 'seo', labelKey: 'nav.seo', icon: Public },
  { id: 'seo-real-comment', labelKey: 'seo.section.realComment', icon: Star, badge: 'NEW' },
  { id: 'seo-rednote-seo', labelKey: 'seo.section.rednoteSeo', icon: Article },
];

export function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen }: SidebarProps) {
  const { t } = useLanguage();
  const [seoLocalExpanded, setSeoLocalExpanded] = useState(true);

  // Check which SEO sub-section is active
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
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
          isActive
            ? 'bg-primary text-white font-semibold shadow-sm'
            : 'text-slate-500 hover:bg-slate-100 hover:text-primary'
        }`}
      >
        <Icon className="w-5 h-5" />
        <span className="text-sm font-medium flex-1">{t(labelKey)}</span>
        {badge && (
          <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-full ${
            isActive ? 'bg-white/20 text-white' : 'bg-orange-500 text-white'
          }`}>
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
        className={`w-full flex items-center gap-3 px-4 py-2.5 pl-12 rounded-lg transition-all duration-200 text-xs ${
          isActive
            ? 'bg-primary/10 text-primary font-semibold'
            : 'text-slate-500 hover:bg-slate-50 hover:text-primary'
        }`}
      >
        <Icon className="w-4 h-4" />
        <span className="text-sm font-medium flex-1">{t(item.labelKey)}</span>
        {item.badge && (
          <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-full ${
            isActive ? 'bg-primary/20 text-primary' : 'bg-orange-500 text-white'
          }`}>
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  const sidebarContent = (
    <div className="h-full flex flex-col">
      {/* Brand */}
      <div className="px-4 py-6 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-md">
            <AutoAwesome className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-blue-900 font-headline tracking-tight">
              PinKernel SEO
            </h1>
            <p className="text-[10px] text-slate-500 font-medium tracking-widest uppercase mt-0.5">
              Local Search Intelligence
            </p>
          </div>
        </div>
      </div>

      {/* Credits display */}
      <div className="px-4 mb-4">
        <div className="bg-primary-fixed/30 rounded-full px-4 py-2 flex items-center justify-between">
          <span className="text-[10px] font-bold text-primary">100 Credits Remaining</span>
          <Bolt className="text-primary w-4 h-4" style={{ fontVariationSettings: "'FILL' 1" }} />
        </div>
      </div>

      {/* Main navigation */}
      <nav className="flex-1 space-y-1 px-2 overflow-y-auto">
        {/* Main nav items */}
        {MAIN_NAV_ITEMS.map(({ id, labelKey, icon }) =>
          navItem(id, labelKey, icon, activeTab === id)
        )}

        {/* SEO Section - two-level nested menu */}
        <div className="pt-2">
          {/* SEO top-level items: Local SEO (expandable), Real Comment, Rednote SEO */}
          <div className="space-y-0.5">
            {SEO_TOP_ITEMS.map(({ id, labelKey, icon, badge }) => {
              const Icon = icon;
              const isActive = activeTab === id;
              const isLocalSeo = id === 'seo';
              return (
                <div key={id}>
                  {isLocalSeo ? (
                    <>
                      {/* Local SEO - expandable with sub-items */}
                      <button
                        onClick={handleSeoLocalClick}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                          isSeoTopActive && seoLocalExpanded
                            ? 'bg-primary text-white font-semibold shadow-sm'
                            : isSeoTopActive
                            ? 'bg-primary/10 text-primary font-semibold'
                            : 'text-slate-500 hover:bg-slate-100 hover:text-primary'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-sm font-medium flex-1">{t(labelKey)}</span>
                        {seoLocalExpanded ? (
                          <ExpandLess className="w-4 h-4" />
                        ) : (
                          <ExpandMore className="w-4 h-4" />
                        )}
                      </button>

                      {/* Local SEO sub-items: Grid, Citations, Optimization */}
                      <AnimatePresence>
                        {seoLocalExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="pt-1 space-y-0.5">
                              {SEO_LOCAL_ITEMS.map((item) => {
                                const SubIcon = item.icon;
                                const isSubActive = activeTab === item.id;
                                return (
                                  <button
                                    key={item.id}
                                    onClick={() => handleNavClick(item.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 pl-12 rounded-lg transition-all duration-200 text-xs ${
                                      isSubActive
                                        ? 'bg-primary/10 text-primary font-semibold'
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-primary'
                                    }`}
                                  >
                                    <SubIcon className="w-4 h-4" />
                                    <span className="text-sm font-medium flex-1">{t(item.labelKey)}</span>
                                    {item.badge && (
                                      <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-full ${
                                        isSubActive ? 'bg-primary/20 text-primary' : 'bg-orange-500 text-white'
                                      }`}>
                                        {item.badge}
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  ) : (
                    /* Real Comment and Rednote SEO - top-level items */
                    <button
                      onClick={() => handleNavClick(id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-slate-500 hover:bg-slate-100 hover:text-primary'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium flex-1">{t(labelKey)}</span>
                      {badge && (
                        <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-full ${
                          isActive ? 'bg-primary/20 text-primary' : 'bg-orange-500 text-white'
                        }`}>
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

      {/* Bottom links */}
      <div className="mt-auto pt-4 border-t border-slate-200/50 space-y-1 px-2">
        {navItem('settings', 'nav.settings', Settings, activeTab === 'settings')}
        {navItem('help', 'nav.help', Help, activeTab === 'help')}
        <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-100 rounded-xl transition-all">
          <Logout className="w-5 h-5" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200/50 flex-col z-50">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 z-50 lg:hidden backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              className="fixed inset-y-0 left-0 w-72 bg-white shadow-2xl z-50 lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
