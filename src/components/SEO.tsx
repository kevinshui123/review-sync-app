import React, { useState, useEffect } from 'react';
import {
  Search,
  Notifications,
  History,
  Public,
  Map,
  Description,
  Phone,
  Schedule,
  Language,
  LocalOffer,
  Edit,
} from '@mui/icons-material';
import { motion } from 'motion/react';

interface SEOProps {
  setActiveTab: (tab: string) => void;
}

interface Citation {
  id: string;
  name: string;
  status: 'matched' | 'mismatch';
  address: string;
  hours: string;
  phone: string;
  lastUpdate: string;
}

interface BusinessInfo {
  name: string;
  address: string;
  phone: string;
  website: string;
  category: string;
  keywords: string;
  hours: Record<string, string>;
}

export function SEO({ setActiveTab }: SEOProps) {
  const [activeSection, setActiveSection] = useState('citations');
  const [citations, setCitations] = useState<Citation[]>([]);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Mock data - replace with actual API calls
        setBusinessInfo({
          name: 'Mahjong mini bowl-Baltimore',
          address: '3105 saint pual st, unit A, Baltimore, 21218, US',
          phone: '(443) 869-2177',
          website: 'https://mahjong-box.com/',
          category: 'Restaurant',
          keywords: 'Asian Food, Mini Bowl, Noodles, Dumplings',
          hours: {
            Monday: '11 am - 8 pm',
            Tuesday: '11 am - 8 pm',
            Wednesday: '11 am - 8 pm',
            Thursday: '11 am - 8 pm',
            Friday: '11 am - 8 pm',
            Saturday: '11 am - 8 pm',
            Sunday: '11 am - 8 pm',
          },
        });

        setCitations([
          {
            id: '1',
            name: "Mark's Duck House",
            status: 'mismatch',
            address: '6184 Arlington Blvd, Falls Church, 22044, US',
            hours: 'Monday 10 am - 9 pm',
            phone: '(703) 532-',
            lastUpdate: '11.04.2026',
          },
          {
            id: '2',
            name: 'mahjong',
            status: 'mismatch',
            address: 'Saint Paul St, Baltimore, 21218, US',
            hours: 'Matched',
            phone: '+144386',
            lastUpdate: '11.04.2026',
          },
        ]);
      } catch (error) {
        console.error('Failed to fetch SEO data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const sections = [
    { id: 'grid', label: 'Local search grid', icon: Map },
    { id: 'citations', label: 'Local citations', icon: Description, badge: 'BETA' },
    { id: 'optimization', label: 'Optimization', icon: LocalOffer },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* SEO Submenu */}
      <aside className="w-64 bg-white border-r border-slate-100 p-4 space-y-6 overflow-y-auto">
        {/* Profile Card */}
        <div className="border border-slate-200 rounded p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
              <Public className="w-5 h-5 text-red-500" />
            </div>
            <div className="truncate">
              <p className="text-sm font-bold truncate">{businessInfo?.name || 'Business'}</p>
              <p className="text-[10px] text-slate-500 truncate">{businessInfo?.address?.split(',')[0] || 'Location'}</p>
            </div>
          </div>
          <span className="text-slate-400">▼</span>
        </div>

        {/* Keywords Section */}
        <div className="space-y-1">
          <div className="px-2 py-2">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Keywords</h3>
          </div>
          <nav className="space-y-1">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-primary font-semibold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm">{section.label}</span>
                  {section.badge && (
                    <span className="ml-auto bg-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded font-bold">
                      {section.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        {/* Section: Citations */}
        {activeSection === 'citations' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Header */}
            <h1 className="text-2xl font-bold">
              Local citation: <span className="font-normal text-slate-500">{businessInfo?.name}</span>
            </h1>

            {/* Baseline Info Card */}
            <section className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-bold mb-6">Baseline information (Google)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Contact Info */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Description className="w-5 h-5 text-slate-400 mt-0.5" />
                    <span className="text-sm font-medium">{businessInfo?.name}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Map className="w-5 h-5 text-slate-400 mt-0.5" />
                    <span className="text-sm text-slate-600">{businessInfo?.address}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-slate-400 mt-0.5" />
                    <span className="text-sm text-slate-600">{businessInfo?.phone}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Language className="w-5 h-5 text-slate-400 mt-0.5" />
                    <a className="text-sm text-primary underline" href={businessInfo?.website}>
                      {businessInfo?.website}
                    </a>
                  </div>
                  <div className="flex items-start gap-3">
                    <LocalOffer className="w-5 h-5 text-slate-400 mt-0.5" />
                    <span className="text-sm text-slate-600">{businessInfo?.category}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Edit className="w-5 h-5 text-slate-400 mt-0.5" />
                    <span className="text-sm text-slate-600">{businessInfo?.keywords}</span>
                  </div>
                </div>

                {/* Business Hours */}
                <div className="space-y-1">
                  <div className="flex items-center gap-3 mb-4">
                    <Schedule className="w-5 h-5 text-slate-400" />
                    <span className="text-sm font-semibold">Business Hours</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
                    {Object.entries(businessInfo?.hours || {}).map(([day, time]) => (
                      <React.Fragment key={day}>
                        <span>{day}</span>
                        <span className="text-right">{time}</span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Citations Table */}
            <section className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Address</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Hours</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Phone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {citations.map((citation) => (
                    <tr key={citation.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-8">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 flex items-center justify-center text-red-600">
                            <Public className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-sm font-bold">{citation.name}</p>
                            <p className="text-xs text-slate-500">
                              Last update: {citation.lastUpdate} •{' '}
                              <a className="text-primary underline" href="#">Not your business?</a>
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-8">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          citation.status === 'matched'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {citation.status === 'matched' ? 'Matched' : 'Mismatch'}
                        </span>
                      </td>
                      <td className="px-6 py-8">
                        <span className={`px-3 py-1 rounded text-sm ${
                          citation.status === 'matched'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-slate-700'
                        }`}>
                          {citation.address}
                        </span>
                      </td>
                      <td className="px-6 py-8">
                        {citation.hours === 'Matched' ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">Matched</span>
                        ) : (
                          <div className="space-y-1">
                            <span className="block bg-yellow-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                              {citation.hours}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-8">
                        <span className={`px-3 py-1 rounded text-sm ${
                          citation.status === 'matched'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-slate-700'
                        }`}>
                          {citation.phone}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </motion.div>
        )}

        {/* Section: Local Search Grid */}
        {activeSection === 'grid' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Location search grid</h1>
              <button className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50">
                Report settings
              </button>
            </div>

            {/* Hero Section */}
            <section className="relative w-full h-[500px] flex items-center justify-center bg-gradient-to-b from-slate-50 to-white rounded-2xl border border-slate-200">
              <div className="relative z-10 text-center max-w-lg px-4">
                <div className="mb-4 inline-flex items-center justify-center p-3 bg-slate-100 rounded-full border border-slate-200">
                  <Public className="w-6 h-6 text-slate-500" />
                </div>
                <h2 className="text-2xl font-bold mb-3">Local Search Grid</h2>
                <p className="text-slate-500 text-sm leading-relaxed mb-6">
                  Visualize rankings on a geographical map to identify local opportunities and track competitor performance.
                </p>
                <button className="bg-primary text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-primary/90 transition-colors">
                  Create report
                </button>
              </div>
            </section>

            {/* Competitors Section */}
            <section className="border-t border-slate-200 pt-10">
              <h2 className="text-lg font-bold mb-2">Ranking competitors</h2>
              <p className="text-sm text-slate-500 mb-8">Top-performing search competitors, based on the Grid Points for this keyword</p>
              <div className="bg-slate-50 border border-dashed border-slate-300 rounded-lg p-16 flex flex-col items-center justify-center text-center">
                <div className="mb-4 inline-flex items-center justify-center p-3 bg-white rounded-full border border-slate-200 shadow-sm">
                  <Public className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-base font-bold mb-2">Local Search Grid</h3>
                <p className="text-slate-400 text-xs max-w-md">
                  No data available yet. Create your first report to start tracking your local ranking performance against competitors.
                </p>
              </div>
            </section>
          </motion.div>
        )}

        {/* Section: Optimization */}
        {activeSection === 'optimization' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center min-h-[600px]"
          >
            <div className="max-w-xl w-full text-center space-y-8 px-6">
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <LocalOffer className="w-7 h-7 text-slate-700" />
                  <h2 className="text-3xl font-extrabold tracking-tight">SEO optimization:</h2>
                </div>
                <h3 className="text-2xl font-semibold text-slate-600">{businessInfo?.name}</h3>
                <p className="text-slate-500 max-w-sm mx-auto text-sm leading-relaxed">
                  Generate an optimization report. Get a guide on how to increase your ranking on Google and much more.
                </p>
              </div>

              <div className="space-y-4 flex flex-col items-center">
                <div className="relative w-72">
                  <select className="w-full pl-4 pr-10 py-3 border border-slate-300 rounded-lg text-sm appearance-none focus:ring-2 focus:ring-primary focus:border-primary">
                    <option>Period: Last week</option>
                    <option>Period: Last month</option>
                    <option>Period: Last 3 months</option>
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</span>
                </div>
                <button className="flex items-center bg-pink-50 hover:bg-pink-100 border border-pink-100 text-slate-800 font-semibold px-5 py-3 rounded-lg transition-all">
                  <LocalOffer className="w-4 h-4 mr-2 text-pink-500" />
                  <span className="mr-3">Generate report</span>
                  <span className="bg-white border border-slate-200 text-[10px] px-2 py-0.5 rounded">5 credits</span>
                </button>
              </div>
            </div>

            {/* Chat Bubble */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
              <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex items-start gap-3 max-w-sm mb-2 animate-pulse">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium leading-tight mb-1">Just checking in to see if you still ne...</p>
                  <p className="text-[10px] text-slate-400">Fin • 16分钟</p>
                </div>
              </div>
              <button className="relative w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                <Public className="w-7 h-7 text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
