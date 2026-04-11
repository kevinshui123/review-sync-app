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
  PictureAsPdf,
  Description,
  TableChart,
  Download,
  CheckCircle,
  Close,
  Add,
} from '@mui/icons-material';
import { motion } from 'motion/react';

interface ReportsProps {
  setActiveTab: (tab: string) => void;
}

export function Reports({ setActiveTab }: ReportsProps) {
  const [reportType, setReportType] = useState('gbp');
  const [reportFormat, setReportFormat] = useState('pdf');

  const reportTypes = [
    { id: 'gbp', title: 'GBP performance', desc: 'Google Business Profile visibility and interaction metrics' },
    { id: 'reviews', title: 'Reviews metrics', desc: 'Sentiment analysis and rating distribution over time' },
    { id: 'export', title: 'Export reviews', desc: 'Raw data dump of all customer feedback content' },
  ];

  const metrics = [
    'Search Visibility',
    'Direct Direction Requests',
    'Call Interactions',
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-8 max-w-5xl mx-auto"
    >
      {/* Header */}
      <div className="mb-10">
        <h2 className="text-3xl font-extrabold font-headline tracking-tight mb-2">Reports</h2>
        <p className="text-slate-500">Configure and export detailed performance insights for your curated listings.</p>
      </div>

      {/* Bento Grid Configurator */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Section 1: Report Type & Format */}
        <div className="md:col-span-7 space-y-6">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-6">1. Configuration</h3>

            {/* Report Type */}
            <div className="space-y-4 mb-8">
              <label className="block text-sm font-semibold mb-3">Report Type</label>
              <div className="grid grid-cols-1 gap-3">
                {reportTypes.map((type) => (
                  <label
                    key={type.id}
                    className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      reportType === type.id
                        ? 'border-primary bg-primary/5'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="report_type"
                      value={type.id}
                      checked={reportType === type.id}
                      onChange={() => setReportType(type.id)}
                      className="w-4 h-4 text-primary border-slate-300 focus:ring-primary/20"
                    />
                    <div className="ml-4">
                      <span className="block text-sm font-bold">{type.title}</span>
                      <span className="block text-xs text-slate-500">{type.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Format */}
            <div className="space-y-4">
              <label className="block text-sm font-semibold mb-3">Report Format</label>
              <div className="flex gap-4">
                <label
                  className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    reportFormat === 'pdf'
                      ? 'border-primary bg-primary/5'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="format"
                    value="pdf"
                    checked={reportFormat === 'pdf'}
                    onChange={() => setReportFormat('pdf')}
                    className="hidden"
                  />
                  <PictureAsPdf className="text-primary w-5 h-5" />
                  <span className="text-sm font-bold">PDF Visual</span>
                </label>
                <label
                  className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    reportFormat === 'csv'
                      ? 'border-primary bg-primary/5'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="format"
                    value="csv"
                    checked={reportFormat === 'csv'}
                    onChange={() => setReportFormat('csv')}
                    className="hidden"
                  />
                  <TableChart className="text-slate-500 w-5 h-5" />
                  <span className="text-sm font-bold">CSV Raw</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Parameters */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-6">2. Parameters</h3>

            {/* Source Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2">Source selection</label>
              <div className="relative">
                <select className="w-full bg-slate-100 border-none rounded-lg py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 appearance-none">
                  <option>Mahjong mini bowl</option>
                  <option>Noodle Bar South</option>
                  <option>Dumpling House Plaza</option>
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  ▼
                </span>
              </div>
            </div>

            {/* Date Range */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2">Date range</label>
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-slate-100 border-none rounded-lg py-3 px-4 text-xs focus:ring-2 focus:ring-primary/20"
                  type="date"
                  defaultValue="2026-03-01"
                />
                <input
                  className="flex-1 bg-slate-100 border-none rounded-lg py-3 px-4 text-xs focus:ring-2 focus:ring-primary/20"
                  type="date"
                  defaultValue="2026-03-31"
                />
              </div>
            </div>

            {/* Metrics Selection */}
            <div>
              <label className="block text-sm font-semibold mb-3">Metrics selected</label>
              <div className="space-y-2">
                {metrics.map((metric, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg group">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="text-primary w-4 h-4" style={{ fontVariationSettings: "'FILL' 1" }} />
                      <span className="text-xs font-medium">{metric}</span>
                    </div>
                    <button className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Close className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button className="w-full flex items-center justify-center gap-2 p-2 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-xs font-semibold hover:border-primary hover:text-primary transition-all mt-2">
                  <Add className="w-4 h-4" />
                  Add Custom Metric
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="md:col-span-12 flex justify-center pt-6">
          <button className="bg-primary hover:bg-primary-container text-white px-10 py-5 rounded-xl font-bold text-lg shadow-lg flex items-center gap-4 transition-all hover:-translate-y-1 active:translate-y-0 w-full max-w-lg justify-center">
            <Download className="w-5 h-5" />
            Download report
          </button>
        </div>
      </div>

      {/* Preview Placeholder Area */}
      <div className="mt-16 border-t border-slate-200 pt-10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold">Recent Exports</h3>
          <button className="text-primary text-sm font-semibold hover:underline">View all</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-50 p-5 rounded-xl relative overflow-hidden">
            <div className="flex items-start justify-between">
              <Description className="text-slate-300 w-10 h-10" />
              <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded">READY</span>
            </div>
            <div className="mt-4">
              <h4 className="text-sm font-bold">Monthly_Performance_Mar.pdf</h4>
              <p className="text-[11px] text-slate-500">Generated 2 hours ago</p>
            </div>
          </div>
          <div className="bg-slate-50 p-5 rounded-xl relative overflow-hidden">
            <div className="flex items-start justify-between">
              <TableChart className="text-slate-300 w-10 h-10" />
              <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded">READY</span>
            </div>
            <div className="mt-4">
              <h4 className="text-sm font-bold">Reviews_Raw_Data_Q1.csv</h4>
              <p className="text-[11px] text-slate-500">Generated yesterday</p>
            </div>
          </div>
          <div className="bg-slate-50 p-5 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center">
            <p className="text-xs text-slate-400 italic">History automatically clears after 30 days</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
