import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  Pending,
  Lock,
  ArrowForward,
  ArrowBack,
  Refresh,
  Store,
  Close,
  Edit,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'motion/react';
import { apiGet, apiFetch } from '../utils/api';

interface BulkEditsProps {
  setActiveTab: (tab: string) => void;
}

interface EmbedListing {
  id: string;
  googleId: string;
  name: string;
  storeCode: string | null;
  url: string | null;
  isVerified: boolean;
  phoneNumber: string | null;
  address: string | null;
  websiteUrl: string | null;
  totalReviews: number;
  averageRating: number;
}

interface EditField {
  key: keyof EmbedListing;
  label: string;
  value: string;
}

export function BulkEdits({ setActiveTab }: BulkEditsProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [listings, setListings] = useState<EmbedListing[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editFields, setEditFields] = useState<EditField[]>([
    { key: 'phoneNumber', label: 'Phone Number', value: '' },
    { key: 'websiteUrl', label: 'Website URL', value: '' },
    { key: 'address', label: 'Address', value: '' },
  ]);
  const [saving, setSaving] = useState(false);
  const [saveResults, setSaveResults] = useState<{ success: string[]; failed: string[] }>({ success: [], failed: [] });
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const res = await apiGet('/api/embedsocial/locations');
      if (res.ok) {
        const data = await res.json();
        const sources: EmbedListing[] = Array.isArray(data) ? data : (data.data || []);
        setListings(sources);
      }
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    if (selectedIds.size === listings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(listings.map(l => l.id)));
    }
  };

  const updateField = (key: keyof EmbedListing, value: string) => {
    setEditFields(fields =>
      fields.map(f => f.key === key ? { ...f, value } : f)
    );
  };

  const handleSave = async () => {
    setSaving(true);
    const success: string[] = [];
    const failed: string[] = [];

    for (const id of selectedIds) {
      try {
        const updates: Record<string, string> = {};
        for (const field of editFields) {
          if (field.value.trim()) {
            updates[field.key] = field.value.trim();
          }
        }

        if (Object.keys(updates).length === 0) {
          failed.push(id);
          continue;
        }

        const res = await apiFetch(`/api/embedsocial/listings/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
        });

        if (res.ok) {
          success.push(id);
        } else {
          failed.push(id);
        }
      } catch {
        failed.push(id);
      }
    }

    setSaveResults({ success, failed });
    setShowResults(true);
    setSaving(false);
  };

  const resetWizard = () => {
    setCurrentStep(1);
    setSelectedIds(new Set());
    setEditFields([
      { key: 'phoneNumber', label: 'Phone Number', value: '' },
      { key: 'websiteUrl', label: 'Website URL', value: '' },
      { key: 'address', label: 'Address', value: '' },
    ]);
    setShowResults(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-6 lg:p-8 max-w-5xl mx-auto"
    >
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline mb-2">Bulk Edits</h1>
          <p className="text-slate-500">Update multiple business locations simultaneously.</p>
        </div>
        <button
          onClick={fetchListings}
          disabled={loading}
          className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-200 transition-all disabled:opacity-50"
        >
          <Refresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Results Modal */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={resetWizard}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold mb-6">Update Results</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <span className="font-semibold text-green-700">{saveResults.success.length} updated successfully</span>
                </div>
                {saveResults.failed.length > 0 && (
                  <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl">
                    <Close className="w-6 h-6 text-red-600" />
                    <span className="font-semibold text-red-700">{saveResults.failed.length} failed</span>
                  </div>
                )}
              </div>
              <button
                onClick={resetWizard}
                className="w-full mt-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all"
              >
                Done
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wizard Steps */}
      <div className="space-y-8">
        {/* Step 1: Select locations */}
        <section className={`bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden ${currentStep === 1 ? '' : 'opacity-40 grayscale-[0.3]'}`}>
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                currentStep === 1 ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                {currentStep > 1 ? <CheckCircle className="w-5 h-5" /> : '1'}
              </div>
              <h2 className="text-lg font-bold">Select locations</h2>
            </div>
          </div>
          <div className="p-8">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Refresh className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-12">
                <Store className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No listings found. Make sure EmbedSocial is configured.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Select All */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <span className="font-medium text-slate-700">Select all listings</span>
                  <button
                    onClick={selectAll}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                      selectedIds.size === listings.length
                        ? 'bg-primary text-white'
                        : 'bg-white border border-slate-200 text-slate-600'
                    }`}
                  >
                    {selectedIds.size === listings.length ? 'Deselect All' : 'Select All'} ({selectedIds.size}/{listings.length})
                  </button>
                </div>

                {/* Listing Items */}
                <div className="max-h-80 overflow-y-auto space-y-2">
                  {listings.map((listing) => (
                    <button
                      key={listing.id}
                      onClick={() => toggleSelect(listing.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                        selectedIds.has(listing.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center ${
                        selectedIds.has(listing.id) ? 'bg-primary border-primary' : 'border-slate-300'
                      }`}>
                        {selectedIds.has(listing.id) && <CheckCircle className="w-4 h-4 text-white" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-900">{listing.name}</h4>
                        <p className="text-sm text-slate-500">{listing.address || 'No address'}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-slate-700">{listing.averageRating.toFixed(1)}</span>
                        <span className="text-sm text-slate-400">/5</span>
                        <span className="text-xs text-slate-400 block">{listing.totalReviews} reviews</span>
                      </div>
                    </button>
                  ))}
                </div>

                {currentStep === 1 && (
                  <button
                    onClick={() => setCurrentStep(2)}
                    disabled={selectedIds.size === 0}
                    className="w-full py-4 bg-primary hover:bg-primary-container text-white font-bold rounded-xl transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next: Choose Fields
                    <ArrowForward className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Step 2: Choose fields */}
        <section className={`bg-white rounded-xl border border-slate-100 overflow-hidden ${currentStep === 2 ? '' : 'opacity-40 grayscale-[0.3]'}`}>
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                currentStep === 2 ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                {currentStep > 2 ? <CheckCircle className="w-5 h-5" /> : '2'}
              </div>
              <h2 className="text-lg font-bold">Choose fields to edit</h2>
            </div>
          </div>
          <div className="p-8">
            {currentStep === 2 ? (
              <div className="space-y-4">
                <p className="text-slate-500 text-sm mb-6">Enter the new values for the fields you want to update. Only fields with values will be updated.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {editFields.map((field) => (
                    <div key={field.key}>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">{field.label}</label>
                      {field.key === 'address' ? (
                        <textarea
                          value={field.value}
                          onChange={(e) => updateField(field.key, e.target.value)}
                          placeholder={`New ${field.label.toLowerCase()}...`}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                          rows={3}
                        />
                      ) : (
                        <input
                          type={field.key === 'websiteUrl' ? 'url' : 'text'}
                          value={field.value}
                          onChange={(e) => updateField(field.key, e.target.value)}
                          placeholder={`New ${field.label.toLowerCase()}...`}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="flex-1 py-4 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowBack className="w-5 h-5" />
                    Back
                  </button>
                  <button
                    onClick={() => setCurrentStep(3)}
                    disabled={editFields.every(f => !f.value.trim())}
                    className="flex-1 py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary-container transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Review Changes
                    <ArrowForward className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Pending className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 text-sm">Complete Step 1 to select fields.</p>
              </div>
            )}
          </div>
        </section>

        {/* Step 3: Review & Apply */}
        <section className={`bg-white rounded-xl border border-slate-100 overflow-hidden ${currentStep === 3 ? '' : 'opacity-40 grayscale-[0.3]'}`}>
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                currentStep === 3 ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                {currentStep > 3 ? <CheckCircle className="w-5 h-5" /> : '3'}
              </div>
              <h2 className="text-lg font-bold">Review & Apply</h2>
            </div>
          </div>
          <div className="p-8">
            {currentStep === 3 ? (
              <div className="space-y-6">
                <div className="bg-slate-50 rounded-xl p-6">
                  <h3 className="font-bold text-slate-900 mb-4">Summary</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Locations selected:</span>
                      <span className="font-bold text-slate-900 ml-2">{selectedIds.size}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Fields to update:</span>
                      <span className="font-bold text-slate-900 ml-2">{editFields.filter(f => f.value.trim()).length}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-6">
                  <h3 className="font-bold text-slate-900 mb-4">Changes</h3>
                  <div className="space-y-3">
                    {editFields.filter(f => f.value.trim()).map((field) => (
                      <div key={field.key} className="flex items-center gap-3 text-sm">
                        <Edit className="w-4 h-4 text-primary" />
                        <span className="font-medium text-slate-700">{field.label}:</span>
                        <span className="text-slate-900">{field.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="flex-1 py-4 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowBack className="w-5 h-5" />
                    Back
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all shadow-md shadow-green-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Refresh className="w-5 h-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Apply Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Lock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 text-sm">Complete previous steps to review changes.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </motion.div>
  );
}
