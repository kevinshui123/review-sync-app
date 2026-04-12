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
  Refresh,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';

interface Review {
  id: string;
  authorName?: string;
  author?: string;
  rating?: number;
  location?: string;
  captionText?: string;
  text?: string;
  sourceName?: string;
  sourceId?: string;
  originalCreatedOn?: string;
  replies?: string[];
  replied?: boolean;
  hasReply?: boolean;
  replyText?: string;
  date?: string;
}

interface ReviewFilters {
  all: number;
  waiting: number;
  replied: number;
  ai: number;
}

export function Reviews() {
  const { t } = useLanguage();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filters, setFilters] = useState<ReviewFilters>({ all: 0, waiting: 0, replied: 0, ai: 0 });
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [generating, setGenerating] = useState(false);

  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/embedsocial/reviews');
      if (res.ok) {
        const data = await res.json();
        // Reviews from EmbedSocial API
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
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleSyncReviews = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      // Trigger sync via EmbedSocial API (already handled by the fetch above)
      const res = await fetch('/api/embedsocial/reviews');
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
        setSyncMessage({ type: 'error', text: data.error || 'Failed to sync reviews' });
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
    try {
      const res = await fetch('/api/reviews/generate-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId: selectedReview.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setReplyText(data.replyText || data.reply || '');
      }
    } catch (error) {
      console.error('Failed to generate AI reply:', error);
    } finally {
      setGenerating(false);
    }
  };

  const sendReply = async () => {
    if (!selectedReview || !replyText.trim()) return;
    try {
      const res = await fetch(`/api/reviews/${selectedReview.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replyText }),
      });
      if (res.ok) {
        const updatedReviews = reviews.map(r =>
          r.id === selectedReview.id ? { ...r, replied: true, replyText } : r
        );
        setReviews(updatedReviews);
        setSelectedReview({ ...selectedReview, replied: true, replyText });
        setReplyText('');
        // Update filters
        setFilters(prev => ({
          ...prev,
          waiting: prev.waiting - 1,
          replied: prev.replied + 1,
        }));
      }
    } catch (error) {
      console.error('Failed to send reply:', error);
    }
  };

  const filterCategories = [
    { id: 'all', label: 'All reviews', icon: AllInbox, count: filters.all },
    { id: 'waiting', label: 'Waiting for reply', icon: PendingActions, count: filters.waiting, highlight: true },
    { id: 'replied', label: 'Replied', icon: DoneAll, count: filters.replied },
    { id: 'ai', label: 'AI replies', icon: SmartToy, count: filters.ai },
  ];

  const filteredReviews = reviews.filter(r => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'waiting') return !r.replied;
    if (activeFilter === 'replied') return r.replied;
    if (activeFilter === 'ai') return r.hasReply;
    return true;
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
    <div className="flex h-full overflow-hidden flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
        <div>
          <h2 className="text-xl font-bold">Reviews</h2>
          <p className="text-sm text-slate-500">{filters.all} total reviews</p>
        </div>
        <button
          onClick={handleSyncReviews}
          disabled={syncing}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-full font-bold hover:bg-primary/90 transition-all disabled:opacity-50"
        >
          <Sync className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync Reviews'}
        </button>
      </div>

      {/* Sync Message */}
      <AnimatePresence>
        {syncMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mx-6 mt-4 px-4 py-3 rounded-xl text-sm font-medium ${
              syncMessage.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {syncMessage.text}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Pane: Filter Categories */}
        <aside className="w-64 bg-slate-50 p-6 flex flex-col gap-1 overflow-y-auto">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-3">Filter Views</h3>
          {filterCategories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveFilter(cat.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                  isActive
                    ? 'bg-white text-primary font-semibold shadow-sm'
                    : 'text-slate-500 hover:bg-white/50'
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
        </aside>

        {/* Middle Pane: Review List */}
        <section className="flex-1 min-w-[380px] bg-white flex flex-col border-x border-slate-100">
          <div className="p-6 bg-white/80 backdrop-blur-sm sticky top-0 z-10 border-b border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-headline text-xl font-bold">All reviews</h2>
              <div className="flex gap-2">
                <button className="flex items-center gap-1 px-3 py-1.5 bg-white text-xs font-semibold rounded-full shadow-sm hover:bg-slate-50 transition-colors">
                  <Sort className="w-4 h-4" /> Sort
                </button>
                <button className="flex items-center gap-1 px-3 py-1.5 bg-white text-xs font-semibold rounded-full shadow-sm hover:bg-slate-50 transition-colors">
                  <LocationOn className="w-4 h-4" /> Location
                </button>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-full text-sm focus:ring-2 focus:ring-primary/20"
                placeholder="Search across all reviews..."
                type="text"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 space-y-3 pb-8">
            {filteredReviews.map((review) => (
              <div
                key={review.id}
                onClick={() => setSelectedReview(review)}
                className={`p-4 rounded-xl cursor-pointer transition-all ${
                  selectedReview?.id === review.id
                    ? 'bg-primary text-white shadow-lg scale-[1.02]'
                    : 'bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full border-2 ${
                      selectedReview?.id === review.id ? 'border-white/20' : 'border-slate-200'
                    } bg-slate-200 flex items-center justify-center font-bold text-sm`}>
                      {(review.authorName || review.author || 'A').charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold leading-tight">{review.authorName || review.author}</h4>
                      <div className="flex text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${i < (review.rating || 0) ? 'text-amber-400' : 'text-slate-300'} ${
                              selectedReview?.id === review.id ? 'text-white' : ''
                            }`}
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className={`text-[10px] ${selectedReview?.id === review.id ? 'text-white/70' : 'text-slate-400'}`}>
                    {review.originalCreatedOn || review.date}
                  </span>
                </div>
                <p className={`text-xs line-clamp-2 ${selectedReview?.id === review.id ? 'text-white/90' : 'text-slate-500'}`}>
                  {review.captionText || review.text}
                </p>
              </div>
            ))}

            {filteredReviews.length === 0 && (
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
          <section className="w-full max-w-2xl bg-white flex flex-col shadow-2xl z-20">
            <div className="p-8 overflow-y-auto flex-1">
              <header className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-full border-4 border-slate-100 bg-slate-200 flex items-center justify-center text-2xl font-bold">
                    {(selectedReview.authorName || selectedReview.author || 'A').charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold font-headline">{selectedReview.authorName || selectedReview.author}</h2>
                    <div className="flex items-center gap-3 text-sm text-slate-400 mt-1">
                      <div className="flex text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i < (selectedReview.rating || 0) ? 'text-amber-400' : 'text-slate-300'}`}
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          />
                        ))}
                      </div>
                      <span>•</span>
                      <span>{selectedReview.originalCreatedOn || selectedReview.date}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <LocationOn className="w-3 h-3" /> {selectedReview.sourceName || selectedReview.location}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                    <Share className="w-5 h-5" />
                  </button>
                  <button className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                    <MoreVert className="w-5 h-5" />
                  </button>
                </div>
              </header>

              <article className="mb-8">
                <p className="text-base leading-relaxed text-slate-700">
                  {selectedReview.captionText || selectedReview.text}
                </p>
              </article>

              {/* Existing Reply */}
              {(selectedReview.replyText || selectedReview.replies?.length) && (
                <div className="bg-slate-50 rounded-2xl p-6 mb-8 border-l-4 border-primary">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Your Reply</h4>
                  <p className="text-sm text-slate-700">{selectedReview.replyText || selectedReview.replies?.[0]}</p>
                </div>
              )}

              {/* Customer Context */}
              <div className="bg-slate-50 rounded-2xl p-6 mb-8 border-l-4 border-primary">
                <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Customer Context</h4>
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Rating</p>
                    <p className="text-sm font-bold text-slate-900">{(selectedReview.rating || 0)}/5 stars</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Reviews</p>
                    <p className="text-sm font-bold text-slate-900">{reviews.filter(r => (r.authorName || r.author) === (selectedReview.authorName || selectedReview.author)).length} published</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Status</p>
                    <p className="text-sm font-bold text-slate-900">{(selectedReview.replied || selectedReview.hasReply || selectedReview.replies?.length) ? 'Replied' : 'Pending'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Reply Section */}
            <footer className="p-8 bg-white border-t border-slate-100 shadow-[0_-8px_30px_rgb(0,0,0,0.02)]">
              <div className="mb-4 flex items-center justify-between">
                <label className="text-sm font-bold text-slate-900">Write your reply</label>
                <button
                  onClick={generateAIReply}
                  disabled={generating}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-all text-sm font-bold disabled:opacity-50"
                >
                  <AutoAwesome className="w-4 h-4" />
                  {generating ? 'Generating...' : 'Generate AI reply'}
                </button>
              </div>
              <div className="relative">
                <textarea
                  className="w-full min-h-[120px] bg-slate-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary focus:bg-white transition-all resize-none"
                  placeholder={`Type your response to ${selectedReview.authorName || selectedReview.author}...`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                />
              </div>
              <div className="mt-4 flex items-center justify-end gap-3">
                <button
                  onClick={() => setReplyText('')}
                  className="px-5 py-2.5 text-sm font-bold text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
                >
                  Discard
                </button>
                <button
                  onClick={sendReply}
                  disabled={!replyText.trim()}
                  className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-full shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send reply
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </footer>
          </section>
        )}

        {!selectedReview && (
          <section className="w-full max-w-2xl bg-white flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Star className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Select a Review</h3>
            <p className="text-slate-500">Click on a review from the list to view details and respond.</p>
          </section>
        )}
      </div>
    </div>
  );
}
