import React, { useState, useEffect } from 'react';
import {
  Close,
  Speed,
  TrendingUp,
  CheckCircle,
  ArrowForward,
  ArrowBack,
  LocationOn,
  Star,
  SmartToy,
  Edit,
  Bolt,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'motion/react';
import type { AutomationRule, AIAgent, AutomationType, TriggerType, RatingFilter, ReplyMode } from '../types/automation';
import { apiGet } from '../utils/api';

interface NewAutomationModalProps {
  automation: AutomationRule | null;
  agents: AIAgent[];
  onClose: () => void;
  onSave: (automation: AutomationRule, setLive: boolean) => void;
}

export function NewAutomationModal({ automation, agents, onClose, onSave }: NewAutomationModalProps) {
  const [step, setStep] = useState(1);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);

  // Form state
  const [name, setName] = useState(automation?.name || '');
  const [type, setType] = useState<AutomationType>(automation?.type || 'reply-on-reviews');
  const [locationId, setLocationId] = useState(automation?.locationId || '');
  const [trigger, setTrigger] = useState<TriggerType>(automation?.trigger || 'new-review');
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>(automation?.ratingFilter || 'all');
  const [replyMode, setReplyMode] = useState<ReplyMode>(automation?.replyMode || 'default');
  const [defaultReply, setDefaultReply] = useState(automation?.defaultReply || '');
  const [selectedAgentId, setSelectedAgentId] = useState<string>(automation?.aiAgentId || '');

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await apiGet('/api/embedsocial/locations');
        if (res.ok) {
          const data = await res.json();
          const locs = Array.isArray(data) ? data : (data.data || []);
          setLocations(locs.map((l: any) => ({ id: l.id, name: l.name })));
          if (!locationId && locs.length > 0) {
            setLocationId(locs[0].id);
          }
        }
      } catch (e) {
        console.error('Failed to fetch locations:', e);
      } finally {
        setLoadingLocations(false);
      }
    };
    fetchLocations();
  }, []);

  const handleSave = (setLive: boolean) => {
    const selectedAgent = agents.find(a => a.id === selectedAgentId);
    const newAutomation: AutomationRule = {
      id: automation?.id || '',
      name,
      type,
      status: setLive ? 'live' : 'draft',
      locationId,
      locationName: locations.find(l => l.id === locationId)?.name,
      trigger,
      ratingFilter,
      replyMode,
      defaultReply: replyMode === 'default' ? defaultReply : undefined,
      aiAgentId: replyMode === 'ai-agent' ? selectedAgentId : undefined,
      aiAgentName: replyMode === 'ai-agent' ? selectedAgent?.name : undefined,
      isEnabled: setLive,
      totalTriggered: automation?.totalTriggered || 0,
      lastTriggered: automation?.lastTriggered,
      createdAt: automation?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onSave(newAutomation, setLive);
  };

  const canProceed = () => {
    if (!name.trim()) return false;
    if (step === 1 && !type) return false;
    if (step === 2 && !locationId) return false;
    if (step === 3 && replyMode === 'default' && !defaultReply.trim()) return false;
    if (step === 3 && replyMode === 'ai-agent' && !selectedAgentId) return false;
    return true;
  };

  const getRatingLabel = (filter: RatingFilter) => {
    switch (filter) {
      case 'all': return 'All ratings';
      case '5-stars': return '5 stars only';
      case '4-stars': return '4 stars only';
      case '3-stars': return '3 stars only';
      case '2-stars': return '2 stars only';
      case '1-star': return '1 star only';
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[1, 2, 3].map((s) => (
        <React.Fragment key={s}>
          <div className={`flex items-center gap-2`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              step >= s
                ? 'bg-primary text-white'
                : 'bg-slate-100 text-slate-400'
            }`}>
              {step > s ? <CheckCircle className="w-5 h-5" /> : s}
            </div>
            <span className={`text-sm font-medium hidden sm:inline ${
              step >= s ? 'text-primary' : 'text-slate-400'
            }`}>
              {s === 1 ? 'Setup' : s === 2 ? 'Configure' : 'Reply'}
            </span>
          </div>
          {s < 3 && (
            <div className={`w-8 md:w-16 h-0.5 ${step > s ? 'bg-primary' : 'bg-slate-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl bg-white rounded-3xl shadow-2xl z-50 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-5 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <Bolt className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {automation ? 'Edit Automation' : 'New Automation'}
                </h2>
                <p className="text-sm text-slate-500">Step {step} of 3</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <Close className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {renderStepIndicator()}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {/* Step 1: Choose Type */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Choose automation type</h3>
                  <p className="text-sm text-slate-500">Select what you want this automation to do</p>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={() => setType('reply-on-reviews')}
                    className={`w-full p-5 rounded-2xl border-2 transition-all text-left ${
                      type === 'reply-on-reviews'
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        type === 'reply-on-reviews'
                          ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                          : 'bg-slate-100'
                      }`}>
                        <Speed className={`w-6 h-6 ${type === 'reply-on-reviews' ? 'text-white' : 'text-slate-400'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-slate-900">Reply on Reviews</h4>
                          {type === 'reply-on-reviews' && (
                            <CheckCircle className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <p className="text-sm text-slate-500">
                          Automatically reply to customer reviews with customizable responses or AI-generated replies
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setType('analyze-reviews')}
                    className={`w-full p-5 rounded-2xl border-2 transition-all text-left ${
                      type === 'analyze-reviews'
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        type === 'analyze-reviews'
                          ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                          : 'bg-slate-100'
                      }`}>
                        <TrendingUp className={`w-6 h-6 ${type === 'analyze-reviews' ? 'text-white' : 'text-slate-400'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-slate-900">Analyze Reviews</h4>
                          {type === 'analyze-reviews' && (
                            <CheckCircle className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <p className="text-sm text-slate-500">
                          Use AI to analyze review sentiment, trends, and generate insights about your business
                        </p>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Automation Name */}
                <div className="mt-6">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Automation Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Auto-reply to 5-star reviews"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </motion.div>
            )}

            {/* Step 2: Configure */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Configure trigger</h3>
                  <p className="text-sm text-slate-500">Set when this automation should activate</p>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <LocationOn className="w-4 h-4 inline mr-1 text-slate-400" />
                    Location *
                  </label>
                  {loadingLocations ? (
                    <div className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-400">
                      Loading locations...
                    </div>
                  ) : (
                    <select
                      value={locationId}
                      onChange={(e) => setLocationId(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    >
                      <option value="">Select location</option>
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Trigger */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Trigger
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'new-review', label: 'New review on Google', desc: 'Triggers when a new review is published' },
                      { value: 'all-reviews', label: 'All existing reviews', desc: 'Apply to all reviews in your account' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setTrigger(option.value as TriggerType)}
                        className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                          trigger === option.value
                            ? 'border-primary bg-primary/5'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            trigger === option.value
                              ? 'border-primary bg-primary'
                              : 'border-slate-300'
                          }`}>
                            {trigger === option.value && (
                              <div className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-slate-900">{option.label}</p>
                            <p className="text-xs text-slate-500">{option.desc}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rating Filter */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <Star className="w-4 h-4 inline mr-1 text-slate-400" />
                    Rating Filter
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'all', label: 'All' },
                      { value: '5-stars', label: '5 Stars' },
                      { value: '4-stars', label: '4 Stars' },
                      { value: '3-stars', label: '3 Stars' },
                      { value: '2-stars', label: '2 Stars' },
                      { value: '1-star', label: '1 Star' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setRatingFilter(option.value as RatingFilter)}
                        className={`p-3 rounded-xl border-2 transition-all text-center ${
                          ratingFilter === option.value
                            ? 'border-primary bg-primary/5'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <p className={`text-sm font-semibold ${
                          ratingFilter === option.value ? 'text-primary' : 'text-slate-700'
                        }`}>
                          {option.label}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Reply Mode */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {type === 'reply-on-reviews' ? (
                  <>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">Set reply mode</h3>
                      <p className="text-sm text-slate-500">Choose how to respond to reviews</p>
                    </div>

                    <div className="space-y-4">
                      <button
                        onClick={() => setReplyMode('default')}
                        className={`w-full p-5 rounded-2xl border-2 transition-all text-left ${
                          replyMode === 'default'
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            replyMode === 'default'
                              ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                              : 'bg-slate-100'
                          }`}>
                            <Edit className={`w-6 h-6 ${replyMode === 'default' ? 'text-white' : 'text-slate-400'}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-slate-900">Default Reply</h4>
                              {replyMode === 'default' && (
                                <CheckCircle className="w-5 h-5 text-primary" />
                              )}
                            </div>
                            <p className="text-sm text-slate-500 mb-3">
                              Use the same reply for all matching reviews
                            </p>
                            {replyMode === 'default' && (
                              <textarea
                                value={defaultReply}
                                onChange={(e) => setDefaultReply(e.target.value)}
                                placeholder="Thank you for your review! We appreciate your feedback."
                                rows={3}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                              />
                            )}
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => setReplyMode('ai-agent')}
                        className={`w-full p-5 rounded-2xl border-2 transition-all text-left ${
                          replyMode === 'ai-agent'
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            replyMode === 'ai-agent'
                              ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                              : 'bg-slate-100'
                          }`}>
                            <SmartToy className={`w-6 h-6 ${replyMode === 'ai-agent' ? 'text-white' : 'text-slate-400'}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-slate-900">AI Agent</h4>
                              {replyMode === 'ai-agent' && (
                                <CheckCircle className="w-5 h-5 text-primary" />
                              )}
                            </div>
                            <p className="text-sm text-slate-500 mb-3">
                              Use a custom AI agent to generate personalized replies
                            </p>
                            {replyMode === 'ai-agent' && (
                              <select
                                value={selectedAgentId}
                                onChange={(e) => setSelectedAgentId(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                              >
                                <option value="">Select AI Agent</option>
                                {agents.map((agent) => (
                                  <option key={agent.id} value={agent.id}>
                                    {agent.name} - {agent.description}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        </div>
                      </button>
                    </div>

                    {replyMode === 'ai-agent' && agents.length === 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <p className="text-sm text-amber-700">
                          No AI agents available. Please create an AI agent first in the AI Agents tab.
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  /* Analyze Reviews Configuration */
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">Analyze Reviews Setup</h4>
                        <p className="text-sm text-slate-500">Your automation is ready</p>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-500">Location</span>
                        <span className="text-sm font-semibold text-slate-900">
                          {locations.find(l => l.id === locationId)?.name || 'All locations'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-500">Trigger</span>
                        <span className="text-sm font-semibold text-slate-900">
                          {trigger === 'new-review' ? 'New reviews' : 'All reviews'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-500">Rating Filter</span>
                        <span className="text-sm font-semibold text-slate-900">
                          {getRatingLabel(ratingFilter)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 mt-4">
                      When this automation is set live, AI will analyze matching reviews and provide sentiment insights and trends.
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-3xl">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                step === 1
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <ArrowBack className="w-4 h-4" />
              Back
            </button>

            <div className="flex items-center gap-2">
              {step < 3 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed()}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                  <ArrowForward className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSave(false)}
                    className="px-5 py-2.5 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all"
                  >
                    Save Draft
                  </button>
                  <button
                    onClick={() => handleSave(true)}
                    disabled={!canProceed()}
                    className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    <Bolt className="w-4 h-4" />
                    Set Live
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
