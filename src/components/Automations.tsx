import React, { useState, useEffect } from 'react';
import {
  Bolt,
  Add,
  PlayArrow,
  Pause,
  Delete,
  Edit,
  AutoAwesome,
  SmartToy,
  MoreVert,
  Speed,
  TrendingUp,
  Flag,
  CheckCircle,
  AccessTime,
  LocationOn,
  FilterList,
  RocketLaunch,
  ArrowForward,
  Star,
  Lightbulb,
} from '@mui/icons-material';
import { useLanguage } from '../contexts/LanguageContext';
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api';
import type { AutomationRule, AutomationStatus, AIAgent } from '../types/automation';
import { NewAutomationModal } from './NewAutomationModal';
import { AIAgentTeam } from './AIAgentTeam';

interface AutomationsProps {
  setActiveTab?: (tab: string) => void;
}

export function Automations({ setActiveTab }: AutomationsProps) {
  const { t } = useLanguage();
  const [automations, setAutomations] = useState<AutomationRule[]>([]);
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<AutomationRule | null>(null);
  const [activeView, setActiveView] = useState<'automations' | 'agents'>('automations');
  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; id: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [isCreatingDefaultAgent, setIsCreatingDefaultAgent] = useState(false);

  // 创建默认Agent
  const createDefaultAgent = async () => {
    setIsCreatingDefaultAgent(true);
    try {
      const res = await apiPost('/api/ai-agents', {
        name: '智能助手',
        description: '一个友好、专业的AI助手，可以帮助您自动回复客户评价',
        tone: 'friendly',
        personality: '热情、专业、乐于助人',
        expertise: ['客户服务', '评价回复', '问题解决'],
        customInstructions: '请用友好、专业的语气回复客户的评价。对于好评，表达感谢；对于差评，表达歉意并提供解决方案。回复要简洁、自然，像真人与客户交流一样。',
        model: 'gemini',
      });
      if (res.ok) {
        const newAgent = await res.json();
        setAgents([...agents, newAgent]);
        // 自动创建第一个自动化
        setTimeout(() => {
          setEditingAutomation(null);
          setShowNewModal(true);
        }, 300);
      }
    } catch (error) {
      console.error('Failed to create default agent:', error);
    } finally {
      setIsCreatingDefaultAgent(false);
    }
  };

  // 快速开始引导流程
  const renderGuidedFlow = () => {
    const steps = [
      {
        icon: <SmartToy className="w-6 h-6" />,
        title: '创建 AI 助手',
        description: '首先创建一个 AI 助手，它将帮您自动回复评价',
        action: agents.length === 0 ? (
          <button
            onClick={createDefaultAgent}
            disabled={isCreatingDefaultAgent}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50"
          >
            {isCreatingDefaultAgent ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                创建中...
              </>
            ) : (
              <>
                <Add className="w-5 h-5" />
                创建我的 AI 助手
              </>
            )}
          </button>
        ) : (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold">已完成</span>
          </div>
        ),
        completed: agents.length > 0,
      },
      {
        icon: <Bolt className="w-6 h-6" />,
        title: '创建自动化规则',
        description: '设置自动化规则，让 AI 自动处理新评价',
        action: agents.length > 0 && automations.length === 0 ? (
          <button
            onClick={() => { setEditingAutomation(null); setShowNewModal(true); }}
            className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:bg-primary/90 transition-all"
          >
            <Add className="w-5 h-5" />
            创建自动化
          </button>
        ) : automations.length > 0 ? (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold">已完成</span>
          </div>
        ) : (
          <button
            disabled
            className="flex items-center gap-2 bg-slate-200 text-slate-400 px-5 py-2.5 rounded-xl font-bold text-sm cursor-not-allowed"
          >
            创建自动化
          </button>
        ),
        completed: automations.length > 0,
        disabled: agents.length === 0,
      },
      {
        icon: <RocketLaunch className="w-6 h-6" />,
        title: '启动并享受便利',
        description: '开启自动化，让 AI 7x24 小时为您服务',
        action: automations.length > 0 && !automations.some(a => a.status === 'live') ? (
          <button
            onClick={() => {
              const draft = automations.find(a => a.status === 'draft');
              if (draft) {
                handleToggleStatus(draft);
              }
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:from-green-700 hover:to-emerald-700 transition-all"
          >
            <PlayArrow className="w-5 h-5" />
            启动自动化
          </button>
        ) : automations.some(a => a.status === 'live') ? (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold">运行中</span>
          </div>
        ) : (
          <button
            disabled
            className="flex items-center gap-2 bg-slate-200 text-slate-400 px-5 py-2.5 rounded-xl font-bold text-sm cursor-not-allowed"
          >
            启动自动化
          </button>
        ),
        completed: automations.some(a => a.status === 'live'),
        disabled: automations.length === 0,
      },
    ];

    return (
      <div className="space-y-6">
        {/* 引导标题 */}
        <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Lightbulb className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">快速开始</h3>
              <p className="text-white/80 text-sm">按照以下步骤，让 AI 助手开始为您工作</p>
            </div>
          </div>
        </div>

        {/* 步骤列表 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`bg-white rounded-2xl p-6 border transition-all ${
                step.disabled
                  ? 'border-slate-200 opacity-60'
                  : step.completed
                  ? 'border-green-200 bg-green-50/30'
                  : 'border-orange-200 shadow-sm'
              }`}
            >
              {/* 步骤编号和图标 */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  step.completed
                    ? 'bg-green-100 text-green-600'
                    : step.disabled
                    ? 'bg-slate-100 text-slate-400'
                    : 'bg-gradient-to-br from-orange-500 to-red-500 text-white'
                }`}>
                  {step.completed ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    step.icon
                  )}
                </div>
                <div className="flex-1">
                  <span className="text-xs font-semibold text-slate-400">步骤 {index + 1}</span>
                  <h4 className="font-bold text-slate-900">{step.title}</h4>
                </div>
              </div>

              {/* 描述 */}
              <p className="text-sm text-slate-500 mb-4">{step.description}</p>

              {/* 操作按钮 */}
              {step.action}
            </div>
          ))}
        </div>

        {/* 或者跳过 */}
        <div className="text-center">
          <button
            onClick={() => setActiveView('automations')}
            className="text-slate-500 hover:text-slate-700 text-sm underline underline-offset-4"
          >
            我已了解，直接查看自动化列表
          </button>
        </div>
      </div>
    );
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [autoRes, agentsRes] = await Promise.all([
        apiGet('/api/automations'),
        apiGet('/api/ai-agents'),
      ]);

      if (autoRes.ok) {
        const data = await autoRes.json();
        setAutomations(Array.isArray(data) ? data : (data.automations || []));
      }

      if (agentsRes.ok) {
        const data = await agentsRes.json();
        setAgents(Array.isArray(data) ? data : (data.agents || []));
      }
    } catch (error) {
      console.error('Failed to fetch automations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleStatus = async (automation: AutomationRule) => {
    const newStatus: AutomationStatus = automation.status === 'live' ? 'paused' : 'live';
    try {
      const res = await apiPut(`/api/automations/${automation.id}`, { status: newStatus });
      if (res.ok) {
        setAutomations(prev =>
          prev.map(a => a.id === automation.id ? { ...a, status: newStatus } : a)
        );
      }
    } catch (error) {
      console.error('Failed to toggle automation status:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await apiDelete(`/api/automations/${id}`);
      if (res.ok) {
        setAutomations(prev => prev.filter(a => a.id !== id));
        setConfirmDelete(null);
        setMenuAnchor(null);
      }
    } catch (error) {
      console.error('Failed to delete automation:', error);
    }
  };

  const handleSaveAutomation = async (automation: AutomationRule, setLive = false) => {
    try {
      const payload = {
        ...automation,
        status: setLive ? 'live' : 'draft',
        isEnabled: setLive,
      };

      let res: Response;
      if (editingAutomation) {
        res = await apiPut(`/api/automations/${editingAutomation.id}`, payload);
        if (res.ok) {
          const updated = await res.json();
          setAutomations(prev =>
            prev.map(a => a.id === editingAutomation.id ? updated : a)
          );
        }
      } else {
        res = await apiPost('/api/automations', payload);
        if (res.ok) {
          const created = await res.json();
          setAutomations(prev => [...prev, created]);
        }
      }

      if (res.ok) {
        setShowNewModal(false);
        setEditingAutomation(null);
      }
    } catch (error) {
      console.error('Failed to save automation:', error);
    }
  };

  const getStatusColor = (status: AutomationStatus) => {
    switch (status) {
      case 'live': return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' };
      case 'paused': return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
      case 'draft': return { bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200' };
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'reply-on-reviews': return <Speed className="w-5 h-5" />;
      case 'analyze-reviews': return <TrendingUp className="w-5 h-5" />;
      default: return <Bolt className="w-5 h-5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'reply-on-reviews': return 'Reply on Reviews';
      case 'analyze-reviews': return 'Analyze Reviews';
      default: return type;
    }
  };

  const liveCount = automations.filter(a => a.status === 'live').length;
  const pausedCount = automations.filter(a => a.status === 'paused').length;
  const draftCount = automations.filter(a => a.status === 'draft').length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-500">Loading automations...</p>
      </div>
    );
  }

  return (
    <div className="animate-slide-up min-h-screen"
    >
      {/* Page Header */}
      <div className="px-6 md:px-10 pt-6 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Bolt className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 font-headline tracking-tight">Automations</h1>
              <p className="text-sm text-slate-500">Automate your review management workflow</p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:ml-auto">
            {/* View Toggle */}
            <div className="flex bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => setActiveView('automations')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeView === 'automations'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Bolt className="w-4 h-4" />
                <span className="hidden sm:inline">Automations</span>
              </button>
              <button
                onClick={() => setActiveView('agents')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeView === 'agents'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <SmartToy className="w-4 h-4" />
                <span className="hidden sm:inline">AI Agents</span>
              </button>
            </div>

            {activeView === 'automations' && (
              <button
                onClick={() => { setEditingAutomation(null); setShowNewModal(true); }}
                className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:bg-primary/90 transition-all"
              >
                <Add className="w-5 h-5" />
                New Automation
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        {activeView === 'automations' && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <PlayArrow className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-xs text-slate-500 font-semibold">Live</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">{liveCount}</div>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Pause className="w-4 h-4 text-amber-600" />
                </div>
                <span className="text-xs text-slate-500 font-semibold">Paused</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">{pausedCount}</div>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                  <AccessTime className="w-4 h-4 text-slate-500" />
                </div>
                <span className="text-xs text-slate-500 font-semibold">Draft</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">{draftCount}</div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-6 md:px-10">
        {activeView === 'automations' ? (
          /* Automations List */
          <div className="space-y-4">
            {automations.length === 0 && agents.length === 0 ? (
              /* 显示引导流程 */
              renderGuidedFlow()
            ) : automations.length === 0 ? (
              /* 只有Agent但没有自动化 */
              <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-sm text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center mx-auto mb-4">
                  <Bolt className="w-10 h-10 text-orange-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No Automations Yet</h3>
                <p className="text-slate-500 mb-6 max-w-md mx-auto">
                  You have an AI assistant ready. Create your first automation to automatically reply to reviews or analyze customer feedback.
                </p>
                <button
                  onClick={() => { setEditingAutomation(null); setShowNewModal(true); }}
                  className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-primary/90 transition-all"
                >
                  <Add className="w-5 h-5" />
                  Create Your First Automation
                </button>
              </div>
            ) : (
              automations.map((automation) => {
                const statusStyle = getStatusColor(automation.status);
                return (
                  <div
                    key={automation.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        automation.type === 'reply-on-reviews'
                          ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                          : 'bg-gradient-to-br from-purple-500 to-pink-500'
                      }`}>
                        {getTypeIcon(automation.type)}
                        <span className="text-white w-6 h-6" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-bold text-slate-900 text-lg">{automation.name}</h3>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
                                {automation.status === 'live' ? (
                                  <PlayArrow className="w-3 h-3" />
                                ) : automation.status === 'paused' ? (
                                  <Pause className="w-3 h-3" />
                                ) : (
                                  <AccessTime className="w-3 h-3" />
                                )}
                                {automation.status.charAt(0).toUpperCase() + automation.status.slice(1)}
                              </span>
                              <span className="text-xs text-slate-400">{getTypeLabel(automation.type)}</span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleStatus(automation)}
                              className={`p-2 rounded-xl transition-all ${
                                automation.status === 'live'
                                  ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                                  : 'bg-green-50 text-green-600 hover:bg-green-100'
                              }`}
                              title={automation.status === 'live' ? 'Pause' : 'Go Live'}
                            >
                              {automation.status === 'live' ? (
                                <Pause className="w-5 h-5" />
                              ) : (
                                <PlayArrow className="w-5 h-5" />
                              )}
                            </button>

                            <div className="relative">
                              <button
                                onClick={(e) => setMenuAnchor(automation.id === menuAnchor?.id ? null : { el: e.currentTarget, id: automation.id })}
                                className="p-2 rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 transition-all"
                              >
                                <MoreVert className="w-5 h-5" />
                              </button>

                              {menuAnchor?.id === automation.id && (
                                <>
                                  <div className="fixed inset-0 z-40" onClick={() => setMenuAnchor(null)} />
                                  <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50 min-w-[160px]">
                                    <button
                                      onClick={() => { setEditingAutomation(automation); setShowNewModal(true); setMenuAnchor(null); }}
                                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                                    >
                                      <Edit className="w-4 h-4" />
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => setConfirmDelete(automation.id)}
                                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                                    >
                                      <Delete className="w-4 h-4" />
                                      Delete
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <LocationOn className="w-4 h-4" />
                            <span>{automation.locationName || 'All locations'}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <FilterList className="w-4 h-4" />
                            <span>
                              {automation.trigger === 'new-review' ? 'New reviews' : 'All reviews'}
                              {automation.ratingFilter !== 'all' ? ` • ${automation.ratingFilter}` : ''}
                            </span>
                          </div>
                          {automation.replyMode === 'ai-agent' && (
                            <div className="flex items-center gap-1.5">
                              <SmartToy className="w-4 h-4 text-purple-500" />
                              <span className="text-purple-600">{automation.aiAgentName || 'AI Agent'}</span>
                            </div>
                          )}
                        </div>

                        {/* Stats */}
                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-6 text-sm">
                          <div>
                            <span className="text-slate-400">Triggered: </span>
                            <span className="font-semibold text-slate-700">{automation.totalTriggered || 0}</span>
                          </div>
                          {automation.lastTriggered && (
                            <div>
                              <span className="text-slate-400">Last: </span>
                              <span className="font-semibold text-slate-700">{new Date(automation.lastTriggered).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* AI Agents Team */
          <AIAgentTeam agents={agents} onRefresh={fetchData} />
        )}
      </div>

      {/* New/Edit Automation Modal */}
      {showNewModal && (
        <NewAutomationModal
          automation={editingAutomation}
          agents={agents}
          onClose={() => { setShowNewModal(false); setEditingAutomation(null); }}
          onSave={handleSaveAutomation}
        />
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-50 animate-fade-in"
            onClick={() => setConfirmDelete(null)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-6 shadow-2xl z-50 w-full max-w-md animate-scale-in"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <Delete className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Delete Automation</h3>
                <p className="text-sm text-slate-500">This action cannot be undone</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
