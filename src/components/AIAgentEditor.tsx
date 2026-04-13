import React, { useState, useEffect } from 'react';
import {
  Close,
  SmartToy,
  Save,
  Business,
  RecordVoiceOver,
  Psychology,
  AutoAwesome,
  CheckCircle,
  Add,
  Delete,
} from '@mui/icons-material';
import { apiPost, apiPut } from '../utils/api';
import type { AIAgent } from '../types/automation';

interface AIAgentEditorProps {
  agent: AIAgent | null;
  onClose: () => void;
  onSave: () => void;
}

const PRESET_PERSONALITIES = [
  {
    id: 'professional',
    name: 'Professional',
    icon: Business,
    description: 'Formal and business-oriented',
    color: 'blue',
  },
  {
    id: 'friendly',
    name: 'Friendly',
    icon: RecordVoiceOver,
    description: 'Warm and approachable',
    color: 'green',
  },
  {
    id: 'empathetic',
    name: 'Empathetic',
    icon: Psychology,
    description: 'Understanding and caring',
    color: 'purple',
  },
  {
    id: 'custom',
    name: 'Custom',
    icon: AutoAwesome,
    description: 'Create your own personality',
    color: 'orange',
  },
];

const EXPERTISE_OPTIONS = [
  'Restaurant & Food Service',
  'Retail & E-commerce',
  'Healthcare & Medical',
  'Hospitality & Hotels',
  'Professional Services',
  'Home Services',
  'Automotive',
  'Real Estate',
  'Fitness & Wellness',
  'Beauty & Salon',
  'Pet Services',
  'Education',
];

export function AIAgentEditor({ agent, onClose, onSave }: AIAgentEditorProps) {
  const [name, setName] = useState(agent?.name || '');
  const [description, setDescription] = useState(agent?.description || '');
  const [tone, setTone] = useState<'professional' | 'friendly' | 'empathetic' | 'custom'>(agent?.tone || 'friendly');
  const [personality, setPersonality] = useState(agent?.personality || '');
  const [expertise, setExpertise] = useState<string[]>(agent?.expertise || []);
  const [customInstructions, setCustomInstructions] = useState(agent?.customInstructions || '');
  const [model, setModel] = useState<'gemini' | 'openai'>(agent?.model || 'gemini');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = 'Agent name is required';
    }
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (tone === 'custom' && !personality.trim()) {
      newErrors.personality = 'Custom personality description is required';
    }
    if (tone === 'custom' && !customInstructions.trim()) {
      newErrors.customInstructions = 'Custom instructions are required for custom personality';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const url = agent ? `/api/ai-agents/${agent.id}` : '/api/ai-agents';
      const payload = {
        name,
        description,
        tone,
        personality: tone === 'custom' ? personality : PRESET_PERSONALITIES.find(p => p.id === tone)?.name,
        expertise,
        customInstructions: tone === 'custom' ? customInstructions : undefined,
        model,
      };

      const res = agent
        ? await apiPut(url, payload)
        : await apiPost(url, payload);

      if (res.ok) {
        onSave();
      } else {
        const data = await res.json();
        setErrors({ submit: data.error || 'Failed to save agent' });
      }
    } catch (error) {
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const toggleExpertise = (skill: string) => {
    setExpertise(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const getTonePreset = PRESET_PERSONALITIES.find(p => p.id === tone);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-50 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl bg-white rounded-3xl shadow-2xl z-50 flex flex-col max-h-[90vh] animate-scale-in"
      >
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-5 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <SmartToy className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {agent ? 'Edit AI Agent' : 'Create New AI Agent'}
                </h2>
                <p className="text-sm text-slate-500">Configure agent personality and expertise</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <Close className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900">Basic Information</h3>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Agent Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Customer Support Expert"
                className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
                  errors.name ? 'border-red-300 focus:ring-red-200' : 'border-slate-200'
                }`}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of what this agent specializes in..."
                rows={2}
                className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none ${
                  errors.description ? 'border-red-300 focus:ring-red-200' : 'border-slate-200'
                }`}
              />
              {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
            </div>
          </div>

          {/* Tone Selection */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900">Communication Tone</h3>
            <div className="grid grid-cols-2 gap-3">
              {PRESET_PERSONALITIES.map((preset) => {
                const Icon = preset.icon;
                const isSelected = tone === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => setTone(preset.id as typeof tone)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? `border-${preset.color}-500 bg-${preset.color}-50`
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isSelected
                          ? `bg-${preset.color}-100 text-${preset.color}-600`
                          : 'bg-slate-100 text-slate-400'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-semibold text-sm text-slate-900">{preset.name}</span>
                      {isSelected && (
                        <CheckCircle className={`w-4 h-4 text-${preset.color}-500 ml-auto`} />
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{preset.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Personality (for custom tone) */}
          {tone === 'custom' && (
            <div
              className="space-y-4 p-4 bg-orange-50 rounded-xl border border-orange-100"
            >
              <h4 className="font-semibold text-slate-900">Custom Personality Configuration</h4>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Personality Description *
                </label>
                <input
                  type="text"
                  value={personality}
                  onChange={(e) => setPersonality(e.target.value)}
                  placeholder="e.g., Playful and witty with pop culture references"
                  className={`w-full px-4 py-3 bg-white border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
                    errors.personality ? 'border-red-300' : 'border-slate-200'
                  }`}
                />
                {errors.personality && <p className="text-xs text-red-500 mt-1">{errors.personality}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Custom Instructions *
                </label>
                <textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="Detailed instructions for how this agent should respond to different situations..."
                  rows={4}
                  className={`w-full px-4 py-3 bg-white border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none ${
                    errors.customInstructions ? 'border-red-300' : 'border-slate-200'
                  }`}
                />
                {errors.customInstructions && <p className="text-xs text-red-500 mt-1">{errors.customInstructions}</p>}
              </div>
            </div>
          )}

          {/* Expertise */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900">Industry Expertise</h3>
            <p className="text-sm text-slate-500 -mt-2">Select industries this agent specializes in</p>
            <div className="flex flex-wrap gap-2">
              {EXPERTISE_OPTIONS.map((skill) => (
                <button
                  key={skill}
                  onClick={() => toggleExpertise(skill)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    expertise.includes(skill)
                      ? 'bg-primary text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {expertise.includes(skill) && <CheckCircle className="w-3.5 h-3.5 inline mr-1" />}
                  {skill}
                </button>
              ))}
            </div>
          </div>

          {/* Model Selection */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900">AI Model</h3>
            <div className="flex gap-3">
              {[
                { id: 'gemini', name: 'Gemini', desc: 'Fast and cost-effective' },
                { id: 'openai', name: 'OpenAI', desc: 'High quality responses' },
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => setModel(option.id as typeof model)}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all text-left ${
                    model === option.id
                      ? 'border-primary bg-primary/5'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-slate-900">{option.name}</span>
                    {model === option.id && <CheckCircle className="w-4 h-4 text-primary" />}
                  </div>
                  <p className="text-xs text-slate-500">{option.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Preview */}
          <div className="bg-gradient-to-br from-slate-50 to-purple-50/30 rounded-2xl p-5 border border-slate-200">
            <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
              <SmartToy className="w-5 h-5 text-purple-500" />
              Agent Preview
            </h4>
            <div className="bg-white rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                  <SmartToy className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-slate-900">{name || 'Agent Name'}</p>
                  <p className="text-xs text-slate-500">{description || 'Agent description'}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  tone === 'professional' ? 'bg-blue-100 text-blue-700' :
                  tone === 'friendly' ? 'bg-green-100 text-green-700' :
                  tone === 'empathetic' ? 'bg-purple-100 text-purple-700' :
                  'bg-orange-100 text-orange-700'
                }`}>
                  {getTonePreset?.name || 'Custom'} Tone
                </span>
                {expertise.slice(0, 2).map((skill, i) => (
                  <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs">
                    {skill}
                  </span>
                ))}
                {expertise.length > 2 && (
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs">
                    +{expertise.length - 2} more
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-3xl">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-slate-600 font-semibold text-sm hover:bg-slate-200 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-sm hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 shadow-lg"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {agent ? 'Update Agent' : 'Create Agent'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
