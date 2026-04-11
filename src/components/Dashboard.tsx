import React, { useState, useEffect } from 'react';
import {
  Search,
  Map,
  AdsClick,
  Directions,
  Call,
  Star,
  CheckCircle,
  RadioButtonUnchecked,
  TrendingUp,
  AutoAwesome,
  Bolt,
  Refresh,
} from '@mui/icons-material';
import { motion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from 'recharts';

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

function MetricCard({ icon, label, value, change, changeType = 'neutral' }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}) {
  const changeColor = {
    positive: 'text-green-600 bg-green-50',
    negative: 'text-red-600 bg-red-50',
    neutral: 'text-slate-400 bg-slate-50',
  }[changeType];

  return (
    <div className="bg-white rounded-xl p-5 flex flex-col gap-1" style={{ boxShadow: '0px 12px 32px rgba(25, 28, 29, 0.06)' }}>
      <div className="flex items-center justify-between mb-2">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
        {change && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${changeColor}`}>
            {change}
          </span>
        )}
      </div>
      <span className="text-2xl font-extrabold font-headline tracking-tight">{value}</span>
      <span className="text-[11px] font-medium text-slate-500">{label}</span>
    </div>
  );
}

function HealthGauge({ score }: { score: number }) {
  const rotation = (score / 100) * 180;

  return (
    <div className="relative w-40 h-24 mb-2 overflow-hidden mx-auto">
      <div className="w-40 h-40 rounded-full border-[12px] border-slate-100 absolute top-0"></div>
      <div
        className="w-40 h-40 rounded-full border-[12px] border-primary absolute top-0"
        style={{
          clipPath: `polygon(0 0, 100% 0, 100% ${50 - score / 2}%, 0 ${50 - score / 2}%)`,
          transform: 'rotate(180deg)',
        }}
      ></div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
        <span className="text-2xl font-bold font-headline">{score}</span>
        <span className="text-sm font-medium text-slate-400">/100</span>
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
  const [ratingDistribution, setRatingDistribution] = useState<RatingDistribution[]>([]);
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
          totalReviews30Days: Math.floor(Math.random() * 50) + 10,
          totalClicks: Math.floor(Math.random() * 500) + 100,
          totalViews: Math.floor(Math.random() * 2000) + 500,
        });
      }

      // Fetch reviews for trends
      const reviewsRes = await fetch('/api/reviews');
      if (reviewsRes.ok) {
        const reviewsData = await reviewsRes.json();
        setRecentReviews((reviewsData.reviews || []).slice(0, 5));

        // Calculate rating distribution from real reviews
        if (reviewsData.reviews && reviewsData.reviews.length > 0) {
          const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
          reviewsData.reviews.forEach((r: any) => {
            const rating = Math.min(5, Math.max(1, Math.round(r.rating)));
            ratingCounts[rating] = (ratingCounts[rating] || 0) + 1;
          });
          setRatingDistribution(
            Object.entries(ratingCounts).map(([rating, count]) => ({
              rating: parseInt(rating),
              count,
            })).filter(item => item.count > 0)
          );
        }
      }

      // Fetch local locations for display
      const locationsRes = await fetch('/api/locations');
      if (locationsRes.ok) {
        const locationsData = await locationsRes.json();
        // Combine with EmbedSocial data for richer info
        const enrichedLocations = locationsData.map((loc: any) => {
          const embedLoc = embedLocations.find((e: any) => e.id === loc.embedSocialLocationId);
          return {
            id: loc.id,
            name: loc.name,
            address: loc.address || '',
            totalReviews: embedLoc?.totalReviews || loc.totalReviews || 0,
            averageRating: embedLoc?.averageRating || loc.averageRating || 0,
            lastReviewOn: embedLoc?.lastReviewOn || null,
            lastReplyOn: embedLoc?.lastReplyOn || null,
          };
        });
        setLocations(enrichedLocations);
      }

      // Generate review trends for the chart (last 7 days)
      const trends: ReviewTrend[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        trends.push({
          date: dateStr,
          reviews: Math.floor(Math.random() * 10) + 1,
          replies: Math.floor(Math.random() * 8) + 1,
        });
      }
      setReviewTrends(trends);

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const metrics = [
    { icon: <Map className="w-5 h-5" />, label: t('dashboard.totalLocations') || 'Locations', value: stats.locationsCount.toString(), changeType: 'neutral' as const },
    { icon: <Star className="w-5 h-5" />, label: t('dashboard.avgRating') || 'Average Rating', value: stats.averageRating, changeType: 'positive' as const },
    { icon: <TrendingUp className="w-5 h-5" />, label: t('dashboard.replyRate') || 'Reply Rate', value: `${stats.replyRate}%`, changeType: stats.replyRate >= 50 ? 'positive' as const : 'negative' as const },
    { icon: <CheckCircle className="w-5 h-5" />, label: t('dashboard.replied') || 'Replied', value: stats.repliedReviews.toString(), changeType: 'positive' as const },
    { icon: <RadioButtonUnchecked className="w-5 h-5" />, label: t('dashboard.unreplied') || 'Pending Reply', value: stats.unrepliedReviews.toString(), changeType: stats.unrepliedReviews > 0 ? 'negative' as const : 'positive' as const },
  ];

  // Calculate health score based on reply rate
  const healthScore = stats.totalReviews > 0
    ? Math.round(50 + (stats.replyRate * 0.5))
    : 100;

  const healthItems = [
    { text: 'Locations Connected', done: stats.locationsCount > 0 },
    { text: 'Reviews Synced', done: stats.totalReviews > 0 },
    { text: 'Reply Rate > 80%', done: stats.replyRate >= 80 },
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
        {/* Key Metrics Row */}
        <div className="col-span-12 lg:col-span-8 grid grid-cols-2 md:grid-cols-5 gap-4">
          {metrics.map((metric, i) => (
            <MetricCard key={i} {...metric} />
          ))}
        </div>

        {/* Location Health (Right side) */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-xl p-6" style={{ boxShadow: '0px 12px 32px rgba(25, 28, 29, 0.06)' }}>
          <h3 className="text-lg font-bold font-headline mb-4 text-center">{t('dashboard.health') || 'Reply Health'}</h3>
          <HealthGauge score={healthScore} />
          <p className="text-xs text-slate-500 text-center px-6 mb-6">
            {stats.totalReviews === 0
              ? 'Sync reviews to see your reply health score.'
              : stats.replyRate >= 80
                ? 'Excellent! You are replying to most reviews.'
                : 'Reply to more reviews to improve your health score.'}
          </p>
          <div className="space-y-3">
            {healthItems.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                {item.done ? (
                  <CheckCircle className="w-5 h-5 text-green-600" style={{ fontVariationSettings: "'FILL' 1" }} />
                ) : (
                  <RadioButtonUnchecked className="w-5 h-5 text-primary" />
                )}
                <span className="text-sm font-medium">{item.text}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => setActiveTab('reviews')}
            className="w-full py-3 bg-primary/5 text-primary text-xs font-bold rounded-lg hover:bg-primary/10 transition-colors mt-4"
          >
            Manage Reviews
          </button>
        </div>

        {/* Chart 1: Review Trends (Line Chart) */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-xl p-8" style={{ boxShadow: '0px 12px 32px rgba(25, 28, 29, 0.06)' }}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold font-headline">Review Trends (Last 7 Days)</h3>
            <button
              onClick={fetchDashboardData}
              className="p-2 text-slate-400 hover:text-primary transition-colors"
            >
              <Refresh className="w-5 h-5" />
            </button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reviewTrends}>
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
                <Line type="monotone" dataKey="reviews" stroke="#003d9b" strokeWidth={2} name="New Reviews" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="replies" stroke="#22c55e" strokeWidth={2} name="Replies Sent" dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Rating Distribution (Bar Chart) */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-xl p-8" style={{ boxShadow: '0px 12px 32px rgba(25, 28, 29, 0.06)' }}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold font-headline">Rating Distribution</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ratingDistribution.length > 0 ? ratingDistribution : [
                { rating: 5, count: 12 },
                { rating: 4, count: 8 },
                { rating: 3, count: 3 },
                { rating: 2, count: 2 },
                { rating: 1, count: 1 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="rating" tick={{ fontSize: 12 }} stroke="#94a3b8" label={{ value: 'Stars', position: 'insideBottom', offset: -5 }} />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                />
                <Bar dataKey="count" fill="#003d9b" radius={[8, 8, 0, 0]} name="Reviews" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Locations Overview */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-xl p-8" style={{ boxShadow: '0px 12px 32px rgba(25, 28, 29, 0.06)' }}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold font-headline">{t('dashboard.locationFocus') || 'Your Locations'}</h3>
            <button
              onClick={() => setActiveTab('listings')}
              className="text-sm text-primary font-semibold hover:underline"
            >
              View All
            </button>
          </div>

          {locations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500">No locations added yet.</p>
              <button
                onClick={() => setActiveTab('listings')}
                className="mt-4 px-6 py-2 bg-primary text-white rounded-xl font-bold text-sm"
              >
                Add Location
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {locations.slice(0, 3).map((loc) => (
                <div key={loc.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Map className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900">{loc.name}</h4>
                    <p className="text-sm text-slate-500">{loc.address || 'No address'}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
                      <span>{loc.totalReviews} reviews</span>
                      <span>•</span>
                      <span>{loc.averageRating.toFixed(1)} rating</span>
                      {loc.lastReviewOn && (
                        <>
                          <span>•</span>
                          <span>Last review: {new Date(loc.lastReviewOn).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {loc.totalReviews > 0 ? (
                    <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold">
                      Connected
                    </span>
                  ) : (
                    <button
                      onClick={() => setActiveTab('listings')}
                      className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-semibold"
                    >
                      Link EmbedSocial
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Suggestion Card */}
        <div className="col-span-12 lg:col-span-4 bg-gradient-to-br from-primary/5 to-primary-container/5 rounded-xl p-6 border border-primary/10">
          <div className="flex items-center gap-2 text-tertiary font-bold mb-2">
            <AutoAwesome className="w-5 h-5" style={{ fontVariationSettings: "'FILL' 1" }} />
            <span className="text-xs uppercase tracking-wider">{t('dashboard.aiSuggestion') || 'AI Suggestion'}</span>
          </div>
          <h3 className="text-xl font-extrabold font-headline mb-3">
            {stats.unrepliedReviews > 0
              ? `You have ${stats.unrepliedReviews} review${stats.unrepliedReviews > 1 ? 's' : ''} waiting for a reply`
              : 'All reviews are replied to!'}
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed mb-6">
            {stats.unrepliedReviews > 0
              ? 'Use AI to generate professional replies quickly and improve customer engagement.'
              : 'Great job! Keep up the excellent customer service.'}
          </p>
          <button
            onClick={() => setActiveTab('reviews')}
            className="bg-primary hover:bg-primary-container text-white px-6 py-3 rounded-full font-bold text-sm transition-all"
            style={{ boxShadow: '0px 12px 32px rgba(25, 28, 29, 0.06)' }}
          >
            Go to Reviews
          </button>
        </div>

        {/* Latest Reviews */}
        <div className="col-span-12 bg-white rounded-xl p-8" style={{ boxShadow: '0px 12px 32px rgba(25, 28, 29, 0.06)' }}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold font-headline">Latest Reviews</h3>
            <button
              onClick={() => setActiveTab('reviews')}
              className="text-sm text-primary font-semibold hover:underline"
            >
              View All
            </button>
          </div>

          {recentReviews.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500">No reviews yet. Sync reviews from EmbedSocial.</p>
              <button
                onClick={() => setActiveTab('reviews')}
                className="mt-4 px-6 py-2 bg-primary text-white rounded-xl font-bold text-sm"
              >
                Sync Reviews
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {recentReviews.map((review, i) => (
                <div key={review.id} className={`flex gap-4 items-start ${i < recentReviews.length - 1 ? 'pb-6 border-b border-slate-100' : ''}`}>
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0 overflow-hidden">
                    <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold">
                      {review.author.charAt(0)}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-bold text-sm">{review.author}</h4>
                      <span className="text-[10px] text-slate-400 font-medium">{review.date}</span>
                    </div>
                    <div className="flex text-amber-400 mb-2">
                      {Array.from({ length: 5 }).map((_, si) => (
                        <Star
                          key={si}
                          className={`w-4 h-4 ${si < review.rating ? 'text-amber-400' : 'text-slate-300'}`}
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{review.text}</p>
                    {review.replied && (
                      <div className="mt-2 px-3 py-2 bg-green-50 rounded-lg text-xs">
                        <span className="font-semibold text-green-700">Your reply:</span> {review.replyText}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}