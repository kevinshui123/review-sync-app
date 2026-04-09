import React from 'react';
import { Search, Bell, HelpCircle, Menu, Languages } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface HeaderProps {
  title: string;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  onMenuClick?: () => void;
}

export function Header({ title, activeTab, setActiveTab, onMenuClick }: HeaderProps) {
  const isKeywords = activeTab === 'keywords';
  const { language, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  return (
    <header className="sticky top-0 z-30 flex justify-between items-center px-4 md:px-8 w-full h-16 bg-surface/60 backdrop-blur-xl shrink-0 border-b border-outline-variant/5">
      <div className="flex items-center gap-4 md:gap-8">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-2 text-secondary hover:bg-surface-container rounded-lg"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-lg font-black text-primary whitespace-nowrap tracking-tight hidden sm:block">{title}</span>
        <div className="hidden lg:flex items-center bg-surface-container-lowest px-3 py-1.5 rounded focus-within:ring-1 focus-within:ring-primary/40 transition-all border border-outline-variant/10">
          <Search className="text-secondary w-4 h-4 mr-2" />
          <input 
            type="text" 
            placeholder={t('header.search')} 
            className="bg-transparent border-none focus:ring-0 text-sm w-64 placeholder:text-outline/50 text-on-surface outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-6">
        <div className="hidden sm:flex items-center gap-4 text-sm font-medium">
          <button 
            onClick={() => setActiveTab && setActiveTab('dashboard')}
            className={!isKeywords ? "text-primary border-b-2 border-primary pb-1" : "text-secondary hover:text-on-surface transition-opacity"}
          >
            {t('header.locations')}
          </button>
          <button 
            onClick={() => setActiveTab && setActiveTab('keywords')}
            className={isKeywords ? "text-primary border-b-2 border-primary pb-1" : "text-secondary hover:text-on-surface transition-opacity"}
          >
            {t('header.keywords')}
          </button>
        </div>
        
        <div className="hidden sm:block h-6 w-px bg-outline-variant/20 mx-2"></div>
        
        <div className="flex items-center gap-1 md:gap-3">
          <button 
            onClick={toggleLanguage}
            className="flex items-center gap-1 px-2 py-1.5 text-xs font-bold uppercase tracking-wider text-secondary hover:text-primary hover:bg-surface-container rounded transition-colors"
            title="Toggle Language"
          >
            <Languages className="w-4 h-4" />
            <span className="hidden sm:inline">{language === 'en' ? '中文' : 'EN'}</span>
          </button>
          <button className="p-1.5 text-secondary hover:text-primary transition-colors hidden sm:block">
            <Bell className="w-5 h-5" />
          </button>
          <button className="p-1.5 text-secondary hover:text-primary transition-colors hidden sm:block">
            <HelpCircle className="w-5 h-5" />
          </button>
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAlUeE_8VlR6QEk7Xkm9yILpBkyLDqOCnv5J27gQ7hc-xRGel-PLLKxps05SieTH66QMl7n-ZiBBUHuqZi1ZLwoJT0vkJmUQnCaVMcKWNkle57j4JHKP2DcPCEF4g8Qco9JTTFMsjhsdsKI8zvtm-4qGTYx2AO1AnwcXR14XvY9DX4epKlGJt8yKPDk5LMbzlVnV8-58tPi8ihh7ekF31ktVTZNKibnvgzEAWmf-pHVqYwf3e0lDBc2SoYDtXeYcDVG6GFxdnKxRcc" 
            alt="User Profile" 
            className="w-8 h-8 rounded-full border border-outline-variant/30 ml-2 object-cover"
          />
        </div>
      </div>
    </header>
  );
}
