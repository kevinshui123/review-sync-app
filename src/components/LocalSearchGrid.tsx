import React, { useState, useEffect } from 'react';
import {
  Search,
  Map,
  Refresh,
  TrendingUp,
  Place,
  OpenInNew,
  Close,
  Star,
} from '@mui/icons-material';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import { apiGet, apiPost } from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function getRankColor(rank: number | null): string {
  if (rank === null) return '#94a3b8';
  if (rank <= 3) return '#22c55e';
  if (rank <= 10) return '#facc15';
  return '#f87171';
}

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 0.8 });
  }, [center, zoom, map]);
  return null;
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

interface Competitor {
  rank: number;
  name: string;
  address: string;
  rating: number | null;
  reviews: number | null;
  phone: string;
  isTarget: boolean;
  thumbnail?: string | null;
  types?: string[];
}

interface GridPoint {
  idx: number;
  lat: number;
  lng: number;
  businessRank: number | null;
  totalResults: number;
  hasData: boolean;
  competitors: Competitor[];
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
  topCompetitors: never[];
  summary: GridSummary;
}

interface LocalSearchGridProps {
  setActiveTab?: (tab: string) => void;
}

function formatTypes(types: string[] | undefined): string {
  if (!types || types.length === 0) return '—';
  const display = types.slice(0, 2).map(t =>
    t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  );
  return display.join(', ');
}

function RankingRow({ competitor, businessName }: { competitor: Competitor; businessName: string }) {
  const rankColor = getRankColor(competitor.rank);

  return (
    <tr className={`hover:bg-slate-50 ${competitor.isTarget ? 'bg-blue-50' : ''}`}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: rankColor }}
          >
            {competitor.rank}
          </span>
          {competitor.isTarget && (
            <span className="px-1.5 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded">
              YOU
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {competitor.thumbnail ? (
            <img
              src={competitor.thumbnail}
              alt={competitor.name}
              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`${competitor.thumbnail ? 'hidden' : ''} w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0`}>
            <Place className="w-6 h-6 text-slate-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">
              {competitor.name}
            </p>
            <p className="text-xs text-slate-400 truncate">{competitor.address || '—'}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        {competitor.rating !== null && competitor.rating !== undefined ? (
          <div className="flex items-center justify-center gap-1">
            <Star className="w-3.5 h-3.5 text-yellow-500" />
            <span className="text-sm font-semibold text-slate-700">{competitor.rating.toFixed(1)}</span>
          </div>
        ) : (
          <span className="text-sm text-slate-400">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-center">
        {competitor.reviews !== null && competitor.reviews !== undefined ? (
          <span className="text-sm text-slate-600">{competitor.reviews.toLocaleString()}</span>
        ) : (
          <span className="text-sm text-slate-400">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-center">
        <span className="text-xs text-slate-500 max-w-[120px] truncate block">
          {formatTypes(competitor.types)}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        {competitor.phone ? (
          <span className="text-sm text-slate-600">{competitor.phone}</span>
        ) : (
          <span className="text-sm text-slate-400">—</span>
        )}
      </td>
    </tr>
  );
}

export function LocalSearchGrid({ setActiveTab }: LocalSearchGridProps) {
  const { t } = useLanguage();
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const [gridKeyword, setGridKeyword] = useState('restaurant near me');
  const [gridSize, setGridSize] = useState(9);
  const [gridRadius, setGridRadius] = useState(5);
  const [gridResult, setGridResult] = useState<LocalSearchGridResult | null>(() => {
    try {
      const saved = localStorage.getItem('local_grid_result');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [gridLoading, setGridLoading] = useState(false);
  const [gridError, setGridError] = useState<string | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<GridPoint | null>(null);

  useEffect(() => {
    if (gridResult) {
      localStorage.setItem('local_grid_result', JSON.stringify(gridResult));
    }
  }, [gridResult]);

  const handleCreateReport = async () => {
    if (!gridKeyword.trim() || !businessInfo?.lat || !businessInfo?.lng) return;
    setGridLoading(true);
    setGridError(null);
    setSelectedPoint(null);
    try {
      const res = await apiPost('/api/seo/local-search-grid', {
        keyword: gridKeyword,
        lat: businessInfo!.lat,
        lng: businessInfo!.lng,
        businessName: businessInfo!.name,
        gridSize: gridSize,
        radius: gridRadius,
      });
      if (res.ok) {
        const data = await res.json();
        setGridResult(data);
      } else {
        const err = await res.json().catch(() => ({ error: 'Failed to generate report' }));
        setGridError(err.error || 'Failed to generate report');
      }
    } catch (e: any) {
      setGridError(e.message || 'Network error');
    } finally {
      setGridLoading(false);
    }
  };

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
            console.warn('[LocalSearchGrid] Backfill failed:', e);
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
        console.error('Failed to fetch data:', error);
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('reports.localSearchGrid')}</h1>
        <button className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50">
          {t('reports.reportSettings')}
        </button>
      </div>

      {/* Search Controls */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <div className="flex gap-3 flex-wrap items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              <Search className="w-3 h-3 inline mr-1" />{t('reports.keywordQuery')}
            </label>
            <input
              type="text"
              value={gridKeyword}
              onChange={e => setGridKeyword(e.target.value)}
              placeholder={t('reports.keywordPlaceholder')}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:ring-primary/20"
              onKeyDown={e => e.key === 'Enter' && businessInfo?.lat && handleCreateReport()}
            />
          </div>
          <div className="w-40">
            <label className="block text-xs font-semibold text-slate-500 mb-1">Grid Density</label>
            <select
              value={gridSize}
              onChange={(e) => setGridSize(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-sm"
            >
              <option value={3}>3×3 (9 pts)</option>
              <option value={5}>5×5 (25 pts)</option>
              <option value={7}>7×7 (49 pts)</option>
              <option value={9}>9×9 (81 pts)</option>
            </select>
          </div>
          <div className="w-40">
            <label className="block text-xs font-semibold text-slate-500 mb-1">Scan Radius</label>
            <select
              value={gridRadius}
              onChange={(e) => setGridRadius(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-sm"
            >
              <option value={1}>1 mile</option>
              <option value={2}>2 miles</option>
              <option value={5}>5 miles</option>
              <option value={10}>10 miles</option>
              <option value={15}>15 miles</option>
              <option value={20}>20 miles</option>
            </select>
          </div>
          <button
            onClick={handleCreateReport}
            disabled={gridLoading || !gridKeyword.trim() || !businessInfo?.lat}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded-lg"
          >
            {gridLoading ? (
              <><Refresh className="w-4 h-4 animate-spin" />{t('reports.scanning')}</>
            ) : (
              <><Search className="w-4 h-4" />{t('reports.createReport')}</>
            )}
          </button>
        </div>
        {(!businessInfo?.lat || !businessInfo?.lng) && (
          <p className="mt-2 text-xs text-amber-600">{t('reports.noCoords')}</p>
        )}
      </div>

      {gridError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{gridError}</div>
      )}

      {gridResult && !gridLoading && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <div className="text-xs text-slate-400 font-semibold mb-1">{t('reports.avgRank')}</div>
              <div className="text-2xl font-extrabold text-primary">{gridResult.summary.averageRank ?? '20+'}</div>
              <div className="text-[10px] text-slate-400 mt-1">{t('reports.across')} {gridResult.summary.totalPoints} pts</div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <div className="text-xs text-slate-400 font-semibold mb-1">{t('reports.top3Positions')}</div>
              <div className="text-2xl font-extrabold text-green-600">{gridResult.summary.top3Percent}%</div>
              <div className="text-[10px] text-slate-400 mt-1">{t('reports.ofAllPoints')}</div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <div className="text-xs text-slate-400 font-semibold mb-1">{t('reports.top10Positions')}</div>
              <div className="text-2xl font-extrabold text-blue-600">{gridResult.summary.top10Percent}%</div>
              <div className="text-[10px] text-slate-400 mt-1">{t('reports.ofAllPoints')}</div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <div className="text-xs text-slate-400 font-semibold mb-1">{t('reports.pointsScanned')}</div>
              <div className="text-2xl font-extrabold text-slate-700">{gridResult.summary.pointsWithData}</div>
              <div className="text-[10px] text-slate-400 mt-1">{t('reports.across')} {gridResult.summary.totalPoints} pts</div>
            </div>
          </div>

          {/* Map */}
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold">{t('reports.searchGridMap')}</h3>
                <p className="text-xs text-slate-400">"{gridResult.keyword}" · {gridResult.gridSize} pts around {businessInfo?.name}</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500" /> Rank 1-3</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-400" /> Rank 4-10</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-400" /> Rank 11+</span>
              </div>
            </div>
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
              <MapContainer
                center={[businessInfo!.lat!, businessInfo!.lng!]}
                zoom={14}
                style={{ height: '400px', width: '100%' }}
                zoomControl={true}
              >
                <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {gridResult.points.map((point) => (
                  <CircleMarker
                    key={point.idx}
                    center={[point.lat, point.lng]}
                    radius={point.businessRank === null ? 10 : 14}
                    pathOptions={{
                      color: getRankColor(point.businessRank),
                      fillColor: getRankColor(point.businessRank),
                      fillOpacity: 0.7,
                      weight: 2
                    }}
                    eventHandlers={{ click: () => setSelectedPoint(point) }}
                  >
                    <Tooltip permanent={false} direction="top">#{point.businessRank ?? '?'}</Tooltip>
                  </CircleMarker>
                ))}
                <CircleMarker
                  center={[businessInfo!.lat!, businessInfo!.lng!]}
                  radius={10}
                  pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 1, weight: 3 }}
                >
                  <Tooltip permanent direction="bottom">{businessInfo?.name}</Tooltip>
                </CircleMarker>
                {selectedPoint && <MapController center={[selectedPoint.lat, selectedPoint.lng]} zoom={15} />}
              </MapContainer>
            </div>
          </div>

          {/* Point Detail Panel */}
          {selectedPoint && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Point #{selectedPoint.idx + 1} — {selectedPoint.totalResults} Results</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedPoint.businessRank !== null
                      ? `Your business ranks #${selectedPoint.businessRank}`
                      : 'Your business not ranked in top results'}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedPoint(null)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <Close className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 border-b border-slate-200 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase w-24">Rank</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Business</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center w-20">Rating</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center w-24">Reviews</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center w-32">Category</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center w-32">Phone</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedPoint.competitors.length > 0 ? (
                      selectedPoint.competitors.map((comp, i) => (
                        <RankingRow
                          key={i}
                          competitor={comp}
                          businessName={businessInfo?.name || ''}
                        />
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">
                          No data for this point yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                <span>Showing {selectedPoint.competitors.length} of {selectedPoint.totalResults} results</span>
                {selectedPoint.businessRank === null && selectedPoint.totalResults > 20 && (
                  <span className="text-amber-600">Your business not in top 20</span>
                )}
              </div>
            </div>
          )}

          {/* Grid Points Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold">{t('reports.allGridPoints')}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Point</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">{t('reports.yourRank')}</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Results</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">{t('reports.topCompetitor')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {gridResult.points.map((point) => (
                    <tr
                      key={point.idx}
                      onClick={() => setSelectedPoint(point)}
                      className={`hover:bg-slate-50 cursor-pointer ${selectedPoint?.idx === point.idx ? 'bg-blue-50' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-slate-700">Point #{point.idx + 1}</span>
                      </td>
                      <td className="px-6 py-4">
                        {point.businessRank !== null ? (
                          <span className={`px-2 py-1 rounded text-sm font-bold ${
                            point.businessRank <= 3 ? 'bg-green-100 text-green-700' :
                            point.businessRank <= 10 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                          }`}>#{point.businessRank}</span>
                        ) : (
                          <span className="text-slate-400 text-sm">{t('reports.notRanked')}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{point.totalResults}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {point.competitors[0]?.name || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!gridResult && !gridLoading && (
        <div className="bg-white rounded-xl p-12 border border-slate-200 text-center">
          <Map className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700 mb-2">{t('reports.localSearchGrid')}</h3>
          <p className="text-sm text-slate-500 mb-6">Enter a keyword and click Create Report to analyze your local search rankings.</p>
        </div>
      )}
    </div>
  );
}
