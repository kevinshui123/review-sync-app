import React, { useState, useEffect } from 'react';
import { ArrowBack, Add, Delete } from '@mui/icons-material';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface EditBusinessPageProps {
  location: {
    embedId?: string;
    name: string;
    address: string;
    phoneNumber?: string;
    websiteUrl?: string;
    openingHours?: string;
    categories?: string[];
    embedSocialLocationId?: string;
    googleId?: string;
    totalReviews?: number;
    averageRating?: number;
  };
  onBack: () => void;
  onSuccess: (updatedData: any) => void;
}

export function EditBusinessPage({ location, onBack, onSuccess }: EditBusinessPageProps) {
  const [formData, setFormData] = useState({
    name: location.name || '',
    address: location.address || '',
    phoneNumber: location.phoneNumber || '',
    websiteUrl: location.websiteUrl || '',
    openingHours: location.openingHours || '',
  });
  const [categories, setCategories] = useState<string[]>(location.categories || []);
  const [newCategory, setNewCategory] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [activeSection, setActiveSection] = useState('basic');

  useEffect(() => {
    setFormData({
      name: location.name || '',
      address: location.address || '',
      phoneNumber: location.phoneNumber || '',
      websiteUrl: location.websiteUrl || '',
      openingHours: location.openingHours || '',
    });
    setCategories(location.categories || []);
  }, [location]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      setCategories([...categories, newCategory.trim()]);
      setNewCategory('');
    }
  };

  const handleRemoveCategory = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const res = await fetch(`/api/embedsocial/locations/${location.embedId || location.embedSocialLocationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          categories,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setSaveMessage({ type: 'success', text: 'Business info updated successfully!' });
        setTimeout(() => {
          onSuccess({
            name: updated.name || formData.name,
            address: updated.address || formData.address,
            phoneNumber: updated.phoneNumber || formData.phoneNumber,
            websiteUrl: updated.websiteUrl || formData.websiteUrl,
            openingHours: updated.openingHours || formData.openingHours,
            categories,
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

  const sections = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'hours', label: 'Hours' },
    { id: 'categories', label: 'Categories' },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white">
      {/* Header */}
      <div className="flex-shrink-0 bg-gradient-to-r from-primary to-primary/80 px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <ArrowBack className="text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Edit Business Info</h1>
            <p className="text-white/70 text-sm">{location.name}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6">
          {/* Success/Error Message */}
          {saveMessage && (
            <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${saveMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {saveMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="text-sm font-medium">{saveMessage.text}</span>
            </div>
          )}

          {/* Section Tabs */}
          <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === section.id
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>

          {/* Basic Info Section */}
          {activeSection === 'basic' && (
            <div className="space-y-6">
              <div className="bg-slate-50 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Business Details</h3>
                <div className="space-y-4">
                  {/* Business Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Business Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
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
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
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
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
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
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      placeholder="https://www.example.com"
                    />
                  </div>
                </div>
              </div>

              {/* Stats Card */}
              <div className="bg-slate-50 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Current Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-slate-900">{location.averageRating?.toFixed(1) ?? '0.0'}</div>
                    <div className="text-sm text-slate-500 mt-1">Average Rating</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-slate-900">{location.totalReviews ?? 0}</div>
                    <div className="text-sm text-slate-500 mt-1">Total Reviews</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Hours Section */}
          {activeSection === 'hours' && (
            <div className="bg-slate-50 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Business Hours</h3>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Opening Hours</label>
                <textarea
                  name="openingHours"
                  value={formData.openingHours}
                  onChange={handleChange}
                  rows={6}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                  placeholder="Monday: 9:00 AM - 5:00 PM
Tuesday: 9:00 AM - 5:00 PM
Wednesday: 9:00 AM - 5:00 PM
Thursday: 9:00 AM - 5:00 PM
Friday: 9:00 AM - 5:00 PM
Saturday: Closed
Sunday: Closed"
                />
                <p className="text-xs text-slate-500">Enter each day's hours on a new line</p>
              </div>
            </div>
          )}

          {/* Categories Section */}
          {activeSection === 'categories' && (
            <div className="bg-slate-50 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Business Categories</h3>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
                    className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    placeholder="Enter category name"
                  />
                  <button
                    onClick={handleAddCategory}
                    className="px-4 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
                  >
                    <Add className="w-4 h-4" />
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {categories.map((cat, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-full">
                      <span className="text-sm text-slate-700">{cat}</span>
                      <button
                        onClick={() => handleRemoveCategory(idx)}
                        className="w-5 h-5 rounded-full bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-500 flex items-center justify-center transition-colors"
                      >
                        <Delete className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {categories.length === 0 && (
                    <p className="text-sm text-slate-500 py-4">No categories added yet</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-slate-200">
            <button
              onClick={onBack}
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
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
