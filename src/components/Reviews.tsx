import React, { useState, useEffect } from 'react';
import {
  Search,
  AllInbox,
  PendingActions,
  DoneAll,
  SmartToy,
  Analytics,
  Sort,
  LocationOn,
  Share,
  MoreVert,
  AutoAwesome,
  Send,
  Star,
  Sync,
  CheckCircle,
  Bolt,
} from '@mui/icons-material';
import { useLanguage } from '../contexts/LanguageContext';
import { apiGet, apiPost } from '../utils/api';
import { addActivityLog } from './EditsLog';
import { Automations } from './Automations';

interface ReviewsProps {
  setActiveTab?: (tab: string) => void;
}

interface Review {
  id: string;
  reviewerName?: string;
  reviewerPhotoUrl?: string;
  authorName?: string;
  authorPhotoUrl?: string;
  rating?: number;
  author?: string;
  location?: string;
  sourceName?: string;
  captionText?: string;
  text?: string;
  message?: string;
  sourceId?: string;
  originalCreatedOn?: string;
  createdAt?: string;
  date?: string;
  replies?: any[];
  replied?: boolean;
  hasReply?: boolean;
  replyText?: string;
}

interface ReviewFilters {
  all: number;
  waiting: number;
  replied: number;
  ai: number;
}

type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest';

interface AIReplyOptions {
  professional: string;
  friendly: string;
  empathetic: string;
}

export function Reviews({ setActiveTab }: ReviewsProps) {
  const { t } = useLanguage();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [filters, setFilters] = useState<ReviewFilters>({ all: 0, waiting: 0, replied: 0, ai: 0 });
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [replyText, setReplyText] = useState('');
  const [aiReplyOptions, setAiReplyOptions] = useState<AIReplyOptions | null>(null);
  const [selectedTone, setSelectedTone] = useState<'professional' | 'friendly' | 'empathetic' | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showLocationMenu, setShowLocationMenu] = useState(false);
  const [reviewsSubTab, setReviewsSubTab] = useState<'reviews' | 'automations'>('reviews');

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const locationsRes = await apiGet('/api/embedsocial/locations');
      if (locationsRes.ok) {
        const locationsData = await locationsRes.json();
        const locs = Array.isArray(locationsData) ? locationsData : (locationsData.data || []);
        setLocations(locs.map((l: any) => ({ id: l.id, name: l.name })));
      }

      const res = await apiGet('/api/embedsocial/reviews');
      if (res.ok) {
        const data = await res.json();
        const embedReviews = Array.isArray(data) ? data : [];
        setReviews(embedReviews);
        setFilters({
          all: embedReviews.length,
          waiting: embedReviews.filter((r: any) => !r.replies?.length).length,
          replied: embedReviews.filter((r: any) => r.replies?.length > 0).length,
          ai: 0,
        });
        if (embedReviews.length > 0 && !selectedReview) {
          setSelectedReview(embedReviews[0]);
        }
      } else {
        const data = await res.json().catch(() => ({}));
        setSyncMessage({ type: 'error', text: data.error || 'Failed to load reviews.' });
      }
    } catch (error: any) {
      console.error('Failed to fetch reviews:', error);
      setSyncMessage({ type: 'error', text: 'Failed to load reviews. Please check your connection.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); }, []);

  const handleSyncReviews = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await apiGet('/api/embedsocial/reviews');
      const data = await res.json();
      if (res.ok) {
        const embedReviews = Array.isArray(data) ? data : [];
        setReviews(embedReviews);
        setFilters({
          all: embedReviews.length,
          waiting: embedReviews.filter((r: any) => !r.replies?.length).length,
          replied: embedReviews.filter((r: any) => r.replies?.length > 0).length,
          ai: 0,
        });
        setSyncMessage({ type: 'success', text: `Synced ${embedReviews.length} reviews successfully!` });
      } else {
        setSyncMessage({ type: 'error', text: (data && data.error) || 'Failed to sync reviews' });
      }
    } catch {
      setSyncMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSyncing(false);
    }
  };

  const generateAIReply = async () => {
    if (!selectedReview) return;
    setGenerating(true);
    setAiReplyOptions(null);
    setSelectedTone(null);
    try {
      const res = await apiPost('/api/reviews/generate-reply', {
        reviewId: selectedReview.id,
        reviewerName: selectedReview.reviewerName || selectedReview.authorName,
        rating: selectedReview.rating,
        comment: selectedReview.captionText || selectedReview.text || selectedReview.message,
        businessName: selectedReview.sourceName || selectedReview.location,
      });
      if (res.ok) {
        const data = await res.json();
        if (data.replies) {
          setAiReplyOptions(data.replies);
          setSelectedTone('professional');
          setReplyText(data.replies.professional);
        } else if (data.error) {
          alert('Failed to generate reply: ' + data.error);
        }
      } else {
        const data = await res.json();
        alert('Failed to generate reply: ' + (data.error || 'Unknown error'));
      }
    } catch (error: any) {
      alert('Network error. Please try again: ' + (error.message || 'Unknown error'));
    } finally {
      setGenerating(false);
    }
  };

  const sendReply = async () => {
    if (!selectedReview || !replyText.trim()) return;
    setSending(true);
    try {
      const res = await apiPost(`/api/reviews/${selectedReview.id}/reply`, { replyText });
      if (res.ok) {
        const updatedReviews = reviews.map(r =>
          r.id === selectedReview.id ? { ...r, replied: true, replyText } : r
        );
        setReviews(updatedReviews);
        setSelectedReview({ ...selectedReview, replied: true, replyText });
        setReplyText('');
        setFilters(prev => ({
          ...prev,
          waiting: prev.waiting - 1,
          replied: prev.replied + 1,
        }));
        setSyncMessage({ type: 'success', text: `Reply sent successfully!` });
        setTimeout(() => setSyncMessage(null), 4000);
        addActivityLog({
          action: 'reply',
          entity: 'Review',
          entityId: selectedReview.id,
          details: `Replied to review by ${selectedReview.reviewerName || selectedReview.authorName || 'a customer'}`,
          status: 'completed',
        });
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to send reply. Please try again.');
      }
    } catch (error: any) {
      alert('Network error. Please try again: ' + (error?.message || 'Unknown error'));
    } finally {
      setSending(false);
    }
  };

  const filterCategories = [
    { id: 'all', label: 'All reviews', icon: AllInbox, count: filters.all },
    { id: 'waiting', label: 'Waiting for reply', icon: PendingActions, count: filters.waiting, highlight: true },
    { id: 'replied', label: 'Replied', icon: DoneAll, count: filters.replied },
    { id: 'ai', label: 'AI replies', icon: SmartToy, count: filters.ai },
  ];

  const reviewsNavItems = [
    { id: 'reviews', label: 'Reviews', icon: AllInbox },
    { id: 'automations', label: 'Automations', icon: Bolt, badge: 'NEW' },
  ];

  const filteredAndSortedReviews = (reviews || [])
    .filter(r => {
      if (activeFilter === 'waiting') return !r.replied && !(r.replies && r.replies.length > 0);
      if (activeFilter === 'replied') return r.replied || (r.replies && r.replies.length > 0);
      return true;
    })
    .filter(r => {
      if (selectedLocation !== 'all') return r.sourceId === selectedLocation || r.location === selectedLocation;
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.originalCreatedOn || a.createdAt || a.date || 0).getTime();
      const dateB = new Date(b.originalCreatedOn || b.createdAt || b.date || 0).getTime();
      const ratingA = a.rating || 0;
      const ratingB = b.rating || 0;
      switch (sortBy) {
        case 'newest': return dateB - dateA;
        case 'oldest': return dateA - dateB;
        case 'highest': return ratingB - ratingA;
        case 'lowest': return ratingA - ratingB;
        default: return dateB - dateA;
      }
    });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-500">Loading reviews...</p>
      </div>
    );
  }

  return (
    <>
      {reviewsSubTab === 'automations' ? (
        <Automations />
      ) : (
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="px-4 md:px-6 py-3 md:py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg md:text-xl font-bold">Reviews</h2>
              <span className="text-xs text-slate-400 hidden sm:inline">{filters.all} total</span>
            </div>
            <button
              onClick={handleSyncReviews}
              disabled={syncing}
              className="flex items-center gap-1.5 bg-primary text-white px-3 py-2 md:px-5 md:py-2.5 rounded-full font-bold text-xs md:text-sm hover:bg-primary/90 transition-all disabled:opacity-50 shrink-0"
            >
              <Sync className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{syncing ? 'Syncing...' : 'Sync Reviews'}</span>
              <span className="sm:hidden">{syncing ? 'Syncing' : 'Sync'}</span>
            </button>
          </div>

          {/* Sync Message */}
          {syncMessage && (
            <div className={`mx-4 mt-3 md:mx-6 md:mt-4 px-4 py-3 rounded-xl text-sm font-medium shrink-0 ${
              syncMessage.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {syncMessage.text}
            </div>
          )}

          {/* Mobile: Filter Tabs + Controls */}
          <div className="md:hidden shrink-0 bg-white border-b border-slate-100 relative z-10">
            <div className="flex overflow-x-auto px-4 pt-3 gap-2 scrollbar-hide">
              {reviewsNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = reviewsSubTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setReviewsSubTab(item.id as 'reviews' | 'automations')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                      isActive ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="text-[9px] px-1 py-0.5 rounded-full bg-orange-500 text-white font-bold">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Only show filters when in reviews tab */}
            {reviewsSubTab === 'reviews' && (
              <>
                <div className="flex overflow-x-auto px-4 pt-2 gap-2 scrollbar-hide">
                  {filterCategories.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = activeFilter === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setActiveFilter(cat.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                          isActive ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{cat.count}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2 px-4 pb-3 pt-2">
                  <div className="relative flex-1 min-w-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border-none rounded-full text-xs"
                      placeholder="Search..."
                    />
                  </div>
                  <button
                    onClick={() => { setShowSortMenu(!showSortMenu); setShowLocationMenu(false); }}
                    className="flex items-center gap-1 px-3 py-2 bg-slate-50 text-xs font-semibold rounded-full"
                  >
                    <Sort className="w-3.5 h-3.5" /> Sort
                  </button>
                  <button
                    onClick={() => { setShowLocationMenu(!showLocationMenu); setShowSortMenu(false); }}
                    className="flex items-center gap-1 px-3 py-2 bg-slate-50 text-xs font-semibold rounded-full"
                  >
                    <LocationOn className="w-3.5 h-3.5" />
                  </button>
                </div>
                {/* Dropdowns */}
                {showSortMenu && (
                  <div className="absolute left-4 right-4 z-50 bg-white rounded-lg shadow-lg border border-slate-200 py-1 min-w-0">
                    {[{ id: 'newest', label: 'Newest first' }, { id: 'oldest', label: 'Oldest first' }, { id: 'highest', label: 'Highest rating' }, { id: 'lowest', label: 'Lowest rating' }].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => { setSortBy(opt.id as SortOption); setShowSortMenu(false); }}
                        className={`w-full text-left px-4 py-2.5 text-xs ${sortBy === opt.id ? 'text-primary font-bold' : 'text-slate-600'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
                {showLocationMenu && (
                  <div className="absolute left-4 right-4 z-50 bg-white rounded-lg shadow-lg border border-slate-200 py-1 min-w-0">
                    <button onClick={() => { setSelectedLocation('all'); setShowLocationMenu(false); }} className={`w-full text-left px-4 py-2.5 text-xs ${selectedLocation === 'all' ? 'text-primary font-bold' : 'text-slate-600'}`}>
                      All Locations
                    </button>
                    {locations.map(loc => (
                      <button key={loc.id} onClick={() => { setSelectedLocation(loc.id); setShowLocationMenu(false); }} className={`w-full text-left px-4 py-2.5 text-xs truncate ${selectedLocation === loc.id ? 'text-primary font-bold' : 'text-slate-600'}`}>
                        {loc.name}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Desktop: Left Pane */}
            <aside className="hidden md:flex w-64 bg-slate-50 p-6 flex-col gap-1 overflow-y-auto shrink-0">
              {/* Sub Navigation */}
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-3">Navigation</h3>
              {reviewsNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = reviewsSubTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setReviewsSubTab(item.id as 'reviews' | 'automations')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                      isActive ? 'bg-white text-primary font-semibold shadow-sm' : 'text-slate-500 hover:bg-white/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                      <span className="text-sm">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                        isActive ? 'bg-primary/20 text-primary' : 'bg-orange-100 text-orange-600'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Only show filters when in reviews tab */}
              {reviewsSubTab === 'reviews' && (
                <>
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-3 mt-6">Filter Views</h3>
                  {filterCategories.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = activeFilter === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setActiveFilter(cat.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                          isActive ? 'bg-white text-primary font-semibold shadow-sm' : 'text-slate-500 hover:bg-white/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                          <span className="text-sm">{cat.label}</span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          isActive ? 'bg-primary/10 text-primary font-bold' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {cat.count}
                        </span>
                      </button>
                    );
                  })}
                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-500 hover:bg-white/50 rounded-xl transition-all">
                      <Analytics className="w-5 h-5" />
                      <span className="text-sm">Analytics</span>
                    </button>
                  </div>
                </>
              )}
            </aside>

            {/* Review List Pane */}
            <section className="flex-1 min-w-0 bg-white flex flex-col border-x border-slate-100 overflow-hidden">
              {/* Desktop: search + sort */}
              <div className="hidden md:flex p-6 bg-white/80 backdrop-blur-sm sticky top-0 z-10 border-b border-slate-100 flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-headline text-xl font-bold">All reviews</h2>
                  <div className="flex gap-2 relative">
                    <div className="relative">
                      <button
                        onClick={() => { setShowSortMenu(!showSortMenu); setShowLocationMenu(false); }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-white text-xs font-semibold rounded-full shadow-sm hover:bg-slate-50 transition-colors"
                      >
                        <Sort className="w-4 h-4" /> Sort
                      </button>
                      {showSortMenu && (
                        <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50 min-w-[120px]">
                          {[{ id: 'newest', label: 'Newest first' }, { id: 'oldest', label: 'Oldest first' }, { id: 'highest', label: 'Highest rating' }, { id: 'lowest', label: 'Lowest rating' }].map(opt => (
                            <button key={opt.id} onClick={() => { setSortBy(opt.id as SortOption); setShowSortMenu(false); }} className={`w-full text-left px-4 py-2 text-xs hover:bg-slate-50 ${sortBy === opt.id ? 'text-primary font-bold' : 'text-slate-600'}`}>
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => { setShowLocationMenu(!showLocationMenu); setShowSortMenu(false); }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-white text-xs font-semibold rounded-full shadow-sm hover:bg-slate-50 transition-colors"
                      >
                        <LocationOn className="w-4 h-4" /> Location
                      </button>
                      {showLocationMenu && (
                        <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50 min-w-[160px]">
                          <button onClick={() => { setSelectedLocation('all'); setShowLocationMenu(false); }} className={`w-full text-left px-4 py-2 text-xs hover:bg-slate-50 ${selectedLocation === 'all' ? 'text-primary font-bold' : 'text-slate-600'}`}>All Locations</button>
                          {locations.map(loc => (
                            <button key={loc.id} onClick={() => { setSelectedLocation(loc.id); setShowLocationMenu(false); }} className={`w-full text-left px-4 py-2 text-xs hover:bg-slate-50 ${selectedLocation === loc.id ? 'text-primary font-bold' : 'text-slate-600'}`}>{loc.name}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-full text-sm focus:ring-2 focus:ring-primary/20" placeholder="Search across all reviews..." />
                </div>
              </div>

              {/* Review Cards */}
              <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-3 pb-8">
                {filteredAndSortedReviews.length > 0 ? filteredAndSortedReviews.map((review) => (
                  <div
                    key={review.id}
                    onClick={() => { setSelectedReview(review); setAiReplyOptions(null); setSelectedTone(null); setReplyText(''); }}
                    className={`p-4 rounded-xl cursor-pointer transition-all ${
                      selectedReview?.id === review.id ? 'bg-primary text-white shadow-lg' : 'bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        {review.reviewerPhotoUrl || review.authorPhotoUrl ? (
                          <img src={review.reviewerPhotoUrl || review.authorPhotoUrl} alt="" className={`w-10 h-10 rounded-full border-2 object-cover ${selectedReview?.id === review.id ? 'border-white/20' : 'border-slate-200'}`} />
                        ) : (
                          <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm ${selectedReview?.id === review.id ? 'border-white/20 bg-white/20' : 'border-slate-200 bg-slate-200'}`}>
                            {(review.reviewerName || review.authorName || 'A').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h4 className="text-sm font-bold leading-tight">{review.reviewerName || review.authorName}</h4>
                          <div className="flex text-amber-400">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`w-3 h-3 ${i < (review.rating || 0) ? 'text-amber-400' : 'text-slate-300'} ${selectedReview?.id === review.id ? 'text-white' : ''}`} style={{ fontVariationSettings: "'FILL' 1" }} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className={`text-[10px] ${selectedReview?.id === review.id ? 'text-white/70' : 'text-slate-400'}`}>
                        {review.originalCreatedOn || review.createdAt || review.date}
                      </span>
                    </div>
                    <p className={`text-xs line-clamp-2 ${selectedReview?.id === review.id ? 'text-white/90' : 'text-slate-500'}`}>
                      {review.captionText || review.text || review.message}
                    </p>
                  </div>
                )) : (
                  <div className="py-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                      <AllInbox className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500">No reviews found</p>
                  </div>
                )}
              </div>
            </section>

            {/* Right Pane: Review Detail */}
            {selectedReview && (
              <section className="w-full max-w-2xl bg-white flex flex-col shadow-2xl z-20 overflow-hidden">
                {/* Mobile back bar */}
                <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-white shrink-0">
                  <button onClick={() => setSelectedReview(null)} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
                  </button>
                  <span className="text-sm font-semibold text-slate-500">Back</span>
                  <span className="ml-auto text-xs text-slate-400 truncate max-w-[120px]">{selectedReview.reviewerName || selectedReview.authorName}</span>
                </div>

                <div className="p-5 md:p-8 overflow-y-auto flex-1">
                  <header className="flex justify-between items-start mb-5 md:mb-8">
                    <div className="flex items-center gap-3 md:gap-5">
                      {selectedReview.reviewerPhotoUrl || selectedReview.authorPhotoUrl ? (
                        <img src={selectedReview.reviewerPhotoUrl || selectedReview.authorPhotoUrl} alt="" className="w-12 h-12 md:w-16 md:h-16 rounded-full border-4 border-slate-100 object-cover shrink-0" />
                      ) : (
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full border-4 border-slate-100 bg-slate-200 flex items-center justify-center text-lg md:text-2xl font-bold shrink-0">
                          {(selectedReview.reviewerName || selectedReview.authorName || 'A').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h2 className="text-base md:text-2xl font-extrabold font-headline truncate max-w-[120px] md:max-w-none">{selectedReview.reviewerName || selectedReview.authorName}</h2>
                        <div className="flex flex-wrap items-center gap-1 text-[11px] md:text-sm text-slate-400 mt-0.5 md:mt-1">
                          <div className="flex text-amber-400">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`w-3.5 md:w-4 h-3.5 md:h-4 ${i < (selectedReview.rating || 0) ? 'text-amber-400' : 'text-slate-300'}`} style={{ fontVariationSettings: "'FILL' 1" }} />
                            ))}
                          </div>
                          <span>•</span>
                          <span className="truncate max-w-[70px] md:max-w-none">{selectedReview.originalCreatedOn || selectedReview.createdAt || selectedReview.date}</span>
                          <span className="hidden sm:inline">•</span>
                          <span className="hidden sm:inline flex items-center gap-1 truncate max-w-[120px]">
                            <LocationOn className="w-3 h-3 shrink-0" />{selectedReview.sourceName || selectedReview.location}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 ml-2 shrink-0">
                      <button className="p-1.5 md:p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                        <Share className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 md:p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                        <MoreVert className="w-4 h-4" />
                      </button>
                    </div>
                  </header>

                  <article className="mb-5 md:mb-8">
                    <p className="text-sm md:text-base leading-relaxed text-slate-700">
                      {selectedReview.captionText || selectedReview.text || selectedReview.message}
                    </p>
                  </article>

                  {(selectedReview.replyText || selectedReview.replies?.length) && (
                    <div className="bg-slate-50 rounded-2xl p-4 md:p-6 mb-5 md:mb-8 border-l-4 border-primary">
                      <h4 className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-primary mb-3">Your Reply</h4>
                      <p className="text-xs md:text-sm text-slate-700">
                        {selectedReview.replyText || (typeof selectedReview.replies?.[0] === 'string' ? selectedReview.replies?.[0] : selectedReview.replies?.[0]?.text)}
                      </p>
                    </div>
                  )}

                  <div className="bg-slate-50 rounded-2xl p-4 md:p-6 mb-5 md:mb-8 border-l-4 border-primary">
                    <h4 className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-primary mb-3">Customer Context</h4>
                    <div className="grid grid-cols-3 gap-3 md:gap-6">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Rating</p>
                        <p className="text-sm font-bold text-slate-900">{(selectedReview.rating || 0)}/5</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Reviews</p>
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {reviews.filter(r => (r.authorName || r.author) === (selectedReview.authorName || selectedReview.author)).length} published
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Status</p>
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {(selectedReview.replied || selectedReview.hasReply || selectedReview.replies?.length) ? 'Replied' : 'Pending'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reply Footer */}
                <footer className="p-4 md:p-8 bg-white border-t border-slate-100 shrink-0">
                  <div className="mb-3 md:mb-4 flex items-center justify-between gap-2">
                    <label className="text-xs md:text-sm font-bold text-slate-900">Write your reply</label>
                    <button
                      onClick={generateAIReply}
                      disabled={generating}
                      className="flex items-center gap-1 px-3 py-1.5 md:px-4 md:py-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-all text-xs md:text-sm font-bold disabled:opacity-50 shrink-0"
                    >
                      <AutoAwesome className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      {generating ? 'Generating...' : 'AI reply'}
                    </button>
                  </div>

                  {aiReplyOptions && (
                    <div className="mb-3 md:mb-4 space-y-2">
                      <p className="text-xs font-semibold text-slate-500 mb-2">Choose tone:</p>
                      {[
                        { key: 'professional' as const, label: 'Professional', icon: '👔', desc: 'Formal' },
                        { key: 'friendly' as const, label: 'Friendly', icon: '😊', desc: 'Warm' },
                        { key: 'empathetic' as const, label: 'Empathetic', icon: '💙', desc: 'Caring' },
                      ].map((tone) => {
                        const isSelected = selectedTone === tone.key;
                        const replyContent = aiReplyOptions[tone.key];
                        return (
                          <button
                            key={tone.key}
                            onClick={() => { setSelectedTone(tone.key); setReplyText(replyContent); }}
                            className={`w-full p-3 rounded-xl border-2 transition-all text-left ${isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white'}`}
                          >
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-base">{tone.icon}</span>
                              <span className={`font-bold text-xs md:text-sm ${isSelected ? 'text-primary' : 'text-slate-700'}`}>{tone.label}</span>
                              <span className="text-[10px] md:text-xs text-slate-400">{tone.desc}</span>
                              {isSelected && <CheckCircle className="w-4 h-4 text-primary ml-auto shrink-0" />}
                            </div>
                            <p className={`text-[10px] md:text-xs line-clamp-2 pl-6 ${isSelected ? 'text-primary/80' : 'text-slate-500'}`}>
                              "{replyContent}"
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <textarea
                    className="w-full min-h-[100px] md:min-h-[120px] bg-slate-50 border-2 border-transparent rounded-2xl p-3 md:p-4 text-xs md:text-sm focus:ring-2 focus:ring-primary focus:bg-white transition-all resize-none"
                    placeholder={`Reply to ${selectedReview.reviewerName || selectedReview.authorName}...`}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <div className="mt-3 md:mt-4 flex items-center justify-end gap-2 md:gap-3">
                    <button onClick={() => { setReplyText(''); setAiReplyOptions(null); setSelectedTone(null); }} className="px-4 md:px-5 py-2 text-xs md:text-sm font-bold text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                      Discard
                    </button>
                    <button
                      onClick={sendReply}
                      disabled={!replyText.trim() || sending}
                      className="px-6 md:px-8 py-2 bg-primary text-white text-xs md:text-sm font-bold rounded-full shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sending ? 'Sending...' : 'Send'}
                      {!sending && <Send className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                    </button>
                  </div>
                </footer>
              </section>
            )}

            {!selectedReview && (
              <section className="hidden md:flex w-full max-w-2xl bg-white flex-col items-center justify-center text-center p-8 shrink-0">
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <Star className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Select a Review</h3>
                <p className="text-slate-500 text-sm">Click on a review from the list to view details.</p>
              </section>
            )}
          </div>
        </div>
      )}
    </>
  );
}
