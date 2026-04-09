import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Map, 
  Navigation, 
  Bot, 
  Star, 
  ArrowRight,
  MessageSquare,
  TrendingUp,
  CheckCircle2,
  Sparkles,
  Store,
  Loader2,
  BarChart3,
  Search
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { motion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';

interface DashboardStats {
  locationsCount: number;
  totalReviews: number;
  averageRating: string;
  replyRate: number;
  repliedReviews: number;
  unrepliedReviews: number;
}

interface DashboardProps {
  setActiveTab?: (tab: string) => void;
}

export function Dashboard({ setActiveTab }: DashboardProps) {
  const { t } = useLanguage();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/dashboard/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Mock data for charts
  const trafficData = [
    { name: 'Mon', views: 400, clicks: 240 },
    { name: 'Tue', views: 300, clicks: 139 },
    { name: 'Wed', views: 550, clicks: 380 },
    { name: 'Thu', views: 450, clicks: 290 },
    { name: 'Fri', views: 600, clicks: 480 },
    { name: 'Sat', views: 800, clicks: 600 },
    { name: 'Sun', views: 750, clicks: 550 },
  ];

  const keywordData = [
    { name: 'Dim Sum Near Me', rank: 1, volume: 8500 },
    { name: 'Best Mahjong Parlor', rank: 2, volume: 4200 },
    { name: 'Spicy Wontons', rank: 4, volume: 3100 },
    { name: 'Chinese Restaurant', rank: 8, volume: 12000 },
    { name: 'Late Night Food', rank: 12, volume: 9500 },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto pb-20 w-full"
    >
      
      {/* Hero Metrics Asymmetric Section */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Health Score Large Card */}
        <motion.div variants={itemVariants} className="col-span-12 lg:col-span-5 bg-surface-container rounded-lg p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity text-primary">
            <Activity className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70">AI Profile Health</span>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-7xl font-extrabold tracking-tighter text-on-surface">
                {stats?.locationsCount ? '85' : '0'}
              </span>
              <span className="text-2xl font-medium text-outline">/100</span>
            </div>
            <p className="mt-4 text-on-surface-variant max-w-xs text-sm leading-relaxed">
              {stats?.locationsCount 
                ? 'Your profile health is "Excellent" but could reach 95+ by updating menu photos.' 
                : 'Connect your Google Business Profile to see your health score.'}
            </p>
            <button 
              onClick={() => setActiveTab && setActiveTab('listings')}
              className="mt-8 bg-surface-container-highest hover:bg-surface-container-highest/80 text-on-surface px-6 py-2.5 text-sm font-semibold flex items-center gap-2 transition-all border border-outline-variant/20 rounded"
            >
              View Optimization Opportunities
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* KPI Grid */}
        <motion.div variants={itemVariants} className="col-span-12 lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <KpiCard 
            icon={<Store className="w-5 h-5 text-primary" />}
            trend="Active"
            trendColor="text-emerald-400"
            trendBg="bg-emerald-400/10"
            value={stats?.locationsCount || 0}
            label={t('dashboard.totalLocations')}
          />
          <KpiCard 
            icon={<MessageSquare className="w-5 h-5 text-primary" />}
            trend={stats?.unrepliedReviews ? `${stats.unrepliedReviews} ${t('dashboard.unreplied')}` : 'All Caught Up'}
            trendColor={stats?.unrepliedReviews ? "text-tertiary" : "text-emerald-400"}
            trendBg={stats?.unrepliedReviews ? "bg-tertiary-container/10" : "bg-emerald-400/10"}
            value={stats?.totalReviews || 0}
            label={t('dashboard.totalReviews')}
          />
          <KpiCard 
            icon={<Bot className="w-5 h-5 text-primary" />}
            trend={stats?.replyRate && stats.replyRate > 80 ? "Optimal" : "Needs Work"}
            trendColor="text-primary"
            trendBg="bg-primary/10"
            value={`${stats?.replyRate || 0}%`}
            label={t('dashboard.replyRate')}
          />
          <div className="bg-surface-container-low p-6 rounded-lg flex flex-col justify-between hover:bg-surface-container transition-colors">
            <div>
              <div className="flex justify-between items-start">
                <Star className="w-5 h-5 text-primary" />
                <div className="flex text-tertiary">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className={`w-3 h-3 ${i <= parseFloat(stats?.averageRating || '0') ? 'fill-current' : 'opacity-30'}`} />
                  ))}
                </div>
              </div>
              <h3 className="mt-4 text-3xl font-bold tracking-tight text-on-surface">{stats?.averageRating || '0.0'}</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-outline mt-1">{t('dashboard.avgRating')}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Content Bento Grid */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Charts Section */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          
          {/* Traffic Trend Chart */}
          <div className="bg-surface-container rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-on-surface">{t('dashboard.traffic')}</h2>
              </div>
              <select className="bg-surface-container-low border border-outline-variant/10 rounded-md px-3 py-1 text-xs font-bold text-on-surface outline-none">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>This Month</option>
              </select>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trafficData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#f3f4f6' }}
                    itemStyle={{ color: '#f3f4f6' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  <Area type="monotone" dataKey="views" name={t('dashboard.views')} stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
                  <Area type="monotone" dataKey="clicks" name={t('dashboard.clicks')} stroke="#34d399" strokeWidth={3} fillOpacity={1} fill="url(#colorClicks)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Keyword Rankings */}
          <div className="bg-surface-container rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-tertiary" />
                <h2 className="text-lg font-bold text-on-surface">{t('dashboard.topKeywords')}</h2>
              </div>
              <button 
                onClick={() => setActiveTab && setActiveTab('keywords')}
                className="text-xs font-bold text-primary hover:underline"
              >
                {t('dashboard.viewAll')}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/10">
                    <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-outline">{t('dashboard.keyword')}</th>
                    <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-outline text-right">{t('dashboard.rank')}</th>
                    <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-outline text-right">{t('dashboard.volume')}</th>
                    <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-outline text-right">{t('dashboard.trend')}</th>
                  </tr>
                </thead>
                <tbody>
                  {keywordData.map((kw, idx) => (
                    <tr key={idx} className="border-b border-outline-variant/5 hover:bg-surface-container-high/50 transition-colors">
                      <td className="py-4 text-sm font-semibold text-on-surface">{kw.name}</td>
                      <td className="py-4 text-sm font-bold text-right">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${kw.rank <= 3 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-surface-container-highest text-on-surface'}`}>
                          {kw.rank}
                        </span>
                      </td>
                      <td className="py-4 text-sm text-on-surface-variant text-right">{kw.volume.toLocaleString()}</td>
                      <td className="py-4 text-right">
                        {kw.rank <= 3 ? (
                          <TrendingUp className="w-4 h-4 text-emerald-400 inline" />
                        ) : (
                          <span className="text-outline text-sm">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Side Panels */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          
          {/* Activity Feed (Moved to side panel) */}
          <div className="bg-surface-container rounded-lg flex flex-col">
            <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center">
              <h2 className="text-lg font-bold text-on-surface">{t('dashboard.recentActivity')}</h2>
            </div>
            <div className="p-0">
              <ActivityItem 
                icon={<MessageSquare className="w-5 h-5 text-primary" />}
                iconBg="bg-primary/10"
                title={t('dashboard.activity.review')}
                subtitle="at Baltimore Fusion"
                time="2m ago"
                content="&quot;The dim sum and mahjong vibes are unmatched. AI replied instantly with a reservation link!&quot;"
                badge="AI AUTO-REPLY SENT"
              />
              <ActivityItem 
                icon={<TrendingUp className="w-5 h-5 text-tertiary" />}
                iconBg="bg-tertiary/10"
                title="Keyword Peak"
                subtitle="in Arlington, VA"
                time="1h ago"
                content={<>&quot;Mahjong Parlor Near Me&quot; moved from #4 to <span className="text-tertiary font-bold">#1</span> in the Local Pack.</>}
              />
              <ActivityItem 
                icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                iconBg="bg-emerald-400/10"
                title={t('dashboard.activity.post')}
                subtitle=""
                time="4h ago"
                content="Weekly &quot;Dim Sum Specials&quot; post published to 12 map locations successfully."
              />
            </div>
          </div>
          
          {/* Location Performance */}
          <div className="bg-surface-container rounded-lg p-6">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-outline mb-6">{t('dashboard.locationFocus')}</h3>
            <div className="space-y-6">
              <ProgressBar label="Baltimore - Harbor East" value={94} color="bg-primary" valueColor="text-primary" />
              <ProgressBar label="Arlington - Clarendon" value={72} color="bg-tertiary" valueColor="text-tertiary" />
            </div>
          </div>

          {/* Mini Map Visual */}
          <div className="bg-surface-container rounded-lg overflow-hidden relative h-48 group">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAiTK8rEuqU-wYOIKouH3-oOycNqqGvYguQuQeANAZ4FUU_6oA1tV1Zbce9NT90PbnMZyHL9tc_uIOfzfHo26zsCzQf-1VZfDv7_asK5m0MyTjB5_5EbR5uOzn_6WB9gVhCzF4uQXoUV8iQEUD2v0C8T9cdJudCDAU0i6FgZTGzGdLJIFHJqKxcdlsJpcve6FlWRnymq3v6khOHfxe1_u50zf_SksK6ejo3FsmXZ_gTpKXebfWF40Mz80xd3jQBiP71XdAODc19xDU" 
              alt="Map Heatmap" 
              className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface-container via-transparent to-transparent"></div>
            <div className="absolute bottom-4 left-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface">{t('dashboard.heatmap')}</p>
              <p className="text-[10px] text-outline mt-1">{t('dashboard.updated')} 5m ago</p>
            </div>
          </div>

          {/* Quick AI Task */}
          <div className="bg-gradient-to-br from-primary/10 to-surface-container rounded-lg p-6 border border-primary/20">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-bold text-on-surface">{t('dashboard.aiSuggestion')}</h3>
            </div>
            <p className="text-sm text-on-surface-variant mb-4 leading-relaxed">
              {t('dashboard.aiSuggestionDesc')}
            </p>
            <button 
              onClick={() => setActiveTab && setActiveTab('reviews')}
              className="w-full py-2.5 bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest rounded transition-colors"
            >
              {t('dashboard.openAiAssistant')}
            </button>
          </div>

        </div>
      </div>
    </motion.div>
  );
}

// Sub-components

function KpiCard({ icon, trend, trendColor, trendBg, value, label }: any) {
  return (
    <div className="bg-surface-container-low p-6 rounded-lg flex flex-col justify-between hover:bg-surface-container transition-colors">
      <div>
        <div className="flex justify-between items-start">
          {icon}
          <span className={`text-[10px] font-bold ${trendColor} px-2 py-0.5 ${trendBg} rounded`}>{trend}</span>
        </div>
        <h3 className="mt-4 text-3xl font-bold tracking-tight text-on-surface">{value}</h3>
        <p className="text-[10px] font-bold uppercase tracking-widest text-outline mt-1">{label}</p>
      </div>
    </div>
  );
}

function ActivityItem({ icon, iconBg, title, subtitle, time, content, badge }: any) {
  return (
    <div className="p-6 hover:bg-surface-container-high transition-colors flex gap-4 group border-b border-outline-variant/5 last:border-0">
      <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex justify-between items-start">
          <p className="text-sm font-semibold text-on-surface">
            {title} <span className="text-outline font-normal">{subtitle}</span>
          </p>
          <span className="text-[10px] text-outline uppercase tracking-wider">{time}</span>
        </div>
        <p className="text-sm text-on-surface-variant italic">{content}</p>
        {badge && (
          <div className="pt-2">
            <span className="text-[9px] px-2 py-0.5 bg-surface-container-highest text-primary font-bold rounded tracking-wider">
              {badge}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function ProgressBar({ label, value, color, valueColor }: any) {
  const { t } = useLanguage();
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-on-surface font-semibold">{label}</span>
        <span className={`${valueColor} font-medium`}>{value}% {t('dashboard.health')}</span>
      </div>
      <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${value}%` }}></div>
      </div>
    </div>
  );
}
