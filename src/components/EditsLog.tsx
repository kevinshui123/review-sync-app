import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  Cancel,
  CalendarMonth,
  History,
  Refresh,
  AccessTime,
  FilterList,
  Reply,
  Edit,
  Delete,
} from '@mui/icons-material';
import { motion } from 'motion/react';
import { apiGet } from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';

interface EditsLogProps {
  setActiveTab: (tab: string) => void;
}

interface EditLog {
  id: string;
  action: 'create' | 'update' | 'delete' | 'sync' | 'reply' | 'post';
  entity: string;
  entityId: string;
  details: string;
  createdAt: Date;
  status: 'completed' | 'pending' | 'failed';
}

// Store recent reply/post activities in localStorage (since backend doesn't track these yet)
const STORAGE_KEY = 'review-sync-activity';

function loadActivity(): EditLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed.map((l: any) => ({ ...l, createdAt: new Date(l.createdAt) }));
  } catch {
    return [];
  }
}

function saveActivity(logs: EditLog[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs.slice(0, 200)));
  } catch { /* ignore */ }
}

export function addActivityLog(log: Omit<EditLog, 'createdAt' | 'id'>) {
  const logs = loadActivity();
  const entry: EditLog = {
    ...log,
    id: `${log.action}-${Date.now()}`,
    createdAt: new Date(),
  };
  saveActivity([entry, ...logs]);
}

export function EditsLog({ setActiveTab }: EditsLogProps) {
  const { t } = useLanguage();
  const [activeFilter, setActiveFilter] = useState('all');
  const [logs, setLogs] = useState<EditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const allLogs: EditLog[] = [];

      // 1. Listing connection logs from TenantListing
      try {
        const listingsRes = await apiGet('/api/tenant/listings');
        if (listingsRes.ok) {
          const listings = await listingsRes.json();
          listings.forEach((listing: any) => {
            allLogs.push({
              id: `listing-connect-${listing.id}`,
              action: 'create',
              entity: 'Listing',
              entityId: listing.id,
              details: `Connected listing: ${listing.name}`,
              createdAt: new Date(listing.connectedAt || Date.now()),
              status: 'completed',
            });
          });
        }
      } catch (e) {
        console.error('[editslog] Failed to fetch tenant listings:', e);
      }

      // 2. Posts logs from /api/posts
      try {
        const postsRes = await apiGet('/api/posts');
        if (postsRes.ok) {
          const posts = await postsRes.json();
          posts.forEach((post: any) => {
            allLogs.push({
              id: `post-create-${post.id}`,
              action: 'post',
              entity: 'Post',
              entityId: post.id,
              details: `${post.status === 'PUBLISHED' ? 'Published' : post.status === 'SCHEDULED' ? 'Scheduled' : 'Created draft'} post: ${(post.content || '').slice(0, 50)}${post.content?.length > 50 ? '...' : ''}`,
              createdAt: new Date(post.createdAt || Date.now()),
              status: post.status === 'PUBLISHED' ? 'completed' : 'pending',
            });
          });
        }
      } catch (e) {
        console.error('[editslog] Failed to fetch posts:', e);
      }

      // 3. Recent reply activity (from localStorage, written by Reviews.tsx sendReply)
      const stored = loadActivity();
      allLogs.push(...stored);

      // Sort by date descending
      allLogs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      setLogs(allLogs);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterItems = [
    { id: 'all', label: t('editsLog.allActivity'), icon: History, count: logs.length },
    { id: 'create', label: t('editsLog.created'), icon: CheckCircle, count: logs.filter(l => l.action === 'create').length },
    { id: 'post', label: t('editsLog.posts'), icon: Edit, count: logs.filter(l => l.action === 'post').length },
    { id: 'reply', label: t('editsLog.replies'), icon: Reply, count: logs.filter(l => l.action === 'reply').length },
    { id: 'sync', label: t('editsLog.sync'), icon: Refresh, count: logs.filter(l => l.action === 'sync').length },
    { id: 'delete', label: t('editsLog.deleted'), icon: Delete, count: logs.filter(l => l.action === 'delete').length },
  ];

  const filteredLogs = activeFilter === 'all'
    ? logs
    : logs.filter(l => l.action === activeFilter);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return t('editsLog.justNow');
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create': return 'bg-green-100 text-green-700';
      case 'update': return 'bg-blue-100 text-blue-700';
      case 'delete': return 'bg-red-100 text-red-700';
      case 'sync': return 'bg-purple-100 text-purple-700';
      case 'reply': return 'bg-teal-100 text-teal-700';
      case 'post': return 'bg-indigo-100 text-indigo-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create': return <CheckCircle className="w-4 h-4" />;
      case 'update': return <History className="w-4 h-4" />;
      case 'delete': return <Cancel className="w-4 h-4" />;
      case 'sync': return <Refresh className="w-4 h-4" />;
      case 'reply': return <Reply className="w-4 h-4" />;
      case 'post': return <Edit className="w-4 h-4" />;
      default: return <History className="w-4 h-4" />;
    }
  };

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
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Filter by Action</h3>
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
          <button
            onClick={fetchLogs}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-slate-500 hover:bg-white/50 rounded-xl transition-all"
          >
            <Refresh className="w-5 h-5" />
            <span className="text-sm">Refresh</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <section className="flex-1 bg-white p-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Activity Log</h2>
              <p className="text-sm text-slate-500 mt-1">Track all changes and sync activities</p>
            </div>
            <FilterList className="w-5 h-5 text-slate-400" />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Refresh className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <History className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No Activity Yet</h3>
              <p className="text-slate-500 max-w-sm mx-auto">
                Connect listings, send review replies, and create posts to see your activity here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((log, index) => (
                <div
                  key={log.id}
                  className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getActionColor(log.action)}`}>
                    {getActionIcon(log.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                      <span className="font-semibold text-slate-900">{log.entity}</span>
                    </div>
                    <p className="text-sm text-slate-600">{log.details}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                      <AccessTime className="w-3 h-3" />
                      <span>{formatDate(log.createdAt)}</span>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    log.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : log.status === 'pending'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-700'
                  }`}>
                    {log.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </motion.div>
  );
}
