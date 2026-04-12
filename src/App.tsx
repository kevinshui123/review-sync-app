import React, { useState, useEffect, Component, ReactNode } from 'react';

interface ErrorBoundaryProps { children: ReactNode; fallback?: ReactNode; }
interface ErrorBoundaryState { hasError: boolean; error?: Error; }

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, info.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center h-screen bg-surface gap-4">
          <p className="text-red-500 font-bold">Something went wrong.</p>
          <button className="px-4 py-2 bg-primary text-white rounded-lg" onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
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
import { useLanguage } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './pages/AuthPage';
import { apiGet } from './utils/api';

function AppContent() {
  const { user, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [listingsSubTab, setListingsSubTab] = useState<string | null>(null);
  const [editLocationData, setEditLocationData] = useState<any>(null);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const checkConfig = async () => {
      try {
        const res = await apiGet('/api/settings');
        if (!res.ok) {
          console.error('Settings check failed:', res.status, res.statusText);
          setIsConfigured(false);
          return;
        }
        const data = await res.json();
        const hasEmbedSocial = !!(data.embedSocialApiKey && String(data.embedSocialApiKey).trim());
        const hasAi = !!(
          (data.geminiApiKey && String(data.geminiApiKey).trim()) ||
          (data.openaiApiKey && String(data.openaiApiKey).trim())
        );
        setIsConfigured(hasEmbedSocial || hasAi);
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

  // Wait for client-side hydration to complete
  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-surface gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    );
  }

  // Auth loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-surface gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <AuthPage />;
  }

  // Not configured
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
          <ErrorBoundary>
            <div className="flex-1 flex flex-col min-h-0">
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
                    setListingsSubTab={(tab, locationData) => {
                      if (tab && locationData) {
                        setEditLocationData(locationData);
                        setSelectedLocation(locationData);
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
            </div>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
