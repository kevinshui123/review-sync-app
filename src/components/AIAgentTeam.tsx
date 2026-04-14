import React, { useState } from 'react';
import {
  SmartToy,
  Add,
  Edit,
  Delete,
  MoreVert,
  Psychology,
  RecordVoiceOver,
  Business,
  AutoAwesome,
  CheckCircle,
  RocketLaunch,
  Lightbulb,
} from '@mui/icons-material';
import type { AIAgent } from '../types/automation';
import { AIAgentEditor } from './AIAgentEditor';
import { apiPost } from '../utils/api';

interface AIAgentTeamProps {
  agents: AIAgent[];
  onRefresh: () => void;
}

export function AIAgentTeam({ agents, onRefresh }: AIAgentTeamProps) {
  const [showEditor, setShowEditor] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AIAgent | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [isCreatingDefault, setIsCreatingDefault] = useState(false);

  // 创建默认Agent
  const createDefaultAgent = async () => {
    setIsCreatingDefault(true);
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
        onRefresh();
      }
    } catch (error) {
      console.error('Failed to create default agent:', error);
    } finally {
      setIsCreatingDefault(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/ai-agents/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        onRefresh();
        setConfirmDelete(null);
        setMenuAnchor(null);
      }
    } catch (error) {
      console.error('Failed to delete agent:', error);
    }
  };

  const getToneColor = (tone: string) => {
    switch (tone) {
      case 'professional': return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
      case 'friendly': return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' };
      case 'empathetic': return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' };
      case 'custom': return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' };
      default: return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
    }
  };

  const getToneIcon = (tone: string) => {
    switch (tone) {
      case 'professional': return <Business className="w-4 h-4" />;
      case 'friendly': return <RecordVoiceOver className="w-4 h-4" />;
      case 'empathetic': return <Psychology className="w-4 h-4" />;
      case 'custom': return <AutoAwesome className="w-4 h-4" />;
      default: return <SmartToy className="w-4 h-4" />;
    }
  };

  const getAgentAvatar = (agent: AIAgent, index: number) => {
    const colors = [
      'from-blue-500 to-indigo-600',
      'from-green-500 to-emerald-600',
      'from-purple-500 to-pink-600',
      'from-orange-500 to-red-600',
      'from-cyan-500 to-blue-600',
      'from-amber-500 to-orange-600',
    ];
    return colors[index % colors.length];
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">AI Agent Team</h2>
            <p className="text-sm text-slate-500 mt-1">
              Create custom AI agents with different personalities and expertise
            </p>
          </div>
          <button
            onClick={() => { setEditingAgent(null); setShowEditor(true); }}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:from-purple-700 hover:to-indigo-700 transition-all"
          >
            <Add className="w-5 h-5" />
            New Agent
          </button>
        </div>

        {/* Agents Grid */}
        {agents.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            {/* 引导头部 */}
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-6 text-white mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Lightbulb className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">创建您的 AI 助手</h3>
                  <p className="text-white/80 text-sm">AI 助手将帮助您自动回复客户评价</p>
                </div>
              </div>
            </div>

            {/* 选项卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 快速创建默认助手 */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200 hover:border-green-300 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                    <RocketLaunch className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">快速开始</h4>
                    <p className="text-sm text-slate-500">一键创建，立即可用</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-4">
                  创建一个预配置好的 AI 助手，适合大多数场景，无需任何设置。
                </p>
                <button
                  onClick={createDefaultAgent}
                  disabled={isCreatingDefault}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-5 py-3 rounded-xl font-bold text-sm shadow-lg hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50"
                >
                  {isCreatingDefault ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      创建中...
                    </>
                  ) : (
                    <>
                      <RocketLaunch className="w-5 h-5" />
                      创建默认助手
                    </>
                  )}
                </button>
              </div>

              {/* 自定义创建 */}
              <div className="bg-slate-50 rounded-2xl p-6 border-2 border-slate-200 hover:border-slate-300 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                    <Add className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">自定义创建</h4>
                    <p className="text-sm text-slate-500">按照您的需求配置</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-4">
                  从头开始创建自定义 AI 助手，配置专属的个性、语气和专业领域。
                </p>
                <button
                  onClick={() => { setEditingAgent(null); setShowEditor(true); }}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-3 rounded-xl font-bold text-sm shadow-lg hover:from-purple-700 hover:to-indigo-700 transition-all"
                >
                  <Add className="w-5 h-5" />
                  自定义创建
                </button>
              </div>
            </div>

            {/* 特性说明 */}
            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-2">
                    <RecordVoiceOver className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">多种语气风格</span>
                  <span className="text-xs text-slate-400">专业、友好、富有同理心</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mb-2">
                    <Psychology className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">智能学习</span>
                  <span className="text-xs text-slate-400">理解不同场景的回复</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">持续优化</span>
                  <span className="text-xs text-slate-400">根据反馈不断提升</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent, index) => {
              const toneStyle = getToneColor(agent.tone);
              return (
                <div
                  key={agent.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all"
                >
                  {/* Agent Header */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getAgentAvatar(agent, index)} flex items-center justify-center shadow-md`}>
                      <SmartToy className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 truncate">{agent.name}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${toneStyle.bg} ${toneStyle.text}`}>
                        {getToneIcon(agent.tone)}
                        {agent.tone.charAt(0).toUpperCase() + agent.tone.slice(1)}
                      </span>
                    </div>

                    {/* Menu */}
                    <div className="relative">
                      <button
                        onClick={(e) => setMenuAnchor(menuAnchor === agent.id ? null : agent.id)}
                        className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-100 transition-colors"
                      >
                        <MoreVert className="w-5 h-5" />
                      </button>

                      {menuAnchor === agent.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setMenuAnchor(null)} />
                          <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50 min-w-[140px]">
                            <button
                              onClick={() => { setEditingAgent(agent); setShowEditor(true); setMenuAnchor(null); }}
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => setConfirmDelete(agent.id)}
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

                  {/* Description */}
                  <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                    {agent.description || 'No description provided'}
                  </p>

                  {/* Expertise Tags */}
                  {agent.expertise && agent.expertise.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {agent.expertise.slice(0, 3).map((skill, i) => (
                        <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                          {skill}
                        </span>
                      ))}
                      {agent.expertise.length > 3 && (
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                          +{agent.expertise.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                    <span>Created {new Date(agent.createdAt).toLocaleDateString()}</span>
                    {agent.model && (
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-500 font-medium">
                        {agent.model === 'gemini' ? 'Gemini' : 'OpenAI'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info Card */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-5 border border-purple-100">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <SmartToy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-1">What is an AI Agent?</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                AI Agents are custom language models configured with specific personalities, tones, and expertise. Use them to generate personalized replies that match your brand voice, handle different customer scenarios, or specialize in specific review types.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Editor Modal */}
      {showEditor && (
        <AIAgentEditor
          agent={editingAgent}
          onClose={() => { setShowEditor(false); setEditingAgent(null); }}
          onSave={() => { setShowEditor(false); setEditingAgent(null); onRefresh(); }}
        />
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-50 animate-fade-in"
            onClick={() => setConfirmDelete(null)}
          />
          <div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-6 shadow-2xl z-50 w-full max-w-md animate-scale-in"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <Delete className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Delete Agent</h3>
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
    </>
  );
}
