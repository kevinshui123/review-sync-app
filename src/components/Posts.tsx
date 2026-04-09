import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Megaphone, Calendar, Clock, X, Image as ImageIcon, Sparkles, Plus, MapPin } from 'lucide-react';
import { motion } from 'motion/react';

export function Posts() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  
  // Form State
  const [postType, setPostType] = useState('UPDATE');
  const [content, setContent] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchLocations();
    fetchPosts();
  }, []);

  const fetchLocations = async () => {
    try {
      const res = await fetch('/api/locations');
      if (res.ok) {
        const data = await res.json();
        setLocations(data);
        if (data.length > 0) {
          setSelectedLocationId(data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    }
  };

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/posts');
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    }
  };

  const handleSavePost = async (status: 'DRAFT' | 'SCHEDULED') => {
    if (!selectedLocationId || !content) {
      setSaveMessage({ type: 'error', text: 'Location and content are required.' });
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId: selectedLocationId,
          content,
          type: postType,
          status,
          scheduledFor: scheduledFor || null
        })
      });

      if (res.ok) {
        setSaveMessage({ type: 'success', text: `Post ${status.toLowerCase()} successfully!` });
        fetchPosts();
        setTimeout(() => {
          setIsDrawerOpen(false);
          setSaveMessage(null);
          setContent('');
          setScheduledFor('');
        }, 1500);
      } else {
        setSaveMessage({ type: 'error', text: 'Failed to save post.' });
      }
    } catch (error) {
      console.error('Save post error:', error);
      setSaveMessage({ type: 'error', text: 'Network error saving post.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchPosts();
      }
    } catch (error) {
      console.error('Delete post error:', error);
    }
  };

  // Helper to get days in current month
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const currentMonthName = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex h-full w-full relative overflow-hidden"
    >
      {/* Main Calendar Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isDrawerOpen ? 'mr-[400px]' : ''}`}>
        <div className="p-8 border-b border-outline-variant/10 flex justify-between items-end shrink-0">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-on-surface mb-1">Content Calendar</h2>
            <p className="text-on-surface-variant text-sm">Schedule and manage your Google Business Profile posts.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-surface-container-low rounded-lg p-1 border border-outline-variant/10">
              <button onClick={prevMonth} className="p-2 hover:bg-surface-container-highest rounded-md transition-colors text-on-surface">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="px-4 font-bold text-sm tracking-widest uppercase text-on-surface w-40 text-center">{currentMonthName}</span>
              <button onClick={nextMonth} className="p-2 hover:bg-surface-container-highest rounded-md transition-colors text-on-surface">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <button 
              onClick={() => setIsDrawerOpen(true)}
              className="bg-primary text-on-primary hover:brightness-105 transition-all px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20"
            >
              <Plus className="w-4 h-4" />
              New Post
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="bg-surface-container rounded-2xl border border-outline-variant/10 overflow-hidden">
            {/* Days Header */}
            <div className="grid grid-cols-7 border-b border-outline-variant/10 bg-surface-container-low/50">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="py-3 text-center text-[10px] font-bold uppercase tracking-widest text-outline">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar Cells */}
            <div className="grid grid-cols-7 auto-rows-[120px] divide-x divide-y divide-outline-variant/5">
              {/* Empty cells for previous month */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-surface-container-lowest/30 p-2"></div>
              ))}
              
              {/* Days 1-31 */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isToday = day === currentDate.getDate();
                
                // Find posts for this day
                const dayPosts = posts.filter(post => {
                  if (!post.scheduledFor) return false;
                  const postDate = new Date(post.scheduledFor);
                  return postDate.getDate() === day && 
                         postDate.getMonth() === currentDate.getMonth() && 
                         postDate.getFullYear() === currentDate.getFullYear();
                });
                
                return (
                  <div key={day} className={`p-2 relative group hover:bg-surface-container-highest/20 transition-colors ${isToday ? 'bg-primary/5' : ''}`}>
                    <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-on-primary' : 'text-on-surface-variant'}`}>
                      {day}
                    </span>
                    
                    <div className="mt-1 space-y-1 overflow-y-auto max-h-[80px] no-scrollbar">
                      {dayPosts.map(post => (
                        <div key={post.id} className="text-xs p-1.5 rounded bg-surface-container-highest border border-outline-variant/10 group/post relative">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1">
                              <div className={`w-2 h-2 rounded-full ${post.status === 'PUBLISHED' ? 'bg-emerald-500' : post.status === 'SCHEDULED' ? 'bg-tertiary' : 'bg-outline'}`}></div>
                              <span className="font-bold text-[9px] uppercase tracking-wider text-on-surface truncate">{post.type}</span>
                            </div>
                            <button 
                              onClick={() => handleDeletePost(post.id)}
                              className="opacity-0 group-hover/post:opacity-100 text-error hover:text-error/80 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                          <p className="text-[10px] text-outline truncate">{post.content}</p>
                        </div>
                      ))}
                    </div>
                    
                    <button 
                      onClick={() => {
                        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T12:00`;
                        setScheduledFor(dateStr);
                        setIsDrawerOpen(true);
                      }}
                      className="absolute top-2 right-2 p-1 rounded-md bg-surface-container-highest text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Create Post Drawer */}
      <div 
        className={`absolute top-0 right-0 h-full w-[400px] bg-surface-container-low border-l border-outline-variant/10 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col z-20 ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container/50 backdrop-blur-md sticky top-0 z-10">
          <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-primary" />
            Create Google Post
          </h3>
          <button 
            onClick={() => setIsDrawerOpen(false)}
            className="p-2 rounded-full hover:bg-surface-container-highest text-outline transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Location Selection */}
          {locations.length > 0 && (
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-outline">Location</label>
              <select 
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant/10 rounded-lg p-2.5 text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Post Type */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-outline">Post Type</label>
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => setPostType('OFFER')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex flex-col items-center gap-1 transition-colors ${postType === 'OFFER' ? 'bg-primary/10 border border-primary/30 text-primary' : 'bg-surface-container-highest border border-outline-variant/10 text-on-surface-variant hover:bg-surface-container-highest/80'}`}
              >
                <Megaphone className="w-4 h-4" /> Offer
              </button>
              <button 
                onClick={() => setPostType('UPDATE')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex flex-col items-center gap-1 transition-colors ${postType === 'UPDATE' ? 'bg-primary/10 border border-primary/30 text-primary' : 'bg-surface-container-highest border border-outline-variant/10 text-on-surface-variant hover:bg-surface-container-highest/80'}`}
              >
                <Clock className="w-4 h-4" /> Update
              </button>
              <button 
                onClick={() => setPostType('EVENT')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex flex-col items-center gap-1 transition-colors ${postType === 'EVENT' ? 'bg-primary/10 border border-primary/30 text-primary' : 'bg-surface-container-highest border border-outline-variant/10 text-on-surface-variant hover:bg-surface-container-highest/80'}`}
              >
                <Calendar className="w-4 h-4" /> Event
              </button>
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-outline">Media</label>
            <div className="border-2 border-dashed border-outline-variant/20 rounded-xl h-40 flex flex-col items-center justify-center bg-surface-container-lowest/50 hover:bg-surface-container-lowest transition-colors cursor-pointer group">
              <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <ImageIcon className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm font-bold text-on-surface">Click to upload image</p>
              <p className="text-xs text-outline mt-1">PNG, JPG up to 5MB</p>
            </div>
          </div>

          {/* Caption */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold uppercase tracking-widest text-outline">Caption</label>
              <button 
                onClick={() => alert('AI Caption Generator will be available once API is connected.')}
                className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-1 hover:underline"
              >
                <Sparkles className="w-3 h-3" /> AI Generator
              </button>
            </div>
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-32 bg-surface-container-lowest border border-outline-variant/10 rounded-xl p-4 text-sm text-on-surface placeholder-outline/50 focus:ring-1 focus:ring-primary/40 outline-none resize-none"
              placeholder="Write your post caption here..."
            ></textarea>
            <div className="flex justify-end text-[10px] text-outline font-medium">
              {content.length} / 1500
            </div>
          </div>

          {/* Schedule */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-outline">Schedule Date & Time</label>
            <input 
              type="datetime-local" 
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              className="w-full bg-surface-container border border-outline-variant/10 rounded-lg p-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary/40 outline-none [color-scheme:dark]" 
            />
          </div>

          {/* Offer Details (Conditional based on type) */}
          {postType === 'OFFER' && (
            <div className="space-y-4 p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-outline">Offer Title</label>
                <input type="text" placeholder="e.g., 10% Off Spicy Wontons" className="w-full bg-surface-container border border-outline-variant/10 rounded-lg p-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary/40 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-outline">Start Date</label>
                  <input type="date" className="w-full bg-surface-container border border-outline-variant/10 rounded-lg p-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary/40 outline-none [color-scheme:dark]" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-outline">End Date</label>
                  <input type="date" className="w-full bg-surface-container border border-outline-variant/10 rounded-lg p-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary/40 outline-none [color-scheme:dark]" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-outline">Coupon Code (Optional)</label>
                <input type="text" placeholder="e.g., SPICY10" className="w-full bg-surface-container border border-outline-variant/10 rounded-lg p-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary/40 outline-none uppercase" />
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-6 border-t border-outline-variant/10 bg-surface-container/50 backdrop-blur-md flex flex-col gap-3 sticky bottom-0 z-10">
          {saveMessage && (
            <div className={`text-xs font-bold text-center ${saveMessage.type === 'success' ? 'text-emerald-500' : 'text-error'}`}>
              {saveMessage.text}
            </div>
          )}
          <div className="flex gap-3">
            <button 
              onClick={() => handleSavePost('DRAFT')}
              disabled={isSaving}
              className="flex-1 py-3 rounded-xl font-bold text-sm text-on-surface bg-surface-container-highest hover:bg-surface-container-highest/80 transition-colors disabled:opacity-50"
            >
              Save Draft
            </button>
            <button 
              onClick={() => handleSavePost('SCHEDULED')}
              disabled={isSaving || !scheduledFor}
              className="flex-1 py-3 rounded-xl font-bold text-sm text-on-primary bg-gradient-to-br from-primary to-primary-container hover:brightness-105 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:from-outline disabled:to-outline"
            >
              {scheduledFor ? 'Schedule Post' : 'Publish Now'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Overlay for mobile/smaller screens */}
      {isDrawerOpen && (
        <div 
          className="absolute inset-0 bg-surface/50 backdrop-blur-sm z-10 lg:hidden"
          onClick={() => setIsDrawerOpen(false)}
        ></div>
      )}
    </motion.div>
  );
}
