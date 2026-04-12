import React, { useState, useEffect } from 'react';
import {
  PictureAsPdf,
  Download,
  CalendarToday,
  LocationOn,
  Refresh,
  BarChart,
} from '@mui/icons-material';
import {
  AreaChart, Area, BarChart as ReBarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { apiGet } from '../utils/api';

interface DailyData {
  date: string;
  searchViews: number;
  mapViews: number;
  websiteClicks: number;
  directionRequests: number;
  phoneCalls: number;
  [key: string]: number | string;
}

interface Location {
  id: string;
  name: string;
  address: string;
}

interface ReportsProps {
  setActiveTab: (tab: string) => void;
}

const CHART_COLORS = ['#2563eb', '#9333ea', '#f97316', '#ef4444', '#22c55e'];
const PIE_COLORS = ['#2563eb', '#9333ea'];

function formatDate(d: Date) {
  return d.toISOString().split('T')[0];
}

function formatDisplayDate(str: string) {
  if (!str) return '';
  const [y, m, day] = str.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(m, 10) - 1]} ${parseInt(day, 10)}, ${y}`;
}

function calcChange(curr: number, prev: number) {
  if (!prev) return 0;
  return Math.round(((curr - prev) / prev) * 100);
}

export function Reports({ setActiveTab }: ReportsProps) {
  const today = new Date();
  const defaultEnd = formatDate(today);
  const defaultStart = formatDate(new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000));

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [locations, setLocations] = useState<Location[]>([]);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  // Fetch locations
  useEffect(() => {
    apiGet('/api/embedsocial/locations').then(r => r.ok ? r.json() : []).then((data: any[]) => {
      setLocations(Array.isArray(data) ? data : []);
      if (data && data.length > 0 && !selectedLocation) {
        setSelectedLocation('all');
      }
    }).catch(() => {});
  }, []);

  // Fetch chart data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await apiGet(`/api/embedsocial/chart-data?period=30days`);
        if (res.ok) {
          const json = await res.json();
          const data: DailyData[] = json.impressions || [];
          setDailyData(data);
        }
      } catch (e) {
        console.error('[Reports] Failed to load chart data', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      let url = `/api/reports/gbp-pdf?startDate=${startDate}&endDate=${endDate}`;
      if (selectedLocation !== 'all') url += `&sourceId=${selectedLocation}`;
      const link = document.createElement('a');
      link.href = url;
      link.download = `GBP_Insights_${startDate}_to_${endDate}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('[Reports] PDF download failed', e);
    } finally {
      setDownloading(false);
    }
  };

  // Filter data by date range
  const filteredData = dailyData.filter(d => d.date >= startDate && d.date <= endDate);

  // Monthly aggregates
  const monthly: Record<string, DailyData> = {};
  for (const d of filteredData) {
    const month = d.date.substring(0, 7);
    if (!monthly[month]) {
      monthly[month] = { date: month, searchViews: 0, mapViews: 0, websiteClicks: 0, directionRequests: 0, phoneCalls: 0 };
    }
    monthly[month].searchViews += d.searchViews;
    monthly[month].mapViews += d.mapViews;
    monthly[month].websiteClicks += d.websiteClicks;
    monthly[month].directionRequests += d.directionRequests;
    monthly[month].phoneCalls += d.phoneCalls;
  }
  const monthlyList = Object.values(monthly).sort((a, b) => a.date.localeCompare(b.date));

  // Totals
  const totalSearch = filteredData.reduce((s, d) => s + d.searchViews, 0);
  const totalMap = filteredData.reduce((s, d) => s + d.mapViews, 0);
  const totalDir = filteredData.reduce((s, d) => s + d.directionRequests, 0);
  const totalCalls = filteredData.reduce((s, d) => s + d.phoneCalls, 0);
  const totalActions = totalDir + totalCalls;

  // % change (current vs previous month)
  const prevMonthData = monthlyList.length >= 2 ? monthlyList[monthlyList.length - 2] : null;
  const currMonthData = monthlyList.length >= 1 ? monthlyList[monthlyList.length - 1] : null;
  const searchChange = prevMonthData ? calcChange(currMonthData.searchViews, prevMonthData.searchViews) : 0;
  const mapChange = prevMonthData ? calcChange(currMonthData.mapViews, prevMonthData.mapViews) : 0;
  const actionsChange = prevMonthData
    ? calcChange(
        (currMonthData.directionRequests + currMonthData.phoneCalls),
        (prevMonthData.directionRequests + prevMonthData.phoneCalls)
      )
    : 0;

  // Last 7 days
  const last7 = filteredData.slice(-7);
  const last7Search = last7.map(d => ({ date: d.date, 'Search Views': d.searchViews, 'Map Views': d.mapViews }));
  const last7Actions = last7.map(d => ({ date: d.date, 'Directions': d.directionRequests, 'Calls': d.phoneCalls }));

  // Pie data
  const searchPie = [
    { name: 'Search Views', value: totalSearch },
    { name: 'Map Views', value: totalMap },
  ];
  const actionsPie = [
    { name: 'Direction Requests', value: totalDir },
    { name: 'Phone Calls', value: totalCalls },
  ];

  const dateLabel = `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`;

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold font-headline tracking-tight mb-1">GBP Performance Report</h2>
        <p className="text-slate-500 text-sm">Visualize search visibility, map interactions, and customer actions for your business listings.</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          {/* Source */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              <LocationOn className="w-3 h-3 inline mr-1" />Source
            </label>
            <select
              value={selectedLocation}
              onChange={e => setSelectedLocation(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
            >
              <option value="all">All Locations</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              <CalendarToday className="w-3 h-3 inline mr-1" />Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              <CalendarToday className="w-3 h-3 inline mr-1" />End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
            />
          </div>

          <button
            onClick={handleDownload}
            disabled={downloading || loading}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow transition-all"
          >
            {downloading
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
              : <Download className="w-4 h-4" />
            }
            {downloading ? 'Generating...' : 'Download PDF Report'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading report data...</p>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <BarChart className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-bold text-slate-600">No data available</p>
          <p className="text-xs mt-1">Make sure your Google Business Profile is connected and has activity in this date range.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPI Summary Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Search Views', value: totalSearch.toLocaleString(), change: searchChange, color: 'blue' },
              { label: 'Total Map Views', value: totalMap.toLocaleString(), change: mapChange, color: 'purple' },
              { label: 'Total Actions', value: totalActions.toLocaleString(), change: actionsChange, color: 'orange' },
              { label: 'Phone Calls', value: totalCalls.toLocaleString(), color: 'red' },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                <div className="text-xs font-medium text-slate-400 mb-1">{kpi.label}</div>
                <div className={`text-2xl font-extrabold font-headline tracking-tight text-${kpi.color}-600`}>
                  {kpi.value}
                </div>
                {'change' in kpi && kpi.change !== 0 && (
                  <div className={`text-xs font-semibold mt-1 ${kpi.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {kpi.change > 0 ? '+' : ''}{kpi.change}% vs previous period
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Section 1: Search Performance */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-base font-bold mb-4">Search Performance: {dateLabel}</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Line Chart */}
              <div>
                <p className="text-xs text-slate-400 mb-2 font-semibold">Trend Over Time</p>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={filteredData.slice(-30)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="#94a3b8" tickFormatter={v => v.slice(5)} />
                      <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }}
                        formatter={(v: number) => v.toLocaleString()} />
                      <Area type="monotone" dataKey="searchViews" stroke="#2563eb" strokeWidth={2} fill="#2563eb" fillOpacity={0.15} name="Search Views" />
                      <Area type="monotone" dataKey="mapViews" stroke="#9333ea" strokeWidth={2} fill="#9333ea" fillOpacity={0.15} name="Map Views" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              {/* Monthly Table */}
              <div>
                <p className="text-xs text-slate-400 mb-2 font-semibold">Monthly Breakdown</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-500">
                        <th className="px-3 py-2 text-left font-semibold">Period</th>
                        <th className="px-3 py-2 text-right font-semibold">Search</th>
                        <th className="px-3 py-2 text-right font-semibold">Maps</th>
                        <th className="px-3 py-2 text-right font-semibold">% Chg</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyList.map((m, i) => {
                        const prev = monthlyList[i - 1];
                        const pct = prev ? calcChange(m.searchViews, prev.searchViews) : 0;
                        return (
                          <tr key={m.date} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                            <td className="px-3 py-2 font-medium text-slate-700">{m.date}</td>
                            <td className="px-3 py-2 text-right text-slate-600">{m.searchViews.toLocaleString()}</td>
                            <td className="px-3 py-2 text-right text-slate-600">{m.mapViews.toLocaleString()}</td>
                            <td className={`px-3 py-2 text-right font-semibold ${pct > 0 ? 'text-green-600' : pct < 0 ? 'text-red-600' : 'text-slate-400'}`}>
                              {i === 0 ? '—' : `${pct > 0 ? '+' : ''}${pct}%`}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 font-bold">
                        <td className="px-3 py-2 text-slate-700">Total</td>
                        <td className="px-3 py-2 text-right text-slate-700">{totalSearch.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right text-slate-700">{totalMap.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right text-slate-400">—</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            {/* Summarized: Pie */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-slate-400 mb-2 font-semibold">Search vs Map Share</p>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={searchPie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {searchPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => v.toLocaleString()} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-2 font-semibold">Weekly Search Performance ({last7[0]?.date} – {last7[last7.length - 1]?.date})</p>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <ReBarChart data={last7Search}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="#94a3b8" tickFormatter={v => v.slice(5)} />
                      <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }}
                        formatter={(v: number) => v.toLocaleString()} />
                      <Bar dataKey="Search Views" fill="#2563eb" radius={[4, 4, 0, 0]} name="Search Views" />
                      <Bar dataKey="Map Views" fill="#9333ea" radius={[4, 4, 0, 0]} name="Map Views" />
                    </ReBarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Actions Performance */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-base font-bold mb-4">Actions Performance: {dateLabel}</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Line Chart */}
              <div>
                <p className="text-xs text-slate-400 mb-2 font-semibold">Trend Over Time</p>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={filteredData.slice(-30)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="#94a3b8" tickFormatter={v => v.slice(5)} />
                      <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }}
                        formatter={(v: number) => v.toLocaleString()} />
                      <Area type="monotone" dataKey="directionRequests" stroke="#f97316" strokeWidth={2} fill="#f97316" fillOpacity={0.15} name="Directions" />
                      <Area type="monotone" dataKey="phoneCalls" stroke="#ef4444" strokeWidth={2} fill="#ef4444" fillOpacity={0.15} name="Phone Calls" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              {/* Monthly Table */}
              <div>
                <p className="text-xs text-slate-400 mb-2 font-semibold">Monthly Breakdown</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-500">
                        <th className="px-3 py-2 text-left font-semibold">Period</th>
                        <th className="px-3 py-2 text-right font-semibold">Directions</th>
                        <th className="px-3 py-2 text-right font-semibold">Calls</th>
                        <th className="px-3 py-2 text-right font-semibold">Total</th>
                        <th className="px-3 py-2 text-right font-semibold">% Chg</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyList.map((m, i) => {
                        const total = (m.directionRequests || 0) + (m.phoneCalls || 0);
                        const prev = monthlyList[i - 1];
                        const prevTotal = prev ? (prev.directionRequests || 0) + (prev.phoneCalls || 0) : 0;
                        const pct = prev ? calcChange(total, prevTotal) : 0;
                        return (
                          <tr key={m.date} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                            <td className="px-3 py-2 font-medium text-slate-700">{m.date}</td>
                            <td className="px-3 py-2 text-right text-slate-600">{(m.directionRequests || 0).toLocaleString()}</td>
                            <td className="px-3 py-2 text-right text-slate-600">{(m.phoneCalls || 0).toLocaleString()}</td>
                            <td className="px-3 py-2 text-right font-semibold text-slate-700">{total.toLocaleString()}</td>
                            <td className={`px-3 py-2 text-right font-semibold ${pct > 0 ? 'text-green-600' : pct < 0 ? 'text-red-600' : 'text-slate-400'}`}>
                              {i === 0 ? '—' : `${pct > 0 ? '+' : ''}${pct}%`}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 font-bold">
                        <td className="px-3 py-2 text-slate-700">Total</td>
                        <td className="px-3 py-2 text-right text-slate-700">{totalDir.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right text-slate-700">{totalCalls.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right text-slate-700">{totalActions.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right text-slate-400">—</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            {/* Summarized: Pie + Weekly */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-slate-400 mb-2 font-semibold">Actions Breakdown</p>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={actionsPie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {actionsPie.map((_, i) => <Cell key={i} fill={['#f97316', '#ef4444'][i]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => v.toLocaleString()} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-2 font-semibold">Weekly Actions ({last7[0]?.date} – {last7[last7.length - 1]?.date})</p>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <ReBarChart data={last7Actions}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="#94a3b8" tickFormatter={v => v.slice(5)} />
                      <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }}
                        formatter={(v: number) => v.toLocaleString()} />
                      <Bar dataKey="Directions" fill="#f97316" radius={[4, 4, 0, 0]} name="Directions" />
                      <Bar dataKey="Calls" fill="#ef4444" radius={[4, 4, 0, 0]} name="Phone Calls" />
                    </ReBarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
