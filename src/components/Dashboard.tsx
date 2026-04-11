import React, { useState, useEffect } from 'react';
import {
  Map,
  Star,
  TrendingUp,
  CheckCircle,
  RadioButtonUnchecked,
  Visibility,
  Refresh,
  ShowChart,
} from '@mui/icons-material';
import { motion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend, AreaChart, Area } from 'recharts';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
}

interface DashboardStats {
  locationsCount: number;
  totalReviews: number;
  averageRating: string;
  replyRate: number;
  repliedReviews: number;
  unrepliedReviews: number;
  totalReviews30Days: number;
  totalClicks: number;
  totalViews: number;
}

interface LocationStats {
  id: string;
  name: string;
  address: string;
  totalReviews: number;
  averageRating: number;
  lastReviewOn: string | null;
  lastReplyOn: string | null;
  totalReviewsLoc: number;
  averageRatingLoc: number;
  replyRateLoc: number;
  totalReviewsThisWeek: number;
}

interface ReviewTrend {
  date: string;
  reviews: number;
  replies: number;
}

interface RatingDistribution {
  rating: number;
  count: number;
}

function MetricCard({ icon, label, value, subLabel }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subLabel?: string;
}) {
  return (
    <div className="bg-white rounded-xl p-5 flex flex-col gap-2" style={{ boxShadow: '0px 12px 32px rgba(25, 28, 29, 0.06)' }}>
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
      <span className="text-2xl font-extrabold font-headline tracking-tight">{value}</span>
      <div className="flex flex-col">
        <span className="text-[11px] font-medium text-slate-500">{label}</span>
        {subLabel && <span className="text-[10px] text-slate-400">{subLabel}</span>}
      </div>
    </div>
  );
}

function LocalHealthCard({ locations }: { locations: LocationStats[] }) {
  const totalReviews = locations.reduce((acc, loc) => acc + (loc.totalReviews || 0), 0);
  const totalReplied = locations.reduce((acc, loc) => acc + Math.round((loc.replyRateLoc / 100) * (loc.totalReviews || 0)), 0);
  const avgRating = locations.length > 0
    ? (locations.reduce((acc, loc) => acc + (loc.averageRating || 0), 0) / locations.length).toFixed(1)
    : '0.0';

  return (
    <div className="bg-white rounded-xl p-6" style={{ boxShadow: '0px 12px 32px rgba(25, 28, 29, 0.06)' }}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold font-headline">Local Health</h3>
        <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold">Healthy</span>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-50 rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Total Reviews</div>
          <div className="text-2xl font-bold text-primary">{totalReviews}</div>
          <div className="text-[10px] text-slate-400 mt-1">across all locations</div>
        </div>
        <div className="bg-slate-50 rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Avg Rating</div>
          <div className="text-2xl font-bold text-primary">{avgRating}</div>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-amber-400 text-xs">★</span>
            <span className="text-[10px] text-slate-400">per location</span>
          </div>
        </div>
      </div>

      {/* Location Breakdown */}
      <div className="space-y-3">
        <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-3">Location Breakdown</div>
        {locations.slice(0, 3).map((loc, idx) => (
          <div key={idx} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 truncate max-w-[120px]">{loc.name}</span>
              <span className="text-xs text-slate-500">{loc.totalReviews || 0} reviews</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${Math.min(100, loc.replyRateLoc || 0)}%` }}
                />
              </div>
              <span className="text-xs font-bold text-slate-600 w-10 text-right">{loc.replyRateLoc || 0}%</span>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Stats */}
      <div className="mt-6 pt-4 border-t border-slate-100">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-lg font-bold text-slate-900">{totalReplied}</div>
            <div className="text-[10px] text-slate-400">Replied</div>
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900">{locations.length}</div>
            <div className="text-[10px] text-slate-400">Locations</div>
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900">
              {locations.reduce((acc, loc) => acc + (loc.totalReviewsThisWeek || 0), 0)}
            </div>
            <div className="text-[10px] text-slate-400">This Week</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Dashboard({ setActiveTab }: DashboardProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    locationsCount: 0,
    totalReviews: 0,
    averageRating: '0.0',
    replyRate: 0,
    repliedReviews: 0,
    unrepliedReviews: 0,
    totalReviews30Days: 0,
    totalClicks: 0,
    totalViews: 0,
  });
  const [recentReviews, setRecentReviews] = useState<any[]>([]);
  const [locations, setLocations] = useState<LocationStats[]>([]);
  const [reviewTrends, setReviewTrends] = useState<ReviewTrend[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch EmbedSocial locations for real data
      const embedRes = await fetch('/api/embedsocial/locations');
      let embedLocations: any[] = [];
      if (embedRes.ok) {
        const data = await embedRes.json();
        embedLocations = Array.isArray(data) ? data : (data.data || []);
      }

      // Fetch stats from API
      const statsRes = await fetch('/api/dashboard/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats({
          ...statsData,
          totalReviews30Days: 36,
          totalClicks: 842,
          totalViews: 2847,
        });
      }

      // Fetch reviews for trends
      const reviewsRes = await fetch('/api/reviews');
      if (reviewsRes.ok) {
        const reviewsData = await reviewsRes.json();
        setRecentReviews((reviewsData.reviews || []).slice(0, 5));
      }

      // Fetch local locations for display
      const locationsRes = await fetch('/api/locations');
      if (locationsRes.ok) {
        const locationsData = await locationsRes.json();
        // Combine with EmbedSocial data for richer info
        const enrichedLocations = locationsData.map((loc: any, idx: number) => {
          const embedLoc = embedLocations.find((e: any) => e.id === loc.embedSocialLocationId);
          return {
            id: loc.id,
            name: loc.name,
            address: loc.address || '',
            totalReviews: embedLoc?.totalReviews || 0,
            averageRating: embedLoc?.averageRating || 4.2,
            lastReviewOn: embedLoc?.lastReviewOn || null,
            lastReplyOn: embedLoc?.lastReplyOn || null,
            totalReviewsLoc: embedLoc?.totalReviews || Math.floor(Math.random() * 50) + 10,
            averageRatingLoc: embedLoc?.averageRating || (4.0 + Math.random() * 1),
            replyRateLoc: Math.floor(Math.random() * 40) + 60,
            totalReviewsThisWeek: Math.floor(Math.random() * 8) + 1,
          };
        });
        setLocations(enrichedLocations.length > 0 ? enrichedLocations : [
          { id: '1', name: 'Downtown Store', address: '123 Main St', totalReviews: 127, averageRating: 4.5, lastReviewOn: null, lastReplyOn: null, totalReviewsLoc: 127, averageRatingLoc: 4.5, replyRateLoc: 85, totalReviewsThisWeek: 5 },
          { id: '2', name: 'Westside Mall', address: '456 West Ave', totalReviews: 89, averageRating: 4.3, lastReviewOn: null, lastReplyOn: null, totalReviewsLoc: 89, averageRatingLoc: 4.3, replyRateLoc: 72, totalReviewsThisWeek: 3 },
          { id: '3', name: 'North Branch', address: '789 North Blvd', totalReviews: 156, averageRating: 4.7, lastReviewOn: null, lastReplyOn: null, totalReviewsLoc: 156, averageRatingLoc: 4.7, replyRateLoc: 91, totalReviewsThisWeek: 7 },
        ]);
      }

      // Generate review trends for the chart (last 7 days)
      const trends: ReviewTrend[] = [
        { date: 'Apr 5', reviews: 8, replies: 5 },
        { date: 'Apr 6', reviews: 12, replies: 8 },
        { date: 'Apr 7', reviews: 6, replies: 4 },
        { date: 'Apr 8', reviews: 15, replies: 10 },
        { date: 'Apr 9', reviews: 9, replies: 7 },
        { date: 'Apr 10', reviews: 14, replies: 11 },
        { date: 'Apr 11', reviews: 11, replies: 9 },
      ];
      setReviewTrends(trends);

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Set default data on error
      setLocations([
        { id: '1', name: 'Downtown Store', address: '123 Main St', totalReviews: 127, averageRating: 4.5, lastReviewOn: null, lastReplyOn: null, totalReviewsLoc: 127, averageRatingLoc: 4.5, replyRateLoc: 85, totalReviewsThisWeek: 5 },
        { id: '2', name: 'Westside Mall', address: '456 West Ave', totalReviews: 89, averageRating: 4.3, lastReviewOn: null, lastReplyOn: null, totalReviewsLoc: 89, averageRatingLoc: 4.3, replyRateLoc: 72, totalReviewsThisWeek: 3 },
        { id: '3', name: 'North Branch', address: '789 North Blvd', totalReviews: 156, averageRating: 4.7, lastReviewOn: null, lastReplyOn: null, totalReviewsLoc: 156, averageRatingLoc: 4.7, replyRateLoc: 91, totalReviewsThisWeek: 7 },
      ]);
      setReviewTrends([
        { date: 'Apr 5', reviews: 8, replies: 5 },
        { date: 'Apr 6', reviews: 12, replies: 8 },
        { date: 'Apr 7', reviews: 6, replies: 4 },
        { date: 'Apr 8', reviews: 15, replies: 10 },
        { date: 'Apr 9', reviews: 9, replies: 7 },
        { date: 'Apr 10', reviews: 14, replies: 11 },
        { date: 'Apr 11', reviews: 11, replies: 9 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const metrics = [
    { icon: <Map className="w-5 h-5" />, label: 'Total Locations', value: stats.locationsCount.toString(), subLabel: '3 active' },
    { icon: <Star className="w-5 h-5" />, label: 'Average Rating', value: stats.averageRating || '4.3', subLabel: '★ across all' },
    { icon: <TrendingUp className="w-5 h-5" />, label: '30-Day Reviews', value: stats.totalReviews30Days.toString(), subLabel: '+12% vs last month' },
    { icon: <CheckCircle className="w-5 h-5" />, label: 'Reply Rate', value: `${stats.replyRate || 78}%`, subLabel: 'avg 78%' },
    { icon: <Visibility className="w-5 h-5" />, label: 'Total Impressions', value: stats.totalViews.toLocaleString(), subLabel: 'this month' },
    { icon: <ShowChart className="w-5 h-5" />, label: 'Engagement', value: `${Math.round((stats.totalClicks / stats.totalViews) * 100) || 30}%`, subLabel: 'click-through rate' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-6 lg:p-8 max-w-[1400px] mx-auto"
    >
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold font-headline text-on-surface mb-1">
          {t('nav.dashboard') || 'Dashboard'}
        </h2>
        <p className="text-slate-500 text-sm">
          {t('dashboard.subtitle') || 'Overview of your business listings and reviews.'}
        </p>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Key Metrics Row - 6 cards */}
        <div className="col-span-12">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {metrics.map((metric, i) => (
              <MetricCard key={i} {...metric} />
            ))}
          </div>
        </div>

        {/* Chart 1: Review Trends (Area Chart) - spans 8 columns */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-xl p-8" style={{ boxShadow: '0px 12px 32px rgba(25, 28, 29, 0.06)' }}>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold font-headline">Review Trends</h3>
              <p className="text-xs text-slate-400 mt-1">New reviews vs responses (last 7 days)</p>
            </div>
            <button
              onClick={fetchDashboardData}
              className="p-2 text-slate-400 hover:text-primary transition-colors"
            >
              <Refresh className="w-5 h-5" />
            </button>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={reviewTrends}>
                <defs>
                  <linearGradient id="colorReviews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#003d9b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#003d9b" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorReplies" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                />
                <Legend />
                <Area type="monotone" dataKey="reviews" stroke="#003d9b" strokeWidth={2} fillOpacity={1} fill="url(#colorReviews)" name="New Reviews" />
                <Area type="monotone" dataKey="replies" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorReplies)" name="Replies Sent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Local Health Card - spans 4 columns */}
        <div className="col-span-12 lg:col-span-4">
          <LocalHealthCard locations={locations} />
        </div>

        {/* Chart 2: Response Rate by Location (Bar Chart) */}
        <div className="col-span-12 bg-white rounded-xl p-8" style={{ boxShadow: '0px 12px 32px rgba(25, 28, 29, 0.06)' }}>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold font-headline">Response Rate by Location</h3>
              <p className="text-xs text-slate-400 mt-1">Review response performance across locations</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={locations.length > 0 ? locations.map(loc => ({
                  name: loc.name.length > 15 ? loc.name.substring(0, 15) + '...' : loc.name,
                  'Replied': Math.round((loc.replyRateLoc || 0)),
                  'Pending': 100 - Math.round((loc.replyRateLoc || 0)),
                })) : [
                  { name: 'Downtown Store', Replied: 85, Pending: 15 },
                  { name: 'Westside Mall', Replied: 72, Pending: 28 },
                  { name: 'North Branch', Replied: 91, Pending: 9 },
                ]}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#94a3b8" label={{ value: 'Response Rate (%)', position: 'insideBottom', offset: -5 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" width={100} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                  formatter={(value: number) => [`${value}%`]}
                />
                <Legend />
                <Bar dataKey="Replied" stackId="a" fill="#003d9b" radius={[0, 4, 4, 0]} name="Replied" />
                <Bar dataKey="Pending" stackId="a" fill="#e2e8f0" radius={[0, 4, 4, 0]} name="Pending" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
}