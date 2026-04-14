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
  Sort,
} from '@mui/icons-material';
import { apiGet, apiPost } from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';

function getScoreColor(score: number) {
  if (score >= 80) return { color: '#22c55e', label: 'Excellent', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' };
  if (score >= 60) return { color: '#f59e0b', label: 'Good', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' };
  if (score >= 40) return { color: '#f97316', label: 'Fair', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' };
  return { color: '#ef4444', label: 'Needs Work', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' };
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

interface Recommendation {
  id: string;
  category: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  action: string;
  actionType: string;
  potentialImpact?: string;
  currentStatus?: string;
  targetValue?: string;
}

interface SEOReport {
  overallScore: number;
  overallSummary: string;
  quickWins: { action: string; impact: string }[];
  recommendations: Recommendation[];
  categoryScores?: Record<string, number>;
  improvements?: { category: string; improvement: string }[];
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
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

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

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
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
      case 'attributes':
      case 'categories':
        return <Verified className="w-5 h-5" />;
      default:
        return <Lightbulb className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
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

  const getActionTypeLabel = (actionType: string) => {
    switch (actionType) {
      case 'edit_listing':
        return { label: '编辑信息', icon: <Edit className="w-4 h-4" />, tab: 'listings' };
      case 'upload_photos':
        return { label: '上传照片', icon: <PhotoCamera className="w-4 h-4" />, tab: 'listings' };
      case 'generate_review':
        return { label: '生成评论', icon: <Star className="w-4 h-4" />, tab: 'seo-real-comment' };
      case 'add_hours':
        return { label: '完善营业时间', icon: <AccessTime className="w-4 h-4" />, tab: 'listings' };
      case 'add_description':
        return { label: '完善描述', icon: <Description className="w-4 h-4" />, tab: 'listings' };
      case 'verify_listing':
        return { label: '验证 listing', icon: <Shield className="w-4 h-4" />, tab: 'listings' };
      default:
        return { label: '查看详情', icon: <ArrowForward className="w-4 h-4" />, tab: 'listings' };
    }
  };

  const getCategories = () => {
    if (!seoReport?.recommendations) return [];
    const categories = [...new Set(seoReport.recommendations.map(r => r.category))];
    return ['all', ...categories];
  };

  const getFilteredRecommendations = () => {
    if (!seoReport?.recommendations) return [];
    return seoReport.recommendations.filter(rec => {
      const categoryMatch = filterCategory === 'all' || rec.category.toLowerCase() === filterCategory.toLowerCase();
      const priorityMatch = filterPriority === 'all' || rec.priority.toLowerCase() === filterPriority.toLowerCase();
      return categoryMatch && priorityMatch;
    });
  };

  const filteredRecommendations = getFilteredRecommendations();

  const handleActionClick = (rec: Recommendation) => {
    const action = getActionTypeLabel(rec.actionType);
    if (action.tab === 'listings') {
      window.dispatchEvent(new CustomEvent('navigate-tab', { detail: { tab: 'listings', subTab: 'edit' } }));
    } else if (action.tab === 'seo-real-comment') {
      window.dispatchEvent(new CustomEvent('navigate-tab', { detail: { tab: 'seo-real-comment' } }));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-slate-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-purple-500 rounded-full animate-spin"></div>
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
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 via-violet-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-purple-500/20">
              <AutoAwesome className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">SEO 优化</h1>
              <p className="text-slate-500 mt-1">{businessInfo?.name}</p>
            </div>
          </div>
          <button
            onClick={generateSeoReport}
            disabled={seoLoading}
            className={`flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-2xl transition-all duration-300 shadow-lg ${
              seoReport
                ? 'bg-white border-2 border-purple-600 text-purple-600 hover:bg-purple-50'
                : 'bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 text-white hover:shadow-xl hover:shadow-purple-500/30'
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
          {/* Score Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
            {/* Main Score Card */}
            <div className={`lg:col-span-1 rounded-3xl p-6 border ${getScoreColor(seoReport.overallScore).border} ${getScoreColor(seoReport.overallScore).bg}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Speed className="w-5 h-5" style={{ color: getScoreColor(seoReport.overallScore).color }} />
                  <span className="font-bold text-slate-800">SEO 健康分数</span>
                </div>
                <span
                  className="text-xs font-bold px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: `${getScoreColor(seoReport.overallScore).color}20`,
                    color: getScoreColor(seoReport.overallScore).color
                  }}
                >
                  {getScoreColor(seoReport.overallScore).label}
                </span>
              </div>
              <div className="flex justify-center mb-4">
                <div className="relative w-28 h-28">
                  <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                    <circle
                      cx="60" cy="60" r="50" fill="none"
                      stroke={getScoreColor(seoReport.overallScore).color}
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${(seoReport.overallScore / 100) * 314} 314`}
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-extrabold" style={{ color: getScoreColor(seoReport.overallScore).color }}>
                      {seoReport.overallScore}
                    </span>
                    <span className="text-xs text-slate-400">/ 100</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-600 text-center leading-relaxed">{seoReport.overallSummary}</p>
            </div>

            {/* Quick Wins Card */}
            <div className="lg:col-span-1 rounded-3xl p-6 border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <LocalFireDepartment className="w-5 h-5 text-orange-500" />
                  <span className="font-bold text-slate-800">快速见效</span>
                </div>
                <span className="bg-orange-100 text-orange-600 text-xs font-bold px-3 py-1 rounded-full">
                  {seoReport.quickWins?.length || 0} 项
                </span>
              </div>
              <div className="space-y-2 max-h-40 overflow-auto">
                {(seoReport.quickWins || []).map((win, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 bg-white/60 rounded-xl">
                    <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed">{win.action}</p>
                  </div>
                ))}
                {(!seoReport.quickWins || seoReport.quickWins.length === 0) && (
                  <p className="text-sm text-slate-500 text-center py-4">暂无快速见效建议</p>
                )}
              </div>
            </div>

            {/* Issues Summary */}
            <div className="lg:col-span-2 rounded-3xl p-6 border border-slate-200 bg-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-slate-600" />
                  <span className="font-bold text-slate-800">问题概览</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: '高优先级', count: seoReport.recommendations?.filter(r => r.priority === 'high').length || 0, color: 'bg-red-500', textColor: 'text-red-600', bgLight: 'bg-red-50' },
                  { label: '中优先级', count: seoReport.recommendations?.filter(r => r.priority === 'medium').length || 0, color: 'bg-amber-500', textColor: 'text-amber-600', bgLight: 'bg-amber-50' },
                  { label: '低优先级', count: seoReport.recommendations?.filter(r => r.priority === 'low').length || 0, color: 'bg-blue-500', textColor: 'text-blue-600', bgLight: 'bg-blue-50' },
                ].map((item, i) => (
                  <div key={i} className={`${item.bgLight} rounded-2xl p-4 text-center`}>
                    <div className={`text-2xl font-extrabold ${item.textColor}`}>{item.count}</div>
                    <div className="text-xs text-slate-500 font-medium mt-1">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="flex items-center gap-2">
              <FilterList className="w-5 h-5 text-slate-400" />
              <span className="text-sm font-medium text-slate-600">筛选:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {getCategories().map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    filterCategory === cat
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat === 'all' ? '全部' : cat}
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-slate-500">优先级:</span>
              {['all', 'high', 'medium', 'low'].map((p) => (
                <button
                  key={p}
                  onClick={() => setFilterPriority(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filterPriority === p
                      ? p === 'high' ? 'bg-red-500 text-white' :
                        p === 'medium' ? 'bg-amber-500 text-white' :
                        p === 'low' ? 'bg-blue-500 text-white' : 'bg-purple-600 text-white'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {p === 'all' ? '全部' : p === 'high' ? '高' : p === 'medium' ? '中' : '低'}
                </button>
              ))}
            </div>
          </div>

          {/* Recommendations List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                优化建议
                <span className="ml-2 text-sm font-normal text-slate-400">
                  ({filteredRecommendations.length} 项)
                </span>
              </h2>
            </div>

            {filteredRecommendations.length === 0 ? (
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
              filteredRecommendations.map((rec, index) => {
                const priorityStyle = getPriorityColor(rec.priority);
                const categoryStyle = getCategoryColor(rec.category);
                const action = getActionTypeLabel(rec.actionType);
                const isExpanded = expandedCard === rec.id;

                return (
                  <div
                    key={rec.id || index}
                    className={`bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 ${
                      isExpanded ? 'ring-2 ring-purple-500/30' : ''
                    }`}
                  >
                    <div
                      className="p-6 cursor-pointer"
                      onClick={() => setExpandedCard(isExpanded ? null : rec.id)}
                    >
                      <div className="flex items-start gap-4">
                        {/* Category Icon */}
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${categoryStyle.bg} flex items-center justify-center shadow-sm flex-shrink-0`}>
                          <span className={categoryStyle.text}>
                            {getCategoryIcon(rec.category)}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${priorityStyle.bg} ${priorityStyle.text}`}>
                                  {priorityStyle.icon}
                                  <span className="ml-1">
                                    {rec.priority === 'high' ? '高优先级' : rec.priority === 'medium' ? '中优先级' : '低优先级'}
                                  </span>
                                </span>
                                <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${categoryStyle.bgLight} ${categoryStyle.text}`}>
                                  {rec.category}
                                </span>
                              </div>
                              <h3 className="text-lg font-bold text-slate-900 mb-1">{rec.title}</h3>
                              <p className="text-sm text-slate-500 leading-relaxed">{rec.description}</p>
                            </div>
                            <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="px-6 pb-6 animate-fade-in">
                        <div className="border-t border-slate-100 pt-4 mt-2">
                          {/* Current vs Target */}
                          {(rec.currentStatus || rec.targetValue) && (
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              {rec.currentStatus && (
                                <div className="bg-slate-50 rounded-xl p-4">
                                  <div className="text-xs text-slate-400 font-medium mb-1">当前状态</div>
                                  <div className="text-sm font-semibold text-slate-700">{rec.currentStatus}</div>
                                </div>
                              )}
                              {rec.targetValue && (
                                <div className="bg-purple-50 rounded-xl p-4">
                                  <div className="text-xs text-purple-400 font-medium mb-1">目标状态</div>
                                  <div className="text-sm font-semibold text-purple-700">{rec.targetValue}</div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Potential Impact */}
                          {rec.potentialImpact && (
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-4 border border-blue-100">
                              <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="w-4 h-4 text-blue-500" />
                                <span className="text-xs font-bold text-blue-600">潜在影响</span>
                              </div>
                              <p className="text-sm text-slate-700">{rec.potentialImpact}</p>
                            </div>
                          )}

                          {/* Action Button */}
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-slate-500">
                              <span className="font-medium">建议操作:</span> {rec.action}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleActionClick(rec);
                              }}
                              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl hover:shadow-purple-500/30 transition-all"
                            >
                              {action.icon}
                              {action.label}
                              <ArrowForward className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {!seoReport && !seoLoading && (
        <div className="bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/30 rounded-3xl p-16 border border-slate-200 text-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-100 via-violet-100 to-indigo-100 flex items-center justify-center mx-auto mb-6 shadow-xl">
            <AutoAwesome className="w-10 h-10 text-purple-500" />
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
                <span className="text-purple-500">{item.icon}</span>
                <span className="text-sm font-medium text-slate-600">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
