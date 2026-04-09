import React, { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Save, Key, ShieldCheck, AlertCircle, Loader2, CheckCircle2, Users, Plus, Trash2, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';

export function Settings() {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const [formData, setFormData] = useState({
    syncWebhookUrl: '',
    replyWebhookUrl: '',
    yelpApiKey: '',
    openaiApiKey: '',
    geminiApiKey: ''
  });

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
            syncWebhookUrl: data.syncWebhookUrl || '',
            replyWebhookUrl: data.replyWebhookUrl || '',
            yelpApiKey: data.yelpApiKey || '',
            openaiApiKey: data.openaiApiKey || '',
            geminiApiKey: data.geminiApiKey || ''
          });
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
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setSaveMessage({ type: 'success', text: 'Settings saved successfully. You can now connect your accounts.' });
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
        body: JSON.stringify({ email: newMemberEmail })
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
        setTeamMembers(teamMembers.filter(m => m.id !== id));
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
        {/* AI Models API Section */}
        <section className="bg-surface-container rounded-2xl p-8 border border-outline-variant/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <div className="flex items-start gap-4 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <SparklesIcon className="w-6 h-6 text-primary" />
            </div>
            <div className="space-y-6 flex-1">
              <div>
                <h3 className="text-xl font-bold text-on-surface">AI Models API</h3>
                <p className="text-sm text-on-surface-variant mt-1">Configure API keys for AI providers to power intelligent review replies and listing optimizations.</p>
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

        {/* Automation Webhooks Section */}
        <section className="bg-surface-container rounded-2xl p-8 border border-outline-variant/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div className="space-y-6 flex-1">
              <div>
                <h3 className="text-xl font-bold text-on-surface">Automation Webhooks (Zapier / Make)</h3>
                <p className="text-sm text-on-surface-variant mt-1">Bypass Google API approval by using Zapier or Make.com Webhooks to sync and reply to reviews.</p>
              </div>

              <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant/20 space-y-4 mt-4">
                <div>
                  <p className="text-xs font-bold text-outline uppercase tracking-widest flex items-center gap-2">
                    Sync Reviews Webhook URL
                  </p>
                  <p className="text-sm text-on-surface-variant mt-1">
                    Used to pull new reviews from Google Business Profile via Zapier/Make.
                  </p>
                </div>
                <div className="space-y-2">
                  <input 
                    type="text" 
                    name="syncWebhookUrl"
                    value={formData.syncWebhookUrl}
                    onChange={handleChange}
                    placeholder="https://hooks.zapier.com/... or https://hook.make.com/..."
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-3 text-sm text-on-surface focus:ring-2 focus:ring-primary/50 outline-none transition-all font-mono" 
                  />
                </div>
              </div>

              <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant/20 space-y-4 mt-4">
                <div>
                  <p className="text-xs font-bold text-outline uppercase tracking-widest flex items-center gap-2">
                    Reply to Reviews Webhook URL
                  </p>
                  <p className="text-sm text-on-surface-variant mt-1">
                    Used to publish your AI-generated replies to Google Business Profile via Zapier/Make.
                  </p>
                </div>
                <div className="space-y-2">
                  <input 
                    type="text" 
                    name="replyWebhookUrl"
                    value={formData.replyWebhookUrl}
                    onChange={handleChange}
                    placeholder="https://hooks.zapier.com/... or https://hook.make.com/..."
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-3 text-sm text-on-surface focus:ring-2 focus:ring-primary/50 outline-none transition-all font-mono" 
                  />
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

// Helper icon component since Sparkles is used
function SparklesIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}
