import React, { useState, useEffect } from 'react';
import {
  AutoAwesome,
  Speed,
  Lightbulb,
  LocalFireDepartment,
  TrendingUp,
  Refresh,
  Close,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Star,
  Category,
  Description,
  Photo,
  Public,
  Search,
  Language,
  Phone,
  Map,
  Schedule,
  OpenInNew,
  Visibility,
  ArrowForward,
} from '@mui/icons-material';
import { apiPost } from '../utils/api';

interface Location {
  id: string;
  name: string;
  address: string;
  phoneNumber?: string;
  websiteUrl?: string;
  averageRating?: number;
  totalReviews?: number;
  status?: string;
  categories?: string[];
  photos?: string[];
  openingHours?: string;
  embedId?: string;
  embedSocialLocationId?: string;
  googleId?: string;
  latitude?: number;
  longitude?: number;
}

interface ProfileAnalysisDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  location: Location | null;
}

interface AnalysisReport {
  overallScore: number;
  overallSummary: string;
  dimensions: AnalysisDimension[];
  quickWins: QuickWin[];
  competitiveInsights: CompetitiveInsight[];
}

interface AnalysisDimension {
  id: string;
  name: string;
  icon: string;
  score: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  findings: Finding[];
  recommendations: Recommendation[];
}

interface Finding {
  type: 'positive' | 'warning' | 'critical';
  text: string;
}

interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  action: string;
  impact: string;
  effort: string;
}

interface QuickWin {
  action: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
}

interface CompetitiveInsight {
  title: string;
  description: string;
  actionSteps: string[];
  priority: 'high' | 'medium' | 'low';
}

function getScoreColor(score: number) {
  if (score >= 80) return { color: '#22c55e', label: 'Excellent', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' };
  if (score >= 60) return { color: '#f59e0b', label: 'Good', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' };
  if (score >= 40) return { color: '#f97316', label: 'Fair', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' };
  return { color: '#ef4444', label: 'Needs Work', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' };
}

function getStatusColor(status: string) {
  switch (status) {
    case 'excellent': return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: CheckCircle };
    case 'good': return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: CheckCircle };
    case 'fair': return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: Warning };
    case 'poor': return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: ErrorIcon };
    default: return { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', icon: ErrorIcon };
  }
}

function getIconByName(iconName: string) {
  const icons: Record<string, React.ElementType> = {
    'business-info': Star,
    'categories': Category,
    'description': Description,
    'photos': Photo,
    'hours': Schedule,
    'reviews': Star,
    'citations': Public,
    'website': Language,
    'local-seo': Visibility,
    'search-visibility': Search,
    'contact': Phone,
    'location': Map,
    'default': Lightbulb,
  };
  return icons[iconName] || Lightbulb;
}

export function ProfileAnalysisDrawer({ isOpen, onClose, location }: ProfileAnalysisDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'dimensions' | 'wins' | 'competitors'>('overview');

  useEffect(() => {
    if (isOpen && location && !report) {
      handleAnalyze();
    }
  }, [isOpen, location]);

  const handleAnalyze = async () => {
    if (!location) return;
    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const res = await apiPost('/api/reports/profile-analysis', {
        location: {
          id: location.id,
          name: location.name,
          address: location.address,
          phoneNumber: location.phoneNumber,
          websiteUrl: location.websiteUrl,
          averageRating: location.averageRating,
          totalReviews: location.totalReviews,
          status: location.status,
          categories: location.categories,
          openingHours: location.openingHours,
          latitude: location.latitude,
          longitude: location.longitude,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setReport(data);
      } else {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        setError(err.error || 'Failed to generate analysis');
      }
    } catch (e: any) {
      setError(e.message || 'Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReport(null);
    setError(null);
    setActiveTab('overview');
    onClose();
  };

  if (!isOpen || !location) return null;

  const scoreColors = report ? getScoreColor(report.overallScore) : null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-50 animate-fade-in"
        onClick={handleClose}
      />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 bottom-0 w-full max-w-[520px] bg-white shadow-2xl z-50 flex flex-col animate-slide-right"
      >
        {/* Header */}
        <div className="flex-shrink-0 bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <AutoAwesome className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">AI Profile Analysis</h2>
                <p className="text-white/70 text-xs">{location.name}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <Close className="text-white w-5 h-5" />
            </button>
          </div>

          {/* Quick Tabs */}
          <div className="flex gap-2 mt-2">
            {['overview', 'dimensions', 'quick-wins', 'competitors'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-white text-purple-600'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {tab === 'overview' ? 'Overview' :
                 tab === 'dimensions' ? 'Dimensions' :
                 tab === 'quick-wins' ? 'Quick Wins' : 'Competitors'}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                <AutoAwesome className="absolute inset-0 m-auto w-8 h-8 text-purple-600 animate-pulse" style={{ animationDuration: '2s' }} />
              </div>
              <div className="text-center">
                <p className="font-semibold text-slate-700">Analyzing your profile...</p>
                <p className="text-sm text-slate-500 mt-1">This may take a few seconds</p>
              </div>
              <div className="w-full max-w-sm bg-slate-100 rounded-full h-2 mt-4 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 animate-expand"
                />
              </div>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <ErrorIcon className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="font-bold text-slate-800 mb-2">Analysis Failed</h3>
              <p className="text-sm text-slate-600 mb-4">{error}</p>
              <p className="text-xs text-slate-500 mb-4">Make sure your Gemini API key is configured in Settings.</p>
              <button
                onClick={handleAnalyze}
                className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-red-700 transition-colors"
              >
                <Refresh className="w-4 h-4" />
                Try Again
              </button>
            </div>
          )}

          {/* Report Content */}
          {!loading && !error && report && (
              <div
                key={activeTab}
                className="space-y-6 animate-fade-in"
              >
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Overall Score */}
                    <div className={`rounded-2xl p-6 border ${scoreColors?.border} ${scoreColors?.bg}`}>
                      <div className="flex items-center gap-2 mb-4">
                        <Speed className="w-5 h-5" style={{ color: scoreColors?.color }} />
                        <h4 className="font-bold text-slate-800">Overall Profile Score</h4>
                        <span className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: `${scoreColors?.color}20`, color: scoreColors?.color }}>
                          {scoreColors?.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-center mb-4">
                        <div className="relative w-32 h-32">
                          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                            <circle cx="60" cy="60" r="50" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                            <circle cx="60" cy="60" r="50" fill="none" stroke={scoreColors?.color} strokeWidth="10"
                              strokeLinecap="round"
                              strokeDasharray={`${(report.overallScore / 100) * 314} 314`}
                              style={{ transition: 'stroke-dasharray 1s ease-out' }}
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-extrabold" style={{ color: scoreColors?.color }}>{report.overallScore}</span>
                            <span className="text-xs text-slate-400">/ 100</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 text-center leading-relaxed">{report.overallSummary}</p>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Star className="w-4 h-4 text-amber-500" />
                          <span className="text-xs text-slate-500 font-semibold">Rating</span>
                        </div>
                        <div className="text-2xl font-bold text-slate-800">{location.averageRating?.toFixed(1) ?? '0.0'}</div>
                        <div className="text-xs text-slate-400">({location.totalReviews ?? 0} reviews)</div>
                      </div>
                      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Lightbulb className="w-4 h-4 text-purple-500" />
                          <span className="text-xs text-slate-500 font-semibold">Dimensions</span>
                        </div>
                        <div className="text-2xl font-bold text-slate-800">{report.dimensions.length}</div>
                        <div className="text-xs text-slate-400">Analyzed areas</div>
                      </div>
                      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                        <div className="flex items-center gap-2 mb-2">
                          <LocalFireDepartment className="w-4 h-4 text-orange-500" />
                          <span className="text-xs text-slate-500 font-semibold">Quick Wins</span>
                        </div>
                        <div className="text-2xl font-bold text-slate-800">{report.quickWins.length}</div>
                        <div className="text-xs text-slate-400">Available actions</div>
                      </div>
                      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-indigo-500" />
                          <span className="text-xs text-slate-500 font-semibold">Insights</span>
                        </div>
                        <div className="text-2xl font-bold text-slate-800">{report.competitiveInsights.length}</div>
                        <div className="text-xs text-slate-400">Opportunities</div>
                      </div>
                    </div>

                    {/* Top Issues Summary */}
                    <div className="bg-gradient-to-br from-slate-50 to-purple-50/30 rounded-2xl p-5 border border-slate-200">
                      <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <Warning className="w-4 h-4 text-amber-500" />
                        Top Priority Actions
                      </h4>
                      <div className="space-y-2">
                        {report.dimensions
                          .filter(d => d.status === 'poor' || d.status === 'fair')
                          .slice(0, 3)
                          .map((dim) => (
                            <div key={dim.id} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-200">
                              {React.createElement(getIconByName(dim.icon), { className: 'w-4 h-4 text-slate-400 mt-0.5' })}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-700">{dim.name}</p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  {dim.findings.filter(f => f.type === 'warning' || f.type === 'critical').length} issues found
                                </p>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getStatusColor(dim.status).bg} ${getStatusColor(dim.status).text}`}>
                                {dim.status}
                              </span>
                            </div>
                          ))}
                        {report.dimensions.filter(d => d.status === 'poor' || d.status === 'fair').length === 0 && (
                          <p className="text-sm text-slate-500 text-center py-2">Great job! No major issues found.</p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveTab('dimensions')}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 transition-all"
                    >
                      View All Dimensions
                      <ArrowForward className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Dimensions Tab */}
                {activeTab === 'dimensions' && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-800 text-lg">Analysis Dimensions</h3>
                    {report.dimensions.map((dim) => {
                      const colors = getScoreColor(dim.score);
                      const statusStyle = getStatusColor(dim.status);
                      const StatusIcon = statusStyle.icon;

                      return (
                        <div key={dim.id} className={`rounded-2xl p-5 border ${statusStyle.border} ${statusStyle.bg}`}>
                          <div className="flex items-start gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${colors.color}20` }}>
                              {React.createElement(getIconByName(dim.icon), { className: 'w-5 h-5', style: { color: colors.color } })}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-slate-800">{dim.name}</h4>
                                <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
                                  <StatusIcon className="w-3 h-3" />
                                  {dim.status}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all duration-1000"
                                    style={{ width: `${dim.score}%`, backgroundColor: colors.color }}
                                  />
                                </div>
                                <span className="text-sm font-bold" style={{ color: colors.color }}>{dim.score}</span>
                              </div>
                            </div>
                          </div>

                          {/* Findings */}
                          {dim.findings.length > 0 && (
                            <div className="mb-4">
                              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Findings</p>
                              <div className="space-y-1.5">
                                {dim.findings.map((finding, i) => (
                                  <div key={i} className="flex items-start gap-2">
                                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                                      finding.type === 'positive' ? 'bg-green-500' :
                                      finding.type === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                                    }`} />
                                    <p className="text-sm text-slate-600">{finding.text}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Recommendations */}
                          {dim.recommendations.length > 0 && (
                            <div>
                              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Recommendations</p>
                              <div className="space-y-2">
                                {dim.recommendations.map((rec, i) => (
                                  <div key={i} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-200">
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                      rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                                      rec.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                                    }`}>
                                      {rec.priority.toUpperCase()}
                                    </span>
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-slate-700">{rec.action}</p>
                                      <p className="text-xs text-slate-400 mt-0.5">Impact: {rec.impact} | Effort: {rec.effort}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Quick Wins Tab */}
                {activeTab === 'quick-wins' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <LocalFireDepartment className="w-5 h-5 text-orange-500" />
                      <h3 className="font-bold text-slate-800 text-lg">Quick Wins</h3>
                      <span className="ml-auto bg-orange-100 text-orange-600 text-xs font-bold px-2 py-0.5 rounded-full">
                        {report.quickWins.length} items
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">High-impact actions with minimal effort</p>

                    <div className="space-y-3">
                      {report.quickWins.map((win, i) => (
                        <div key={i} className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-slate-200 hover:border-orange-200 transition-colors">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-white">{i + 1}</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-700">{win.action}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                                win.impact === 'high' ? 'bg-red-100 text-red-700' :
                                win.impact === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                              }`}>
                                {win.impact} impact
                              </span>
                              <span className="text-xs text-slate-400">effort: {win.effort}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Competitive Insights Tab */}
                {activeTab === 'competitors' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-indigo-500" />
                      <h3 className="font-bold text-slate-800 text-lg">Competitive Opportunities</h3>
                      <span className="ml-auto bg-indigo-100 text-indigo-600 text-xs font-bold px-2 py-0.5 rounded-full">
                        {report.competitiveInsights.length} insights
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">Actions to outperform your competitors</p>

                    <div className="space-y-4">
                      {report.competitiveInsights.map((insight, i) => (
                        <div key={i} className="bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-2xl p-5 border border-slate-200">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-indigo-100">
                              <TrendingUp className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className="font-bold text-slate-800 text-sm">{insight.title}</h5>
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                                  insight.priority === 'high' ? 'bg-red-100 text-red-700' :
                                  insight.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                                }`}>
                                  {insight.priority}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 leading-relaxed">{insight.description}</p>
                            </div>
                          </div>
                          <div className="mt-4">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Action Steps:</p>
                            <div className="space-y-2">
                              {insight.actionSteps.map((step, j) => (
                                <div key={j} className="flex items-start gap-2">
                                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                    {j + 1}
                                  </span>
                                  <p className="text-xs text-slate-600 leading-relaxed">{step}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          {/* Empty State (not loading, no report, no error) */}
          {!loading && !report && !error && (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                <AutoAwesome className="w-8 h-8 text-purple-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 mb-1">Ready to Analyze</h3>
                <p className="text-sm text-slate-500">Click the button below to analyze this profile</p>
              </div>
              <button
                onClick={handleAnalyze}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg shadow-purple-500/20"
              >
                <AutoAwesome className="w-4 h-4" />
                Start Analysis
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && (
          <div className="flex-shrink-0 px-6 py-4 border-t border-slate-200 bg-white">
            <div className="flex gap-3">
              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                <Refresh className="w-4 h-4" />
                Regenerate
              </button>
              <button
                onClick={handleClose}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
