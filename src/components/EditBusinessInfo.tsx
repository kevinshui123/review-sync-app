import React, { useState, useEffect } from 'react';
import { X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiGet, apiPut } from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';

interface EditBusinessInfoProps {
  location: {
    embedId?: string;
    name: string;
    address: string;
    phoneNumber?: string;
    websiteUrl?: string;
    embedSocialLocationId?: string;
    googleId?: string;
  };
  onClose: () => void;
  onSuccess: (updatedData: any) => void;
}

export function EditBusinessInfo({ location, onClose, onSuccess }: EditBusinessInfoProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: location.name || '',
    address: location.address || '',
    phoneNumber: location.phoneNumber || '',
    websiteUrl: location.websiteUrl || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    setFormData({
      name: location.name || '',
      address: location.address || '',
      phoneNumber: location.phoneNumber || '',
      websiteUrl: location.websiteUrl || '',
    });
  }, [location]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const res = await apiPut(`/api/embedsocial/locations/${location.embedId || location.embedSocialLocationId}`, formData);

      if (res.ok) {
        const updated = await res.json();
        setSaveMessage({ type: 'success', text: 'Business info updated successfully!' });
        setTimeout(() => {
          onSuccess({
            name: updated.name || formData.name,
            address: updated.address || formData.address,
            phoneNumber: updated.phoneNumber || formData.phoneNumber,
            websiteUrl: updated.websiteUrl || formData.websiteUrl,
          });
        }, 1000);
      } else {
        const error = await res.json();
        setSaveMessage({ type: 'error', text: error.message || 'Failed to update business info' });
      }
    } catch (error: any) {
      setSaveMessage({ type: 'error', text: error.message || 'Failed to update business info' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-3xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Edit Business Info</h2>
          <p className="text-white/80 text-sm mt-0.5">Update your listing information</p>
        </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
      </div>

      {/* Content */}
      <div className="p-6">
        {saveMessage && (
          <div className={`mb-4 p-4 rounded-xl flex items-center gap-3 ${saveMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            {saveMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="text-sm font-medium">{saveMessage.text}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Business Name */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Business Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="Enter business name"
            />
          </div>

          {/* Address */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="Enter full address"
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Phone Number</label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="(555) 123-4567"
            />
          </div>

          {/* Website */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Website URL</label>
            <input
              type="url"
              name="websiteUrl"
              value={formData.websiteUrl}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="https://www.example.com"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || saveMessage?.type === 'success'}
            className="flex-1 px-4 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              t('business.saveChanges')
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
