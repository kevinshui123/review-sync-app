import React, { useState } from 'react';
import {
  LayoutDashboard,
  MapPin,
  MessageSquare,
  Zap,
  Edit3,
  History,
  Calendar,
  BarChart3,
  TrendingUp,
  Search,
  Lightbulb,
  Star,
  TrendingDown,
  Eye,
  Users,
  StarHalf,
  CheckCircle,
  AlertCircle,
  Clock,
  MoreHorizontal,
  Plus,
  Filter,
  ChevronRight,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Bot,
  Play,
  Pause,
  Trash2,
  Settings,
  Bell,
  Mail,
  Phone,
  Globe,
  Image as ImageIcon,
  FileText,
  Download,
  RefreshCw,
  Check,
  X,
  AlertTriangle,
  Target,
  Award,
  Briefcase,
  Building2,
  Map,
  Navigation,
  ExternalLink,
  Copy,
  Send,
  Sparkles,
  Layers,
  Database,
  Server,
  Key,
  Shield,
  Activity,
  PieChart,
  LineChart,
  BarChart,
  DollarSign,
  UserPlus,
  UserCheck,
  MessageCircle,
  Heart,
  ThumbsUp,
  Reply,
  Share2,
  Flag,
  Bookmark,
  Edit,
  Save,
  Upload,
  Camera,
  EyeOff,
  Sliders,
  Grid3X3,
  List,
  Table,
  Columns,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

// Brand colors matching LandingPage
const BRAND = {
  primary: '#1e3a5f',
  accent: '#4facfe',
  accentDark: '#00f2fe',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  pink: '#ec4899',
  cyan: '#06b6d4',
  indigo: '#6366f1',
  lime: '#84cc16',
};

interface PreviewConfig {
  id: string;
  titleZh: string;
  titleEn: string;
  descZh: string;
  descEn: string;
  featuresZh: string[];
  featuresEn: string[];
  color: string;
  icon: React.ReactNode;
}

const PREVIEW_CONFIGS: PreviewConfig[] = [
  {
    id: 'dashboard',
    titleZh: '数据概览 Dashboard',
    titleEn: 'Dashboard Overview',
    descZh: '一站式查看所有门店的核心业务数据',
    descEn: 'View core business data for all locations',
    featuresZh: ['KPI指标卡片', '趋势图表', '健康评分', '最新评论'],
    featuresEn: ['KPI Cards', 'Trend Charts', 'Health Score', 'Recent Reviews'],
    color: BRAND.primary,
    icon: <LayoutDashboard size={18} />,
  },
  {
    id: 'reviews',
    titleZh: '评价管理 Reviews',
    titleEn: 'Reviews Management',
    descZh: '集中管理所有平台的客户评价',
    descEn: 'Centralized customer review management',
    featuresZh: ['评价流展示', 'AI智能回复', '筛选与搜索', '统一收件箱'],
    featuresEn: ['Review Stream', 'AI Smart Reply', 'Filter & Search', 'Unified Inbox'],
    color: BRAND.warning,
    icon: <MessageSquare size={18} />,
  },
  {
    id: 'listings',
    titleZh: '商家列表 Listings',
    titleEn: 'Listings Management',
    descZh: '统一管理所有门店的Google商业信息',
    descEn: 'Manage Google business info for all locations',
    featuresZh: ['门店表格', '编辑信息', '档案分析', '同步管理'],
    featuresEn: ['Location Table', 'Edit Info', 'Profile Analysis', 'Sync Management'],
    color: '#0ea5e9',
    icon: <MapPin size={18} />,
  },
  {
    id: 'automations',
    titleZh: '自动化规则 Automations',
    titleEn: 'Automation Rules',
    descZh: '设置自动化规则，让AI自动处理新评价',
    descEn: 'Set up automation rules and let AI handle reviews',
    featuresZh: ['快速开始向导', 'AI助手管理', '规则状态追踪', '一键启动'],
    featuresEn: ['Quick Start Wizard', 'AI Agent Management', 'Rule Status Tracking', 'One-click Launch'],
    color: BRAND.purple,
    icon: <Zap size={18} />,
  },
  {
    id: 'bulk-edits',
    titleZh: '批量编辑 Bulk Edits',
    titleEn: 'Bulk Edits',
    descZh: '一次操作更新多个门店信息',
    descEn: 'Update multiple locations in one operation',
    featuresZh: ['三步向导', '批量选择门店', '批量更新字段', '审核确认'],
    featuresEn: ['Three-step Wizard', 'Bulk Location Select', 'Bulk Field Update', 'Review & Confirm'],
    color: BRAND.pink,
    icon: <Edit3 size={18} />,
  },
  {
    id: 'activity-log',
    titleZh: '操作日志 Activity Log',
    titleEn: 'Activity Log',
    descZh: '记录所有操作历史，便于追溯和审计',
    descEn: 'Record all operation history for auditing',
    featuresZh: ['活动时间线', '日志筛选', '操作追溯', '状态追踪'],
    featuresEn: ['Activity Timeline', 'Log Filters', 'Operation Trace', 'Status Tracking'],
    color: BRAND.success,
    icon: <History size={18} />,
  },
  {
    id: 'publishing',
    titleZh: '内容发布 Publishing',
    titleEn: 'Content Publishing',
    descZh: '创建和管理Google商家帖子',
    descEn: 'Create and manage Google Business posts',
    featuresZh: ['日历视图', '帖子编辑器', '定时发布', '快捷操作'],
    featuresEn: ['Calendar View', 'Post Composer', 'Schedule Post', 'Quick Actions'],
    color: '#f97316',
    icon: <Calendar size={18} />,
  },
  {
    id: 'reports',
    titleZh: '数据报告 Reports',
    titleEn: 'GBP Performance Reports',
    descZh: '深度分析业务数据，导出专业报告',
    descEn: 'Deep analysis of business data with reports',
    featuresZh: ['绩效分析', '时间趋势', 'PDF导出', '数据对比'],
    featuresEn: ['Performance Analysis', 'Time Trends', 'PDF Export', 'Data Comparison'],
    color: BRAND.indigo,
    icon: <BarChart3 size={18} />,
  },
  {
    id: 'search-overview',
    titleZh: '搜索概览 Search Overview',
    titleEn: 'Search Performance Overview',
    descZh: '可视化展示搜索和用户行为数据',
    descEn: 'Visualize search and user behavior data',
    featuresZh: ['环形图表', '搜索份额', '行为分析', '数据可视化'],
    featuresEn: ['Ring Charts', 'Search Share', 'Behavior Analysis', 'Data Visualization'],
    color: '#3b82f6',
    icon: <TrendingUp size={18} />,
  },
  {
    id: 'local-seo',
    titleZh: '本地SEO Local SEO',
    titleEn: 'Local Search Grid',
    descZh: '可视化分析门店在不同地理位置的搜索排名',
    descEn: 'Visual analysis of location search rankings',
    featuresZh: ['网格扫描', '排名可视化', '地图展示', '竞品分析'],
    featuresEn: ['Grid Scan', 'Rank Visualization', 'Map Display', 'Competitor Analysis'],
    color: BRAND.cyan,
    icon: <Search size={18} />,
  },
  {
    id: 'optimization',
    titleZh: '优化中心 Optimization',
    titleEn: 'Optimization Center',
    descZh: 'AI驱动的SEO健康度分析和优化建议',
    descEn: 'AI-powered SEO health analysis and recommendations',
    featuresZh: ['健康评分', '快速优化项', '推荐建议', '竞争洞察'],
    featuresEn: ['Health Score', 'Quick Wins', 'Recommendations', 'Competitive Insights'],
    color: '#eab308',
    icon: <Lightbulb size={18} />,
  },
  {
    id: 'optimization-detail',
    titleZh: '优化建议 Optimization Details',
    titleEn: 'Optimization Recommendations',
    descZh: '详细的优化步骤和行动指南',
    descEn: 'Detailed optimization steps and action guide',
    featuresZh: ['行动步骤', '影响评估', '投入产出', '详细指导'],
    featuresEn: ['Action Steps', 'Impact Assessment', 'Effort vs Impact', 'Detailed Guide'],
    color: BRAND.lime,
    icon: <Target size={18} />,
  },
  {
    id: 'real-reviews',
    titleZh: '真实评论 Real Reviews',
    titleEn: 'Real Reviews Generation',
    descZh: '帮助企业获取更多真实的Google评价',
    descEn: 'Help businesses get more authentic Google reviews',
    featuresZh: ['AI生成评论', '身份选择', '评分设定', '历史管理'],
    featuresEn: ['AI Review Generation', 'Identity Selection', 'Rating Setting', 'History Management'],
    color: BRAND.danger,
    icon: <Star size={18} />,
  },
];

// Common UI Components
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>{children}</div>
);

const MiniChart: React.FC<{ data: number[]; color: string; height?: number }> = ({ data, color, height = 40 }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  return (
    <div className="flex items-end gap-0.5" style={{ height }}>
      {data.map((value, i) => {
        const percent = ((value - min) / range) * 100;
        return (
          <div
            key={i}
            className="flex-1 rounded-sm transition-all"
            style={{
              height: `${Math.max(percent, 10)}%`,
              backgroundColor: color,
              opacity: 0.3 + (percent / 100) * 0.7,
            }}
          />
        );
      })}
    </div>
  );
};

const DonutChart: React.FC<{ segments: { value: number; color: string }[]; size?: number }> = ({
  segments,
  size = 80,
}) => {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  let currentAngle = -90;
  
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      {segments.map((segment, i) => {
        const angle = (segment.value / total) * 360;
        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;
        currentAngle = endAngle;
        
        const startRad = (startAngle * Math.PI) / 180;
        const endRad = (endAngle * Math.PI) / 180;
        
        const x1 = 50 + 40 * Math.cos(startRad);
        const y1 = 50 + 40 * Math.sin(startRad);
        const x2 = 50 + 40 * Math.cos(endRad);
        const y2 = 50 + 40 * Math.sin(endRad);
        
        const largeArc = angle > 180 ? 1 : 0;
        
        return (
          <path
            key={i}
            d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
            fill={segment.color}
            stroke="white"
            strokeWidth="2"
          />
        );
      })}
      <circle cx="50" cy="50" r="25" fill="white" />
    </svg>
  );
};

// Dashboard Preview
const DashboardPreview: React.FC = () => (
  <div className="h-full flex flex-col bg-gray-50">
    {/* Header */}
    <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
          <LayoutDashboard size={16} className="text-white" />
        </div>
        <span className="font-semibold text-gray-900 text-sm">Dashboard</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-600">All Locations</div>
        <div className="flex items-center gap-1">
          <Bell size={14} className="text-gray-400" />
        </div>
      </div>
    </div>

    {/* KPI Cards */}
    <div className="p-4 grid grid-cols-4 gap-3">
      <Card className="p-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-1">Search Views</p>
            <p className="text-lg font-bold text-gray-900">12,847</p>
            <p className="text-xs text-green-600 flex items-center gap-0.5 mt-1">
              <ArrowUpRight size={12} /> +23.5%
            </p>
          </div>
          <div className="p-2 bg-blue-50 rounded-lg">
            <Eye size={16} className="text-blue-500" />
          </div>
        </div>
      </Card>

      <Card className="p-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-1">Map Views</p>
            <p className="text-lg font-bold text-gray-900">8,392</p>
            <p className="text-xs text-green-600 flex items-center gap-0.5 mt-1">
              <ArrowUpRight size={12} /> +18.2%
            </p>
          </div>
          <div className="p-2 bg-cyan-50 rounded-lg">
            <MapPin size={16} className="text-cyan-500" />
          </div>
        </div>
      </Card>

      <Card className="p-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-1">Avg Rating</p>
            <p className="text-lg font-bold text-gray-900">4.8</p>
            <p className="text-xs text-green-600 flex items-center gap-0.5 mt-1">
              <Star size={12} className="fill-yellow-400 text-yellow-400" /> +0.2
            </p>
          </div>
          <div className="p-2 bg-yellow-50 rounded-lg">
            <Star size={16} className="text-yellow-500" />
          </div>
        </div>
      </Card>

      <Card className="p-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-1">Health Score</p>
            <p className="text-lg font-bold text-gray-900">87</p>
            <p className="text-xs text-green-600 flex items-center gap-0.5 mt-1">
              <ArrowUpRight size={12} /> Good
            </p>
          </div>
          <div className="p-2 bg-green-50 rounded-lg">
            <Shield size={16} className="text-green-500" />
          </div>
        </div>
      </Card>
    </div>

    {/* Chart */}
    <div className="px-4 flex-1">
      <Card className="p-4 h-full">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-900">Weekly Performance</span>
          <div className="flex gap-2">
            <div className="px-2 py-1 bg-gray-100 rounded text-xs">7D</div>
            <div className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs">30D</div>
          </div>
        </div>
        <MiniChart
          data={[40, 55, 35, 70, 50, 65, 80, 45, 60, 75, 55, 90]}
          color={BRAND.accent}
          height={60}
        />
        <div className="flex justify-between mt-2 text-xs text-gray-400">
          <span>Mon</span><span>Wed</span><span>Fri</span><span>Sun</span>
        </div>
      </Card>
    </div>
  </div>
);

// Reviews Preview
const ReviewsPreview: React.FC = () => (
  <div className="h-full flex flex-col bg-gray-50">
    {/* Header */}
    <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-400 flex items-center justify-center">
          <MessageSquare size={16} className="text-white" />
        </div>
        <span className="font-semibold text-gray-900 text-sm">Reviews</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs">
          <Filter size={12} /> Filter
        </div>
        <div className="px-3 py-1 bg-blue-500 text-white rounded text-xs font-medium">Reply All</div>
      </div>
    </div>

    {/* Stats */}
    <div className="px-4 py-2 flex gap-4 text-xs">
      <span className="text-gray-500">Pending: <strong className="text-amber-600">12</strong></span>
      <span className="text-gray-500">Replied: <strong className="text-green-600">48</strong></span>
      <span className="text-gray-500">Avg: <strong className="text-blue-600">4.2</strong></span>
    </div>

    {/* Reviews List */}
    <div className="flex-1 overflow-hidden px-4 pb-4">
      <div className="space-y-2">
        {[
          { name: 'Sarah M.', rating: 5, text: 'Amazing service! The staff was incredibly helpful...', time: '2h ago', avatar: 'S' },
          { name: 'John D.', rating: 4, text: 'Great experience overall. Would recommend...', time: '4h ago', avatar: 'J' },
          { name: 'Emily R.', rating: 5, text: 'Best in town! Professional and friendly...', time: '1d ago', avatar: 'E' },
        ].map((review, i) => (
          <Card key={i} className="p-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-300 flex items-center justify-center text-white text-xs font-bold">
                {review.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 text-xs">{review.name}</span>
                  <span className="text-xs text-gray-400">{review.time}</span>
                </div>
                <div className="flex gap-0.5 my-1">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={10} className={s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />
                  ))}
                </div>
                <p className="text-xs text-gray-600 truncate">{review.text}</p>
              </div>
              <button className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100">
                Reply
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  </div>
);

// Listings Preview
const ListingsPreview: React.FC = () => (
  <div className="h-full flex flex-col bg-gray-50">
    {/* Header */}
    <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-blue-500 flex items-center justify-center">
          <MapPin size={16} className="text-white" />
        </div>
        <span className="font-semibold text-gray-900 text-sm">Listings</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="px-2 py-1 bg-gray-100 rounded text-xs">+ Add Location</div>
        <div className="flex items-center gap-1">
          <Table size={14} className="text-gray-400" />
        </div>
      </div>
    </div>

    {/* Table */}
    <div className="flex-1 overflow-hidden p-4">
      <Card className="h-full overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 font-medium text-gray-500">Business</th>
                <th className="text-left p-3 font-medium text-gray-500">Status</th>
                <th className="text-left p-3 font-medium text-gray-500">Rating</th>
                <th className="text-left p-3 font-medium text-gray-500">Reviews</th>
                <th className="text-left p-3 font-medium text-gray-500">Sync</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Downtown Store', status: 'Active', rating: 4.8, reviews: 234, synced: true },
                { name: 'Mall Branch', status: 'Active', rating: 4.6, reviews: 156, synced: true },
                { name: 'Airport Location', status: 'Warning', rating: 4.2, reviews: 89, synced: false },
                { name: 'Beach Resort', status: 'Active', rating: 4.9, reviews: 312, synced: true },
              ].map((item, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-gray-200 flex items-center justify-center">
                        <Building2 size={12} className="text-gray-500" />
                      </div>
                      <span className="font-medium text-gray-900">{item.name}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      item.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="flex items-center gap-1">
                      <Star size={10} className="text-yellow-400 fill-yellow-400" />
                      <span className="font-medium">{item.rating}</span>
                    </span>
                  </td>
                  <td className="p-3 text-gray-600">{item.reviews}</td>
                  <td className="p-3">
                    {item.synced ? (
                      <CheckCircle size={14} className="text-green-500" />
                    ) : (
                      <AlertCircle size={14} className="text-amber-500" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  </div>
);

// Automations Preview
const AutomationsPreview: React.FC = () => (
  <div className="h-full flex flex-col bg-gray-50">
    {/* Header */}
    <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
          <Zap size={16} className="text-white" />
        </div>
        <span className="font-semibold text-gray-900 text-sm">Automations</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="px-3 py-1 bg-violet-500 text-white rounded text-xs font-medium">+ New Rule</div>
      </div>
    </div>

    {/* Quick Start */}
    <div className="px-4 py-3">
      <Card className="p-4 bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-violet-500 rounded-lg">
            <Rocket size={16} className="text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 text-sm">Quick Start</h4>
            <p className="text-xs text-gray-500">Set up your first automation in 3 steps</p>
          </div>
        </div>
        <div className="flex gap-2">
          {['Connect', 'Configure', 'Launch'].map((step, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                i === 0 ? 'bg-violet-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {i + 1}
              </div>
              <span className="text-xs text-gray-600">{step}</span>
              {i < 2 && <ChevronRight size={12} className="text-gray-300" />}
            </div>
          ))}
        </div>
      </Card>
    </div>

    {/* Rules */}
    <div className="flex-1 overflow-hidden px-4 pb-4">
      <div className="space-y-2">
        {[
          { name: 'Auto-reply to 5-star reviews', agent: 'AI Assistant', status: 'active', type: 'reply' },
          { name: 'Reply to negative reviews', agent: 'Support Agent', status: 'paused', type: 'reply' },
          { name: 'Generate monthly report', agent: 'Report Bot', status: 'active', type: 'report' },
        ].map((rule, i) => (
          <Card key={i} className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${rule.type === 'reply' ? 'bg-blue-50' : 'bg-green-50'}`}>
                  <Bot size={14} className={rule.type === 'reply' ? 'text-blue-500' : 'text-green-500'} />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-xs">{rule.name}</p>
                  <p className="text-xs text-gray-500">{rule.agent}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${rule.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="text-xs text-gray-500">{rule.status}</span>
                {rule.status === 'active' ? (
                  <Pause size={14} className="text-gray-400 cursor-pointer" />
                ) : (
                  <Play size={14} className="text-gray-400 cursor-pointer" />
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  </div>
);

// Bulk Edits Preview
const BulkEditsPreview: React.FC = () => (
  <div className="h-full flex flex-col bg-gray-50">
    {/* Header */}
    <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
          <Edit3 size={16} className="text-white" />
        </div>
        <span className="font-semibold text-gray-900 text-sm">Bulk Edits</span>
      </div>
    </div>

    {/* Wizard */}
    <div className="flex-1 p-4 flex flex-col">
      <Card className="p-4 flex-1">
        {/* Steps */}
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3].map((step, i) => (
            <React.Fragment key={i}>
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  i === 0 ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {step}
                </div>
                <span className="text-xs mt-1 text-gray-500">{['Select', 'Edit', 'Review'][i]}</span>
              </div>
              {i < 2 && <div className="flex-1 h-0.5 bg-gray-200 mx-2" />}
            </React.Fragment>
          ))}
        </div>

        {/* Content */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Select Locations</label>
            <div className="flex flex-wrap gap-1">
              {['Downtown Store', 'Mall Branch', 'Airport Loc...'].map((loc, i) => (
                <span key={i} className="px-2 py-1 bg-pink-50 text-pink-600 rounded text-xs">{loc}</span>
              ))}
              <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs">+3 more</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Fields to Update</label>
            <div className="flex gap-1">
              {['Hours', 'Photos', 'Description'].map((field, i) => (
                <span key={i} className={`px-2 py-1 rounded text-xs ${i === 0 ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  {field}
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">New Hours</label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-gray-50 rounded">Mon-Fri: 9:00 AM - 6:00 PM</div>
              <div className="p-2 bg-gray-50 rounded">Sat-Sun: 10:00 AM - 4:00 PM</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  </div>
);

// Activity Log Preview
const ActivityLogPreview: React.FC = () => (
  <div className="h-full flex flex-col bg-gray-50">
    {/* Header */}
    <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center">
          <History size={16} className="text-white" />
        </div>
        <span className="font-semibold text-gray-900 text-sm">Activity Log</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs">
          <Filter size={12} /> All Types
        </div>
      </div>
    </div>

    {/* Timeline */}
    <div className="flex-1 overflow-hidden p-4">
      <div className="space-y-3">
        {[
          { action: 'Review replied', detail: 'Auto-reply to Sarah M.', time: '2 min ago', icon: <MessageSquare size={12} />, color: 'blue' },
          { action: 'Listing updated', detail: 'Downtown Store hours changed', time: '15 min ago', icon: <Edit size={12} />, color: 'green' },
          { action: 'Automation triggered', detail: 'Negative review escalation', time: '1 hour ago', icon: <Zap size={12} />, color: 'violet' },
          { action: 'Report generated', detail: 'Weekly performance report', time: '2 hours ago', icon: <FileText size={12} />, color: 'cyan' },
          { action: 'Location synced', detail: 'Mall Branch verified', time: '3 hours ago', icon: <RefreshCw size={12} />, color: 'emerald' },
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className={`p-1.5 rounded-lg bg-${item.color}-50`}>
              <span className={`text-${item.color}-500`}>{item.icon}</span>
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-900">{item.action}</p>
              <p className="text-xs text-gray-500">{item.detail}</p>
            </div>
            <span className="text-xs text-gray-400 whitespace-nowrap">{item.time}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Publishing Preview
const PublishingPreview: React.FC = () => (
  <div className="h-full flex flex-col bg-gray-50">
    {/* Header */}
    <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
          <Calendar size={16} className="text-white" />
        </div>
        <span className="font-semibold text-gray-900 text-sm">Publishing</span>
      </div>
      <div className="px-3 py-1 bg-orange-500 text-white rounded text-xs font-medium">+ New Post</div>
    </div>

    {/* Calendar */}
    <div className="flex-1 p-4">
      <Card className="p-4 h-full">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-900">April 2024</span>
          <div className="flex gap-1">
            <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-gray-500">‹</div>
            <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-gray-500">›</div>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} className="text-gray-400 font-medium">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => {
            const day = i - 2;
            const hasPost = [5, 12, 19, 26].includes(day);
            const isToday = day === 15;
            return (
              <div
                key={i}
                className={`aspect-square rounded flex items-center justify-center text-xs relative ${
                  day < 1 || day > 30 ? 'text-gray-300' : isToday ? 'bg-blue-500 text-white font-bold' : 'text-gray-700'
                }`}
              >
                {day > 0 && day <= 30 && day}
                {hasPost && day !== 15 && (
                  <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-orange-500" />
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-3 pt-3 border-t">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="text-gray-500">Scheduled posts</span>
          </div>
        </div>
      </Card>
    </div>
  </div>
);

// Reports Preview
const ReportsPreview: React.FC = () => (
  <div className="h-full flex flex-col bg-gray-50">
    {/* Header */}
    <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center">
          <BarChart3 size={16} className="text-white" />
        </div>
        <span className="font-semibold text-gray-900 text-sm">Reports</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="px-2 py-1 bg-gray-100 rounded text-xs">Mar 2024</div>
        <div className="flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-600 rounded text-xs">
          <Download size={12} /> Export
        </div>
      </div>
    </div>

    {/* Stats */}
    <div className="px-4 py-3 grid grid-cols-3 gap-2">
      <Card className="p-3 text-center">
        <p className="text-lg font-bold text-gray-900">2,847</p>
        <p className="text-xs text-gray-500">Search Views</p>
        <p className="text-xs text-green-600">+23%</p>
      </Card>
      <Card className="p-3 text-center">
        <p className="text-lg font-bold text-gray-900">1,392</p>
        <p className="text-xs text-gray-500">Map Views</p>
        <p className="text-xs text-green-600">+18%</p>
      </Card>
      <Card className="p-3 text-center">
        <p className="text-lg font-bold text-gray-900">89</p>
        <p className="text-xs text-gray-500">Directions</p>
        <p className="text-xs text-green-600">+12%</p>
      </Card>
    </div>

    {/* Chart */}
    <div className="flex-1 px-4 pb-4">
      <Card className="p-4 h-full">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-900">Performance Trend</span>
        </div>
        <MiniChart
          data={[30, 45, 35, 55, 48, 65, 58, 72, 68, 85, 78, 95]}
          color={BRAND.indigo}
          height={80}
        />
        <div className="flex justify-between mt-2 text-xs text-gray-400">
          <span>Jan</span><span>Feb</span><span>Mar</span>
        </div>
      </Card>
    </div>
  </div>
);

// Search Overview Preview
const SearchOverviewPreview: React.FC = () => (
  <div className="h-full flex flex-col bg-gray-50">
    {/* Header */}
    <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-sky-500 flex items-center justify-center">
          <TrendingUp size={16} className="text-white" />
        </div>
        <span className="font-semibold text-gray-900 text-sm">Search Overview</span>
      </div>
    </div>

    {/* Charts */}
    <div className="flex-1 p-4 flex flex-col gap-3">
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <DonutChart
            segments={[
              { value: 45, color: BRAND.accent },
              { value: 30, color: BRAND.indigo },
              { value: 15, color: BRAND.purple },
              { value: 10, color: BRAND.pink },
            ]}
            size={80}
          />
          <div className="flex-1 space-y-2">
            {[
              { label: 'Direct Search', value: '45%', color: BRAND.accent },
              { label: 'Discovery', value: '30%', color: BRAND.indigo },
              { label: 'Branded', value: '15%', color: BRAND.purple },
              { label: 'Other', value: '10%', color: BRAND.pink },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-600">{item.label}</span>
                </div>
                <span className="font-medium text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card className="p-4 flex-1">
        <span className="text-sm font-medium text-gray-900 mb-2 block">Weekly Trend</span>
        <MiniChart
          data={[20, 35, 28, 45, 38, 55, 48, 62, 55, 70, 65, 80]}
          color={BRAND.accent}
          height={60}
        />
      </Card>
    </div>
  </div>
);

// Local SEO Preview
const LocalSEOPreview: React.FC = () => (
  <div className="h-full flex flex-col bg-gray-50">
    {/* Header */}
    <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
          <Search size={16} className="text-white" />
        </div>
        <span className="font-semibold text-gray-900 text-sm">Local SEO Grid</span>
      </div>
    </div>

    {/* Grid Map */}
    <div className="flex-1 p-4">
      <Card className="p-4 h-full">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-900">Ranking Grid - Downtown</span>
          <span className="text-xs px-2 py-1 bg-cyan-50 text-cyan-600 rounded">Scan Complete</span>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-5 gap-1">
          {[
            [3, 5, 4, 2, 1],
            [4, 2, 1, 3, 5],
            [1, 3, 5, 4, 2],
            [2, 4, 3, 5, 1],
            [5, 1, 2, 4, 3],
          ].map((row, i) => (
            <div key={i} className="contents">
              {row.map((rank, j) => (
                <div
                  key={j}
                  className="aspect-square rounded flex items-center justify-center text-xs font-bold"
                  style={{
                    backgroundColor: rank === 1 ? '#10b981' : rank <= 3 ? '#4facfe' : '#e2e8f0',
                    color: rank <= 3 ? 'white' : '#64748b',
                  }}
                >
                  {rank}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-4 mt-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-emerald-500" /> #1
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-blue-400" /> Top 3
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-gray-200" /> Other
          </span>
        </div>
      </Card>
    </div>
  </div>
);

// Optimization Preview
const OptimizationPreview: React.FC = () => (
  <div className="h-full flex flex-col bg-gray-50">
    {/* Header */}
    <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center">
          <Lightbulb size={16} className="text-white" />
        </div>
        <span className="font-semibold text-gray-900 text-sm">Optimization</span>
      </div>
    </div>

    {/* Score */}
    <div className="px-4 py-3">
      <Card className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-1">SEO Health Score</p>
            <p className="text-2xl font-bold text-gray-900">78 <span className="text-sm font-normal text-gray-500">/100</span></p>
          </div>
          <div className="w-16 h-16 rounded-full border-4 border-yellow-400 flex items-center justify-center">
            <span className="text-lg font-bold text-yellow-600">78</span>
          </div>
        </div>
      </Card>
    </div>

    {/* Recommendations */}
    <div className="flex-1 overflow-hidden px-4 pb-4">
      <div className="space-y-2">
        {[
          { title: 'Add more photos', impact: 'High', effort: 'Low', color: 'green' },
          { title: 'Update business hours', impact: 'Medium', effort: 'Low', color: 'blue' },
          { title: 'Respond to reviews', impact: 'High', effort: 'Medium', color: 'green' },
          { title: 'Add posts regularly', impact: 'Medium', effort: 'Low', color: 'blue' },
        ].map((item, i) => (
          <Card key={i} className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target size={14} className="text-gray-400" />
                <span className="text-xs font-medium text-gray-900">{item.title}</span>
              </div>
              <span className={`px-1.5 py-0.5 rounded text-xs ${
                item.impact === 'High' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {item.impact}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  </div>
);

// Optimization Detail Preview
const OptimizationDetailPreview: React.FC = () => (
  <div className="h-full flex flex-col bg-gray-50">
    {/* Header */}
    <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-lime-500 to-green-500 flex items-center justify-center">
          <Target size={16} className="text-white" />
        </div>
        <span className="font-semibold text-gray-900 text-sm">Recommendations</span>
      </div>
    </div>

    {/* Detail Card */}
    <div className="flex-1 p-4">
      <Card className="p-4 h-full">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 bg-lime-50 rounded-lg">
            <Camera size={16} className="text-lime-600" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 text-sm">Add More Photos</h4>
            <p className="text-xs text-gray-500">High Impact · Low Effort</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs font-medium text-gray-700 mb-2">Why it matters</p>
            <p className="text-xs text-gray-600">Businesses with photos receive 42% more requests for directions and 35% more clicks to their website.</p>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-700 mb-2">Action Steps</p>
            <div className="space-y-1">
              {['Upload 3 exterior photos', 'Add 5 interior photos', 'Include team photos'].map((step, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                  <CheckCircle size={12} className="text-green-500" />
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button className="w-full mt-4 py-2 bg-lime-500 text-white rounded-lg text-xs font-medium">
          Start Optimization
        </button>
      </Card>
    </div>
  </div>
);

// Real Reviews Preview
const RealReviewsPreview: React.FC = () => (
  <div className="h-full flex flex-col bg-gray-50">
    {/* Header */}
    <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
          <Star size={16} className="text-white" />
        </div>
        <span className="font-semibold text-gray-900 text-sm">Real Reviews</span>
      </div>
      <div className="px-3 py-1 bg-red-500 text-white rounded text-xs font-medium">+ Generate</div>
    </div>

    {/* Guide Selection */}
    <div className="px-4 py-3">
      <Card className="p-3">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-300 flex items-center justify-center text-white text-sm font-bold">
            D
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900 text-sm">David M.</p>
            <p className="text-xs text-gray-500">Local Guide · 127 reviews</p>
          </div>
          <ChevronDown size={16} className="text-gray-400" />
        </div>

        <div className="flex gap-1 mb-3">
          {[1,2,3,4,5].map(s => (
            <Star key={s} size={16} className={s <= 5 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 bg-gray-50 rounded">
            <p className="text-gray-500">Industry</p>
            <p className="font-medium text-gray-900">Restaurant</p>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <p className="text-gray-500">Rating</p>
            <p className="font-medium text-gray-900">5 Stars</p>
          </div>
        </div>
      </Card>
    </div>

    {/* Generated Review */}
    <div className="flex-1 overflow-hidden px-4 pb-4">
      <Card className="p-4 h-full">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={14} className="text-pink-500" />
          <span className="text-xs font-medium text-gray-700">Generated Review</span>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs text-gray-600 leading-relaxed">
            "Absolutely love this place! The moment I walked in, I was greeted with a warm smile. The ramen here is hands down the best I've had in the city. Already planning my next visit!"
          </p>
        </div>
        <div className="flex gap-1 mt-3">
          <ImageIcon size={14} className="text-gray-400" />
          <ImageIcon size={14} className="text-gray-400" />
        </div>

        <div className="flex gap-2 mt-4">
          <button className="flex-1 py-2 bg-red-500 text-white rounded-lg text-xs font-medium">Post Review</button>
          <button className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs">Regenerate</button>
        </div>
      </Card>
    </div>
  </div>
);

// Preview renderer map
const PREVIEW_COMPONENTS: Record<string, React.FC> = {
  'dashboard': DashboardPreview,
  'reviews': ReviewsPreview,
  'listings': ListingsPreview,
  'automations': AutomationsPreview,
  'bulk-edits': BulkEditsPreview,
  'activity-log': ActivityLogPreview,
  'publishing': PublishingPreview,
  'reports': ReportsPreview,
  'search-overview': SearchOverviewPreview,
  'local-seo': LocalSEOPreview,
  'optimization': OptimizationPreview,
  'optimization-detail': OptimizationDetailPreview,
  'real-reviews': RealReviewsPreview,
};

// Main App Preview Component
interface AppPreviewProps {
  previewId: string;
  className?: string;
}

export const AppPreview: React.FC<AppPreviewProps> = ({ previewId, className = '' }) => {
  const PreviewComponent = PREVIEW_COMPONENTS[previewId];
  
  if (!PreviewComponent) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <span className="text-gray-400 text-sm">Preview not available</span>
      </div>
    );
  }
  
  return (
    <div className={`rounded-lg overflow-hidden border border-gray-200 shadow-sm ${className}`}>
      <PreviewComponent />
    </div>
  );
};

// Export for use in ScreenshotGallery
export { PREVIEW_CONFIGS, PREVIEW_COMPONENTS };
