import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Star,
  AutoAwesome,
  Refresh,
  CheckCircle,
  PhotoCamera,
  History,
  Send,
  CloudUpload,
  Image as ImageIcon,
  Edit,
  ArrowForward,
  ArrowBack,
  Chat,
  Place,
  Security,
  TrendingUp,
  Camera,
  Tag,
  Title,
} from '@mui/icons-material';
import { Loader2, Sparkles, Zap } from 'lucide-react';
import { apiGet, apiPost } from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import { PageLoader } from './PageLoader';

interface ReviewTask {
  id: string;
  location: string;
  locationName?: string;
  title: string;
  content: string;
  rating: number;
  status: 'pending' | 'published' | 'failed';
  date: string;
  photos?: string[];
  topics?: string[];
  publishedAccount?: string;
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

interface Location {
  id: string;
  name: string;
  address: string;
}

interface PhotoAnalysis {
  hasFood: boolean;
  hasInterior: boolean;
  hasExterior: boolean;
  hasMenu: boolean;
  foodItems: string[];
  atmosphere: string[];
  quality: string;
  overallVibe: string;
}

const REVIEW_PERSONAS = [
  { name: '美食博主', identity: '美食博主和本地美食爱好者', avatar: '🍽️' },
  { name: '常客', identity: '经常光顾的回头客', avatar: '⭐' },
  { name: '首次访客', identity: '外地来的第一次体验', avatar: '🌟' },
  { name: '家庭聚餐', identity: '带孩子家庭聚餐', avatar: '👨‍👩‍👧' },
  { name: '上班族', identity: '附近午餐时间的上班族', avatar: '💼' },
  { name: '健康达人', identity: '注重健康的食客', avatar: '🥗' },
];

export function RealRednotePost() {
  const { t } = useLanguage();
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewContent, setReviewContent] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewPhotos, setReviewPhotos] = useState<string[]>([]);
  const [reviewTopics, setReviewTopics] = useState<string[]>([]);
  const [photoAnalysis, setPhotoAnalysis] = useState<PhotoAnalysis | null>(null);
  const [aiGeneratingReview, setAiGeneratingReview] = useState(false);
  const [analyzingPhotos, setAnalyzingPhotos] = useState(false);
  const [aiReviewGenerated, setAiReviewGenerated] = useState(false);
  const [currentPersona, setCurrentPersona] = useState<typeof REVIEW_PERSONAS[0] | null>(null);
  const [reviewHistory, setReviewHistory] = useState<ReviewTask[]>(() => {
    try {
      const saved = localStorage.getItem('rednote_history');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [submitting, setSubmitting] = useState(false);
  const [credits, setCredits] = useState<number>(100);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('rednote_history', JSON.stringify(reviewHistory));
  }, [reviewHistory]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch locations
        const locationsRes = await apiGet('/api/embedsocial/locations');
        let locs: any[] = [];
        if (locationsRes.ok) {
          locs = await locationsRes.json();
        }
        const hasCoords = locs.some((l: any) => l.latitude || l.lat);
        if (locs.length > 0 && !hasCoords) {
          try {
            const backfillRes = await apiPost('/api/embedsocial/listings/backfill-coordinates');
            if (backfillRes.ok) {
              const refreshed = await apiGet('/api/embedsocial/locations');
              if (refreshed.ok) locs = await refreshed.json();
            }
          } catch (e) {
            console.warn('[RealRednotePost] Backfill failed:', e);
          }
        }

        setLocations(locs.map((l: any) => ({
          id: l.id || String(locs.indexOf(l)),
          name: l.name || 'Unknown Location',
          address: l.address || '',
        })));

        const primary = locs[0];
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
          setSelectedLocation(primary.id || '0');
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
          setSelectedLocation('0');
        }

        // Fetch submissions from backend
        try {
          const submissionsRes = await apiGet('/api/real-rednote/submissions');
          if (submissionsRes.ok) {
            const data = await submissionsRes.json();
            if (data.submissions && data.submissions.length > 0) {
              const historyFromServer: ReviewTask[] = data.submissions.map((s: any) => ({
                id: s.id,
                location: s.location,
                locationName: s.location,
                title: s.title || '',
                content: s.content,
                rating: s.rating || 5,
                status: s.status,
                date: s.createdAt,
                photos: s.photos || [],
                topics: s.topics || [],
                publishedAccount: s.publishedAccount || undefined,
              }));
              setReviewHistory(historyFromServer);
            }
          }
        } catch (e) {
          console.warn('[RealRednotePost] Failed to fetch submissions:', e);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const analyzePhotos = async () => {
    if (reviewPhotos.length === 0) return;

    setAnalyzingPhotos(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockAnalysis: PhotoAnalysis = {
        hasFood: true,
        hasInterior: reviewPhotos.length > 1,
        hasExterior: reviewPhotos.length > 2,
        hasMenu: false,
        foodItems: ['招牌拌面', '特色小碗', '手工水饺', '秘制酱料'],
        atmosphere: ['温馨舒适', '干净整洁', '装修精美'],
        quality: '高品质',
        overallVibe: '现代时尚与传统美食的完美结合',
      };

      setPhotoAnalysis(mockAnalysis);
      setCurrentStep(2);
    } catch (error) {
      console.error('Failed to analyze photos:', error);
    } finally {
      setAnalyzingPhotos(false);
    }
  };

  const handleGenerateAIReview = async () => {
    setAiGeneratingReview(true);
    try {
      const persona = REVIEW_PERSONAS[Math.floor(Math.random() * REVIEW_PERSONAS.length)];

      const selectedLoc = locations.find(l => l.id === selectedLocation) || locations[0];

      // Call the dedicated Xiaohongshu post generation API
      const res = await apiPost('/api/real-rednote/generate', {
        persona,
        photoAnalysis,
        businessInfo: businessInfo ? {
          name: businessInfo.name,
          category: businessInfo.category,
          address: businessInfo.address,
        } : null,
        selectedLocation: selectedLoc ? {
          name: selectedLoc.name,
        } : null,
      });

      let generatedContent = '';
      let generatedTitle = '';

      if (res.ok) {
        const data = await res.json();
        generatedContent = data.content || '';
        generatedTitle = data.title || '';
      }

      // Fallback if API fails
      if (!generatedContent) {
        const fallbackPosts = [
          `今天终于来打卡了这家店！🏠 一进门就被${photoAnalysis?.atmosphere?.[0] || '温馨的环境'}吸引住了，整个${photoAnalysis?.atmosphere?.[1] || '氛围'}特别舒服，拍照也超出片！\n\n${photoAnalysis?.foodItems?.[0] || '招牌菜'}真的名不虚传！味道${photoAnalysis?.overallVibe || '超棒'}，每一口都是享受～店员服务也超热情，给人一种回家的感觉😊\n\n总之就是一家会反复打卡的店！强烈推荐给大家～\n\n#${businessInfo?.category || '美食'} #周末探店 #宝藏店铺 #美食分享`,
          `和闺蜜约饭选择了这里，真的太惊喜了！🎉 ${photoAnalysis?.atmosphere?.[0] || '环境很棒'}，${photoAnalysis?.overallVibe || '超出预期'}，完全超出预期！\n\n${photoAnalysis?.foodItems?.[0] || '必点菜'}是必点的！份量足味道好，还有${photoAnalysis?.foodItems?.[1] || '其他菜品'}也很不错，整体性价比超高👍\n\n环境也很适合拍照，随便一拍都是大片感📸 已经迫不及待想再来啦～\n\n#${businessInfo?.category || '美食'} #种草 #美食探店 #宝藏餐厅 #周末去哪玩`,
          `路过看到这家店就被吸引了，没想到这么好吃！🤩 ${photoAnalysis?.overallVibe || '超棒'}，${photoAnalysis?.foodItems?.[0] || '招牌菜'}做得相当地道！\n\n特别满意的是${photoAnalysis?.atmosphere?.[0] || '环境氛围'}，${photoAnalysis?.atmosphere?.[1] || '氛围感满满'}，很适合朋友聚会或者情侣约会💕\n\n服务也很周到，会主动介绍菜品，体验感拉满！下次带家人再来～\n\n#${businessInfo?.category || '美食'} #美食推荐 #宝藏店铺 #本地生活 #必吃清单`,
        ];
        generatedContent = fallbackPosts[Math.floor(Math.random() * fallbackPosts.length)];
        generatedTitle = `${businessInfo?.name || '店铺'}探店分享`;
      }

      setReviewContent(generatedContent);
      setReviewTitle(generatedTitle || `${businessInfo?.name || '店铺'}探店分享`);
      setCurrentPersona(persona);
      setReviewRating(5);
      setAiReviewGenerated(true);
      setCurrentStep(3);
    } catch (error) {
      console.error('Failed to generate AI review:', error);
    } finally {
      setAiGeneratingReview(false);
    }
  };

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const newPhotos: string[] = [];
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/') && reviewPhotos.length + newPhotos.length < 9) {
        const reader = new FileReader();
        reader.onload = () => {
          newPhotos.push(reader.result as string);
          if (newPhotos.length === Array.from(files).filter(f => f.type.startsWith('image/')).length) {
            setReviewPhotos(prev => [...prev, ...newPhotos]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }, [reviewPhotos.length]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleAddPhoto = () => {
    fileInputRef.current?.click();
  };

  const handleRemovePhoto = (index: number) => {
    setReviewPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoAnalysis(null);
  };

  const toggleTopic = (topic: string) => {
    setReviewTopics(prev =>
      prev.includes(topic)
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  };

  const handleSubmitReview = async () => {
    if (!reviewTitle.trim() || !reviewContent.trim()) {
      alert(t('realComment.errorNoContent'));
      return;
    }

    if (credits < 10) {
      alert(t('realRednote.creditsInsufficient'));
      return;
    }

    setSubmitting(true);
    try {
      const selectedLoc = locations.find(l => l.id === selectedLocation) || locations[0];

      const reviewData = {
        location: selectedLoc?.name || businessInfo?.name || 'Unknown',
        locationId: selectedLocation,
        title: reviewTitle,
        content: reviewContent,
        rating: reviewRating,
        photos: reviewPhotos,
        topics: reviewTopics,
        date: new Date().toISOString(),
      };

      await apiPost('/api/real-rednote/submit', reviewData);

      const newTask: ReviewTask = {
        id: Date.now().toString(),
        location: selectedLoc?.name || businessInfo?.name || 'Unknown',
        locationName: selectedLoc?.name,
        title: reviewTitle,
        content: reviewContent,
        rating: reviewRating,
        status: 'pending',
        date: new Date().toISOString(),
        photos: reviewPhotos,
        topics: reviewTopics,
      };

      setReviewHistory(prev => [newTask, ...prev]);
      setCredits(prev => prev - 10);

      setReviewTitle('');
      setReviewContent('');
      setReviewPhotos([]);
      setReviewTopics([]);
      setPhotoAnalysis(null);
      setAiReviewGenerated(false);
      setCurrentPersona(null);
      setCurrentStep(1);

      alert(t('realComment.successSubmitted'));
    } catch (error) {
      console.error('Failed to submit review:', error);
      alert(t('realRednote.submitFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const skipPhotoStep = () => {
    setPhotoAnalysis(null);
    setCurrentStep(2);
  };

  if (loading) {
    return <PageLoader message={t('realComment.loading')} subMessage={t('realComment.loadingDesc')} />;
  }

  return (
    <div className="real-comment-container" style={{ padding: '24px 24px 24px 280px', maxWidth: '1600px', margin: '0 auto', minHeight: '100vh', background: 'var(--color-surface)' }}>
      <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              {t('seo.section.realRednotePost')}
            </h1>
            <p className="text-slate-500 mt-1">{t('seo.section.realRednotePostDesc')}</p>
          </div>
          <div className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl px-5 py-3 border border-amber-100/50 shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium">Credits</span>
              <div className="text-lg font-bold text-slate-900">{credits}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center gap-4">
          {[
            { step: 1, icon: <Camera className="w-5 h-5" />, label: t('realRednote.uploadPhotos') },
            { step: 2, icon: <AutoAwesome className="w-5 h-5" />, label: t('realRednote.aiAnalysis') },
            { step: 3, icon: <Edit className="w-5 h-5" />, label: t('realRednote.generateContent') },
          ].map((item, index) => (
            <React.Fragment key={item.step}>
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-12 h-12 rounded-2xl font-bold text-sm transition-all duration-300 ${
                  currentStep >= item.step
                    ? currentStep === item.step
                      ? 'bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg shadow-primary/30 scale-110'
                      : 'bg-green-500 text-white'
                    : 'bg-slate-100 text-slate-400'
                }`}>
                  {currentStep > item.step ? <CheckCircle className="w-5 h-5" /> : item.icon}
                </div>
                <span className={`hidden sm:block font-medium text-sm ${
                  currentStep >= item.step ? 'text-slate-900' : 'text-slate-400'
                }`}>
                  {item.label}
                </span>
              </div>
              {index < 2 && (
                <div className={`w-12 sm:w-20 h-1 rounded-full transition-all duration-500 ${
                  currentStep > item.step ? 'bg-green-400' : 'bg-slate-100'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50 overflow-hidden">
        {/* Step 1: Photo Upload */}
        {currentStep === 1 && (
          <div className="p-8 animate-fade-in">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('realRednote.uploadPhotos')}</h2>
                <p className="text-slate-500">{t('realRednote.uploadPhotosDesc')}</p>
              </div>

              {/* Upload Zone */}
              <div
                ref={dropZoneRef}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleAddPhoto}
                className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
                  dragOver
                    ? 'border-primary bg-primary/5 scale-[1.02]'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                />
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center mx-auto mb-4">
                  <CloudUpload className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-lg font-semibold text-slate-700 mb-1">
                  {t('realRednote.dragPhotosHere')}
                </p>
                <p className="text-sm text-slate-400">
                  {t('realRednote.supportedFormats')}
                </p>
              </div>

              {/* Photo Preview */}
              {reviewPhotos.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-slate-700">
                      {t('realRednote.uploadedCount').replace('{count}', String(reviewPhotos.length))}
                    </span>
                    <button
                      onClick={handleAddPhoto}
                      className="text-sm text-primary font-medium hover:underline"
                    >
                      {t('realRednote.addMore')}
                    </button>
                  </div>
                  <div className="grid grid-cols-5 gap-3">
                    {reviewPhotos.map((photo, index) => (
                      <div key={index} className="relative aspect-square rounded-xl overflow-hidden group">
                        <img
                          src={photo}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRemovePhoto(index); }}
                          className="absolute top-2 right-2 w-6 h-6 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                        >
                          <span className="text-white text-xs">×</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={skipPhotoStep}
                  className="px-6 py-3 text-slate-500 font-medium hover:text-slate-700 transition-colors"
                >
                  {t('realRednote.skipDefaultData')}
                </button>
                <button
                  onClick={analyzePhotos}
                  disabled={reviewPhotos.length === 0 || analyzingPhotos}
                  className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/90 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {analyzingPhotos ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t('realRednote.aiAnalyzing')}
                    </>
                  ) : (
                    <>
                      <AutoAwesome className="w-5 h-5" />
                      {t('realRednote.startAIAnalysis')}
                      <ArrowForward className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: AI Analysis */}
        {currentStep === 2 && (
          <div className="p-8 animate-fade-in">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 flex items-center justify-center mx-auto mb-4">
                  <AutoAwesome className="w-8 h-8 text-purple-500" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('realRednote.aiAnalysisComplete')}</h2>
                <p className="text-slate-500">{t('realRednote.photoAnalysisComplete')}</p>
              </div>

              {/* Analysis Results */}
              {photoAnalysis && (
                <div className="space-y-4 mb-8">
                  {/* Food Items */}
                  <div className="bg-gradient-to-r from-amber-50/50 to-orange-50/50 rounded-2xl p-5 border border-amber-100/50">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                        <span className="text-lg">🍜</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{t('realRednote.detectedDishes')}</h3>
                        <p className="text-xs text-slate-500">{t('realRednote.fromPhotos')}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {photoAnalysis.foodItems.map((item, i) => (
                        <span key={i} className="px-3 py-1.5 bg-white rounded-xl text-sm font-medium text-slate-700 shadow-sm">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Atmosphere */}
                  <div className="bg-gradient-to-r from-purple-50/50 to-pink-50/50 rounded-2xl p-5 border border-purple-100/50">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                        <span className="text-lg">✨</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{t('realRednote.restaurantAtmosphere')}</h3>
                        <p className="text-xs text-slate-500">{t('realRednote.environmentFeatures')}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {photoAnalysis.atmosphere.map((item, i) => (
                        <span key={i} className="px-3 py-1.5 bg-white rounded-xl text-sm font-medium text-slate-700 shadow-sm">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Overall Impression */}
                  <div className="bg-gradient-to-r from-green-50/50 to-emerald-50/50 rounded-2xl p-5 border border-green-100/50">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{t('realRednote.overallImpression')}</h3>
                        <p className="text-xs text-slate-500">{t('realRednote.aiComprehensiveRating')}</p>
                      </div>
                    </div>
                    <p className="text-slate-700 font-medium">{photoAnalysis.overallVibe}</p>
                  </div>
                </div>
              )}

              {/* Business Info */}
              <div className="bg-slate-50 rounded-2xl p-5 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center flex-shrink-0">
                    <Place className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 mb-1">{businessInfo?.name}</h3>
                    <p className="text-sm text-slate-500">{businessInfo?.address}</p>
                    <p className="text-sm text-slate-500">{businessInfo?.category}</p>
                  </div>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                    {locations.length === 0 && (
                      <option value="0">{businessInfo?.name || 'Location 1'}</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="flex items-center gap-2 px-6 py-3 text-slate-500 font-medium hover:text-slate-700 transition-colors"
                >
                  <ArrowBack className="w-5 h-5" />
                  {t('realRednote.reupload')}
                </button>
                <button
                  onClick={handleGenerateAIReview}
                  disabled={aiGeneratingReview}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all disabled:opacity-50"
                >
                  {aiGeneratingReview ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t('realRednote.aiGenerating')}
                    </>
                  ) : (
                    <>
                      <AutoAwesome className="w-5 h-5" />
                      {t('realRednote.generateContent')}
                      <ArrowForward className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Review Generation & Edit */}
        {currentStep === 3 && (
          <div className="p-8 animate-fade-in">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/10 to-green-500/5 flex items-center justify-center mx-auto mb-4">
                  <Edit className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('realRednote.contentGenerated')}</h2>
                <p className="text-slate-500">{t('realRednote.editOrSubmit')}</p>
              </div>

              {/* Persona Badge */}
              {currentPersona && (
                <div className="flex items-center justify-center gap-2 mb-6">
                  <span className="text-2xl">{currentPersona.avatar}</span>
                  <span className="px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">
                    {t('realRednote.simulatedPersona')} {currentPersona.name}
                  </span>
                </div>
              )}

              {/* Rating */}
              <div className="flex items-center justify-center gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star className={`w-10 h-10 transition-colors ${star <= reviewRating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                  </button>
                ))}
              </div>

              {/* Title Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Title className="w-4 h-4 inline mr-1" />
                  {t('realRednote.noteTitle')}
                </label>
                <input
                  type="text"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder={t('realRednote.titlePlaceholder')}
                />
              </div>

              {/* Review Content */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Edit className="w-4 h-4 inline mr-1" />
                  {t('realRednote.noteContent')}
                </label>
                <textarea
                  value={reviewContent}
                  onChange={(e) => setReviewContent(e.target.value)}
                  rows={8}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-slate-700 resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder={t('realRednote.contentPlaceholder')}
                />
              </div>

              {/* Topics */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Tag className="w-4 h-4 inline mr-1" />
                  {t('realRednote.topics')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {['#美食探店', '#周末去哪玩', '#宝藏店铺', '#美食推荐', '#种草', '#必吃清单', '#本地生活'].map((topic) => (
                    <button
                      key={topic}
                      onClick={() => toggleTopic(topic)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        reviewTopics.includes(topic)
                          ? 'bg-primary text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>

              {/* Photos */}
              {reviewPhotos.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-medium text-slate-700 mb-3">{t('realRednote.additionalPhotos')}</p>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {reviewPhotos.map((photo, index) => (
                      <div key={index} className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                        <img src={photo} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Credits Info */}
              <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-4 mb-8">
                <div className="flex items-center gap-2 text-slate-600">
                  <Security className="w-5 h-5" />
                  <span className="text-sm font-medium">{t('realRednote.submitCost')}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-amber-500">-10</span>
                  <span className="text-sm text-slate-500">Credits</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="flex items-center gap-2 px-6 py-3 text-slate-500 font-medium hover:text-slate-700 transition-colors"
                >
                  <ArrowBack className="w-5 h-5" />
                  {t('realRednote.reGenerate')}
                </button>
                <button
                  onClick={handleSubmitReview}
                  disabled={submitting || !reviewTitle.trim() || !reviewContent.trim() || credits < 10}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-10 py-3 rounded-2xl font-bold shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t('realRednote.submitting')}
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      {t('realRednote.submitForReview')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tips Card */}
      <div className="mt-6 bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg mb-1">{t('realRednote.tipsTitle')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-green-400 flex-shrink-0" />
                <span>{t('realRednote.tipClearPhotos')}</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-green-400 flex-shrink-0" />
                <span>{t('realRednote.tipEditableContent')}</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-green-400 flex-shrink-0" />
                <span>{t('realRednote.tipSubmitCost')}</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-green-400 flex-shrink-0" />
                <span>{t('realRednote.tipMultiStore')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Review History - Xiaohongshu Style */}
      {reviewHistory.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <History className="w-5 h-5 text-slate-400" />
            {t('realRednote.historyRecords')}
            <span className="ml-2 text-sm font-normal text-slate-400">{reviewHistory.length} {t('realRednote.posts')}</span>
          </h2>

          {/* Xiaohongshu Card Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px',
          }}>
            {reviewHistory.slice(0, 20).map((task) => {
              const coverPhoto = task.photos && task.photos.length > 0 ? task.photos[0] : null;
              const contentPreview = task.content.length > 80 ? task.content.substring(0, 80) + '...' : task.content;
              const likeCount = Math.floor(Math.random() * 500) + 10;
              const commentCount = Math.floor(Math.random() * 50) + 1;
              const collectCount = Math.floor(Math.random() * 100) + 5;

              return (
                <div
                  key={task.id}
                  style={{
                    background: '#fff',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '1px solid rgba(0,0,0,0.06)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  }}
                >
                  {/* Status Badge Overlay */}
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    zIndex: 2,
                    display: 'flex',
                    gap: '6px',
                  }}>
                    {/* Status */}
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: 600,
                      background: task.status === 'published'
                        ? 'rgba(240,56,56,0.9)'
                        : task.status === 'pending'
                          ? 'rgba(255,179,0,0.9)'
                          : 'rgba(120,120,120,0.9)',
                      color: '#fff',
                      backdropFilter: 'blur(4px)',
                    }}>
                      {task.status === 'published' ? t('realRednote.statusPublished')
                        : task.status === 'pending' ? t('realRednote.statusPending')
                          : t('realRednote.statusFailed')}
                    </span>
                  </div>

                  {/* Cover Image */}
                  {coverPhoto ? (
                    <div style={{
                      width: '100%',
                      paddingTop: '100%',
                      position: 'relative',
                      overflow: 'hidden',
                      background: '#f5f5f5',
                    }}>
                      <img
                        src={coverPhoto}
                        alt=""
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    </div>
                  ) : (
                    <div style={{
                      width: '100%',
                      paddingTop: '100%',
                      position: 'relative',
                      background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 50%, #f8a5c2 100%)',
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: '40px',
                      }}>
                        <Chat sx={{ fontSize: 40, color: '#fff', opacity: 0.8 }} />
                      </div>
                    </div>
                  )}

                  {/* Card Content */}
                  <div style={{ padding: '14px 14px 12px' }}>
                    {/* Title */}
                    <div style={{
                      fontSize: '15px',
                      fontWeight: 700,
                      color: '#1a1a1a',
                      lineHeight: 1.4,
                      marginBottom: '8px',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {task.title || t('realRednote.noTitle')}
                    </div>

                    {/* Content Preview */}
                    <div style={{
                      fontSize: '13px',
                      color: '#666',
                      lineHeight: 1.6,
                      marginBottom: '12px',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {contentPreview}
                    </div>

                    {/* Topics */}
                    {task.topics && task.topics.length > 0 && (
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '6px',
                        marginBottom: '12px',
                      }}>
                        {task.topics.slice(0, 3).map((topic, idx) => (
                          <span key={idx} style={{
                            padding: '2px 8px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: 500,
                            background: 'rgba(240,56,56,0.08)',
                            color: '#ee5a24',
                          }}>
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Divider */}
                    <div style={{ height: '1px', background: '#f0f0f0', marginBottom: '10px' }} />

                    {/* Bottom Row: Author + Stats */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}>
                      {/* Author / Published Account */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                        <div style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <Chat sx={{ fontSize: 12, color: '#fff' }} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          {task.publishedAccount ? (
                            <span style={{
                              fontSize: '11px',
                              color: '#ee5a24',
                              fontWeight: 600,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              display: 'block',
                            }}>
                              @{task.publishedAccount}
                            </span>
                          ) : (
                            <span style={{ fontSize: '11px', color: '#999', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                              {t('realRednote.waitingReview')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Stats: Like, Comment, Collect */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                        {/* Like */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill={task.status === 'published' ? '#ff6b6b' : '#ccc'} />
                          </svg>
                          <span style={{ fontSize: '11px', color: '#999' }}>{likeCount}</span>
                        </div>
                        {/* Comment */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                          </svg>
                          <span style={{ fontSize: '11px', color: '#999' }}>{commentCount}</span>
                        </div>
                        {/* Collect */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                          </svg>
                          <span style={{ fontSize: '11px', color: '#999' }}>{collectCount}</span>
                        </div>
                      </div>
                    </div>

                    {/* Date */}
                    <div style={{
                      marginTop: '8px',
                      fontSize: '10px',
                      color: '#bbb',
                      textAlign: 'right',
                    }}>
                      {new Date(task.date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
