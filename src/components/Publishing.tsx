import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Add,
  Close,
  Refresh,
  Schedule,
  Send,
  Edit,
  Delete,
  CheckCircle,
  Image,
  Link as LinkIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'motion/react';
import { apiGet, apiPost } from '../utils/api';

interface PublishingProps {
  setActiveTab: (tab: string) => void;
}

interface Post {
  id: string;
  captionText: string;
  sourceIds: string[];
  scheduledOn: string | null;
  publishStatus: string;
  type: string;
  createdAt: Date;
}

interface EmbedListing {
  id: string;
  name: string;
  sourceId?: string;
}

export function Publishing({ setActiveTab }: PublishingProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [posts, setPosts] = useState<Post[]>([]);
  const [locations, setLocations] = useState<EmbedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create post form
  const [newPost, setNewPost] = useState({
    captionText: '',
    sourceIds: [] as string[],
    scheduledOn: '',
    imageUrls: [] as string[],
  });
  const [creating, setCreating] = useState(false);

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch listings
      const locationsRes = await apiGet('/api/embedsocial/locations');
      if (locationsRes.ok) {
        const data = await locationsRes.json();
        const sources: EmbedListing[] = Array.isArray(data) ? data : (data.data || []);
        setLocations(sources);
      }

      // Fetch posts (stored in local DB)
      const postsRes = await apiGet('/api/posts');
      if (postsRes.ok) {
        const postsData = await postsRes.json();
        setPosts(postsData.map((p: any) => ({
          id: p.id,
          captionText: p.content,
          sourceIds: p.locationId ? [p.locationId] : [],
          scheduledOn: p.scheduledFor,
          publishStatus: p.status.toLowerCase(),
          type: p.type.toLowerCase(),
          createdAt: new Date(p.createdAt),
        })));
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Generate calendar grid
  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    const prevMonthDays = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0).getDate();
    calendarDays.push({ day: prevMonthDays - i, isCurrentMonth: false, date: null });
  }
  calendarDays.reverse();
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({ day: i, isCurrentMonth: true, date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i) });
  }
  const remainingDays = 42 - calendarDays.length;
  for (let i = 1; i <= remainingDays; i++) {
    calendarDays.push({ day: i, isCurrentMonth: false, date: null });
  }

  const getPostsForDay = (day: number) => {
    return posts.filter(p => {
      if (!p.scheduledOn) return false;
      const postDate = new Date(p.scheduledOn);
      return postDate.getDate() === day &&
             postDate.getMonth() === currentMonth.getMonth() &&
             postDate.getFullYear() === currentMonth.getFullYear();
    });
  };

  const handleCreatePost = async () => {
    if (!newPost.captionText.trim()) return;

    setCreating(true);
    try {
      const res = await apiPost('/api/posts', {
        content: newPost.captionText,
        type: 'UPDATE',
        status: newPost.scheduledOn ? 'SCHEDULED' : 'DRAFT',
        scheduledFor: newPost.scheduledOn || null,
        locationId: newPost.sourceIds[0] || null,
      });

      if (res.ok) {
        await fetchData();
        setShowCreateModal(false);
        setNewPost({ captionText: '', sourceIds: [], scheduledOn: '', imageUrls: [] });
      }
    } catch (error) {
      console.error('Failed to create post:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    try {
      const res = await apiDelete(`/api/posts/${id}`);
      if (res.ok) {
        setPosts(posts.filter(p => p.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-700 border-l-green-600';
      case 'scheduled': return 'bg-blue-100 text-blue-700 border-l-blue-600';
      case 'draft': return 'bg-amber-100 text-amber-700 border-l-amber-600';
      default: return 'bg-slate-100 text-slate-700 border-l-slate-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published': return <CheckCircle className="w-3 h-3" />;
      case 'scheduled': return <Schedule className="w-3 h-3" />;
      case 'draft': return <Edit className="w-3 h-3" />;
      default: return null;
    }
  };

  // Stats
  const stats = {
    published: posts.filter(p => p.publishStatus === 'published').length,
    scheduled: posts.filter(p => p.publishStatus === 'scheduled').length,
    draft: posts.filter(p => p.publishStatus === 'draft').length,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col min-h-screen"
    >
      {/* Create Post Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">Create New Post</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
                >
                  <Close className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Content</label>
                  <textarea
                    value={newPost.captionText}
                    onChange={e => setNewPost({ ...newPost, captionText: e.target.value })}
                    placeholder="What would you like to share?"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                    rows={4}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Schedule (optional)</label>
                  <input
                    type="datetime-local"
                    value={newPost.scheduledOn}
                    onChange={e => setNewPost({ ...newPost, scheduledOn: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Location</label>
                  <select
                    value={newPost.sourceIds[0] || ''}
                    onChange={e => setNewPost({ ...newPost, sourceIds: e.target.value ? [e.target.value] : [] })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  >
                    <option value="">Select a location</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePost}
                  disabled={creating || !newPost.captionText.trim()}
                  className="flex-1 px-4 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : newPost.scheduledOn ? 'Schedule Post' : 'Save as Draft'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sub Header / Controls */}
      <div className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white rounded-xl shadow-sm border border-slate-100 p-1">
            <button onClick={prevMonth} className="p-2 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-4 font-headline font-bold text-lg">{monthName}</span>
            <button onClick={nextMonth} className="p-2 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-100 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Today
          </button>

          {/* Stats */}
          <div className="flex items-center gap-3 ml-4">
            <span className="text-xs text-slate-500">{stats.published} published</span>
            <span className="text-xs text-slate-300">|</span>
            <span className="text-xs text-slate-500">{stats.scheduled} scheduled</span>
            <span className="text-xs text-slate-300">|</span>
            <span className="text-xs text-slate-500">{stats.draft} drafts</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-8 w-px bg-slate-200"></div>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="bg-white border-slate-100 rounded-xl text-xs font-medium py-2 px-3 shadow-sm focus:ring-primary/20"
          >
            <option value="all">All Locations</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-white border-slate-100 rounded-xl text-xs font-medium py-2 px-3 shadow-sm focus:ring-primary/20"
          >
            <option value="all">Status: All</option>
            <option value="published">Published</option>
            <option value="scheduled">Scheduled</option>
            <option value="draft">Draft</option>
          </select>
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-500 hover:text-primary transition-colors"
          >
            <Refresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full min-h-[700px]">
          {/* Day Labels */}
          <div className="grid grid-cols-7 border-b border-slate-50">
            {weekDays.map((day) => (
              <div key={day} className="py-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 flex-1">
            {calendarDays.map((item, index) => {
              const dayPosts = getPostsForDay(item.day);
              const isToday = item.isCurrentMonth && item.day === new Date().getDate() &&
                              currentMonth.getMonth() === new Date().getMonth() &&
                              currentMonth.getFullYear() === new Date().getFullYear();

              return (
                <div
                  key={index}
                  className={`border-r border-b border-slate-50 p-2 hover:bg-slate-50/50 transition-colors min-h-[100px] ${
                    !item.isCurrentMonth ? 'bg-slate-50/30 opacity-40' : ''
                  }`}
                >
                  <span className={`text-xs font-semibold ${
                    isToday
                      ? 'inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white'
                      : 'text-slate-500'
                  }`}>
                    {item.day}
                  </span>

                  {/* Posts */}
                  <div className="mt-2 space-y-1">
                    {dayPosts.map((post) => (
                      <div
                        key={post.id}
                        className={`p-1.5 rounded-md text-[10px] font-bold border-l-2 truncate flex items-center gap-1 ${getStatusColor(post.publishStatus)}`}
                      >
                        {getStatusIcon(post.publishStatus)}
                        <span className="truncate">{post.captionText}</span>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="ml-auto opacity-0 group-hover:opacity-100 hover:text-red-600"
                        >
                          <Delete className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-primary to-primary-container text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
      >
        <Add className="w-6 h-6" />
      </button>
    </motion.div>
  );
}
