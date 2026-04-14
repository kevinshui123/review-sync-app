import React, { useState, useEffect, Component, ReactNode } from 'react';
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
import { LocalSearchGrid } from './components/LocalSearchGrid';
import { LocalCitations } from './components/LocalCitations';
import { Optimization } from './components/Optimization';
import { RealComment } from './components/RealComment';
import { Settings } from './components/Settings';
import { Help } from './components/Help';
import { EditBusinessPage } from './components/EditBusinessPage';
import { LandingPage } from './pages/LandingPage';
import { SalesDoc } from './components/SalesDoc';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useLanguage } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppLoader } from './components/AppLoader';
import AuthPage from './pages/AuthPage';
import { apiGet } from './utils/api';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { lightTheme, darkTheme } from './main';

interface ErrorBoundaryProps { children: ReactNode; fallback?: ReactNode; t?: (key: string) => string; }
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
          <p className="text-red-500 font-bold">{this.props.t ? this.props.t('app.errorBoundary') : 'Something went wrong.'}</p>
          <button className="px-4 py-2 bg-primary text-white rounded-lg" onClick={() => this.setState({ hasError: false })}>
            {this.props.t ? this.props.t('app.tryAgain') : 'Try again'}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const { user, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [listingsSubTab, setListingsSubTab] = useState<string | null>(null);
  const [editLocationData, setEditLocationData] = useState<any>(null);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<'app' | 'sales-doc'>('app');
  const [appTheme, setAppTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('app_theme');
    return (saved as 'light' | 'dark') || 'light';
  });
  const { t, language } = useLanguage();
  const isZh = language === 'zh';

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', appTheme);
    localStorage.setItem('app_theme', appTheme);
  }, [appTheme]);

  const handleBackToLanding = () => {
    setShowAuth(false);
    window.history.pushState({}, '', window.location.pathname);
  };

  // Route handling - allow going to sales doc without auth
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('page') === 'sales-doc') {
      setCurrentRoute('sales-doc');
    }
  }, []);

  // Listen for navigation events from Optimization page
  useEffect(() => {
    const handleNavigateTab = (e: CustomEvent) => {
      const { tab, subTab, locationData } = e.detail;
      setActiveTab(tab);
      if (subTab) {
        setListingsSubTab(subTab);
      }
      if (locationData) {
        setEditLocationData(locationData);
      }
    };
    window.addEventListener('navigate-tab', handleNavigateTab as EventListener);
    return () => window.removeEventListener('navigate-tab', handleNavigateTab as EventListener);
  }, []);

  // Listen for navigation to sales doc
  useEffect(() => {
    const handleNavSalesDoc = () => {
      setCurrentRoute('sales-doc');
      window.history.pushState({}, '', '?page=sales-doc');
    };
    window.addEventListener('go-to-sales-doc', handleNavSalesDoc);
    return () => window.removeEventListener('go-to-sales-doc', handleNavSalesDoc);
  }, []);

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
      case 'seo': return t('nav.localSeo');
      case 'seo-grid': return t('seo.localSearchGrid');
      case 'seo-citations': return t('seo.localCitations');
      case 'seo-optimization': return t('seo.optimization');
      case 'seo-real-comment': return t('nav.realComment');
      case 'seo-rednote-seo': return t('nav.rednoteSeo');
      case 'settings': return t('nav.settings');
      case 'help': return t('nav.help');
      case 'sales-doc': return '产品功能文档';
      default: return t('nav.dashboard');
    }
  };

  // Define muiTheme early to avoid "cannot access before initialization" error
  const muiTheme = appTheme === 'dark' ? darkTheme : lightTheme;

  // Wait for client-side hydration to complete
  if (!mounted) {
    return (
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <div style={{ backgroundColor: 'var(--color-surface)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AppLoader message={t('app.loading')} subMessage={isZh ? '正在加载应用...' : 'Loading application...'} />
        </div>
      </ThemeProvider>
    );
  }

  // Auth loading state
  if (isLoading) {
    return (
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <div style={{ backgroundColor: 'var(--color-surface)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AppLoader message={isZh ? '正在验证身份...' : 'Verifying authentication...'} subMessage={isZh ? '请稍候' : 'Please wait'} />
        </div>
      </ThemeProvider>
    );
  }

  // Sales Documentation Route - accessible without login
  if (currentRoute === 'sales-doc') {
    return (
      <>
        <SalesDoc />
      </>
    );
  }

  // Not logged in - show landing page or auth page
  if (!user) {
    // If showAuth is true, show auth page, otherwise show landing page
    if (showAuth) {
      return (
        <ThemeProvider theme={muiTheme}>
          <CssBaseline />
          <div style={{ backgroundColor: 'var(--color-surface)', minHeight: '100vh' }}>
            <AuthPage onBack={handleBackToLanding} />
          </div>
        </ThemeProvider>
      );
    }
    return (
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <div style={{ backgroundColor: 'var(--color-surface)', minHeight: '100vh' }}>
          <LandingPage onShowAuth={() => setShowAuth(true)} />
        </div>
      </ThemeProvider>
    );
  }

  // Header callback for theme changes
  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setAppTheme(newTheme);
  };

  // Not configured
  if (isConfigured === null) {
    return (
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <div style={{ backgroundColor: 'var(--color-surface)', minHeight: '100vh' }}>
          <AppLoader message={isZh ? '正在检查配置...' : 'Checking configuration...'} />
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <div style={{ backgroundColor: 'var(--color-surface)', minHeight: '100vh' }}>
        <div className="app-layout">
          <Sidebar
            activeTab={activeTab}
            setActiveTab={(tab) => {
              setActiveTab(tab);
              setIsSidebarOpen(false);
            }}
            isOpen={isSidebarOpen}
            setIsOpen={setIsSidebarOpen}
          />

          <div className="main-content-area">
            <Header
              title={getTitle()}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onMenuClick={() => setIsSidebarOpen(true)}
              theme={appTheme}
              onThemeChange={handleThemeChange}
            />

            {!isConfigured && activeTab !== 'settings' && (
              <div className="config-warning-banner">
                <AlertTriangle className="w-5 h-5" />
                <span>{t('app.configWarning')}</span>
                <button
                  onClick={() => setActiveTab('settings')}
                  className="config-warning-btn"
                >
                  {t('app.goToSettings')}
                </button>
              </div>
            )}

            <main className="main-scroll-area">
              <ErrorBoundary t={t}>
                <div className="page-content">
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
              {/* SEO Local Search Grid */}
              {activeTab === 'seo-grid' && <LocalSearchGrid />}
              {/* SEO Local Citations */}
              {activeTab === 'seo-citations' && <LocalCitations />}
              {/* SEO Optimization */}
              {activeTab === 'seo-optimization' && <Optimization />}
              {/* SEO top level - redirect to grid */}
              {activeTab === 'seo' && (
                <SEO
                  setActiveTab={setActiveTab}
                  activeSection="localSeo"
                  setActiveSection={(section) => {
                    if (section === 'localSeo') setActiveTab('seo-grid');
                    else if (section === 'realComment') setActiveTab('seo-real-comment');
                    else if (section === 'rednoteSeo') setActiveTab('seo-rednote-seo');
                  }}
                />
              )}
              {/* SEO Real Comment */}
              {activeTab === 'seo-real-comment' && <RealComment />}
              {activeTab === 'seo-rednote-seo' && (
                <SEO
                  setActiveTab={setActiveTab}
                  activeSection="rednoteSeo"
                  setActiveSection={(section) => {
                    if (section === 'localSeo') setActiveTab('seo-grid');
                    else if (section === 'realComment') setActiveTab('seo-real-comment');
                    else if (section === 'rednoteSeo') setActiveTab('seo-rednote-seo');
                  }}
                />
              )}
              {activeTab === 'settings' && <Settings />}
              {activeTab === 'help' && <Help />}
            </div>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  </div>
  </ThemeProvider>
);
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
