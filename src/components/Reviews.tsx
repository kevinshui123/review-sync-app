import React, { useState, useEffect } from 'react';
import {
  Search,
  Notifications,
  History,
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
} from '@mui/icons-material';
import { motion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';

interface Review {
  id: string;
  author: string;
  rating: number;
  location: string;
  date: string;
  text: string;
  replied: boolean;
  hasReply: boolean;
  replyText?: string;
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
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch('/api/reviews');
        if (res.ok) {
          const data = await res.json();
          setReviews(data.reviews || []);
          setFilters(data.filters || { all: 0, waiting: 0, replied: 0, ai: 0 });
          if (data.reviews?.length > 0) {
            setSelectedReview(data.reviews[0]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

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
        setReplyText(data.reply);
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
        body: JSON.stringify({ reply: replyText }),
      });
      if (res.ok) {
        setReviews(reviews.map(r =>
          r.id === selectedReview.id ? { ...r, replied: true, replyText } : r
        ));
        setSelectedReview({ ...selectedReview, replied: true, replyText });
        setReplyText('');
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
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
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
                    {review.author.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold leading-tight">{review.author}</h4>
                    <div className="flex text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${i < review.rating ? 'text-amber-400' : 'text-slate-300'} ${
                            selectedReview?.id === review.id ? 'text-white' : ''
                          }`}
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <span className={`text-[10px] ${selectedReview?.id === review.id ? 'text-white/70' : 'text-slate-400'}`}>
                  {review.date}
                </span>
              </div>
              <p className={`text-xs line-clamp-2 ${selectedReview?.id === review.id ? 'text-white/90' : 'text-slate-500'}`}>
                {review.text}
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
                  {selectedReview.author.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold font-headline">{selectedReview.author}</h2>
                  <div className="flex items-center gap-3 text-sm text-slate-400 mt-1">
                    <div className="flex text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < selectedReview.rating ? 'text-amber-400' : 'text-slate-300'}`}
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        />
                      ))}
                    </div>
                    <span>•</span>
                    <span>{selectedReview.date}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <LocationOn className="w-3 h-3" /> {selectedReview.location}
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
                {selectedReview.text}
              </p>
            </article>

            {/* Existing Reply */}
            {selectedReview.replyText && (
              <div className="bg-slate-50 rounded-2xl p-6 mb-8 border-l-4 border-primary">
                <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Your Reply</h4>
                <p className="text-sm text-slate-700">{selectedReview.replyText}</p>
              </div>
            )}

            {/* Customer Context */}
            <div className="bg-slate-50 rounded-2xl p-6 mb-8 border-l-4 border-primary">
              <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Customer Context</h4>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Member since</p>
                  <p className="text-sm font-bold text-slate-900">Oct 2023</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Reviews</p>
                  <p className="text-sm font-bold text-slate-900">{reviews.filter(r => r.author === selectedReview.author).length} published</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Status</p>
                  <p className="text-sm font-bold text-slate-900">{selectedReview.replied ? 'Replied' : 'Pending'}</p>
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
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-fixed text-primary px-4 py-2 rounded-full hover:bg-primary-fixed-dim transition-all text-sm font-bold"
              >
                <AutoAwesome className="w-4 h-4" />
                {generating ? 'Generating...' : 'Generate AI reply'}
              </button>
            </div>
            <div className="relative">
              <textarea
                className="w-full min-h-[120px] bg-slate-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary focus:bg-white transition-all resize-none"
                placeholder={`Type your response to ${selectedReview.author}...`}
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
    </div>
  );
}
