import React, { useState, useEffect } from 'react';
import {
  Search,
  Explore,
  Language,
  Directions,
  Phone,
  Send,
  AccessTime,
  Reply,
  Star,
  Refresh,
  FilterList,
  ThumbUp,
  ThumbDown,
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, ComposedChart, Line } from 'recharts';
import { apiGet } from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
}

interface EmbedListingMetrics {
  searchViews: number;
  mapViews: number;
  websiteClicks: number;
  directionRequests: number;
  phoneCalls: number;
  publishedPosts: number;
  avgPostingTime: number;
  avgResponseTime: number;
  responsePercentage: number;
}

interface Review {
  id: string;
  author: string;
  authorPhoto?: string;
  rating: number;
  location: string;
  date: string;
  text: string;
  replied: boolean;
  replyText?: string;
  isPositive: boolean;
}

interface LocationData {
  id: string;
  name: string;
  address: string;
  phone?: string;
  website?: string;
  totalReviews: number;
  averageRating: number;
  hasBusinessName: boolean;
  hasAddress: boolean;
  hasWebsite: boolean;
  hasPhone: boolean;
  healthScore: number;
}

interface ChartData {
  date: string;
  searchViews?: number;
  mapViews?: number;
  websiteClicks?: number;
  directionRequests?: number;
  phoneCalls?: number;
  reviews?: number;
  replies?: number;
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(name: string): string {
  const colors = ['#1e3a5f', '#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1', '#ef4444'];
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className={`review-card ${review.isPositive ? 'review-card-positive' : 'review-card-negative'}`}>
      <div className="review-card-header">
        {review.authorPhoto ? (
          <img src={review.authorPhoto} alt={review.author} className="review-avatar" />
        ) : (
          <div className="review-avatar review-avatar-initials" style={{ backgroundColor: getAvatarColor(review.author) }}>
            {getInitials(review.author)}
          </div>
        )}
        <div className="review-card-info">
          <div className="review-author">{review.author}</div>
          <div className="review-meta">
            <span className="review-location">{review.location}</span>
            <span className="review-separator">·</span>
            <span className="review-date">{review.date}</span>
          </div>
        </div>
        <div className="review-rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star key={star} sx={{ fontSize: 14, color: star <= review.rating ? '#f59e0b' : '#e2e8f0', fontVariationSettings: "'FILL' 1" }} />
          ))}
        </div>
      </div>
      <p className="review-text">{review.text}</p>
      {review.replied && review.replyText && (
        <div className="review-reply">
          <Reply sx={{ fontSize: 14, color: 'var(--color-success)' }} />
          <span className="review-reply-text">{review.replyText}</span>
        </div>
      )}
      {!review.replied && (
        <div className="review-pending">
          <AccessTime sx={{ fontSize: 14 }} />
          <span>Pending reply</span>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, change, color, index }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  change?: number;
  color: string;
  index: number;
}) {
  const isPositive = change && change > 0;
  return (
    <div className="stat-card animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
      <div className="stat-icon" style={{ backgroundColor: `${color}15`, color }}>
        {icon}
      </div>
      <div className="stat-content">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {change !== undefined && (
          <div className={`stat-change ${isPositive ? 'stat-change-positive' : 'stat-change-negative'}`}>
            {isPositive ? <TrendingUp sx={{ fontSize: 14 }} /> : <TrendingDown sx={{ fontSize: 14 }} />}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function Dashboard({ setActiveTab }: DashboardProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('30days');
  const [reviewFilter, setReviewFilter] = useState<'all' | 'positive' | 'negative'>('all');

  const [embedMetrics, setEmbedMetrics] = useState<EmbedListingMetrics>({
    searchViews: 0, mapViews: 0, websiteClicks: 0, directionRequests: 0,
    phoneCalls: 0, publishedPosts: 0, avgPostingTime: 0, avgResponseTime: 0, responsePercentage: 0,
  });

  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [impressionsData, setImpressionsData] = useState<ChartData[]>([]);
  const [actionsData, setActionsData] = useState<ChartData[]>([]);

  const periodOptions: Record<string, { label: string; days: number }> = {
    '7days': { label: t('dashboard.last7Days'), days: 7 },
    '30days': { label: t('dashboard.last30Days'), days: 30 },
    '90days': { label: t('dashboard.last90Days'), days: 90 },
    '12months': { label: t('dashboard.last12Months'), days: 365 },
  };

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { fetchDashboardData(); }, [selectedLocation, selectedPeriod]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const embedRes = await apiGet('/api/embedsocial/locations');
      let embedLocations: any[] = [];
      if (embedRes.ok) {
        const data = await embedRes.json();
        embedLocations = Array.isArray(data) ? data : (data.data || []);
      }

      let reviews: Review[] = [];
      const embedReviewsRes = await apiGet('/api/embedsocial/reviews');
      if (embedReviewsRes.ok) {
        const embedReviewsData = await embedReviewsRes.json();
        const embedReviews = Array.isArray(embedReviewsData) ? embedReviewsData : [];
        reviews = embedReviews.map((r: any) => ({
          id: r.id, author: r.authorName || 'Anonymous', authorPhoto: r.authorPhoto || null,
          rating: r.rating || 0, location: r.sourceName || 'Google',
          date: r.originalCreatedOn ? new Date(r.originalCreatedOn).toLocaleDateString() : '',
          text: r.captionText || r.text || '', replied: !!(r.replies?.length),
          replyText: r.replies?.[0]?.text, isPositive: (r.rating || 0) >= 4,
        }));
      }
      setRecentReviews(reviews);

      const locationsRes = await apiGet('/api/locations');
      let localLocations: any[] = [];
      if (locationsRes.ok) localLocations = await locationsRes.json();

      const enrichedLocations: LocationData[] = [];
      for (const embedLoc of embedLocations) {
        const localLoc = localLocations.find((l: any) => l.embedSocialLocationId === embedLoc.id);
        const name = localLoc?.name || embedLoc.name || 'Location';
        const address = localLoc?.address || embedLoc.address || '';
        const phone = localLoc?.phone || embedLoc.phoneNumber || '';
        const website = localLoc?.website || embedLoc.websiteUrl || '';
        const totalReviews = embedLoc.totalReviews || 0;
        const averageRating = embedLoc.averageRating || 0;

        let healthScore = 100;
        if (!name) healthScore -= 20;
        if (!address) healthScore -= 25;
        if (!website) healthScore -= 15;
        if (!phone) healthScore -= 15;
        if (totalReviews === 0) healthScore -= 15;
        if (averageRating > 0 && averageRating < 3.5) healthScore -= 10;

        enrichedLocations.push({
          id: localLoc?.id || embedLoc.id, name, address, phone, website,
          totalReviews, averageRating, hasBusinessName: !!name, hasAddress: !!address,
          hasWebsite: !!website, hasPhone: !!phone, healthScore: Math.max(0, healthScore),
        });
      }
      setLocations(enrichedLocations);

      const totalReviews = embedLocations.reduce((acc: number, loc: any) => acc + (loc.totalReviews || 0), 0);
      const avgRating = embedLocations.length > 0 ? embedLocations.reduce((acc: number, loc: any) => acc + (loc.averageRating || 0), 0) / embedLocations.length : 0;

      try {
        const metricsRes = await apiGet(`/api/embedsocial/metrics?period=${selectedPeriod}`);
        if (metricsRes.ok) {
          const metricsData = await metricsRes.json();
          setEmbedMetrics({
            searchViews: metricsData.searchViews || 0, mapViews: metricsData.mapViews || 0,
            websiteClicks: metricsData.websiteClicks || 0, directionRequests: metricsData.directionRequests || 0,
            phoneCalls: metricsData.phoneCalls || 0, publishedPosts: metricsData.publishedPosts || embedLocations.length,
            avgPostingTime: metricsData.avgPostingTime || 0, avgResponseTime: metricsData.avgResponseTime || 0,
            responsePercentage: metricsData.responsePercentage || 0,
          });
        }
      } catch (e) { /* ignore */ }

      try {
        const chartRes = await apiGet(`/api/embedsocial/chart-data?period=${selectedPeriod}`);
        if (chartRes.ok) {
          const chartData = await chartRes.json();
          if (chartData.impressions) setImpressionsData(chartData.impressions);
          if (chartData.actions) setActionsData(chartData.actions);
        }
      } catch (e) { /* ignore */ }

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReviews = reviewFilter === 'all' ? recentReviews : recentReviews.filter(r => reviewFilter === 'positive' ? r.isPositive : !r.isPositive);

  if (!mounted || loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p className="loading-text">Loading dashboard...</p>
      </div>
    );
  }

  const avgHealthScore = locations.length > 0 ? Math.round(locations.reduce((acc, loc) => acc + loc.healthScore, 0) / locations.length) : 0;
  const avgRating = locations.length > 0 ? (locations.reduce((acc, loc) => acc + loc.averageRating, 0) / locations.length).toFixed(1) : '0.0';
  const totalReviews = locations.reduce((acc, loc) => acc + loc.totalReviews, 0);

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="dashboard-header-content">
          <div>
            <h1 className="page-title">Overview</h1>
            <p className="page-subtitle">Performance across all your business locations</p>
          </div>
          <div className="dashboard-controls">
            <select
              className="input select"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
            >
              <option value="all">All Locations</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
            <select
              className="input select"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              <option value="7days">{t('dashboard.last7Days')}</option>
              <option value="30days">{t('dashboard.last30Days')}</option>
              <option value="90days">{t('dashboard.last90Days')}</option>
              <option value="12months">{t('dashboard.last12Months')}</option>
            </select>
            <button className="btn-icon" onClick={fetchDashboardData} title="Refresh">
              <Refresh sx={{ fontSize: 20 }} />
            </button>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard
          index={0} icon={<Search sx={{ fontSize: 22 }} />}
          label="Search Views" value={embedMetrics.searchViews > 0 ? embedMetrics.searchViews.toLocaleString() : '—'}
          color="#1e3a5f"
        />
        <StatCard
          index={1} icon={<Explore sx={{ fontSize: 22 }} />}
          label="Map Views" value={embedMetrics.mapViews > 0 ? embedMetrics.mapViews.toLocaleString() : '—'}
          color="#8b5cf6"
        />
        <StatCard
          index={2} icon={<Language sx={{ fontSize: 22 }} />}
          label="Website Clicks" value={embedMetrics.websiteClicks > 0 ? embedMetrics.websiteClicks.toLocaleString() : '—'}
          color="#10b981"
        />
        <StatCard
          index={3} icon={<Directions sx={{ fontSize: 22 }} />}
          label="Directions" value={embedMetrics.directionRequests > 0 ? embedMetrics.directionRequests.toLocaleString() : '—'}
          color="#f59e0b"
        />
        <StatCard
          index={4} icon={<Phone sx={{ fontSize: 22 }} />}
          label="Phone Calls" value={embedMetrics.phoneCalls > 0 ? embedMetrics.phoneCalls.toLocaleString() : '—'}
          color="#ef4444"
        />
        <StatCard
          index={5} icon={<Send sx={{ fontSize: 22 }} />}
          label="Published Posts" value={embedMetrics.publishedPosts > 0 ? embedMetrics.publishedPosts.toLocaleString() : '—'}
          color="#0ea5e9"
        />
      </div>

      {/* Charts Row */}
      <div className="charts-grid">
        {/* Impressions Chart */}
        <div className="card chart-card">
          <div className="card-header">
            <h3 className="card-title">Search Impressions</h3>
            <span className="card-subtitle">Views over time</span>
          </div>
          <div className="card-body">
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={impressionsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSearch" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1e3a5f" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#1e3a5f" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorMap" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} stroke="#e2e8f0" tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} stroke="#e2e8f0" tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="searchViews" stroke="#1e3a5f" strokeWidth={2} fill="url(#colorSearch)" name="Search" />
                  <Area type="monotone" dataKey="mapViews" stroke="#0ea5e9" strokeWidth={2} fill="url(#colorMap)" name="Map" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Actions Chart */}
        <div className="card chart-card">
          <div className="card-header">
            <h3 className="card-title">User Actions</h3>
            <span className="card-subtitle">Clicks, calls, and directions</span>
          </div>
          <div className="card-body">
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={actionsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} stroke="#e2e8f0" tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} stroke="#e2e8f0" tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="websiteClicks" stroke="#10b981" strokeWidth={2} fill="#10b981" fillOpacity={0.15} name="Website" />
                  <Area type="monotone" dataKey="directionRequests" stroke="#f59e0b" strokeWidth={2} fill="#f59e0b" fillOpacity={0.15} name="Directions" />
                  <Line type="monotone" dataKey="phoneCalls" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Calls" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="dashboard-bottom-grid">
        {/* Location Health */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Location Health</h3>
          </div>
          <div className="card-body">
            <div className="health-stats">
              <div className="health-stat">
                <div className="health-score" style={{ color: avgHealthScore >= 80 ? 'var(--color-success)' : avgHealthScore >= 60 ? 'var(--color-warning)' : 'var(--color-error)' }}>
                  {avgHealthScore}
                </div>
                <div className="health-label">Health Score</div>
              </div>
              <div className="health-stat">
                <div className="health-score">{avgRating} <Star sx={{ fontSize: 16, color: '#f59e0b', fontVariationSettings: "'FILL' 1" }} /></div>
                <div className="health-label">Avg Rating</div>
              </div>
              <div className="health-stat">
                <div className="health-score">{totalReviews.toLocaleString()}</div>
                <div className="health-label">Total Reviews</div>
              </div>
            </div>
            <div className="health-progress">
              <div className="health-progress-bar">
                <div className="health-progress-fill" style={{
                  width: `${avgHealthScore}%`,
                  backgroundColor: avgHealthScore >= 80 ? 'var(--color-success)' : avgHealthScore >= 60 ? 'var(--color-warning)' : 'var(--color-error)'
                }} />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Reviews */}
        <div className="card reviews-card">
          <div className="card-header">
            <div className="card-header-row">
              <h3 className="card-title">Recent Reviews</h3>
              <div className="review-filters">
                <button className={`review-filter-btn ${reviewFilter === 'all' ? 'active' : ''}`} onClick={() => setReviewFilter('all')}>
                  All ({recentReviews.length})
                </button>
                <button className={`review-filter-btn ${reviewFilter === 'positive' ? 'active positive' : ''}`} onClick={() => setReviewFilter('positive')}>
                  <ThumbUp sx={{ fontSize: 14 }} /> {filteredReviews.length}
                </button>
                <button className={`review-filter-btn ${reviewFilter === 'negative' ? 'active negative' : ''}`} onClick={() => setReviewFilter('negative')}>
                  <ThumbDown sx={{ fontSize: 14 }} /> {filteredReviews.length}
                </button>
              </div>
            </div>
          </div>
          <div className="card-body reviews-list">
            {filteredReviews.length > 0 ? (
              filteredReviews.slice(0, 4).map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))
            ) : (
              <div className="empty-state">
                <Star sx={{ fontSize: 48, color: 'var(--color-text-disabled)' }} />
                <div className="empty-state-title">No reviews yet</div>
                <div className="empty-state-description">Reviews will appear here when customers leave feedback</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .dashboard-container {
          padding: 24px;
          max-width: 1600px;
          margin: 0 auto;
        }

        .dashboard-header {
          margin-bottom: 24px;
        }

        .dashboard-header-content {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
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
        }

        .dashboard-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .dashboard-controls .input {
          width: auto;
          min-width: 140px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        @media (max-width: 1200px) {
          .stats-grid { grid-template-columns: repeat(3, 1fr); }
        }

        @media (max-width: 768px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: 1fr; }
        }

        .stat-card {
          background: var(--color-surface-raised);
          border: 1px solid var(--color-border);
          border-radius: 12px;
          padding: 16px;
          display: flex;
          gap: 12px;
          transition: all 0.2s ease;
        }

        .stat-card:hover {
          border-color: var(--color-border-strong);
          box-shadow: var(--shadow-sm);
        }

        .stat-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .stat-content {
          min-width: 0;
        }

        .stat-value {
          font-family: var(--font-headline);
          font-size: 24px;
          font-weight: 700;
          color: var(--color-text-primary);
          letter-spacing: -0.02em;
          line-height: 1.1;
        }

        .stat-label {
          font-size: 12px;
          color: var(--color-text-muted);
          margin-top: 2px;
        }

        .stat-change {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          font-size: 11px;
          font-weight: 600;
          margin-top: 4px;
        }

        .stat-change-positive { color: var(--color-success); }
        .stat-change-negative { color: var(--color-error); }

        .charts-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin-bottom: 24px;
        }

        @media (max-width: 1024px) {
          .charts-grid { grid-template-columns: 1fr; }
        }

        .chart-card .card-header {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }

        .card-title {
          font-family: var(--font-headline);
          font-size: 15px;
          font-weight: 600;
          color: var(--color-text-primary);
          margin: 0;
        }

        .card-subtitle {
          font-size: 12px;
          color: var(--color-text-muted);
        }

        .chart-container {
          margin-top: 8px;
        }

        .dashboard-bottom-grid {
          display: grid;
          grid-template-columns: 360px 1fr;
          gap: 20px;
        }

        @media (max-width: 1024px) {
          .dashboard-bottom-grid { grid-template-columns: 1fr; }
        }

        .health-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }

        .health-stat {
          text-align: center;
        }

        .health-score {
          font-family: var(--font-headline);
          font-size: 24px;
          font-weight: 700;
          color: var(--color-text-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2px;
        }

        .health-label {
          font-size: 11px;
          color: var(--color-text-muted);
          margin-top: 2px;
        }

        .health-progress {
          margin-top: 8px;
        }

        .health-progress-bar {
          height: 8px;
          background: var(--color-surface);
          border-radius: 999px;
          overflow: hidden;
        }

        .health-progress-fill {
          height: 100%;
          border-radius: 999px;
          transition: width 0.6s ease;
        }

        .card-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }

        .review-filters {
          display: flex;
          gap: 4px;
        }

        .review-filter-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          font-size: 12px;
          font-weight: 500;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          background: var(--color-surface);
          color: var(--color-text-secondary);
          transition: all 0.15s ease;
        }

        .review-filter-btn:hover {
          background: var(--color-border);
        }

        .review-filter-btn.active {
          background: var(--color-primary);
          color: white;
        }

        .review-filter-btn.active.positive {
          background: var(--color-success);
        }

        .review-filter-btn.active.negative {
          background: var(--color-error);
        }

        .reviews-card {
          max-height: 500px;
          display: flex;
          flex-direction: column;
        }

        .reviews-list {
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
        }

        .review-card {
          padding: 14px;
          border-radius: 10px;
          background: var(--color-surface);
          transition: all 0.15s ease;
        }

        .review-card:hover {
          background: var(--color-border);
        }

        .review-card-positive {
          border-left: 3px solid var(--color-success);
        }

        .review-card-negative {
          border-left: 3px solid var(--color-error);
        }

        .review-card-header {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 8px;
        }

        .review-avatar {
          width: 36px;
          height: 36px;
          border-radius: 999px;
          object-fit: cover;
          flex-shrink: 0;
        }

        .review-avatar-initials {
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 13px;
          font-weight: 600;
        }

        .review-card-info {
          flex: 1;
          min-width: 0;
        }

        .review-author {
          font-weight: 600;
          font-size: 14px;
          color: var(--color-text-primary);
        }

        .review-meta {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: var(--color-text-muted);
          margin-top: 2px;
        }

        .review-separator {
          opacity: 0.5;
        }

        .review-rating {
          display: flex;
          gap: 1px;
        }

        .review-text {
          font-size: 13px;
          color: var(--color-text-secondary);
          line-height: 1.5;
          margin: 0;
        }

        .review-reply {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          margin-top: 10px;
          padding: 8px 10px;
          background: var(--color-success-bg);
          border-radius: 6px;
          font-size: 12px;
          color: var(--color-text-secondary);
        }

        .review-reply-text {
          flex: 1;
        }

        .review-pending {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 10px;
          font-size: 12px;
          color: var(--color-warning);
        }

        .loading-container {
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

        .loading-text {
          font-size: 14px;
          color: var(--color-text-muted);
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
          text-align: center;
        }

        .empty-state-title {
          font-family: var(--font-headline);
          font-size: 16px;
          font-weight: 600;
          color: var(--color-text-primary);
          margin: 16px 0 8px;
        }

        .empty-state-description {
          font-size: 13px;
          color: var(--color-text-muted);
          max-width: 280px;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-slide-up {
          animation: slideUp 0.3s ease-out both;
        }

        @media (max-width: 768px) {
          .dashboard-container {
            padding: 16px;
          }

          .page-title {
            font-size: 1.5rem;
          }

          .dashboard-controls {
            width: 100%;
          }

          .dashboard-controls .input {
            flex: 1;
            min-width: 0;
          }
        }
      `}</style>
    </div>
  );
}
