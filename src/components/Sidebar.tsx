import React from 'react';
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
  AddBusiness,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const NAV_ITEMS = [
  { id: 'dashboard', labelKey: 'nav.dashboard', icon: Dashboard },
  { id: 'listings', labelKey: 'nav.listings', icon: PushPin },
  { id: 'connect-business', labelKey: 'nav.connectBusiness', icon: AddBusiness, badge: 'New' },
  { id: 'reviews', labelKey: 'nav.reviews', icon: RateReview },
  { id: 'bulk-edits', labelKey: 'nav.bulkEdits', icon: Edit },
  { id: 'edits-log', labelKey: 'nav.editsLog', icon: History },
  { id: 'publishing', labelKey: 'nav.publishing', icon: CalendarToday },
  { id: 'reports', labelKey: 'nav.reports', icon: BarChart },
  { id: 'seo', labelKey: 'nav.seo', icon: Public, hasSubmenu: true },
];

export function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen }: SidebarProps) {
  const { t } = useLanguage();

  const navItem = (id: string, labelKey: string, Icon: React.ElementType, isActive: boolean, badge?: string) => {
    return (
      <button
        key={id}
        onClick={() => {
          setActiveTab(id);
          setIsOpen(false);
        }}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
          isActive
            ? 'bg-primary text-white font-semibold shadow-sm'
            : 'text-slate-500 hover:bg-slate-100 hover:text-primary'
        }`}
      >
        <Icon className="w-5 h-5" />
        <span className="text-sm font-medium flex-1">{t(labelKey)}</span>
        {badge && (
          <span className="px-1.5 py-0.5 bg-primary/20 text-primary text-[9px] font-bold rounded-full">
            {badge}
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
              Editorial Intel
            </h1>
            <p className="text-[10px] text-slate-500 font-medium tracking-widest uppercase mt-0.5">
              Premium Curator
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
      <nav className="flex-1 space-y-1 px-2">
        {NAV_ITEMS.map(({ id, labelKey, icon, badge }) =>
          navItem(id, labelKey, icon, activeTab === id, badge)
        )}
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
