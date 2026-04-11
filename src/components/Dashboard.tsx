import React, { useState, useEffect } from 'react';
import {
  Search,
  Map,
  AdsClick,
  Directions,
  Call,
  Star,
  CheckCircle,
  RadioButtonUnchecked,
  TrendingUp,
  AutoAwesome,
  Bolt,
} from '@mui/icons-material';
import { motion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}

function MetricCard({ icon, label, value, change, changeType = 'neutral' }: MetricCardProps) {
  const changeColor = {
    positive: 'text-green-600 bg-green-50',
    negative: 'text-red-600 bg-red-50',
    neutral: 'text-slate-400 bg-slate-50',
  }[changeType];

  return (
    <div className="bg-white rounded-xl p-5 flex flex-col gap-1 style={{ boxShadow: '0px 12px 32px rgba(25, 28, 29, 0.06)' }}">
      <div className="flex items-center justify-between mb-2">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
        {change && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${changeColor}`}>
            {change}
          </span>
        )}
      </div>
      <span className="text-2xl font-extrabold font-headline tracking-tight">{value}</span>
      <span className="text-[11px] font-medium text-slate-500">{label}</span>
    </div>
  );
}

function HealthGauge({ score }: { score: number }) {
  const rotation = (score / 100) * 180;

  return (
    <div className="relative w-40 h-24 mb-2 overflow-hidden mx-auto">
      <div className="w-40 h-40 rounded-full border-[12px] border-slate-100 absolute top-0"></div>
      <div
        className="w-40 h-40 rounded-full border-[12px] border-primary absolute top-0"
        style={{
          clipPath: `polygon(0 0, 100% 0, 100% ${50 - score / 2}%, 0 ${50 - score / 2}%)`,
          transform: 'rotate(180deg)',
        }}
      ></div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
        <span className="text-2xl font-bold font-headline">{score}</span>
        <span className="text-sm font-medium text-slate-400">/100</span>
      </div>
    </div>
  );
}

export function Dashboard({ setActiveTab }: DashboardProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const metrics = [
    { icon: <Search className="w-5 h-5" />, label: 'Search views', value: '1.2k', change: '+12%', changeType: 'positive' as const },
    { icon: <Map className="w-5 h-5" />, label: 'Map views', value: '842', change: '+5%', changeType: 'positive' as const },
    { icon: <AdsClick className="w-5 h-5" />, label: 'Website clicks', value: '312', change: '-2%', changeType: 'negative' as const },
    { icon: <Directions className="w-5 h-5" />, label: 'Direction requests', value: '156', change: '+18%', changeType: 'positive' as const },
    { icon: <Call className="w-5 h-5" />, label: 'Phone calls', value: '48', change: '0%', changeType: 'neutral' as const },
  ];

  const healthItems = [
    { text: 'Verified Address', done: true },
    { text: 'Operating Hours Set', done: true },
    { text: 'Add Missing Photos (4)', done: false },
  ];

  const impressions = [452, 320, 160, 560, 280, 200, 120];
  const maxImpression = Math.max(...impressions);

  const reviews = [
    {
      name: 'Sarah Jenkins',
      time: '2 hours ago',
      stars: 5,
      text: 'The curation process was incredibly smooth. I loved the attention to detail and how professional the team handled my requests.',
    },
    {
      name: 'Marcus Chen',
      time: 'Yesterday',
      stars: 4,
      text: 'Solid experience overall. The platform is powerful, though it took a little time to master all the bulk editing tools.',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-6 lg:p-8 max-w-[1400px] mx-auto"
    >
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold font-headline text-on-surface mb-1">
          Hi, Editorial Intel
        </h2>
        <p className="text-slate-500 text-sm">
          Here is what's happening with your curated listings today.
        </p>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Key Metrics Row */}
        <div className="col-span-12 lg:col-span-8 grid grid-cols-2 md:grid-cols-5 gap-4">
          {metrics.map((metric, i) => (
            <MetricCard key={i} {...metric} />
          ))}
        </div>

        {/* Location Health (Right side) */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-xl p-6 style={{ boxShadow: '0px 12px 32px rgba(25, 28, 29, 0.06)' }}">
          <h3 className="text-lg font-bold font-headline mb-4 text-center">Location Health</h3>
          <HealthGauge score={90} />
          <p className="text-xs text-slate-500 text-center px-6 mb-6">
            Your listings are nearly perfect. Complete the checklist to reach 100%.
          </p>
          <div className="space-y-3">
            {healthItems.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                {item.done ? (
                  <CheckCircle className="w-5 h-5 text-green-600" style={{ fontVariationSettings: "'FILL' 1" }} />
                ) : (
                  <RadioButtonUnchecked className="w-5 h-5 text-primary" />
                )}
                <span className="text-sm font-medium">{item.text}</span>
              </div>
            ))}
          </div>
          <button className="w-full py-3 bg-primary/5 text-primary text-xs font-bold rounded-lg hover:bg-primary/10 transition-colors mt-4">
            Improve Health
          </button>
        </div>

        {/* Overview: Actions Chart */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-xl p-8 style={{ boxShadow: '0px 12px 32px rgba(25, 28, 29, 0.06)' }}">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold font-headline">Overview: Actions</h3>
              <p className="text-xs text-slate-500">Total conversions vs previous period</p>
            </div>
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary"></span>
                <span className="text-xs font-medium text-slate-500">Conversions</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-200"></span>
                <span className="text-xs font-medium text-slate-500">Previous</span>
              </div>
            </div>
          </div>

          {/* Simple Line Chart */}
          <div className="h-48 w-full flex items-end">
            <svg className="w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="none">
              <path
                d="M0,150 Q100,120 200,140 T400,80 T600,100 T800,40"
                fill="none"
                stroke="#003d9b"
                strokeLinecap="round"
                strokeWidth="3"
              />
              <path
                d="M0,170 Q100,160 200,175 T400,140 T600,160 T800,130"
                fill="none"
                stroke="#e7e8e9"
                strokeDasharray="8,4"
                strokeLinecap="round"
                strokeWidth="3"
              />
            </svg>
          </div>
          <div className="flex justify-between mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
          </div>
        </div>

        {/* Impressions Chart */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-xl p-6 style={{ boxShadow: '0px 12px 32px rgba(25, 28, 29, 0.06)' }}">
          <h3 className="text-sm font-bold font-headline mb-6">Overview: Impressions</h3>
          <div className="flex items-end justify-between h-32 gap-2 mb-4">
            {impressions.map((val, i) => (
              <div
                key={i}
                className={`flex-1 rounded-t-lg transition-colors cursor-pointer group relative ${
                  i === 3 ? 'bg-primary' : 'bg-primary/10 hover:bg-primary'
                }`}
                style={{ height: `${(val / maxImpression) * 100}%` }}
              >
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {val}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] font-bold text-slate-400">
            <span>W1</span><span>W2</span><span>W3</span><span>W4</span><span>W5</span><span>W6</span><span>W7</span>
          </div>
        </div>

        {/* Latest Reviews */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-xl p-8 style={{ boxShadow: '0px 12px 32px rgba(25, 28, 29, 0.06)' }}">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold font-headline">Latest Reviews</h3>
            <div className="flex bg-slate-50 rounded-xl p-1 gap-1">
              <button className="px-4 py-1.5 text-xs font-bold rounded-lg bg-white shadow-sm text-primary">All</button>
              <button className="px-4 py-1.5 text-xs font-medium rounded-lg text-slate-500 hover:bg-white transition-all">Positive</button>
              <button className="px-4 py-1.5 text-xs font-medium rounded-lg text-slate-500 hover:bg-white transition-all">Negative</button>
            </div>
          </div>

          <div className="space-y-6">
            {reviews.map((review, i) => (
              <div key={i} className={`flex gap-4 items-start ${i < reviews.length - 1 ? 'pb-6 border-b border-slate-100' : ''}`}>
                <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0 overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold">
                    {review.name.charAt(0)}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-bold text-sm">{review.name}</h4>
                    <span className="text-[10px] text-slate-400 font-medium">{review.time}</span>
                  </div>
                  <div className="flex text-amber-400 mb-2">
                    {Array.from({ length: 5 }).map((_, si) => (
                      <Star
                        key={si}
                        className={`w-4 h-4 ${si < review.stars ? 'text-amber-400' : 'text-slate-300'}`}
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{review.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Suggestion Card */}
        <div className="col-span-12 lg:col-span-4 bg-gradient-to-br from-primary/5 to-primary-container/5 rounded-xl p-6 border border-primary/10">
          <div className="flex items-center gap-2 text-tertiary font-bold mb-2">
            <AutoAwesome className="w-5 h-5" style={{ fontVariationSettings: "'FILL' 1" }} />
            <span className="text-xs uppercase tracking-wider">Editorial Suggestion</span>
          </div>
          <h3 className="text-xl font-extrabold font-headline mb-3">
            Your organic search visibility has increased by 14% this month
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed mb-6">
            The "Digital Curator" has analyzed your recent content updates and location syncs. Your prominence in local map results is significantly higher.
          </p>
          <button
            onClick={() => setActiveTab('reports')}
            className="bg-primary hover:bg-primary-container text-white px-6 py-3 rounded-full font-bold text-sm transition-all style={{ boxShadow: '0px 12px 32px rgba(25, 28, 29, 0.06)' }}"
          >
            Generate Detailed Report
          </button>
        </div>
      </div>
    </motion.div>
  );
}
