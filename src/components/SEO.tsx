import React, { useState, useEffect } from 'react';
import { Search, Public, Map, Description, Phone, Schedule, Language, LocalOffer, AutoAwesome, Lightbulb, Speed, Refresh, CheckCircle, History, Add, Delete, Article, Image, Error } from '@mui/icons-material';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
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

interface SEOProps {
  setActiveTab: (tab: string) => void;
  activeSection?: string;
  setActiveSection?: (section: string) => void;
}

interface GridPoint {
  idx: number;
  lat: number;
  lng: number;
  businessRank: number | null;
  totalResults: number;
}

interface LocalSearchGridResult {
  keyword: string;
  center: { lat: number; lng: number };
  gridSize: number;
  points: GridPoint[];
  summary: {
    totalPoints: number;
    pointsWithData: number;
    averageRank: number | null;
    top3Percent: number;
    top10Percent: number;
  };
}

interface BusinessInfo {
  name: string;
  address: string;
  phone: string;
  website: string;
  category: string;
  lat?: number;
  lng?: number;
  hours: Record<string, string>;
}

function getRankColor(rank: number | null): string {
  if (rank === null) return '#94a3b8';
  if (rank <= 3) return '#10b981';
  if (rank <= 10) return '#f59e0b';
  return '#ef4444';
}

export function SEO({ setActiveTab, activeSection: externalActiveSection, setActiveSection: extSetActiveSection }: SEOProps) {
  const { t, language } = useLanguage();
  const [internalActiveSection, setInternalActiveSection] = useState('grid');
  const activeSection2 = externalActiveSection || internalActiveSection;
  const setActiveSection2 = (section: string) => {
    if (extSetActiveSection) extSetActiveSection(section);
    else setInternalActiveSection(section);
  };

  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Grid state
  const [gridKeyword, setGridKeyword] = useState('restaurant near me');
  const [gridSize, setGridSize] = useState(9);
  const [gridRadius, setGridRadius] = useState(5);
  const [gridResult, setGridResult] = useState<LocalSearchGridResult | null>(() => {
    try { return localStorage.getItem('local_grid_result') ? JSON.parse(localStorage.getItem('local_grid_result')!) : null; }
    catch { return null; }
  });
  const [gridLoading, setGridLoading] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<GridPoint | null>(null);

  // SEO Report state
  const [seoReport, setSeoReport] = useState<any>(() => {
    try { return localStorage.getItem('seo_report') ? JSON.parse(localStorage.getItem('seo_report')!) : null; }
    catch { return null; }
  });
  const [seoLoading, setSeoLoading] = useState(false);

  useEffect(() => {
    if (gridResult) localStorage.setItem('local_grid_result', JSON.stringify(gridResult));
    if (seoReport) localStorage.setItem('seo_report', JSON.stringify(seoReport));
  }, [gridResult, seoReport]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiGet('/api/embedsocial/locations');
        let locations: any[] = [];
        if (res.ok) locations = await res.json();
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
            name: primary.name || 'Business',
            address: primary.address || '',
            phone: primary.phoneNumber || '',
            website: primary.websiteUrl || '',
            category: primary.category || '',
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
            hours: { Monday: '11 am - 8 pm' },
            lat: 39.3305, lng: -76.6150,
          });
        }
      } catch (error) {
        console.error('Failed to fetch SEO data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCreateReport = async () => {
    if (!gridKeyword.trim() || !businessInfo?.lat) return;
    setGridLoading(true);
    try {
      const res = await apiPost('/api/seo/local-search-grid', {
        keyword: gridKeyword, lat: businessInfo.lat, lng: businessInfo.lng!,
        businessName: businessInfo.name, gridSize, radius: gridRadius,
      });
      if (res.ok) {
        const data = await res.json();
        setGridResult(data);
      }
    } catch (error) {
      console.error('Grid error:', error);
    } finally {
      setGridLoading(false);
    }
  };

  const generateSeoReport = async () => {
    setSeoLoading(true);
    try {
      const res = await apiPost('/api/reports/seo-optimization', { lang: language });
      if (res.ok) setSeoReport(await res.json());
    } catch (error) {
      console.error('SEO report error:', error);
    } finally {
      setSeoLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="seo-loading">
        <div className="loading-spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'grid', label: t('reports.localSearchGrid'), icon: Map },
    { id: 'citations', label: 'Citations', icon: Public },
    { id: 'optimization', label: t('reports.seoOptimization'), icon: Lightbulb },
  ];

  return (
    <div className="seo-container">
      {/* Sub Navigation */}
      <div className="seo-tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} className={`seo-tab ${activeSection2 === tab.id ? 'active' : ''}`} onClick={() => setActiveSection2(tab.id)}>
              <Icon sx={{ fontSize: 18 }} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="seo-content">
        {/* Grid */}
        {activeSection2 === 'grid' && (
          <div className="seo-grid-section">
            <div className="section-header-row">
              <h2 className="section-title">{t('reports.localSearchGrid')}</h2>
            </div>

            <div className="card search-form">
              <div className="search-form-grid">
                <div className="form-group">
                  <label className="form-label">Keyword</label>
                  <input
                    type="text"
                    value={gridKeyword}
                    onChange={(e) => setGridKeyword(e.target.value)}
                    className="input"
                    placeholder="e.g. restaurant near me"
                    onKeyDown={(e) => e.key === 'Enter' && businessInfo?.lat && handleCreateReport()}
                  />
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
                    {[1, 2, 5, 10, 15, 20].map(v => <option key={v} value={v}>{v} miles</option>)}
                  </select>
                </div>
                <div className="form-group form-group-btn">
                  <button className="btn btn-primary" onClick={handleCreateReport} disabled={gridLoading || !gridKeyword.trim() || !businessInfo?.lat}>
                    <Search sx={{ fontSize: 18 }} />
                    {gridLoading ? 'Scanning...' : 'Scan'}
                  </button>
                </div>
              </div>
              {!businessInfo?.lat && <p className="form-warning">No location coordinates available. Add a listing with coordinates first.</p>}
            </div>

            {gridResult && (
              <>
                <div className="stats-grid stats-grid-4">
                  <div className="stat-card">
                    <div className="stat-label">Avg Rank</div>
                    <div className="stat-value">{gridResult.summary.averageRank ?? '?'}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Top 3 Positions</div>
                    <div className="stat-value" style={{ color: 'var(--color-success)' }}>{gridResult.summary.top3Percent}%</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Top 10 Positions</div>
                    <div className="stat-value" style={{ color: 'var(--color-accent)' }}>{gridResult.summary.top10Percent}%</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Points Scanned</div>
                    <div className="stat-value">{gridResult.summary.pointsWithData}</div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header-row">
                    <h3 className="card-title">Search Map</h3>
                    <div className="legend">
                      <span className="legend-item"><span className="legend-dot" style={{ background: '#10b981' }} /> Rank 1-3</span>
                      <span className="legend-item"><span className="legend-dot" style={{ background: '#f59e0b' }} /> Rank 4-10</span>
                      <span className="legend-item"><span className="legend-dot" style={{ background: '#ef4444' }} /> Rank 11+</span>
                    </div>
                  </div>
                  <div className="map-container">
                    <MapContainer center={[businessInfo!.lat!, businessInfo!.lng!]} zoom={14} style={{ height: '400px', width: '100%' }}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      {gridResult.points.map((point) => (
                        <CircleMarker
                          key={point.idx}
                          center={[point.lat, point.lng]}
                          radius={point.businessRank === null ? 10 : 14}
                          pathOptions={{ color: getRankColor(point.businessRank), fillColor: getRankColor(point.businessRank), fillOpacity: 0.7, weight: 2 }}
                          eventHandlers={{ click: () => setSelectedPoint(point) }}
                        >
                          <Tooltip permanent={false} direction="top">#{point.businessRank ?? '?'}</Tooltip>
                        </CircleMarker>
                      ))}
                      <CircleMarker center={[businessInfo!.lat!, businessInfo!.lng!]} radius={10} pathOptions={{ color: '#1e3a5f', fillColor: '#1e3a5f', fillOpacity: 1, weight: 3 }}>
                        <Tooltip permanent direction="bottom">{businessInfo?.name}</Tooltip>
                      </CircleMarker>
                    </MapContainer>
                  </div>
                </div>

                <div className="card">
                  <h3 className="card-title" style={{ marginBottom: 16 }}>Grid Points</h3>
                  <div className="table-container" style={{ maxHeight: 400 }}>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Point</th>
                          <th>Rank</th>
                          <th>Results</th>
                        </tr>
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
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {!gridResult && !gridLoading && (
              <div className="card empty-state-card">
                <div className="empty-icon"><Map sx={{ fontSize: 48 }} /></div>
                <h3>Local Search Grid Analysis</h3>
                <p>Enter a keyword and click Scan to analyze your local search rankings.</p>
              </div>
            )}
          </div>
        )}

        {/* Citations */}
        {activeSection2 === 'citations' && (
          <div className="seo-citations-section">
            <div className="section-header-row">
              <h2 className="section-title">Citations</h2>
            </div>
            <div className="card">
              <div className="business-info-grid">
                <div className="business-info-item">
                  <Description sx={{ fontSize: 18, color: 'var(--color-text-muted)' }} />
                  <span>{businessInfo?.name}</span>
                </div>
                <div className="business-info-item">
                  <Map sx={{ fontSize: 18, color: 'var(--color-text-muted)' }} />
                  <span>{businessInfo?.address}</span>
                </div>
                <div className="business-info-item">
                  <Phone sx={{ fontSize: 18, color: 'var(--color-text-muted)' }} />
                  <span>{businessInfo?.phone}</span>
                </div>
                <div className="business-info-item">
                  <Language sx={{ fontSize: 18, color: 'var(--color-text-muted)' }} />
                  <a href={businessInfo?.website}>{businessInfo?.website}</a>
                </div>
              </div>
            </div>
            <div className="empty-state-card card">
              <div className="empty-icon"><Public sx={{ fontSize: 48 }} /></div>
              <h3>No Citations Found</h3>
              <p>Sync your listings to discover and track citations across the web.</p>
            </div>
          </div>
        )}

        {/* Optimization */}
        {activeSection2 === 'optimization' && (
          <div className="seo-optimization-section">
            <div className="section-header-row">
              <div>
                <h2 className="section-title">{t('reports.seoOptimization')}</h2>
                <p className="section-subtitle">{businessInfo?.name}</p>
              </div>
              <button className={`btn ${seoReport ? 'btn-secondary' : 'btn-primary'}`} onClick={generateSeoReport} disabled={seoLoading}>
                <AutoAwesome sx={{ fontSize: 18 }} />
                {seoLoading ? 'Analyzing...' : seoReport ? 'Regenerate' : 'Generate Report'}
              </button>
            </div>

            {seoReport && (
              <div className="stats-grid stats-grid-3">
                <div className="score-card">
                  <div className="score-ring" style={{ '--score': seoReport.overallScore } as React.CSSProperties}>
                    <div className="score-value">{seoReport.overallScore}</div>
                    <div className="score-label">/ 100</div>
                  </div>
                  <div className="score-title">SEO Health Score</div>
                </div>
                <div className="card" style={{ gridColumn: 'span 2' }}>
                  <h4 className="card-title">Quick Wins</h4>
                  <div className="quick-wins-list">
                    {(seoReport.quickWins || []).slice(0, 4).map((win: any, i: number) => (
                      <div key={i} className="quick-win-item">
                        <span className="quick-win-number">{i + 1}</span>
                        <span className="quick-win-action">{win.action}</span>
                        <span className={`badge badge-${win.impact === 'high' ? 'error' : win.impact === 'medium' ? 'warning' : 'success'}`}>{win.impact}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {!seoReport && !seoLoading && (
              <div className="empty-state-card card">
                <div className="empty-icon"><Lightbulb sx={{ fontSize: 48 }} /></div>
                <h3>Generate SEO Report</h3>
                <p>Click the button above to analyze your business listings with AI.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .seo-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: 16px;
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid var(--color-border);
          border-top-color: var(--color-primary);
          border-radius: 999px;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .seo-container {
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .seo-tabs {
          display: flex;
          gap: 4px;
          padding: 12px 24px;
          border-bottom: 1px solid var(--color-border);
          background: var(--color-surface-raised);
          overflow-x: auto;
        }

        .seo-tab {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          font-size: 14px;
          font-weight: 500;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          background: transparent;
          color: var(--color-text-secondary);
          transition: all 0.15s ease;
          white-space: nowrap;
        }

        .seo-tab:hover {
          background: var(--color-surface);
          color: var(--color-text-primary);
        }

        .seo-tab.active {
          background: var(--color-primary);
          color: white;
        }

        .seo-content {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }

        .section-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .section-title {
          font-family: var(--font-headline);
          font-size: 20px;
          font-weight: 700;
          color: var(--color-text-primary);
          margin: 0;
          letter-spacing: -0.02em;
        }

        .section-subtitle {
          font-size: 13px;
          color: var(--color-text-muted);
          margin: 4px 0 0;
        }

        .search-form {
          margin-bottom: 20px;
          padding: 20px;
        }

        .search-form-grid {
          display: grid;
          grid-template-columns: 1fr 140px 140px auto;
          gap: 12px;
          align-items: end;
        }

        @media (max-width: 768px) {
          .search-form-grid {
            grid-template-columns: 1fr;
          }
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group-btn {
          display: flex;
          align-items: flex-end;
        }

        .form-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--color-text-secondary);
        }

        .form-warning {
          margin: 12px 0 0;
          font-size: 12px;
          color: var(--color-warning);
        }

        .stats-grid {
          display: grid;
          gap: 16px;
          margin-bottom: 20px;
        }

        .stats-grid-4 { grid-template-columns: repeat(4, 1fr); }
        .stats-grid-3 { grid-template-columns: 300px 1fr; align-items: start; }

        @media (max-width: 1024px) {
          .stats-grid-4 { grid-template-columns: repeat(2, 1fr); }
          .stats-grid-3 { grid-template-columns: 1fr; }
        }

        .score-card {
          background: var(--color-surface-raised);
          border: 1px solid var(--color-border);
          border-radius: 12px;
          padding: 24px;
          text-align: center;
        }

        .score-ring {
          width: 120px;
          height: 120px;
          margin: 0 auto 16px;
          position: relative;
        }

        .score-ring::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 999px;
          background: conic-gradient(
            var(--color-primary) calc(var(--score) * 1%),
            var(--color-border) calc(var(--score) * 1%)
          );
        }

        .score-ring::after {
          content: '';
          position: absolute;
          inset: 8px;
          background: var(--color-surface-raised);
          border-radius: 999px;
        }

        .score-value {
          position: relative;
          z-index: 1;
          font-family: var(--font-headline);
          font-size: 36px;
          font-weight: 700;
          color: var(--color-text-primary);
          padding-top: 28px;
        }

        .score-label {
          position: relative;
          z-index: 1;
          font-size: 12px;
          color: var(--color-text-muted);
        }

        .score-title {
          font-weight: 600;
          color: var(--color-text-primary);
        }

        .quick-wins-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 12px;
        }

        .quick-win-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          background: var(--color-surface);
          border-radius: 8px;
        }

        .quick-win-number {
          width: 24px;
          height: 24px;
          background: var(--color-warning);
          color: white;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .quick-win-action {
          flex: 1;
          font-size: 13px;
          color: var(--color-text-primary);
        }

        .card-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .card-title {
          font-family: var(--font-headline);
          font-size: 15px;
          font-weight: 600;
          color: var(--color-text-primary);
          margin: 0;
        }

        .legend {
          display: flex;
          gap: 16px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: var(--color-text-muted);
        }

        .legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
        }

        .map-container {
          border-radius: 8px;
          overflow: hidden;
        }

        .business-info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        @media (max-width: 640px) {
          .business-info-grid { grid-template-columns: 1fr; }
        }

        .business-info-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          color: var(--color-text-primary);
        }

        .business-info-item a {
          color: var(--color-accent);
        }

        .empty-state-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 64px 24px;
        }

        .empty-icon {
          width: 80px;
          height: 80px;
          background: var(--color-surface);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-disabled);
          margin-bottom: 20px;
        }

        .empty-state-card h3 {
          font-family: var(--font-headline);
          font-size: 18px;
          font-weight: 600;
          color: var(--color-text-primary);
          margin: 0 0 8px;
        }

        .empty-state-card p {
          font-size: 14px;
          color: var(--color-text-muted);
          margin: 0;
          max-width: 320px;
        }

        .table-container {
          overflow: auto;
        }

        .table tbody tr.selected {
          background: var(--color-primary-muted);
        }

        .text-muted {
          color: var(--color-text-muted);
          font-size: 13px;
        }
      `}</style>
    </div>
  );
}
