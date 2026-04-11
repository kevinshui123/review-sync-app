import React from 'react';
import { Menu, Search, Notifications, History, Person, Translate } from '@mui/icons-material';
import { useLanguage } from '../contexts/LanguageContext';

interface HeaderProps {
  title: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onMenuClick: () => void;
}

export function Header({ title, activeTab, setActiveTab, onMenuClick }: HeaderProps) {
  const { t, language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 h-16 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        {/* Language Toggle Button */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold hover:bg-primary/20 transition-colors"
          title={language === 'en' ? '切换到中文' : 'Switch to English'}
        >
          <Translate className="w-4 h-4" />
          <span>{language === 'en' ? '中文' : 'EN'}</span>
        </button>
        <button
          className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
          onClick={onMenuClick}
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Title */}
        <h1 className="text-lg font-bold text-blue-900 font-headline">{title}</h1>

        {/* Breadcrumbs for certain tabs */}
        {activeTab === 'seo' && (
          <div className="hidden md:flex items-center gap-2 text-sm text-slate-400 ml-4">
            <span>/</span>
            <span className="text-primary font-semibold">SEO Management</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder={t('header.search')}
            className="pl-10 pr-4 py-2 bg-surface-container-highest border-none rounded-full text-sm focus:ring-2 focus:ring-primary/20 transition-all w-64"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
          <Notifications className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
        </button>

        {/* History */}
        <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
          <History className="w-5 h-5" />
        </button>

        {/* User Avatar */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-bold text-on-surface">Editorial Intel</p>
            <p className="text-[10px] text-slate-500">Admin Access</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border-2 border-slate-300">
            <Person className="w-full h-full p-2 text-slate-500" />
          </div>
        </div>
      </div>
    </header>
  );
}
