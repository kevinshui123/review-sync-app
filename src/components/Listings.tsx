import React, { useState, useEffect } from 'react';
import { Inventory2, Store, LocationOn, Close, ArrowForward, Star, Phone, Language, Edit, Delete, AutoAwesome, OpenInNew } from '@mui/icons-material';
import { useLanguage } from '../contexts/LanguageContext';
import { EditBusinessPage } from './EditBusinessPage';
import { ProfileAnalysisDrawer } from './ProfileAnalysisDrawer';
import { PageLoader } from './PageLoader';
import { apiGet, apiDelete } from '../utils/api';

interface ListingsProps {
  setActiveTab: (tab: string) => void;
  setListingsSubTab?: (tab: string | null, locationData?: any) => void;
  listingsSubTab?: string | null;
  setSelectedLocation?: (loc: any) => void;
  selectedLocation?: any;
}

interface Location {
  id: string;
  name: string;
  address: string;
  account: string;
  lastSync: string;
  synced: boolean;
  websiteUrl?: string;
  phoneNumber?: string;
  totalReviews?: number;
  averageRating?: number;
  status?: string;
  photoUrl?: string | null;
}

export function Listings({ setActiveTab, setListingsSubTab, setSelectedLocation, selectedLocation }: ListingsProps) {
  const { t } = useLanguage();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [showAnalysisDrawer, setShowAnalysisDrawer] = useState(false);
  const [selectedLocationForDetail, setSelectedLocationForDetail] = useState<Location | null>(null);
  const [selectedLocationForAnalysis, setSelectedLocationForAnalysis] = useState<Location | null>(null);

  useEffect(() => { fetchLocations(); }, []);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      // Use embedsocial/locations API which has photo fetching logic
      const res = await apiGet('/api/embedsocial/locations');
      if (res.ok) {
        const data = await res.json();
        const mapped: Location[] = data.map((tl: any) => ({
          id: tl.id,
          name: tl.name || 'Unknown',
          address: tl.address || '',
          account: 'Google',
          lastSync: tl.connectedAt ? new Date(tl.connectedAt).toLocaleString() : 'N/A',
          synced: true,
          websiteUrl: tl.websiteUrl,
          phoneNumber: tl.phoneNumber,
          totalReviews: tl.totalReviews || 0,
          averageRating: tl.averageRating || 0,
          status: 'active',
          photoUrl: tl.photoUrl || null,
        }));
        setLocations(mapped);
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Disconnect this listing?')) return;
    try {
      const res = await apiDelete(`/api/embedsocial/listings/${id}/disconnect`);
      if (res.ok) setLocations(locations.filter(l => l.id !== id));
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  if (loading) {
    return <PageLoader message={t('listings.loading')} subMessage={t('listings.loadingDesc')} />;
  }

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Listings</h1>
          <p className="page-subtitle">
            <Inventory2 sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
            {locations.length} location{locations.length !== 1 ? 's' : ''} connected
          </p>
        </div>
      </div>

      {/* Table */}
      {locations.length > 0 ? (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Location</th>
                <th>Account</th>
                <th>Status</th>
                <th>Rating</th>
                <th>Last Sync</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {locations.map((location) => (
                <tr key={location.id} className="listing-row">
                  <td>
                    <div className="listing-info">
                      <div className="listing-icon">
                        {location.photoUrl ? (
                          <img src={location.photoUrl} alt={location.name} className="listing-photo" />
                        ) : (
                          <Store sx={{ fontSize: 20 }} />
                        )}
                      </div>
                      <div>
                        <div className="listing-name">{location.name}</div>
                        <div className="listing-address">
                          <LocationOn sx={{ fontSize: 12 }} />
                          {location.address || 'No address'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="listing-account">
                      <div className="google-logo-badge">
                        <svg width="18" height="18" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                      </div>
                      <span>{location.account}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${location.status === 'active' ? 'badge-success' : 'badge-default'}`}>
                      {location.status === 'active' ? 'Connected' : 'Disconnected'}
                    </span>
                  </td>
                  <td>
                    <div className="listing-rating">
                      <Star sx={{ fontSize: 16, color: '#f59e0b', fontVariationSettings: "'FILL' 1" }} />
                      <span className="rating-value">{location.averageRating?.toFixed(1) || '0.0'}</span>
                      <span className="rating-count">({location.totalReviews || 0})</span>
                    </div>
                  </td>
                  <td>
                    <span className="listing-sync">{location.lastSync}</span>
                  </td>
                  <td>
                    <div className="listing-actions">
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => {
                          setSelectedLocationForDetail(location);
                          setShowDetailDrawer(true);
                        }}
                      >
                        Details
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => handleDelete(location.id)}
                        title="Disconnect"
                      >
                        <Delete sx={{ fontSize: 18 }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card empty-card">
          <div className="empty-state">
            <div className="empty-icon">
              <Store sx={{ fontSize: 48 }} />
            </div>
            <h3 className="empty-title">No Listings Connected</h3>
            <p className="empty-desc">Connect your Google Business Profile to sync reviews and manage your business.</p>
            <button className="btn btn-primary" onClick={() => setActiveTab('settings')}>
              Go to Settings
            </button>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      {showDetailDrawer && selectedLocationForDetail && (
        <>
          <div className="drawer-overlay" onClick={() => setShowDetailDrawer(false)} />
          <div className="drawer">
            <div className="drawer-header">
              <button className="drawer-close" onClick={() => setShowDetailDrawer(false)}>
                <Close sx={{ fontSize: 20 }} />
              </button>
              <h2 className="drawer-title">Business Details</h2>
              <div className="drawer-actions">
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => {
                    setShowDetailDrawer(false);
                    setSelectedLocationForAnalysis(selectedLocationForDetail);
                    setShowAnalysisDrawer(true);
                  }}
                >
                  <AutoAwesome sx={{ fontSize: 14 }} />
                  Analyze
                </button>
              </div>
            </div>
            <div className="drawer-body">
              <div className="detail-section">
                <h3 className="detail-name">{selectedLocationForDetail.name}</h3>
                <div className="detail-rating">
                  <Star sx={{ fontSize: 20, color: '#f59e0b', fontVariationSettings: "'FILL' 1" }} />
                  <span>{selectedLocationForDetail.averageRating?.toFixed(1) || '0.0'}</span>
                  <span className="detail-reviews">({selectedLocationForDetail.totalReviews || 0} reviews)</span>
                </div>
              </div>

              <div className="detail-info-grid">
                <div className="detail-info-item">
                  <LocationOn sx={{ fontSize: 18, color: 'var(--color-text-muted)' }} />
                  <div>
                    <div className="detail-info-label">Address</div>
                    <div className="detail-info-value">{selectedLocationForDetail.address || 'Not set'}</div>
                  </div>
                </div>
                <div className="detail-info-item">
                  <Phone sx={{ fontSize: 18, color: 'var(--color-text-muted)' }} />
                  <div>
                    <div className="detail-info-label">Phone</div>
                    <div className="detail-info-value">{selectedLocationForDetail.phoneNumber || 'Not set'}</div>
                  </div>
                </div>
                <div className="detail-info-item">
                  <Language sx={{ fontSize: 18, color: 'var(--color-text-muted)' }} />
                  <div>
                    <div className="detail-info-label">Website</div>
                    <div className="detail-info-value">
                      {selectedLocationForDetail.websiteUrl ? (
                        <a href={selectedLocationForDetail.websiteUrl} target="_blank" rel="noopener noreferrer">
                          {selectedLocationForDetail.websiteUrl}
                        </a>
                      ) : 'Not set'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="detail-actions">
                <button className="btn btn-secondary" onClick={() => setActiveTab('reviews')}>
                  <Star sx={{ fontSize: 16 }} />
                  View Reviews
                </button>
                <button className="btn btn-secondary" onClick={() => window.open('https://business.google.com', '_blank')}>
                  <OpenInNew sx={{ fontSize: 16 }} />
                  Open in Google
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <ProfileAnalysisDrawer
        isOpen={showAnalysisDrawer}
        onClose={() => setShowAnalysisDrawer(false)}
        location={selectedLocationForAnalysis}
      />

      <style>{`
        .page-loading {
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

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .page-container {
          padding: 84px 24px 24px 280px;
        }

        @media (max-width: 1023px) {
          .page-container {
            padding-left: 24px;
            padding-top: 84px;
          }
        }

        .page-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }

        .page-title {
          font-family: var(--font-headline);
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--color-text-primary);
          letter-spacing: -0.02em;
          margin: 0 0 4px;
        }

        .page-subtitle {
          font-size: 14px;
          color: var(--color-text-muted);
          margin: 0;
          display: flex;
          align-items: center;
        }

        .table-container {
          background: var(--color-surface-raised);
          border: 1px solid var(--color-border);
          border-radius: 12px;
          overflow: hidden;
        }

        .table {
          width: 100%;
          border-collapse: collapse;
        }

        .table th {
          padding: 12px 16px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-text-muted);
          background: var(--color-surface);
          border-bottom: 1px solid var(--color-border);
          text-align: left;
        }

        .table td {
          padding: 16px;
          border-bottom: 1px solid var(--color-divider);
          vertical-align: middle;
        }

        .listing-row:last-child td {
          border-bottom: none;
        }

        .listing-row:hover {
          background: var(--color-surface);
        }

        .listing-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .listing-icon {
          width: 48px;
          height: 48px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-muted);
          overflow: hidden;
          flex-shrink: 0;
        }

        .listing-photo {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.2s ease;
        }

        .listing-photo:hover {
          transform: scale(1.05);
        }

        .listing-name {
          font-weight: 600;
          color: var(--color-text-primary);
          margin-bottom: 2px;
        }

        .listing-address {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: var(--color-text-muted);
        }

        .listing-account {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .google-logo-badge {
          width: 24px;
          height: 24px;
          background: white;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .account-badge {
          width: 24px;
          height: 24px;
          background: #ea4335;
          color: white;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
        }

        .listing-rating {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .rating-value {
          font-weight: 600;
          color: var(--color-text-primary);
        }

        .rating-count {
          color: var(--color-text-muted);
          font-size: 12px;
        }

        .listing-sync {
          font-size: 13px;
          color: var(--color-text-muted);
        }

        .listing-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          justify-content: flex-end;
        }

        .empty-card {
          padding: 0;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 64px 24px;
          text-align: center;
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

        .empty-title {
          font-family: var(--font-headline);
          font-size: 20px;
          font-weight: 600;
          color: var(--color-text-primary);
          margin: 0 0 8px;
        }

        .empty-desc {
          font-size: 14px;
          color: var(--color-text-muted);
          margin: 0 0 24px;
          max-width: 320px;
        }

        /* Drawer */
        .drawer-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          z-index: 100;
          animation: fadeIn 0.2s ease;
        }

        .drawer {
          position: fixed;
          right: 0;
          top: 0;
          bottom: 0;
          width: 420px;
          max-width: 100%;
          background: var(--color-surface-raised);
          border-left: 1px solid var(--color-border);
          z-index: 101;
          display: flex;
          flex-direction: column;
          animation: slideIn 0.25s ease;
        }

        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .drawer-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          border-bottom: 1px solid var(--color-border);
          background: var(--color-primary);
          color: white;
        }

        .drawer-close {
          width: 32px;
          height: 32px;
          border: none;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          transition: background 0.15s;
        }

        .drawer-close:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .drawer-title {
          flex: 1;
          font-family: var(--font-headline);
          font-size: 16px;
          font-weight: 600;
          margin: 0;
        }

        .drawer-body {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }

        .detail-section {
          margin-bottom: 24px;
        }

        .detail-name {
          font-family: var(--font-headline);
          font-size: 22px;
          font-weight: 700;
          color: var(--color-text-primary);
          margin: 0 0 8px;
        }

        .detail-rating {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 16px;
          font-weight: 600;
          color: var(--color-text-primary);
        }

        .detail-reviews {
          color: var(--color-text-muted);
          font-weight: 400;
        }

        .detail-info-grid {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 24px;
        }

        .detail-info-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .detail-info-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-text-muted);
          margin-bottom: 2px;
        }

        .detail-info-value {
          font-size: 14px;
          color: var(--color-text-primary);
        }

        .detail-info-value a {
          color: var(--color-accent);
          text-decoration: none;
        }

        .detail-info-value a:hover {
          text-decoration: underline;
        }

        .detail-actions {
          display: flex;
          gap: 8px;
        }

        .detail-actions .btn {
          flex: 1;
        }

        @media (max-width: 768px) {
          .page-container {
            padding: 84px 16px 16px;
          }
        }
      `}</style>
    </div>
  );
}
