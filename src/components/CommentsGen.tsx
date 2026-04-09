import React, { useState, useEffect } from 'react';
import { Bot, Image as ImageIcon, Send, Loader2, CheckCircle2, AlertTriangle, User, MapPin, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';

interface GoogleAccount {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
}

interface Location {
  id: string;
  name: string;
  address: string | null;
}

interface Quota {
  total: number;
  used: number;
  remaining: number;
}

export function CommentsGen() {
  const { t, language } = useLanguage();
  const [accounts, setAccounts] = useState<GoogleAccount[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedAccount, setSelectedAccount] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [keywords, setKeywords] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Mock image upload state
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [accountsRes, locationsRes, quotaRes] = await Promise.all([
        fetch('/api/google-accounts'),
        fetch('/api/locations'),
        fetch('/api/comment-tasks/quota')
      ]);

      if (accountsRes.ok) setAccounts(await accountsRes.json());
      if (locationsRes.ok) setLocations(await locationsRes.json());
      if (quotaRes.ok) setQuota(await quotaRes.json());
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load initial data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!keywords.trim()) {
      setError(t('comments.errorKeywords'));
      return;
    }
    
    setIsGenerating(true);
    setError('');
    
    try {
      const res = await fetch('/api/comment-tasks/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords, language })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate');
      
      setGeneratedContent(data.content);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // For UI demonstration, we just create local object URLs
    const newImages = Array.from(files).map(file => URL.createObjectURL(file));
    setSelectedImages(prev => [...prev, ...newImages]);
  };

  const handleSaveTask = async () => {
    if (!selectedAccount) {
      setError(t('comments.errorAccount'));
      return;
    }
    if (!generatedContent) {
      setError(t('comments.errorContent'));
      return;
    }

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/comment-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleAccountId: selectedAccount,
          locationId: selectedLocation || null,
          keywords,
          content: generatedContent,
          imageUrls: selectedImages // Note: In a real app, upload these to S3 first
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save task');

      setSuccess(t('comments.success'));
      
      // Reset form
      setKeywords('');
      setGeneratedContent('');
      setSelectedImages([]);
      
      // Refresh quota
      const quotaRes = await fetch('/api/comment-tasks/quota');
      if (quotaRes.ok) setQuota(await quotaRes.json());

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
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
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      {/* Header & Quota */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-on-surface">{t('comments.title')}</h2>
          <p className="text-secondary mt-1">{t('comments.subtitle')}</p>
        </div>
        
        {quota && (
          <div className="bg-surface-container p-4 rounded-xl border border-outline-variant/20 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-secondary">{t('comments.quota')}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-on-surface">{quota.remaining}</span>
                <span className="text-sm text-secondary">/ {quota.total} {t('comments.remaining')}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-error/10 text-error p-4 rounded-xl flex items-center gap-3 border border-error/20">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 text-green-600 p-4 rounded-xl flex items-center gap-3 border border-green-500/20">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Configuration */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface-container p-6 rounded-2xl border border-outline-variant/20 space-y-6">
            <h3 className="text-lg font-bold text-on-surface border-b border-outline-variant/20 pb-4">{t('comments.setup')}</h3>
            
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-2">
                <User className="w-4 h-4" />
                {t('comments.selectAccount')}
              </label>
              <select 
                className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
              >
                <option value="">-- {t('comments.selectAccount')} --</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name} ({acc.email})</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {t('comments.targetLocation')}
              </label>
              <select 
                className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
              >
                <option value="">-- {t('comments.targetLocation')} --</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right Column: Content Generation */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface-container p-6 rounded-2xl border border-outline-variant/20 space-y-6">
            <h3 className="text-lg font-bold text-on-surface border-b border-outline-variant/20 pb-4">{t('comments.generation')}</h3>
            
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-secondary">{t('comments.keywords')}</label>
              <div className="flex gap-3">
                <input 
                  type="text"
                  placeholder={t('comments.keywordsPlaceholder')}
                  className="flex-1 bg-surface border border-outline-variant rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                />
                <button 
                  onClick={handleGenerate}
                  disabled={isGenerating || !keywords.trim()}
                  className="bg-primary text-on-primary px-6 py-3 rounded-lg font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                  {t('comments.generateBtn')}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-secondary">{t('comments.reviewContent')}</label>
              <textarea 
                className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all min-h-[150px] resize-y"
                placeholder={t('comments.reviewPlaceholder')}
                value={generatedContent}
                onChange={(e) => setGeneratedContent(e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <label className="text-xs font-bold uppercase tracking-wider text-secondary">{t('comments.photos')}</label>
              
              <div className="flex flex-wrap gap-4">
                {selectedImages.map((url, idx) => (
                  <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-outline-variant">
                    <img src={url} alt="Upload preview" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => setSelectedImages(prev => prev.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                
                <label className="w-24 h-24 rounded-lg border-2 border-dashed border-outline-variant flex flex-col items-center justify-center text-secondary hover:text-primary hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer">
                  <ImageIcon className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-bold uppercase">{t('comments.addPhoto')}</span>
                  <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>
            </div>

            <div className="pt-6 border-t border-outline-variant/20 flex justify-end">
              <button 
                onClick={handleSaveTask}
                disabled={isSaving || !selectedAccount || !generatedContent || (quota && quota.remaining <= 0)}
                className="bg-primary text-on-primary px-8 py-3 rounded-lg font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-primary/20"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {t('comments.saveTask')}
              </button>
            </div>
            
            {quota && quota.remaining <= 0 && (
              <p className="text-error text-xs text-right mt-2 font-medium">{t('comments.quotaExceeded')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
