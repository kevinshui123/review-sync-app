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
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import { motion } from 'motion/react';
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
  description?: string;
  phone?: string;
  website?: string;
  openingHours?: string;
  category?: string;
  totalReviews: number;
  averageRating: number;
  // Health fields
  hasBusinessName: boolean;
  hasDescription: boolean;
  hasAddress: boolean;
  hasOpeningHours: boolean;
  hasWebsite: boolean;
  hasCategory: boolean;
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
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className={`p-4 rounded-xl border ${review.isPositive ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
      <div className="flex items-start gap-3">
        {/* Avatar */}
        {review.authorPhoto ? (
          <img
            src={review.authorPhoto}
            alt={review.author}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: getAvatarColor(review.author) }}
          >
            {getInitials(review.author)}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-slate-900 text-sm">{review.author}</span>
            <div className="flex items-center gap-2">
              {review.isPositive ? (
                <ThumbUp className="w-4 h-4 text-green-600" />
              ) : (
                <ThumbDown className="w-4 h-4 text-red-600" />
              )}
              <div className="flex text-amber-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-3 h-3 ${star <= review.rating ? 'text-amber-400' : 'text-slate-300'}`}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  />
                ))}
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-600 mb-1">{review.location}</p>
          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{review.text}</p>
          <p className="text-[10px] text-slate-400 mt-2">{review.date}</p>
        </div>
      </div>

      {review.replied && review.replyText && (
        <div className="mt-3 ml-13 pl-3 border-l-2 border-green-200">
          <div className="flex items-center gap-1 text-xs text-green-600 mb-1">
            <Reply className="w-3 h-3" />
            <span>Your reply</span>
          </div>
          <p className="text-xs text-slate-600">{review.replyText}</p>
        </div>
      )}

      {!review.replied && (
        <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
          <AccessTime className="w-3 h-3" />
          <span>Pending reply</span>
        </div>
      )}
    </div>
  );
}

function LocationHealthCard({ locations }: { locations: LocationData[] }) {
  const totalReviews = locations.reduce((acc, loc) => acc + (loc.totalReviews || 0), 0);
  const avgRating = locations.length > 0
    ? (locations.reduce((acc, loc) => acc + (loc.averageRating || 0), 0) / locations.length).toFixed(1)
    : '0.0';

  const avgHealthScore = locations.length > 0
    ? Math.round(locations.reduce((acc, loc) => acc + (loc.healthScore || 0), 0) / locations.length)
    : 0;

  const mainLocation = locations[0] || null;

  const getHealthStatus = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'text-green-600', bg: 'bg-green-50', barColor: 'bg-green-500' };
    if (score >= 60) return { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-50', barColor: 'bg-blue-500' };
    if (score >= 40) return { label: 'Needs Attention', color: 'text-amber-600', bg: 'bg-amber-50', barColor: 'bg-amber-500' };
    return { label: 'Poor', color: 'text-red-600', bg: 'bg-red-50', barColor: 'bg-red-500' };
  };

  const status = getHealthStatus(avgHealthScore);

  const checklistItems = mainLocation ? [
    { label: 'Business name', done: mainLocation.hasBusinessName },
    { label: 'Description', done: mainLocation.hasDescription },
    { label: 'Address (Location)', done: mainLocation.hasAddress },
    { label: 'Opening hours', done: mainLocation.hasOpeningHours },
    { label: 'Website URL', done: mainLocation.hasWebsite },
    { label: 'Category', done: mainLocation.hasCategory },
    { label: 'Phone number', done: mainLocation.hasPhone },
    { label: 'Number of reviews', done: mainLocation.totalReviews > 0 },
  ] : [];

  return (
    <div className="bg-white rounded-xl p-6" style={{ boxShadow: '0px 12px 32px rgba(25, 28, 29, 0.06)' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold font-headline">Location Health</h3>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-3 bg-slate-50 rounded-xl">
          <div className={`text-2xl font-bold ${status.color}`}>{avgHealthScore}</div>
          <div className="text-[10px] text-slate-500">/ 100</div>
        </div>
        <div className="text-center p-3 bg-slate-50 rounded-xl">
          <div className="text-2xl font-bold text-primary flex items-center justify-center gap-1">
            {avgRating} <span className="text-amber-400 text-lg">★</span>
          </div>
          <div className="text-[10px] text-slate-500">/ 5</div>
        </div>
        <div className="text-center p-3 bg-slate-50 rounded-xl">
          <div className="text-2xl font-bold text-primary">{totalReviews}</div>
          <div className="text-[10px] text-slate-500">reviews</div>
        </div>
      </div>

      {/* Health Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="font-medium text-slate-600">Overall location health</span>
          <span className={`font-bold ${status.color}`}>{avgHealthScore}%</span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${status.barColor}`}
            style={{ width: `${avgHealthScore}%` }}
          />
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-2">
        <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-2">Profile Completeness</div>
        {checklistItems.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            {item.done ? (
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
            ) : (
              <Cancel className="w-4 h-4 text-red-400 flex-shrink-0" />
            )}
            <span className={`text-xs ${item.done ? 'text-slate-600' : 'text-slate-400'}`}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Location Selector */}
      {locations.length > 1 && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <select className="w-full p-2 text-xs border border-slate-200 rounded-lg">
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

export function Dashboard({ setActiveTab }: DashboardProps) {
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('30days');
  const [reviewFilter, setReviewFilter] = useState<'all' | 'positive' | 'negative'>('all');

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

  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [locations, setLocations] = useState<LocationData[]>([]);
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

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch EmbedSocial locations - this has the real data!
      const embedRes = await fetch('/api/embedsocial/locations');
      let embedLocations: any[] = [];
      if (embedRes.ok) {
        const data = await embedRes.json();
        embedLocations = Array.isArray(data) ? data : (data.data || []);
        console.log('[Dashboard] Embed locations:', embedLocations.length);
      }

      // First try to fetch reviews from EmbedSocial (has real data)
      let reviews: Review[] = [];
      let embedReviews: any[] = [];
      try {
        const embedReviewsRes = await fetch('/api/embedsocial/reviews');
        console.log('[Dashboard] EmbedSocial reviews response status:', embedReviewsRes.status);
        if (embedReviewsRes.ok) {
          const embedReviewsData = await embedReviewsRes.json();
          console.log('[Dashboard] EmbedSocial reviews raw JSON:', JSON.stringify(embedReviewsData)?.slice(0, 500));
          embedReviews = Array.isArray(embedReviewsData) ? embedReviewsData : (embedReviewsData.data || embedReviewsData.items || []);
          console.log('[Dashboard] EmbedSocial reviews count:', embedReviews.length);

          reviews = embedReviews.map((r: any) => {
            console.log('[Dashboard] Processing review:', r.authorName, 'rating:', r.rating);
            return {
              id: r.id,
              author: r.authorName || 'Anonymous User',
              authorPhoto: r.authorPhoto || r.profilePhotoUrl || null,
              rating: r.rating || 0,
              location: r.sourceName || embedLocations[0]?.name || 'Google',
              date: r.originalCreatedOn ? new Date(r.originalCreatedOn).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
              text: r.captionText || r.text || '',
              replied: r.replies && r.replies.length > 0,
              replyText: undefined,
              isPositive: (r.rating || 0) >= 4,
            };
          });
        } else {
          console.log('[Dashboard] EmbedSocial reviews fetch failed, status:', embedReviewsRes.status);
        }
      } catch (e) {
        console.log('[Dashboard] EmbedSocial reviews fetch error:', e);
      }

      console.log('[Dashboard] Total reviews after EmbedSocial fetch:', reviews.length);

      // If no EmbedSocial reviews, try database
      if (reviews.length === 0) {
        const reviewsRes = await fetch('/api/reviews');
        if (reviewsRes.ok) {
          const reviewsData = await reviewsRes.json();
          const rawReviews = reviewsData.reviews || [];

          reviews = rawReviews.map((r: any) => ({
            id: r.id,
            author: r.reviewerName || r.author || 'Anonymous User',
            authorPhoto: null,
            rating: r.rating || 0,
            location: r.locationName || r.location || 'Unknown',
            date: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
            text: r.comment || r.text || '',
            replied: !!r.replyText,
            replyText: r.replyText,
            isPositive: (r.rating || 0) >= 4,
          }));
        }
      }

      console.log('[Dashboard] Total reviews to display:', reviews.length);
      setRecentReviews(reviews);

      // Fetch local locations
      const locationsRes = await fetch('/api/locations');
      let localLocations: any[] = [];
      if (locationsRes.ok) {
        localLocations = await locationsRes.json();
      }

      // Enrich locations with EmbedSocial data and calculate health scores
      // Use EmbedSocial data if available, otherwise use local data
      const enrichedLocations: LocationData[] = [];

      // First, add locations from EmbedSocial (these have real reviews and rating data)
      for (const embedLoc of embedLocations) {
        const localLoc = localLocations.find((l: any) =>
          l.embedSocialLocationId === embedLoc.id ||
          l.googlePlaceId === embedLoc.googleId
        );

        const name = localLoc?.name || embedLoc.name || 'Unnamed Location';
        const address = localLoc?.address || embedLoc.address || '';
        const phone = localLoc?.phone || embedLoc.phoneNumber || '';
        const website = localLoc?.website || embedLoc.websiteUrl || '';
        const totalReviews = embedLoc.totalReviews || 0;
        const averageRating = embedLoc.averageRating || 0;

        // Calculate health score based on profile completeness
        let healthScore = 100;
        const hasBusinessName = name.trim().length >= 2;
        const hasDescription = !!(localLoc?.description && localLoc.description.trim().length >= 20);
        const hasAddress = address.trim().length >= 5;
        const hasOpeningHours = !!(localLoc?.openingHours || localLoc?.businessHours);
        const hasWebsite = website.length > 0;
        const hasCategory = !!(localLoc?.category);
        const hasPhone = phone.length > 0;

        if (!hasBusinessName) healthScore -= 15;
        if (!hasDescription) healthScore -= 10;
        if (!hasAddress) healthScore -= 20;
        if (!hasOpeningHours) healthScore -= 10;
        if (!hasWebsite) healthScore -= 10;
        if (!hasCategory) healthScore -= 5;
        if (!hasPhone) healthScore -= 10;
        if (totalReviews === 0) healthScore -= 15;
        if (averageRating > 0 && averageRating < 3.5) healthScore -= 5;

        enrichedLocations.push({
          id: localLoc?.id || embedLoc.id,
          name,
          address,
          description: localLoc?.description || '',
          phone,
          website,
          openingHours: localLoc?.openingHours || localLoc?.businessHours || '',
          category: localLoc?.category || '',
          totalReviews,
          averageRating,
          hasBusinessName,
          hasDescription,
          hasAddress,
          hasOpeningHours,
          hasWebsite,
          hasCategory,
          hasPhone,
          healthScore: Math.max(0, healthScore),
        });
      }

      // Then add any local locations that don't have EmbedSocial data
      for (const localLoc of localLocations) {
        const hasEmbedData = embedLocations.some((e: any) =>
          e.id === localLoc.embedSocialLocationId ||
          e.googleId === localLoc.googlePlaceId
        );

        if (!hasEmbedData) {
          const totalReviews = localLoc.totalReviews || 0;
          const averageRating = localLoc.averageRating || 0;

          let healthScore = 100;
          const hasBusinessName = !!(localLoc.name && localLoc.name.trim().length >= 2);
          const hasDescription = !!(localLoc.description && localLoc.description.trim().length >= 20);
          const hasAddress = !!(localLoc.address && localLoc.address.trim().length >= 5);
          const hasOpeningHours = !!(localLoc.openingHours || localLoc.businessHours);
          const hasWebsite = !!(localLoc.website || localLoc.websiteUrl);
          const hasCategory = !!(localLoc.category);
          const hasPhone = !!(localLoc.phone);

          if (!hasBusinessName) healthScore -= 15;
          if (!hasDescription) healthScore -= 10;
          if (!hasAddress) healthScore -= 20;
          if (!hasOpeningHours) healthScore -= 10;
          if (!hasWebsite) healthScore -= 10;
          if (!hasCategory) healthScore -= 5;
          if (!hasPhone) healthScore -= 10;
          if (totalReviews === 0) healthScore -= 15;
          if (averageRating > 0 && averageRating < 3.5) healthScore -= 5;

          enrichedLocations.push({
            id: localLoc.id,
            name: localLoc.name || 'Unnamed Location',
            address: localLoc.address || '',
            description: localLoc.description || '',
            phone: localLoc.phone || '',
            website: localLoc.website || localLoc.websiteUrl || '',
            openingHours: localLoc.openingHours || localLoc.businessHours || '',
            category: localLoc.category || '',
            totalReviews,
            averageRating,
            hasBusinessName,
            hasDescription,
            hasAddress,
            hasOpeningHours,
            hasWebsite,
            hasCategory,
            hasPhone,
            healthScore: Math.max(0, healthScore),
          });
        }
      }

      // If no locations at all, create a default one with EmbedSocial data
      if (enrichedLocations.length === 0 && embedLocations.length > 0) {
        const embedLoc = embedLocations[0];
        enrichedLocations.push({
          id: embedLoc.id,
          name: embedLoc.name || 'Location',
          address: embedLoc.address || '',
          description: '',
          phone: embedLoc.phoneNumber || '',
          website: embedLoc.websiteUrl || '',
          openingHours: '',
          category: '',
          totalReviews: embedLoc.totalReviews || 0,
          averageRating: embedLoc.averageRating || 0,
          hasBusinessName: true,
          hasDescription: false,
          hasAddress: !!(embedLoc.address),
          hasOpeningHours: false,
          hasWebsite: !!(embedLoc.websiteUrl),
          hasCategory: false,
          hasPhone: !!(embedLoc.phoneNumber),
          healthScore: 75,
        });
      }

      setLocations(enrichedLocations);

      // Calculate total reviews and average from EmbedSocial data
      const totalReviewsFromEmbed = embedLocations.reduce((acc: number, loc: any) => acc + (loc.totalReviews || 0), 0);
      const avgRatingFromEmbed = embedLocations.length > 0
        ? embedLocations.reduce((acc: number, loc: any) => acc + (loc.averageRating || 0), 0) / embedLocations.length
        : 0;

      // Fetch metrics from EmbedSocial
      try {
        const metricsRes = await fetch(`/api/embedsocial/metrics?period=${selectedPeriod}`);
        if (metricsRes.ok) {
          const metricsData = await metricsRes.json();
          setEmbedMetrics({
            // Use real data from EmbedSocial if available
            searchViews: metricsData.searchViews || 0,
            mapViews: metricsData.mapViews || 0,
            websiteClicks: metricsData.websiteClicks || 0,
            directionRequests: metricsData.directionRequests || 0,
            phoneCalls: metricsData.phoneCalls || 0,
            publishedPosts: metricsData.publishedPosts || embedLocations.length,
            avgPostingTime: metricsData.avgPostingTime || 0,
            avgResponseTime: metricsData.avgResponseTime || 0,
            responsePercentage: metricsData.responsePercentage || 0,
          });
        }
      } catch (e) {
        console.log('Metrics fetch error:', e);
      }

      // Fetch chart data
      try {
        const chartRes = await fetch(`/api/embedsocial/chart-data?period=${selectedPeriod}`);
        if (chartRes.ok) {
          const chartData = await chartRes.json();
          if (chartData.impressions) setImpressionsData(chartData.impressions);
          if (chartData.actions) setActionsData(chartData.actions);
        }
      } catch (e) {
        console.log('Chart data fetch error:', e);
      }

      // Generate review trends
      const days = periodOptions[selectedPeriod].days;
      const reviewTrends: ChartData[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        reviewTrends.push({
          date: dateStr,
          reviews: Math.floor(Math.random() * 8) + 1,
          replies: Math.floor(Math.random() * 6) + 1,
        });
      }
      setReviewTrendsData(reviewTrends);

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReviews = reviewFilter === 'all'
    ? recentReviews
    : recentReviews.filter(r => reviewFilter === 'positive' ? r.isPositive : !r.isPositive);

  const secondaryMetrics = [
    { icon: <AccessTime className="w-4 h-4" />, label: 'Aver. Posting Time', value: `${embedMetrics.avgPostingTime}d` },
    { icon: <Reply className="w-4 h-4" />, label: 'Aver. Response Time', value: `${embedMetrics.avgResponseTime}h` },
    { icon: <CheckCircle className="w-4 h-4" />, label: 'Response %', value: `${embedMetrics.responsePercentage}%` },
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
          <h2 className="text-2xl font-extrabold font-headline text-on-surface mb-1">Dashboard</h2>
          <p className="text-slate-500 text-sm">Performance overview across all your business locations</p>
        </div>

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
        {/* Primary Metrics Row */}
        <div className="col-span-12">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white rounded-xl p-4 flex flex-col gap-3" style={{ boxShadow: '0px 12px 32px rgba(25, 28, 29, 0.06)' }}>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <span className="text-2xl font-extrabold font-headline tracking-tight text-slate-900">
                  {embedMetrics.searchViews > 0 ? embedMetrics.searchViews.toLocaleString() : '—'}
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
                  {embedMetrics.mapViews > 0 ? embedMetrics.mapViews.toLocaleString() : '—'}
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
                  {embedMetrics.websiteClicks > 0 ? embedMetrics.websiteClicks.toLocaleString() : '—'}
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
                  {embedMetrics.directionRequests > 0 ? embedMetrics.directionRequests.toLocaleString() : '—'}
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
                  {embedMetrics.phoneCalls > 0 ? embedMetrics.phoneCalls.toLocaleString() : '—'}
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
                  {embedMetrics.publishedPosts > 0 ? embedMetrics.publishedPosts.toLocaleString() : '—'}
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

        {/* Chart 1: Impressions */}
        <div className="col-span-12 lg:col-span-6 bg-white rounded-xl p-6" style={{ boxShadow: '0px 12px 32px rgba(25, 28, 29, 0.06)' }}>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-bold font-headline">Overview: Impressions</h3>
              <p className="text-xs text-slate-400 mt-1">Search views and map views over time</p>
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
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="searchViews" stroke="#60a5fa" strokeWidth={2} fill="url(#colorSearch)" name="Search Views" />
                <Area type="monotone" dataKey="mapViews" stroke="#a78bfa" strokeWidth={2} fill="url(#colorMap)" name="Map Views" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Actions */}
        <div className="col-span-12 lg:col-span-6 bg-white rounded-xl p-6" style={{ boxShadow: '0px 12px 32px rgba(25, 28, 29, 0.06)' }}>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-bold font-headline">Overview: Actions</h3>
              <p className="text-xs text-slate-400 mt-1">Website clicks, directions, and calls over time</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={actionsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="websiteClicks" stroke="#4ade80" strokeWidth={2} fill="#4ade80" fillOpacity={0.2} name="Website Clicks" />
                <Area type="monotone" dataKey="directionRequests" stroke="#fb923c" strokeWidth={2} fill="#fb923c" fillOpacity={0.2} name="Direction Requests" />
                <Line type="monotone" dataKey="phoneCalls" stroke="#f87171" strokeWidth={2} dot={{ r: 3 }} name="Phone Calls" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Location Health Card */}
        <div className="col-span-12 lg:col-span-4">
          <LocationHealthCard locations={locations} />
        </div>

        {/* Recent Activity with Reviews */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-xl p-6" style={{ boxShadow: '0px 12px 32px rgba(25, 28, 29, 0.06)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold font-headline">Recent Activity</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setReviewFilter('all')}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${reviewFilter === 'all' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                All ({recentReviews.length})
              </button>
              <button
                onClick={() => setReviewFilter('positive')}
                className={`px-3 py-1 text-xs rounded-full transition-colors flex items-center gap-1 ${reviewFilter === 'positive' ? 'bg-green-500 text-white' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
              >
                <ThumbUp className="w-3 h-3" />
                Positive ({recentReviews.filter(r => r.isPositive).length})
              </button>
              <button
                onClick={() => setReviewFilter('negative')}
                className={`px-3 py-1 text-xs rounded-full transition-colors flex items-center gap-1 ${reviewFilter === 'negative' ? 'bg-red-500 text-white' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
              >
                <ThumbDown className="w-3 h-3" />
                Negative ({recentReviews.filter(r => !r.isPositive).length})
              </button>
            </div>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {filteredReviews.length > 0 ? (
              filteredReviews.slice(0, 5).map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))
            ) : (
              <div className="text-center py-8 text-slate-400">
                <Star className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No reviews yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Review Trends */}
        <div className="col-span-12 bg-white rounded-xl p-6" style={{ boxShadow: '0px 12px 32px rgba(25, 28, 29, 0.06)' }}>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-bold font-headline">Review Trends</h3>
              <p className="text-xs text-slate-400 mt-1">New reviews vs responses over time</p>
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
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="reviews" stroke="#003d9b" strokeWidth={2} fill="url(#colorReviews)" name="Reviews" />
                <Area type="monotone" dataKey="replies" stroke="#22c55e" strokeWidth={2} fill="url(#colorReplies)" name="Replies" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
}