import React, { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Save, Key, AlertCircle, Loader2, CheckCircle2, Users, Plus, Trash2, Sparkles, ExternalLink, Copy, Refresh, Store, Link, Unlink } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';

interface TenantListing {
  id: string;
  embedSocialListingId: string;
  name: string;
  address?: string;
  phoneNumber?: string;
  status: string;
  connectedAt: string;
}

interface AvailableListing {
  id: string;
  name: string;
  address?: string;
  phoneNumber?: string;
}

export function Settings() {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [formData, setFormData] = useState({
    yelpApiKey: '',
    openaiApiKey: '',
    geminiApiKey: '',
    embedSocialApiKey: '',
  });

  const [embedSocialConnected, setEmbedSocialConnected] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  // Merchant management
  const [tenantListings, setTenantListings] = useState<TenantListing[]>([]);
  const [availableListings, setAvailableListings] = useState<AvailableListing[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Invite link (your EmbedSocial token - this is specific to your account)
  const INVITE_LINK = 'https://embedsocial.com/app/public/grant_listing_access?token=esb7ebfffb58b61f1e223b7dabf36a48';

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
            embedSocialApiKey: data.embedSocialApiKey || '',
          });
          setEmbedSocialConnected(data.embedSocialConnected || false);
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
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

    Promise.all([fetchSettings(), fetchTeam()]).finally(() => {
      setIsLoading(false);
    });
  }, []);

  // Fetch connected listings when modal opens
  useEffect(() => {
    if (showConnectModal && embedSocialConnected) {
      fetchConnectedListings();
      fetchAvailableListings();
    }
  }, [showConnectModal, embedSocialConnected]);

  const fetchConnectedListings = async () => {
    setLoadingListings(true);
    try {
      const res = await fetch('/api/tenant/listings');
      if (res.ok) {
        const data = await res.json();
        setTenantListings(data);
      }
    } catch (error) {
      console.error('Failed to fetch connected listings:', error);
    } finally {
      setLoadingListings(false);
    }
  };

  const fetchAvailableListings = async () => {
    try {
      const res = await fetch('/api/embedsocial/listings/available');
      if (res.ok) {
        const data = await res.json();
        setAvailableListings(data);
      }
    } catch (error) {
      console.error('Failed to fetch available listings:', error);
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

  const handleTestConnection = async () => {
    if (!formData.embedSocialApiKey) return;
    setTestingConnection(true);
    try {
      const res = await fetch('/api/settings/test-embedsocial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: formData.embedSocialApiKey }),
      });
      if (res.ok) {
        const data = await res.json();
        setSaveMessage({ type: 'success', text: `Connected! Found ${data.listingCount} listings.` });
        setEmbedSocialConnected(true);
      } else {
        const error = await res.json();
        setSaveMessage({ type: 'error', text: error.message || 'Connection failed' });
      }
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Failed to test connection' });
    } finally {
      setTestingConnection(false);
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

  const handleConnectListing = async (listingId: string, name: string) => {
    try {
      const res = await fetch('/api/embedsocial/listings/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embedSocialListingId: listingId, name }),
      });
      if (res.ok) {
        fetchConnectedListings();
        fetchAvailableListings();
      }
    } catch (error) {
      console.error('Failed to connect listing:', error);
    }
  };

  const handleDisconnectListing = async (listingId: string) => {
    if (!confirm('Are you sure you want to disconnect this listing?')) return;
    try {
      const res = await fetch(`/api/embedsocial/listings/${listingId}/disconnect`, { method: 'DELETE' });
      if (res.ok) {
        fetchConnectedListings();
        fetchAvailableListings();
      }
    } catch (error) {
      console.error('Failed to disconnect listing:', error);
    }
  };

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(INVITE_LINK);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-slate-500">Loading settings...</p>
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

        {/* EmbedSocial Section - Merchant Connection */}
        <section className="bg-surface-container rounded-2xl p-8 border border-outline-variant/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <div className="flex items-start gap-4 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Store className="w-6 h-6 text-primary" />
            </div>
            <div className="space-y-6 flex-1">
              <div>
                <h3 className="text-xl font-bold text-on-surface">Google Business Listings</h3>
                <p className="text-sm text-on-surface-variant mt-1">
                  Connect your Google Business Profile through EmbedSocial to sync reviews and manage your listings. This is separate from your app login account.
                </p>
              </div>

              {!embedSocialConnected ? (
                <div className="space-y-4">
                  <div className="p-4 bg-surface-container-low rounded-lg border border-outline-variant/20">
                    <p className="text-xs font-medium text-on-surface-variant mb-2">Setup Steps:</p>
                    <ol className="text-xs text-on-surface-variant space-y-1 list-decimal list-inside">
                      <li>Enter your EmbedSocial API Key below (find it in EmbedSocial → Settings → API)</li>
                      <li>Click "Test Connection" to verify</li>
                      <li>Click "Connect Listings" to connect your Google Business Profile listings</li>
                    </ol>
                    <a
                      href="https://app.embedsocial.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-xs text-primary hover:underline"
                    >
                      Open EmbedSocial <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-outline uppercase tracking-widest block">
                      EmbedSocial API Key
                    </label>
                    <input
                      type="password"
                      name="embedSocialApiKey"
                      value={formData.embedSocialApiKey}
                      onChange={handleChange}
                      placeholder="esb09b2b08909c75e..."
                      autoComplete="off"
                      className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-3 text-sm text-on-surface focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                    />
                    <p className="text-xs text-outline leading-relaxed">
                      Find your API key in EmbedSocial → Settings → API & Webhooks.
                    </p>
                    <div className="flex gap-3 mt-3">
                      <button
                        type="button"
                        onClick={handleTestConnection}
                        disabled={!formData.embedSocialApiKey || testingConnection}
                        className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                        {testingConnection ? 'Testing...' : 'Test Connection'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                    <div>
                      <p className="font-bold text-emerald-700 dark:text-emerald-400">EmbedSocial Connected</p>
                      <p className="text-sm text-emerald-600/70 dark:text-emerald-400/70">You can now connect Google Business Profile listings.</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 flex-wrap">
                    <button
                      onClick={() => setShowConnectModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      <Link className="w-4 h-4" />
                      Connect Listings
                    </button>
                    <a
                      href="https://embedsocial.com/app/public/listings"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open EmbedSocial
                    </a>
                  </div>
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

      {/* Connect Listings Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowConnectModal(false)}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Connect Google Business Listings</h2>
              <button onClick={() => setShowConnectModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100">
                <span className="text-slate-400">✕</span>
              </button>
            </div>

            {/* Invite Link Section */}
            <div className="mb-6 p-4 bg-blue-50 rounded-xl">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Invite Client to Connect Their Listings</h4>
              <p className="text-xs text-blue-700 mb-3">
                Share this link with your client. They can securely connect their Google account to your EmbedSocial account - no EmbedSocial signup required for them.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={INVITE_LINK}
                  readOnly
                  className="flex-1 px-3 py-2 bg-white border border-blue-200 rounded-lg text-xs"
                />
                <button
                  onClick={handleCopyInviteLink}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 flex items-center gap-1"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4 border-b border-slate-200 pb-4">
              <button
                onClick={() => {}}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium"
              >
                My Listings ({tenantListings.length})
              </button>
            </div>

            {/* Connected Listings */}
            <div className="flex-1 overflow-y-auto">
              {loadingListings ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              ) : tenantListings.length === 0 ? (
                <div className="text-center py-8">
                  <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">No listings connected yet.</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Connect from EmbedSocial or use the invite link above.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tenantListings.map((listing) => (
                    <div key={listing.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                          <Store className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{listing.name}</div>
                          <div className="text-xs text-slate-500">{listing.address || 'No address'}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">
                          Connected {new Date(listing.connectedAt).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => handleDisconnectListing(listing.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          title="Disconnect"
                        >
                          <Unlink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Available Listings Section */}
            {availableListings.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-200">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Available in EmbedSocial</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableListings.map((listing) => (
                    <button
                      key={listing.id}
                      onClick={() => handleConnectListing(listing.id, listing.name)}
                      className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-left transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                          <Store className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 text-sm">{listing.name}</div>
                          <div className="text-xs text-slate-500">{listing.address || 'No address'}</div>
                        </div>
                      </div>
                      <Link className="w-5 h-5 text-primary" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
