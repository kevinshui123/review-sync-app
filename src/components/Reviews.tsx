import React, { useState, useEffect } from 'react';
import { Send, Star, MapPin, Sparkles, RefreshCw, Loader2, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';

interface Location {
  id: string;
  name: string;
  address: string;
}

interface Review {
  id: string;
  locationId: string;
  googleReviewId: string;
  reviewerName: string;
  rating: number;
  comment: string | null;
  replyText: string | null;
  isRepliedByAI: boolean;
  createdAt: string;
  location: Location;
}

export function Reviews() {
  const { t } = useLanguage();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isGeneratingReply, setIsGeneratingReply] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/reviews');
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
        if (data.length > 0 && !selectedReviewId) {
          setSelectedReviewId(data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncReviews = async () => {
    try {
      setIsSyncing(true);
      setSyncError(null);
      const res = await fetch('/api/reviews/sync', { method: 'POST' });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to sync reviews');
      }
      
      if (data.message) {
        alert(data.message);
      }
      
      await fetchReviews();
    } catch (error) {
      console.error('Sync error:', error);
      setSyncError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleGenerateReply = async (reviewId: string) => {
    try {
      setIsGeneratingReply(true);
      const res = await fetch('/api/reviews/generate-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId })
      });

      if (!res.ok) {
        throw new Error('Failed to generate reply');
      }

      const data = await res.json();
      setReplyText(data.replyText || '');
    } catch (error) {
      console.error('Generate reply error:', error);
      alert('Failed to generate AI reply. Please try again.');
    } finally {
      setIsGeneratingReply(false);
    }
  };

  const handleSubmitReply = async (reviewId: string) => {
    if (!replyText.trim()) return;
    
    try {
      setIsSubmittingReply(true);
      const res = await fetch(`/api/reviews/${reviewId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replyText, isRepliedByAI: true })
      });
      
      if (res.ok) {
        // Update local state
        setReviews(reviews.map(r => r.id === reviewId ? { ...r, replyText, isRepliedByAI: true } : r));
        alert('Reply submitted successfully!');
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit reply');
      }
    } catch (error) {
      console.error('Submit reply error:', error);
      alert('Failed to submit reply. Please try again.');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const selectedReview = reviews.find(r => r.id === selectedReviewId);

  // Update reply text when selected review changes
  useEffect(() => {
    if (selectedReview) {
      setReplyText(selectedReview.replyText || '');
    } else {
      setReplyText('');
    }
  }, [selectedReviewId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' 
    }).format(date);
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col h-full w-full"
    >
      {/* Page Sub-Header & Review Campaigns */}
      <div className="px-8 py-6 border-b border-outline-variant/10 flex justify-between items-end shrink-0">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-on-surface mb-1">{t('reviews.title')}</h2>
          <p className="text-on-surface-variant text-sm">{t('reviews.subtitle')}</p>
        </div>
        
        <div className="flex items-center gap-4">
          {syncError && (
            <div className="text-error text-sm font-medium bg-error/10 px-3 py-1.5 rounded-lg">
              {syncError}
            </div>
          )}
          <button 
            onClick={handleSyncReviews}
            disabled={isSyncing}
            className="bg-surface-container-highest text-on-surface hover:bg-surface-container-highest/80 transition-all px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-50"
          >
            {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {t('reviews.syncReviews')}
          </button>
        </div>
      </div>

      {/* Split-View CRM Layout */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left: Review List */}
        <section className="w-[380px] border-r border-outline-variant/5 flex flex-col shrink-0 bg-surface-container-low h-full">
          <div className="p-4 flex items-center justify-between border-b border-outline-variant/5 shrink-0">
            <span className="label-md uppercase tracking-widest text-[10px] font-bold text-secondary">
              {t('reviews.filter.all')} ({reviews.length})
            </span>
            <button 
              onClick={() => alert('Advanced filtering will be available once API is connected.')}
              className="text-primary text-xs font-medium hover:underline"
            >
              {t('reviews.filter')}
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : reviews.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant">
                <p className="text-sm">{t('reviews.noReviews')}</p>
                <p className="text-xs mt-2">{t('reviews.noReviewsDesc')}</p>
              </div>
            ) : (
              reviews.map(review => (
                <ReviewListItem 
                  key={review.id}
                  name={review.reviewerName}
                  time={getTimeAgo(review.createdAt)}
                  source="google"
                  rating={review.rating}
                  content={review.comment || t('reviews.noComment')}
                  isActive={selectedReviewId === review.id}
                  isReplied={!!review.replyText}
                  onClick={() => setSelectedReviewId(review.id)}
                />
              ))
            )}
          </div>
        </section>

        {/* Right: Review Detail */}
        <section className="flex-1 bg-surface flex flex-col overflow-y-auto h-full relative">
          {selectedReview ? (
            <div className="p-10 pb-6 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-8">
                <div className="flex gap-6 items-center">
                  <div className="w-16 h-16 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-2xl font-bold uppercase">
                    {selectedReview.reviewerName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-on-surface mb-1">{selectedReview.reviewerName}</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-outline flex items-center gap-1">
                        <MapPin className="w-4 h-4" /> {selectedReview.location.name}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-2 inline-block">
                    {t('reviews.googleVerified')}
                  </div>
                  <div className="text-sm text-outline">{t('reviews.posted')} {formatDate(selectedReview.createdAt)}</div>
                </div>
              </div>

              {/* Review Body */}
              <div className="bg-surface-container-low p-8 rounded-2xl border border-outline-variant/5 mb-10">
                <div className="flex gap-1 mb-4">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className={`w-5 h-5 ${i <= selectedReview.rating ? 'text-primary fill-current' : 'text-outline'}`} />
                  ))}
                </div>
                <p className="text-xl font-medium leading-relaxed text-on-surface italic">
                  "{selectedReview.comment || t('reviews.noComment')}"
                </p>
              </div>

              {/* Interaction Area */}
              <div className="space-y-6 flex-1 flex flex-col">
                <div className="flex justify-between items-center">
                  <h4 className="text-lg font-bold text-on-surface flex items-center gap-2">
                    {selectedReview.replyText ? (
                      <><CheckCircle2 className="w-5 h-5 text-emerald-500" /> {t('reviews.replied')}</>
                    ) : (
                      t('reviews.respondToReview')
                    )}
                  </h4>
                  
                  {!selectedReview.replyText && (
                    <button 
                      onClick={() => handleGenerateReply(selectedReview.id)}
                      disabled={isGeneratingReply}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all font-bold text-sm disabled:opacity-50"
                    >
                      {isGeneratingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      {isGeneratingReply ? 'Generating...' : t('reviews.aiReplyBtn')}
                    </button>
                  )}
                </div>
                
                <div className="relative flex-1 flex flex-col min-h-[200px]">
                  <textarea 
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    disabled={!!selectedReview.replyText || isSubmittingReply}
                    className="w-full flex-1 bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-6 text-on-surface placeholder-outline/50 focus:ring-1 focus:ring-primary/40 focus:border-primary/40 resize-none outline-none disabled:opacity-70" 
                    placeholder={t('reviews.replyPlaceholder')}
                  ></textarea>
                  
                  {!selectedReview.replyText && (
                    <div className="absolute bottom-4 right-4 flex items-center gap-4">
                      {replyText && <span className="text-xs text-outline">{t('reviews.readyToSend')}</span>}
                      <button 
                        onClick={() => handleSubmitReply(selectedReview.id)}
                        disabled={!replyText.trim() || isSubmittingReply}
                        className="px-8 py-2.5 bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold rounded-xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
                      >
                        {isSubmittingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        {t('reviews.sendReply')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-on-surface-variant">
              {reviews.length > 0 ? t('reviews.selectReview') : t('reviews.noReviewsAvailable')}
            </div>
          )}
        </section>
      </div>
    </motion.div>
  );
}

function ReviewListItem({ name, time, source, rating, content, isActive, isReplied, onClick }: any) {
  const sourceColors: any = {
    google: "bg-primary/10 text-primary",
    yelp: "bg-red-500/10 text-red-400",
    bing: "bg-blue-500/10 text-blue-400"
  };

  const sourceInitials: any = {
    google: "G",
    yelp: "Y",
    bing: "B"
  };

  return (
    <div 
      onClick={onClick}
      className={`p-5 cursor-pointer border-b border-outline-variant/5 transition-colors ${isActive ? 'bg-surface-container-highest border-l-2 border-l-primary' : 'hover:bg-surface-container'}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <span className={`${sourceColors[source]} w-6 h-6 rounded flex items-center justify-center text-xs font-bold`}>
            {sourceInitials[source]}
          </span>
          <span className="text-xs font-bold text-on-surface">{name}</span>
        </div>
        <div className="flex items-center gap-2">
          {isReplied && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
          <span className="text-[10px] text-outline">{time}</span>
        </div>
      </div>
      <div className="flex gap-0.5 mb-2">
        {[1,2,3,4,5].map(i => (
          <Star key={i} className={`w-3 h-3 ${i <= rating ? 'text-primary fill-current' : 'text-outline'}`} />
        ))}
      </div>
      <p className="text-sm text-on-surface-variant line-clamp-2 leading-relaxed italic">
        "{content}"
      </p>
    </div>
  );
}
