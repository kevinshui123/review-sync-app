import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Listings } from './components/Listings';
import { Reviews } from './components/Reviews';
import { CommentsGen } from './components/CommentsGen';
import { RankTracker } from './components/RankTracker';
import { Posts } from './components/Posts';
import { Reports } from './components/Reports';
import { Keywords } from './components/Keywords';
import { Settings } from './components/Settings';
import { Docs } from './components/Docs';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from './contexts/LanguageContext';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const checkConfig = async () => {
      try {
        const res = await fetch('/api/settings');
        if (!res.ok) {
          console.error('Settings check failed:', res.status, res.statusText);
          setIsConfigured(false);
          return;
        }
        const data = await res.json();
        const hasPlaces = !!(data.googlePlacesApiKey && String(data.googlePlacesApiKey).trim());
        const hasOAuth = !!data.googleConnected;
        const hasAi = !!(
          (data.geminiApiKey && String(data.geminiApiKey).trim()) ||
          (data.openaiApiKey && String(data.openaiApiKey).trim())
        );
        setIsConfigured(hasOAuth || hasPlaces || hasAi);
      } catch (error) {
        console.error('Failed to check configuration:', error);
        setIsConfigured(false);
      }
    };
    checkConfig();
  }, [activeTab]);

  const getTitle = () => {
    switch(activeTab) {
      case 'dashboard': return t('app.title.dashboard');
      case 'listings': return t('app.title.listings');
      case 'reviews': return t('app.title.reviews');
      case 'comments-gen': return t('app.title.comments-gen');
      case 'rank-tracker': return t('app.title.rank-tracker');
      case 'posts': return t('app.title.posts');
      case 'reports': return t('app.title.reports');
      case 'keywords': return t('app.title.keywords');
      case 'settings': return t('app.title.settings');
      case 'docs': return t('app.title.docs');
      default: return t('app.title.dashboard');
    }
  };

  if (isConfigured === null) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-surface text-on-surface font-sans overflow-hidden selection:bg-primary/30 selection:text-primary">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setIsSidebarOpen(false);
        }} 
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      
      <div className="flex-1 flex flex-col min-w-0 relative w-full">
        <Header 
          title={getTitle()} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onMenuClick={() => setIsSidebarOpen(true)}
        />
        
        {!isConfigured && activeTab !== 'settings' && activeTab !== 'docs' && (
          <div className="bg-error/10 border-b border-error/20 p-4 flex items-center justify-center gap-3 text-error">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium text-sm">{t('app.configWarning')}</span>
            <button 
              onClick={() => setActiveTab('settings')}
              className="ml-4 px-4 py-1.5 bg-error text-white rounded-md text-xs font-bold hover:bg-error/90 transition-colors"
            >
              {t('app.goToSettings')}
            </button>
          </div>
        )}

        <main className="flex-1 flex flex-col min-h-0 overflow-y-auto relative bg-surface">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col min-h-0"
            >
              {activeTab === 'dashboard' && <Dashboard setActiveTab={setActiveTab} />}
              {activeTab === 'listings' && <Listings />}
              {activeTab === 'reviews' && <Reviews />}
              {activeTab === 'comments-gen' && <CommentsGen />}
              {activeTab === 'rank-tracker' && <RankTracker />}
              {activeTab === 'posts' && <Posts />}
              {activeTab === 'reports' && <Reports />}
              {activeTab === 'keywords' && <Keywords />}
              {activeTab === 'settings' && <Settings />}
              {activeTab === 'docs' && <Docs />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
