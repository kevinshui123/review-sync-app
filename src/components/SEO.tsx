import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  Public,
  Map,
  Description,
  Phone,
  Schedule,
  Language,
  LocalOffer,
  Edit,
  Star,
  TrendingUp,
  TrendingDown,
  Place,
  Refresh,
  AutoAwesome,
  Lightbulb,
  Speed,
  OpenInNew,
  CheckCircle,
  LocalFireDepartment,
  Error as ErrorIcon,
  // Real Comment icons
  AccountCircle,
  PhotoCamera,
  StarBorder,
  History,
  Add,
  Delete,
  // Rednote icons
  Article,
  Tag,
  Image,
  Link,
} from '@mui/icons-material';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import { apiGet, apiPost } from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon for Leaflet in bundled environments
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function getRankColor(rank: number | null): string {
  if (rank === null) return '#94a3b8';
  if (rank <= 3) return '#22c55e';
  if (rank <= 10) return '#facc15';
  return '#f87171';
}

function getScoreColor(score: number) {
  if (score >= 80) return { color: '#22c55e', label: 'Excellent', bg: 'bg-green-50', border: 'border-green-200' };
  if (score >= 60) return { color: '#f59e0b', label: 'Good', bg: 'bg-amber-50', border: 'border-amber-200' };
  if (score >= 40) return { color: '#f97316', label: 'Fair', bg: 'bg-orange-50', border: 'border-orange-200' };
  return { color: '#ef4444', label: 'Needs Work', bg: 'bg-red-50', border: 'border-red-200' };
}

// Component to fly map to selected point
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 0.8 });
  }, [center, zoom, map]);
  return null;
}

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
  lat?: number;
  lng?: number;
}

interface GridPoint {
  idx: number;
  lat: number;
  lng: number;
  businessRank: number | null;
  totalResults: number;
  hasData: boolean;
  competitors: {
    rank: number;
    name: string;
    address: string;
    rating: number | null;
    reviews: number | null;
    phone: string;
    isTarget: boolean;
    thumbnail?: string | null;
  }[];
}

interface TopCompetitor {
  name: string;
  address: string;
  rating: number | null;
  reviews: number | null;
  phone: string;
  bestRank: number;
  rankAtPoints: number[];
  thumbnail?: string | null;
}

interface GridSummary {
  totalPoints: number;
  pointsWithData: number;
  pointsRanked: number;
  averageRank: number | null;
  top3Percent: number;
  top10Percent: number;
}

interface LocalSearchGridResult {
  keyword: string;
  center: { lat: number; lng: number };
  gridSize: number;
  points: GridPoint[];
  topCompetitors: TopCompetitor[];
  summary: GridSummary;
}

interface GoogleAccount {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  connected: boolean;
}

interface ReviewTask {
  id: string;
  accountEmail: string;
  location: string;
  content: string;
  rating: number;
  status: 'pending' | 'published' | 'failed';
  date: string;
  photos?: string[];
}

interface RednotePost {
  id: string;
  title: string;
  content: string;
  tags: string[];
  status: 'draft' | 'published' | 'scheduled';
  date: string;
  location?: string;
  photos?: string[];
}

// AI Review Personas for variety
const REVIEW_PERSONAS = [
  { name: 'Food Blogger', identity: 'Food blogger and local dining enthusiast' },
  { name: 'Regular Customer', identity: 'Regular customer who visits frequently' },
  { name: 'First-time Visitor', identity: 'First-time visitor from out of town' },
  { name: 'Family Diner', identity: 'Parent with young children dining with family' },
  { name: 'Office Worker', identity: 'Nearby office worker on lunch break' },
  { name: 'Student', identity: 'College student exploring cheap eats' },
  { name: 'Health Conscious', identity: 'Health-conscious diner looking for clean options' },
  { name: 'Group Events', identity: 'Someone who visits for group celebrations' },
];

// AI Review Scenarios for variety
const REVIEW_SCENARIOS = [
  'visiting during peak hours',
  'taking photos for social media',
  'trying the most popular items on the menu',
  'ordering for delivery for the first time',
  'celebrating a special occasion',
  'working remotely from the location',
  'recommending to a friend',
  'comparing with competitors',
];

export function SEO({ setActiveTab }: SEOProps) {
  const { t, language } = useLanguage();
  const [activeSection, setActiveSection] = useState('grid');
  const [activeCategory, setActiveCategory] = useState<'localSeo' | 'realComment' | 'rednoteSeo'>('localSeo');
  const [citations, setCitations] = useState<Citation[]>([]);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Optimization state
  const [seoReport, setSeoReport] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('seo_report');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [seoLoading, setSeoLoading] = useState(false);
  const [seoError, setSeoError] = useState<string | null>(null);

  useEffect(() => {
    if (seoReport) {
      localStorage.setItem('seo_report', JSON.stringify(seoReport));
    }
  }, [seoReport]);

  // Local Search Grid state
  const [gridKeyword, setGridKeyword] = useState('restaurant near me');
  const [gridResult, setGridResult] = useState<LocalSearchGridResult | null>(null);
  const [gridLoading, setGridLoading] = useState(false);
  const [gridError, setGridError] = useState<string | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<GridPoint | null>(null);

  // Real Comment state
  const [googleAccounts, setGoogleAccounts] = useState<GoogleAccount[]>([
    { id: '1', email: 'account1@gmail.com', name: 'John D.', connected: true },
    { id: '2', email: 'account2@gmail.com', name: 'Sarah M.', connected: true },
  ]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [reviewContent, setReviewContent] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewPhotos, setReviewPhotos] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [aiGeneratingReview, setAiGeneratingReview] = useState(false);
  const [aiReviewGenerated, setAiReviewGenerated] = useState(false);
  const [currentPersona, setCurrentPersona] = useState<typeof REVIEW_PERSONAS[0] | null>(null);
  const [reviewHistory, setReviewHistory] = useState<ReviewTask[]>([]);
  const [savingReview, setSavingReview] = useState(false);

  // Rednote SEO state
  const [rednoteConnected, setRednoteConnected] = useState(false);
  const [rednoteTitle, setRednoteTitle] = useState('');
  const [rednoteContent, setRednoteContent] = useState('');
  const [rednoteTags, setRednoteTags] = useState<string[]>([]);
  const [rednoteTagInput, setRednoteTagInput] = useState('');
  const [rednotePhotos, setRednotePhotos] = useState<string[]>([]);
  const [rednoteSelectedLocation, setRednoteSelectedLocation] = useState<string>('all');
  const [aiGeneratingPost, setAiGeneratingPost] = useState(false);
  const [postHistory, setPostHistory] = useState<RednotePost[]>([]);
  const [savingPost, setSavingPost] = useState(false);

  const handleCreateReport = async () => {
    if (!gridKeyword.trim() || !businessInfo?.lat || !businessInfo?.lng) return;
    setGridLoading(true);
    setGridError(null);
    setGridResult(null);
    setSelectedPoint(null);
    try {
      const res = await apiPost('/api/seo/local-search-grid', {
        keyword: gridKeyword,
        lat: businessInfo!.lat,
        lng: businessInfo!.lng,
        businessName: businessInfo!.name,
        gridSize: 9,
      });
      if (res.ok) {
        const data = await res.json();
        setGridResult(data);
      } else {
        const err = await res.json().catch(() => ({ error: 'Failed to generate report' }));
        setGridError(err.error || 'Failed to generate report');
      }
    } catch (e: any) {
      setGridError(e.message || 'Network error');
    } finally {
      setGridLoading(false);
    }
  };

  const generateSeoReport = useCallback(async () => {
    setSeoLoading(true);
    setSeoError(null);
    try {
      const res = await apiPost('/api/reports/seo-optimization', { lang: language });
      if (res.ok) {
        const data = await res.json();
        setSeoReport(data);
      } else {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        setSeoError(err.error || 'Failed to generate report');
      }
    } catch (e: any) {
      setSeoError(e.message || 'Network error');
    } finally {
      setSeoLoading(false);
    }
  }, [language]);

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
            console.warn('[SEO] Backfill failed:', e);
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
        console.error('Failed to fetch SEO data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleGenerateAIReview = async () => {
    if (!selectedAccount) {
      alert(t('realComment.errorNoAccount'));
      return;
    }
    setAiGeneratingReview(true);
    try {
      // Randomly select persona and scenario for variety
      const persona = REVIEW_PERSONAS[Math.floor(Math.random() * REVIEW_PERSONAS.length)];
      const scenario = REVIEW_SCENARIOS[Math.floor(Math.random() * REVIEW_SCENARIOS.length)];
      
      // Generate unique review based on business info
      const businessContext = businessInfo ? 
        `${businessInfo.name} - ${businessInfo.category} located at ${businessInfo.address}` : 
        'the restaurant';
      
      const prompt = `You are writing as a ${persona.identity}. You are ${scenario} at ${businessContext}.
Write a unique, authentic positive Google review that:
1. Uses a different writing style than typical reviews
2. Mentions specific but plausible details about the experience
3. Is 100-200 words
4. Sounds natural and not AI-generated
5. Uses casual, everyday language
6. Does NOT mention being paid, incentivized, or that this is for a business
7. Focuses on the dining experience, food quality, service, or atmosphere
8. Varies the sentence structure and tone

Write ONLY the review text, nothing else.`;

      const res = await apiPost('/api/reviews/generate-reply', {
        reviewId: 'ai-generated-review',
        reviewerName: persona.name,
        rating: 5,
        comment: prompt,
        businessName: businessInfo?.name || 'this business',
      });
      
      let generatedContent = '';
      if (res.ok) {
        const data = await res.json();
        if (data.replies?.professional) {
          generatedContent = data.replies.professional;
        }
      }
      
      // Fallback if API fails
      if (!generatedContent) {
        const fallbackReviews = [
          `${businessInfo?.name || 'The restaurant'} is quickly becoming my favorite spot! The atmosphere is so welcoming, and the staff really know how to make you feel at home. I tried the ${businessInfo?.category || 'specialties'} and was blown away by the flavors. Everything was fresh and made to order. The portions are generous without being overpriced. Definitely coming back soon!`,
          `What a gem! Found this place while exploring the neighborhood and so glad I did. The food was absolutely delicious and the service was top-notch. The staff went above and beyond to make sure we had everything we needed. Perfect for a casual lunch or a special dinner out. Highly recommend!`,
          `I've been coming here regularly for months now and they never disappoint. Each visit feels like the first time - exciting and satisfying. The quality of the food speaks for itself, and the prices are very reasonable for the quality you get. My go-to recommendation for anyone looking for great food!`,
          `Stopped by with my family and we were all impressed! The place has such a warm and inviting atmosphere. The kids loved their meals and so did the adults. Great portion sizes and the flavors are amazing. The staff were friendly and attentive. Will definitely be back for more!`,
        ];
        generatedContent = fallbackReviews[Math.floor(Math.random() * fallbackReviews.length)];
      }
      
      setReviewContent(generatedContent);
      setCurrentPersona(persona);
      setReviewRating(5);
      setAiReviewGenerated(true);
    } catch (error) {
      console.error('Failed to generate AI review:', error);
      alert('Failed to generate review. Please try again.');
    } finally {
      setAiGeneratingReview(false);
    }
  };

  const handleSaveReview = async () => {
    if (!selectedAccount) {
      alert(t('realComment.errorNoAccount'));
      return;
    }
    if (!reviewContent.trim()) {
      alert(t('realComment.errorNoContent'));
      return;
    }
    
    setSavingReview(true);
    try {
      const account = googleAccounts.find(a => a.id === selectedAccount);
      const newTask: ReviewTask = {
        id: Date.now().toString(),
        accountEmail: account?.email || 'Unknown',
        location: selectedLocation === 'all' ? 'All Locations' : selectedLocation,
        content: reviewContent,
        rating: reviewRating,
        status: 'pending',
        date: new Date().toISOString(),
        photos: reviewPhotos,
      };
      setReviewHistory(prev => [newTask, ...prev]);
      setReviewContent('');
      setReviewPhotos([]);
      setAiReviewGenerated(false);
      setCurrentPersona(null);
      alert(t('realComment.successSaved'));
    } catch (error) {
      console.error('Failed to save review:', error);
    } finally {
      setSavingReview(false);
    }
  };

  const handleGenerateRednotePost = async () => {
    setAiGeneratingPost(true);
    try {
      const businessContext = businessInfo ? 
        `${businessInfo.name} - ${businessInfo.category}\nAddress: ${businessInfo.address}\nKeywords: ${businessInfo.keywords}` : 
        'the restaurant';
      
      const prompt = `Generate a Xiaohongshu (Rednote) style post for this business:
${businessContext}

Create a engaging post that:
1. Has a catchy, clickbait-style Chinese title
2. Uses popular Chinese social media language and hashtags
3. Describes the experience in an authentic, personal way
4. Mentions specific dishes or features
5. Includes relevant tags
6. Is written in Simplified Chinese
7. Sounds like a real Chinese Gen-Z social media post

Format the response as:
TITLE: [Chinese title]
TAGS: [tag1, tag2, tag3, tag4, tag5]
CONTENT: [The post content in Chinese]`;

      const res = await apiPost('/api/reviews/generate-reply', {
        reviewId: 'ai-rednote-post',
        comment: prompt,
        businessName: businessInfo?.name || 'this business',
      });
      
      let generatedPost = '';
      if (res.ok) {
        const data = await res.json();
        if (data.replies?.professional) {
          generatedPost = data.replies.professional;
        }
      }
      
      // Fallback if API fails
      if (!generatedPost) {
        const fallbackPosts = [
          `TITLE: 😍宝藏小店被我发现啦！必打卡！
TAGS: #美食探店 #宝藏餐厅 #周末去哪玩 #美食分享 #种草推荐
CONTENT: 这家店真的太绝了！✨ 一进门就被装修风格吸引住了，超适合拍照打卡📸

菜品方面也是没话说，分量足，味道好，价格还实惠！老板人特别热情，服务态度满分💯

特别推荐他家的招牌菜，真的绝绝子！吃完还想再来！

📍地址：${businessInfo?.address || '就在市中心很好找'}
💰人均：${Math.floor(Math.random() * 50 + 30)}左右
🕐营业时间：${businessInfo?.hours?.Monday || '每天11点开始营业'}

姐妹们快冲！错过真的会后悔！冲冲冲！🏃‍♀️💨`,
        ];
        generatedPost = fallbackPosts[0];
      }
      
      // Parse the generated content
      const titleMatch = generatedPost.match(/TITLE:\s*(.+?)(?=TAGS:|$)/s);
      const tagsMatch = generatedPost.match(/TAGS:\s*(.+?)(?=CONTENT:|$)/s);
      const contentMatch = generatedPost.match(/CONTENT:\s*(.+?)$/s);
      
      if (titleMatch) setRednoteTitle(titleMatch[1].trim());
      if (tagsMatch) {
        const tags = tagsMatch[1].split(/[,#\s]+/).filter(t => t.trim()).slice(0, 5);
        setRednoteTags(tags);
      }
      if (contentMatch) setRednoteContent(contentMatch[1].trim());
      
    } catch (error) {
      console.error('Failed to generate Rednote post:', error);
      alert('Failed to generate post. Please try again.');
    } finally {
      setAiGeneratingPost(false);
    }
  };

  const handleSaveRednotePost = async (publish: boolean = false) => {
    if (!rednoteTitle.trim()) {
      alert(t('rednote.errorNoTitle'));
      return;
    }
    if (!rednoteContent.trim()) {
      alert(t('rednote.errorNoContent'));
      return;
    }
    
    setSavingPost(true);
    try {
      const newPost: RednotePost = {
        id: Date.now().toString(),
        title: rednoteTitle,
        content: rednoteContent,
        tags: rednoteTags,
        status: publish ? 'published' : 'draft',
        date: new Date().toISOString(),
        location: rednoteSelectedLocation === 'all' ? undefined : rednoteSelectedLocation,
        photos: rednotePhotos,
      };
      setPostHistory(prev => [newPost, ...prev]);
      setRednoteTitle('');
      setRednoteContent('');
      setRednoteTags([]);
      setRednotePhotos([]);
      alert(publish ? t('rednote.successPublished') : t('rednote.successSaved'));
    } catch (error) {
      console.error('Failed to save post:', error);
    } finally {
      setSavingPost(false);
    }
  };

  const handleAddPhoto = (setPhotos: React.Dispatch<React.SetStateAction<string[]>>) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          setPhotos(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleRemovePhoto = (index: number, photos: string[], setPhotos: React.Dispatch<React.SetStateAction<string[]>>) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-500">{t('seo.loading')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden min-h-0">
      {/* Main Category Navigation - 3 Main Sections */}
      <div className="bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-stretch">
          {/* Local SEO */}
          <button
            onClick={() => setActiveCategory('localSeo')}
            className={`flex-1 px-4 py-3 text-sm font-bold transition-all border-b-2 ${
              activeCategory === 'localSeo'
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-slate-500 hover:bg-slate-50'
            }`}
          >
            {t('seo.section.localSeo')}
          </button>
          
          {/* Real Comment - Highlighted as important */}
          <button
            onClick={() => setActiveCategory('realComment')}
            className={`flex-1 px-4 py-3 text-sm font-bold transition-all border-b-2 flex items-center justify-center gap-2 ${
              activeCategory === 'realComment'
                ? 'border-orange-500 text-orange-600 bg-orange-50'
                : 'border-transparent text-orange-600 hover:bg-orange-50'
            }`}
          >
            {t('seo.section.realComment')}
            <span className="bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold animate-pulse">NEW</span>
          </button>
          
          {/* Rednote SEO */}
          <button
            onClick={() => setActiveCategory('rednoteSeo')}
            className={`flex-1 px-4 py-3 text-sm font-bold transition-all border-b-2 ${
              activeCategory === 'rednoteSeo'
                ? 'border-pink-500 text-pink-600 bg-pink-50'
                : 'border-transparent text-pink-600 hover:bg-pink-50'
            }`}
          >
            {t('seo.section.rednoteSeo')}
          </button>
        </div>
      </div>

      {/* Local SEO Sub-sections */}
      {activeCategory === 'localSeo' && (
        <div className="flex items-center gap-1 px-3 py-2 bg-white border-b border-slate-100 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveSection('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeSection === 'grid' ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            {t('seo.localSearchGrid')}
          </button>
          <button
            onClick={() => setActiveSection('citations')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeSection === 'citations' ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <Description className="w-3.5 h-3.5" />
            {t('seo.localCitations')}
            <span className="text-[9px] px-1 py-0.5 rounded bg-slate-200 text-slate-600 font-bold">BETA</span>
          </button>
          <button
            onClick={() => setActiveSection('optimization')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeSection === 'optimization' ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <LocalOffer className="w-3.5 h-3.5" />
            {t('seo.optimization')}
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6">

        {/* ========== LOCAL SEO SECTION ========== */}
        {activeCategory === 'localSeo' && (
          <>
            {/* Citations Section */}
            {activeSection === 'citations' && (
              <div className="space-y-6">
                <h1 className="text-2xl font-bold">
                  {t('seo.localCitation')} <span className="font-normal text-slate-500">{businessInfo?.name}</span>
                </h1>
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
                <section className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
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
                              <div className="w-8 h-8 flex items-center justify-center text-red-600"><Public className="w-6 h-6" /></div>
                              <div>
                                <p className="text-sm font-bold">{citation.name}</p>
                                <p className="text-xs text-slate-500">{t('seo.lastUpdate')} {citation.lastUpdate}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-6">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${citation.status === 'matched' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
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
                            No citations found. Sync your listings to discover citations.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </section>
              </div>
            )}

            {/* Grid Section */}
            {activeSection === 'grid' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold">{t('reports.localSearchGrid')}</h1>
                  <button className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50">
                    {t('reports.reportSettings')}
                  </button>
                </div>
                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                  <div className="flex gap-3 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        <Search className="w-3 h-3 inline mr-1" />{t('reports.keywordQuery')}
                      </label>
                      <input type="text" value={gridKeyword} onChange={e => setGridKeyword(e.target.value)}
                        placeholder={t('reports.keywordPlaceholder')}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:ring-primary/20"
                        onKeyDown={e => e.key === 'Enter' && businessInfo?.lat && handleCreateReport()}
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <button onClick={handleCreateReport} disabled={gridLoading || !gridKeyword.trim() || !businessInfo?.lat}
                        className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded-lg">
                        {gridLoading ? <><Refresh className="w-4 h-4 animate-spin" />{t('reports.scanning')}</> : <><Search className="w-4 h-4" />{t('reports.createReport')}</>}
                      </button>
                    </div>
                  </div>
                  {(!businessInfo?.lat || !businessInfo?.lng) && (
                    <p className="mt-2 text-xs text-amber-600">{t('reports.noCoords')}</p>
                  )}
                </div>
                {gridError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{gridError}</div>
                )}
                {gridResult && !gridLoading && (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white rounded-xl p-5 border border-slate-200">
                        <div className="text-xs text-slate-400 font-semibold mb-1">{t('reports.avgRank')}</div>
                        <div className="text-2xl font-extrabold text-primary">{gridResult.summary.averageRank ?? '20+'}</div>
                        <div className="text-[10px] text-slate-400 mt-1">{t('reports.across')} {gridResult.summary.totalPoints} pts</div>
                      </div>
                      <div className="bg-white rounded-xl p-5 border border-slate-200">
                        <div className="text-xs text-slate-400 font-semibold mb-1">{t('reports.top3Positions')}</div>
                        <div className="text-2xl font-extrabold text-green-600">{gridResult.summary.top3Percent}%</div>
                        <div className="text-[10px] text-slate-400 mt-1">{t('reports.ofAllPoints')}</div>
                      </div>
                      <div className="bg-white rounded-xl p-5 border border-slate-200">
                        <div className="text-xs text-slate-400 font-semibold mb-1">{t('reports.top10Positions')}</div>
                        <div className="text-2xl font-extrabold text-blue-600">{gridResult.summary.top10Percent}%</div>
                        <div className="text-[10px] text-slate-400 mt-1">{t('reports.ofAllPoints')}</div>
                      </div>
                      <div className="bg-white rounded-xl p-5 border border-slate-200">
                        <div className="text-xs text-slate-400 font-semibold mb-1">{t('reports.pointsScanned')}</div>
                        <div className="text-2xl font-extrabold text-slate-700">{gridResult.summary.pointsWithData}</div>
                        <div className="text-[10px] text-slate-400 mt-1">{t('reports.across')} {gridResult.summary.totalPoints} pts</div>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-6 border border-slate-200">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-base font-bold">{t('reports.searchGridMap')}</h3>
                          <p className="text-xs text-slate-400">"{gridResult.keyword}" — {gridResult.gridSize} pts around {businessInfo?.name}</p>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500" /> Rank 1-3</span>
                          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-400" /> Rank 4-10</span>
                          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-400" /> Rank 11+</span>
                        </div>
                      </div>
                      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
                        <MapContainer center={[businessInfo!.lat!, businessInfo!.lng!]} zoom={14} style={{ height: '400px', width: '100%' }} zoomControl={true}>
                          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                          {gridResult.points.map((point) => (
                            <CircleMarker key={point.idx} center={[point.lat, point.lng]} radius={point.businessRank === null ? 10 : 14}
                              pathOptions={{ color: getRankColor(point.businessRank), fillColor: getRankColor(point.businessRank), fillOpacity: 0.7, weight: 2 }}
                              eventHandlers={{ click: () => setSelectedPoint(point) }}>
                              <Tooltip permanent={false} direction="top">#{point.businessRank ?? '?'}</Tooltip>
                            </CircleMarker>
                          ))}
                          <CircleMarker center={[businessInfo!.lat!, businessInfo!.lng!]} radius={10}
                            pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 1, weight: 3 }}>
                            <Tooltip permanent direction="bottom">{businessInfo?.name}</Tooltip>
                          </CircleMarker>
                          {selectedPoint && <MapController center={[selectedPoint.lat, selectedPoint.lng]} zoom={15} />}
                        </MapContainer>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                      <div className="px-6 py-4 border-b border-slate-100">
                        <h3 className="text-base font-bold">{t('reports.allGridPoints')}</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                              <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Point</th>
                              <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">{t('reports.yourRank')}</th>
                              <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Results</th>
                              <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">{t('reports.topCompetitor')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {gridResult.points.map((point) => (
                              <tr key={point.idx} onClick={() => setSelectedPoint(point)}
                                className={`hover:bg-slate-50 cursor-pointer ${selectedPoint?.idx === point.idx ? 'bg-blue-50' : ''}`}>
                                <td className="px-6 py-4">
                                  <span className="text-sm font-semibold text-slate-700">Point #{point.idx + 1}</span>
                                </td>
                                <td className="px-6 py-4">
                                  {point.businessRank !== null ? (
                                    <span className={`px-2 py-1 rounded text-sm font-bold ${
                                      point.businessRank <= 3 ? 'bg-green-100 text-green-700' :
                                      point.businessRank <= 10 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                    }`}>#{point.businessRank}</span>
                                  ) : (
                                    <span className="text-slate-400 text-sm">{t('reports.notRanked')}</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">{point.totalResults}</td>
                                <td className="px-6 py-4 text-sm text-slate-600">
                                  {point.competitors[0]?.name || '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Optimization Section */}
            {activeSection === 'optimization' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                      <AutoAwesome className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{t('reports.seoOptimization')}</h2>
                      <p className="text-sm text-slate-500">{businessInfo?.name}</p>
                    </div>
                  </div>
                  <button onClick={generateSeoReport} disabled={seoLoading}
                    className={`flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-xl ${
                      seoReport ? 'bg-white border-2 border-purple-600 text-purple-600' : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                    } disabled:opacity-50`}>
                    {seoLoading ? <><Refresh className="w-4 h-4 animate-spin" />Analyzing...</> :
                     seoReport ? <><Refresh className="w-4 h-4" />Regenerate</> :
                     <><AutoAwesome className="w-4 h-4" />{t('reports.generateReport')}</>}
                  </button>
                </div>
                {seoError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                    <ErrorIcon className="w-5 h-5 inline mr-2" />{seoError}
                  </div>
                )}
                {seoReport && !seoLoading && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className={`rounded-2xl p-6 border ${getScoreColor(seoReport.overallScore).border} ${getScoreColor(seoReport.overallScore).bg}`}>
                      <div className="flex items-center gap-2 mb-4">
                        <Speed className="w-5 h-5" style={{ color: getScoreColor(seoReport.overallScore).color }} />
                        <h4 className="font-bold">SEO Health Score</h4>
                        <span className="ml-auto text-xs font-bold px-2 py-1 rounded-full" style={{ backgroundColor: `${getScoreColor(seoReport.overallScore).color}20`, color: getScoreColor(seoReport.overallScore).color }}>
                          {getScoreColor(seoReport.overallScore).label}
                        </span>
                      </div>
                      <div className="flex justify-center mb-4">
                        <div className="relative w-24 h-24">
                          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                            <circle cx="60" cy="60" r="50" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                            <circle cx="60" cy="60" r="50" fill="none" stroke={getScoreColor(seoReport.overallScore).color} strokeWidth="10"
                              strokeLinecap="round" strokeDasharray={`${(seoReport.overallScore / 100) * 314} 314`} />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-extrabold" style={{ color: getScoreColor(seoReport.overallScore).color }}>{seoReport.overallScore}</span>
                            <span className="text-xs text-slate-400">/ 100</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 text-center">{seoReport.overallSummary}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 md:col-span-2">
                      <div className="flex items-center gap-2 mb-4">
                        <LocalFireDepartment className="w-5 h-5 text-orange-500" />
                        <h4 className="font-bold">Quick Wins</h4>
                        <span className="ml-auto bg-orange-100 text-orange-600 text-xs font-bold px-2 py-0.5 rounded-full">{seoReport.quickWins?.length || 0} items</span>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-auto">
                        {(seoReport.quickWins || []).map((win: any, i: number) => (
                          <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                            <div className="w-6 h-6 rounded-full bg-white border-2 border-orange-400 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-orange-500">{i+1}</span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-700">{win.action}</p>
                              <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${win.impact === 'high' ? 'bg-red-100 text-red-600' : win.impact === 'medium' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>{win.impact}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {!seoReport && !seoLoading && (
                  <div className="bg-gradient-to-br from-slate-50 to-purple-50/30 rounded-2xl p-12 border border-slate-200 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center mx-auto mb-4">
                      <AutoAwesome className="w-8 h-8 text-purple-500" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-800 mb-2">Generate Your SEO Optimization Report</h4>
                    <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">Click the button above to analyze your business listings with AI.</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ========== REAL COMMENT SECTION ========== */}
        {activeCategory === 'realComment' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">{t('seo.section.realComment')}</h1>
                <p className="text-sm text-slate-500 mt-1">{t('seo.section.realCommentDesc')}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                  <AccountCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-semibold text-green-700">{googleAccounts.filter(a => a.connected).length} {t('realComment.accountsConnected')}</span>
                </div>
              </div>
            </div>

            {/* Connected Accounts */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">{t('realComment.connectedAccounts')}</h2>
                <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90">
                  <Add className="w-4 h-4" />
                  {t('realComment.connectNew')}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {googleAccounts.map((account) => (
                  <div key={account.id} className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      {account.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-900 truncate">{account.name}</p>
                      <p className="text-xs text-slate-500 truncate">{account.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      <button className="text-xs text-red-500 hover:text-red-700 font-semibold">{t('realComment.disconnect')}</button>
                    </div>
                  </div>
                ))}
                {googleAccounts.length === 0 && (
                  <div className="col-span-full text-center py-8">
                    <AccountCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">{t('realComment.noAccounts')}</p>
                    <p className="text-xs text-slate-400 mt-1">{t('realComment.noAccountsDesc')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Review Creator */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-bold mb-4">{t('realComment.writeReview')}</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  {/* Account Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">{t('realComment.selectAccount')}</label>
                    <select value={selectedAccount} onChange={(e) => setSelectedAccount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-sm">
                      <option value="">-- Select Account --</option>
                      {googleAccounts.filter(a => a.connected).map((account) => (
                        <option key={account.id} value={account.id}>{account.name} ({account.email})</option>
                      ))}
                    </select>
                  </div>

                  {/* Location Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">{t('realComment.selectLocation')}</label>
                    <select value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-sm">
                      <option value="all">{t('realComment.allLocations')}</option>
                      <option value="location1">{businessInfo?.name || 'Location 1'}</option>
                    </select>
                  </div>

                  {/* Rating */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">{t('realComment.rating')}</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} onClick={() => setReviewRating(star)}
                          className="p-1 hover:scale-110 transition-transform">
                          <Star className={`w-8 h-8 ${star <= reviewRating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                        </button>
                      ))}
                      <span className="ml-2 text-sm text-slate-600">{reviewRating} / 5</span>
                    </div>
                  </div>

                  {/* AI Generate Button */}
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-100">
                    <div className="flex items-center gap-2 mb-2">
                      <AutoAwesome className="w-5 h-5 text-orange-500" />
                      <span className="font-bold text-sm text-orange-700">{t('realComment.aiGenerate')}</span>
                    </div>
                    <p className="text-xs text-slate-600 mb-3">{t('realComment.aiTip')}</p>
                    <button
                      onClick={handleGenerateAIReview}
                      disabled={aiGeneratingReview || !selectedAccount}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-2.5 px-4 rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all disabled:opacity-50"
                    >
                      {aiGeneratingReview ? (
                        <><Refresh className="w-4 h-4 animate-spin" />{t('realComment.aiGenerating')}</>
                      ) : (
                        <><AutoAwesome className="w-4 h-4" />{t('realComment.aiGenerate')}</>
                      )}
                    </button>
                  </div>

                  {currentPersona && (
                    <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                      <p className="text-xs text-purple-600 font-semibold">{t('realComment.identityLabel')} <span className="font-bold">{currentPersona.name}</span></p>
                    </div>
                  )}
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* Review Content */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">{t('realComment.reviewContent')}</label>
                    <textarea
                      value={reviewContent}
                      onChange={(e) => setReviewContent(e.target.value)}
                      placeholder={t('realComment.reviewPlaceholder')}
                      rows={6}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 text-sm resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>

                  {/* Photos */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-slate-700">{t('realComment.photoGallery')}</label>
                      <button onClick={() => handleAddPhoto(setReviewPhotos)} className="text-xs text-primary font-semibold hover:underline">
                        + {t('realComment.addPhoto')}
                      </button>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {reviewPhotos.map((photo, index) => (
                        <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden">
                          <img src={photo} alt="" className="w-full h-full object-cover" />
                          <button onClick={() => handleRemovePhoto(index, reviewPhotos, setReviewPhotos)}
                            className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
                            ×
                          </button>
                        </div>
                      ))}
                      {reviewPhotos.length === 0 && (
                        <button onClick={() => handleAddPhoto(setReviewPhotos)}
                          className="w-20 h-20 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:border-primary hover:text-primary transition-colors">
                          <PhotoCamera className="w-6 h-6" />
                          <span className="text-[10px] mt-1">Add</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={handleSaveReview}
                    disabled={savingReview || !selectedAccount || !reviewContent.trim()}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50"
                  >
                    {savingReview ? <><Refresh className="w-4 h-4 animate-spin" />{t('realComment.saving')}</> : <><CheckCircle className="w-4 h-4" />{t('realComment.submitReview')}</>}
                  </button>
                </div>
              </div>
            </div>

            {/* Review History */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-bold mb-4">
                <History className="w-5 h-5 inline mr-2 text-slate-400" />
                {t('realComment.reviewHistory')}
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">{t('realComment.account')}</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">{t('realComment.location')}</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">{t('realComment.rating')}</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">{t('realComment.status')}</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">{t('realComment.date')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reviewHistory.map((task) => (
                      <tr key={task.id} className="hover:bg-slate-50">
                        <td className="px-4 py-4 text-sm text-slate-600">{task.accountEmail}</td>
                        <td className="px-4 py-4 text-sm text-slate-600">{task.location}</td>
                        <td className="px-4 py-4">
                          <div className="flex">
                            {[1,2,3,4,5].map(i => (
                              <Star key={i} className={`w-4 h-4 ${i <= task.rating ? 'text-amber-400' : 'text-slate-300'}`} />
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            task.status === 'published' ? 'bg-green-100 text-green-700' :
                            task.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {task.status === 'published' ? t('realComment.published') : task.status === 'pending' ? t('realComment.pending') : t('realComment.failed')}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-500">{new Date(task.date).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {reviewHistory.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                          <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                          {t('realComment.noReviewHistory')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========== REDNOTE SEO SECTION ========== */}
        {activeCategory === 'rednoteSeo' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">{t('seo.section.rednoteSeo')}</h1>
                <p className="text-sm text-slate-500 mt-1">{t('seo.section.rednoteSeoDesc')}</p>
              </div>
              <button
                onClick={() => setRednoteConnected(!rednoteConnected)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold ${
                  rednoteConnected ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-pink-100 text-pink-700 border border-pink-200'
                }`}
              >
                {rednoteConnected ? (
                  <><CheckCircle className="w-4 h-4" />{t('rednote.connected')}</>
                ) : (
                  <><Add className="w-4 h-4" />{t('rednote.connectAccount')}</>
                )}
              </button>
            </div>

            {/* Connection Card */}
            {!rednoteConnected && (
              <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl border border-pink-100 p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-4">
                  <Article className="w-8 h-8 text-pink-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">{t('rednote.noAccount')}</h3>
                <p className="text-sm text-slate-500 mb-4">{t('rednote.noAccountDesc')}</p>
                <button onClick={() => setRednoteConnected(true)} className="bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-2.5 px-6 rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all">
                  {t('rednote.connectAccount')}
                </button>
              </div>
            )}

            {rednoteConnected && (
              <>
                {/* Post Creator */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h2 className="text-lg font-bold mb-4">{t('rednote.createPost')}</h2>

                  {/* AI Generate Section */}
                  <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 border border-pink-100 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <AutoAwesome className="w-5 h-5 text-pink-500" />
                      <span className="font-bold text-sm text-pink-700">{t('rednote.aiGeneratePost')}</span>
                    </div>
                    <p className="text-xs text-slate-600 mb-3">{t('rednote.aiTip')}</p>
                    <button
                      onClick={handleGenerateRednotePost}
                      disabled={aiGeneratingPost}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-2.5 px-4 rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all disabled:opacity-50"
                    >
                      {aiGeneratingPost ? (
                        <><Refresh className="w-4 h-4 animate-spin" />{t('rednote.aiGenerating')}</>
                      ) : (
                        <><AutoAwesome className="w-4 h-4" />{t('rednote.aiGeneratePost')}</>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                      {/* Title */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">{t('rednote.postTitle')}</label>
                        <input
                          type="text"
                          value={rednoteTitle}
                          onChange={(e) => setRednoteTitle(e.target.value)}
                          placeholder={t('rednote.postTitlePlaceholder')}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
                        />
                      </div>

                      {/* Location */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">{t('rednote.selectLocation')}</label>
                        <select value={rednoteSelectedLocation} onChange={(e) => setRednoteSelectedLocation(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-sm">
                          <option value="all">{t('realComment.allLocations')}</option>
                          <option value="location1">{businessInfo?.name || 'Location 1'}</option>
                        </select>
                      </div>

                      {/* Tags */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">{t('rednote.postTags')}</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {rednoteTags.map((tag, index) => (
                            <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-semibold">
                              #{tag}
                              <button onClick={() => setRednoteTags(tags => tags.filter((_, i) => i !== index))} className="hover:text-pink-900">×</button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={rednoteTagInput}
                            onChange={(e) => setRednoteTagInput(e.target.value)}
                            placeholder={t('rednote.postTagsPlaceholder')}
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && rednoteTagInput.trim()) {
                                setRednoteTags(tags => [...tags, rednoteTagInput.trim()]);
                                setRednoteTagInput('');
                              }
                            }}
                          />
                          <button onClick={() => { if (rednoteTagInput.trim()) { setRednoteTags(tags => [...tags, rednoteTagInput.trim()]); setRednoteTagInput(''); } }}
                            className="px-3 py-2 bg-pink-100 text-pink-700 rounded-lg text-sm font-semibold hover:bg-pink-200">
                            {t('rednote.addTag')}
                          </button>
                        </div>
                      </div>

                      {/* Photos */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-semibold text-slate-700">{t('rednote.photos')}</label>
                          <button onClick={() => handleAddPhoto(setRednotePhotos)} className="text-xs text-primary font-semibold hover:underline">
                            + {t('rednote.addPhoto')}
                          </button>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {rednotePhotos.map((photo, index) => (
                            <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden">
                              <img src={photo} alt="" className="w-full h-full object-cover" />
                              <button onClick={() => handleRemovePhoto(index, rednotePhotos, setRednotePhotos)}
                                className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">×</button>
                            </div>
                          ))}
                          {rednotePhotos.length === 0 && (
                            <button onClick={() => handleAddPhoto(setRednotePhotos)}
                              className="w-20 h-20 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:border-pink-400 hover:text-pink-500 transition-colors">
                              <Image className="w-6 h-6" />
                              <span className="text-[10px] mt-1">Add</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Content */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">{t('rednote.postContent')}</label>
                        <textarea
                          value={rednoteContent}
                          onChange={(e) => setRednoteContent(e.target.value)}
                          placeholder={t('rednote.postContentPlaceholder')}
                          rows={10}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 text-sm resize-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleSaveRednotePost(false)}
                          disabled={savingPost || !rednoteTitle.trim() || !rednoteContent.trim()}
                          className="flex-1 flex items-center justify-center gap-2 bg-slate-100 text-slate-700 font-bold py-2.5 px-4 rounded-lg hover:bg-slate-200 transition-all disabled:opacity-50"
                        >
                          <CheckCircle className="w-4 h-4" />
                          {t('rednote.saveDraft')}
                        </button>
                        <button
                          onClick={() => handleSaveRednotePost(true)}
                          disabled={savingPost || !rednoteTitle.trim() || !rednoteContent.trim()}
                          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-2.5 px-4 rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all disabled:opacity-50"
                        >
                          {savingPost ? <><Refresh className="w-4 h-4 animate-spin" />{t('rednote.saving')}</> : <><Send className="w-4 h-4" />{t('rednote.publishNow')}</>}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Post History */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h2 className="text-lg font-bold mb-4">
                    <History className="w-5 h-5 inline mr-2 text-slate-400" />
                    {t('rednote.postHistory')}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {postHistory.map((post) => (
                      <div key={post.id} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-bold text-sm text-slate-900 line-clamp-1">{post.title}</h3>
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold shrink-0 ml-2 ${
                            post.status === 'published' ? 'bg-green-100 text-green-700' :
                            post.status === 'scheduled' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {post.status === 'published' ? t('rednote.posted') : post.status === 'scheduled' ? t('rednote.scheduled') : t('rednote.draft')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-3 mb-2">{post.content}</p>
                        <div className="flex flex-wrap gap-1">
                          {post.tags.slice(0, 3).map((tag, i) => (
                            <span key={i} className="text-[10px] px-1.5 py-0.5 bg-pink-50 text-pink-600 rounded">#{tag}</span>
                          ))}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2">{new Date(post.date).toLocaleDateString()}</p>
                      </div>
                    ))}
                    {postHistory.length === 0 && (
                      <div className="col-span-full text-center py-8">
                        <Article className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">{t('rednote.noPostHistory')}</p>
                        <p className="text-xs text-slate-400 mt-1">{t('rednote.noPostHistoryDesc')}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
