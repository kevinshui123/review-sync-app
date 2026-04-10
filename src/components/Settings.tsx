import React, { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Save, Key, ShieldCheck, AlertCircle, Loader2, CheckCircle2, Users, Plus, Trash2, Sparkles, Unlink, ExternalLink, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';

export function Settings() {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [googleConnected, setGoogleConnected] = useState(false);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [googleLocations, setGoogleLocations] = useState<any[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [mappedLocationId, setMappedLocationId] = useState('');
  const [selectedGoogleLocation, setSelectedGoogleLocation] = useState('');

  const [formData, setFormData] = useState({
    yelpApiKey: '',
    openaiApiKey: '',
    geminiApiKey: '',
  });

  const [localLocations, setLocalLocations] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          setFormData({
            yelpApiKey: data.yelpApiKey || '',
            openaiApiKey: data.openaiApiKey || '',
            geminiApiKey: data.geminiApiKey || '',
          });
          setGoogleConnected(data.googleConnected || false);
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }
    };

    const fetchLocations = async () => {
      try {
        const res = await fetch('/api/locations');
        if (res.ok) {
          const data = await res.json();
          setLocalLocations(data);
          if (data.length > 0) {
            setMappedLocationId(data[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch locations:', error);
      }
    };

    const fetchTeam = async () => {
      try {
        const res = await fetch('/api/team');
        if (res.ok) {
          const data = await res.json();
          setTeamMembers(data);
        }
      } catch (error) {
        console.error('Failed to fetch team:', error);
      }
    };

    // Check for Google OAuth callback results
    const params = new URLSearchParams(window.location.search);
    if (params.get('googleAuthSuccess')) {
      setGoogleConnected(true);
      setGoogleError(null);
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('googleAuthError')) {
      setGoogleError(`Google authorization failed: ${params.get('googleAuthError')}`);
      window.history.replaceState({}, '', window.location.pathname);
    }

    Promise.all([fetchSettings(), fetchLocations(), fetchTeam()]).finally(() => {
      setIsLoading(false);
    });
  }, []);

  // Fetch Google locations when connected
  useEffect(() => {
    if (googleConnected) {
      fetchGoogleLocations();
    }
  }, [googleConnected]);

  const fetchGoogleLocations = async () => {
    setIsLoadingLocations(true);
    try {
      const res = await fetch('/api/google/locations');
      if (res.ok) {
        const data = await res.json();
        setGoogleLocations(data);
      } else {
        const err = await res.json();
        console.error('Failed to fetch Google locations:', err);
      }
    } catch (error) {
      console.error('Failed to fetch Google locations:', error);
    } finally {
      setIsLoadingLocations(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSaveMessage({ type: 'success', text: 'Settings saved successfully.' });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConnectGoogle = async () => {
    setIsConnectingGoogle(true);
    setGoogleError(null);
    try {
      const res = await fetch('/api/auth/google');
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to get authorization URL');
      }
      const { authUrl } = await res.json();
      window.location.href = authUrl;
    } catch (error) {
      setGoogleError(error instanceof Error ? error.message : 'Failed to connect Google');
      setIsConnectingGoogle(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    if (!confirm('Are you sure you want to disconnect your Google account? Reviews will no longer sync automatically.')) return;
    try {
      const res = await fetch('/api/auth/google/disconnect', { method: 'POST' });
      if (res.ok) {
        setGoogleConnected(false);
        setGoogleLocations([]);
      }
    } catch (error) {
      console.error('Failed to disconnect Google:', error);
    }
  };

  const handleMapLocation = async () => {
    if (!mappedLocationId || !selectedGoogleLocation) return;
    try {
      const res = await fetch('/api/google/locations/map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          localLocationId: mappedLocationId,
          googleLocationId: selectedGoogleLocation,
        }),
      });
      if (res.ok) {
        alert('Location mapped successfully! You can now sync reviews.');
      } else {
        const err = await res.json();
        alert(`Failed to map location: ${err.error}`);
      }
    } catch (error) {
      console.error('Failed to map location:', error);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail) return;
    setIsAddingMember(true);
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newMemberEmail }),
      });
      if (res.ok) {
        const member = await res.json();
        setTeamMembers([...teamMembers, member]);
        setNewMemberEmail('');
      }
    } catch (error) {
      console.error('Failed to add member:', error);
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = async (id: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;
    try {
      const res = await fetch(`/api/team/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTeamMembers(teamMembers.filter((m) => m.id !== id));
      }
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 md:p-8 space-y-10 max-w-[1000px] mx-auto w-full pb-20"
    >
      <div className="space-y-2 border-b border-outline-variant/10 pb-10">
        <div className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">
          Configuration
        </div>
        <h2 className="text-4xl font-extrabold tracking-tight text-on-surface flex items-center gap-3">
          <SettingsIcon className="w-10 h-10 text-primary" />
          {t('settings.title')}
        </h2>
        <p className="text-secondary font-medium max-w-2xl">
          {t('settings.subtitle')}
        </p>
      </div>

      {saveMessage && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${saveMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-error/10 text-error'}`}>
          {saveMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-medium text-sm">{saveMessage.text}</span>
        </div>
      )}

      <div className="space-y-8">

        {/* Google Business Profile Section */}
        <section className="bg-surface-container rounded-2xl p-8 border border-outline-variant/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <div className="flex items-start gap-4 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
                <path d="M42.3 21.6C42.3 16.8 39.3 12.6 35.4 10.5L24 8.1L12.6 10.5C8.7 12.6 5.7 16.8 5.7 21.6C5.7 26.4 8.7 30.6 12.6 32.7L24 35.1L35.4 32.7C39.3 30.6 42.3 26.4 42.3 21.6Z" fill="#4285F4"/>
                <path d="M24 35.1L12.6 32.7C8.7 30.6 5.7 26.4 5.7 21.6C5.7 16.8 8.7 12.6 12.6 10.5L24 8.1V35.1Z" fill="#34A853"/>
                <path d="M24 35.1V8.1L35.4 10.5C39.3 12.6 42.3 16.8 42.3 21.6C42.3 26.4 39.3 30.6 35.4 32.7L24 35.1Z" fill="#FBBC05"/>
                <path d="M24 42.9L12.6 40.5C8.7 38.4 5.7 34.2 5.7 29.4C5.7 24.6 8.7 20.4 12.6 18.3L24 15.9L24 42.9Z" fill="#EA4335"/>
                <path d="M24 42.9L24 15.9L35.4 18.3C39.3 20.4 42.3 24.6 42.3 29.4C42.3 34.2 39.3 38.4 35.4 40.5L24 42.9Z" fill="#C5221F"/>
              </svg>
            </div>
            <div className="space-y-6 flex-1">
              <div>
                <h3 className="text-xl font-bold text-on-surface">Google Business Profile</h3>
                <p className="text-sm text-on-surface-variant mt-1">
                  Connect your Google account to sync reviews and reply directly via the Google Business Profile API.
                </p>
              </div>

              {googleError && (
                <div className="bg-error/10 text-error p-4 rounded-lg flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span className="text-sm">{googleError}</span>
                </div>
              )}

              {googleConnected ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                    <div>
                      <p className="font-bold text-emerald-700 dark:text-emerald-400">Google account connected</p>
                      <p className="text-sm text-emerald-600/70 dark:text-emerald-400/70">Reviews will sync directly from Google API</p>
                    </div>
                    <button
                      onClick={handleDisconnectGoogle}
                      className="ml-auto flex items-center gap-2 px-4 py-2 text-error hover:bg-error/10 rounded-lg transition-colors text-sm font-medium"
                    >
                      <Unlink className="w-4 h-4" />
                      Disconnect
                    </button>
                  </div>

                  {/* Location Mapping */}
                  <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant/20 space-y-4">
                    <div>
                      <p className="text-xs font-bold text-outline uppercase tracking-widest flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Map Local Location to Google Business
                      </p>
                      <p className="text-xs text-on-surface-variant mt-1">
                        Link your local location to a Google Business Profile to enable review syncing and replies.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-outline uppercase tracking-widest">Local Location</label>
                        <select
                          value={mappedLocationId}
                          onChange={(e) => setMappedLocationId(e.target.value)}
                          className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-3 text-sm text-on-surface focus:ring-2 focus:ring-primary/50 outline-none"
                        >
                          <option value="">Select a location...</option>
                          {localLocations.map((loc) => (
                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-outline uppercase tracking-widest">Google Business Profile</label>
                        <select
                          value={selectedGoogleLocation}
                          onChange={(e) => setSelectedGoogleLocation(e.target.value)}
                          className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-3 text-sm text-on-surface focus:ring-2 focus:ring-primary/50 outline-none"
                          disabled={isLoadingLocations}
                        >
                          <option value="">Select Google location...</option>
                          {googleLocations.map((loc) => (
                            <option key={loc.googleLocationId} value={loc.googleLocationId}>
                              {loc.name} {loc.address ? `- ${loc.address}` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={handleMapLocation}
                      disabled={!mappedLocationId || !selectedGoogleLocation}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all disabled:opacity-50"
                    >
                      <MapPin className="w-4 h-4" />
                      Map This Location
                    </button>

                    {isLoadingLocations && (
                      <div className="flex items-center gap-2 text-sm text-outline">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading Google locations...
                      </div>
                    )}

                    {googleLocations.length === 0 && !isLoadingLocations && googleConnected && (
                      <p className="text-xs text-on-surface-variant">
                        No Google Business locations found. Make sure you have a verified Google Business Profile.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-on-surface-variant">
                    You need a Google Cloud project with the Business Profile API enabled. Get your OAuth credentials from the Google Cloud Console.
                  </p>
                  <a
                    href="https://console.cloud.google.com/apis/library/businessprofileinformation.googleapis.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm bg-primary text-on-primary hover:brightness-105 transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Enable Business Profile API
                  </a>
                  <button
                    onClick={handleConnectGoogle}
                    disabled={isConnectingGoogle}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-primary text-on-primary hover:brightness-105 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                  >
                    {isConnectingGoogle ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                      <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
                        <path d="M42.3 21.6C42.3 16.8 39.3 12.6 35.4 10.5L24 8.1L12.6 10.5C8.7 12.6 5.7 16.8 5.7 21.6C5.7 26.4 8.7 30.6 12.6 32.7L24 35.1L35.4 32.7C39.3 30.6 42.3 26.4 42.3 21.6Z" fill="#4285F4"/>
                        <path d="M24 35.1L12.6 32.7C8.7 30.6 5.7 26.4 5.7 21.6C5.7 16.8 8.7 12.6 12.6 10.5L24 8.1V35.1Z" fill="#34A853"/>
                        <path d="M24 35.1V8.1L35.4 10.5C39.3 12.6 42.3 16.8 42.3 21.6C42.3 26.4 39.3 30.6 35.4 32.7L24 35.1Z" fill="#FBBC05"/>
                        <path d="M24 42.9L12.6 40.5C8.7 38.4 5.7 34.2 5.7 29.4C5.7 24.6 8.7 20.4 12.6 18.3L24 15.9L24 42.9Z" fill="#EA4335"/>
                        <path d="M24 42.9L24 15.9L35.4 18.3C39.3 20.4 42.3 24.6 42.3 29.4C42.3 34.2 39.3 38.4 35.4 40.5L24 42.9Z" fill="#C5221F"/>
                      </svg>
                    )}
                    Connect Google Account
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* AI Models API Section */}
        <section className="bg-surface-container rounded-2xl p-8 border border-outline-variant/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <div className="flex items-start gap-4 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div className="space-y-6 flex-1">
              <div>
                <h3 className="text-xl font-bold text-on-surface">AI Models API</h3>
                <p className="text-sm text-on-surface-variant mt-1">
                  Configure API keys for AI providers to power intelligent review replies and listing optimizations.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-widest">OpenAI API Key</label>
                  <input
                    type="password"
                    name="openaiApiKey"
                    value={formData.openaiApiKey}
                    onChange={handleChange}
                    placeholder="sk-..."
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-3 text-sm text-on-surface focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-widest">{t('settings.geminiApiKey')}</label>
                  <input
                    type="password"
                    name="geminiApiKey"
                    value={formData.geminiApiKey}
                    onChange={handleChange}
                    placeholder="AIza..."
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-3 text-sm text-on-surface focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                  />
                  <p className="text-xs text-outline mt-1">
                    If left blank, the system will use the default platform-managed Gemini key.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Yelp API Section */}
        <section className="bg-surface-container rounded-2xl p-8 border border-outline-variant/20 opacity-70 hover:opacity-100 transition-opacity">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center shrink-0">
              <Key className="w-6 h-6 text-on-surface" />
            </div>
            <div className="space-y-6 flex-1">
              <div>
                <h3 className="text-xl font-bold text-on-surface flex items-center gap-3">
                  Yelp Fusion API
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-surface-variant text-on-surface-variant px-2 py-0.5 rounded">Coming Soon</span>
                </h3>
                <p className="text-sm text-on-surface-variant mt-1">Required to sync Yelp reviews and business information.</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-outline uppercase tracking-widest">Yelp API Key</label>
                <input
                  type="password"
                  name="yelpApiKey"
                  value={formData.yelpApiKey}
                  onChange={handleChange}
                  placeholder="Enter your Yelp API Key"
                  className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-3 text-sm text-on-surface focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </section>

        <div className="flex justify-end pt-6 border-b border-outline-variant/10 pb-10">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm text-on-primary bg-primary hover:brightness-105 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {isSaving ? t('settings.saving') : t('settings.saveBtn')}
          </button>
        </div>

        {/* Team Members Section */}
        <section className="bg-surface-container rounded-2xl p-8 border border-outline-variant/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-on-surface" />
            </div>
            <div className="space-y-6 flex-1">
              <div>
                <h3 className="text-xl font-bold text-on-surface">{t('settings.teamMembers')}</h3>
                <p className="text-sm text-on-surface-variant mt-1">{t('settings.teamMembersDesc')}</p>
              </div>

              <form onSubmit={handleAddMember} className="flex gap-3">
                <input
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder={t('settings.enterEmail')}
                  className="flex-1 bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-3 text-sm text-on-surface focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                  required
                />
                <button
                  type="submit"
                  disabled={isAddingMember || !newMemberEmail}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm text-on-primary bg-primary hover:brightness-105 transition-all disabled:opacity-50"
                >
                  {isAddingMember ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {t('settings.addMember')}
                </button>
              </form>

              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 overflow-hidden">
                {teamMembers.length === 0 ? (
                  <div className="p-6 text-center text-sm text-on-surface-variant">
                    {t('settings.noMembers')}
                  </div>
                ) : (
                  <ul className="divide-y divide-outline-variant/10">
                    {teamMembers.map((member) => (
                      <li key={member.id} className="p-4 flex items-center justify-between hover:bg-surface-container-high/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs uppercase">
                            {member.email.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-on-surface">{member.email}</p>
                            <p className="text-[10px] text-outline">{t('settings.added')} {new Date(member.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors"
                          title={t('settings.removeMember')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  );
}
