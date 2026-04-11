import React, { useState, useEffect } from 'react';
import {
  Search,
  Notifications,
  History,
  Add,
  Inventory2,
  Psychology,
  Delete,
  MoreHoriz,
  TrendingUp,
  AutoAwesome,
  Store,
  LocationOn,
  Sync,
  Close,
  Refresh,
  Link,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';

interface ListingsProps {
  setActiveTab: (tab: string) => void;
}

interface Location {
  id: string;
  name: string;
  address: string;
  account: string;
  group: string;
  lastSync: string;
  synced: boolean;
  embedSocialLocationId?: string;
}

interface EmbedSocialSource {
  id: string;
  name: string;
  source_id?: string;
}

export function Listings({ setActiveTab }: ListingsProps) {
  const { t } = useLanguage();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [embedSources, setEmbedSources] = useState<EmbedSocialSource[]>([]);
  const [loadingSources, setLoadingSources] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const res = await fetch('/api/locations');
      if (res.ok) {
        const data = await res.json();
        setLocations(data.map((loc: any) => ({
          id: loc.id,
          name: loc.name,
          address: loc.address || '',
          account: 'Google',
          group: 'Default',
          lastSync: loc.isSynced ? new Date().toLocaleString() : 'Never',
          synced: loc.isSynced || false,
          embedSocialLocationId: loc.embedSocialLocationId,
        })));
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLocation = async () => {
    if (!formData.name.trim()) return;

    try {
      const res = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
        }),
      });

      if (res.ok) {
        await fetchLocations();
        setShowAddModal(false);
        setFormData({ name: '', address: '', phone: '' });
      }
    } catch (error) {
      console.error('Failed to add location:', error);
    }
  };

  const handleDeleteLocation = async (id: string) => {
    try {
      const res = await fetch(`/api/locations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setLocations(locations.filter(l => l.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete location:', error);
    }
  };

  const handleSyncReviews = async () => {
    setSyncing(true);
    setSyncMessage(null);

    try {
      const res = await fetch('/api/reviews/sync', { method: 'POST' });
      const data = await res.json();

      if (res.ok) {
        setSyncMessage({ type: 'success', text: data.message || 'Reviews synced successfully!' });
        await fetchLocations();
      } else {
        setSyncMessage({ type: 'error', text: data.error || 'Failed to sync reviews' });
      }
    } catch (error) {
      setSyncMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSyncing(false);
    }
  };

  const handleOpenEmbedModal = async (location: Location) => {
    setSelectedLocation(location);
    setShowEmbedModal(true);
    setLoadingSources(true);

    try {
      const res = await fetch('/api/embedsocial/locations');
      if (res.ok) {
        const data = await res.json();
        const sources: EmbedSocialSource[] = Array.isArray(data) ? data : (data.data || []);
        setEmbedSources(sources);
      }
    } catch (error) {
      console.error('Failed to fetch EmbedSocial sources:', error);
    } finally {
      setLoadingSources(false);
    }
  };

  const handleLinkEmbedSource = async (sourceId: string) => {
    if (!selectedLocation) return;

    try {
      const res = await fetch(`/api/locations/${selectedLocation.id}/embed-social`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embedSocialLocationId: sourceId }),
      });

      if (res.ok) {
        setLocations(locations.map(l =>
          l.id === selectedLocation.id ? { ...l, embedSocialLocationId: sourceId } : l
        ));
        setShowEmbedModal(false);
      }
    } catch (error) {
      console.error('Failed to link EmbedSocial source:', error);
    }
  };

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
      className="min-h-screen pb-10"
    >
      {/* Page Header */}
      <div className="px-10 pt-8 pb-4">
          <div className="flex items-end mb-6">
            <div>
              <h1 className="text-3xl font-extrabold text-primary font-headline tracking-tight">Listings</h1>
              <div className="mt-2 flex items-center gap-2 px-3 py-1 bg-primary-fixed text-on-primary-fixed rounded-full text-xs font-semibold w-fit">
                <Inventory2 className="w-4 h-4" />
                {locations.length}/1 listing limit
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="ml-auto flex items-center gap-2 bg-gradient-to-br from-primary to-primary-container text-white px-6 py-3 rounded-full font-bold shadow-lg hover:shadow-primary/20 transition-all"
            >
              <Add className="w-5 h-5" />
              <span>New listing</span>
            </button>
          </div>

        {/* Sync Message */}
        <AnimatePresence>
          {syncMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${
                syncMessage.type === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {syncMessage.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter & Tabs Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-4 bg-white p-2 rounded-2xl shadow-sm">
          <div className="flex p-1 bg-slate-50 rounded-xl">
            <button className="px-6 py-2 rounded-lg text-sm font-semibold bg-white text-primary shadow-sm">Active listings</button>
            <button className="px-6 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-white/50 transition-colors">All listings</button>
          </div>
          <div className="flex items-center gap-3 px-2">
            <select className="appearance-none bg-slate-50 border-none rounded-xl py-2 pl-4 pr-10 text-sm font-medium focus:ring-0 cursor-pointer">
              <option>All accounts</option>
            </select>
            <select className="appearance-none bg-slate-50 border-none rounded-xl py-2 pl-4 pr-10 text-sm font-medium focus:ring-0 cursor-pointer">
              <option>Groups</option>
            </select>
            <button className="p-2 bg-slate-50 text-slate-500 rounded-xl hover:text-primary transition-colors">
              <TrendingUp className="w-5 h-5" />
            </button>
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
                <th className="py-5 px-6 font-semibold text-xs text-slate-400 uppercase tracking-wider">Group</th>
                <th className="py-5 px-6 font-semibold text-xs text-slate-400 uppercase tracking-wider">EmbedSocial</th>
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
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">{location.group}</span>
                  </td>
                  <td className="py-6 px-6">
                    {location.embedSocialLocationId ? (
                      <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
                        <Link className="w-3 h-3" />
                        Connected
                      </span>
                    ) : (
                      <button
                        onClick={() => handleOpenEmbedModal(location)}
                        className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-medium hover:bg-slate-200 transition-colors"
                      >
                        Link EmbedSocial
                      </button>
                    )}
                  </td>
                  <td className="py-6 px-6">
                    <div className="text-sm text-slate-600 font-medium">{location.lastSync}</div>
                  </td>
                  <td className="py-6 px-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-md shadow-primary/10 hover:bg-primary-container transition-all">
                        <Psychology className="w-4 h-4" />
                        AI Audit
                      </button>
                      <button
                        onClick={() => handleDeleteLocation(location.id)}
                        className="w-9 h-9 flex items-center justify-center bg-slate-100 text-slate-500 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all"
                      >
                        <Delete className="w-5 h-5" />
                      </button>
                      <button className="w-9 h-9 flex items-center justify-center bg-slate-100 text-slate-500 rounded-xl hover:bg-blue-50 hover:text-primary transition-all">
                        <MoreHoriz className="w-5 h-5" />
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
                        <h3 className="text-lg font-bold text-slate-900">No Locations Found</h3>
                        <p className="text-sm text-slate-500 mt-1">Add a location to start syncing reviews.</p>
                      </div>
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm"
                      >
                        <Add className="w-5 h-5" />
                        Add Location
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="p-6 border-t border-slate-100 flex items-center justify-between">
            <div className="text-xs font-medium text-slate-400">
              Showing <span className="text-slate-900 font-bold">1</span> of <span className="text-slate-900 font-bold">{locations.length || 1}</span> listing
            </div>
            <div className="flex items-center gap-1">
              <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 cursor-not-allowed" disabled>
                <span className="material-symbols-outlined text-base">chevron_left</span>
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-white text-xs font-bold">1</button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 cursor-not-allowed" disabled>
                <span className="material-symbols-outlined text-base">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bento Contextual Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          {/* Visibility Score Card */}
          <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 p-6 rounded-3xl border border-white relative overflow-hidden group">
            <div className="flex items-center justify-between mb-8">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary">
                <TrendingUp className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Performance</span>
            </div>
            <h3 className="text-lg font-bold text-blue-900 mb-1">Visibility Score</h3>
            <div className="text-3xl font-extrabold text-primary">94/100</div>
            <p className="text-sm text-slate-400 mt-2">Your listing is performing 12% above average this week.</p>
          </div>

          {/* AI Insights Card */}
          <div className="md:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-transparent hover:border-blue-100 transition-all">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
                <AutoAwesome className="w-6 h-6" style={{ fontVariationSettings: "'FILL' 1" }} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 leading-tight">AI Insights Ready</h3>
                <p className="text-xs text-slate-400">Smart optimizations for your listings</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[200px] p-4 bg-slate-50 rounded-2xl">
                <div className="text-xs font-bold text-orange-600 mb-1">SEO Opportunity</div>
                <p className="text-xs text-slate-600 font-medium">Include "Hand-painted" in title to boost reach.</p>
              </div>
              <div className="flex-1 min-w-[200px] p-4 bg-slate-50 rounded-2xl">
                <div className="text-xs font-bold text-primary mb-1">Pricing Alert</div>
                <p className="text-xs text-slate-600 font-medium">Competitors are listing similar items at $24.00.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating AI Button */}
      <button className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-50">
        <AutoAwesome className="w-6 h-6" />
      </button>

      {/* Add Location Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">Add New Location</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
                >
                  <Close className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Business Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter business name"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Enter business address"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter phone number"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddLocation}
                  disabled={!formData.name.trim()}
                  className="flex-1 px-4 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Location
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Link EmbedSocial Modal */}
      <AnimatePresence>
        {showEmbedModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowEmbedModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Link EmbedSocial Source</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Connect "{selectedLocation?.name}" to your EmbedSocial source
                  </p>
                </div>
                <button
                  onClick={() => setShowEmbedModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
                >
                  <Close className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {loadingSources ? (
                <div className="flex items-center justify-center py-12">
                  <Refresh className="w-6 h-6 text-primary animate-spin" />
                </div>
              ) : embedSources.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Store className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">No Sources Found</h3>
                  <p className="text-sm text-slate-500 mt-2">
                    Make sure your EmbedSocial API key is configured in Settings.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {embedSources.map((source) => (
                    <button
                      key={source.id}
                      onClick={() => handleLinkEmbedSource(source.source_id || source.id)}
                      className="w-full p-4 bg-slate-50 hover:bg-slate-100 rounded-xl text-left transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                          <Store className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-slate-900">{source.name}</div>
                          <div className="text-xs text-slate-400">ID: {source.source_id || source.id}</div>
                        </div>
                        <Link className="w-5 h-5 text-slate-400" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
