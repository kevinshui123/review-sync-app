import React, { useEffect, useState } from 'react';
import {
  Store,
  Link,
  ExternalLink,
  CheckCircle2,
  Loader2,
  Copy,
  RefreshCw,
  Info,
  ArrowRight,
  Shield,
  Globe,
  Star,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';

interface ConnectedListing {
  id: string;
  embedSocialListingId: string;
  name: string;
  address?: string;
  phoneNumber?: string;
  websiteUrl?: string;
  totalReviews?: number;
  averageRating?: number;
  connectedAt: string;
  status: string;
}

interface ConnectBusinessProps {
  onConnected: () => void;
}

export function ConnectBusiness({ onConnected }: ConnectBusinessProps) {
  const { t } = useLanguage();
  const [inviteUrl, setInviteUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [connectedListings, setConnectedListings] = useState<ConnectedListing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchInviteLink();
    fetchConnectedListings();
  }, [refreshKey]);

  const fetchInviteLink = async () => {
    try {
      const res = await fetch('/api/embedsocial/invite-link');
      if (res.ok) {
        const data = await res.json();
        setInviteUrl(data.inviteUrl || '');
      }
    } catch (error) {
      console.error('Failed to fetch invite link:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConnectedListings = async () => {
    setLoadingListings(true);
    try {
      const res = await fetch('/api/tenant/listings');
      if (res.ok) {
        const data = await res.json();
        setConnectedListings(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch connected listings:', error);
    } finally {
      setLoadingListings(false);
    }
  };

  const handleCopyLink = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const textarea = document.createElement('textarea');
      textarea.value = inviteUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(k => k + 1);
  };

  const hasListings = connectedListings.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-6 lg:p-10 max-w-4xl mx-auto w-full"
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-on-surface mb-2">Connect Your Business</h1>
        <p className="text-on-surface-variant">
          Connect your Google Business Profile to start managing reviews, insights, and more.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: How it works */}
        <div className="space-y-6">
          <div className="bg-surface-container rounded-2xl p-6 border border-outline-variant/20">
            <h2 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              How it works
            </h2>
            <div className="space-y-4">
              {[
                {
                  step: 1,
                  title: 'Share the invite link',
                  desc: 'Click "Copy Link" below and share it with your client.',
                  icon: <Link className="w-4 h-4" />,
                },
                {
                  step: 2,
                  title: 'Client connects their Google account',
                  desc: 'Your client clicks the link and securely connects their Google Business Profile. No signup required.',
                  icon: <Globe className="w-4 h-4" />,
                },
                {
                  step: 3,
                  title: 'Business appears here',
                  desc: 'Once connected, the business listing appears below. You can then manage reviews, edit info, and more.',
                  icon: <CheckCircle2 className="w-4 h-4" />,
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">
                    {item.step}
                  </div>
                  <div>
                    <div className="font-semibold text-on-surface text-sm flex items-center gap-1.5">
                      {item.icon}
                      {item.title}
                    </div>
                    <p className="text-xs text-on-surface-variant mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Invite Link Card */}
          <div className="bg-surface-container rounded-2xl p-6 border border-outline-variant/20">
            <h2 className="text-lg font-bold text-on-surface mb-1">Share this link with your client</h2>
            <p className="text-xs text-on-surface-variant mb-4">
              They can connect their Google Business Profile in seconds — no account needed.
            </p>

            {loading ? (
              <div className="flex items-center gap-2 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm text-on-surface-variant">Generating link...</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 bg-surface-container-lowest rounded-xl p-3 border border-outline-variant/20">
                  <Globe className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-xs text-on-surface-variant truncate flex-1">
                    {inviteUrl || 'embedsocial.com/app/public/grant_listing_access?token=...'}
                  </span>
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors shrink-0"
                  >
                    {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>

                <a
                  href={inviteUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-primary/30 text-primary rounded-xl text-sm font-semibold hover:bg-primary/5 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Preview Invite Page
                </a>
              </div>
            )}
          </div>

          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <strong>Note:</strong> Once your client connects their listing via the link, it will automatically appear below. 
              You can also click "Refresh" to manually sync.
            </p>
          </div>
        </div>

        {/* Right: Connected Listings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
              <Store className="w-5 h-5 text-primary" />
              Connected Businesses
            </h2>
            <button
              onClick={handleRefresh}
              disabled={loadingListings}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-on-surface-variant hover:text-primary transition-colors rounded-lg hover:bg-surface-container-high/50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingListings ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {loadingListings ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : connectedListings.length === 0 ? (
            <div className="bg-surface-container rounded-2xl p-8 text-center border border-outline-variant/20">
              <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mx-auto mb-4">
                <Store className="w-8 h-8 text-on-surface-variant" />
              </div>
              <h3 className="text-base font-bold text-on-surface mb-1">No businesses connected yet</h3>
              <p className="text-sm text-on-surface-variant">
                Share the invite link above with your client to connect their Google Business Profile.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {connectedListings.map((listing) => (
                  <motion.div
                    key={listing.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-surface-container rounded-2xl p-4 border border-outline-variant/20 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Store className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-on-surface text-sm truncate">{listing.name}</h3>
                          <span className="flex-shrink-0 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-[10px] font-semibold">
                            Connected
                          </span>
                        </div>
                        {listing.address && (
                          <p className="text-xs text-on-surface-variant mt-0.5 truncate">{listing.address}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          {listing.averageRating !== undefined && listing.averageRating > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 text-amber-400" style={{ fontVariationSettings: "'FILL' 1" }} />
                              <span className="text-xs font-semibold text-on-surface">{listing.averageRating.toFixed(1)}</span>
                            </div>
                          )}
                          {listing.totalReviews !== undefined && listing.totalReviews > 0 && (
                            <span className="text-xs text-on-surface-variant">
                              {listing.totalReviews} reviews
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-outline mt-1">
                          Connected {new Date(listing.connectedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-outline flex-shrink-0 mt-1" />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {hasListings && (
            <button
              onClick={onConnected}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            >
              Continue to Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
