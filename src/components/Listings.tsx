import React, { useState, useEffect } from 'react';
import { Inventory2, Store, LocationOn, Close, Link, ArrowBack, Edit, Star, Phone, Language, Lock, PhotoCamera, Tag, AccountCircle, CheckCircle, Add, Delete, AutoAwesome, OpenInNew } from '@mui/icons-material';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { EditBusinessPage } from './EditBusinessPage';
import { ProfileAnalysisDrawer } from './ProfileAnalysisDrawer';
import { apiGet, apiDelete } from '../utils/api';

interface ListingsProps {
  setActiveTab: (tab: string) => void;
  setListingsSubTab?: (tab: string | null, locationData?: any) => void;
  listingsSubTab?: string | null;
  setSelectedLocation?: (loc: any) => void;
  selectedLocation?: any;
}

interface Location {
  id: string;
  embedId?: string;
  name: string;
  address: string;
  account: string;
  group: string;
  lastSync: string;
  synced: boolean;
  embedSocialLocationId?: string;
  googleId?: string;
  websiteUrl?: string;
  phoneNumber?: string;
  totalReviews?: number;
  averageRating?: number;
  isLinked: boolean;
  openingHours?: string;
  categories?: string[];
  status?: string;
  ownerName?: string;
  photos?: string[];
  tags?: string[];
  latitude?: number;
  longitude?: number;
}

export function Listings({ setActiveTab, setListingsSubTab, setSelectedLocation, selectedLocation }: ListingsProps) {
  const { t } = useLanguage();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [showAnalysisDrawer, setShowAnalysisDrawer] = useState(false);
  const [selectedLocationForAnalysis, setSelectedLocationForAnalysis] = useState<Location | null>(null);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const res = await apiGet('/api/tenant/listings');
      if (res.ok) {
        const data = await res.json();
        const mappedLocations: Location[] = data.map((tl: any) => ({
          id: tl.id,
          embedId: tl.embedSocialListingId,
          name: tl.name || 'Unknown',
          address: tl.address || '',
          account: 'Google',
          group: 'Default',
          lastSync: new Date(tl.connectedAt).toLocaleString(),
          synced: tl.status === 'active',
          embedSocialLocationId: tl.embedSocialListingId,
          googleId: tl.googleId,
          websiteUrl: tl.websiteUrl,
          phoneNumber: tl.phoneNumber,
          totalReviews: tl.totalReviews || 0,
          averageRating: tl.averageRating || 0,
          isLinked: true,
          status: tl.status,
        }));
        setLocations(mappedLocations);
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLocation = async (id: string) => {
    if (!confirm('Are you sure you want to disconnect this listing?')) return;
    try {
      const res = await apiDelete(`/api/embedsocial/listings/${id}/disconnect`);
      if (res.ok) {
        setLocations(locations.filter(l => l.id !== id));
      }
    } catch (error) {
      console.error('Failed to disconnect listing:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-500">Loading listings...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen pb-10"
    >
      {/* Page Header */}
      <div className="px-10 pt-8 pb-4">
        <div className="flex items-end mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-primary font-headline tracking-tight">Listings</h1>
            <div className="mt-2 flex items-center gap-2 px-3 py-1 bg-primary-fixed text-on-primary-fixed rounded-full text-xs font-semibold w-fit">
              <Inventory2 className="w-4 h-4" />
              {locations.length} listing{locations.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="px-10">
        {/* Data Table */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="py-5 px-6 font-semibold text-xs text-slate-400 uppercase tracking-wider">Name</th>
                <th className="py-5 px-6 font-semibold text-xs text-slate-400 uppercase tracking-wider">Account</th>
                <th className="py-5 px-6 font-semibold text-xs text-slate-400 uppercase tracking-wider">Status</th>
                <th className="py-5 px-6 font-semibold text-xs text-slate-400 uppercase tracking-wider">Reviews</th>
                <th className="py-5 px-6 font-semibold text-xs text-slate-400 uppercase tracking-wider">Last sync</th>
                <th className="py-5 px-6 font-semibold text-xs text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {locations.map((location) => (
                <tr key={location.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="py-6 px-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center">
                        <Store className="w-6 h-6 text-slate-400" />
                      </div>
                      <div>
                        <div className="font-bold text-base text-slate-900">{location.name}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <LocationOn className="w-3 h-3" />
                          {location.address || 'No address'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-6 px-6">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-orange-100 text-orange-600 rounded flex items-center justify-center">
                        <Store className="w-3 h-3" style={{ fontVariationSettings: "'FILL' 1" }} />
                      </div>
                      <span className="text-sm font-medium text-slate-600">{location.account}</span>
                    </div>
                  </td>
                  <td className="py-6 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      location.status === 'active' 
                        ? 'bg-green-50 text-green-700' 
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {location.status === 'active' ? 'Connected' : 'Disconnected'}
                    </span>
                  </td>
                  <td className="py-6 px-6">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-semibold text-slate-700">
                        {location.averageRating?.toFixed(1) || '0.0'}
                      </span>
                      <span className="text-xs text-slate-400">
                        ({location.totalReviews || 0})
                      </span>
                    </div>
                  </td>
                  <td className="py-6 px-6">
                    <div className="text-sm text-slate-600 font-medium">{location.lastSync}</div>
                  </td>
                  <td className="py-6 px-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setSelectedLocationForAnalysis(location);
                          setShowAnalysisDrawer(true);
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/20 hover:from-purple-700 hover:to-indigo-700 transition-all"
                        title="AI Profile Analysis"
                      >
                        <AutoAwesome className="w-4 h-4" />
                        AI Analysis
                      </button>
                      <button
                        onClick={() => {
                          setSelectedLocation(location);
                          setShowDetailDrawer(true);
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-md shadow-primary/10 hover:bg-primary-container transition-all"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleDeleteLocation(location.id)}
                        className="w-9 h-9 flex items-center justify-center bg-slate-100 text-slate-500 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all"
                      >
                        <Delete className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {locations.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                        <Store className="w-8 h-8 text-slate-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">No Listings Connected</h3>
                        <p className="text-sm text-slate-500 mt-1">Go to Settings to connect your Google Business Profile listings.</p>
                      </div>
                      <button
                        onClick={() => setActiveTab('settings')}
                        className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm"
                      >
                        <Link className="w-5 h-5" />
                        Go to Settings
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Profile Analysis Drawer */}
      <ProfileAnalysisDrawer
        isOpen={showAnalysisDrawer}
        onClose={() => setShowAnalysisDrawer(false)}
        location={selectedLocationForAnalysis}
      />

      {/* View Details Drawer */}
      <AnimatePresence>
        {showDetailDrawer && selectedLocation && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setShowDetailDrawer(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-[480px] bg-white shadow-2xl z-50 flex flex-col"
            >
              <div className="flex-shrink-0 bg-gradient-to-r from-primary to-primary/80 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowDetailDrawer(false)}
                      className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                    >
                      <ArrowBack className="text-white" />
                    </button>
                    <h2 className="text-xl font-bold text-white">Business Info</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setShowDetailDrawer(false);
                        setSelectedLocationForAnalysis(selectedLocation);
                        setShowAnalysisDrawer(true);
                      }}
                      className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl font-semibold text-xs transition-all"
                    >
                      <AutoAwesome className="w-4 h-4" />
                      AI Analysis
                    </button>
                    <button
                      onClick={() => {
                        setShowDetailDrawer(false);
                        setListingsSubTab?.('edit', selectedLocation);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-white text-primary rounded-xl font-semibold text-sm hover:bg-white/90 transition-all"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">{selectedLocation.name}</h1>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-lg">
                      <Star className="w-5 h-5 text-amber-500" />
                      <span className="font-bold text-amber-700">{selectedLocation.averageRating?.toFixed(1) ?? '0.0'}</span>
                    </div>
                    <span className="text-slate-500">({selectedLocation.totalReviews ?? 0} reviews)</span>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Business information</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs text-slate-400 mb-1">Address</div>
                      <div className="flex items-start gap-2">
                        <LocationOn className="w-4 h-4 text-slate-400 mt-0.5" />
                        <span className="font-medium text-slate-700">{selectedLocation.address || 'No address'}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 mb-1">Phone</div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <a href={`tel:${selectedLocation.phoneNumber}`} className="font-medium text-primary">
                          {selectedLocation.phoneNumber || 'No phone'}
                        </a>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 mb-1">Website</div>
                      <div className="flex items-center gap-2">
                        <Language className="w-4 h-4 text-slate-400" />
                        <a href={selectedLocation.websiteUrl || '#'} target="_blank" rel="noopener noreferrer" className="font-medium text-primary truncate">
                          {selectedLocation.websiteUrl || 'No website'}
                        </a>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 mb-1">Status</div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        selectedLocation.status === 'active' 
                          ? 'bg-green-50 text-green-700' 
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {selectedLocation.status === 'active' ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Quick Actions</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setShowDetailDrawer(false);
                        setSelectedLocationForAnalysis(selectedLocation);
                        setShowAnalysisDrawer(true);
                      }}
                      className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200 hover:border-purple-400 transition-colors"
                    >
                      <AutoAwesome className="w-5 h-5 text-purple-600" />
                      <span className="font-medium text-purple-700">AI Profile Analysis</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('reviews')}
                      className="w-full flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 hover:border-primary transition-colors"
                    >
                      <Star className="w-5 h-5 text-slate-600" />
                      <span className="font-medium text-slate-700">View Reviews</span>
                    </button>
                    <button
                      onClick={() => window.open('https://business.google.com', '_blank')}
                      className="w-full flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 hover:border-primary transition-colors"
                    >
                      <OpenInNew className="w-5 h-5 text-slate-600" />
                      <span className="font-medium text-slate-700">Open in Google</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
