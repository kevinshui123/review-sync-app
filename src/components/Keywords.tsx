import React, { useState } from 'react';
import { Search, Plus, TrendingUp, TrendingDown, Minus, Target, BarChart2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function Keywords() {
  const [showDiscoverModal, setShowDiscoverModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto w-full pb-20"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-outline-variant/10 pb-8">
        <div>
          <span className="text-[10px] text-primary font-bold tracking-widest uppercase block mb-2">Search Optimization</span>
          <h2 className="text-3xl font-black tracking-tight text-on-surface">Keyword Management</h2>
          <p className="text-secondary mt-1 max-w-xl text-sm">
            Track your local search rankings, monitor search volumes, and discover new keyword opportunities.
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowDiscoverModal(true)}
            className="flex items-center gap-2 bg-surface-container-low hover:bg-surface-container-highest px-4 py-2.5 rounded-lg border border-outline-variant/10 transition-colors text-sm font-semibold text-on-surface"
          >
            <Search className="w-4 h-4 text-secondary" />
            Discover
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-primary text-on-primary hover:brightness-105 px-4 py-2.5 rounded-lg font-bold text-sm transition-all shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            Add Keywords
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Tracked Keywords" value="142" subtitle="+12 this month" icon={<Target className="w-5 h-5 text-primary" />} />
        <StatCard title="Top 3 Rankings" value="28" subtitle="20% of tracked" icon={<TrendingUp className="w-5 h-5 text-emerald-400" />} />
        <StatCard title="Avg. Search Volume" value="2.4K" subtitle="Across all keywords" icon={<BarChart2 className="w-5 h-5 text-tertiary" />} />
      </div>

      {/* Keywords Table */}
      <div className="bg-surface-container rounded-2xl border border-outline-variant/5 overflow-hidden">
        <div className="p-6 border-b border-outline-variant/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-container-low/30">
          <div className="flex items-center bg-surface-container-lowest px-3 py-2 rounded-lg border border-outline-variant/10 w-full sm:w-72">
            <Search className="text-secondary w-4 h-4 mr-2" />
            <input 
              type="text" 
              placeholder="Search tracked keywords..." 
              className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-outline/50 text-on-surface outline-none"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <select className="bg-surface-container-lowest border border-outline-variant/10 rounded-lg px-3 py-2 text-sm text-on-surface outline-none w-full sm:w-auto">
              <option>All Locations</option>
              <option>San Francisco</option>
              <option>Arlington</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-surface-container-low/50">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-outline">Keyword</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-outline text-right">Volume</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-outline text-right">Current Rank</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-outline text-right">Change (30d)</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-outline text-right">Difficulty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              <KeywordRow keyword="mahjong near me" volume="12,400" rank={1} change={2} difficulty={45} />
              <KeywordRow keyword="szechuan restaurant sf" volume="8,100" rank={3} change={1} difficulty={62} />
              <KeywordRow keyword="dim sum delivery" volume="5,400" rank={8} change={-2} difficulty={78} />
              <KeywordRow keyword="best hot pot" volume="22,000" rank={14} change={0} difficulty={85} />
              <KeywordRow keyword="authentic chinese food" volume="18,500" rank={5} change={4} difficulty={68} />
              <KeywordRow keyword="late night asian food" volume="3,200" rank={2} change={1} difficulty={35} />
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showDiscoverModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-container rounded-2xl p-6 max-w-md w-full border border-outline-variant/10 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-on-surface">Discover Keywords</h3>
                <button onClick={() => setShowDiscoverModal(false)} className="text-secondary hover:text-on-surface">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-secondary mb-6">
                Our AI is analyzing your competitors and local search trends. This feature will be fully available once your Google Business Profile API access is approved.
              </p>
              <div className="flex justify-end">
                <button 
                  onClick={() => setShowDiscoverModal(false)}
                  className="bg-primary text-on-primary px-4 py-2 rounded-lg font-bold text-sm hover:brightness-105 transition-all"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-container rounded-2xl p-6 max-w-md w-full border border-outline-variant/10 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-on-surface">Add Keywords</h3>
                <button onClick={() => setShowAddModal(false)} className="text-secondary hover:text-on-surface">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-outline mb-2">Keywords (comma separated)</label>
                  <textarea 
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-3 text-sm text-on-surface outline-none focus:border-primary transition-colors min-h-[100px]"
                    placeholder="e.g. best coffee shop, coffee near me..."
                  ></textarea>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg font-bold text-sm text-secondary hover:text-on-surface transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    alert('Keywords added successfully!');
                    setShowAddModal(false);
                  }}
                  className="bg-primary text-on-primary px-4 py-2 rounded-lg font-bold text-sm hover:brightness-105 transition-all"
                >
                  Add to Tracker
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StatCard({ title, value, subtitle, icon }: any) {
  return (
    <div className="bg-surface-container rounded-2xl p-6 border border-outline-variant/5 flex items-start gap-4">
      <div className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-1">{title}</p>
        <h3 className="text-3xl font-black text-on-surface tracking-tight">{value}</h3>
        <p className="text-xs text-secondary mt-1 font-medium">{subtitle}</p>
      </div>
    </div>
  );
}

function KeywordRow({ keyword, volume, rank, change, difficulty }: any) {
  const isUp = change > 0;
  const isDown = change < 0;
  const isFlat = change === 0;

  let diffColor = "bg-emerald-500";
  if (difficulty > 50) diffColor = "bg-amber-400";
  if (difficulty > 75) diffColor = "bg-rose-500";

  return (
    <tr className="hover:bg-surface-container-high/40 transition-colors">
      <td className="px-6 py-4 font-bold text-sm text-on-surface">{keyword}</td>
      <td className="px-6 py-4 text-sm text-outline text-right font-mono">{volume}</td>
      <td className="px-6 py-4 text-sm text-on-surface font-bold text-right font-mono">
        {rank <= 3 ? <span className="text-emerald-400">#{rank}</span> : `#${rank}`}
      </td>
      <td className="px-6 py-4 text-right">
        <div className={`flex items-center justify-end gap-1 text-xs font-bold ${isUp ? 'text-emerald-400' : isDown ? 'text-rose-400' : 'text-secondary'}`}>
          {isUp && <TrendingUp className="w-3 h-3" />}
          {isDown && <TrendingDown className="w-3 h-3" />}
          {isFlat && <Minus className="w-3 h-3" />}
          <span>{isFlat ? '-' : Math.abs(change)}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center justify-end gap-3">
          <span className="text-xs font-bold text-outline">{difficulty}/100</span>
          <div className="w-16 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
            <div className={`h-full ${diffColor}`} style={{ width: `${difficulty}%` }}></div>
          </div>
        </div>
      </td>
    </tr>
  );
}
