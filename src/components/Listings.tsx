import React, { useEffect, useState } from 'react';
import { Sparkles, RefreshCw, Unlock, AlertTriangle, Edit, MapPin, Calendar, X, Plus, ChevronDown, Search, Check, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';

interface GooglePlace {
  placeId: string;
  name: string;
  address: string;
  phone?: string;
  location?: { lat: number; lng: number };
  rating?: number;
}

export function Listings() {
  const { t } = useLanguage();
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [needsPlacesApiKey, setNeedsPlacesApiKey] = useState(false);

  // Google Place Search State
  const [showPlaceSearch, setShowPlaceSearch] = useState(false);
  const [placeSearchQuery, setPlaceSearchQuery] = useState('');
  const [placeSearchResults, setPlaceSearchResults] = useState<GooglePlace[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [manualPlaceId, setManualPlaceId] = useState('');
  const [isValidatingPlaceId, setIsValidatingPlaceId] = useState(false);
  const [manualPlaceError, setManualPlaceError] = useState<string | null>(null);
  const [manualPlaceInfo, setManualPlaceInfo] = useState<GooglePlace | null>(null);

  // AI Optimizer State
  const [showOptimizer, setShowOptimizer] = useState(true);
  const [isApplyingRecommendation, setIsApplyingRecommendation] = useState(false);

  const [formData, setFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [newLocationData, setNewLocationData] = useState({ name: '', address: '', phone: '' });

  const fetchLocations = async () => {
    try {
      const res = await fetch('/api/locations');
      if (res.ok) {
        const data = await res.json();
        setLocations(data);
        if (data.length > 0) {
          setSelectedLocation((prev: any) => prev || data[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    if (!selectedLocation) return;
    const defaultHours = {
      Monday: '09:00 AM - 05:00 PM',
      Tuesday: '09:00 AM - 05:00 PM',
      Wednesday: '09:00 AM - 05:00 PM',
      Thursday: '09:00 AM - 05:00 PM',
      Friday: '09:00 AM - 05:00 PM',
      Saturday: 'Closed',
      Sunday: 'Closed',
    };
    let businessHours = defaultHours;
    const raw = selectedLocation.businessHours;
    if (raw) {
      try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (parsed && typeof parsed === 'object') businessHours = { ...defaultHours, ...parsed };
      } catch {
        /* legacy plain text */
      }
    }
    setFormData({ phone: selectedLocation.phone || '', businessHours });
  }, [selectedLocation]);

  // Google Place Search Functions
  const handleSearchPlaces = async () => {
    if (!placeSearchQuery.trim()) return;
    setIsSearchingPlaces(true);
    setSyncError(null);
    try {
      const res = await fetch(`/api/google/places/search?query=${encodeURIComponent(placeSearchQuery)}`);
      const data = await res.json();
      if (data.setupRequired) {
        setNeedsPlacesApiKey(true);
      } else if (data.error) {
        setSyncError(data.error);
      } else {
        setPlaceSearchResults(data);
      }
    } catch (error) {
      console.error('Search places error:', error);
      setSyncError('Failed to search places');
    } finally {
      setIsSearchingPlaces(false);
    }
  };

  const handleSelectPlace = async (place: GooglePlace) => {
    setNewLocationData({
      name: place.name,
      address: place.address,
      phone: place.phone || '',
    });
    setManualPlaceId(place.placeId);
    setManualPlaceInfo(place);
    setShowPlaceSearch(false);
    setPlaceSearchResults([]);
    setPlaceSearchQuery('');
  };

  const handleValidateManualPlaceId = async () => {
    if (!manualPlaceId.trim()) return;
    setIsValidatingPlaceId(true);
    setManualPlaceError(null);
    setManualPlaceInfo(null);
    try {
      const res = await fetch('/api/google/validate-place-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeId: manualPlaceId.trim() })
      });
      const data = await res.json();
      if (data.setupRequired) {
        setNeedsPlacesApiKey(true);
        setManualPlaceError(t('listings.placesApiKeyManualError'));
      } else if (!data.valid) {
        setManualPlaceError(data.error || 'Invalid Place ID');
      } else {
        setManualPlaceInfo(data.place);
        setNewLocationData({
          name: data.place.name,
          address: data.place.address,
          phone: '',
        });
      }
    } catch (error) {
      console.error('Validate place ID error:', error);
      setManualPlaceError('Failed to validate Place ID');
    } finally {
      setIsValidatingPlaceId(false);
    }
  };

  const handleAddLocation = async () => {
    if (!newLocationData.name) {
      setSyncError('Location name is required.');
      return;
    }
    setIsSyncing(true);
    setSyncError(null);
    try {
      const res = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newLocationData,
          googlePlaceId: manualPlaceId || null,
        })
      });
      if (res.ok) {
        await fetchLocations();
        setIsAddingLocation(false);
        setNewLocationData({ name: '', address: '', phone: '' });
        setManualPlaceId('');
        setManualPlaceInfo(null);
        setIsValidatingPlaceId(false);
        setManualPlaceError(null);
      } else {
        const err = await res.json();
        setSyncError(err.error || 'Failed to add location');
      }
    } catch (error) {
      console.error('Add location error:', error);
      setSyncError('Failed to add location due to a network error.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSave = async () => {
    if (!selectedLocation) return;
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch(`/api/locations/${selectedLocation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formData.phone,
          businessHours: JSON.stringify(formData.businessHours),
        })
      });
      if (res.ok) {
        setSaveMessage({ type: 'success', text: 'Profile saved successfully!' });
        fetchLocations();
      } else {
        setSaveMessage({ type: 'error', text: 'Failed to save profile.' });
      }
    } catch (e) {
      setSaveMessage({ type: 'error', text: 'Error saving profile.' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleApplyRecommendation = async () => {
    setIsApplyingRecommendation(true);
    // Simulate API call to apply recommendation
    setTimeout(() => {
      setIsApplyingRecommendation(false);
      setShowOptimizer(false);
      // In a real app, we would update the location data here
      alert('Recommendation applied successfully! Your profile will be updated shortly.');
    }, 1500);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 md:p-8 space-y-10 max-w-[1600px] mx-auto w-full pb-20"
    >
      {/* Header & Stats Asymmetry */}
      <div className="flex flex-col md:flex-row items-end justify-between gap-6 border-b border-outline-variant/10 pb-10">
        <div className="space-y-2">
          <div className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">
            Directory Management
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight text-on-surface">{t('listings.title')}</h2>
          <p className="text-secondary font-medium max-w-md">
            {t('listings.subtitle')}
          </p>
        </div>
        <div className="flex gap-4">
          <div className="bg-surface-container p-4 rounded-xl min-w-[140px] text-right">
            <p className="text-[10px] font-bold uppercase tracking-tighter text-outline-variant mb-1">Total Sync</p>
            <p className="text-2xl font-black text-on-surface">{locations.length > 0 ? '100%' : '0%'}</p>
          </div>
          <div className="bg-surface-container p-4 rounded-xl min-w-[140px] text-right">
            <p className="text-[10px] font-bold uppercase tracking-tighter text-outline-variant mb-1">Locations</p>
            <p className="text-2xl font-black text-primary">{locations.length}</p>
          </div>
        </div>
      </div>

      {/* AI Engine Banner */}
      {showOptimizer && (
        <section className="relative overflow-hidden bg-gradient-to-r from-surface-container to-surface-container-high rounded-2xl p-8 border border-primary/20">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-primary/10 blur-[100px] rounded-full"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
                <Sparkles className="text-primary w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-on-surface mb-1">AI Profile Optimizer</h3>
                <p className="text-on-surface-variant leading-relaxed text-sm">
                  Competitors are using the attribute <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-xs font-semibold">"Late-night food"</span>. 
                  Adding this could increase visibility for local searches by up to 14%.
                </p>
              </div>
            </div>
            <div className="flex gap-3 shrink-0">
              <button 
                onClick={() => setShowOptimizer(false)}
                className="px-6 py-2.5 rounded-lg font-bold text-sm text-on-surface bg-surface-container-highest hover:bg-surface-container-highest/80 transition-colors"
              >
                Dismiss
              </button>
              <button 
                onClick={handleApplyRecommendation}
                disabled={isApplyingRecommendation}
                className="px-6 py-2.5 rounded-lg font-bold text-sm text-on-primary bg-gradient-to-br from-primary to-primary-container hover:brightness-105 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center gap-2"
              >
                {isApplyingRecommendation ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                {isApplyingRecommendation ? 'Applying...' : 'Apply Recommendation'}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Directory Sync Table */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <MapPin className="text-outline w-5 h-5" />
            Locations
          </h3>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsAddingLocation(true)}
              className="text-xs font-bold text-primary flex items-center gap-1 hover:opacity-80 uppercase tracking-widest"
            >
              <Plus className="w-4 h-4" /> Add Location
            </button>
          </div>
        </div>

        {isAddingLocation && (
          <div className="bg-surface-container-high p-6 rounded-2xl border border-primary/20 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold">Add New Location</h4>
              <button 
                onClick={() => {
                  setIsAddingLocation(false);
                  setShowPlaceSearch(false);
                  setPlaceSearchResults([]);
                  setManualPlaceId('');
                  setManualPlaceInfo(null);
                }}
                className="p-1 hover:bg-surface-container-highest rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Place ID Section */}
            <div className="mb-6 p-4 bg-surface-container-low rounded-xl border border-outline-variant/20">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold">Link to Google Business Profile</span>
              </div>
              <p className="text-xs text-on-surface-variant mb-3">
                Enter a Google Place ID to link this location to your Google Business Profile.
                {!needsPlacesApiKey && (
                  <button 
                    onClick={() => setShowPlaceSearch(!showPlaceSearch)}
                    className="ml-2 text-primary hover:underline"
                  >
                    {showPlaceSearch ? 'I have a Place ID' : 'Search for a business'}
                  </button>
                )}
              </p>

              {/* Search for Business */}
              {showPlaceSearch && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Search for a business name..."
                      className="flex-1 bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-2.5 text-sm text-on-surface focus:ring-2 focus:ring-primary/50 outline-none"
                      value={placeSearchQuery}
                      onChange={(e) => setPlaceSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchPlaces()}
                    />
                    <button 
                      onClick={handleSearchPlaces}
                      disabled={isSearchingPlaces}
                      className="px-4 py-2 bg-primary text-on-primary rounded-lg font-bold text-sm hover:brightness-110 disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSearchingPlaces ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      Search
                    </button>
                  </div>

                  {placeSearchResults.length > 0 && (
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {placeSearchResults.map((place) => (
                        <div 
                          key={place.placeId}
                          className="flex items-center justify-between p-3 bg-surface-container-lowest rounded-lg hover:bg-surface-container-high cursor-pointer transition-colors"
                          onClick={() => handleSelectPlace(place)}
                        >
                          <div>
                            <p className="text-sm font-bold">{place.name}</p>
                            <p className="text-xs text-on-surface-variant">{place.address}</p>
                          </div>
                          <Check className="w-4 h-4 text-primary shrink-0" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Manual Place ID Input */}
              {!showPlaceSearch && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter Google Place ID (e.g. ChIJr...xxx)"
                      className="flex-1 bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-2.5 text-sm text-on-surface focus:ring-2 focus:ring-primary/50 outline-none font-mono"
                      value={manualPlaceId}
                      onChange={(e) => {
                        setManualPlaceId(e.target.value);
                        setManualPlaceInfo(null);
                        setManualPlaceError(null);
                      }}
                    />
                    <button 
                      onClick={handleValidateManualPlaceId}
                      disabled={isValidatingPlaceId || !manualPlaceId.trim()}
                      className="px-4 py-2 bg-primary text-on-primary rounded-lg font-bold text-sm hover:brightness-110 disabled:opacity-50 flex items-center gap-2"
                    >
                      {isValidatingPlaceId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Validate
                    </button>
                  </div>

                  {manualPlaceError && (
                    <p className="text-xs text-error">{manualPlaceError}</p>
                  )}

                  {needsPlacesApiKey && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                      <p className="text-xs text-amber-500 font-medium">{t('listings.placesApiKeyBanner')}</p>
                    </div>
                  )}

                  {manualPlaceInfo && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                      <p className="text-xs text-emerald-500 font-bold mb-1">Place verified:</p>
                      <p className="text-sm font-medium">{manualPlaceInfo.name}</p>
                      <p className="text-xs text-on-surface-variant">{manualPlaceInfo.address}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Basic Info Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-outline uppercase tracking-widest">Location Name *</label>
                <input 
                  type="text" 
                  placeholder="e.g. New York Store" 
                  className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-3 text-sm text-on-surface focus:ring-2 focus:ring-primary/50 outline-none"
                  value={newLocationData.name}
                  onChange={e => setNewLocationData({...newLocationData, name: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-outline uppercase tracking-widest">Phone</label>
                <input 
                  type="text" 
                  placeholder="+1 (555) 123-4567" 
                  className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-3 text-sm text-on-surface focus:ring-2 focus:ring-primary/50 outline-none"
                  value={newLocationData.phone}
                  onChange={e => setNewLocationData({...newLocationData, phone: e.target.value})}
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-bold text-outline uppercase tracking-widest">Address</label>
                <input 
                  type="text" 
                  placeholder="Full address" 
                  className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-3 text-sm text-on-surface focus:ring-2 focus:ring-primary/50 outline-none"
                  value={newLocationData.address}
                  onChange={e => setNewLocationData({...newLocationData, address: e.target.value})}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={handleAddLocation}
                disabled={isSyncing || !newLocationData.name}
                className="px-4 py-2 bg-primary text-on-primary rounded-lg font-bold text-sm hover:brightness-110 disabled:opacity-50"
              >
                {isSyncing ? 'Adding...' : 'Save Location'}
              </button>
              <button 
                onClick={() => {
                  setIsAddingLocation(false);
                  setShowPlaceSearch(false);
                  setPlaceSearchResults([]);
                  setManualPlaceId('');
                  setManualPlaceInfo(null);
                }}
                className="px-4 py-2 bg-surface-container-highest text-on-surface rounded-lg font-bold text-sm hover:brightness-110"
              >
                Cancel
              </button>
            </div>
            {syncError && <p className="text-error text-sm mt-3">{syncError}</p>}
          </div>
        )}

        <div className="bg-surface-container rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-outline">Platform</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-outline">{t('listings.table.status')}</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-outline">Locations</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-outline text-right">{t('listings.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              <SyncRow 
                platform="Google Business Profile" 
                initial="G" 
                initialColor="text-primary" 
                status={locations.length > 0 ? "Connected" : "Not Connected"} 
                statusColor={locations.length > 0 ? "bg-emerald-500" : "bg-outline"} 
                consistency={locations.length} 
                action={locations.length === 0 ? "ADD LOCATION" : undefined}
                onActionClick={locations.length === 0 ? () => setIsAddingLocation(true) : undefined}
              />
              <SyncRow 
                platform="Yelp" 
                initial="Y" 
                initialColor="text-red-500" 
                status={t('listings.status.pending')} 
                statusColor="bg-amber-500" 
                consistency={0} 
                action="CONNECT"
                onActionClick={() => alert('Yelp integration will be available soon.')}
              />
              <SyncRow 
                platform="Bing Places" 
                initial="B" 
                initialColor="text-sky-500" 
                status={t('listings.status.pending')} 
                statusColor="bg-amber-500" 
                consistency={0} 
                action="CONNECT"
                onActionClick={() => alert('Bing Places integration will be available soon.')}
              />
            </tbody>
          </table>
        </div>
      </section>

      {/* Business Info & Bento Editor */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Editor Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Edit className="text-outline w-5 h-5" />
              {t('listings.editor')}
            </h3>
            
            {locations.length > 1 && (
              <div className="relative">
                <select 
                  className="appearance-none bg-surface-container-high border border-outline-variant/20 rounded-lg pl-4 pr-10 py-2 text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={selectedLocation?.id || ''}
                  onChange={(e) => setSelectedLocation(locations.find(l => l.id === e.target.value))}
                >
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline pointer-events-none" />
              </div>
            )}
          </div>
          
          <div className="bg-surface-container rounded-2xl p-8 space-y-8">
            {!selectedLocation ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="text-outline w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-on-surface mb-2">{t('listings.noLocations')}</h4>
                <p className="text-on-surface-variant text-sm max-w-md mx-auto mb-6">
                  {t('listings.noLocationsDesc')}
                </p>
                {syncError && (
                  <div className="mb-6 max-w-md mx-auto p-4 bg-error/10 text-error rounded-lg text-sm text-left border border-error/20">
                    <strong>Sync Error:</strong> {syncError}
                  </div>
                )}
                <button 
                  onClick={() => setIsAddingLocation(true)}
                  className="mt-6 px-6 py-2.5 rounded-lg font-bold text-sm text-on-primary bg-primary hover:brightness-105 transition-all"
                >
                  <Plus className="w-4 h-4 inline-block mr-2" /> Add Location
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-outline uppercase tracking-widest">{t('listings.table.name')}</label>
                    <input 
                      type="text" 
                      value={selectedLocation.name || ''} 
                      readOnly
                      className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-on-surface focus:ring-1 focus:ring-primary/40 outline-none opacity-80" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-outline uppercase tracking-widest">Google Place ID</label>
                    <input 
                      type="text" 
                      value={selectedLocation.googlePlaceId?.split('/').pop() || ''} 
                      readOnly
                      className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-on-surface focus:ring-1 focus:ring-primary/40 outline-none opacity-80 font-mono text-xs" 
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-bold text-outline uppercase tracking-widest">{t('listings.table.address')}</label>
                    <input 
                      type="text" 
                      value={selectedLocation.address || ''} 
                      readOnly
                      className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-on-surface focus:ring-1 focus:ring-primary/40 outline-none opacity-80" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-outline uppercase tracking-widest">{t('listings.table.phone')}</label>
                    <input 
                      type="text" 
                      value={formData.phone || ''} 
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-3 text-on-surface focus:ring-1 focus:ring-primary/40 outline-none" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-outline uppercase tracking-widest">{t('listings.table.status')}</label>
                    <div className="w-full bg-surface-container-lowest border-none rounded-lg p-3 flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${selectedLocation.isSynced ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                      <span className="text-sm font-medium">{selectedLocation.isSynced ? t('listings.status.synced') : t('listings.status.pending')}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-outline-variant/10">
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-[10px] font-bold text-outline uppercase tracking-widest">{t('listings.businessHours')}</label>
                  </div>
                  <div className="space-y-3">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                      <div key={day} className="flex items-center justify-between bg-surface-container-low p-3 rounded-lg">
                        <div className="flex items-center gap-3 w-1/3">
                          <Calendar className="text-outline w-4 h-4" />
                          <span className="text-sm font-medium">{t(`listings.days.${day.toLowerCase()}`)}</span>
                        </div>
                        <div className="flex-1">
                          <input 
                            type="text" 
                            value={formData.businessHours?.[day] || ''} 
                            onChange={(e) => setFormData({
                              ...formData, 
                              businessHours: { ...formData.businessHours, [day]: e.target.value }
                            })}
                            className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-2 text-sm text-on-surface focus:ring-1 focus:ring-primary/40 outline-none" 
                            placeholder="e.g., 09:00 AM - 05:00 PM or Closed"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-6">
                  <div>
                    {saveMessage && (
                      <span className={`text-sm font-bold ${saveMessage.type === 'success' ? 'text-emerald-500' : 'text-error'}`}>
                        {saveMessage.text}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        setFormData({
                          phone: selectedLocation.phone || '',
                          businessHours: selectedLocation.businessHours || {}
                        });
                      }}
                      className="px-6 py-2.5 rounded-lg font-bold text-sm text-outline hover:text-on-surface transition-colors"
                    >
                      {t('listings.discard')}
                    </button>
                    <button 
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-8 py-2.5 rounded-lg font-bold text-sm text-on-primary bg-primary hover:brightness-105 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSaving ? 'Saving...' : t('listings.save')}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Secondary Column: Preview / Map */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <MapPin className="text-outline w-5 h-5" />
            {t('listings.mapPresence')}
          </h3>
          <div className="bg-surface-container rounded-2xl overflow-hidden h-64 relative">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDjgI71V05cShr9OjccJ7rmogv52QZ0tQF92rUIndjLubSejSSWuECk-4ML-iVOcVAHn9wy_JAPLl7uHB8mrLHcEs5DnpOMcMBWXH1E_PZdEMoHwOAA8WlwZWok_xV1a5YtUSz4gRElgad-FSvzxPsZ8OdPOdjvFTdg5rc-1r6yM06oqq1ze3O6MBoCVGE6R4QS18CsYnMAHKZ3zlZTm-8nalE8a8rXfeJBOJ6M74Q6Ww8Q8g6CJKPISZvsmoE42TY4Btm1gpluyGs" 
              alt="Map" 
              className="w-full h-full object-cover opacity-50 grayscale contrast-125"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface-container via-transparent to-transparent"></div>
            <div className="absolute bottom-4 left-4 right-4 bg-surface-container-highest/80 backdrop-blur-md p-3 rounded-lg flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center shrink-0">
                <MapPin className="text-primary w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-outline uppercase tracking-tighter">{t('listings.verifiedPosition')}</p>
                <p className="text-xs font-bold truncate">{selectedLocation?.address || 'No location selected'}</p>
              </div>
            </div>
          </div>

          <div className="bg-surface-container rounded-2xl p-6 space-y-4">
            <h4 className="text-[10px] font-bold text-on-surface uppercase tracking-widest">{t('listings.searchPerformance')}</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-outline">{t('listings.directSearches')}</span>
                <span className="text-on-surface font-bold">1,204</span>
              </div>
              <div className="w-full h-1 bg-surface-container-low rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[75%]"></div>
              </div>
              <div className="flex items-center justify-between text-xs pt-2">
                <span className="text-outline">{t('listings.discoverySearches')}</span>
                <span className="text-on-surface font-bold">4,892</span>
              </div>
              <div className="w-full h-1 bg-surface-container-low rounded-full overflow-hidden">
                <div className="h-full bg-tertiary w-[90%]"></div>
              </div>
            </div>
            <button 
              onClick={() => alert('Detailed analytics will be available once API is connected.')}
              className="w-full mt-4 py-2 text-xs font-bold text-primary border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors uppercase tracking-widest"
            >
              {t('listings.viewAnalytics')}
            </button>
          </div>
        </div>
      </section>
    </motion.div>
  );
}

function SyncRow({ platform, initial, initialColor, status, statusColor, consistency, action, isError, onActionClick }: any) {
  return (
    <tr className="hover:bg-surface-container-high/40 transition-colors group">
      <td className="px-6 py-5">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center font-bold ${initialColor}`}>
            {initial}
          </div>
          <span className="font-bold text-sm">{platform}</span>
        </div>
      </td>
      <td className="px-6 py-5">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${statusColor} ${isError ? 'animate-pulse' : ''}`}></span>
          <span className={`text-sm font-medium ${isError ? 'text-error' : ''}`}>{status}</span>
        </div>
      </td>
      <td className="px-6 py-5">
        <span className="text-sm font-bold">{consistency}</span>
      </td>
      <td className="px-6 py-5 text-right">
        {action ? (
          <button 
            onClick={onActionClick}
            className="px-4 py-1.5 rounded-md bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-all disabled:opacity-50"
          >
            {action}
          </button>
        ) : isError ? (
          <button className="p-2 rounded-md bg-error/10 text-error hover:bg-error/20" title="Resolve Issue">
            <AlertTriangle className="w-5 h-5" />
          </button>
        ) : (
          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="p-2 rounded-md hover:bg-surface-container-highest text-primary" title="Sync Now">
              <RefreshCw className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-md hover:bg-surface-container-highest text-outline" title="Lock Data">
              <Unlock className="w-5 h-5" />
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
