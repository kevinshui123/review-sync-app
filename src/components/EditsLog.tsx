import React, { useState } from 'react';
import {
  Dashboard,
  PushPin,
  RateReview,
  Edit,
  CalendarToday,
  History,
  BarChart,
  Public,
  Settings,
  CheckCircle,
  Cancel,
  CalendarMonth,
  Add,
} from '@mui/icons-material';
import { motion } from 'motion/react';

interface EditsLogProps {
  setActiveTab: (tab: string) => void;
}

export function EditsLog({ setActiveTab }: EditsLogProps) {
  const [activeFilter, setActiveFilter] = useState('waiting');

  const filterItems = [
    { id: 'waiting', label: 'Waiting for approval', icon: History, count: 0, active: true },
    { id: 'accepted', label: 'Accepted', icon: CheckCircle, count: 0 },
    { id: 'declined', label: 'Declined', icon: Cancel, count: 0 },
    { id: 'history', label: 'History', icon: CalendarMonth, count: 0 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-1 overflow-hidden"
    >
      {/* Filter Sidebar */}
      <nav className="w-64 bg-slate-50 p-6 flex flex-col gap-6 overflow-y-auto">
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Filter by Status</h3>
          <ul className="space-y-1">
            {filterItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeFilter === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveFilter(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                      isActive
                        ? 'bg-white text-primary font-semibold shadow-sm'
                        : 'text-slate-500 hover:bg-white/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                      <span className="text-sm">{item.label}</span>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-primary/10 text-primary font-bold' : 'bg-slate-200 text-slate-500'
                    }`}>
                      {item.count}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="pt-6 border-t border-slate-200">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Date Range</h3>
          <div className="relative">
            <input
              className="w-full pl-10 pr-4 py-2.5 bg-white border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20"
              placeholder="Select dates"
              type="text"
            />
            <CalendarMonth className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          </div>
        </div>
      </nav>

      {/* Empty State Canvas */}
      <section className="flex-1 bg-white p-10 flex items-center justify-center">
        <div className="max-w-md w-full text-center space-y-8">
          {/* Glassmorphism Container */}
          <div className="relative">
            <div className="absolute -inset-10 bg-primary/5 blur-3xl rounded-full"></div>
            <div className="relative bg-slate-50/80 backdrop-blur-xl rounded-[2.5rem] border border-white/50 p-12 shadow-2xl shadow-blue-900/5">
              <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary-container rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-lg shadow-primary/20">
                <History className="text-white text-5xl w-12 h-12 opacity-30" />
              </div>
              <h3 className="text-2xl font-extrabold font-headline text-slate-900 mb-3 tracking-tight">No listing edits</h3>
              <p className="text-slate-500 leading-relaxed mb-8 max-w-xs mx-auto">
                All your listing edits have been processed. New requests awaiting review will appear here automatically.
              </p>
              <button className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-container text-white font-semibold rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-md">
                <Add className="w-5 h-5" />
                Create New Edit
              </button>
            </div>
          </div>

          {/* Subtle Footer Metadata */}
          <div className="flex items-center justify-center gap-6 text-slate-400/40">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Sync Active</span>
            </div>
            <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
            <div className="flex items-center gap-1.5">
              <History className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Updated Just Now</span>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
