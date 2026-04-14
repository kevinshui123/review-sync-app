import React, { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Save, Key, AlertCircle, CheckCircle2, Users, Plus, Trash2, Sparkles, ExternalLink, Store, Unlink, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { apiGet, apiPost, apiDelete } from '../utils/api';
import { PageLoader } from './PageLoader';

interface TenantListing {
  id: string;
  name: string;
  address?: string;
  status: string;
  connectedAt: string;
  photoUrl?: string | null;
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
  });

  const [tenantListings, setTenantListings] = useState<TenantListing[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [embedSocialConnected, setEmbedSocialConnected] = useState(false);

  const EMBEDSOCIAL_INVITE_LINK = 'https://embedsocial.com/app/public/grant_listing_access?token=esb7ebfffb58b61f1e223b7dabf36a48';

  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await apiGet('/api/settings');
        if (res.ok) {
          const data = await res.json();
          setFormData({
            yelpApiKey: data.yelpApiKey || '',
            openaiApiKey: data.openaiApiKey || '',
            geminiApiKey: data.geminiApiKey || '',
          });
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }
    };

    const fetchTeam = async () => {
      try {
        const res = await apiGet('/api/team');
        if (res.ok) setTeamMembers(await res.json());
      } catch (error) {
        console.error('Failed to fetch team:', error);
      }
    };

    const fetchListings = async () => {
      setLoadingListings(true);
      try {
        const res = await apiGet('/api/tenant/listings');
        if (res.ok) setTenantListings(await res.json());
      } catch (error) {
        console.error('Failed to fetch listings:', error);
      } finally {
        setLoadingListings(false);
      }
    };

    const checkStatus = async () => {
      try {
        const res = await apiGet('/api/embedsocial/locations');
        setEmbedSocialConnected(res.status === 200);
      } catch {
        setEmbedSocialConnected(false);
      }
    };

    Promise.all([fetchSettings(), fetchTeam(), fetchListings(), checkStatus()]).finally(() => setIsLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const res = await apiPost('/api/settings', formData);
      if (res.ok) setSaveMessage({ type: 'success', text: 'Settings saved successfully.' });
      else throw new Error();
    } catch {
      setSaveMessage({ type: 'error', text: 'Failed to save settings.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail) return;
    setIsAddingMember(true);
    try {
      const res = await apiPost('/api/team', { email: newMemberEmail });
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
    if (!confirm('Remove this team member?')) return;
    try {
      const res = await apiDelete(`/api/team/${id}`);
      if (res.ok) setTeamMembers(teamMembers.filter((m) => m.id !== id));
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  const handleDisconnect = async (listingId: string) => {
    if (!confirm('Disconnect this listing?')) return;
    try {
      const res = await apiDelete(`/api/embedsocial/listings/${listingId}/disconnect`);
      if (res.ok) setTenantListings(tenantListings.filter(l => l.id !== listingId));
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  const refreshListings = async () => {
    const res = await apiGet('/api/tenant/listings');
    if (res.ok) setTenantListings(await res.json());
  };

  const handleSync = async () => {
    setLoadingListings(true);
    setSyncMessage(null);
    try {
      const res = await apiPost('/api/embedsocial/listings/sync', undefined);
      const data = await res.json();
      if (res.ok) {
        setSyncMessage({ type: 'success', text: `Found ${data.totalFound} listings, added ${data.newlyAdded} new.` });
        await refreshListings();
      } else {
        setSyncMessage({ type: 'error', text: data.error || 'Sync failed.' });
      }
    } catch {
      setSyncMessage({ type: 'error', text: 'Sync failed.' });
    } finally {
      setLoadingListings(false);
    }
  };

  if (isLoading) {
    return <PageLoader message={t('settings.loading')} subMessage={t('settings.loadingDesc')} />;
  }

  return (
    <div className="settings-container">
      {/* Header */}
      <div className="settings-header">
        <div className="settings-header-icon">
          <SettingsIcon size={24} />
        </div>
        <div>
          <h1 className="settings-title">Settings</h1>
          <p className="settings-subtitle">Manage your account and integrations</p>
        </div>
      </div>

      {saveMessage && (
        <div className={`alert ${saveMessage.type}`}>
          {saveMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{saveMessage.text}</span>
        </div>
      )}

      <div className="settings-sections">
        {/* Google Listings */}
        <section className="settings-section">
          <div className="section-header">
            <div className="section-icon">
              <Store size={20} />
            </div>
            <div>
              <h2 className="section-title">Google Business Listings</h2>
              <p className="section-desc">Connect your Google Business Profile to sync reviews and manage listings.</p>
            </div>
          </div>

          <div className="connect-card">
            <div className="connect-card-header">
              <h4>Connect a New Listing</h4>
              <div className="connection-status">
                <span className={`status-dot ${embedSocialConnected ? 'connected' : ''}`} />
                <span>{embedSocialConnected ? 'Connected' : 'Checking...'}</span>
              </div>
            </div>
            <p className="connect-desc">Click below to securely connect your Google account via EmbedSocial.</p>
            <button className="btn btn-primary" onClick={() => window.open(EMBEDSOCIAL_INVITE_LINK, '_blank')}>
              <ExternalLink size={16} />
              Connect New Listing
            </button>
          </div>

          <div className="listings-section">
            <div className="listings-header">
              <h4>My Connected Listings ({tenantListings.length})</h4>
              <button className="btn btn-secondary btn-sm" onClick={handleSync} disabled={loadingListings}>
                {loadingListings ? <Loader2 size={14} className="animate-spin" /> : null}
                Sync Listings
              </button>
            </div>

            {syncMessage && (
              <div className={`sync-alert ${syncMessage.type}`}>{syncMessage.text}</div>
            )}

            {tenantListings.length === 0 ? (
              <div className="listings-empty">
                <Store size={40} />
                <p>No listings connected yet.</p>
              </div>
            ) : (
              <div className="listings-grid">
                {tenantListings.map((listing) => (
                  <div key={listing.id} className="listing-card">
                    <div className="listing-info">
                      <div className="listing-icon">
                        {listing.photoUrl ? (
                          <img src={listing.photoUrl} alt={listing.name} className="listing-photo" />
                        ) : (
                          <Store size={18} />
                        )}
                      </div>
                      <div>
                        <div className="listing-name">{listing.name}</div>
                        <div className="listing-address">{listing.address || 'No address'}</div>
                      </div>
                    </div>
                    <div className="listing-meta">
                      <span className="listing-date">Connected {new Date(listing.connectedAt).toLocaleDateString()}</span>
                      <button className="btn-icon" onClick={() => handleDisconnect(listing.id)} title="Disconnect">
                        <Unlink size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* AI API Keys */}
        <section className="settings-section">
          <div className="section-header">
            <div className="section-icon">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="section-title">AI Models API</h2>
              <p className="section-desc">Configure AI providers for intelligent review reply generation.</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">OpenAI API Key</label>
              <input
                type="password"
                name="openaiApiKey"
                value={formData.openaiApiKey}
                onChange={handleChange}
                placeholder="sk-..."
                className="input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Gemini API Key</label>
              <input
                type="password"
                name="geminiApiKey"
                value={formData.geminiApiKey}
                onChange={handleChange}
                placeholder="AIza..."
                className="input"
              />
              <p className="form-hint">Leave blank to use the platform-managed key.</p>
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="settings-section">
          <div className="section-header">
            <div className="section-icon">
              <Users size={20} />
            </div>
            <div>
              <h2 className="section-title">Team Members</h2>
              <p className="section-desc">Invite collaborators to manage your business listings.</p>
            </div>
          </div>

          <form onSubmit={handleAddMember} className="add-member-form">
            <input
              type="email"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="input"
              required
            />
            <button type="submit" className="btn btn-primary" disabled={isAddingMember || !newMemberEmail}>
              <Plus size={16} />
              {isAddingMember ? 'Adding...' : 'Add Member'}
            </button>
          </form>

          <div className="members-list">
            {teamMembers.map((member) => (
              <div key={member.id} className="member-row">
                <div className="member-info">
                  <div className="member-avatar">{member.email.charAt(0).toUpperCase()}</div>
                  <div>
                    <div className="member-email">{member.email}</div>
                    <div className="member-date">Added {new Date(member.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
                <button className="btn-icon" onClick={() => handleRemoveMember(member.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Save Button */}
      <div className="settings-footer">
        <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <style>{`
        .settings-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: 16px;
        }

        .settings-container {
          padding: 24px;
          max-width: 900px;
        }

        .settings-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
          padding-bottom: 24px;
          border-bottom: 1px solid var(--color-divider);
        }

        .settings-header-icon {
          width: 48px;
          height: 48px;
          background: var(--color-primary);
          color: white;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .settings-title {
          font-family: var(--font-headline);
          font-size: 24px;
          font-weight: 700;
          color: var(--color-text-primary);
          margin: 0 0 4px;
          letter-spacing: -0.02em;
        }

        .settings-subtitle {
          font-size: 14px;
          color: var(--color-text-muted);
          margin: 0;
        }

        .alert {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 14px;
          font-weight: 500;
        }

        .alert.success {
          background: var(--color-success-bg);
          color: var(--color-success-text);
        }

        .alert.error {
          background: var(--color-error-bg);
          color: var(--color-error-text);
        }

        .settings-sections {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .settings-section {
          background: var(--color-surface-raised);
          border: 1px solid var(--color-border);
          border-radius: 12px;
          padding: 24px;
        }

        .section-header {
          display: flex;
          gap: 14px;
          margin-bottom: 20px;
        }

        .section-icon {
          width: 40px;
          height: 40px;
          background: var(--color-primary-muted);
          color: var(--color-primary);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .section-title {
          font-family: var(--font-headline);
          font-size: 16px;
          font-weight: 600;
          color: var(--color-text-primary);
          margin: 0 0 4px;
        }

        .section-desc {
          font-size: 13px;
          color: var(--color-text-muted);
          margin: 0;
        }

        .connect-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 10px;
          padding: 16px;
          margin-bottom: 20px;
        }

        .connect-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .connect-card-header h4 {
          font-size: 14px;
          font-weight: 600;
          color: var(--color-text-primary);
          margin: 0;
        }

        .connection-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--color-text-muted);
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: var(--color-warning);
        }

        .status-dot.connected {
          background: var(--color-success);
        }

        .connect-desc {
          font-size: 12px;
          color: var(--color-text-muted);
          margin: 0 0 12px;
        }

        .listings-section {
          margin-top: 8px;
        }

        .listings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .listings-header h4 {
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text-primary);
          margin: 0;
        }

        .sync-alert {
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 12px;
          margin-bottom: 12px;
        }

        .sync-alert.success {
          background: var(--color-success-bg);
          color: var(--color-success-text);
        }

        .sync-alert.error {
          background: var(--color-error-bg);
          color: var(--color-error-text);
        }

        .listings-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 32px;
          color: var(--color-text-disabled);
          gap: 8px;
        }

        .listings-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .listing-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 8px;
        }

        .listing-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .listing-icon {
          width: 36px;
          height: 36px;
          background: var(--color-success-bg);
          color: var(--color-success);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .listing-photo {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .listing-name {
          font-weight: 600;
          font-size: 14px;
          color: var(--color-text-primary);
        }

        .listing-address {
          font-size: 12px;
          color: var(--color-text-muted);
        }

        .listing-meta {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .listing-date {
          font-size: 11px;
          color: var(--color-text-muted);
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--color-text-secondary);
        }

        .form-hint {
          font-size: 11px;
          color: var(--color-text-muted);
          margin: 0;
        }

        .add-member-form {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
        }

        .add-member-form .input {
          flex: 1;
        }

        .members-list {
          border: 1px solid var(--color-border);
          border-radius: 8px;
          overflow: hidden;
        }

        .member-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          border-bottom: 1px solid var(--color-border);
        }

        .member-row:last-child {
          border-bottom: none;
        }

        .member-row:hover {
          background: var(--color-surface);
        }

        .member-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .member-avatar {
          width: 32px;
          height: 32px;
          background: var(--color-primary-muted);
          color: var(--color-primary);
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 600;
        }

        .member-email {
          font-size: 14px;
          font-weight: 500;
          color: var(--color-text-primary);
        }

        .member-date {
          font-size: 11px;
          color: var(--color-text-muted);
        }

        .settings-footer {
          display: flex;
          justify-content: flex-end;
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid var(--color-divider);
        }

        @media (max-width: 768px) {
          .settings-container {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
}
