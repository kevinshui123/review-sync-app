import React, { useState, useEffect } from 'react';
import { Search, AllInbox, PendingActions, DoneAll, SmartToy, Sort, LocationOn, Share, MoreVert, AutoAwesome, Send, Star, Sync, CheckCircle } from '@mui/icons-material';
import { useLanguage } from '../contexts/LanguageContext';
import { apiGet, apiPost } from '../utils/api';
import { Automations } from './Automations';
import { PageLoader } from './PageLoader';

interface ReviewsProps {
  setActiveTab?: (tab: string) => void;
}

interface Review {
  id: string;
  reviewerName?: string;
  authorName?: string;
  rating?: number;
  sourceName?: string;
  location?: string;
  captionText?: string;
  text?: string;
  message?: string;
  originalCreatedOn?: string;
  createdAt?: string;
  replies?: any[];
  replied?: boolean;
  replyText?: string;
}

interface AIReplyOptions {
  professional: string;
  friendly: string;
  empathetic: string;
}

export function Reviews({ setActiveTab }: ReviewsProps) {
  const { t } = useLanguage();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [filters, setFilters] = useState({ all: 0, waiting: 0, replied: 0, ai: 0 });
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  const [replyText, setReplyText] = useState('');
  const [aiReplyOptions, setAiReplyOptions] = useState<AIReplyOptions | null>(null);
  const [selectedTone, setSelectedTone] = useState<'professional' | 'friendly' | 'empathetic' | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [subTab, setSubTab] = useState<'reviews' | 'automations'>('reviews');

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const [locationsRes, res] = await Promise.all([
        apiGet('/api/embedsocial/locations'),
        apiGet('/api/embedsocial/reviews')
      ]);
      if (locationsRes.ok) {
        const locsData = await locationsRes.json();
        const locs = Array.isArray(locsData) ? locsData : (locsData.data || []);
        setLocations(locs.map((l: any) => ({ id: l.id, name: l.name })));
      }
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
        if (embedReviews.length > 0 && !selectedReview) setSelectedReview(embedReviews[0]);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      setSyncMessage({ type: 'error', text: 'Failed to load reviews.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); }, []);

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await apiGet('/api/embedsocial/reviews');
      const data = await res.json();
      if (res.ok) {
        const embedReviews = Array.isArray(data) ? data : [];
        setReviews(embedReviews);
        setFilters({ all: embedReviews.length, waiting: embedReviews.filter((r: any) => !r.replies?.length).length, replied: embedReviews.filter((r: any) => r.replies?.length > 0).length, ai: 0 });
        setSyncMessage({ type: 'success', text: `Synced ${embedReviews.length} reviews.` });
        setTimeout(() => setSyncMessage(null), 3000);
      }
    } catch {
      setSyncMessage({ type: 'error', text: 'Network error.' });
    } finally {
      setSyncing(false);
    }
  };

  const generateReply = async () => {
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
        }
      }
    } catch (error) {
      console.error('Failed to generate reply:', error);
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
        const updatedReviews = reviews.map(r => r.id === selectedReview.id ? { ...r, replied: true, replyText } : r);
        setReviews(updatedReviews);
        setSelectedReview({ ...selectedReview, replied: true, replyText });
        setReplyText('');
        setFilters(prev => ({ ...prev, waiting: prev.waiting - 1, replied: prev.replied + 1 }));
        setSyncMessage({ type: 'success', text: 'Reply sent!' });
        setTimeout(() => setSyncMessage(null), 3000);
      }
    } catch (error) {
      console.error('Failed to send reply:', error);
    } finally {
      setSending(false);
    }
  };

  const filterCategories = [
    { id: 'all', label: 'All', icon: AllInbox, count: filters.all },
    { id: 'waiting', label: 'Pending', icon: PendingActions, count: filters.waiting },
    { id: 'replied', label: 'Replied', icon: DoneAll, count: filters.replied },
  ];

  const subNavItems = [
    { id: 'reviews', label: 'Reviews', icon: AllInbox },
    { id: 'automations', label: 'Automations', icon: SmartToy, badge: 'NEW' },
  ];

  const filteredReviews = (reviews || [])
    .filter(r => activeFilter === 'all' || (activeFilter === 'waiting' ? !r.replied : activeFilter === 'replied' ? (r.replied || r.replies?.length > 0) : true))
    .filter(r => selectedLocation === 'all' || r.sourceId === selectedLocation || r.location === selectedLocation)
    .sort((a, b) => {
      const dateA = new Date(a.originalCreatedOn || a.createdAt || 0).getTime();
      const dateB = new Date(b.originalCreatedOn || b.createdAt || 0).getTime();
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
    return <PageLoader message={t('reviews.loading')} subMessage={t('reviews.loadingDesc')} />;
  }

  return (
    <div className="reviews-container">
      {subTab === 'automations' ? (
        <Automations />
      ) : (
        <>
          {/* Header */}
          <header className="reviews-header">
            <div className="reviews-header-left">
              <h1 className="page-title">Reviews</h1>
              <span className="reviews-count">{filters.all} total</span>
            </div>
            <button className="btn btn-primary" onClick={handleSync} disabled={syncing}>
              <Sync sx={{ fontSize: 18, className: syncing ? 'spin' : '' }} />
              {syncing ? 'Syncing...' : 'Sync Reviews'}
            </button>
          </header>

          {/* Sync Message */}
          {syncMessage && (
            <div className={`sync-message ${syncMessage.type}`}>
              {syncMessage.text}
            </div>
          )}

          {/* Sub Navigation */}
          <div className="reviews-subnav">
            {subNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.id} className={`subnav-btn ${subTab === item.id ? 'active' : ''}`} onClick={() => setSubTab(item.id as 'reviews' | 'automations')}>
                  <Icon sx={{ fontSize: 18 }} />
                  <span>{item.label}</span>
                  {item.badge && <span className="subnav-badge">{item.badge}</span>}
                </button>
              );
            })}
          </div>

          <div className="reviews-layout">
            {/* Sidebar Filters */}
            <aside className="reviews-sidebar">
              <div className="sidebar-section">
                <h4 className="sidebar-label">Filter</h4>
                {filterCategories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button key={cat.id} className={`filter-btn ${activeFilter === cat.id ? 'active' : ''}`} onClick={() => setActiveFilter(cat.id)}>
                      <Icon sx={{ fontSize: 18 }} />
                      <span className="filter-label">{cat.label}</span>
                      <span className="filter-count">{cat.count}</span>
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* Review List */}
            <main className="reviews-list">
              <div className="reviews-list-header">
                <div className="search-box">
                  <Search sx={{ fontSize: 18, color: 'var(--color-text-muted)' }} />
                  <input type="text" placeholder="Search reviews..." className="search-input" />
                </div>
                <div className="list-controls">
                  <select className="input select" value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)}>
                    <option value="all">All Locations</option>
                    {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                  </select>
                  <select className="input select" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="highest">Highest rating</option>
                    <option value="lowest">Lowest rating</option>
                  </select>
                </div>
              </div>

              <div className="review-cards">
                {filteredReviews.length > 0 ? filteredReviews.map((review) => (
                  <div
                    key={review.id}
                    className={`review-card ${selectedReview?.id === review.id ? 'selected' : ''}`}
                    onClick={() => { setSelectedReview(review); setAiReplyOptions(null); setSelectedTone(null); setReplyText(''); }}
                  >
                    <div className="review-card-header">
                      <div className="review-avatar">
                        {(review.reviewerName || review.authorName || 'A').charAt(0).toUpperCase()}
                      </div>
                      <div className="review-card-info">
                        <div className="review-author">{review.reviewerName || review.authorName}</div>
                        <div className="review-meta">
                          <div className="review-stars">
                            {[1, 2, 3, 4, 5].map(i => (
                              <Star key={i} sx={{ fontSize: 12, color: i <= (review.rating || 0) ? '#f59e0b' : '#e2e8f0', fontVariationSettings: "'FILL' 1" }} />
                            ))}
                          </div>
                          <span>{review.originalCreatedOn || review.createdAt}</span>
                        </div>
                      </div>
                    </div>
                    <p className="review-text">{review.captionText || review.text || review.message}</p>
                    {review.replied && (
                      <div className="review-replied-badge">
                        <CheckCircle sx={{ fontSize: 14 }} />
                        Replied
                      </div>
                    )}
                  </div>
                )) : (
                  <div className="empty-state">
                    <AllInbox sx={{ fontSize: 48, color: 'var(--color-text-disabled)' }} />
                    <div className="empty-title">No reviews found</div>
                  </div>
                )}
              </div>
            </main>

            {/* Detail Panel */}
            {selectedReview && (
              <aside className="reviews-detail">
                <div className="detail-header">
                  <div className="detail-author">
                    <div className="detail-avatar">{(selectedReview.reviewerName || selectedReview.authorName || 'A').charAt(0).toUpperCase()}</div>
                    <div>
                      <div className="detail-name">{selectedReview.reviewerName || selectedReview.authorName}</div>
                      <div className="detail-meta">
                        <div className="review-stars">
                          {[1, 2, 3, 4, 5].map(i => (
                            <Star key={i} sx={{ fontSize: 14, color: i <= (selectedReview.rating || 0) ? '#f59e0b' : '#e2e8f0', fontVariationSettings: "'FILL' 1" }} />
                          ))}
                        </div>
                        <span>{selectedReview.originalCreatedOn || selectedReview.createdAt}</span>
                      </div>
                    </div>
                  </div>
                  <div className="detail-actions">
                    <button className="btn-icon"><Share sx={{ fontSize: 18 }} /></button>
                    <button className="btn-icon"><MoreVert sx={{ fontSize: 18 }} /></button>
                  </div>
                </div>

                <div className="detail-body">
                  <p className="detail-text">{selectedReview.captionText || selectedReview.text || selectedReview.message}</p>

                  {selectedReview.replyText && (
                    <div className="detail-reply">
                      <div className="reply-label">Your Reply</div>
                      <p>{selectedReview.replyText}</p>
                    </div>
                  )}
                </div>

                <div className="detail-footer">
                  <button className="btn btn-accent btn-sm" onClick={generateReply} disabled={generating}>
                    <AutoAwesome sx={{ fontSize: 16 }} />
                    {generating ? 'Generating...' : 'AI Reply'}
                  </button>

                  {aiReplyOptions && (
                    <div className="tone-selector">
                      {[
                        { key: 'professional', label: 'Professional', emoji: '👔' },
                        { key: 'friendly', label: 'Friendly', emoji: '😊' },
                        { key: 'empathetic', label: 'Caring', emoji: '💙' },
                      ].map((tone) => (
                        <button key={tone.key} className={`tone-btn ${selectedTone === tone.key ? 'active' : ''}`} onClick={() => { setSelectedTone(tone.key as any); setReplyText(aiReplyOptions[tone.key]); }}>
                          <span>{tone.emoji}</span>
                          <span>{tone.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <textarea
                    className="input reply-textarea"
                    placeholder={`Reply to ${selectedReview.reviewerName || selectedReview.authorName}...`}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={4}
                  />
                  <div className="reply-actions">
                    <button className="btn btn-secondary" onClick={() => { setReplyText(''); setAiReplyOptions(null); setSelectedTone(null); }}>Clear</button>
                    <button className="btn btn-primary" onClick={sendReply} disabled={!replyText.trim() || sending}>
                      <Send sx={{ fontSize: 16 }} />
                      {sending ? 'Sending...' : 'Send Reply'}
                    </button>
                  </div>
                </div>
              </aside>
            )}
          </div>
        </>
      )}

      <style>{`
        .reviews-loading {
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

        @keyframes spin { to { transform: rotate(360deg); } }

        .reviews-container {
          height: 100%;
          display: flex;
          flex-direction: column;
          padding-left: 256px;
        }

        @media (max-width: 1023px) {
          .reviews-container {
            padding-left: 0;
          }
        }

        .reviews-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid var(--color-border);
          background: var(--color-surface-raised);
        }

        .reviews-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .page-title {
          font-family: var(--font-headline);
          font-size: 20px;
          font-weight: 700;
          color: var(--color-text-primary);
          margin: 0;
          letter-spacing: -0.02em;
        }

        .reviews-count {
          font-size: 13px;
          color: var(--color-text-muted);
        }

        .reviews-layout {
          flex: 1;
          display: grid;
          grid-template-columns: 200px 1fr 400px;
          overflow: hidden;
          min-height: 0;
        }

        @media (max-width: 1200px) {
          .reviews-layout {
            grid-template-columns: 180px 1fr;
          }
          .reviews-detail { display: none; }
        }

        @media (max-width: 768px) {
          .reviews-layout {
            grid-template-columns: 1fr;
          }
          .reviews-sidebar { display: none; }
        }

        @media (min-width: 1024px) {
          .reviews-layout {
            grid-template-columns: 200px 1fr 400px;
          }
        }

        .sync-message {
          padding: 12px 24px;
          font-size: 14px;
          font-weight: 500;
        }

        .sync-message.success {
          background: var(--color-success-bg);
          color: var(--color-success-text);
        }

        .sync-message.error {
          background: var(--color-error-bg);
          color: var(--color-error-text);
        }

        .reviews-subnav {
          display: flex;
          gap: 4px;
          padding: 12px 24px;
          border-bottom: 1px solid var(--color-border);
          background: var(--color-surface-raised);
        }

        .subnav-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 500;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          background: transparent;
          color: var(--color-text-secondary);
          transition: all 0.15s ease;
        }

        .subnav-btn:hover {
          background: var(--color-surface);
        }

        .subnav-btn.active {
          background: var(--color-primary);
          color: white;
        }

        .subnav-badge {
          font-size: 9px;
          font-weight: 700;
          padding: 1px 5px;
          border-radius: 999px;
          background: var(--color-warning);
          color: white;
        }

        .subnav-btn.active .subnav-badge {
          background: rgba(255,255,255,0.3);
        }

        .reviews-sidebar {
          border-right: 1px solid var(--color-border);
          background: var(--color-surface-raised);
          padding: 16px;
          overflow-y: auto;
        }

        .sidebar-section {
          margin-bottom: 24px;
        }

        .sidebar-label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--color-text-muted);
          margin: 0 0 8px;
          padding: 0 8px;
        }

        .filter-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 8px 10px;
          font-size: 13px;
          font-weight: 500;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          background: transparent;
          color: var(--color-text-secondary);
          transition: all 0.15s ease;
          text-align: left;
        }

        .filter-btn:hover {
          background: var(--color-surface);
        }

        .filter-btn.active {
          background: var(--color-primary-muted);
          color: var(--color-primary);
        }

        .filter-label { flex: 1; }

        .filter-count {
          font-size: 11px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 999px;
          background: var(--color-surface);
        }

        .filter-btn.active .filter-count {
          background: var(--color-primary);
          color: white;
        }

        .reviews-list {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: var(--color-surface);
          padding-left: 256px;
          max-height: calc(100vh - 160px);
        }

        @media (max-width: 1023px) {
          .reviews-list {
            padding-left: 0;
            max-height: none;
          }
        }

        .reviews-list-header {
          display: flex;
          gap: 8px;
          padding: 12px 16px;
          border-bottom: 1px solid var(--color-border);
          background: var(--color-surface-raised);
        }

        .search-box {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 8px;
        }

        .search-input {
          flex: 1;
          border: none;
          background: transparent;
          font-size: 13px;
          color: var(--color-text-primary);
          outline: none;
        }

        .search-input::placeholder {
          color: var(--color-text-muted);
        }

        .list-controls {
          display: flex;
          gap: 8px;
        }

        .list-controls .input {
          width: auto;
          min-width: 120px;
        }

        .review-cards {
          flex: 1;
          max-height: calc(100vh - 280px);
          overflow-y: auto;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          scrollbar-width: thin;
          scrollbar-color: var(--color-border) transparent;
        }

        .review-cards::-webkit-scrollbar {
          width: 6px;
        }

        .review-cards::-webkit-scrollbar-track {
          background: transparent;
        }

        .review-cards::-webkit-scrollbar-thumb {
          background: var(--color-border);
          border-radius: 3px;
        }

        .review-cards::-webkit-scrollbar-thumb:hover {
          background: var(--color-border-strong);
        }

        .review-card {
          padding: 14px;
          background: var(--color-surface-raised);
          border: 1px solid var(--color-border);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .review-card:hover {
          border-color: var(--color-border-strong);
        }

        .review-card.selected {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px var(--color-primary-muted);
        }

        .review-card-header {
          display: flex;
          gap: 10px;
          margin-bottom: 8px;
        }

        .review-avatar {
          width: 36px;
          height: 36px;
          border-radius: 999px;
          background: var(--color-primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 600;
          flex-shrink: 0;
        }

        .review-card-info { flex: 1; min-width: 0; }

        .review-author {
          font-weight: 600;
          font-size: 14px;
          color: var(--color-text-primary);
        }

        .review-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 2px;
          font-size: 12px;
          color: var(--color-text-muted);
        }

        .review-stars {
          display: flex;
          gap: 1px;
        }

        .review-text {
          font-size: 13px;
          color: var(--color-text-secondary);
          line-height: 1.5;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .review-replied-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin-top: 8px;
          font-size: 11px;
          font-weight: 600;
          color: var(--color-success);
        }

        .reviews-detail {
          border-left: 1px solid var(--color-border);
          background: var(--color-surface-raised);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .detail-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid var(--color-border);
        }

        .detail-author {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .detail-avatar {
          width: 44px;
          height: 44px;
          border-radius: 999px;
          background: var(--color-primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 600;
        }

        .detail-name {
          font-weight: 600;
          font-size: 15px;
          color: var(--color-text-primary);
        }

        .detail-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 4px;
          font-size: 12px;
          color: var(--color-text-muted);
        }

        .detail-actions {
          display: flex;
          gap: 4px;
        }

        .detail-body {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }

        .detail-text {
          font-size: 14px;
          line-height: 1.6;
          color: var(--color-text-secondary);
          margin: 0 0 16px;
        }

        .detail-reply {
          padding: 12px 14px;
          background: var(--color-success-bg);
          border-radius: 8px;
          font-size: 13px;
        }

        .reply-label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-success);
          margin-bottom: 6px;
        }

        .detail-footer {
          padding: 16px 20px;
          border-top: 1px solid var(--color-border);
          background: var(--color-surface);
        }

        .tone-selector {
          display: flex;
          gap: 6px;
          margin: 12px 0;
        }

        .tone-btn {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 10px 8px;
          font-size: 11px;
          font-weight: 500;
          border: 1px solid var(--color-border);
          border-radius: 8px;
          background: var(--color-surface-raised);
          cursor: pointer;
          transition: all 0.15s ease;
          color: var(--color-text-secondary);
        }

        .tone-btn:hover {
          border-color: var(--color-primary);
        }

        .tone-btn.active {
          border-color: var(--color-primary);
          background: var(--color-primary-muted);
          color: var(--color-primary);
        }

        .reply-textarea {
          resize: none;
          min-height: 80px;
          margin-bottom: 12px;
        }

        .reply-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 64px 24px;
          text-align: center;
        }

        .empty-title {
          font-family: var(--font-headline);
          font-size: 16px;
          font-weight: 600;
          color: var(--color-text-primary);
          margin-top: 16px;
        }
      `}</style>
    </div>
  );
}
