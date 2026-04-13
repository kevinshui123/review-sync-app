import React, { useState, useEffect, useCallback } from 'react';
import {
  AutoAwesome,
  Refresh,
  Speed,
  LocalFireDepartment,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { apiGet, apiPost } from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';

function getScoreColor(score: number) {
  if (score >= 80) return { color: '#22c55e', label: 'Excellent', bg: 'bg-green-50', border: 'border-green-200' };
  if (score >= 60) return { color: '#f59e0b', label: 'Good', bg: 'bg-amber-50', border: 'border-amber-200' };
  if (score >= 40) return { color: '#f97316', label: 'Fair', bg: 'bg-orange-50', border: 'border-orange-200' };
  return { color: '#ef4444', label: 'Needs Work', bg: 'bg-red-50', border: 'border-red-200' };
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

export function Optimization() {
  const { t, language } = useLanguage();
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const [seoReport, setSeoReport] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('seo_report');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [seoLoading, setSeoLoading] = useState(false);
  const [seoError, setSeoError] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-500">{t('seo.loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <AutoAwesome className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('reports.seoOptimization')}</h1>
            <p className="text-sm text-slate-500">{businessInfo?.name}</p>
          </div>
        </div>
        <button
          onClick={generateSeoReport}
          disabled={seoLoading}
          className={`flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-xl ${
            seoReport
              ? 'bg-white border-2 border-purple-600 text-purple-600'
              : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
          } disabled:opacity-50`}
        >
          {seoLoading ? (
            <><Refresh className="w-4 h-4 animate-spin" />Analyzing...</>
          ) : seoReport ? (
            <><Refresh className="w-4 h-4" />Regenerate</>
          ) : (
            <><AutoAwesome className="w-4 h-4" />{t('reports.generateReport')}</>
          )}
        </button>
      </div>

      {seoError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          <ErrorIcon className="w-5 h-5 inline mr-2" />{seoError}
        </div>
      )}

      {seoReport && !seoLoading && (
        <>
          {/* Score Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className={`rounded-2xl p-6 border ${getScoreColor(seoReport.overallScore).border} ${getScoreColor(seoReport.overallScore).bg}`}>
              <div className="flex items-center gap-2 mb-4">
                <Speed className="w-5 h-5" style={{ color: getScoreColor(seoReport.overallScore).color }} />
                <h4 className="font-bold">SEO Health Score</h4>
                <span
                  className="ml-auto text-xs font-bold px-2 py-1 rounded-full"
                  style={{
                    backgroundColor: `${getScoreColor(seoReport.overallScore).color}20`,
                    color: getScoreColor(seoReport.overallScore).color
                  }}
                >
                  {getScoreColor(seoReport.overallScore).label}
                </span>
              </div>
              <div className="flex justify-center mb-4">
                <div className="relative w-24 h-24">
                  <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                    <circle
                      cx="60" cy="60" r="50" fill="none"
                      stroke={getScoreColor(seoReport.overallScore).color}
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${(seoReport.overallScore / 100) * 314} 314`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-extrabold" style={{ color: getScoreColor(seoReport.overallScore).color }}>
                      {seoReport.overallScore}
                    </span>
                    <span className="text-xs text-slate-400">/ 100</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-600 text-center">{seoReport.overallSummary}</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-100 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <LocalFireDepartment className="w-5 h-5 text-orange-500" />
                <h4 className="font-bold">Quick Wins</h4>
                <span className="ml-auto bg-orange-100 text-orange-600 text-xs font-bold px-2 py-0.5 rounded-full">
                  {seoReport.quickWins?.length || 0} items
                </span>
              </div>
              <div className="space-y-2 max-h-48 overflow-auto">
                {(seoReport.quickWins || []).map((win: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="w-6 h-6 rounded-full bg-white border-2 border-orange-400 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-orange-500">{i+1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">{win.action}</p>
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                        win.impact === 'high' ? 'bg-red-100 text-red-600' :
                        win.impact === 'medium' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'
                      }`}>
                        {win.impact}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Detailed Recommendations */}
          {seoReport.recommendations && seoReport.recommendations.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="text-lg font-bold mb-4">Detailed Recommendations</h3>
              <div className="space-y-4">
                {seoReport.recommendations.map((rec: any, i: number) => (
                  <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-slate-800">{rec.category || rec.title}</h4>
                        <p className="text-sm text-slate-600 mt-1">{rec.description || rec.issue}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-semibold shrink-0 ml-4 ${
                        rec.priority === 'high' ? 'bg-red-100 text-red-600' :
                        rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'
                      }`}>
                        {rec.priority || 'low'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!seoReport && !seoLoading && (
        <div className="bg-gradient-to-br from-slate-50 to-purple-50/30 rounded-2xl p-12 border border-slate-200 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center mx-auto mb-4">
            <AutoAwesome className="w-8 h-8 text-purple-500" />
          </div>
          <h4 className="text-lg font-bold text-slate-800 mb-2">Generate Your SEO Optimization Report</h4>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
            Click the button above to analyze your business listings with AI and get actionable recommendations.
          </p>
        </div>
      )}
    </div>
  );
}
