import React, { useState, useEffect } from 'react';
import {
  Zap,
  Plus,
  Play,
  Pause,
  Trash2,
  Pencil,
  Bot,
  MoreVertical,
  MapPin,
  Filter,
  Rocket,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { PageLoader } from './PageLoader';
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api';
import type { AutomationRule, AutomationStatus, AIAgent } from '../types/automation';
import { NewAutomationModal } from './NewAutomationModal';
import { AIAgentTeam } from './AIAgentTeam';

interface AutomationsProps {
  setActiveTab?: (tab: string) => void;
}

export function Automations({ setActiveTab }: AutomationsProps) {
  const { t, language } = useLanguage();
  const [automations, setAutomations] = useState<AutomationRule[]>([]);
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<AutomationRule | null>(null);
  const [activeView, setActiveView] = useState<'automations' | 'agents'>('automations');
  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; id: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [isCreatingDefaultAgent, setIsCreatingDefaultAgent] = useState(false);

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

  const createDefaultAgent = async () => {
    setIsCreatingDefaultAgent(true);
    try {
      const res = await apiPost('/api/ai-agents', {
        name: language === 'zh' ? '智能助手' : 'Smart Assistant',
        description: language === 'zh'
          ? '一个友好、专业的AI助手，可以帮助您自动回复客户评价'
          : 'A friendly, professional AI assistant that helps you auto-reply to customer reviews',
        tone: 'friendly',
        personality: language === 'zh' ? '热情、专业、乐于助人' : 'Enthusiastic, Professional, Helpful',
        expertise: language === 'zh' ? ['客户服务', '评价回复', '问题解决'] : ['Customer Service', 'Review Replies', 'Problem Solving'],
        customInstructions: language === 'zh'
          ? '请用友好、专业的语气回复客户的评价。对于好评，表达感谢；对于差评，表达歉意并提供解决方案。回复要简洁，自然，像真人与客户交流一样。'
          : 'Reply to customer reviews in a friendly, professional tone. For positive reviews, express gratitude; for negative reviews, apologize and offer solutions. Keep replies concise, natural, and conversational.',
        model: 'gemini',
      });
      if (res.ok) {
        const newAgent = await res.json();
        setAgents([...agents, newAgent]);
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

  const getStatusBadge = (status: AutomationStatus) => {
    const isZh = language === 'zh';
    switch (status) {
      case 'live':
        return {
          bg: 'bg-emerald-50',
          text: 'text-emerald-700',
          dot: 'bg-emerald-500',
          label: isZh ? '运行中' : 'Live',
        };
      case 'paused':
        return {
          bg: 'bg-amber-50',
          text: 'text-amber-700',
          dot: 'bg-amber-500',
          label: isZh ? '已暂停' : 'Paused',
        };
      case 'draft':
        return {
          bg: 'bg-slate-100',
          text: 'text-slate-500',
          dot: 'bg-slate-400',
          label: isZh ? '草稿' : 'Draft',
        };
    }
  };

  const getTypeLabel = (type: string) => {
    const isZh = language === 'zh';
    switch (type) {
      case 'reply-on-reviews':
        return isZh ? '回复评价' : 'Reply on Reviews';
      case 'analyze-reviews':
        return isZh ? '分析评价' : 'Analyze Reviews';
      default:
        return type;
    }
  };

  const getTriggerLabel = (trigger: string, ratingFilter: string) => {
    const isZh = language === 'zh';
    const triggerText = trigger === 'new-review'
      ? (isZh ? '新评价' : 'New reviews')
      : (isZh ? '所有评价' : 'All reviews');
    const ratingText = ratingFilter !== 'all'
      ? ` · ${ratingFilter}${isZh ? '星' : '-star'}`
      : '';
    return `${triggerText}${ratingText}`;
  };

  const liveCount = automations.filter(a => a.status === 'live').length;
  const pausedCount = automations.filter(a => a.status === 'paused').length;
  const draftCount = automations.filter(a => a.status === 'draft').length;
  const isZh = language === 'zh';

  if (loading) {
    return <PageLoader message={t('automations.loading')} subMessage={t('automations.loadingDesc')} />;
  }

  return (
    <div className="automations-page">
      {/* Page Header */}
      <div className="automations-header">
        <div className="automations-title-row">
          <div className="automations-icon">
            <Zap size={20} />
            </div>
            <div>
            <h1 className="automations-title">
              {isZh ? '自动化规则' : 'Automations'}
            </h1>
            <p className="automations-subtitle">
              {isZh
                ? '设置自动化规则，让 AI 自动处理新评价'
                : 'Set up automation rules and let AI handle new reviews automatically'
              }
            </p>
            </div>
          </div>

        <div className="automations-actions">
          <div className="automations-tabs">
              <button
                onClick={() => setActiveView('automations')}
              className={`automations-tab ${activeView === 'automations' ? 'active' : ''}`}
            >
              {isZh ? '规则列表' : 'Rules'}
              {automations.length > 0 && (
                <span className="automations-tab-count">{automations.length}</span>
              )}
              </button>
              <button
                onClick={() => setActiveView('agents')}
              className={`automations-tab ${activeView === 'agents' ? 'active' : ''}`}
            >
              {isZh ? 'AI 助手' : 'AI Agents'}
              {agents.length > 0 && (
                <span className="automations-tab-count">{agents.length}</span>
              )}
              </button>
            </div>

            {activeView === 'automations' && (
              <button
                onClick={() => { setEditingAutomation(null); setShowNewModal(true); }}
              className="automations-add-btn"
              >
              <Plus size={16} />
              {isZh ? '新建规则' : 'New Rule'}
              </button>
            )}
          </div>
        </div>

      {/* Stats Row */}
        {activeView === 'automations' && (
        <div className="automations-stats">
          <div className="automations-stat">
            <div className="automations-stat-icon live">
              <Play size={14} />
                </div>
            <div className="automations-stat-info">
              <span className="automations-stat-num">{liveCount}</span>
              <span className="automations-stat-label">{isZh ? '运行中' : 'Live'}</span>
              </div>
            </div>
          <div className="automations-stat-divider" />
          <div className="automations-stat">
            <div className="automations-stat-icon paused">
              <Pause size={14} />
                </div>
            <div className="automations-stat-info">
              <span className="automations-stat-num">{pausedCount}</span>
              <span className="automations-stat-label">{isZh ? '已暂停' : 'Paused'}</span>
              </div>
            </div>
          <div className="automations-stat-divider" />
          <div className="automations-stat">
            <div className="automations-stat-icon draft">
              <div className="automations-stat-dot" />
                </div>
            <div className="automations-stat-info">
              <span className="automations-stat-num">{draftCount}</span>
              <span className="automations-stat-label">{isZh ? '草稿' : 'Draft'}</span>
              </div>
            </div>
          </div>
        )}

      {/* Content */}
      <div className="automations-content">
        {activeView === 'automations' ? (
          automations.length === 0 && agents.length === 0 ? (
            /* Empty state - setup wizard */
            <div className="automations-empty">
              <div className="automations-empty-header">
                <div className="automations-empty-icon">
                  <Rocket size={28} />
                </div>
                <h2>{isZh ? '快速开始' : 'Quick Start'}</h2>
                <p>
                  {isZh
                    ? '按照以下步骤，让 AI 助手开始为您工作'
                    : 'Follow these steps to get your AI assistant working for you'
                  }
                </p>
              </div>

              <div className="automations-steps">
                <div className={`automations-step ${agents.length > 0 ? 'done' : ''}`}>
                  <div className="automations-step-num">
                    {agents.length > 0 ? <CheckCircle2 size={18} /> : '1'}
                  </div>
                  <div className="automations-step-content">
                    <h3>{isZh ? '创建 AI 助手' : 'Create AI Assistant'}</h3>
                    <p>
                      {isZh
                        ? '首先创建一个 AI 助手，它将帮您自动回复评价'
                        : 'First, create an AI assistant to auto-reply to reviews'
                      }
                    </p>
                  </div>
                  <div className="automations-step-action">
                    {agents.length === 0 ? (
                <button
                        onClick={createDefaultAgent}
                        disabled={isCreatingDefaultAgent}
                        className="automations-step-btn primary"
                      >
                        {isCreatingDefaultAgent ? (
                          <>
                            <div className="automations-spinner" />
                            {isZh ? '创建中...' : 'Creating...'}
                          </>
                        ) : (
                          <>
                            <Plus size={14} />
                            {isZh ? '创建助手' : 'Create Assistant'}
                          </>
                        )}
                </button>
                    ) : (
                      <CheckCircle2 size={20} className="automations-step-check" />
                    )}
              </div>
                </div>

                <div className={`automations-step ${automations.length > 0 ? 'done' : ''} ${agents.length === 0 ? 'disabled' : ''}`}>
                  <div className="automations-step-num">
                    {automations.length > 0 ? <CheckCircle2 size={18} /> : '2'}
                  </div>
                  <div className="automations-step-content">
                    <h3>{isZh ? '创建自动化规则' : 'Create Automation Rule'}</h3>
                    <p>
                      {isZh
                        ? '设置自动化规则，让 AI 自动处理新评价'
                        : 'Set up rules to let AI handle new reviews automatically'
                      }
                    </p>
                  </div>
                  <div className="automations-step-action">
                    {agents.length > 0 && automations.length === 0 ? (
                      <button
                        onClick={() => { setEditingAutomation(null); setShowNewModal(true); }}
                        className="automations-step-btn primary"
                      >
                        <Plus size={14} />
                        {isZh ? '创建规则' : 'Create Rule'}
                      </button>
                    ) : automations.length > 0 ? (
                      <CheckCircle2 size={20} className="automations-step-check" />
                    ) : (
                      <button disabled className="automations-step-btn disabled">
                        <Plus size={14} />
                        {isZh ? '创建规则' : 'Create Rule'}
                      </button>
                    )}
                  </div>
                </div>

                <div className={`automations-step ${automations.some(a => a.status === 'live') ? 'done' : ''} ${automations.length === 0 ? 'disabled' : ''}`}>
                  <div className="automations-step-num">
                    {automations.some(a => a.status === 'live') ? <CheckCircle2 size={18} /> : '3'}
                  </div>
                  <div className="automations-step-content">
                    <h3>{isZh ? '启动自动化' : 'Launch Automation'}</h3>
                    <p>
                      {isZh
                        ? '开启自动化，让 AI 7x24 小时为您服务'
                        : 'Enable automation and let AI work for you 24/7'
                      }
                    </p>
                  </div>
                  <div className="automations-step-action">
                    {automations.length > 0 && !automations.some(a => a.status === 'live') ? (
                      <button
                        onClick={() => {
                          const draft = automations.find(a => a.status === 'draft');
                          if (draft) handleToggleStatus(draft);
                        }}
                        className="automations-step-btn primary"
                      >
                        <Play size={14} />
                        {isZh ? '启动' : 'Launch'}
                      </button>
                    ) : automations.some(a => a.status === 'live') ? (
                      <span className="automations-step-live">
                        <span className="automations-step-live-dot" />
                        {isZh ? '运行中' : 'Running'}
                      </span>
                    ) : (
                      <button disabled className="automations-step-btn disabled">
                        <Play size={14} />
                        {isZh ? '启动' : 'Launch'}
                      </button>
                    )}
                  </div>
                </div>
                      </div>

              <button
                onClick={() => setActiveView('automations')}
                className="automations-skip"
              >
                {isZh ? '我已了解，直接查看规则列表' : 'I understand, go to rules list'}
                <ChevronRight size={14} />
              </button>
            </div>
          ) : automations.length === 0 ? (
            /* Only agents, no automations yet */
            <div className="automations-empty-simple">
              <Bot size={40} />
              <h3>{isZh ? '还没有自动化规则' : 'No Automation Rules Yet'}</h3>
              <p>
                {isZh
                  ? '您有 AI 助手已就绪。创建您的第一个自动化规则来自动回复评价。'
                  : 'You have an AI assistant ready. Create your first automation rule to auto-reply to reviews.'
                }
              </p>
              <button
                onClick={() => { setEditingAutomation(null); setShowNewModal(true); }}
                className="automations-add-btn primary"
              >
                <Plus size={16} />
                {isZh ? '创建第一条规则' : 'Create First Rule'}
              </button>
            </div>
          ) : (
            /* Automation list */
            <div className="automations-list">
              {automations.map((automation) => {
                const statusBadge = getStatusBadge(automation.status);
                return (
                  <div key={automation.id} className="automations-item">
                    <div className="automations-item-left">
                      <div className={`automations-item-icon ${automation.type === 'reply-on-reviews' ? 'blue' : 'purple'}`}>
                        <Zap size={18} />
                      </div>
                      <div className="automations-item-info">
                        <h3 className="automations-item-name">{automation.name}</h3>
                        <div className="automations-item-meta">
                          <span className={`automations-item-badge ${statusBadge.bg} ${statusBadge.text}`}>
                            <span className={`automations-item-dot ${statusBadge.dot}`} />
                            {statusBadge.label}
                          </span>
                          <span className="automations-item-type">
                            {getTypeLabel(automation.type)}
                          </span>
                        </div>
                        <div className="automations-item-details">
                          <span className="automations-item-detail">
                            <MapPin size={12} />
                            {automation.locationName || (isZh ? '所有门店' : 'All locations')}
                          </span>
                          <span className="automations-item-detail">
                            <Filter size={12} />
                            {getTriggerLabel(automation.trigger, automation.ratingFilter)}
                          </span>
                          {automation.replyMode === 'ai-agent' && (
                            <span className="automations-item-detail agent">
                              <Bot size={12} />
                              {automation.aiAgentName || (isZh ? 'AI 助手' : 'AI Agent')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="automations-item-right">
                      <div className="automations-item-stats">
                        <div className="automations-item-stat">
                          <span className="automations-item-stat-num">{automation.totalTriggered || 0}</span>
                          <span className="automations-item-stat-label">{isZh ? '触发次数' : 'Triggered'}</span>
                        </div>
                        {automation.lastTriggered && (
                          <div className="automations-item-stat">
                            <span className="automations-item-stat-num">
                              {new Date(automation.lastTriggered).toLocaleDateString()}
                              </span>
                            <span className="automations-item-stat-label">{isZh ? '最近' : 'Last'}</span>
                            </div>
                        )}
                          </div>

                      <div className="automations-item-controls">
                            <button
                              onClick={() => handleToggleStatus(automation)}
                          className={`automations-control-btn ${automation.status === 'live' ? 'pause' : 'play'}`}
                          title={automation.status === 'live'
                            ? (isZh ? '暂停' : 'Pause')
                            : (isZh ? '启动' : 'Launch')
                          }
                        >
                          {automation.status === 'live' ? <Pause size={15} /> : <Play size={15} />}
                            </button>

                        <div className="automations-menu-wrapper">
                              <button
                                onClick={(e) => setMenuAnchor(automation.id === menuAnchor?.id ? null : { el: e.currentTarget, id: automation.id })}
                            className="automations-control-btn menu"
                              >
                            <MoreVertical size={15} />
                              </button>

                              {menuAnchor?.id === automation.id && (
                                <>
                              <div className="automations-menu-overlay" onClick={() => setMenuAnchor(null)} />
                              <div className="automations-menu">
                                    <button
                                      onClick={() => { setEditingAutomation(automation); setShowNewModal(true); setMenuAnchor(null); }}
                                  className="automations-menu-item"
                                    >
                                  <Pencil size={14} />
                                  {isZh ? '编辑' : 'Edit'}
                                    </button>
                                    <button
                                      onClick={() => setConfirmDelete(automation.id)}
                                  className="automations-menu-item danger"
                                    >
                                  <Trash2 size={14} />
                                  {isZh ? '删除' : 'Delete'}
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                          </div>
                );
              })}
          </div>
          )
        ) : (
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
          <div className="automations-modal-overlay" onClick={() => setConfirmDelete(null)} />
          <div className="automations-modal">
            <div className="automations-modal-header">
              <div className="automations-modal-icon danger">
                <Trash2 size={20} />
                </div>
                <div>
                <h3>{isZh ? '删除规则' : 'Delete Rule'}</h3>
                <p>{isZh ? '此操作无法撤销' : 'This action cannot be undone'}</p>
                </div>
              </div>
            <div className="automations-modal-actions">
                <button
                  onClick={() => setConfirmDelete(null)}
                className="automations-modal-btn cancel"
                >
                {isZh ? '取消' : 'Cancel'}
                </button>
                <button
                  onClick={() => handleDelete(confirmDelete)}
                className="automations-modal-btn danger"
                >
                {isZh ? '删除' : 'Delete'}
                </button>
              </div>
          </div>
          </>
        )}

      <style>{`
        .automations-page {
          padding: 28px 32px 48px 280px;
          max-width: 1100px;
        }

        @media (max-width: 1023px) {
          .automations-page {
            padding-left: 32px;
          }
        }

        /* Header */
        .automations-header {
          margin-bottom: 28px;
        }

        .automations-title-row {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 20px;
        }

        .automations-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: linear-gradient(135deg, #1e3a5f 0%, #2d4a6f 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .automations-title {
          font-family: 'Manrope', sans-serif;
          font-size: 24px;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.02em;
          margin: 0 0 4px;
        }

        .automations-subtitle {
          font-size: 14px;
          color: #64748b;
          margin: 0;
        }

        .automations-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        /* Tabs */
        .automations-tabs {
          display: flex;
          background: #f1f5f9;
          border-radius: 10px;
          padding: 4px;
        }

        .automations-tab {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border: none;
          background: transparent;
          color: #64748b;
          font-size: 13px;
          font-weight: 600;
          border-radius: 7px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .automations-tab:hover {
          color: #0f172a;
        }

        .automations-tab.active {
          background: white;
          color: #0f172a;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }

        .automations-tab-count {
          background: #e2e8f0;
          color: #64748b;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 100px;
        }

        .automations-tab.active .automations-tab-count {
          background: #1e3a5f;
          color: white;
        }

        /* Add Button */
        .automations-add-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 9px 16px;
          background: #0f172a;
          color: white;
          font-size: 13px;
          font-weight: 600;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .automations-add-btn:hover {
          background: #1e3a5f;
          transform: translateY(-1px);
        }

        .automations-add-btn.primary {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          box-shadow: 0 2px 8px rgba(79, 172, 254, 0.3);
        }

        .automations-add-btn.primary:hover {
          box-shadow: 0 4px 12px rgba(79, 172, 254, 0.4);
          transform: translateY(-1px);
        }

        /* Stats */
        .automations-stats {
          display: flex;
          align-items: center;
          gap: 0;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px 24px;
          margin-bottom: 24px;
          width: fit-content;
        }

        .automations-stat {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .automations-stat-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .automations-stat-icon.live {
          background: #ecfdf5;
          color: #10b981;
        }

        .automations-stat-icon.paused {
          background: #fffbeb;
          color: #d97706;
        }

        .automations-stat-icon.draft {
          background: #f8fafc;
          color: #94a3b8;
        }

        .automations-stat-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #94a3b8;
        }

        .automations-stat-info {
          display: flex;
          flex-direction: column;
        }

        .automations-stat-num {
          font-family: 'Manrope', sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.2;
        }

        .automations-stat-label {
          font-size: 12px;
          color: #64748b;
        }

        .automations-stat-divider {
          width: 1px;
          height: 32px;
          background: #e2e8f0;
          margin: 0 24px;
        }

        /* Empty State - Setup Wizard */
        .automations-empty {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 32px;
        }

        .automations-empty-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .automations-empty-icon {
          width: 60px;
          height: 60px;
          border-radius: 16px;
          background: linear-gradient(135deg, #1e3a5f 0%, #2d4a6f 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          margin: 0 auto 16px;
        }

        .automations-empty-header h2 {
          font-family: 'Manrope', sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 8px;
        }

        .automations-empty-header p {
          font-size: 14px;
          color: #64748b;
          margin: 0;
        }

        /* Steps */
        .automations-steps {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        }

        .automations-step {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          transition: all 0.15s;
        }

        .automations-step.done {
          background: #f0fdf4;
          border-color: #bbf7d0;
        }

        .automations-step.disabled {
          opacity: 0.5;
        }

        .automations-step-num {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: white;
          border: 2px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 700;
          color: #64748b;
          flex-shrink: 0;
        }

        .automations-step.done .automations-step-num {
          background: #10b981;
          border-color: #10b981;
          color: white;
        }

        .automations-step-content {
          flex: 1;
        }

        .automations-step-content h3 {
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
          margin: 0 0 4px;
        }

        .automations-step-content p {
          font-size: 13px;
          color: #64748b;
          margin: 0;
        }

        .automations-step-action {
          flex-shrink: 0;
        }

        .automations-step-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: #0f172a;
          color: white;
          font-size: 12px;
          font-weight: 600;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .automations-step-btn.primary {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          box-shadow: 0 2px 8px rgba(79, 172, 254, 0.3);
        }

        .automations-step-btn.primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(79, 172, 254, 0.4);
        }

        .automations-step-btn.disabled {
          background: #e2e8f0;
          color: #94a3b8;
          cursor: not-allowed;
        }

        .automations-step-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .automations-step-check {
          color: #10b981;
        }

        .automations-step-live {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #10b981;
        }

        .automations-step-live-dot {
          width: 8px;
          height: 8px;
          background: #10b981;
          border-radius: 50%;
          animation: automations-pulse 2s ease-in-out infinite;
        }

        @keyframes automations-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .automations-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: automations-spin 0.8s linear infinite;
        }

        @keyframes automations-spin {
          to { transform: rotate(360deg); }
        }

        .automations-skip {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          width: 100%;
          padding: 10px;
          background: transparent;
          border: none;
          color: #64748b;
          font-size: 13px;
          cursor: pointer;
          transition: color 0.15s;
        }

        .automations-skip:hover {
          color: #0f172a;
        }

        /* Empty Simple */
        .automations-empty-simple {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 60px 32px;
          text-align: center;
          color: #94a3b8;
        }

        .automations-empty-simple h3 {
          font-family: 'Manrope', sans-serif;
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          margin: 16px 0 8px;
        }

        .automations-empty-simple p {
          font-size: 14px;
          color: #64748b;
          margin: 0 0 24px;
          max-width: 360px;
          margin-left: auto;
          margin-right: auto;
        }

        /* Automation List */
        .automations-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .automations-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 18px 20px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          transition: all 0.15s;
        }

        .automations-item:hover {
          border-color: #cbd5e1;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }

        .automations-item-left {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          flex: 1;
          min-width: 0;
        }

        .automations-item-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .automations-item-icon.blue {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
        }

        .automations-item-icon.purple {
          background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
          color: white;
        }

        .automations-item-info {
          flex: 1;
          min-width: 0;
        }

        .automations-item-name {
          font-size: 15px;
          font-weight: 600;
          color: #0f172a;
          margin: 0 0 6px;
        }

        .automations-item-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .automations-item-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 8px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 600;
        }

        .automations-item-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .automations-item-type {
          font-size: 12px;
          color: #64748b;
        }

        .automations-item-details {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }

        .automations-item-detail {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: #64748b;
        }

        .automations-item-detail.agent {
          color: #8b5cf6;
        }

        .automations-item-right {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-shrink: 0;
        }

        .automations-item-stats {
          display: flex;
          gap: 20px;
        }

        .automations-item-stat {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .automations-item-stat-num {
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
        }

        .automations-item-stat-label {
          font-size: 11px;
          color: #94a3b8;
        }

        .automations-item-controls {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .automations-control-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s;
        }

        .automations-control-btn.play {
          background: #ecfdf5;
          color: #10b981;
        }

        .automations-control-btn.play:hover {
          background: #d1fae5;
        }

        .automations-control-btn.pause {
          background: #fffbeb;
          color: #d97706;
        }

        .automations-control-btn.pause:hover {
          background: #fef3c7;
        }

        .automations-control-btn.menu {
          background: #f1f5f9;
          color: #64748b;
        }

        .automations-control-btn.menu:hover {
          background: #e2e8f0;
          color: #0f172a;
        }

        .automations-menu-wrapper {
          position: relative;
        }

        .automations-menu-overlay {
          position: fixed;
          inset: 0;
          z-index: 40;
        }

        .automations-menu {
          position: absolute;
          right: 0;
          top: calc(100% + 4px);
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
          overflow: hidden;
          z-index: 50;
          min-width: 140px;
        }

        .automations-menu-item {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 10px 14px;
          background: transparent;
          border: none;
          font-size: 13px;
          color: #0f172a;
          cursor: pointer;
          text-align: left;
          transition: background 0.1s;
        }

        .automations-menu-item:hover {
          background: #f8fafc;
        }

        .automations-menu-item.danger {
          color: #dc2626;
        }

        .automations-menu-item.danger:hover {
          background: #fef2f2;
        }

        /* Modal */
        .automations-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.4);
          z-index: 50;
        }

        .automations-modal {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: white;
          border-radius: 16px;
          padding: 24px;
          z-index: 60;
          width: 100%;
          max-width: 400px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        }

        .automations-modal-header {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          margin-bottom: 20px;
        }

        .automations-modal-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .automations-modal-icon.danger {
          background: #fef2f2;
          color: #dc2626;
        }

        .automations-modal-header h3 {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 4px;
        }

        .automations-modal-header p {
          font-size: 13px;
          color: #64748b;
          margin: 0;
        }

        .automations-modal-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }

        .automations-modal-btn {
          padding: 10px 18px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }

        .automations-modal-btn.cancel {
          background: #f1f5f9;
          border: none;
          color: #0f172a;
        }

        .automations-modal-btn.cancel:hover {
          background: #e2e8f0;
        }

        .automations-modal-btn.danger {
          background: #dc2626;
          border: none;
          color: white;
        }

        .automations-modal-btn.danger:hover {
          background: #b91c1c;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .automations-page {
            padding: 20px 16px 40px;
          }

          .automations-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .automations-tabs {
            justify-content: center;
          }

          .automations-add-btn {
            justify-content: center;
          }

          .automations-stats {
            width: 100%;
            justify-content: center;
          }

          .automations-item {
            flex-direction: column;
            align-items: flex-start;
          }

          .automations-item-right {
            width: 100%;
            justify-content: space-between;
            padding-top: 12px;
            border-top: 1px solid #f1f5f9;
          }

          .automations-item-stats {
            gap: 16px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .automations-step-live-dot {
            animation: none;
          }

          .automations-spinner {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
