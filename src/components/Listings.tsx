import React, { useEffect, useState, useCallback } from 'react';
import {
  RefreshCw, AlertTriangle, Edit, MapPin, Calendar, X, Plus,
  ChevronDown, Search, Check, Loader2, Link2, Unlink, ExternalLink,
  PlusCircle, Trash2, Globe, Star
} from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GooglePlace {
  placeId: string;
  name: string;
  address: string;
  phone?: string;
  location?: { lat: number; lng: number };
  rating?: number;
}

interface Location {
  id: string;
  name: string;
  address: string;
  phone?: string;
  googlePlaceId?: string;
  embedSocialLocationId?: string;
  isSynced: boolean;
  businessHours?: any;
}

// ---------------------------------------------------------------------------
// Listings component
// ---------------------------------------------------------------------------

export function Listings({ setActiveTab }: { setActiveTab?: (tab: string) => void }) {
  const { t } = useLanguage();

  // ── State ──────────────────────────────────────────────────────────────
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  // Google OAuth + Places API status
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googlePlacesKeyMissing, setGooglePlacesKeyMissing] = useState(false);

  // EmbedSocial status
  const [embedSocialConnected, setEmbedSocialConnected] = useState(false);
  const [embedSocialSources, setEmbedSocialSources] = useState<any[]>([]);
  const [isLoadingSources, setIsLoadingSources] = useState(false);

  // Add / Edit location modal
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPlaceId, setFormPlaceId] = useState('');

  // Place search (inside modal)
  const [showPlaceSearch, setShowPlaceSearch] = useState(false);
  const [placeSearchQuery, setPlaceSearchQuery] = useState('');
  const [placeSearchResults, setPlaceSearchResults] = useState<GooglePlace[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [placeSearchError, setPlaceSearchError] = useState<string | null>(null);

  // Place ID manual validation
  const [isValidatingPlaceId, setIsValidatingPlaceId] = useState(false);
  const [placeIdError, setPlaceIdError] = useState<string | null>(null);
  const [placeIdInfo, setPlaceIdInfo] = useState<GooglePlace | null>(null);

  // Business hours
  const [businessHours, setBusinessHours] = useState<Record<string, string>>({});
  const defaultHours: Record<string, string> = {
    Monday: '09:00 AM - 05:00 PM',
    Tuesday: '09:00 AM - 05:00 PM',
    Wednesday: '09:00 AM - 05:00 PM',
    Thursday: '09:00 AM - 05:00 PM',
    Friday: '09:00 AM - 05:00 PM',
    Saturday: 'Closed',
    Sunday: 'Closed',
  };

  // Save / delete
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync status
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchData = useCallback(async () => {
    try {
      const [locRes, settingsRes] = await Promise.all([
        fetch('/api/locations'),
        fetch('/api/settings'),
      ]);

      if (locRes.ok) {
        const locs: Location[] = await locRes.json();
        setLocations(locs);
        if (locs.length > 0 && !selectedLocation) {
          setSelectedLocation(locs[0]);
        }
      }

      if (settingsRes.ok) {
        const s = await settingsRes.json();
        setGoogleConnected(s.googleConnected ?? false);
        setGooglePlacesKeyMissing(!s.googlePlacesApiKey);
        setEmbedSocialConnected(s.embedSocialConnected ?? false);
      }
    } catch (e) {
      console.error('Failed to fetch data', e);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchData(); }, [fetchData]);

  // Fetch EmbedSocial sources when connected
  useEffect(() => {
    if (!embedSocialConnected) return;
    setIsLoadingSources(true);
    fetch('/api/embedsocial/locations')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.data) setEmbedSocialSources(data.data);
      })
      .catch(() => {})
      .finally(() => setIsLoadingSources(false));
  }, [embedSocialConnected]);

  // ---------------------------------------------------------------------------
  // Selected location → populate editor
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!selectedLocation) { setBusinessHours(defaultHours); return; }

    let hours = defaultHours;
    const raw = selectedLocation.businessHours;
    if (raw) {
      try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (parsed && typeof parsed === 'object') hours = { ...defaultHours, ...parsed };
      } catch { /* use default */ }
    }
    setBusinessHours(hours);
  }, [selectedLocation]);

  // ---------------------------------------------------------------------------
  // Modal helpers
  // ---------------------------------------------------------------------------

  function openAdd() {
    setModalMode('add');
    setEditingId(null);
    setFormName(''); setFormAddress(''); setFormPhone('');
    setFormPlaceId(''); setPlaceIdInfo(null); setPlaceIdError(null);
    setShowPlaceSearch(false); setPlaceSearchResults([]);
    setSaveMsg(null);
    setShowModal(true);
  }

  function openEdit(loc: Location) {
    setModalMode('edit');
    setEditingId(loc.id);
    setFormName(loc.name);
    setFormAddress(loc.address);
    setFormPhone(loc.phone || '');
    setFormPlaceId(loc.googlePlaceId || '');
    setPlaceIdInfo(null); setPlaceIdError(null);
    setShowPlaceSearch(false); setPlaceSearchResults([]);
    setSaveMsg(null);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setPlaceIdInfo(null); setPlaceIdError(null);
  }

  // ---------------------------------------------------------------------------
  // Google Places search
  // ---------------------------------------------------------------------------

  async function searchPlaces() {
    if (!placeSearchQuery.trim()) return;
    setIsSearchingPlaces(true);
    setPlaceSearchError(null);
    try {
      const res = await fetch(`/api/google/places/search?query=${encodeURIComponent(placeSearchQuery)}`);
      const data = await res.json();
      if (data.setupRequired) {
        setPlaceSearchError('Google Places API key is missing. Add it in Settings → API Keys.');
      } else if (data.error) {
        setPlaceSearchError(data.error);
      } else {
        setPlaceSearchResults(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      setPlaceSearchError('Search failed. Check your connection.');
    } finally {
      setIsSearchingPlaces(false);
    }
  }

  function selectPlace(place: GooglePlace) {
    setFormName(place.name);
    setFormAddress(place.address);
    setFormPhone(place.phone || '');
    setFormPlaceId(place.placeId);
    setPlaceIdInfo(place);
    setPlaceIdError(null);
    setShowPlaceSearch(false);
    setPlaceSearchResults([]);
    setPlaceSearchQuery('');
  }

  // ---------------------------------------------------------------------------
  // Validate a manually typed Place ID
  // ---------------------------------------------------------------------------

  async function validatePlaceId() {
    if (!formPlaceId.trim()) return;
    setIsValidatingPlaceId(true);
    setPlaceIdError(null);
    setPlaceIdInfo(null);
    try {
      const res = await fetch('/api/google/validate-place-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeId: formPlaceId.trim() }),
      });
      const data = await res.json();
      if (data.setupRequired) {
        setPlaceIdError('Google Places API key missing. Add it in Settings → API Keys.');
      } else if (!data.valid) {
        setPlaceIdError(data.error || 'Invalid Place ID');
      } else {
        setPlaceIdInfo(data.place);
        // Auto-fill name/address if form is empty
        if (!formName) setFormName(data.place.name);
        if (!formAddress) setFormAddress(data.place.address);
        if (!formPhone && data.place.phone) setFormPhone(data.place.phone);
      }
    } catch {
      setPlaceIdError('Validation failed. Try again.');
    } finally {
      setIsValidatingPlaceId(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Save (create or update)
  // ---------------------------------------------------------------------------

  async function handleSave() {
    if (!formName.trim()) { setSaveMsg({ type: 'error', text: 'Location name is required.' }); return; }
    setIsSaving(true);
    setSaveMsg(null);
    try {
      const payload = {
        name: formName.trim(),
        address: formAddress.trim(),
        phone: formPhone.trim(),
        googlePlaceId: formPlaceId.trim() || null,
      };

      let res: Response;
      if (modalMode === 'add') {
        res = await fetch('/api/locations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      } else {
        res = await fetch(`/api/locations/${editingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      }

      if (res.ok) {
        setSaveMsg({ type: 'success', text: modalMode === 'add' ? 'Location added.' : 'Location updated.' });
        await fetchData();
        setTimeout(closeModal, 1000);
      } else {
        const err = await res.json();
        setSaveMsg({ type: 'error', text: err.error || 'Save failed.' });
      }
    } catch {
      setSaveMsg({ type: 'error', text: 'Network error. Try again.' });
    } finally {
      setIsSaving(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------

  async function handleDelete() {
    if (!editingId || !confirm(`Delete "${formName}"? This cannot be undone.`)) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/locations/${editingId}`, { method: 'DELETE' });
      if (res.ok) {
        setLocations(prev => prev.filter(l => l.id !== editingId));
        if (selectedLocation?.id === editingId) setSelectedLocation(null);
        closeModal();
      }
    } finally {
      setIsDeleting(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Save business hours for selected location
  // ---------------------------------------------------------------------------

  async function saveHours() {
    if (!selectedLocation) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/locations/${selectedLocation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: selectedLocation.phone, businessHours: JSON.stringify(businessHours) }),
      });
      if (res.ok) {
        setSaveMsg({ type: 'success', text: 'Hours saved!' });
        await fetchData();
      }
    } catch { /* ignore */ }
    finally { setIsSaving(false); setTimeout(() => setSaveMsg(null), 2500); }
  }

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const mapEmbedSrc = selectedLocation?.address
    ? `https://maps.google.com/maps?q=${encodeURIComponent(selectedLocation.address)}&output=embed&z=15`
    : null;

  const placeIdDisplay = selectedLocation?.googlePlaceId
    ? selectedLocation.googlePlaceId
    : null;

  const hasGoogleSetup = googleConnected && !googlePlacesKeyMissing;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 md:p-8 space-y-8 max-w-[1400px] mx-auto w-full pb-20"
    >

      {/* ── Page header ───────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 border-b border-outline-variant/10 pb-8">
        <div className="space-y-1">
          <div className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">
            Directory Management
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight text-on-surface">{t('listings.title')}</h2>
          <p className="text-secondary font-medium max-w-lg">{t('listings.subtitle')}</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-surface-container p-4 rounded-xl min-w-[140px] text-right">
            <p className="text-[10px] font-bold uppercase tracking-tighter text-outline-variant mb-1">Locations</p>
            <p className="text-2xl font-black text-primary">{locations.length}</p>
          </div>
        </div>
      </div>

      {/* ── Setup banners ─────────────────────────────────────────────── */}

      {/* EmbedSocial not connected */}
      {!embedSocialConnected && (
        <Banner type="info" title="Connect EmbedSocial to sync reviews" body={
          <>Add your EmbedSocial API key in Settings to sync Google reviews.{' '}
            <button onClick={() => setActiveTab('settings')} className="underline font-semibold">Go to Settings</button>
          </>
        } />
      )}

      {/* EmbedSocial connected but no locations */}
      {embedSocialConnected && locations.length === 0 && (
        <Banner type="success" title="EmbedSocial connected" body="Add your first location below and link it to an EmbedSocial source to start syncing reviews." />
      )}

      {/* No Places API key */}
      {googlePlacesKeyMissing && (
        <Banner type="warning" title="Google Places API Key missing" body={
          <>Search for a business requires a Google Places API key.{' '}
            <button onClick={goToSettings} className="underline font-semibold">Add it in Settings → API Keys</button>
          </>
        } />
      )}

      {/* ── Location selector + Add button ─────────────────────────────── */}

      <div className="flex items-center gap-4">
        {locations.length > 1 && (
          <div className="relative">
            <select
              className="appearance-none bg-surface-container border border-outline-variant/20 rounded-lg pl-4 pr-10 py-2.5 text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
              value={selectedLocation?.id || ''}
              onChange={e => setSelectedLocation(locations.find(l => l.id === e.target.value) || null)}
            >
              {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline pointer-events-none" />
          </div>
        )}
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-primary text-on-primary hover:brightness-105 transition-all shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" /> Add Location
        </button>
      </div>

      {/* ── Two-column editor ─────────────────────────────────────────── */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left: store info editor */}
        <div className="lg:col-span-2 space-y-6">
          <SectionHeader icon={Edit} label="Store Details" />

          {!selectedLocation ? (
            <EmptyState onAdd={openAdd} />
          ) : (
            <div className="bg-surface-container rounded-2xl p-8 space-y-8">

              {/* Name + Place ID row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Location Name">
                  <input value={selectedLocation.name} readOnly className="field-readonly" />
                </Field>

                <Field
                  label={
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" /> Google Place ID
                      {placeIdDisplay
                        ? <span className="ml-1 px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 text-[10px] rounded font-bold">Linked</span>
                        : <span className="ml-1 px-1.5 py-0.5 bg-amber-500/10 text-amber-600 text-[10px] rounded font-bold">Not linked</span>
                      }
                    </span>
                  }
                  hint="Link to your Google Business Profile so reviews can sync."
                >
                  <div className="flex items-center gap-2">
                    <input
                      value={placeIdDisplay || ''}
                      readOnly
                      placeholder="No Place ID — click Edit to add one"
                      className="field-readonly flex-1 font-mono text-xs"
                    />
                    <button
                      onClick={() => openEdit(selectedLocation)}
                      className="shrink-0 px-3 py-2 rounded-lg bg-surface-container-highest text-primary text-xs font-bold hover:bg-primary/10 transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                </Field>

                <Field label="Address">
                  <input value={selectedLocation.address} readOnly className="field-readonly" />
                </Field>

                <Field label="Phone">
                  <input
                    value={selectedLocation.phone || ''}
                    readOnly
                    className="field-readonly"
                  />
                </Field>
              </div>

              {/* Business hours */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-widest flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Business Hours
                  </label>
                  <button
                    onClick={() => setBusinessHours(defaultHours)}
                    className="text-xs text-outline hover:text-on-surface transition-colors"
                  >
                    Reset to default
                  </button>
                </div>
                <div className="space-y-2">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                    <div key={day} className="flex items-center gap-3 bg-surface-container-low p-3 rounded-lg">
                      <span className="text-sm font-medium w-28 shrink-0">{day}</span>
                      <input
                        type="text"
                        value={businessHours[day] || ''}
                        onChange={e => setBusinessHours(prev => ({ ...prev, [day]: e.target.value }))}
                        placeholder="e.g. 09:00 AM - 05:00 PM"
                        className="flex-1 bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-2 text-sm text-on-surface focus:ring-1 focus:ring-primary/50 outline-none"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-end mt-4">
                  {saveMsg && (
                    <span className={`text-sm font-bold mr-4 ${saveMsg.type === 'success' ? 'text-emerald-500' : 'text-error'}`}>
                      {saveMsg.text}
                    </span>
                  )}
                  <button
                    onClick={saveHours}
                    disabled={isSaving}
                    className="px-6 py-2.5 rounded-lg font-bold text-sm bg-primary text-on-primary hover:brightness-105 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isSaving ? 'Saving...' : 'Save Hours'}
                  </button>
                </div>
              </div>

              {/* Danger zone */}
              <div className="pt-6 border-t border-outline-variant/10">
                <p className="text-[10px] font-bold text-error uppercase tracking-widest mb-3">Danger Zone</p>
                <button
                  onClick={() => { if (confirm(`Delete "${selectedLocation.name}"?`)) { fetch(`/api/locations/${selectedLocation.id}`, { method: 'DELETE' }).then(() => { setLocations(prev => prev.filter(l => l.id !== selectedLocation.id)); setSelectedLocation(null); }); } }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-error/30 text-error text-sm font-medium hover:bg-error/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Delete this location
                </button>
              </div>

            </div>
          )}
        </div>

        {/* Right: map + quick stats */}
        <div className="space-y-6">

          {/* Map */}
          <SectionHeader icon={MapPin} label="Map Presence" />
          <div className="bg-surface-container rounded-2xl overflow-hidden h-64 relative">
            {mapEmbedSrc ? (
              <iframe
                title="Store location"
                src={mapEmbedSrc}
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-outline">
                <MapPin className="w-10 h-10 opacity-30" />
                <p className="text-sm">Add a location to see it on the map</p>
              </div>
            )}
            {selectedLocation && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-surface-container-highest/90 to-transparent p-4 backdrop-blur-sm">
                <p className="text-xs font-bold text-on-surface truncate">{selectedLocation.name}</p>
                <p className="text-[10px] text-outline truncate">{selectedLocation.address}</p>
              </div>
            )}
          </div>

          {/* Sync card */}
          <SyncCard
            googleConnected={googleConnected}
            embedSocialConnected={embedSocialConnected}
            placeIdSet={!!selectedLocation?.embedSocialLocationId}
            locationsCount={locations.length}
            onConnectGoogle={() => setActiveTab('settings')}
          />
        </div>
      </div>

      {/* ── Add / Edit Location Modal ─────────────────────────────────── */}

      {showModal && (
        <Modal onClose={closeModal}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">{modalMode === 'add' ? 'Add New Location' : 'Edit Location'}</h3>
            <button onClick={closeModal} className="p-1 hover:bg-surface-container rounded"><X className="w-5 h-5" /></button>
          </div>

          {/* Google link section */}
          <div className="mb-6 p-4 bg-surface-container-low rounded-xl border border-outline-variant/20">
            <div className="flex items-center gap-2 mb-3">
              <Link2 className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold">Link to Google Business Profile</span>
            </div>

            {/* Search toggle */}
            <div className="flex items-center gap-3 mb-3">
              <button
                onClick={() => { setShowPlaceSearch(true); setPlaceIdError(null); setPlaceIdInfo(null); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${showPlaceSearch ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'}`}
              >
                <Search className="w-3.5 h-3.5" /> Search business
              </button>
              <button
                onClick={() => { setShowPlaceSearch(false); setPlaceSearchResults([]); setPlaceSearchQuery(''); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${!showPlaceSearch ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'}`}
              >
                <Edit className="w-3.5 h-3.5" /> Enter Place ID manually
              </button>
            </div>

            {/* Search results */}
            {showPlaceSearch && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder='Try: "Mahjong mini bowl Baltimore"'
                    className="flex-1 field-input"
                    value={placeSearchQuery}
                    onChange={e => setPlaceSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && searchPlaces()}
                  />
                  <button onClick={searchPlaces} disabled={isSearchingPlaces} className="btn-primary-sm">
                    {isSearchingPlaces ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </button>
                </div>
                {placeSearchError && <p className="text-xs text-error">{placeSearchError}</p>}
                {placeSearchResults.length > 0 && (
                  <div className="max-h-48 overflow-y-auto space-y-1.5">
                    {placeSearchResults.map(p => (
                      <div
                        key={p.placeId}
                        onClick={() => selectPlace(p)}
                        className="flex items-center justify-between p-3 bg-surface-container-lowest rounded-lg hover:bg-primary/5 cursor-pointer border border-transparent hover:border-primary/20 transition-colors"
                      >
                        <div>
                          <p className="text-sm font-bold">{p.name}</p>
                          <p className="text-xs text-on-surface-variant">{p.address}</p>
                        </div>
                        <Check className="w-4 h-4 text-primary shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Manual Place ID input */}
            {!showPlaceSearch && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="ChIJr... (Google Place ID)"
                    className="flex-1 field-input font-mono text-xs"
                    value={formPlaceId}
                    onChange={e => { setFormPlaceId(e.target.value); setPlaceIdInfo(null); setPlaceIdError(null); }}
                  />
                  <button onClick={validatePlaceId} disabled={isValidatingPlaceId || !formPlaceId.trim()} className="btn-primary-sm whitespace-nowrap">
                    {isValidatingPlaceId ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Validate'}
                  </button>
                </div>
                {placeIdError && <p className="text-xs text-error">{placeIdError}</p>}
                {placeIdInfo && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Verified: {placeIdInfo.name}
                    </p>
                    <p className="text-xs text-on-surface-variant mt-0.5">{placeIdInfo.address}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Basic info form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Field label="Location Name *" required>
              <input className="field-input" value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Mahjong Mini Bowl" />
            </Field>
            <Field label="Phone">
              <input className="field-input" value={formPhone} onChange={e => setFormPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
            </Field>
            <Field label="Address" className="md:col-span-2">
              <input className="field-input" value={formAddress} onChange={e => setFormAddress(e.target.value)} placeholder="3105 St Paul St, Baltimore, MD 21218" />
            </Field>
          </div>

          {saveMsg && (
            <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${saveMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-error/10 text-error'}`}>
              {saveMsg.text}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              {modalMode === 'edit' && (
                <button onClick={handleDelete} disabled={isDeleting} className="flex items-center gap-1.5 text-sm text-error hover:bg-error/10 px-3 py-2 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" /> {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={closeModal} className="px-5 py-2.5 rounded-lg font-bold text-sm bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={isSaving} className="btn-primary">
                {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : (modalMode === 'add' ? 'Add Location' : 'Save Changes')}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------

function SectionHeader({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="text-outline w-5 h-5" />
      <h3 className="text-xl font-bold">{label}</h3>
    </div>
  );
}

function Field({ label, hint, required, className = '', children }: {
  label: React.ReactNode;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className="text-[10px] font-bold text-outline uppercase tracking-widest flex items-center gap-1">
        {label}
        {required && <span className="text-error ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[10px] text-outline leading-relaxed">{hint}</p>}
    </div>
  );
}

function Banner({ type, title, body }: { type: 'warning' | 'info' | 'success'; title: string; body?: React.ReactNode }) {
  const colors = {
    warning: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-600', icon: AlertTriangle },
    info:    { bg: 'bg-primary/10',    border: 'border-primary/30',    text: 'text-primary',    icon: Link2    },
    success: { bg: 'bg-emerald-500/10',border: 'border-emerald-500/30',text: 'text-emerald-600', icon: Check    },
  };
  const c = colors[type];
  const Icon = c.icon;
  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl ${c.bg} border ${c.border}`}>
      <Icon className={`w-5 h-5 ${c.text} shrink-0 mt-0.5`} />
      <div>
        <p className={`text-sm font-bold ${c.text}`}>{title}</p>
        {body && <p className="text-xs text-on-surface-variant mt-0.5">{body}</p>}
      </div>
    </div>
  );
}

function SyncCard({ googleConnected, embedSocialConnected, placeIdSet, locationsCount, onConnectGoogle }: {
  googleConnected: boolean;
  embedSocialConnected: boolean;
  placeIdSet: boolean;
  locationsCount: number;
  onConnectGoogle: () => void;
}) {
  const { t } = useLanguage();

  const status: { label: string; color: string; desc: string } = !embedSocialConnected
    ? { label: 'EmbedSocial not connected', color: 'bg-amber-500', desc: 'Add your EmbedSocial API key in Settings to sync reviews.' }
    : !placeIdSet
    ? { label: 'EmbedSocial Location Missing', color: 'bg-amber-500', desc: 'Link this location to an EmbedSocial source to sync reviews.' }
    : { label: 'Ready to Sync', color: 'bg-emerald-500', desc: 'Reviews will sync from EmbedSocial.' };

  return (
    <div className="bg-surface-container rounded-2xl p-6 space-y-4">
      <h4 className="text-[10px] font-bold text-outline uppercase tracking-widest flex items-center gap-2">
        <Star className="w-4 h-4" /> Review Sync Status
      </h4>

      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${status.color} animate-pulse`} />
        <span className="text-sm font-bold">{status.label}</span>
      </div>
      <p className="text-xs text-on-surface-variant leading-relaxed">{status.desc}</p>

      {!embedSocialConnected && (
        <button
          onClick={onConnectGoogle}
          className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors"
        >
          <Link2 className="w-4 h-4" /> Connect EmbedSocial
        </button>
      )}

      <div className="pt-4 border-t border-outline-variant/10 space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-outline">Locations linked</span>
          <span className="font-bold">{locationsCount}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-outline">EmbedSocial</span>
          <span className={`font-bold ${embedSocialConnected ? 'text-emerald-500' : 'text-amber-500'}`}>
            {embedSocialConnected ? 'Connected' : 'Not connected'}
          </span>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="bg-surface-container rounded-2xl p-12 text-center">
      <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center mx-auto mb-4">
        <MapPin className="text-outline w-8 h-8" />
      </div>
      <h4 className="text-lg font-bold text-on-surface mb-2">No locations yet</h4>
      <p className="text-on-surface-variant text-sm max-w-sm mx-auto mb-6">
        Add your first store to link it to Google Business Profile and start syncing reviews.
      </p>
      <button onClick={onAdd} className="px-6 py-2.5 rounded-xl font-bold text-sm bg-primary text-on-primary hover:brightness-105 transition-all">
        <Plus className="w-4 h-4 inline-block mr-2" /> Add First Location
      </button>
    </div>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-surface-container-high rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto pointer-events-auto"
        >
          {children}
        </motion.div>
      </div>
    </>
  );
}

function goToSettings() { setActiveTab?.('settings'); }
