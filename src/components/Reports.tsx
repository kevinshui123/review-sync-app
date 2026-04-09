import React from 'react';
import { Download, Filter, TrendingUp, TrendingDown, Sparkles, BarChart3, PieChart as PieChartIcon, Activity } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
  PieChart, Pie, Cell
} from 'recharts';
import { motion } from 'motion/react';

const trafficData = [
  { name: 'Week 1', organic: 4000, maps: 2400 },
  { name: 'Week 2', organic: 3000, maps: 1398 },
  { name: 'Week 3', organic: 2000, maps: 9800 },
  { name: 'Week 4', organic: 2780, maps: 3908 },
  { name: 'Week 5', organic: 1890, maps: 4800 },
  { name: 'Week 6', organic: 2390, maps: 3800 },
  { name: 'Week 7', organic: 3490, maps: 4300 },
];

const actionData = [
  { name: 'Website', value: 1240 },
  { name: 'Directions', value: 3840 },
  { name: 'Calls', value: 850 },
  { name: 'Messages', value: 420 },
];

const sourceData = [
  { name: 'Google Search', value: 45 },
  { name: 'Google Maps', value: 35 },
  { name: 'Yelp', value: 15 },
  { name: 'Bing', value: 5 },
];

const COLORS = ['#c0c1ff', '#ffb783', '#34d399', '#fb7185'];

export function Reports() {
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
          <span className="text-[10px] text-primary font-bold tracking-widest uppercase block mb-2">Performance Analytics</span>
          <h2 className="text-3xl font-black tracking-tight text-on-surface">Analytics & Reports</h2>
          <p className="text-secondary mt-1 max-w-xl text-sm">
            Comprehensive performance metrics, ROI tracking, and AI-driven insights for your local presence.
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => alert('Date range selection will be available once API is connected.')}
            className="flex items-center gap-2 bg-surface-container-low hover:bg-surface-container-highest px-4 py-2.5 rounded-lg border border-outline-variant/10 transition-colors text-sm font-semibold text-on-surface"
          >
            <Filter className="w-4 h-4 text-secondary" />
            Last 90 Days
          </button>
          <button 
            onClick={() => alert('PDF Export is generating... (Mock)')}
            className="flex items-center gap-2 bg-primary text-on-primary hover:brightness-105 px-4 py-2.5 rounded-lg font-bold text-sm transition-all shadow-lg shadow-primary/20"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Total Impressions" value="124.5K" trend="+14.2%" trendType="up" icon={<Activity className="w-5 h-5" />} />
        <KpiCard title="Total Actions" value="6,350" trend="+8.4%" trendType="up" icon={<BarChart3 className="w-5 h-5" />} />
        <KpiCard title="Conversion Rate" value="5.1%" trend="-1.2%" trendType="down" icon={<PieChartIcon className="w-5 h-5" />} />
        <KpiCard title="Est. Value Generated" value="$42,850" trend="+22.4%" trendType="up" icon={<TrendingUp className="w-5 h-5" />} />
      </div>

      {/* AI Insight Banner */}
      <div className="bg-gradient-to-r from-surface-container to-surface-container-high rounded-2xl p-6 border border-primary/20 flex items-start gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-primary/10 blur-[100px] rounded-full"></div>
        <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center shrink-0 relative z-10">
          <Sparkles className="text-primary w-6 h-6" />
        </div>
        <div className="relative z-10">
          <h3 className="text-lg font-bold text-on-surface mb-1">Executive Summary</h3>
          <p className="text-on-surface-variant leading-relaxed text-sm max-w-4xl">
            Your local search visibility has increased significantly over the last 90 days, driven primarily by a <span className="text-primary font-bold">24% surge in Google Maps direction requests</span>. 
            However, your call conversion rate has slightly dipped. We recommend updating your primary phone number and adding a "Call Now" offer to your next Google Post.
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Trend Chart */}
        <div className="lg:col-span-2 bg-surface-container rounded-2xl p-6 border border-outline-variant/5">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-on-surface">Traffic Trends</h3>
            <div className="flex gap-4 text-xs font-bold uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span className="text-outline">Organic</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-tertiary"></div>
                <span className="text-outline">Maps</span>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trafficData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1d24', border: '1px solid #ffffff10', borderRadius: '8px' }}
                  itemStyle={{ color: '#e2e2e2' }}
                />
                <Line type="monotone" dataKey="organic" stroke="#c0c1ff" strokeWidth={3} dot={{ r: 4, fill: '#c0c1ff', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="maps" stroke="#ffb783" strokeWidth={3} dot={{ r: 4, fill: '#ffb783', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Customer Actions Bar Chart */}
        <div className="bg-surface-container rounded-2xl p-6 border border-outline-variant/5 flex flex-col">
          <h3 className="text-lg font-bold text-on-surface mb-6">Customer Actions</h3>
          <div className="flex-1 min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={actionData} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={true} vertical={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} width={80} />
                <Tooltip 
                  cursor={{ fill: '#ffffff05' }}
                  contentStyle={{ backgroundColor: '#1a1d24', border: '1px solid #ffffff10', borderRadius: '8px' }}
                />
                <Bar dataKey="value" fill="#c0c1ff" radius={[0, 4, 4, 0]} barSize={24}>
                  {actionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Traffic Sources Pie Chart */}
        <div className="bg-surface-container rounded-2xl p-6 border border-outline-variant/5">
          <h3 className="text-lg font-bold text-on-surface mb-2">Traffic Sources</h3>
          <div className="h-[250px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1d24', border: '1px solid #ffffff10', borderRadius: '8px' }}
                  itemStyle={{ color: '#e2e2e2' }}
                  formatter={(value) => `${value}%`}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
              <span className="text-2xl font-black text-on-surface">100%</span>
              <span className="text-[10px] uppercase tracking-widest text-outline font-bold">Tracked</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {sourceData.map((item, i) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-on-surface">{item.name}</span>
                  <span className="text-[10px] text-outline">{item.value}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Keywords Table */}
        <div className="lg:col-span-2 bg-surface-container rounded-2xl border border-outline-variant/5 overflow-hidden">
          <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center">
            <h3 className="text-lg font-bold text-on-surface">Top Performing Keywords</h3>
            <button 
              onClick={() => alert('Full source breakdown will be available once API is connected.')}
              className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline"
            >
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/50">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-outline">Search Query</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-outline text-right">Impressions</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-outline text-right">Clicks</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-outline text-right">CTR</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-outline text-right">Avg. Rank</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                <KeywordRow query="mahjong near me" impressions="12,450" clicks="1,240" ctr="10.0%" rank="2.1" trend="up" />
                <KeywordRow query="szechuan restaurant sf" impressions="8,320" clicks="680" ctr="8.2%" rank="4.5" trend="up" />
                <KeywordRow query="dim sum delivery" impressions="5,100" clicks="210" ctr="4.1%" rank="8.2" trend="down" />
                <KeywordRow query="mahjong box menu" impressions="3,240" clicks="1,850" ctr="57.1%" rank="1.0" trend="flat" />
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function KpiCard({ title, value, trend, trendType, icon }: any) {
  const isUp = trendType === 'up';
  return (
    <div className="bg-surface-container rounded-2xl p-6 border border-outline-variant/5 hover:bg-surface-container-high transition-colors group">
      <div className="flex justify-between items-start mb-4">
        <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${isUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
          {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {trend}
        </div>
      </div>
      <div>
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-outline mb-1">{title}</h4>
        <p className="text-3xl font-black text-on-surface tracking-tight">{value}</p>
      </div>
    </div>
  );
}

function KeywordRow({ query, impressions, clicks, ctr, rank, trend }: any) {
  return (
    <tr className="hover:bg-surface-container-high/40 transition-colors">
      <td className="px-6 py-4 font-bold text-sm text-on-surface">{query}</td>
      <td className="px-6 py-4 text-sm text-outline text-right">{impressions}</td>
      <td className="px-6 py-4 text-sm text-on-surface font-medium text-right">{clicks}</td>
      <td className="px-6 py-4 text-sm text-primary font-bold text-right">{ctr}</td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <span className="text-sm font-bold text-on-surface">{rank}</span>
          {trend === 'up' && <TrendingUp className="w-3 h-3 text-emerald-400" />}
          {trend === 'down' && <TrendingDown className="w-3 h-3 text-rose-400" />}
          {trend === 'flat' && <div className="w-3 h-0.5 bg-outline rounded-full"></div>}
        </div>
      </td>
    </tr>
  );
}
