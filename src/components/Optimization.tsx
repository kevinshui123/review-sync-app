import React, { useState, useEffect, useCallback } from 'react';
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
  FilterList,
  EmojiEvents,
  TrendingDown,
  Store,
} from '@mui/icons-material';
import { apiGet, apiPost } from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';

function getScoreColor(score: number) {
  if (score >= 80) return { color: '#22c55e', label: 'Excellent', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', gradient: 'from-green-500 to-emerald-600' };
  if (score >= 60) return { color: '#f59e0b', label: 'Good', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', gradient: 'from-amber-500 to-orange-600' };
  if (score >= 40) return { color: '#f97316', label: 'Fair', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', gradient: 'from-orange-500 to-red-600' };
  return { color: '#ef4444', label: 'Needs Work', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', gradient: 'from-red-500 to-pink-600' };
}

function getPriorityColor(priority: string) {
  switch (priority.toLowerCase()) {
    case 'high':
    case 'critical':
      return { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', icon: <Warning className="w-4 h-4" /> };
    case 'medium':
      return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', icon: <Info className="w-4 h-4" /> };
    case 'low':
    default:
      return { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', icon: <Lightbulb className="w-4 h-4" /> };
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'excellent':
    case 'good':
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'fair':
      return <TrendingUp className="w-5 h-5 text-amber-500" />;
    case 'poor':
    default:
      return <TrendingDown className="w-5 h-5 text-red-500" />;
  }
}

interface BusinessInfo {
  name: string;
  address: string;
  phone: string;
  website: string;
  category: string;
  keywords: string;
  hours: Record<string, string>;
  lat?: number;
  lng?: number;
}

interface Insight {
  type: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  currentValue?: string;
  suggestedValue?: string;
  actionType: string;
  actionLabel?: string;
  potentialImpact?: string;
}

interface CompetitiveInsight {
  title: string;
  description: string;
  actionSteps?: string[];
  priority: 'high' | 'medium' | 'low';
}

interface QuickWin {
  action: string;
  impact?: string;
  effort?: string;
  actionType?: string;
}

interface SEOReport {
  overallScore: number;
  overallSummary: string;
  insights: Insight[];
  competitiveInsights: CompetitiveInsight[];
  quickWins: QuickWin[];
  _raw?: {
    listingsCount: number;
    metricsAvailable: boolean;
    reviewsAvailable: number;
  };
}

export function Optimization() {
  const { t, language } = useLanguage();
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [seoReport, setSeoReport] = useState<SEOReport | null>(() => {
    try {
      const saved = localStorage.getItem('seo_report');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [seoLoading, setSeoLoading] = useState(false);
  const [seoError, setSeoError] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'overview' | 'insights' | 'competitive' | 'quickwins'>('overview');

  useEffect(() => {
    if (seoReport) {
      localStorage.setItem('seo_report', JSON.stringify(seoReport));
    }
  }, [seoReport]);

  const generateSeoReport = useCallback(async () => {
    setSeoLoading(true);
    setSeoError(null);
    try {
      const res = await apiPost('/api/reports/seo-optimization', { lang: language });
      if (res.ok) {
        const data = await res.json();
        setSeoReport(data);
      } else {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        setSeoError(err.error || 'Failed to generate report');
      }
    } catch (e: any) {
      setSeoError(e.message || 'Network error');
    } finally {
      setSeoLoading(false);
    }
  }, [language]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const locationsRes = await apiGet('/api/embedsocial/locations');
        let locations: any[] = [];
        if (locationsRes.ok) {
          locations = await locationsRes.json();
        }
        const hasCoords = locations.some((l: any) => l.latitude || l.lat);
        if (locations.length > 0 && !hasCoords) {
          try {
            const backfillRes = await apiPost('/api/embedsocial/listings/backfill-coordinates');
            if (backfillRes.ok) {
              const refreshed = await apiGet('/api/embedsocial/locations');
              if (refreshed.ok) locations = await refreshed.json();
            }
          } catch (e) {
            console.warn('[Optimization] Backfill failed:', e);
          }
        }
        const primary = locations[0];
        if (primary) {
          setBusinessInfo({
            name: primary.name || 'Business',
            address: primary.address || '',
            phone: primary.phoneNumber || primary.phone || '',
            website: primary.websiteUrl || '',
            category: primary.category || '',
            keywords: 'restaurant, mini bowl, asian food',
            hours: {},
            lat: primary.latitude || primary.lat,
            lng: primary.longitude || primary.lng,
          });
        } else {
          setBusinessInfo({
            name: 'Mahjong mini bowl-Baltimore',
            address: '3105 saint pual st, unit A, Baltimore, 21218, US',
            phone: '(443) 869-2177',
            website: 'https://mahjong-box.com/',
            category: 'Restaurant',
            keywords: 'Asian Food, Mini Bowl, Noodles, Dumplings',
            hours: {
              Monday: '11 am - 8 pm', Tuesday: '11 am - 8 pm', Wednesday: '11 am - 8 pm',
              Thursday: '11 am - 8 pm', Friday: '11 am - 8 pm', Saturday: '11 am - 8 pm', Sunday: '11 am - 8 pm',
            },
            lat: 39.3305, lng: -76.6150,
          });
        }
      } catch (error) {
        console.error('Failed to fetch optimization data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getCategoryIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'photos':
      case 'photo':
        return <PhotoCamera className="w-5 h-5" />;
      case 'reviews':
      case 'review':
        return <Star className="w-5 h-5" />;
      case 'description':
      case 'business description':
        return <Description className="w-5 h-5" />;
      case 'hours':
      case 'business hours':
        return <AccessTime className="w-5 h-5" />;
      case 'contact':
      case 'phone':
        return <Phone className="w-5 h-5" />;
      case 'website':
      case 'links':
        return <Language className="w-5 h-5" />;
      case 'location':
      case 'address':
        return <Map className="w-5 h-5" />;
      case 'categories':
        return <Verified className="w-5 h-5" />;
      case 'citations':
        return <Store className="w-5 h-5" />;
      default:
        return <Lightbulb className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'photos':
      case 'photo':
        return { bg: 'from-pink-500 to-rose-500', text: 'text-rose-600', bgLight: 'bg-rose-50' };
      case 'reviews':
      case 'review':
        return { bg: 'from-amber-500 to-orange-500', text: 'text-orange-600', bgLight: 'bg-orange-50' };
      case 'description':
      case 'business description':
        return { bg: 'from-blue-500 to-indigo-500', text: 'text-indigo-600', bgLight: 'bg-indigo-50' };
      case 'hours':
      case 'business hours':
        return { bg: 'from-purple-500 to-violet-500', text: 'text-violet-600', bgLight: 'bg-violet-50' };
      case 'contact':
      case 'phone':
        return { bg: 'from-cyan-500 to-teal-500', text: 'text-teal-600', bgLight: 'bg-teal-50' };
      case 'website':
      case 'links':
        return { bg: 'from-emerald-500 to-green-500', text: 'text-green-600', bgLight: 'bg-green-50' };
      case 'attributes':
      case 'categories':
        return { bg: 'from-fuchsia-500 to-pink-500', text: 'text-pink-600', bgLight: 'bg-pink-50' };
      default:
        return { bg: 'from-slate-500 to-gray-500', text: 'text-slate-600', bgLight: 'bg-slate-50' };
    }
  };

  const getActionTypeIcon = (actionType: string) => {
    switch (actionType) {
      case 'editable':
        return <Edit className="w-4 h-4" />;
      case 'citation':
        return <Store className="w-4 h-4" />;
      case 'content':
        return <Description className="w-4 h-4" />;
      case 'review':
        return <Star className="w-4 h-4" />;
      default:
        return <ArrowForward className="w-4 h-4" />;
    }
  };

  const getFilteredInsights = () => {
    if (!seoReport?.insights) return [];
    return seoReport.insights.filter(insight => {
      const priorityMatch = filterPriority === 'all' || insight.priority.toLowerCase() === filterPriority.toLowerCase();
      return priorityMatch;
    });
  };

  const filteredInsights = getFilteredInsights();

  const handleActionClick = (insight: Insight) => {
    if (insight.actionType === 'review') {
      window.dispatchEvent(new CustomEvent('navigate-tab', { detail: { tab: 'seo-real-comment' } }));
    } else {
      window.dispatchEvent(new CustomEvent('navigate-tab', { detail: { tab: 'listings', subTab: 'edit' } }));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-slate-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
        </div>
        <p className="text-sm text-slate-500 font-medium">加载中...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-md">
              <AutoAwesome className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">SEO 优化中心</h1>
              <p className="text-slate-500 mt-1">{businessInfo?.name}</p>
            </div>
          </div>
          <button
            onClick={generateSeoReport}
            disabled={seoLoading}
            className={`flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-2xl transition-all duration-300 shadow-lg ${
              seoReport
                ? 'bg-white border-2 border-primary text-primary hover:bg-blue-50'
                : 'bg-primary text-white hover:opacity-90'
            } disabled:opacity-50`}
          >
            {seoLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                AI 分析中...
              </>
            ) : seoReport ? (
              <>
                <Refresh className="w-5 h-5" />
                重新分析
              </>
            ) : (
              <>
                <AutoAwesome className="w-5 h-5" />
                立即分析
              </>
            )}
          </button>
        </div>
      </div>

      {seoError && (
        <div className="mb-6 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
          <ErrorIcon className="w-5 h-5 text-red-500" />
          <span className="text-red-700 font-medium">{seoError}</span>
        </div>
      )}

      {seoReport && !seoLoading && (
        <>
          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mb-6 bg-slate-100 p-1 rounded-2xl w-fit">
            {[
              { id: 'overview', label: '总览', icon: <Speed className="w-4 h-4" /> },
              { id: 'insights', label: '优化建议', icon: <Lightbulb className="w-4 h-4" />, count: seoReport.insights?.length || 0 },
              { id: 'competitive', label: '竞争分析', icon: <EmojiEvents className="w-4 h-4" />, count: seoReport.competitiveInsights?.length || 0 },
              { id: 'quickwins', label: '快速见效', icon: <LocalFireDepartment className="w-4 h-4" />, count: seoReport.quickWins?.length || 0 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeSection === tab.id
                    ? 'bg-white text-primary shadow-md'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    activeSection === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Overview Section */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              {/* Main Score Card */}
              <div className={`rounded-3xl p-8 border ${getScoreColor(seoReport.overallScore).border} ${getScoreColor(seoReport.overallScore).bg}`}>
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="relative w-40 h-40 flex-shrink-0">
                    <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                      <circle cx="60" cy="60" r="52" fill="none" stroke="#e2e8f0" strokeWidth="12" />
                      <circle
                        cx="60" cy="60" r="52" fill="none"
                        stroke={getScoreColor(seoReport.overallScore).color}
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={`${(seoReport.overallScore / 100) * 327} 327`}
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-extrabold" style={{ color: getScoreColor(seoReport.overallScore).color }}>
                        {seoReport.overallScore}
                      </span>
                      <span className="text-xs text-slate-400">/ 100</span>
                    </div>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                      {getScoreColor(seoReport.overallScore).label === 'Excellent' && <EmojiEvents className="w-6 h-6 text-green-500" />}
                      <span className={`text-lg font-bold ${getScoreColor(seoReport.overallScore).text}`}>
                        {getScoreColor(seoReport.overallScore).label}
                      </span>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-lg">{seoReport.overallSummary}</p>
                    {seoReport._raw && (
                      <div className="flex items-center gap-4 mt-4 text-sm text-slate-500">
                        <span>{seoReport._raw.listingsCount} 个 listings</span>
                        <span>|</span>
                        <span>{seoReport._raw.reviewsAvailable} 条评论</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                      <Lightbulb className="w-5 h-5 text-blue-500" />
                    </div>
                    <span className="text-sm font-medium text-slate-500">优化建议</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-800">{seoReport.insights?.length || 0}</div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center">
                      <LocalFireDepartment className="w-5 h-5 text-amber-500" />
                    </div>
                    <span className="text-sm font-medium text-slate-500">快速见效</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-800">{seoReport.quickWins?.length || 0}</div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                      <EmojiEvents className="w-5 h-5 text-blue-500" />
                    </div>
                    <span className="text-sm font-medium text-slate-500">竞争洞察</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-800">{seoReport.competitiveInsights?.length || 0}</div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-100 to-red-50 flex items-center justify-center">
                      <Warning className="w-5 h-5 text-red-500" />
                    </div>
                    <span className="text-sm font-medium text-slate-500">高优先级</span>
                  </div>
                  <div className="text-2xl font-bold text-red-600">
                    {seoReport.insights?.filter(i => i.priority === 'high').length || 0}
                  </div>
                </div>
              </div>

              {/* Quick Wins Preview */}
              {seoReport.quickWins && seoReport.quickWins.length > 0 && (
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-3xl p-6 border border-orange-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                      <LocalFireDepartment className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">快速见效建议</h3>
                      <p className="text-xs text-slate-500">高Impact，低Effort的行动</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {seoReport.quickWins.slice(0, 3).map((win, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-white/70 rounded-xl">
                        <span className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-sm text-slate-700">{win.action}</p>
                      </div>
                    ))}
                  </div>
          <button
            onClick={() => setActiveSection('quickwins')}
            className="mt-4 text-sm text-blue-600 font-medium hover:underline"
          >
                      查看全部 {seoReport.quickWins.length} 项 →
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Insights Section */}
          {activeSection === 'insights' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">优化建议</h2>
                  <p className="text-sm text-slate-500 mt-1">基于AI分析的具体优化方案</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">优先级:</span>
                  {['all', 'high', 'medium', 'low'].map((p) => (
                    <button
                      key={p}
                      onClick={() => setFilterPriority(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        filterPriority === p
                          ? p === 'high' ? 'bg-red-500 text-white' :
                            p === 'medium' ? 'bg-amber-500 text-white' :
                            p === 'low' ? 'bg-blue-500 text-white' : 'bg-primary text-white'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {p === 'all' ? '全部' : p === 'high' ? '高' : p === 'medium' ? '中' : '低'}
                    </button>
                  ))}
                </div>
              </div>

              {filteredInsights.length === 0 ? (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-12 border border-green-200 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/30">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">太棒了！</h3>
                  <p className="text-slate-500 max-w-md mx-auto">
                    根据当前筛选条件，没有发现需要优化的问题。继续保持！
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredInsights.map((insight, index) => {
                    const priorityStyle = getPriorityColor(insight.priority);
                    const categoryStyle = getCategoryColor(insight.type);
                    const isExpanded = expandedCard === `insight-${index}`;

                    return (
                      <div
                        key={index}
                        className={`bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 ${
                          isExpanded ? 'ring-2 ring-blue-500/30' : ''
                        }`}
                      >
                        <div
                          className="p-6 cursor-pointer"
                          onClick={() => setExpandedCard(isExpanded ? null : `insight-${index}`)}
                        >
                          <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${categoryStyle.bg} flex items-center justify-center shadow-sm flex-shrink-0`}>
                              <span className={categoryStyle.text}>
                                {getCategoryIcon(insight.type)}
                              </span>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${priorityStyle.bg} ${priorityStyle.text} flex items-center gap-1`}>
                                  {priorityStyle.icon}
                                  {insight.priority === 'high' ? '高优先级' : insight.priority === 'medium' ? '中优先级' : '低优先级'}
                                </span>
                                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${categoryStyle.bgLight} ${categoryStyle.text}`}>
                                  {insight.type}
                                </span>
                              </div>
                              <h3 className="text-lg font-bold text-slate-900 mb-1">{insight.title}</h3>
                              <p className="text-sm text-slate-500 leading-relaxed">{insight.description}</p>
                            </div>

                            <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform duration-300 flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="px-6 pb-6 border-t border-slate-100 pt-4">
                            {insight.currentValue && insight.suggestedValue && (
                              <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="bg-slate-50 rounded-xl p-4">
                                  <div className="text-xs text-slate-400 font-medium mb-1">当前状态</div>
                                  <div className="text-sm font-semibold text-slate-700">{insight.currentValue}</div>
                                </div>
                                <div className="bg-blue-50 rounded-xl p-4">
                                  <div className="text-xs text-blue-400 font-medium mb-1">建议目标</div>
                                  <div className="text-sm font-semibold text-blue-700">{insight.suggestedValue}</div>
                                </div>
                              </div>
                            )}

                            {insight.potentialImpact && (
                              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-4 border border-blue-100">
                                <div className="flex items-center gap-2 mb-2">
                                  <TrendingUp className="w-4 h-4 text-blue-500" />
                                  <span className="text-xs font-bold text-blue-600">潜在影响</span>
                                </div>
                                <p className="text-sm text-slate-700">{insight.potentialImpact}</p>
                              </div>
                            )}

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleActionClick(insight);
                              }}
                              className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-all w-full justify-center"
                            >
                              {getActionTypeIcon(insight.actionType)}
                              {insight.actionLabel || '采取行动'}
                              <ArrowForward className="w-4 h-4" />
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

          {/* Competitive Insights Section */}
          {activeSection === 'competitive' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">竞争分析</h2>
                <p className="text-sm text-slate-500 mt-1">了解竞争对手，抓住市场机会</p>
              </div>

              {seoReport.competitiveInsights && seoReport.competitiveInsights.length > 0 ? (
                <div className="space-y-4">
                  {seoReport.competitiveInsights.map((insight, index) => {
                    const priorityStyle = getPriorityColor(insight.priority);

                    return (
                      <div
                        key={index}
                        className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all"
                      >
                        <div className="p-6">
                          <div className="flex items-start gap-4 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-100 to-orange-100 flex items-center justify-center flex-shrink-0">
                              <EmojiEvents className="w-6 h-6 text-yellow-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${priorityStyle.bg} ${priorityStyle.text} flex items-center gap-1`}>
                                  {priorityStyle.icon}
                                  {insight.priority === 'high' ? '高优先级' : insight.priority === 'medium' ? '中优先级' : '低优先级'}
                                </span>
                              </div>
                              <h3 className="text-lg font-bold text-slate-900">{insight.title}</h3>
                              <p className="text-sm text-slate-500 mt-1">{insight.description}</p>
                            </div>
                          </div>

                          {insight.actionSteps && insight.actionSteps.length > 0 && (
                            <div className="bg-slate-50 rounded-xl p-4">
                              <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                <ArrowForward className="w-4 h-4" />
                                行动步骤
                              </h4>
                              <div className="space-y-2">
                                {insight.actionSteps.map((step, stepIndex) => (
                                  <div key={stepIndex} className="flex items-start gap-3">
                                    <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                      {stepIndex + 1}
                                    </span>
                                    <span className="text-sm text-slate-600">{step}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-slate-50 rounded-3xl p-12 border border-slate-200 text-center">
                  <EmojiEvents className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-700 mb-2">暂无竞争分析数据</h3>
                  <p className="text-sm text-slate-500">系统将在下次分析时生成竞争洞察</p>
                </div>
              )}
            </div>
          )}

          {/* Quick Wins Section */}
          {activeSection === 'quickwins' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">快速见效</h2>
                <p className="text-sm text-slate-500 mt-1">高Impact、低Effort的优化行动</p>
              </div>

              {seoReport.quickWins && seoReport.quickWins.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {seoReport.quickWins.map((win, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-100 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-sm">
                          <span className="text-white font-bold text-lg">{index + 1}</span>
                        </div>
                        {win.impact && (
                          <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                            win.impact === 'high' ? 'bg-green-100 text-green-600' :
                            win.impact === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {win.impact === 'high' ? '高Impact' : win.impact === 'medium' ? '中Impact' : '低Impact'}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-700 font-medium leading-relaxed">{win.action}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-50 rounded-3xl p-12 border border-slate-200 text-center">
                  <LocalFireDepartment className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-700 mb-2">暂无快速见效建议</h3>
                  <p className="text-sm text-slate-500">系统将在下次分析时生成快速见效建议</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {!seoReport && !seoLoading && (
        <div className="bg-slate-50 rounded-3xl p-16 border border-slate-200 text-center">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <AutoAwesome className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-3">生成您的 SEO 优化报告</h3>
          <p className="text-slate-500 max-w-lg mx-auto mb-8 leading-relaxed">
            点击按钮开始分析您的商家信息，AI 将根据多个维度评估您的 SEO 健康状况，
            并提供可操作的优化建议，帮助您提升本地搜索排名。
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { icon: <Image className="w-5 h-5" />, label: '照片优化' },
              { icon: <Star className="w-5 h-5" />, label: '评论管理' },
              { icon: <Description className="w-5 h-5" />, label: '描述完善' },
              { icon: <AccessTime className="w-5 h-5" />, label: '营业时间' },
              { icon: <Phone className="w-5 h-5" />, label: '联系信息' },
              { icon: <Verified className="w-5 h-5" />, label: '信息验证' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
                <span className="text-blue-500">{item.icon}</span>
                <span className="text-sm font-medium text-slate-600">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
