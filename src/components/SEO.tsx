import React, { useState, useEffect } from 'react';
import {
  Search,
  Notifications,
  History,
  Public,
  Map,
  Description,
  Phone,
  Schedule,
  Language,
  LocalOffer,
  Edit,
  Star,
  TrendingUp,
  TrendingDown,
  Place,
  Refresh,
} from '@mui/icons-material';
import { apiGet, apiPost } from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';

interface SEOProps {
  setActiveTab: (tab: string) => void;
}

interface Citation {
  id: string;
  name: string;
  status: 'matched' | 'mismatch';
  address: string;
  hours: string;
  phone: string;
  lastUpdate: string;
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

interface GridPoint {
  idx: number;
  lat: number;
  lng: number;
  businessRank: number | null;
  totalResults: number;
  hasData: boolean;
  competitors: {
    rank: number;
    name: string;
    address: string;
    rating: number;
    reviews: number;
    phone: string;
    isTarget: boolean;
  }[];
}

interface GridSummary {
  totalPoints: number;
  pointsWithData: number;
  pointsRanked: number;
  averageRank: number | null;
  top3Percent: number;
  top10Percent: number;
}

interface LocalSearchGridResult {
  keyword: string;
  center: { lat: number; lng: number };
  gridSize: number;
  points: GridPoint[];
  summary: GridSummary;
}

export function SEO({ setActiveTab }: SEOProps) {
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState('citations');
  const [citations, setCitations] = useState<Citation[]>([]);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Local Search Grid state
  const [gridKeyword, setGridKeyword] = useState('restaurant near me');
  const [gridResult, setGridResult] = useState<LocalSearchGridResult | null>(null);
  const [gridLoading, setGridLoading] = useState(false);
  const [gridError, setGridError] = useState<string | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<GridPoint | null>(null);

  const handleCreateReport = async () => {
    if (!gridKeyword.trim() || !businessInfo?.lat || !businessInfo?.lng) return;
    setGridLoading(true);
    setGridError(null);
    setGridResult(null);
    setSelectedPoint(null);
    try {
      const res = await apiPost('/api/seo/local-search-grid', {
        keyword: gridKeyword,
        lat: businessInfo!.lat,
        lng: businessInfo!.lng,
        businessName: businessInfo!.name,
        gridSize: 9,
      });
      if (res.ok) {
        const data = await res.json();
        setGridResult(data);
      } else {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        setGridError(err.error || 'Failed to generate report. Please try again.');
      }
    } catch (e: any) {
      setGridError(e.message || 'Network error. Please check your connection.');
    } finally {
      setGridLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Load locations from EmbedSocial
        const locationsRes = await apiGet('/api/embedsocial/locations');
        let locations: any[] = [];
        if (locationsRes.ok) {
          locations = await locationsRes.json();
        }

        // Use first location as the active business
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

        setCitations([]);
      } catch (error) {
        console.error('Failed to fetch SEO data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const sections = [
            { id: 'grid', label: t('seo.localSearchGrid'), icon: Map },
            { id: 'citations', label: t('seo.localCitations'), icon: Description, badge: 'BETA' },
            { id: 'optimization', label: t('seo.optimization'), icon: LocalOffer },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-500">{t('seo.loading')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* SEO Submenu */}
      <aside className="w-64 bg-white border-r border-slate-100 p-4 space-y-6 overflow-y-auto">
        {/* Profile Card */}
        <div className="border border-slate-200 rounded p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
              <Public className="w-5 h-5 text-red-500" />
            </div>
            <div className="truncate">
              <p className="text-sm font-bold truncate">{businessInfo?.name || 'Business'}</p>
              <p className="text-[10px] text-slate-500 truncate">{businessInfo?.address?.split(',')[0] || 'Location'}</p>
            </div>
          </div>
          <span className="text-slate-400">▼</span>
        </div>

        {/* Keywords Section */}
        <div className="space-y-1">
          <div className="px-2 py-2">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('seo.keywords')}</h3>
          </div>
          <nav className="space-y-1">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-primary font-semibold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm">{section.label}</span>
                  {section.badge && (
                    <span className="ml-auto bg-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded font-bold">
                      {section.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        {/* Section: Citations */}
        {activeSection === 'citations' && (
          <div className="space-y-8">
            {/* Header */}
              <h1 className="text-2xl font-bold">
                {t('seo.localCitation')} <span className="font-normal text-slate-500">{businessInfo?.name}</span>
              </h1>

            {/* Baseline Info Card */}
            <section className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-bold mb-6">{t('seo.baselineInfo')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Contact Info */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Description className="w-5 h-5 text-slate-400 mt-0.5" />
                    <span className="text-sm font-medium">{businessInfo?.name}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Map className="w-5 h-5 text-slate-400 mt-0.5" />
                    <span className="text-sm text-slate-600">{businessInfo?.address}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-slate-400 mt-0.5" />
                    <span className="text-sm text-slate-600">{businessInfo?.phone}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Language className="w-5 h-5 text-slate-400 mt-0.5" />
                    <a className="text-sm text-primary underline" href={businessInfo?.website}>
                      {businessInfo?.website}
                    </a>
                  </div>
                  <div className="flex items-start gap-3">
                    <LocalOffer className="w-5 h-5 text-slate-400 mt-0.5" />
                    <span className="text-sm text-slate-600">{businessInfo?.category}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Edit className="w-5 h-5 text-slate-400 mt-0.5" />
                    <span className="text-sm text-slate-600">{businessInfo?.keywords}</span>
                  </div>
                </div>

                {/* Business Hours */}
                <div className="space-y-1">
                  <div className="flex items-center gap-3 mb-4">
                    <Schedule className="w-5 h-5 text-slate-400" />
                    <span className="text-sm font-semibold">{t('seo.businessHours')}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
                    {Object.entries(businessInfo?.hours || {}).map(([day, time]) => (
                      <React.Fragment key={day}>
                        <span>{day}</span>
                        <span className="text-right">{time}</span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Citations Table */}
            <section className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('seo.name')}</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('seo.status')}</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">{t('seo.address')}</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('seo.hours')}</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('seo.phone')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {citations.map((citation) => (
                    <tr key={citation.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-8">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 flex items-center justify-center text-red-600">
                            <Public className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-sm font-bold">{citation.name}</p>
                            <p className="text-xs text-slate-500">
                              {t('seo.lastUpdate')} {citation.lastUpdate} •{' '}
                              <a className="text-primary underline" href="#">{t('seo.notYourBusiness')}</a>
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-8">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          citation.status === 'matched'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {citation.status === 'matched' ? t('seo.matched') : t('seo.mismatch')}
                        </span>
                      </td>
                      <td className="px-6 py-8">
                        <span className={`px-3 py-1 rounded text-sm ${
                          citation.status === 'matched'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-slate-700'
                        }`}>
                          {citation.address}
                        </span>
                      </td>
                      <td className="px-6 py-8">
                        {citation.hours === 'Matched' ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">{t('seo.matched')}</span>
                        ) : (
                          <div className="space-y-1">
                            <span className="block bg-yellow-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                              {citation.hours}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-8">
                        <span className={`px-3 py-1 rounded text-sm ${
                          citation.status === 'matched'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-slate-700'
                        }`}>
                          {citation.phone}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>
        )}

        {/* Section: Local Search Grid */}
        {activeSection === 'grid' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">{t('reports.localSearchGrid')}</h1>
              <button className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50">
                {t('reports.reportSettings') || 'Report settings'}
              </button>
            </div>

            {/* Search form */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <div className="flex gap-3 flex-wrap">
                <div className="flex-1 min-w-[300px]">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    <Search className="w-3 h-3 inline mr-1" />{t('reports.keywordQuery')}
                  </label>
                  <input
                    type="text"
                    value={gridKeyword}
                    onChange={e => setGridKeyword(e.target.value)}
                    placeholder={t('reports.keywordPlaceholder')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                    onKeyDown={e => e.key === 'Enter' && businessInfo?.lat && businessInfo?.lng && handleCreateReport()}
                  />
                </div>
                <div className="flex items-end gap-2">
                  <button
                    onClick={handleCreateReport}
                    disabled={gridLoading || !gridKeyword.trim() || !businessInfo?.lat}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded-lg transition-colors"
                  >
                    {gridLoading ? (
                      <>
                        <Refresh className="w-4 h-4 animate-spin" />
                        {t('reports.scanning')}
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        {t('reports.createReport')}
                      </>
                    )}
                  </button>
                </div>
              </div>
              {(!businessInfo?.lat || !businessInfo?.lng) && (
                <p className="mt-2 text-xs text-amber-600 flex items-center gap-1">
                  <LocalOffer className="w-3 h-3" />
                  {t('reports.noCoords')}
                </p>
              )}
            </div>

            {/* Error state */}
            {gridError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                {gridError}
              </div>
            )}

            {/* Results: Grid + Summary */}
            {gridResult && !gridLoading && (
              <>
                {/* Summary KPI row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                    <div className="text-xs text-slate-400 font-semibold mb-1">{t('reports.avgRank')}</div>
                    <div className="text-2xl font-extrabold font-headline text-primary">
                      {gridResult.summary.averageRank ?? '20+'}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">{t('reports.across')} {gridResult.summary.totalPoints} {t('reports.points')}</div>
                  </div>
                  <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                    <div className="text-xs text-slate-400 font-semibold mb-1">{t('reports.top3Positions')}</div>
                    <div className="text-2xl font-extrabold font-headline text-green-600">
                      {gridResult.summary.top3Percent}%
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">{t('reports.ofAllPoints')}</div>
                  </div>
                  <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                    <div className="text-xs text-slate-400 font-semibold mb-1">{t('reports.top10Positions')}</div>
                    <div className="text-2xl font-extrabold font-headline text-blue-600">
                      {gridResult.summary.top10Percent}%
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">{t('reports.ofAllPoints')}</div>
                  </div>
                  <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                    <div className="text-xs text-slate-400 font-semibold mb-1">{t('reports.pointsScanned')}</div>
                    <div className="text-2xl font-extrabold font-headline text-slate-700">
                      {gridResult.summary.pointsWithData}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">{t('reports.across')} {gridResult.summary.totalPoints} {t('reports.gridPoints')}</div>
                  </div>
                </div>

                {/* Grid Map Visualization */}
                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-bold">{t('reports.searchGridMap')}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {t('reports.keyword')}: <span className="font-semibold text-slate-600">"{gridResult.keyword}"</span> — {gridResult.gridSize} {t('reports.gridPointsAround')} {businessInfo?.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded bg-green-500 inline-block" /> {t('reports.rank1to3')}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded bg-yellow-400 inline-block" /> {t('reports.rank4to10')}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded bg-red-400 inline-block" /> {t('reports.rank11plus')}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded bg-slate-200 inline-block" /> {t('reports.noData2')}
                      </span>
                    </div>
                  </div>

                  {/* SVG Grid Map */}
                  <div className="overflow-x-auto">
                    <div className="min-w-[600px]">
                      <svg
                        viewBox="0 0 600 600"
                        className="w-full"
                        style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                      >
                        {/* Grid lines */}
                        {[200, 400].map(pos => (
                          <React.Fragment key={pos}>
                            <line x1={pos} y1="0" x2={pos} y2="600" stroke="#e2e8f0" strokeWidth="1" />
                            <line x1="0" y1={pos} x2="600" y2={pos} stroke="#e2e8f0" strokeWidth="1" />
                          </React.Fragment>
                        ))}

                        {/* Grid cells */}
                        {gridResult.points.map((point) => {
                          const col = point.idx % 3;
                          const row = Math.floor(point.idx / 3);
                          const x = col * 200 + 10;
                          const y = row * 200 + 10;
                          const w = 180;
                          const h = 180;
                          const isSelected = selectedPoint?.idx === point.idx;

                          let bgColor = '#f1f5f9';
                          let textColor = '#94a3b8';
                          let rankLabel = t('reports.notFound');

                          if (point.businessRank !== null) {
                            if (point.businessRank <= 3) { bgColor = '#22c55e'; textColor = 'white'; }
                            else if (point.businessRank <= 10) { bgColor = '#facc15'; textColor = '#713f12'; }
                            else { bgColor = '#f87171'; textColor = 'white'; }
                            rankLabel = `#${point.businessRank}`;
                          }

                          return (
                            <g
                              key={point.idx}
                              onClick={() => setSelectedPoint(point)}
                              style={{ cursor: 'pointer' }}
                            >
                              <rect
                                x={x} y={y} width={w} height={h}
                                rx="12"
                                fill={bgColor}
                                stroke={isSelected ? '#2563eb' : 'transparent'}
                                strokeWidth={isSelected ? 3 : 0}
                                opacity={0.9}
                              />
                              <text
                                x={x + w / 2} y={y + h / 2 - 10}
                                textAnchor="middle"
                                fill={textColor}
                                fontSize="36"
                                fontWeight="800"
                              >
                                {rankLabel}
                              </text>
                              <text
                                x={x + w / 2} y={y + h / 2 + 15}
                                textAnchor="middle"
                                fill={textColor}
                                fontSize="11"
                                fontWeight="500"
                                opacity="0.8"
                              >
                                {point.businessRank !== null
                                  ? `${point.totalResults} ${t('reports.results')}`
                                  : t('reports.noData2')
                                }
                              </text>
                              {isSelected && (
                                <circle cx={x + w / 2} cy={y + h / 2 - 10} r="5" fill="white" opacity="0.5" />
                              )}
                            </g>
                          );
                        })}

                        {/* Center marker */}
                        <circle cx="300" cy="300" r="8" fill="#2563eb" />
                        <circle cx="300" cy="300" r="4" fill="white" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Selected Point Detail + All Competitors */}
                {selectedPoint && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Selected point detail */}
                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                      <h3 className="text-base font-bold mb-4">{t('reports.gridPointDetails')} #{selectedPoint.idx + 1}</h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-500">{t('reports.yourRankHere')}</span>
                          <span className={`font-bold ${selectedPoint.businessRank !== null ? (selectedPoint.businessRank <= 3 ? 'text-green-600' : selectedPoint.businessRank <= 10 ? 'text-yellow-600' : 'text-red-600') : 'text-slate-400'}`}>
                            {selectedPoint.businessRank !== null ? `#${selectedPoint.businessRank}` : t('reports.notFound')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">{t('reports.totalResults')}</span>
                          <span className="font-semibold">{selectedPoint.totalResults}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">{t('reports.coordinates')}</span>
                          <span className="font-mono text-xs">{selectedPoint.lat.toFixed(4)}, {selectedPoint.lng.toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">{t('reports.competitorsVisible')}</span>
                          <span className="font-semibold">{selectedPoint.competitors.length}</span>
                        </div>
                      </div>
                    </div>

                    {/* Competitors at this point */}
                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                      <h3 className="text-base font-bold mb-4">{t('reports.topCompetitors')}</h3>
                      <div className="space-y-2">
                        {selectedPoint.competitors.length > 0 ? (
                          selectedPoint.competitors.slice(0, 5).map(comp => (
                            <div key={comp.rank} className={`flex items-center gap-3 p-3 rounded-xl ${comp.isTarget ? 'bg-blue-50 border border-blue-200' : 'bg-slate-50'}`}>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                                comp.isTarget ? 'bg-primary text-white' : 'bg-white border border-slate-200 text-slate-600'
                              }`}>
                                {comp.rank}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className={`text-sm font-bold truncate ${comp.isTarget ? 'text-primary' : 'text-slate-700'}`}>
                                  {comp.name} {comp.isTarget && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded ml-1">{t('reports.you')}</span>}
                                </div>
                                <div className="text-xs text-slate-400 truncate">{comp.address}</div>
                              </div>
                              {comp.rating && (
                                <div className="flex items-center gap-1 text-sm flex-shrink-0">
                                  <Star className="w-3.5 h-3.5 text-amber-400" style={{ fontVariationSettings: "'FILL' 1" }} />
                                  <span className="font-semibold text-slate-700">{comp.rating}</span>
                                  {comp.reviews !== undefined && (
                                    <span className="text-xs text-slate-400">({comp.reviews})</span>
                                  )}
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-slate-400 text-center py-4">{t('reports.noCompetitorData')}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* All Points Overview Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100">
                    <h3 className="text-base font-bold">{t('reports.allGridPoints')}</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                        <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">{t('reports.point')}</th>
                        <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">{t('reports.yourRank')}</th>
                        <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">{t('reports.results2')}</th>
                        <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">{t('reports.topCompetitor')}</th>
                        <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">{t('reports.coordinates')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {gridResult.points.map((point) => (
                          <tr
                            key={point.idx}
                            onClick={() => setSelectedPoint(point)}
                            className={`hover:bg-slate-50 cursor-pointer transition-colors ${selectedPoint?.idx === point.idx ? 'bg-blue-50' : ''}`}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <Place className="w-4 h-4 text-slate-400" />
                                <span className="text-sm font-semibold text-slate-700">Point #{point.idx + 1}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {point.businessRank !== null ? (
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-bold ${
                                  point.businessRank <= 3 ? 'bg-green-100 text-green-700' :
                                  point.businessRank <= 10 ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  #{point.businessRank}
                                  {point.businessRank <= 3 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-sm">{t('reports.notRanked')}</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">{point.totalResults}</td>
                            <td className="px-6 py-4">
                              {point.competitors[0] ? (
                                <div>
                                  <div className="text-sm font-semibold text-slate-700 truncate max-w-[200px]">{point.competitors[0].name}</div>
                                  <div className="text-xs text-slate-400 flex items-center gap-1">
                                    <Star className="w-3 h-3 text-amber-400" style={{ fontVariationSettings: "'FILL' 1" }} />
                                    {point.competitors[0].rating} ({point.competitors[0].reviews} {t('reports.reviews')})
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-400 text-sm">—</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-mono text-xs text-slate-500">{point.lat.toFixed(4)}, {point.lng.toFixed(4)}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* Empty state (no report yet) */}
            {!gridResult && !gridLoading && (
              <>
                <section className="relative w-full h-[500px] flex items-center justify-center bg-gradient-to-b from-slate-50 to-white rounded-2xl border border-slate-200">
                  <div className="relative z-10 text-center max-w-lg px-4">
                    <div className="mb-4 inline-flex items-center justify-center p-3 bg-slate-100 rounded-full border border-slate-200">
                      <Public className="w-6 h-6 text-slate-500" />
                    </div>
                    <h2 className="text-2xl font-bold mb-3">{t('reports.localSearchGrid')}</h2>
                    <p className="text-slate-500 text-sm leading-relaxed mb-6">
                      {t('reports.localSearchGridDesc')}
                    </p>
                    <button
                      onClick={handleCreateReport}
                      disabled={!gridKeyword.trim() || !businessInfo?.lat}
                      className="bg-primary text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      Create report
                    </button>
                  </div>
                </section>

                <section className="border-t border-slate-200 pt-10">
                  <h2 className="text-lg font-bold mb-2">{t('reports.rankingCompetitors')}</h2>
                  <p className="text-sm text-slate-500 mb-8">{t('reports.rankingCompetitorsDesc')}</p>
                  <div className="bg-slate-50 border border-dashed border-slate-300 rounded-lg p-16 flex flex-col items-center justify-center text-center">
                    <div className="mb-4 inline-flex items-center justify-center p-3 bg-white rounded-full border border-slate-200 shadow-sm">
                      <Public className="w-6 h-6 text-slate-400" />
                    </div>
                    <h3 className="text-base font-bold mb-2">{t('reports.localSearchGrid')}</h3>
                    <p className="text-slate-400 text-xs max-w-md">
                      {t('reports.noDataYet')}
                    </p>
                  </div>
                </section>
              </>
            )}
          </div>
        )}

        {/* Section: Optimization */}
        {activeSection === 'optimization' && (
          <div className="flex flex-col items-center justify-center min-h-[600px]">
            <div className="max-w-xl w-full text-center space-y-8 px-6">
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <LocalOffer className="w-7 h-7 text-slate-700" />
                  <h2 className="text-3xl font-extrabold tracking-tight">{t('reports.seoOptimization')}</h2>
                </div>
                <h3 className="text-2xl font-semibold text-slate-600">{businessInfo?.name}</h3>
                  <p className="text-slate-500 max-w-sm mx-auto text-sm leading-relaxed">
                    {t('reports.generateOptReport')}
                  </p>
              </div>

              <div className="space-y-4 flex flex-col items-center">
                <div className="relative w-72">
                  <select className="w-full pl-4 pr-10 py-3 border border-slate-300 rounded-lg text-sm appearance-none focus:ring-2 focus:ring-primary focus:border-primary">
                    <option>{t('reports.periodLastWeek')}</option>
                    <option>{t('reports.periodLastMonth')}</option>
                    <option>{t('reports.periodLast3Months')}</option>
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</span>
                </div>
                <button className="flex items-center bg-pink-50 hover:bg-pink-100 border border-pink-100 text-slate-800 font-semibold px-5 py-3 rounded-lg transition-all">
                  <LocalOffer className="w-4 h-4 mr-2 text-pink-500" />
                  <span className="mr-3">{t('reports.generateReport')}</span>
                  <span className="bg-white border border-slate-200 text-[10px] px-2 py-0.5 rounded">5 {t('reports.credits')}</span>
                </button>
              </div>
            </div>

            {/* Chat Bubble */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
              <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex items-start gap-3 max-w-sm mb-2 animate-pulse">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium leading-tight mb-1">Just checking in to see if you still ne...</p>
                  <p className="text-[10px] text-slate-400">Fin • 16分钟</p>
                </div>
              </div>
              <button className="relative w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                <Public className="w-7 h-7 text-white" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
