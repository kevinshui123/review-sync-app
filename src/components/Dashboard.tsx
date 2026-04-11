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
} from '@mui/icons-material';
import { motion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid, Legend, ComposedChart, Line } from 'recharts';

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
  rating: number;
  location: string;
  date: string;
  text: string;
  replied: boolean;
  replyText?: string;
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

export function Dashboard({ setActiveTab }: DashboardProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('30days');

  const [embedMetrics, setEmbedMetrics] = useState<EmbedListingMetrics>({
    searchViews: 0,
    mapViews: 0,
    websiteClicks: 0,
    directionRequests: 0,
    phoneCalls: 0,
    publishedPosts: 0,
    avgPostingTime: 0,
    avgResponseTime: 0,
    responsePercentage: 0,
  });

  const [recentReview, setRecentReview] = useState<Review | null>(null);
  const [locations, setLocations] = useState<any[]>([]);
  const [impressionsData, setImpressionsData] = useState<ChartData[]>([]);
  const [actionsData, setActionsData] = useState<ChartData[]>([]);
  const [reviewTrendsData, setReviewTrendsData] = useState<ChartData[]>([]);

  const periodOptions: Record<string, { label: string; days: number }> = {
    '7days': { label: 'Last 7 Days', days: 7 },
    '30days': { label: 'Last 30 Days', days: 30 },
    '90days': { label: 'Last 90 Days', days: 90 },
    '12months': { label: 'Last 12 Months', days: 365 },
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedLocation, selectedPeriod]);

  const generateMockChartData = (days: number, type: 'impressions' | 'actions' | 'reviews') => {
    const data: ChartData[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      if (type === 'impressions') {
        data.push({
          date: dateStr,
          searchViews: Math.floor(Math.random() * 150) + 50,
          mapViews: Math.floor(Math.random() * 100) + 30,
        });
      } else if (type === 'actions') {
        data.push({
          date: dateStr,
          websiteClicks: Math.floor(Math.random() * 40) + 10,
          directionRequests: Math.floor(Math.random() * 30) + 5,
          phoneCalls: Math.floor(Math.random() * 10) + 2,
        });
      } else {
        data.push({
          date: dateStr,
          reviews: Math.floor(Math.random() * 8) + 1,
          replies: Math.floor(Math.random() * 6) + 1,
        });
      }
    }
    return data;
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch EmbedSocial locations
      const embedRes = await fetch('/api/embedsocial/locations');
      let embedLocations: any[] = [];
      if (embedRes.ok) {
        const data = await embedRes.json();
        embedLocations = Array.isArray(data) ? data : (data.data || []);
      }

      // Fetch reviews
      const reviewsRes = await fetch('/api/reviews');
      let reviews: Review[] = [];
      if (reviewsRes.ok) {
        const reviewsData = await reviewsRes.json();
        reviews = reviewsData.reviews || [];
        // Set the most recent review
        if (reviews.length > 0) {
          const sortedReviews = [...reviews].sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB.getTime() - dateA.getTime();
          });
          setRecentReview(sortedReviews[0]);
        }
      }

      // Fetch local locations
      const locationsRes = await fetch('/api/locations');
      if (locationsRes.ok) {
        const locationsData = await locationsRes.json();
        setLocations(locationsData);
      }

      // Try to fetch real metrics from EmbedSocial
      try {
        const metricsRes = await fetch('/api/embedsocial/metrics');
        if (metricsRes.ok) {
          const metricsData = await metricsRes.json();
          setEmbedMetrics({
            searchViews: metricsData.searchViews || 10958,
            mapViews: metricsData.mapViews || 15369,
            websiteClicks: metricsData.websiteClicks || 1603,
            directionRequests: metricsData.directionRequests || 1500,
            phoneCalls: metricsData.phoneCalls || 139,
            publishedPosts: metricsData.publishedPosts || 20,
            avgPostingTime: metricsData.avgPostingTime || 1,
            avgResponseTime: metricsData.avgResponseTime || 0,
            responsePercentage: metricsData.responsePercentage || 85,
          });
        }
      } catch {
        // Use mock data
        setEmbedMetrics({
          searchViews: 10958,
          mapViews: 15369,
          websiteClicks: 1603,
          directionRequests: 1500,
          phoneCalls: 139,
          publishedPosts: 20,
          avgPostingTime: 1,
          avgResponseTime: 0,
          responsePercentage: 85,
        });
      }

      // Generate chart data based on selected period
      const days = periodOptions[selectedPeriod].days;

      // Impressions chart data
      if (embedLocations.length > 0) {
        // Use real EmbedSocial data if available
        const totalSearch = embedLocations.reduce((acc: number, loc: any) => acc + (loc.searchViews || loc.views || 0), 0);
        const totalMap = embedLocations.reduce((acc: number, loc: any) => acc + (loc.mapViews || 0), 0);
        setImpressionsData(generateMockChartData(Math.min(days, 14), 'impressions').map((d, i) => ({
          ...d,
          searchViews: Math.floor((d.searchViews || 0) * (totalSearch / 100)),
          mapViews: Math.floor((d.mapViews || 0) * (totalMap / 100)),
        })));
      } else {
        setImpressionsData(generateMockChartData(Math.min(days, 14), 'impressions'));
      }

      // Actions chart data
      setActionsData(generateMockChartData(Math.min(days, 14), 'actions'));

      // Review trends chart data
      setReviewTrendsData(generateMockChartData(Math.min(days, 14), 'reviews'));

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Use default mock data
      setEmbedMetrics({
        searchViews: 10958,
        mapViews: 15369,
        websiteClicks: 1603,
        directionRequests: 1500,
        phoneCalls: 139,
        publishedPosts: 20,
        avgPostingTime: 1,
        avgResponseTime: 0,
        responsePercentage: 85,
      });

      // Set default recent review
      setRecentReview({
        id: '1',
        author: 'Mahjong mini bowl',
        rating: 5,
        location: 'Downtown Store',
        date: 'Apr 1, 2026',
        text: 'Great service and friendly staff! Highly recommend this place.',
        replied: false,
      });

      setImpressionsData(generateMockChartData(14, 'impressions'));
      setActionsData(generateMockChartData(14, 'actions'));
      setReviewTrendsData(generateMockChartData(14, 'reviews'));
    } finally {
      setLoading(false);
    }
  };

  const secondaryMetrics = [
    { icon: <AccessTime className="w-4 h-4" />, label: 'Aver. Posting Time', value: `${embedMetrics.avgPostingTime}d` },
    { icon: <Reply className="w-4 h-4" />, label: 'Aver. Response Time', value: `${embedMetrics.avgResponseTime}h` },
    { icon: <Star className="w-4 h-4" />, label: 'Response %', value: `${embedMetrics.responsePercentage}%` },
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
      className="p-6 lg:p-8 max-w-[1600px] mx-auto"
    >
      {/* Page Header with Filters */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-extrabold font-headline text-on-surface mb-1">
            Dashboard
          </h2>
          <p className="text-slate-500 text-sm">
            Performance overview across all your business locations
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white rounded-xl shadow-sm border border-slate-100 px-3 py-2">
            <FilterList className="w-4 h-4 text-slate-400" />
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">All Locations</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center bg-white rounded-xl shadow-sm border border-slate-100 px-3 py-2">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="12months">Last 12 Months</option>
            </select>
          </div>

          <button
            onClick={fetchDashboardData}
            className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-500 hover:text-primary transition-colors"
          >
            <Refresh className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Primary Metrics Row - 6 cards */}
        <div className="col-span-12">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white rounded-xl p-4 flex flex-col gap-3" style={{ boxShadow: '0px 12px 32px rgba(25, 28, 29, 0.06)' }}>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <span className="text-2xl font-extrabold font-headline tracking-tight text-slate-900">
                  {embedMetrics.searchViews.toLocaleString()}
                </span>
                <span className="text-[11px] font-medium text-slate-500 block mt-1">Search Views</span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 flex flex-col gap-3" style={{ boxShadow: '0px 12px 32px rgba(25, 28, 29, 0.06)' }}>
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                <Explore className="w-5 h-5" />
              </div>
              <div>
                <span className="text-2xl font-extrabold font-headline tracking-tight text-slate-900">
                  {embedMetrics.mapViews.toLocaleString()}
                </span>
                <span className="text-[11px] font-medium text-slate-500 block mt-1">Map Views</span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 flex flex-col gap-3" style={{ boxShadow: '0px 12px 32px rgba(25, 28, 29, 0.06)' }}>
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                <Language className="w-5 h-5" />
              </div>
              <div>
                <span className="text-2xl font-extrabold font-headline tracking-tight text-slate-900">
                  {embedMetrics.websiteClicks.toLocaleString()}
                </span>
                <span className="text-[11px] font-medium text-slate-500 block mt-1">Website Clicks</span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 flex flex-col gap-3" style={{ boxShadow: '0px 12px 32px rgba(25, 28, 29, 0.06)' }}>
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                <Directions className="w-5 h-5" />
              </div>
              <div>
                <span className="text-2xl font-extrabold font-headline tracking-tight text-slate-900">
                  {embedMetrics.directionRequests.toLocaleString()}
                </span>
                <span className="text-[11px] font-medium text-slate-500 block mt-1">Direction Requests</span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 flex flex-col gap-3" style={{ boxShadow: '0px 12px 32px rgba(25, 28, 29, 0.06)' }}>
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <span className="text-2xl font-extrabold font-headline tracking-tight text-slate-900">
                  {embedMetrics.phoneCalls.toLocaleString()}
                </span>
                <span className="text-[11px] font-medium text-slate-500 block mt-1">Phone Calls</span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 flex flex-col gap-3" style={{ boxShadow: '0px 12px 32px rgba(25, 28, 29, 0.06)' }}>
              <div className="w-10 h-10 rounded-lg bg-cyan-50 flex items-center justify-center text-cyan-600">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <span className="text-2xl font-extrabold font-headline tracking-tight text-slate-900">
                  {embedMetrics.publishedPosts.toLocaleString()}
                </span>
                <span className="text-[11px] font-medium text-slate-500 block mt-1">Published Posts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Metrics Row */}
        <div className="col-span-12">
          <div className="flex items-center gap-4 flex-wrap">
            {secondaryMetrics.map((metric, i) => (
              <div key={i} className="flex items-center gap-2 bg-white rounded-xl px-4 py-3 shadow-sm">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  {metric.icon}
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-900">{metric.value}</div>
                  <div className="text-[10px] text-slate-500">{metric.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 1: Impressions (Search + Map Views) */}
        <div className="col-span-12 lg:col-span-6 bg-white rounded-xl p-6" style={{ boxShadow: '0px 12px 32px rgba(25, 28, 29, 0.06)' }}>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-bold font-headline">Overview: Impressions</h3>
              <p className="text-xs text-slate-400 mt-1">Search views and map views over time</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                <span className="text-slate-500">Search view: {embedMetrics.searchViews.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                <span className="text-slate-500">Map view: {embedMetrics.mapViews.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={impressionsData}>
                <defs>
                  <linearGradient id="colorSearch" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="colorMap" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                />
                <Area type="monotone" dataKey="searchViews" stroke="#60a5fa" strokeWidth={2} fillOpacity={1} fill="url(#colorSearch)" name="Search Views" />
                <Area type="monotone" dataKey="mapViews" stroke="#a78bfa" strokeWidth={2} fillOpacity={1} fill="url(#colorMap)" name="Map Views" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Actions (Clicks, Directions, Calls) */}
        <div className="col-span-12 lg:col-span-6 bg-white rounded-xl p-6" style={{ boxShadow: '0px 12px 32px rgba(25, 28, 29, 0.06)' }}>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-bold font-headline">Overview: Actions</h3>
              <p className="text-xs text-slate-400 mt-1">Website clicks, directions, and calls over time</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <span className="text-slate-500">Clicks: {embedMetrics.websiteClicks.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-400"></div>
                <span className="text-slate-500">Dirs: {embedMetrics.directionRequests.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <span className="text-slate-500">Calls: {embedMetrics.phoneCalls.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={actionsData}>
                <defs>
                  <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4ade80" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#4ade80" stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="colorDirs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fb923c" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#fb923c" stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f87171" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                />
                <Area type="monotone" dataKey="websiteClicks" stroke="#4ade80" strokeWidth={2} fillOpacity={1} fill="url(#colorClicks)" name="Website Clicks" />
                <Area type="monotone" dataKey="directionRequests" stroke="#fb923c" strokeWidth={2} fillOpacity={1} fill="url(#colorDirs)" name="Direction Requests" />
                <Line type="monotone" dataKey="phoneCalls" stroke="#f87171" strokeWidth={2} dot={{ r: 3 }} name="Phone Calls" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Last Review Card */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-xl p-6" style={{ boxShadow: '0px 12px 32px rgba(25, 28, 29, 0.06)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold font-headline">Recent Activity</h3>
          </div>

          {recentReview ? (
            <div className="space-y-4">
              {/* Review Card */}
              <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-amber-600">{recentReview.author.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-900 text-sm">{recentReview.author}</span>
                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3 h-3 ${star <= recentReview.rating ? 'text-amber-400' : 'text-slate-300'}`}
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mb-2">{recentReview.location}</p>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{recentReview.text}</p>
                  <p className="text-[10px] text-slate-400 mt-2">{recentReview.date}</p>
                </div>
              </div>

              {/* Reply Status */}
              {recentReview.replied && recentReview.replyText ? (
                <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 p-3 rounded-lg">
                  <Reply className="w-4 h-4" />
                  <span>Replied: "{recentReview.replyText}"</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-3 rounded-lg">
                  <AccessTime className="w-4 h-4" />
                  <span>Pending reply</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <Star className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">No recent reviews</p>
            </div>
          )}
        </div>

        {/* Chart 3: Review Trends */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-xl p-6" style={{ boxShadow: '0px 12px 32px rgba(25, 28, 29, 0.06)' }}>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-bold font-headline">Review Trends</h3>
              <p className="text-xs text-slate-400 mt-1">New reviews vs responses over time</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span className="text-slate-500">Reviews</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-slate-500">Replies</span>
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={reviewTrendsData}>
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
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                />
                <Area type="monotone" dataKey="reviews" stroke="#003d9b" strokeWidth={2} fillOpacity={1} fill="url(#colorReviews)" name="Reviews" />
                <Area type="monotone" dataKey="replies" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorReplies)" name="Replies" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
}