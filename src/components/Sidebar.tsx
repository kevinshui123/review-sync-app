import React from 'react';
import { 
  LayoutDashboard, 
  List, 
  Star, 
  LineChart, 
  FileText, 
  BarChart2, 
  Settings,
  Box,
  BookOpen,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen }: SidebarProps) {
  const { t } = useLanguage();

  const navItems = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { id: 'listings', label: t('nav.listings'), icon: List },
    { id: 'reviews', label: t('nav.reviews'), icon: Star },
    { id: 'comments-gen', label: t('nav.comments-gen'), icon: FileText },
    { id: 'rank-tracker', label: t('nav.rank-tracker'), icon: LineChart },
    { id: 'posts', label: t('nav.posts'), icon: FileText },
    { id: 'reports', label: t('nav.reports'), icon: BarChart2 },
  ];

  const sidebarContent = (
    <div className="h-full flex flex-col py-6 px-4">
      <div className="flex items-center justify-between px-2 mb-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-container rounded flex items-center justify-center">
            <Box className="text-on-primary w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tighter text-on-surface">Mahjong Box</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mt-0.5">Local SEO Engine</p>
          </div>
        </div>
        <button 
          className="md:hidden p-2 text-secondary hover:bg-surface-container rounded-lg"
          onClick={() => setIsOpen(false)}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded transition-all duration-200 ${
                isActive 
                  ? 'bg-surface-container-highest text-primary border-l-2 border-primary font-semibold' 
                  : 'text-secondary hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-outline-variant/10 space-y-1">
        <button 
          onClick={() => setActiveTab('docs')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded transition-all duration-200 ${
            activeTab === 'docs'
              ? 'bg-surface-container-highest text-primary border-l-2 border-primary font-semibold' 
              : 'text-secondary hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">{t('nav.docs')}</span>
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded transition-all duration-200 ${
            activeTab === 'settings'
              ? 'bg-surface-container-highest text-primary border-l-2 border-primary font-semibold' 
              : 'text-secondary hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">{t('nav.settings')}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex h-screen w-64 border-r-0 bg-surface flex-col shrink-0 z-20 relative">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              className="fixed inset-y-0 left-0 w-72 bg-surface shadow-2xl z-50 md:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
