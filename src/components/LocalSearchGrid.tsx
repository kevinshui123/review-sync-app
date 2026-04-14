import React, { useState, useEffect } from 'react';
import { Search, Map, Refresh, Place, Close, Star } from '@mui/icons-material';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import { apiGet, apiPost } from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import { PageLoader } from './PageLoader';
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
  if (rank <= 3) return '#10b981';
  if (rank <= 10) return '#f59e0b';
  return '#ef4444';
}

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => { map.flyTo(center, zoom, { duration: 0.8 }); }, [center, zoom, map]);
  return null;
}

interface BusinessInfo {
  name: string; address: string; phone: string; website: string; category: string;
  keywords: string; hours: Record<string, string>; lat?: number; lng?: number;
}

interface Competitor {
  rank: number; name: string; address: string; rating: number | null;
  reviews: number | null; phone: string; isTarget: boolean;
  thumbnail?: string | null; types?: string[];
}

interface GridPoint {
  idx: number; lat: number; lng: number; businessRank: number | null;
  totalResults: number; hasData: boolean; competitors: Competitor[];
}

interface GridSummary {
  totalPoints: number; pointsWithData: number; pointsRanked: number;
  averageRank: number | null; top3Percent: number; top10Percent: number;
}

interface LocalSearchGridResult {
  keyword: string; center: { lat: number; lng: number }; gridSize: number;
  points: GridPoint[]; topCompetitors: never[]; summary: GridSummary;
}

export function LocalSearchGrid() {
  const { t } = useLanguage();
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [gridKeyword, setGridKeyword] = useState('restaurant near me');
  const [gridSize, setGridSize] = useState(9);
  const [gridRadius, setGridRadius] = useState(5);
  const [gridResult, setGridResult] = useState<LocalSearchGridResult | null>(() => {
    try { return localStorage.getItem('local_grid_result') ? JSON.parse(localStorage.getItem('local_grid_result')!) : null; }
    catch { return null; }
  });
  const [gridLoading, setGridLoading] = useState(false);
  const [gridError, setGridError] = useState<string | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<GridPoint | null>(null);

  useEffect(() => {
    if (gridResult) localStorage.setItem('local_grid_result', JSON.stringify(gridResult));
  }, [gridResult]);

  const handleCreateReport = async () => {
    if (!gridKeyword.trim() || !businessInfo?.lat || !businessInfo?.lng) return;
    setGridLoading(true);
    setGridError(null);
    setSelectedPoint(null);
    try {
      const res = await apiPost('/api/seo/local-search-grid', {
        keyword: gridKeyword, lat: businessInfo!.lat, lng: businessInfo!.lng,
        businessName: businessInfo!.name, gridSize, radius: gridRadius,
      });
      if (res.ok) { const data = await res.json(); setGridResult(data); }
      else { const err = await res.json().catch(() => ({ error: 'Failed' })); setGridError(err.error); }
    } catch (e: any) { setGridError(e.message || 'Network error'); }
    finally { setGridLoading(false); }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const locationsRes = await apiGet('/api/embedsocial/locations');
        let locations: any[] = locationsRes.ok ? await locationsRes.json() : [];
        const hasCoords = locations.some((l: any) => l.latitude || l.lat);
        if (locations.length > 0 && !hasCoords) {
          try {
            await apiPost('/api/embedsocial/listings/backfill-coordinates');
            const refreshed = await apiGet('/api/embedsocial/locations');
            if (refreshed.ok) locations = await refreshed.json();
          } catch { /* ignore */ }
        }
        const primary = locations[0];
        if (primary) {
          setBusinessInfo({
            name: primary.name || 'Business', address: primary.address || '',
            phone: primary.phoneNumber || '', website: primary.websiteUrl || '',
            category: primary.category || '', keywords: 'restaurant, mini bowl', hours: {},
            lat: primary.latitude || primary.lat, lng: primary.longitude || primary.lng,
          });
        } else {
          setBusinessInfo({
            name: 'Mahjong mini bowl-Baltimore', address: '3105 saint pual st, unit A, Baltimore, 21218, US',
            phone: '(443) 869-2177', website: 'https://mahjong-box.com/', category: 'Restaurant',
            keywords: 'Asian Food', hours: { Monday: '11 am - 8 pm' }, lat: 39.3305, lng: -76.6150,
          });
        }
      } catch (error) { console.error('Failed:', error); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) {
    return <PageLoader message={t('seo.loadingSeo')} subMessage={t('seo.loadingSeoDesc')} />;
  }

  return (
    <div className="lsg-container">
      <div className="lsg-header">
        <h2 className="lsg-title">{t('reports.localSearchGrid')}</h2>
      </div>

      {/* Search Form */}
      <div className="card lsg-form">
        <div className="lsg-form-grid">
          <div className="form-group">
            <label className="form-label">{t('seo.keyword')}</label>
            <input type="text" value={gridKeyword} onChange={(e) => setGridKeyword(e.target.value)}
              className="input" placeholder="e.g. restaurant near me"
              onKeyDown={(e) => e.key === 'Enter' && businessInfo?.lat && handleCreateReport()} />
          </div>
          <div className="form-group">
            <label className="form-label">Grid Density</label>
            <select className="input select" value={gridSize} onChange={(e) => setGridSize(Number(e.target.value))}>
              <option value={3}>3×3 (9 pts)</option>
              <option value={5}>5×5 (25 pts)</option>
              <option value={7}>7×7 (49 pts)</option>
              <option value={9}>9×9 (81 pts)</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Radius</label>
            <select className="input select" value={gridRadius} onChange={(e) => setGridRadius(Number(e.target.value))}>
              {[1,2,5,10,15,20].map(v => <option key={v} value={v}>{v} miles</option>)}
            </select>
          </div>
          <div className="form-group-btn">
            <button className="btn btn-primary" onClick={handleCreateReport} disabled={gridLoading || !gridKeyword.trim() || !businessInfo?.lat}>
              <Search sx={{ fontSize: 18 }} />
              {gridLoading ? t('reports.scanning') : 'Scan'}
            </button>
          </div>
        </div>
        {!businessInfo?.lat && <p className="form-warning">{t('seo.noCoords')}</p>}
      </div>

      {gridError && <div className="alert-error">{gridError}</div>}

      {gridResult && !gridLoading && (
        <>
          {/* Stats */}
          <div className="stats-grid stats-grid-4">
            <div className="stat-card">
              <div className="stat-label">{t('seo.avgRank')}</div>
              <div className="stat-value">{gridResult.summary.averageRank ?? '—'}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">{t('seo.rank1to3')}</div>
              <div className="stat-value" style={{ color: 'var(--color-success)' }}>{gridResult.summary.top3Percent}%</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">{t('seo.rank4to10')}</div>
              <div className="stat-value" style={{ color: 'var(--color-accent)' }}>{gridResult.summary.top10Percent}%</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">{t('seo.pointsScanned')}</div>
              <div className="stat-value">{gridResult.summary.pointsWithData}</div>
            </div>
          </div>

          {/* Map */}
          <div className="card">
            <div className="card-header-row">
              <h3 className="card-title">{t('seo.searchMap')}</h3>
                <div className="legend">
                  <span className="legend-item"><span className="legend-dot" style={{ background: '#10b981' }} /> {t('seo.rank1to3')}</span>
                  <span className="legend-item"><span className="legend-dot" style={{ background: '#f59e0b' }} /> {t('seo.rank4to10')}</span>
                  <span className="legend-item"><span className="legend-dot" style={{ background: '#ef4444' }} /> {t('seo.rank11plus')}</span>
              </div>
            </div>
            <div className="map-container">
              <MapContainer center={[businessInfo!.lat!, businessInfo!.lng!]} zoom={14} style={{ height: '400px', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {gridResult.points.map((point) => (
                  <CircleMarker key={point.idx} center={[point.lat, point.lng]}
                    radius={point.businessRank === null ? 10 : 14}
                    pathOptions={{ color: getRankColor(point.businessRank), fillColor: getRankColor(point.businessRank), fillOpacity: 0.7, weight: 2 }}
                    eventHandlers={{ click: () => setSelectedPoint(point) }}>
                    <Tooltip permanent={false} direction="top">#{point.businessRank ?? '?'}</Tooltip>
                  </CircleMarker>
                ))}
                <CircleMarker center={[businessInfo!.lat!, businessInfo!.lng!]} radius={10}
                  pathOptions={{ color: '#1e3a5f', fillColor: '#1e3a5f', fillOpacity: 1, weight: 3 }}>
                  <Tooltip permanent direction="bottom">{businessInfo?.name}</Tooltip>
                </CircleMarker>
                {selectedPoint && <MapController center={[selectedPoint.lat, selectedPoint.lng]} zoom={15} />}
              </MapContainer>
            </div>
          </div>

          {/* Point Detail */}
          {selectedPoint && (
            <div className="card">
              <div className="card-header-row">
                <div>
                  <h3 className="card-title">Point #{selectedPoint.idx + 1} — {selectedPoint.totalResults} Results</h3>
                  <p className="card-subtitle">
                    {selectedPoint.businessRank !== null ? `Your business ranks #${selectedPoint.businessRank}` : 'Your business not ranked in top results'}
                  </p>
                </div>
                <button className="btn-icon" onClick={() => setSelectedPoint(null)}><Close sx={{ fontSize: 20 }} /></button>
              </div>
              <div className="table-container" style={{ maxHeight: 400 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Rank</th><th>Business</th><th>Rating</th><th>Reviews</th><th>Category</th><th>Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPoint.competitors.length > 0 ? selectedPoint.competitors.map((comp, i) => (
                      <tr key={i} className={comp.isTarget ? 'target-row' : ''}>
                        <td>
                          <span className="rank-badge" style={{ background: getRankColor(comp.rank) }}>{comp.rank}</span>
                          {comp.isTarget && <span className="you-badge">YOU</span>}
                        </td>
                        <td>
                          <div className="competitor-info">
                            {comp.thumbnail && <img src={comp.thumbnail} alt="" className="competitor-thumb" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                            <div className="competitor-thumb-placeholder"><Place sx={{ fontSize: 20 }} /></div>
                            <div>
                              <div className="competitor-name">{comp.name}</div>
                              <div className="competitor-address">{comp.address || '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td>{comp.rating !== null ? <span className="rating"><Star sx={{ fontSize: 14, color: '#f59e0b', fontVariationSettings: "'FILL' 1" }} />{comp.rating.toFixed(1)}</span> : '—'}</td>
                        <td>{comp.reviews?.toLocaleString() ?? '—'}</td>
                        <td>{comp.types?.slice(0,2).join(', ') || '—'}</td>
                        <td>{comp.phone || '—'}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan={6} className="empty-cell">No data for this point</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="table-footer">
                <span>Showing {selectedPoint.competitors.length} of {selectedPoint.totalResults} results</span>
                {selectedPoint.businessRank === null && selectedPoint.totalResults > 20 && <span className="text-warning">Not in top 20</span>}
              </div>
            </div>
          )}

          {/* All Points */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 16 }}>{t('seo.gridPoints')}</h3>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr><th>Point</th><th>Rank</th><th>Results</th><th>Top Competitor</th></tr>
                </thead>
                <tbody>
                  {gridResult.points.map((point) => (
                    <tr key={point.idx} className={selectedPoint?.idx === point.idx ? 'selected' : ''} onClick={() => setSelectedPoint(point)}>
                      <td>#{point.idx + 1}</td>
                      <td>
                        {point.businessRank !== null ? (
                          <span className={`badge ${point.businessRank <= 3 ? 'badge-success' : point.businessRank <= 10 ? 'badge-warning' : 'badge-error'}`}>
                            #{point.businessRank}
                          </span>
                        ) : <span className="text-muted">Not ranked</span>}
                      </td>
                      <td>{point.totalResults}</td>
                      <td>{point.competitors[0]?.name || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!gridResult && !gridLoading && (
        <div className="card empty-card">
          <div className="empty-icon"><Map sx={{ fontSize: 48 }} /></div>
          <h3 className="empty-title">{t('seo.localSearchGrid')}</h3>
          <p className="empty-desc">{t('seo.scanDesc')}</p>
        </div>
      )}

      <style>{`
        .lsg-loading {
          display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px; gap: 16px;
        }
        .loading-spinner {
          width: 32px; height: 32px; border: 3px solid var(--color-border); border-top-color: var(--color-primary);
          border-radius: 999px; animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .lsg-container { padding: 24px; }
        .lsg-header { margin-bottom: 20px; }
        .lsg-title {
          font-family: var(--font-headline); font-size: 20px; font-weight: 700; color: var(--color-text-primary);
          letter-spacing: -0.02em; margin: 0;
        }
        .lsg-form { margin-bottom: 20px; padding: 20px; }
        .lsg-form-grid {
          display: grid; grid-template-columns: 1fr 140px 140px auto; gap: 12px; align-items: end;
        }
        @media (max-width: 768px) { .lsg-form-grid { grid-template-columns: 1fr; } }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group-btn { display: flex; align-items: flex-end; }
        .form-label { font-size: 12px; font-weight: 600; color: var(--color-text-secondary); }
        .form-warning { margin: 12px 0 0; font-size: 12px; color: var(--color-warning); }

        .alert-error {
          padding: 12px 16px; background: var(--color-error-bg); color: var(--color-error-text);
          border-radius: 8px; margin-bottom: 16px; font-size: 14px; font-weight: 500;
        }

        .stats-grid { display: grid; gap: 16px; margin-bottom: 20px; }
        .stats-grid-4 { grid-template-columns: repeat(4, 1fr); }
        @media (max-width: 1024px) { .stats-grid-4 { grid-template-columns: repeat(2, 1fr); } }

        .card-header-row {
          display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;
        }
        .card-title {
          font-family: var(--font-headline); font-size: 15px; font-weight: 600; color: var(--color-text-primary); margin: 0;
        }
        .card-subtitle { font-size: 12px; color: var(--color-text-muted); margin: 4px 0 0; }
        .legend { display: flex; gap: 16px; }
        .legend-item { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--color-text-muted); }
        .legend-dot { width: 10px; height: 10px; border-radius: 999px; }

        .map-container { border-radius: 8px; overflow: hidden; }

        .table-container { overflow-x: auto; }
        .table tbody tr.selected { background: var(--color-primary-muted); }
        .table tbody tr.target-row { background: var(--color-info-bg); }
        .table-footer {
          display: flex; justify-content: space-between; padding: 12px 16px;
          background: var(--color-surface); border-top: 1px solid var(--color-border);
          font-size: 12px; color: var(--color-text-muted);
        }
        .text-warning { color: var(--color-warning); font-weight: 600; }
        .text-muted { color: var(--color-text-muted); }

        .rank-badge {
          display: inline-flex; align-items: center; justify-content: center;
          width: 28px; height: 28px; border-radius: 999px; color: white;
          font-size: 11px; font-weight: 700; margin-right: 6px;
        }
        .you-badge {
          display: inline-flex; padding: 1px 6px; background: var(--color-primary); color: white;
          font-size: 9px; font-weight: 700; border-radius: 4px;
        }
        .competitor-info { display: flex; align-items: center; gap: 10px; }
        .competitor-thumb { width: 40px; height: 40px; border-radius: 8px; object-fit: cover; }
        .competitor-thumb-placeholder {
          width: 40px; height: 40px; border-radius: 8px; background: var(--color-surface);
          display: flex; align-items: center; justify-content: center; color: var(--color-text-muted);
        }
        .competitor-name { font-weight: 600; font-size: 14px; color: var(--color-text-primary); }
        .competitor-address { font-size: 12px; color: var(--color-text-muted); }
        .rating { display: flex; align-items: center; gap: 4px; font-weight: 600; font-size: 13px; }
        .empty-cell { text-align: center; padding: 32px; color: var(--color-text-muted); }

        .empty-card { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 64px 24px; }
        .empty-icon {
          width: 80px; height: 80px; background: var(--color-surface); border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          color: var(--color-text-disabled); margin-bottom: 20px;
        }
        .empty-title {
          font-family: var(--font-headline); font-size: 18px; font-weight: 600;
          color: var(--color-text-primary); margin: 0 0 8px;
        }
        .empty-desc { font-size: 14px; color: var(--color-text-muted); margin: 0; max-width: 320px; }
      `}</style>
    </div>
  );
}
