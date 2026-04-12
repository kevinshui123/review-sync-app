import React, { useState, useEffect, useCallback } from 'react';
import {
  Download,
  CalendarToday,
  LocationOn,
  Refresh,
  BarChart,
  AutoAwesome,
  Lightbulb,
  TrendingUp,
  Speed,
  OpenInNew,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  ArrowForward,
  Edit,
  Star,
  Description,
  PhotoLibrary,
  RateReview,
  Hub,
  ContentCopy,
  LocalFireDepartment,
} from '@mui/icons-material';
import {
  AreaChart, Area, BarChart as ReBarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { apiGet, apiPost } from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';

interface DailyData {
  date: string;
  searchViews: number;
  mapViews: number;
  websiteClicks: number;
  directionRequests: number;
  phoneCalls: number;
  [key: string]: number | string;
}

interface Location {
  id: string;
  name: string;
  address: string;
}

interface SeoInsight {
  type: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  currentValue?: string;
  suggestedValue?: string;
  actionType: 'editable' | 'citation' | 'content' | 'review';
  actionLabel: string;
  potentialImpact?: string;
}

interface CompetitiveInsight {
  title: string;
  description: string;
  actionSteps: string[];
  priority: 'high' | 'medium' | 'low';
}

interface QuickWin {
  action: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  actionType: string;
}

interface SeoReport {
  overallScore: number;
  overallSummary: string;
  insights: SeoInsight[];
  competitiveInsights: CompetitiveInsight[];
  quickWins: QuickWin[];
}

interface ReportsProps {
  setActiveTab: (tab: string) => void;
}

const PIE_COLORS = ['#2563eb', '#9333ea'];
const PRIORITY_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' };
const IMPACT_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' };
const EFFORT_COLORS = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444' };

function formatDate(d: Date) {
  return d.toISOString().split('T')[0];
}

function formatDisplayDate(str: string) {
  if (!str) return '';
  const [y, m, day] = str.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(m, 10) - 1]} ${parseInt(day, 10)}, ${y}`;
}

function calcChange(curr: number, prev: number) {
  if (!prev) return 0;
  return Math.round(((curr - prev) / prev) * 100);
}

function getScoreColor(score: number) {
  if (score >= 80) return { color: '#22c55e', label: 'Excellent', bg: 'bg-green-50', border: 'border-green-200' };
  if (score >= 60) return { color: '#f59e0b', label: 'Good', bg: 'bg-amber-50', border: 'border-amber-200' };
  if (score >= 40) return { color: '#f97316', label: 'Fair', bg: 'bg-orange-50', border: 'border-orange-200' };
  return { color: '#ef4444', label: 'Needs Work', bg: 'bg-red-50', border: 'border-red-200' };
}

function getInsightIcon(type: string) {
  switch (type) {
    case 'categories': return <Hub className="w-4 h-4" />;
    case 'description': return <Description className="w-4 h-4" />;
    case 'photos': return <PhotoLibrary className="w-4 h-4" />;
    case 'reviews': return <RateReview className="w-4 h-4" />;
    case 'hours': return <Lightbulb className="w-4 h-4" />;
    default: return <Lightbulb className="w-4 h-4" />;
  }
}

export function Reports({ setActiveTab }: ReportsProps) {
  const { t, language } = useLanguage();
  const today = new Date();
  const defaultEnd = formatDate(today);
  const defaultStart = formatDate(new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000));

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [locations, setLocations] = useState<Location[]>([]);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  // SEO Report state
  const [seoReport, setSeoReport] = useState<SeoReport | null>(null);
  const [seoLoading, setSeoLoading] = useState(false);
  const [seoError, setSeoError] = useState<string | null>(null);

  useEffect(() => {
    apiGet('/api/embedsocial/locations').then(r => r.ok ? r.json() : []).then((data: any[]) => {
      setLocations(Array.isArray(data) ? data : []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await apiGet(`/api/embedsocial/chart-data?period=30days`);
        if (res.ok) {
          const json = await res.json();
          const data: DailyData[] = json.impressions || [];
          setDailyData(data);
        }
      } catch (e) {
        console.error('[Reports] Failed to load chart data', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const generateSeoReport = useCallback(async () => {
    setSeoLoading(true);
    setSeoError(null);
    try {
      const res = await apiPost('/api/reports/seo-optimization', { lang: language });
      if (res.ok) {
        const data = await res.json();
        setSeoReport(data);
      } else {
        const err = await res.json();
        setSeoError(err.error || 'Failed to generate report');
      }
    } catch (e: any) {
      setSeoError(e.message || 'Network error');
    } finally {
      setSeoLoading(false);
    }
  }, [language]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const token = localStorage.getItem('token');
      let url = `/api/reports/gbp-pdf?startDate=${startDate}&endDate=${endDate}`;
      if (selectedLocation !== 'all') url += `&sourceId=${selectedLocation}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Download failed' }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `GBP_Insights_${startDate}_to_${endDate}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (e: any) {
      console.error('[Reports] PDF download failed:', e);
      alert(t('reports.downloadFailed') + ': ' + (e.message || 'Please try again.'));
    } finally {
      setDownloading(false);
    }
  };

  const handleInsightAction = (insight: SeoInsight) => {
    switch (insight.actionType) {
      case 'editable':
        if (insight.type === 'categories') {
          setActiveTab('listings');
        } else if (insight.type === 'description') {
          setActiveTab('listings');
        } else {
          setActiveTab('listings');
        }
        break;
      case 'review':
        setActiveTab('reviews');
        break;
      case 'citation':
        setActiveTab('seo');
        break;
      case 'content':
        setActiveTab('publishing');
        break;
    }
  };

  const filteredData = dailyData.filter(d => d.date >= startDate && d.date <= endDate);

  const monthly: Record<string, DailyData> = {};
  for (const d of filteredData) {
    const month = d.date.substring(0, 7);
    if (!monthly[month]) {
      monthly[month] = { date: month, searchViews: 0, mapViews: 0, websiteClicks: 0, directionRequests: 0, phoneCalls: 0 };
    }
    monthly[month].searchViews += d.searchViews;
    monthly[month].mapViews += d.mapViews;
    monthly[month].websiteClicks += d.websiteClicks;
    monthly[month].directionRequests += d.directionRequests;
    monthly[month].phoneCalls += d.phoneCalls;
  }
  const monthlyList = Object.values(monthly).sort((a, b) => a.date.localeCompare(b.date));

  const totalSearch = filteredData.reduce((s, d) => s + d.searchViews, 0);
  const totalMap = filteredData.reduce((s, d) => s + d.mapViews, 0);
  const totalDir = filteredData.reduce((s, d) => s + d.directionRequests, 0);
  const totalCalls = filteredData.reduce((s, d) => s + d.phoneCalls, 0);
  const totalActions = totalDir + totalCalls;

  const prevMonthData = monthlyList.length >= 2 ? monthlyList[monthlyList.length - 2] : null;
  const currMonthData = monthlyList.length >= 1 ? monthlyList[monthlyList.length - 1] : null;
  const searchChange = prevMonthData ? calcChange(currMonthData.searchViews, prevMonthData.searchViews) : 0;
  const mapChange = prevMonthData ? calcChange(currMonthData.mapViews, prevMonthData.mapViews) : 0;
  const actionsChange = prevMonthData
    ? calcChange((currMonthData.directionRequests + currMonthData.phoneCalls), (prevMonthData.directionRequests + prevMonthData.phoneCalls))
    : 0;

  const last7 = filteredData.slice(-7);
  const last7Search = last7.map(d => ({ date: d.date, [t('reports.search')]: d.searchViews, [t('reports.maps')]: d.mapViews }));
  const last7Actions = last7.map(d => ({ date: d.date, [t('reports.directions')]: d.directionRequests, [t('reports.calls')]: d.phoneCalls }));

  const searchPie = [
    { name: t('reports.totalSearchViews'), value: totalSearch },
    { name: t('reports.totalMapViews'), value: totalMap },
  ];
  const actionsPie = [
    { name: t('reports.directions'), value: totalDir },
    { name: t('reports.phoneCalls'), value: totalCalls },
  ];

  const dateLabel = `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`;
  const weeklyRange = `${last7[0]?.date} – ${last7[last7.length - 1]?.date}`;

  const scoreInfo = seoReport ? getScoreColor(seoReport.overallScore) : null;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold font-headline tracking-tight mb-1">{t('reports.title')}</h2>
        <p className="text-slate-500 text-sm">{t('reports.subtitle')}</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              <LocationOn className="w-3 h-3 inline mr-1" />{t('reports.source')}
            </label>
            <select
              value={selectedLocation}
              onChange={e => setSelectedLocation(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
            >
              <option value="all">{t('reports.allLocations')}</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              <CalendarToday className="w-3 h-3 inline mr-1" />{t('reports.startDate')}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              <CalendarToday className="w-3 h-3 inline mr-1" />{t('reports.endDate')}
            </label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
            />
          </div>
          <button
            onClick={handleDownload}
            disabled={downloading || loading}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow transition-all"
          >
            {downloading
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
              : <Download className="w-4 h-4" />
            }
            {downloading ? t('reports.generating') : t('reports.downloadPdf')}
          </button>
        </div>
      </div>

      {/* ====================================================== */}
      {/* SEO OPTIMIZATION REPORT SECTION */}
      {/* ====================================================== */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <AutoAwesome className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">SEO Optimization Report</h3>
              <p className="text-xs text-slate-500">{t('reports.generateOptReport')}</p>
            </div>
          </div>
          <button
            onClick={generateSeoReport}
            disabled={seoLoading}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-purple-500/20 transition-all"
          >
            {seoLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                <span className="animate-pulse">Analyzing...</span>
              </>
            ) : (
              <>
                <AutoAwesome className="w-4 h-4" />
                {t('reports.generateReport')}
              </>
            )}
          </button>
        </div>

        {/* Error State */}
        {seoError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-center gap-3">
            <ErrorIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-700">{seoError}</p>
              <p className="text-xs text-red-500 mt-0.5">Make sure your Gemini API key is configured in Settings.</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {seoLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/3 mb-4" />
                <div className="h-3 bg-slate-100 rounded w-full mb-2" />
                <div className="h-3 bg-slate-100 rounded w-5/6 mb-2" />
                <div className="h-3 bg-slate-100 rounded w-4/6" />
              </div>
            ))}
          </div>
        )}

        {/* Report Content */}
        {seoReport && !seoLoading && (
          <div className="space-y-4">
            {/* Top Row: Score + Quick Wins */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* SEO Health Score Card */}
              <div className={`rounded-2xl p-6 shadow-sm border ${scoreInfo?.border} ${scoreInfo?.bg}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Speed className={`w-5 h-5`} style={{ color: scoreInfo?.color }} />
                    <h4 className="font-bold text-slate-800">SEO Health Score</h4>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 rounded-full" style={{
                    backgroundColor: `${scoreInfo?.color}20`,
                    color: scoreInfo?.color,
                  }}>
                    {scoreInfo?.label}
                  </span>
                </div>

                <div className="flex items-center justify-center mb-4">
                  {/* Circular Score Gauge */}
                  <div className="relative w-32 h-32">
                    <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                      <circle cx="60" cy="60" r="50" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                      <circle
                        cx="60" cy="60" r="50" fill="none"
                        stroke={scoreInfo?.color}
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={`${(seoReport.overallScore / 100) * 314} 314`}
                        style={{ transition: 'stroke-dasharray 1s ease-out' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-extrabold" style={{ color: scoreInfo?.color }}>
                        {seoReport.overallScore}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">/ 100</span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-slate-600 text-center leading-relaxed">
                  {seoReport.overallSummary}
                </p>
              </div>

              {/* Quick Wins Card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 md:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <LocalFireDepartment className="w-5 h-5 text-orange-500" />
                  <h4 className="font-bold text-slate-800">Quick Wins</h4>
                  <span className="text-xs bg-orange-100 text-orange-600 font-bold px-2 py-0.5 rounded-full ml-auto">
                    {seoReport.quickWins?.length || 0} items
                  </span>
                </div>
                <div className="space-y-2">
                  {(seoReport.quickWins || []).map((win, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white border-2 flex items-center justify-center mt-0.5"
                        style={{ borderColor: EFFORT_COLORS[win.effort] }}>
                        <span className="text-xs font-bold" style={{ color: EFFORT_COLORS[win.effort] }}>{i + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 leading-snug">{win.action}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: `${IMPACT_COLORS[win.impact]}15`, color: IMPACT_COLORS[win.impact] }}>
                            {win.impact} impact
                          </span>
                          <span className="text-xs text-slate-400 font-medium">
                            effort: {win.effort}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (win.actionType === 'editable') setActiveTab('listings');
                          else if (win.actionType === 'review') setActiveTab('reviews');
                          else if (win.actionType === 'citation') setActiveTab('seo');
                          else setActiveTab('publishing');
                        }}
                        className="flex-shrink-0 w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:border-purple-400 hover:bg-purple-50 transition-all"
                      >
                        <ArrowForward className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Key Insights Row */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-5">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                <h4 className="font-bold text-slate-800">Key Optimization Insights</h4>
                <span className="text-xs bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full ml-auto">
                  {seoReport.insights?.length || 0} recommendations
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(seoReport.insights || []).map((insight, i) => (
                  <div key={i} className="rounded-xl border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all group">
                    <div className="p-4">
                      {/* Header */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                          insight.priority === 'high' ? 'bg-red-50 text-red-500' :
                          insight.priority === 'medium' ? 'bg-amber-50 text-amber-500' :
                          'bg-green-50 text-green-500'
                        }`}>
                          {getInsightIcon(insight.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h5 className="font-bold text-slate-800 text-sm leading-tight">{insight.title}</h5>
                          </div>
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor: `${PRIORITY_COLORS[insight.priority]}15`,
                              color: PRIORITY_COLORS[insight.priority],
                            }}>
                            {insight.priority} priority
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-500 leading-relaxed mb-3 line-clamp-3">
                        {insight.description}
                      </p>

                      {/* Current vs Suggested */}
                      {insight.currentValue && (
                        <div className="bg-slate-50 rounded-lg p-2.5 mb-3 text-xs">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle className="w-3 h-3 text-slate-400" />
                            <span className="text-slate-400 font-semibold">Current:</span>
                            <span className="text-slate-600 font-medium ml-auto truncate max-w-[120px]">{insight.currentValue}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ArrowForward className="w-3 h-3 text-purple-400" />
                            <span className="text-slate-400 font-semibold">Suggested:</span>
                            <span className="text-purple-600 font-medium ml-auto truncate max-w-[120px]">{insight.suggestedValue}</span>
                          </div>
                        </div>
                      )}

                      {/* Impact */}
                      {insight.potentialImpact && (
                        <p className="text-xs text-slate-400 mb-3 italic">
                          <TrendingUp className="w-3 h-3 inline mr-1" />
                          {insight.potentialImpact}
                        </p>
                      )}

                      {/* Action Button */}
                      <button
                        onClick={() => handleInsightAction(insight)}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all
                          bg-purple-50 text-purple-600 hover:bg-purple-100
                          border border-purple-200 hover:border-purple-400"
                      >
                        {getInsightIcon(insight.type)}
                        {insight.actionLabel}
                        <OpenInNew className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Competitive Opportunities */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp className="w-5 h-5 text-indigo-500" />
                <h4 className="font-bold text-slate-800">Competitive Opportunities</h4>
                <span className="text-xs bg-indigo-50 text-indigo-600 font-bold px-2 py-0.5 rounded-full ml-auto">
                  {seoReport.competitiveInsights?.length || 0} insights
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(seoReport.competitiveInsights || []).map((comp, i) => (
                  <div key={i} className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 p-5 border border-slate-200">
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                        comp.priority === 'high' ? 'bg-red-50' : comp.priority === 'medium' ? 'bg-amber-50' : 'bg-green-50'
                      }`}>
                        <Star className={`w-4 h-4 ${
                          comp.priority === 'high' ? 'text-red-500' :
                          comp.priority === 'medium' ? 'text-amber-500' :
                          'text-green-500'
                        }`} />
                      </div>
                      <div>
                        <h5 className="font-bold text-slate-800 text-sm mb-1">{comp.title}</h5>
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor: `${PRIORITY_COLORS[comp.priority]}15`,
                            color: PRIORITY_COLORS[comp.priority],
                          }}>
                          {comp.priority} priority
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed mb-3">{comp.description}</p>
                    <div className="space-y-1.5">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Action Steps:</p>
                      {comp.actionSteps.map((step, j) => (
                        <div key={j} className="flex items-start gap-2">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center mt-0.5">
                            {j + 1}
                          </span>
                          <p className="text-xs text-slate-600 leading-snug">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty State (no report yet) */}
        {!seoReport && !seoLoading && !seoError && (
          <div className="bg-gradient-to-br from-slate-50 to-purple-50/30 rounded-2xl p-12 border border-slate-200 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center mx-auto mb-4">
              <AutoAwesome className="w-8 h-8 text-purple-500" />
            </div>
            <h4 className="text-lg font-bold text-slate-800 mb-2">Generate Your SEO Optimization Report</h4>
            <p className="text-sm text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
              Click the button above to analyze your business listings with AI. Get personalized recommendations for categories, descriptions, review response, and more.
            </p>
            <button
              onClick={generateSeoReport}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg shadow-purple-500/20 transition-all"
            >
              <AutoAwesome className="w-4 h-4" />
              {t('reports.generateReport')}
            </button>
          </div>
        )}
      </div>

      {/* ====================================================== */}
      {/* GBP PERFORMANCE CHARTS (existing section) */}
      {/* ====================================================== */}
      <div className="mb-4 flex items-center gap-2">
        <BarChart className="w-5 h-5 text-slate-400" />
        <h3 className="text-base font-bold text-slate-700">GBP Performance Data</h3>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">{t('reports.loading')}</p>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <BarChart className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-bold text-slate-600">{t('reports.noData')}</p>
          <p className="text-xs mt-1">{t('reports.noDataHint')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPI Summary Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: t('reports.totalSearchViews'), value: totalSearch.toLocaleString(), change: searchChange, color: 'blue' },
              { label: t('reports.totalMapViews'), value: totalMap.toLocaleString(), change: mapChange, color: 'purple' },
              { label: t('reports.totalActions'), value: totalActions.toLocaleString(), change: actionsChange, color: 'orange' },
              { label: t('reports.phoneCalls'), value: totalCalls.toLocaleString(), color: 'red' },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                <div className="text-xs font-medium text-slate-400 mb-1">{kpi.label}</div>
                <div className={`text-2xl font-extrabold font-headline tracking-tight text-${kpi.color}-600`}>
                  {kpi.value}
                </div>
                {'change' in kpi && kpi.change !== 0 && (
                  <div className={`text-xs font-semibold mt-1 ${kpi.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {kpi.change > 0 ? '+' : ''}{kpi.change}{t('reports.vsPrevPeriod')}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Section 1: Search Performance */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-base font-bold mb-4">{t('reports.searchPerf')}: {dateLabel}</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-slate-400 mb-2 font-semibold">{t('reports.trendOverTime')}</p>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={filteredData.slice(-30)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="#94a3b8" tickFormatter={v => v.slice(5)} />
                      <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }}
                        formatter={(v: number) => v.toLocaleString()} />
                      <Area type="monotone" dataKey="searchViews" stroke="#2563eb" strokeWidth={2} fill="#2563eb" fillOpacity={0.15} name={t('reports.totalSearchViews')} />
                      <Area type="monotone" dataKey="mapViews" stroke="#9333ea" strokeWidth={2} fill="#9333ea" fillOpacity={0.15} name={t('reports.totalMapViews')} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-2 font-semibold">{t('reports.monthlyBreakdown')}</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-500">
                        <th className="px-3 py-2 text-left font-semibold">{t('reports.period')}</th>
                        <th className="px-3 py-2 text-right font-semibold">{t('reports.search')}</th>
                        <th className="px-3 py-2 text-right font-semibold">{t('reports.maps')}</th>
                        <th className="px-3 py-2 text-right font-semibold">{t('reports.chg')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyList.map((m, i) => {
                        const prev = monthlyList[i - 1];
                        const pct = prev ? calcChange(m.searchViews, prev.searchViews) : 0;
                        return (
                          <tr key={m.date} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                            <td className="px-3 py-2 font-medium text-slate-700">{m.date}</td>
                            <td className="px-3 py-2 text-right text-slate-600">{m.searchViews.toLocaleString()}</td>
                            <td className="px-3 py-2 text-right text-slate-600">{m.mapViews.toLocaleString()}</td>
                            <td className={`px-3 py-2 text-right font-semibold ${pct > 0 ? 'text-green-600' : pct < 0 ? 'text-red-600' : 'text-slate-400'}`}>
                              {i === 0 ? '—' : `${pct > 0 ? '+' : ''}${pct}%`}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 font-bold">
                        <td className="px-3 py-2 text-slate-700">{t('reports.total')}</td>
                        <td className="px-3 py-2 text-right text-slate-700">{totalSearch.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right text-slate-700">{totalMap.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right text-slate-400">—</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-slate-400 mb-2 font-semibold">{t('reports.searchVsMapShare')}</p>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={searchPie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {searchPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => v.toLocaleString()} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-2 font-semibold">{t('reports.weeklySearch')} ({weeklyRange})</p>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <ReBarChart data={last7Search}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="#94a3b8" tickFormatter={v => v.slice(5)} />
                      <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }}
                        formatter={(v: number) => v.toLocaleString()} />
                      <Bar dataKey={t('reports.search')} fill="#2563eb" radius={[4, 4, 0, 0]} name={t('reports.totalSearchViews')} />
                      <Bar dataKey={t('reports.maps')} fill="#9333ea" radius={[4, 4, 0, 0]} name={t('reports.totalMapViews')} />
                    </ReBarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Actions Performance */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-base font-bold mb-4">{t('reports.actionsPerf')}: {dateLabel}</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-slate-400 mb-2 font-semibold">{t('reports.trendOverTime')}</p>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={filteredData.slice(-30)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="#94a3b8" tickFormatter={v => v.slice(5)} />
                      <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }}
                        formatter={(v: number) => v.toLocaleString()} />
                      <Area type="monotone" dataKey="directionRequests" stroke="#f97316" strokeWidth={2} fill="#f97316" fillOpacity={0.15} name={t('reports.directions')} />
                      <Area type="monotone" dataKey="phoneCalls" stroke="#ef4444" strokeWidth={2} fill="#ef4444" fillOpacity={0.15} name={t('reports.phoneCalls')} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-2 font-semibold">{t('reports.monthlyBreakdown')}</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-500">
                        <th className="px-3 py-2 text-left font-semibold">{t('reports.period')}</th>
                        <th className="px-3 py-2 text-right font-semibold">{t('reports.directions')}</th>
                        <th className="px-3 py-2 text-right font-semibold">{t('reports.calls')}</th>
                        <th className="px-3 py-2 text-right font-semibold">{t('reports.total')}</th>
                        <th className="px-3 py-2 text-right font-semibold">{t('reports.chg')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyList.map((m, i) => {
                        const total = (m.directionRequests || 0) + (m.phoneCalls || 0);
                        const prev = monthlyList[i - 1];
                        const prevTotal = prev ? (prev.directionRequests || 0) + (prev.phoneCalls || 0) : 0;
                        const pct = prev ? calcChange(total, prevTotal) : 0;
                        return (
                          <tr key={m.date} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                            <td className="px-3 py-2 font-medium text-slate-700">{m.date}</td>
                            <td className="px-3 py-2 text-right text-slate-600">{(m.directionRequests || 0).toLocaleString()}</td>
                            <td className="px-3 py-2 text-right text-slate-600">{(m.phoneCalls || 0).toLocaleString()}</td>
                            <td className="px-3 py-2 text-right font-semibold text-slate-700">{total.toLocaleString()}</td>
                            <td className={`px-3 py-2 text-right font-semibold ${pct > 0 ? 'text-green-600' : pct < 0 ? 'text-red-600' : 'text-slate-400'}`}>
                              {i === 0 ? '—' : `${pct > 0 ? '+' : ''}${pct}%`}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 font-bold">
                        <td className="px-3 py-2 text-slate-700">{t('reports.total')}</td>
                        <td className="px-3 py-2 text-right text-slate-700">{totalDir.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right text-slate-700">{totalCalls.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right text-slate-700">{totalActions.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right text-slate-400">—</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-slate-400 mb-2 font-semibold">{t('reports.actionsBreakdown')}</p>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={actionsPie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {actionsPie.map((_, i) => <Cell key={i} fill={['#f97316', '#ef4444'][i]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => v.toLocaleString()} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-2 font-semibold">{t('reports.weeklyActions')} ({weeklyRange})</p>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <ReBarChart data={last7Actions}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="#94a3b8" tickFormatter={v => v.slice(5)} />
                      <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }}
                        formatter={(v: number) => v.toLocaleString()} />
                      <Bar dataKey={t('reports.directions')} fill="#f97316" radius={[4, 4, 0, 0]} name={t('reports.directions')} />
                      <Bar dataKey={t('reports.calls')} fill="#ef4444" radius={[4, 4, 0, 0]} name={t('reports.phoneCalls')} />
                    </ReBarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
