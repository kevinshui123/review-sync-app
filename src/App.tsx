import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Listings } from './components/Listings';
import { Reviews } from './components/Reviews';
import { BulkEdits } from './components/BulkEdits';
import { EditsLog } from './components/EditsLog';
import { Publishing } from './components/Publishing';
import { Reports } from './components/Reports';
import { SEO } from './components/SEO';
import { Settings } from './components/Settings';
import { Help } from './components/Help';
import { EditBusinessPage } from './components/EditBusinessPage';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from './contexts/LanguageContext';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [listingsSubTab, setListingsSubTab] = useState<string | null>(null);
  const [editLocationData, setEditLocationData] = useState<any>(null);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
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
      case 'dashboard': return t('nav.dashboard');
      case 'listings': return t('nav.listings');
      case 'reviews': return t('nav.reviews');
      case 'bulk-edits': return t('nav.bulkEdits');
      case 'edits-log': return t('nav.editsLog');
      case 'publishing': return t('nav.publishing');
      case 'reports': return t('nav.reports');
      case 'seo': return t('nav.seo');
      case 'settings': return t('nav.settings');
      case 'help': return t('nav.help');
      default: return t('nav.dashboard');
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
    <div className="flex h-screen bg-surface text-on-surface overflow-hidden selection:bg-primary/30 selection:text-primary">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setIsSidebarOpen(false);
        }} 
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      
      <div className="flex-1 flex flex-col min-w-0 relative w-full lg:ml-64">
        <Header 
          title={getTitle()} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onMenuClick={() => setIsSidebarOpen(true)}
        />
        
        {!isConfigured && activeTab !== 'settings' && (
          <div className="bg-yellow-50 border-b border-yellow-200 p-4 flex items-center justify-center gap-3 text-yellow-700">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium text-sm">{t('app.configWarning')}</span>
            <button 
              onClick={() => setActiveTab('settings')}
              className="ml-4 px-4 py-1.5 bg-yellow-500 text-white rounded-md text-xs font-bold hover:bg-yellow-600 transition-colors"
            >
              {t('app.goToSettings')}
            </button>
          </div>
        )}

        <main className="flex-1 flex flex-col min-h-0 overflow-y-auto relative bg-white">
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
              {activeTab === 'listings' && (
                listingsSubTab === 'edit' ? (
                  <EditBusinessPage
                    location={editLocationData}
                    onBack={() => {
                      setListingsSubTab(null);
                      setEditLocationData(null);
                    }}
                    onSuccess={(data) => {
                      // Update location data and go back
                      setListingsSubTab(null);
                      setEditLocationData(null);
                    }}
                  />
                ) : (
                  <Listings
                    setActiveTab={setActiveTab}
                    setListingsSubTab={(tab) => {
                      if (tab) {
                        setEditLocationData(selectedLocation);
                      }
                      setListingsSubTab(tab);
                    }}
                    listingsSubTab={listingsSubTab}
                    setSelectedLocation={setSelectedLocation}
                    selectedLocation={selectedLocation}
                  />
                )
              )}
              {activeTab === 'reviews' && <Reviews />}
              {activeTab === 'bulk-edits' && <BulkEdits setActiveTab={setActiveTab} />}
              {activeTab === 'edits-log' && <EditsLog setActiveTab={setActiveTab} />}
              {activeTab === 'publishing' && <Publishing setActiveTab={setActiveTab} />}
              {activeTab === 'reports' && <Reports setActiveTab={setActiveTab} />}
              {activeTab === 'seo' && <SEO setActiveTab={setActiveTab} />}
              {activeTab === 'settings' && <Settings />}
              {activeTab === 'help' && <Help />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
