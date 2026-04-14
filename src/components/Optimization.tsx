import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  AutoAwesome,
  Refresh,
  Speed,
  LocalFireDepartment,
  Error as ErrorIcon,
  CheckCircle,
  ArrowForward,
  Edit,
  TrendingUp,
  Image,
  Description,
  AccessTime,
  Phone,
  Language,
  Map,
  PhotoCamera,
  Star,
  Lightbulb,
  Shield,
  Verified,
  Warning,
  Info,
  ChevronRight,
  EmojiEvents,
  TrendingDown,
  Store,
  Analytics,
  Psychology,
} from '@mui/icons-material';
import { apiGet, apiPost } from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import { AppLoader } from './AppLoader';

function getScoreColor(score: number) {
  if (score >= 80) return { color: '#1e3a5f', label: 'Excellent', bg: '#f0f4f8', border: '#1e3a5f', text: '#1e3a5f' };
  if (score >= 60) return { color: '#d97706', label: 'Good', bg: '#fffbeb', border: '#d97706', text: '#92400e' };
  if (score >= 40) return { color: '#ea580c', label: 'Fair', bg: '#fff7ed', border: '#ea580c', text: '#9a3412' };
  return { color: '#dc2626', label: 'Needs Work', bg: '#fef2f2', border: '#dc2626', text: '#991b1b' };
}

function getPriorityColor(priority: string) {
  switch (priority.toLowerCase()) {
    case 'high': case 'critical':
      return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', icon: <Warning sx={{ fontSize: 14 }} /> };
    case 'medium':
      return { bg: '#fffbeb', text: '#d97706', border: '#fde68a', icon: <Info sx={{ fontSize: 14 }} /> };
    default:
      return { bg: '#f0f9ff', text: '#0284c7', border: '#bae6fd', icon: <Lightbulb sx={{ fontSize: 14 }} /> };
  }
}

interface BusinessInfo {
  name: string; address: string; phone: string; website: string;
  category: string; keywords: string; hours: Record<string, string>; lat?: number; lng?: number;
}

interface Insight {
  type: string; priority: 'high' | 'medium' | 'low'; title: string; description: string;
  currentValue?: string; suggestedValue?: string; actionType: string;
  actionLabel?: string; potentialImpact?: string;
}

interface CompetitiveInsight {
  title: string; description: string; actionSteps?: string[]; priority: 'high' | 'medium' | 'low';
}

interface QuickWin {
  action: string; impact?: string; effort?: string; actionType?: string;
}

interface SEOReport {
  overallScore: number; overallSummary: string; insights: Insight[];
  competitiveInsights: CompetitiveInsight[]; quickWins: QuickWin[];
  _raw?: { listingsCount: number; metricsAvailable: boolean; reviewsAvailable: number };
}

const CategoryConfig: Record<string, { icon: React.ReactNode; bg: string; border: string; text: string }> = {
  photos: { icon: <PhotoCamera sx={{ fontSize: 18 }} />, bg: '#fdf2f8', border: '#fbcfe8', text: '#be185d' },
  reviews: { icon: <Star sx={{ fontSize: 18 }} />, bg: '#fffbeb', border: '#fde68a', text: '#b45309' },
  description: { icon: <Description sx={{ fontSize: 18 }} />, bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' },
  hours: { icon: <AccessTime sx={{ fontSize: 18 }} />, bg: '#f5f3ff', border: '#ddd6fe', text: '#6d28d9' },
  contact: { icon: <Phone sx={{ fontSize: 18 }} />, bg: '#ecfeff', border: '#a5f3fc', text: '#0e7490' },
  website: { icon: <Language sx={{ fontSize: 18 }} />, bg: '#ecfdf5', border: '#a7f3d0', text: '#047857' },
  location: { icon: <Map sx={{ fontSize: 18 }} />, bg: '#fef9c3', border: '#fef08a', text: '#a16207' },
  categories: { icon: <Verified sx={{ fontSize: 18 }} />, bg: '#fdf4ff', border: '#e9d5ff', text: '#7e22ce' },
  citations: { icon: <Store sx={{ fontSize: 18 }} />, bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d' },
};

function LoadingState({ message, subMessage }: { message?: string; subMessage?: string }) {
  return (
    <div className="opt-app-loader-wrapper">
      <AppLoader message={message} subMessage={subMessage} />
    </div>
  );
}

// Generating Progress Component
function GeneratingProgress({ startTime, onComplete }: { startTime: number; onComplete?: () => void }) {
  const { t, language } = useLanguage();
  const isZh = language === 'zh';
  const [elapsed, setElapsed] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    isZh ? '正在扫描商家门店...' : 'Scanning business listings...',
    isZh ? '正在分析评价模式...' : 'Analyzing review patterns...',
    isZh ? '正在检查引用一致性...' : 'Checking citation consistency...',
    isZh ? '正在生成优化建议...' : 'Generating recommendations...',
  ];

  const estimatedTime = 30; // seconds

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - startTime) / 1000);
      setElapsed(elapsedSeconds);

      // Update step based on elapsed time
      const progress = elapsedSeconds / estimatedTime;
      if (progress < 0.25) setCurrentStep(0);
      else if (progress < 0.5) setCurrentStep(1);
      else if (progress < 0.75) setCurrentStep(2);
      else setCurrentStep(3);

      if (progress >= 1 && onComplete) {
        onComplete();
      }
    }, 500);
    return () => clearInterval(interval);
  }, [startTime, onComplete]);

  const progress = Math.min((elapsed / estimatedTime) * 100, 95);
  const remaining = Math.max(estimatedTime - elapsed, 0);
  const remainingText = remaining > 60
    ? `${Math.ceil(remaining / 60)} ${isZh ? '分钟' : 'min'}`
    : `${remaining} ${isZh ? '秒' : 'sec'}`;

  return (
    <div className="opt-generating">
      <div className="opt-generating-orb">
        <div className="opt-gen-ring opt-gen-ring-1" />
        <div className="opt-gen-ring opt-gen-ring-2" />
        <div className="opt-gen-ring opt-gen-ring-3" />
        <div className="opt-gen-core">
          <Psychology sx={{ fontSize: 36, color: '#fff' }} />
        </div>
        <div className="opt-gen-pulse" />
      </div>

      <div className="opt-generating-content">
        <h3>{isZh ? 'AI 正在分析中...' : 'AI is analyzing...'}</h3>
        <p className="opt-gen-subtitle">{isZh ? '这可能需要 30 秒左右' : 'This may take around 30 seconds'}</p>

        <div className="opt-gen-progress-container">
          <div className="opt-gen-progress-bar">
            <div className="opt-gen-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="opt-gen-progress-info">
            <span>{Math.round(progress)}%</span>
            <span>{isZh ? `预计剩余 ${remainingText}` : `~${remainingText} remaining`}</span>
          </div>
        </div>

        <div className="opt-gen-steps">
          {steps.map((step, i) => (
            <div
              key={i}
              className={`opt-gen-step ${i <= currentStep ? 'active' : ''} ${i < currentStep ? 'completed' : ''}`}
            >
              <div className="opt-gen-step-icon">
                {i < currentStep ? (
                  <CheckCircle sx={{ fontSize: 16, color: '#10b981' }} />
                ) : i === currentStep ? (
                  <div className="opt-gen-step-spinner" />
                ) : (
                  <div className="opt-gen-step-dot" />
                )}
              </div>
              <span>{step}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .opt-generating {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 48px 24px;
          gap: 32px;
        }
        .opt-generating-orb {
          position: relative;
          width: 140px;
          height: 140px;
        }
        .opt-gen-ring {
          position: absolute;
          border-radius: 999px;
          border: 2px solid transparent;
          animation: opt-gen-spin linear infinite;
        }
        .opt-gen-ring-1 {
          inset: 0;
          border-top-color: var(--color-primary, #1e3a5f);
          animation-duration: 1.5s;
        }
        .opt-gen-ring-2 {
          inset: 16px;
          border-top-color: var(--color-accent, #0ea5e9);
          animation-duration: 2s;
          animation-direction: reverse;
        }
        .opt-gen-ring-3 {
          inset: 32px;
          border-top-color: var(--color-success, #059669);
          animation-duration: 1.8s;
        }
        @keyframes opt-gen-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .opt-gen-core {
          position: absolute;
          inset: 36px;
          background: linear-gradient(135deg, var(--color-primary, #1e3a5f) 0%, #0f2744 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 30px rgba(30, 58, 95, 0.4);
        }
        .opt-gen-pulse {
          position: absolute;
          inset: 20%;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(79, 172, 254, 0.25) 0%, transparent 70%);
          animation: opt-gen-pulse 2s ease-out infinite;
        }
        @keyframes opt-gen-pulse {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .opt-generating-content {
          text-align: center;
          max-width: 400px;
        }
        .opt-generating-content h3 {
          font-family: var(--font-headline, 'Manrope', sans-serif);
          font-size: 20px;
          font-weight: 700;
          color: var(--color-text-primary, #0f172a);
          margin: 0 0 8px;
        }
        .opt-gen-subtitle {
          font-size: 14px;
          color: var(--color-text-muted, #94a3b8);
          margin: 0 0 24px;
        }
        .opt-gen-progress-container {
          margin-bottom: 32px;
        }
        .opt-gen-progress-bar {
          height: 8px;
          background: var(--color-border, #e2e8f0);
          border-radius: 999px;
          overflow: hidden;
          margin-bottom: 8px;
        }
        .opt-gen-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--color-primary, #1e3a5f), var(--color-accent, #0ea5e9));
          border-radius: 999px;
          transition: width 0.5s ease;
        }
        .opt-gen-progress-info {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: var(--color-text-muted, #94a3b8);
        }
        .opt-gen-steps {
          display: flex;
          flex-direction: column;
          gap: 12px;
          text-align: left;
        }
        .opt-gen-step {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
          color: var(--color-text-muted, #94a3b8);
          transition: all 0.3s ease;
        }
        .opt-gen-step.active {
          color: var(--color-text-primary, #0f172a);
          font-weight: 500;
        }
        .opt-gen-step.completed {
          color: var(--color-success, #059669);
        }
        .opt-gen-step-icon {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .opt-gen-step-dot {
          width: 8px;
          height: 8px;
          background: var(--color-border, #e2e8f0);
          border-radius: 50%;
        }
        .opt-gen-step.active .opt-gen-step-dot {
          background: var(--color-accent, #0ea5e9);
          animation: opt-gen-pulse-dot 1s ease-in-out infinite;
        }
        @keyframes opt-gen-pulse-dot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }
        .opt-gen-step-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid var(--color-border, #e2e8f0);
          border-top-color: var(--color-accent, #0ea5e9);
          border-radius: 50%;
          animation: opt-gen-spin 0.8s linear infinite;
        }
      `}</style>
    </div>
  );
}

export function Optimization() {
  const { t, language } = useLanguage();
  const isZh = language === 'zh';
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [seoReport, setSeoReport] = useState<SEOReport | null>(() => {
    try { return localStorage.getItem('seo_report') ? JSON.parse(localStorage.getItem('seo_report')!) : null; }
    catch { return null; }
  });
  const [seoLoading, setSeoLoading] = useState(false);
  const [generatingStartTime, setGeneratingStartTime] = useState<number | null>(null);
  const [seoError, setSeoError] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'overview' | 'insights' | 'competitive' | 'quickwins'>('overview');

  useEffect(() => {
    if (seoReport) localStorage.setItem('seo_report', JSON.stringify(seoReport));
  }, [seoReport]);

  const generateSeoReport = useCallback(async () => {
    setSeoLoading(true);
    setSeoError(null);
    setGeneratingStartTime(Date.now());
    try {
      const res = await apiPost('/api/reports/seo-optimization', { lang: language });
      if (res.ok) { const data = await res.json(); setSeoReport(data); }
      else { const err = await res.json().catch(() => ({ error: 'Request failed' })); setSeoError(err.error); }
    } catch (e: any) { setSeoError(e.message || 'Network error'); }
    finally { setSeoLoading(false); setGeneratingStartTime(null); }
  }, [language]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const locationsRes = await apiGet('/api/embedsocial/locations');
        let locations: any[] = locationsRes.ok ? await locationsRes.json() : [];
        const hasCoords = locations.some((l: any) => l.latitude || l.lat);
        if (locations.length > 0 && !hasCoords) {
          try { await apiPost('/api/embedsocial/listings/backfill-coordinates'); } catch { /* ignore */ }
          const refreshed = await apiGet('/api/embedsocial/locations');
          if (refreshed.ok) locations = await refreshed.json();
        }
        const primary = locations[0];
        if (primary) {
          setBusinessInfo({ name: primary.name || 'Business', address: primary.address || '',
            phone: primary.phoneNumber || '', website: primary.websiteUrl || '',
            category: primary.category || '', keywords: 'restaurant, mini bowl, asian food', hours: {},
            lat: primary.latitude || primary.lat, lng: primary.longitude || primary.lng });
        } else {
          setBusinessInfo({ name: 'Mahjong mini bowl-Baltimore', address: '3105 saint pual st, unit A, Baltimore, 21218, US',
            phone: '(443) 869-2177', website: 'https://mahjong-box.com/', category: 'Restaurant',
            keywords: 'Asian Food, Mini Bowl', hours: { Monday: '11 am - 8 pm', Tuesday: '11 am - 8 pm', Wednesday: '11 am - 8 pm', Thursday: '11 am - 8 pm', Friday: '11 am - 8 pm', Saturday: '11 am - 8 pm', Sunday: '11 am - 8 pm' }, lat: 39.3305, lng: -76.6150 });
        }
      } catch (error) { console.error('Failed:', error); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const getCategoryConfig = (type: string) =>
    CategoryConfig[type.toLowerCase()] || CategoryConfig.citations;

  const getFilteredInsights = () => {
    if (!seoReport?.insights) return [];
    return seoReport.insights.filter(insight =>
      filterPriority === 'all' || insight.priority.toLowerCase() === filterPriority.toLowerCase()
    );
  };

  const handleActionClick = (insight: Insight) => {
    if (insight.actionType === 'review') {
      window.dispatchEvent(new CustomEvent('navigate-tab', { detail: { tab: 'seo-real-comment' } }));
    } else {
      window.dispatchEvent(new CustomEvent('navigate-tab', { detail: { tab: 'listings', subTab: 'edit' } }));
    }
  };

  if (loading) return <LoadingState message={isZh ? '正在初始化优化引擎...' : 'Initializing optimization engine...'} subMessage={isZh ? '正在准备数据...' : 'Getting ready...'} />;

  return (
    <div className="opt-container">
      {/* Header */}
      <div className="opt-header">
        <div className="opt-header-left">
          <div className="opt-header-icon">
            <Analytics sx={{ fontSize: 24, color: '#fff' }} />
          </div>
          <div>
            <h1 className="opt-title">Optimization Center</h1>
            <p className="opt-subtitle">{businessInfo?.name}</p>
          </div>
        </div>
        <button
          onClick={generateSeoReport}
          disabled={seoLoading}
          className={`opt-btn ${seoReport ? 'opt-btn-outline' : 'opt-btn-solid'}`}
        >
          {seoLoading ? (
            <>
              <div className="opt-btn-spinner" />
              {isZh ? 'AI 分析中...' : 'Analyzing...'}
            </>
          ) : seoReport ? (
            <>
              <Refresh sx={{ fontSize: 18 }} />
              {isZh ? '重新生成' : 'Regenerate'}
            </>
          ) : (
            <>
              <AutoAwesome sx={{ fontSize: 18 }} />
              {t('opt.startAnalysis')}
            </>
          )}
        </button>
      </div>

      {seoError && (
        <div className="opt-error">
          <ErrorIcon sx={{ fontSize: 18 }} />
          {seoError}
        </div>
      )}

      {seoLoading && !seoReport && generatingStartTime && (
        <GeneratingProgress startTime={generatingStartTime} />
      )}

      {seoLoading && !seoReport && !generatingStartTime && (
        <div className="opt-analyzing">
          <div className="opt-analyzing-orb">
            <div className="opt-analyzing-ring1" />
            <div className="opt-analyzing-ring2" />
            <div className="opt-analyzing-core">
              <Psychology sx={{ fontSize: 32, color: '#fff' }} />
            </div>
          </div>
          <div className="opt-analyzing-text">
            <h3>{t('opt.analyzingAi')}</h3>
            <p>{t('opt.evaluating')}</p>
          </div>
        </div>
      )}

      {seoReport && !seoLoading && (
        <>
          {/* Section Tabs */}
          <div className="opt-tabs">
            {[
              { id: 'overview', label: t('opt.overview'), icon: <Speed sx={{ fontSize: 16 }} /> },
              { id: 'insights', label: t('opt.insights'), icon: <Lightbulb sx={{ fontSize: 16 }} />, count: seoReport.insights?.length },
              { id: 'competitive', label: t('opt.competitive'), icon: <EmojiEvents sx={{ fontSize: 16 }} />, count: seoReport.competitiveInsights?.length },
              { id: 'quickwins', label: t('opt.quickWins'), icon: <LocalFireDepartment sx={{ fontSize: 16 }} />, count: seoReport.quickWins?.length },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} className={`opt-tab ${activeSection === tab.id ? 'active' : ''}`} onClick={() => setActiveSection(tab.id as any)}>
                  {Icon}
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && <span className="opt-tab-count">{tab.count}</span>}
                </button>
              );
            })}
          </div>

          {/* Overview */}
          {activeSection === 'overview' && (
            <div className="opt-overview">
              {/* Score */}
              <div className="opt-score-card" style={{ borderColor: getScoreColor(seoReport.overallScore).border, background: getScoreColor(seoReport.overallScore).bg }}>
                <div className="opt-score-ring-container">
                  <svg viewBox="0 0 140 140" className="opt-score-svg">
                    <circle cx="70" cy="70" r="60" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="14" />
                    <circle cx="70" cy="70" r="60" fill="none" stroke={getScoreColor(seoReport.overallScore).color}
                      strokeWidth="14" strokeLinecap="round"
                      strokeDasharray={`${(seoReport.overallScore / 100) * 377} 377`}
                      className="opt-score-progress" />
                  </svg>
                  <div className="opt-score-value">
                    <span className="opt-score-number" style={{ color: getScoreColor(seoReport.overallScore).color }}>{seoReport.overallScore}</span>
                    <span className="opt-score-denom">/100</span>
                  </div>
                </div>
                <div className="opt-score-info">
                  <div className="opt-score-label" style={{ color: getScoreColor(seoReport.overallScore).text }}>
                    {getScoreColor(seoReport.overallScore).label}
                  </div>
                  <p className="opt-score-summary">{seoReport.overallSummary}</p>
                  {seoReport._raw && (
                    <div className="opt-score-meta">
                      <span>{seoReport._raw.listingsCount} listings</span>
                      <span className="opt-score-meta-dot" />
                      <span>{seoReport._raw.reviewsAvailable} reviews</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="opt-quick-stats">
                <div className="opt-stat-card">
                  <div className="opt-stat-icon" style={{ background: '#eff6ff', color: '#1d4ed8' }}><Lightbulb sx={{ fontSize: 20 }} /></div>
                  <div className="opt-stat-info"><div className="opt-stat-value">{seoReport.insights?.length || 0}</div><div className="opt-stat-label">Recommendations</div></div>
                </div>
                <div className="opt-stat-card">
                  <div className="opt-stat-icon" style={{ background: '#fffbeb', color: '#d97706' }}><LocalFireDepartment sx={{ fontSize: 20 }} /></div>
                  <div className="opt-stat-info"><div className="opt-stat-value">{seoReport.quickWins?.length || 0}</div><div className="opt-stat-label">{t('opt.quickWins')}</div></div>
                </div>
                <div className="opt-stat-card">
                  <div className="opt-stat-icon" style={{ background: '#fdf4ff', color: '#7e22ce' }}><EmojiEvents sx={{ fontSize: 20 }} /></div>
                  <div className="opt-stat-info"><div className="opt-stat-value">{seoReport.competitiveInsights?.length || 0}</div><div className="opt-stat-label">{t('opt.competitorInsights')}</div></div>
                </div>
                <div className="opt-stat-card">
                  <div className="opt-stat-icon" style={{ background: '#fef2f2', color: '#dc2626' }}><Warning sx={{ fontSize: 20 }} /></div>
                  <div className="opt-stat-info"><div className="opt-stat-value" style={{ color: '#dc2626' }}>{seoReport.insights?.filter((i: any) => i.priority === 'high').length || 0}</div><div className="opt-stat-label">{t('opt.highPriority')}</div></div>
                </div>
              </div>

              {/* Quick Wins Preview */}
              {seoReport.quickWins && seoReport.quickWins.length > 0 && (
                <div className="opt-qw-preview">
                  <div className="opt-qw-header">
                    <div className="opt-qw-icon"><LocalFireDepartment sx={{ fontSize: 20, color: '#ea580c' }} /></div>
                    <div>
                      <div className="opt-qw-title">{t('opt.quickWins')}</div>
                      <div className="opt-qw-subtitle">{t('opt.quickWinsSubtitle')}</div>
                    </div>
                    {seoReport.quickWins.length > 3 && (
                      <button className="opt-qw-link" onClick={() => setActiveSection('quickwins')}>
                        {t('opt.viewAll')} {seoReport.quickWins.length} →
                      </button>
                    )}
                  </div>
                  <div className="opt-qw-list">
                    {seoReport.quickWins.slice(0, 3).map((win, i) => (
                      <div key={i} className="opt-qw-item">
                        <span className="opt-qw-num">{i + 1}</span>
                        <span className="opt-qw-action">{win.action}</span>
                        {win.impact && (
                          <span className={`opt-qw-impact ${win.impact}`}>{win.impact}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Insights */}
          {activeSection === 'insights' && (
            <div className="opt-section">
              <div className="opt-section-header">
                <div>
                  <h2 className="opt-section-title">{t('opt.recommendations')}</h2>
                  <p className="opt-section-subtitle">{t('opt.aiGenerated')}</p>
                </div>
                <div className="opt-filter-group">
                  {['all', 'high', 'medium', 'low'].map((p) => (
                    <button key={p} className={`opt-filter-btn ${filterPriority === p ? 'active' : ''} ${p}`}
                      onClick={() => setFilterPriority(p)}>
                      {p === 'all' ? t('opt.all') : p === 'high' ? t('opt.high') : p === 'medium' ? t('opt.med') : t('opt.low')}
                    </button>
                  ))}
                </div>
              </div>

              {getFilteredInsights().length === 0 ? (
                <div className="opt-empty-state">
                  <CheckCircle sx={{ fontSize: 48, color: '#10b981' }} />
                  <h3>{t('opt.allGood')}</h3>
                  <p>{t('opt.noIssues')}</p>
                </div>
              ) : (
                <div className="opt-insights-grid">
                  {getFilteredInsights().map((insight, index) => {
                    const cat = getCategoryConfig(insight.type);
                    const prio = getPriorityColor(insight.priority);
                    const isExpanded = expandedCard === `insight-${index}`;

                    return (
                      <div key={index} className={`opt-insight-card ${isExpanded ? 'expanded' : ''}`}
                        onClick={() => setExpandedCard(isExpanded ? null : `insight-${index}`)}>
                        <div className="opt-insight-header">
                          <div className="opt-insight-icon" style={{ background: cat.bg, border: `1px solid ${cat.border}`, color: cat.text }}>
                            {cat.icon}
                          </div>
                          <div className="opt-insight-meta">
                            <span className="opt-priority-badge" style={{ background: prio.bg, color: prio.text, border: `1px solid ${prio.border}` }}>
                              {prio.icon}
                              {insight.priority === 'high' ? t('opt.high') : insight.priority === 'medium' ? t('opt.med') : t('opt.low')}
                            </span>
                            <span className="opt-category-tag" style={{ color: cat.text }}>{insight.type}</span>
                          </div>
                          <ChevronRight sx={{ fontSize: 18, color: '#94a3b8', className: `opt-chevron ${isExpanded ? 'rotated' : ''}` }} />
                        </div>
                        <h3 className="opt-insight-title">{insight.title}</h3>
                        <p className="opt-insight-desc">{insight.description}</p>

                        {isExpanded && (
                          <div className="opt-insight-detail" onClick={(e) => e.stopPropagation()}>
                            {insight.currentValue && insight.suggestedValue && (
                              <div className="opt-comparison-grid">
                                <div className="opt-comparison-box">
                                  <div className="opt-comparison-label">Current</div>
                                  <div className="opt-comparison-value">{insight.currentValue}</div>
                                </div>
                                <ArrowForward sx={{ fontSize: 16, color: '#94a3b8' }} />
                                <div className="opt-comparison-box opt-comparison-target">
                                  <div className="opt-comparison-label">Target</div>
                                  <div className="opt-comparison-value">{insight.suggestedValue}</div>
                                </div>
                              </div>
                            )}
                            {insight.potentialImpact && (
                              <div className="opt-impact">
                                <TrendingUp sx={{ fontSize: 14, color: '#0ea5e9' }} />
                                <span>{insight.potentialImpact}</span>
                              </div>
                            )}
                            <button className="opt-action-btn" onClick={() => handleActionClick(insight)}>
                              {insight.actionLabel || t('opt.takeAction')}
                              <ArrowForward sx={{ fontSize: 14 }} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Competitive */}
          {activeSection === 'competitive' && (
            <div className="opt-section">
              <div className="opt-section-header">
                <div>
                  <h2 className="opt-section-title">{t('opt.competitive')}</h2>
                  <p className="opt-section-subtitle">{t('opt.marketInsights')}</p>
                </div>
              </div>
              {seoReport.competitiveInsights && seoReport.competitiveInsights.length > 0 ? (
                <div className="opt-comp-list">
                  {seoReport.competitiveInsights.map((insight, index) => {
                    const prio = getPriorityColor(insight.priority);
                    return (
                      <div key={index} className="opt-comp-card">
                        <div className="opt-comp-header">
                          <div className="opt-comp-icon"><EmojiEvents sx={{ fontSize: 22, color: '#d97706' }} /></div>
                          <span className="opt-priority-badge" style={{ background: prio.bg, color: prio.text, border: `1px solid ${prio.border}` }}>
                            {prio.icon}
                            {insight.priority === 'high' ? t('opt.high') : insight.priority === 'medium' ? t('opt.med') : t('opt.low')}
                          </span>
                        </div>
                        <h3 className="opt-comp-title">{insight.title}</h3>
                        <p className="opt-comp-desc">{insight.description}</p>
                        {insight.actionSteps && insight.actionSteps.length > 0 && (
                          <div className="opt-steps">
                            <div className="opt-steps-title">{t('opt.actionSteps')}</div>
                            {insight.actionSteps.map((step, si) => (
                              <div key={si} className="opt-step-item">
                                <span className="opt-step-num">{si + 1}</span>
                                <span>{step}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="opt-empty-state">
                  <EmojiEvents sx={{ fontSize: 48, color: '#cbd5e1' }} />
                  <h3>{t('opt.marketData')}</h3>
                  <p>{t('opt.competitiveGenerated')}</p>
                </div>
              )}
            </div>
          )}

          {/* Quick Wins */}
          {activeSection === 'quickwins' && (
            <div className="opt-section">
              <div className="opt-section-header">
                <div>
                  <h2 className="opt-section-title">{t('opt.quickWins')}</h2>
                  <p className="opt-section-subtitle">{t('opt.highImpactLowEffort')}</p>
                </div>
              </div>
              {seoReport.quickWins && seoReport.quickWins.length > 0 ? (
                <div className="opt-qw-grid">
                  {seoReport.quickWins.map((win, index) => (
                    <div key={index} className="opt-qw-card">
                      <div className="opt-qw-card-header">
                        <span className="opt-qw-card-num" style={{ background: '#1e3a5f' }}>{index + 1}</span>
                        {win.impact && (
                          <span className={`opt-qw-impact ${win.impact}`}>{win.impact} Impact</span>
                        )}
                      </div>
                      <p className="opt-qw-card-action">{win.action}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="opt-empty-state">
                  <LocalFireDepartment sx={{ fontSize: 48, color: '#cbd5e1' }} />
                  <h3>{t('opt.noQuickWins')}</h3>
                  <p>{t('opt.quickWinsAppear')}</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {!seoReport && !seoLoading && (
        <div className="opt-landing">
          <div className="opt-landing-grid">
            {[
              { icon: <Image sx={{ fontSize: 22 }} />, label: t('opt.photos') },
              { icon: <Star sx={{ fontSize: 22 }} />, label: t('opt.reviews') },
              { icon: <Description sx={{ fontSize: 22 }} />, label: t('opt.description') },
              { icon: <AccessTime sx={{ fontSize: 22 }} />, label: t('opt.hours') },
              { icon: <Phone sx={{ fontSize: 22 }} />, label: t('opt.contact') },
              { icon: <Verified sx={{ fontSize: 22 }} />, label: t('opt.verification') },
            ].map((item, i) => (
              <div key={i} className="opt-landing-item">
                <span className="opt-landing-icon">{item.icon}</span>
                <span className="opt-landing-label">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .opt-app-loader-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: calc(100vh - 200px);
        }

        .opt-container { padding: 24px 24px 24px 280px; max-width: 100%; overflow-x: hidden; box-sizing: border-box; }
        @media (max-width: 1023px) { .opt-container { padding-left: 24px; } }

        .opt-header {
          display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;
        }
        .opt-header-left { display: flex; align-items: center; gap: 14px; }
        .opt-header-icon {
          width: 48px; height: 48px; background: var(--color-primary); border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
        }
        .opt-title {
          font-family: var(--font-headline); font-size: 22px; font-weight: 700;
          color: var(--color-text-primary); letter-spacing: -0.02em; margin: 0;
        }
        .opt-subtitle { font-size: 13px; color: var(--color-text-muted); margin: 2px 0 0; }

        .opt-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 10px 18px; font-size: 14px; font-weight: 600;
          border-radius: 8px; border: none; cursor: pointer; transition: all 0.15s ease;
        }
        .opt-btn-solid { background: var(--color-primary); color: var(--color-on-primary); }
        .opt-btn-solid:hover { background: #162d4d; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(30,58,95,0.3); }
        .opt-btn-outline { background: white; color: #1e3a5f; border: 1px solid #e2e8f0; }
        .opt-btn-outline:hover { background: var(--color-surface); border-color: var(--color-primary); }
        .opt-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }
        .opt-btn-spinner {
          width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white;
          border-radius: 999px; animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .opt-error {
          display: flex; align-items: center; gap: 10px; padding: 12px 16px;
          background: #fef2f2; color: #dc2626; border-radius: 8px; font-size: 14px;
          font-weight: 500; margin-bottom: 16px;
        }

        .opt-analyzing {
          display: flex; flex-direction: column; align-items: center;
          padding: 64px 24px; gap: 32px; text-align: center;
        }
        .opt-analyzing-orb {
          position: relative; width: 120px; height: 120px;
        }
        .opt-analyzing-ring1 {
          position: absolute; inset: 0; border-radius: 999px;
          border: 2px solid rgba(30,58,95,0.15);
          animation: pulse-ring 2s ease-out infinite;
        }
        .opt-analyzing-ring2 {
          position: absolute; inset: 12px; border-radius: 999px;
          border: 2px solid rgba(30,58,95,0.25);
          animation: pulse-ring 2s ease-out infinite 0.5s;
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.9); opacity: 1; }
          100% { transform: scale(1.2); opacity: 0; }
        }
        .opt-analyzing-core {
          position: absolute; inset: 28px; background: #1e3a5f; border-radius: 999px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 32px rgba(30,58,95,0.4);
        }
        .opt-analyzing-text h3 {
          font-family: var(--font-headline); font-size: 20px; font-weight: 700;
          color: #0f172a; margin: 0 0 8px;
        }
        .opt-analyzing-text p { font-size: 14px; color: #64748b; margin: 0 0 20px; }
        .opt-analyzing-steps { display: flex; flex-direction: column; gap: 8px; align-items: flex-start; }
        .opt-step {
          display: flex; align-items: center; gap: 8px; font-size: 13px; color: #475569;
          animation: fadeInUp 0.3s ease both;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .opt-tabs {
          display: flex; gap: 4px; background: white; border: 1px solid #e2e8f0;
          border-radius: 10px; padding: 4px; margin-bottom: 24px;
        }
        .opt-tab {
          display: flex; align-items: center; gap: 6px; padding: 8px 14px;
          font-size: 13px; font-weight: 500; border: none; border-radius: 7px;
          cursor: pointer; background: transparent; color: #64748b; transition: all 0.15s ease;
        }
        .opt-tab:hover { background: var(--color-surface); color: var(--color-primary); }
        .opt-tab.active { background: #1e3a5f; color: white; }
        .opt-tab-count {
          font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 999px;
          background: rgba(0,0,0,0.1);
        }
        .opt-tab.active .opt-tab-count { background: rgba(255,255,255,0.2); }

        .opt-overview { display: flex; flex-direction: column; gap: 20px; }

        .opt-score-card {
          display: flex; align-items: center; gap: 32px; padding: 28px 32px;
          border: 1px solid; border-radius: 16px;
        }
        @media (max-width: 640px) {
          .opt-score-card { flex-direction: column; text-align: center; }
        }
        .opt-score-ring-container {
          position: relative; width: 140px; height: 140px; flex-shrink: 0;
        }
        .opt-score-svg { width: 100%; height: 100%; transform: rotate(-90deg); }
        .opt-score-progress {
          transition: stroke-dasharray 1s ease;
        }
        .opt-score-value {
          position: absolute; inset: 0; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
        }
        .opt-score-number {
          font-family: var(--font-headline); font-size: 40px; font-weight: 800;
          line-height: 1; letter-spacing: -0.03em;
        }
        .opt-score-denom { font-size: 12px; color: #94a3b8; font-weight: 500; }
        .opt-score-label {
          font-family: var(--font-headline); font-size: 18px; font-weight: 700;
          margin-bottom: 8px;
        }
        .opt-score-summary { font-size: 14px; color: #475569; line-height: 1.6; margin: 0; max-width: 480px; }
        .opt-score-meta {
          display: flex; align-items: center; gap: 8px; margin-top: 12px;
          font-size: 12px; color: #64748b;
        }
        .opt-score-meta-dot { width: 3px; height: 3px; background: #cbd5e1; border-radius: 999px; }

        .opt-quick-stats {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
        }
        @media (max-width: 900px) { .opt-quick-stats { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 480px) { .opt-quick-stats { grid-template-columns: 1fr; } }
        .opt-stat-card {
          display: flex; align-items: center; gap: 14px; padding: 16px;
          background: white; border: 1px solid #e2e8f0; border-radius: 12px;
          transition: all 0.15s ease;
        }
        .opt-stat-card:hover { border-color: #cbd5e1; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
        .opt-stat-icon {
          width: 44px; height: 44px; border-radius: 10px; display: flex;
          align-items: center; justify-content: center; flex-shrink: 0;
        }
        .opt-stat-value {
          font-family: var(--font-headline); font-size: 24px; font-weight: 700; color: #0f172a;
        }
        .opt-stat-label { font-size: 12px; color: #94a3b8; }

        .opt-qw-preview {
          background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px;
        }
        .opt-qw-header {
          display: flex; align-items: center; gap: 12px; margin-bottom: 16px;
        }
        .opt-qw-icon {
          width: 40px; height: 40px; background: #fff7ed; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
        }
        .opt-qw-title { font-family: var(--font-headline); font-size: 15px; font-weight: 600; color: #0f172a; }
        .opt-qw-subtitle { font-size: 11px; color: #94a3b8; }
        .opt-qw-link {
          margin-left: auto; font-size: 12px; color: #1e3a5f; font-weight: 600;
          background: none; border: none; cursor: pointer; white-space: nowrap;
        }
        .opt-qw-link:hover { text-decoration: underline; }
        .opt-qw-list { display: flex; flex-direction: column; gap: 8px; }
        .opt-qw-item {
          display: flex; align-items: center; gap: 10px; padding: 10px 12px;
          background: var(--color-surface); border-radius: 8px;
        }
        .opt-qw-num {
          width: 24px; height: 24px; background: #ea580c; color: white;
          border-radius: 999px; display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; flex-shrink: 0;
        }
        .opt-qw-action { flex: 1; font-size: 13px; color: #334155; }
        .opt-qw-impact {
          font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.04em;
        }
        .opt-qw-impact.high { background: #fef2f2; color: #dc2626; }
        .opt-qw-impact.medium { background: #fffbeb; color: #d97706; }
        .opt-qw-impact.low { background: #f0fdf4; color: #16a34a; }

        .opt-section { }
        .opt-section-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          margin-bottom: 20px; flex-wrap: wrap; gap: 12px;
        }
        .opt-section-title {
          font-family: var(--font-headline); font-size: 18px; font-weight: 700; color: #0f172a; margin: 0;
        }
        .opt-section-subtitle { font-size: 13px; color: #94a3b8; margin: 4px 0 0; }

        .opt-filter-group { display: flex; gap: 4px; }
        .opt-filter-btn {
          padding: 5px 12px; font-size: 12px; font-weight: 600; border: 1px solid #e2e8f0;
          border-radius: 6px; cursor: pointer; background: white; color: #64748b; transition: all 0.15s ease;
        }
        .opt-filter-btn:hover { border-color: #94a3b8; }
        .opt-filter-btn.active { color: white; border-color: transparent; }
        .opt-filter-btn.all.active { background: #1e3a5f; }
        .opt-filter-btn.high.active { background: #dc2626; }
        .opt-filter-btn.medium.active { background: #d97706; }
        .opt-filter-btn.low.active { background: #0284c7; }

        .opt-empty-state {
          display: flex; flex-direction: column; align-items: center; padding: 64px 24px;
          text-align: center;
        }
        .opt-empty-state h3 {
          font-family: var(--font-headline); font-size: 18px; font-weight: 600;
          color: #0f172a; margin: 16px 0 8px;
        }
        .opt-empty-state p { font-size: 13px; color: #94a3b8; margin: 0; }

        .opt-insights-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 12px;
        }
        @media (max-width: 640px) { .opt-insights-grid { grid-template-columns: 1fr; } }
        .opt-insight-card {
          background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px;
          cursor: pointer; transition: all 0.2s ease;
        }
        .opt-insight-card:hover { border-color: #94a3b8; box-shadow: 0 2px 12px rgba(0,0,0,0.04); }
        .opt-insight-card.expanded { border-color: #1e3a5f; box-shadow: 0 0 0 3px rgba(30,58,95,0.08); }
        .opt-insight-header {
          display: flex; align-items: center; gap: 10px; margin-bottom: 12px;
        }
        .opt-insight-icon {
          width: 38px; height: 38px; border-radius: 8px; display: flex;
          align-items: center; justify-content: center; flex-shrink: 0;
        }
        .opt-insight-meta { display: flex; align-items: center; gap: 6px; flex: 1; flex-wrap: wrap; }
        .opt-priority-badge {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600;
        }
        .opt-category-tag { font-size: 11px; color: #64748b; }
        .opt-chevron { transition: transform 0.2s ease; }
        .opt-chevron.rotated { transform: rotate(90deg); }
        .opt-insight-title {
          font-family: var(--font-headline); font-size: 15px; font-weight: 600; color: #0f172a; margin: 0 0 6px;
        }
        .opt-insight-desc { font-size: 13px; color: #64748b; line-height: 1.5; margin: 0; }

        .opt-insight-detail { border-top: 1px solid #f1f5f9; margin-top: 14px; padding-top: 14px; }
        .opt-comparison-grid {
          display: flex; align-items: center; gap: 12px; margin-bottom: 12px;
        }
        .opt-comparison-box {
          flex: 1; padding: 10px 12px; background: var(--color-surface); border-radius: 8px;
        }
        .opt-comparison-target { background: #eff6ff; }
        .opt-comparison-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 4px; }
        .opt-comparison-value { font-size: 13px; font-weight: 600; color: #0f172a; }
        .opt-impact {
          display: flex; align-items: center; gap: 6px; padding: 10px 12px;
          background: #f0f9ff; border-radius: 8px; margin-bottom: 12px;
          font-size: 12px; color: #0369a1;
        }
        .opt-action-btn {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          width: 100%; padding: 10px; background: #1e3a5f; color: white;
          border: none; border-radius: 8px; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.15s ease;
        }
        .opt-action-btn:hover { background: #162d4d; }

        .opt-comp-list { display: flex; flex-direction: column; gap: 12px; }
        .opt-comp-card {
          background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px;
        }
        .opt-comp-header {
          display: flex; align-items: center; gap: 10px; margin-bottom: 12px;
        }
        .opt-comp-icon {
          width: 44px; height: 44px; background: #fffbeb; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
        }
        .opt-comp-title {
          font-family: var(--font-headline); font-size: 16px; font-weight: 600; color: #0f172a; margin: 0 0 6px;
        }
        .opt-comp-desc { font-size: 13px; color: #64748b; line-height: 1.5; margin: 0 0 14px; }
        .opt-steps { background: var(--color-surface); border-radius: 8px; padding: 14px; }
        .opt-steps-title {
          font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
          color: #94a3b8; margin-bottom: 10px;
        }
        .opt-step-item {
          display: flex; align-items: flex-start; gap: 10px; margin-bottom: 8px; font-size: 13px; color: #334155;
        }
        .opt-step-item:last-child { margin-bottom: 0; }
        .opt-step-num {
          width: 20px; height: 20px; background: #e2e8f0; color: #475569;
          border-radius: 999px; display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 700; flex-shrink: 0;
        }

        .opt-qw-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px;
        }
        .opt-qw-card {
          background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px;
        }
        .opt-qw-card-header {
          display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;
        }
        .opt-qw-card-num {
          width: 32px; height: 32px; border-radius: 8px; color: white;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 700;
        }
        .opt-qw-card-action { font-size: 14px; color: #334155; line-height: 1.5; margin: 0; }

        .opt-landing {
          padding: 48px 24px; text-align: center;
          background: white; border: 1px solid #e2e8f0; border-radius: 16px;
        }
        .opt-landing-grid {
          display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; max-width: 480px; margin: 0 auto;
        }
        .opt-landing-item {
          display: flex; align-items: center; gap: 8px; padding: 10px 16px;
          background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 8px;
        }
        .opt-landing-icon { color: #1e3a5f; }
        .opt-landing-label { font-size: 13px; font-weight: 500; color: #334155; }
      `}</style>
    </div>
  );
}
