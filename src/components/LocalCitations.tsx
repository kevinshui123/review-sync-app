import React, { useState, useEffect } from 'react';
import {
  Public,
  Description,
  Map,
  Phone,
  Schedule,
  Language,
} from '@mui/icons-material';
import { apiGet, apiPost } from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import { PageLoader } from './PageLoader';

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
  lat?: number;
  lng?: number;
}

export function LocalCitationsInner() {
  const { t } = useLanguage();
  const [citations, setCitations] = useState<Citation[]>([]);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const locationsRes = await apiGet('/api/embedsocial/locations');
        let locations: any[] = [];
        if (locationsRes.ok) {
          locations = await locationsRes.json();
        }
        const hasCoords = locations.some((l: any) => l.latitude || l.lat);
        if (locations.length > 0 && !hasCoords) {
          try {
            const backfillRes = await apiPost('/api/embedsocial/listings/backfill-coordinates');
            if (backfillRes.ok) {
              const refreshed = await apiGet('/api/embedsocial/locations');
              if (refreshed.ok) locations = await refreshed.json();
            }
          } catch (e) {
            console.warn('[LocalCitations] Backfill failed:', e);
          }
        }
        const primary = locations[0];
        if (primary) {
          setBusinessInfo({
            name: primary.name || 'Business',
            address: primary.address || '',
            phone: primary.phoneNumber || primary.phone || '',
            website: primary.websiteUrl || '',
            category: primary.category || '',
            keywords: 'restaurant, mini bowl, asian food',
            hours: {},
            lat: primary.latitude || primary.lat,
            lng: primary.longitude || primary.lng,
          });
        } else {
          setBusinessInfo({
            name: 'Mahjong mini bowl-Baltimore',
            address: '3105 saint pual st, unit A, Baltimore, 21218, US',
            phone: '(443) 869-2177',
            website: 'https://mahjong-box.com/',
            category: 'Restaurant',
            keywords: 'Asian Food, Mini Bowl, Noodles, Dumplings',
            hours: {
              Monday: '11 am - 8 pm', Tuesday: '11 am - 8 pm', Wednesday: '11 am - 8 pm',
              Thursday: '11 am - 8 pm', Friday: '11 am - 8 pm', Saturday: '11 am - 8 pm', Sunday: '11 am - 8 pm',
            },
            lat: 39.3305, lng: -76.6150,
          });
        }
        setCitations([]);
      } catch (error) {
        console.error('Failed to fetch citations data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <PageLoader message={t('seo.loadingSeo')} subMessage={t('seo.loadingSeoDesc')} />;
  }

  return (
    <div className="citations-container" style={{ padding: '24px 24px 24px 280px', maxWidth: '1600px', margin: '0 auto', minHeight: '100vh', background: 'var(--color-surface)' }}>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('seo.localCitations')}</h1>
        <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90">
          Sync Citations
        </button>
      </div>

      {/* Business Info Section */}
      <section className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-bold mb-6">{t('seo.baselineInfo')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
              <a className="text-sm text-primary underline" href={businessInfo?.website}>{businessInfo?.website}</a>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3 mb-4">
              <Schedule className="w-5 h-5 text-slate-400" />
              <span className="text-sm font-semibold">{t('seo.businessHours')}</span>
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
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold">Citation Directories</h2>
          <span className="text-sm text-slate-500">{citations.length} directories</span>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">{t('seo.name')}</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">{t('seo.status')}</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">{t('seo.address')}</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">{t('seo.hours')}</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">{t('seo.phone')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {citations.map((citation) => (
              <tr key={citation.id} className="hover:bg-slate-50">
                <td className="px-6 py-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center text-red-600">
                      <Public className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{citation.name}</p>
                      <p className="text-xs text-slate-500">{t('seo.lastUpdate')} {citation.lastUpdate}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-6">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    citation.status === 'matched' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {citation.status === 'matched' ? t('seo.matched') : t('seo.mismatch')}
                  </span>
                </td>
                <td className="px-6 py-6 text-sm text-slate-600">{citation.address}</td>
                <td className="px-6 py-6 text-sm text-slate-600">{citation.hours}</td>
                <td className="px-6 py-6 text-sm text-slate-600">{citation.phone}</td>
              </tr>
            ))}
            {citations.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                  <Public className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="font-medium">No citations found</p>
                  <p className="text-sm text-slate-400 mt-1">Sync your listings to discover citations across directories.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
      </div>
    </div>
  );
}

export function LocalCitations() {
  return <LocalCitationsInner />;
}
