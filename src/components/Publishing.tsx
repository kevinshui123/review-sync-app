import React, { useState } from 'react';
import {
  Search,
  Notifications,
  ChevronLeft,
  ChevronRight,
  Add,
  ChatBubble,
} from '@mui/icons-material';
import { motion } from 'motion/react';

interface PublishingProps {
  setActiveTab: (tab: string) => void;
}

export function Publishing({ setActiveTab }: PublishingProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 3, 1)); // April 2026
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

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
  const remainingDays = 42 - calendarDays.length; // 6 rows * 7 days
  for (let i = 1; i <= remainingDays; i++) {
    calendarDays.push({ day: i, isCurrentMonth: false, date: null });
  }

  const posts = [
    { date: 6, title: 'Morning Coffee Update', color: 'bg-blue-50 text-blue-700 border-l-blue-700', type: 'published' },
    { date: 8, title: 'Listing Launch #12', color: 'bg-emerald-50 text-emerald-700 border-l-emerald-600', type: 'published' },
    { date: 14, title: 'Property Reel #4', time: '14:00', platform: 'Instagram', color: 'bg-white border-l-slate-300', type: 'scheduled' },
    { date: 22, title: 'Draft: Market Analysis', color: 'bg-amber-50 text-amber-700 border-l-amber-600', type: 'draft' },
  ];

  const getPostsForDay = (day: number) => posts.filter(p => p.date === day);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col min-h-screen"
    >
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
          <button className="px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-100 text-sm font-medium hover:bg-slate-50 transition-colors">
            Today
          </button>
          <div className="h-8 w-px bg-slate-200"></div>
          <div className="flex items-center gap-2">
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="bg-white border-slate-100 rounded-xl text-xs font-medium py-2 px-3 shadow-sm focus:ring-primary/20"
            >
              <option value="all">All Listings</option>
              <option value="main">Main Office</option>
              <option value="satellite">Satellite Branch</option>
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
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all">
            Plan content
          </button>
          <button className="px-5 py-2.5 bg-gradient-to-br from-primary to-primary-container text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2">
            <Add className="w-4 h-4" />
            Create post
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
              const isToday = item.isCurrentMonth && item.day === new Date().getDate();

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
                    {dayPosts.map((post, postIndex) => (
                      <div
                        key={postIndex}
                        className={`p-1.5 rounded-md text-[10px] font-bold border-l-2 truncate ${post.color}`}
                      >
                        {post.title}
                        {post.time && (
                          <span className="block text-[8px] font-normal opacity-70">
                            {post.time} • {post.platform}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating Chat Widget */}
      <div className="fixed bottom-6 right-6 z-50">
        <button className="relative w-14 h-14 bg-gradient-to-br from-primary to-primary-container text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform">
          <ChatBubble className="w-6 h-6" style={{ fontVariationSettings: "'FILL' 1" }} />
        </button>
        <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white"></span>
      </div>
    </motion.div>
  );
}
