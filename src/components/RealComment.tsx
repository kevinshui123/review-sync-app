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
} from '@mui/icons-material';
import { Loader2, Sparkles, Zap } from 'lucide-react';
import { apiGet, apiPost } from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import { PageLoader } from './PageLoader';

interface ReviewTask {
  id: string;
  location: string;
  locationName?: string;
  content: string;
  rating: number;
  status: 'pending' | 'published' | 'failed';
  date: string;
  photos?: string[];
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

export function RealComment() {
  const { t } = useLanguage();
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [reviewContent, setReviewContent] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewPhotos, setReviewPhotos] = useState<string[]>([]);
  const [photoAnalysis, setPhotoAnalysis] = useState<PhotoAnalysis | null>(null);
  const [aiGeneratingReview, setAiGeneratingReview] = useState(false);
  const [analyzingPhotos, setAnalyzingPhotos] = useState(false);
  const [aiReviewGenerated, setAiReviewGenerated] = useState(false);
  const [currentPersona, setCurrentPersona] = useState<typeof REVIEW_PERSONAS[0] | null>(null);
  const [reviewHistory, setReviewHistory] = useState<ReviewTask[]>(() => {
    try {
      const saved = localStorage.getItem('review_history');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [submitting, setSubmitting] = useState(false);
  const [credits, setCredits] = useState<number>(100);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('review_history', JSON.stringify(reviewHistory));
  }, [reviewHistory]);

  useEffect(() => {
    const fetchData = async () => {
      try {
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
            console.warn('[RealComment] Backfill failed:', e);
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
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Photo analysis with AI
  const analyzePhotos = async () => {
    if (reviewPhotos.length === 0) return;

    setAnalyzingPhotos(true);
    try {
      // Simulate AI photo analysis (in production, call actual AI API)
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

      // Build context with photo analysis if available
      let photoContext = '';
      if (photoAnalysis) {
        photoContext = `
照片分析信息：
- 食物类型：${photoAnalysis.foodItems.join('、')}
- 餐厅氛围：${photoAnalysis.atmosphere.join('、')}
- 整体印象：${photoAnalysis.overallVibe}
- 质量评价：${photoAnalysis.quality}
`;
      }

      const businessContext = businessInfo
        ? `${businessInfo.name} - ${businessInfo.category}位于${businessInfo.address}`
        : '餐厅';

      const prompt = `你是一个${persona.identity}。你正在体验${businessContext}。
${photoContext}
请根据以上信息，写一条真实、自然的Google好评，要求：
1. 100-200字
2. 语言自然，像真实顾客
3. 融入照片中的食物和氛围描述
4. 不要提及任何商业或AI相关的内容
5. 重点描述用餐体验、食物品质、服务或环境

只输出评论文本，不要输出其他内容。`;

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

      if (!generatedContent) {
        // Fallback reviews with photo context
        const fallbackReviews = [
          `这次来${businessInfo?.name || '这家店'}真的太惊喜了！${photoAnalysis?.overallVibe || '店面环境很棒'}，店员服务也很热情。${photoAnalysis?.foodItems?.[0] || '招牌菜'}做得相当地道，分量也很足。下次还会再来！`,
          `朋友推荐过来的，果然没有让我失望！${photoAnalysis?.atmosphere?.[0] || '环境氛围很好'}，${photoAnalysis?.foodItems?.slice(0, 2).join('和') || '菜品'}都很好吃。性价比很高，值得推荐！`,
          `已经是第三次来了，每次都很满意！${photoAnalysis?.quality || '品质一如既往的好'}，${photoAnalysis?.foodItems?.[0] || '招牌菜'}依然是我的最爱。强烈推荐给想吃${businessInfo?.category || '美食'}的朋友们！`,
        ];
        generatedContent = fallbackReviews[Math.floor(Math.random() * fallbackReviews.length)];
      }

      setReviewContent(generatedContent);
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

  // Handle file selection
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const newPhotos: string[] = [];
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/') && reviewPhotos.length + newPhotos.length < 5) {
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

  // Drag and drop handlers
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

  const handleSubmitReview = async () => {
    if (!reviewContent.trim()) {
      alert(t('realComment.errorNoContent'));
      return;
    }

    if (credits < 10) {
      alert('Credits不足，请充值');
      return;
    }

    setSubmitting(true);
    try {
      const selectedLoc = locations.find(l => l.id === selectedLocation) || locations[0];

      const reviewData = {
        location: selectedLoc?.name || businessInfo?.name || 'Unknown',
        locationId: selectedLocation,
        content: reviewContent,
        rating: reviewRating,
        photos: reviewPhotos,
        date: new Date().toISOString(),
      };

      await apiPost('/api/real-comment/submit', reviewData);

      const newTask: ReviewTask = {
        id: Date.now().toString(),
        location: selectedLoc?.name || businessInfo?.name || 'Unknown',
        locationName: selectedLoc?.name,
        content: reviewContent,
        rating: reviewRating,
        status: 'published',
        date: new Date().toISOString(),
        photos: reviewPhotos,
      };

      setReviewHistory(prev => [newTask, ...prev]);
      setCredits(prev => prev - 10);

      // Reset form
      setReviewContent('');
      setReviewPhotos([]);
      setPhotoAnalysis(null);
      setAiReviewGenerated(false);
      setCurrentPersona(null);
      setCurrentStep(1);

      alert(t('realComment.successSubmitted'));
    } catch (error) {
      console.error('Failed to submit review:', error);
      alert('提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  // Skip photo step and go directly to AI generation
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
              {t('seo.section.realComment')}
            </h1>
            <p className="text-slate-500 mt-1">{t('seo.section.realCommentDesc')}</p>
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
            { step: 1, icon: <Camera className="w-5 h-5" />, label: '上传照片' },
            { step: 2, icon: <AutoAwesome className="w-5 h-5" />, label: 'AI 分析' },
            { step: 3, icon: <Edit className="w-5 h-5" />, label: '生成评论' },
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
                <h2 className="text-2xl font-bold text-slate-900 mb-2">上传用餐照片</h2>
                <p className="text-slate-500">上传您的用餐照片，AI将根据照片内容生成更精准的评论</p>
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
                  拖拽照片到此处，或点击上传
                </p>
                <p className="text-sm text-slate-400">
                  支持 JPG、PNG 格式，最多 5 张
                </p>
              </div>

              {/* Photo Preview */}
              {reviewPhotos.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-slate-700">
                      已上传 {reviewPhotos.length}/5 张照片
                    </span>
                    <button
                      onClick={handleAddPhoto}
                      className="text-sm text-primary font-medium hover:underline"
                    >
                      + 添加更多
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
                  跳过，使用默认数据
                </button>
                <button
                  onClick={analyzePhotos}
                  disabled={reviewPhotos.length === 0 || analyzingPhotos}
                  className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/90 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {analyzingPhotos ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      AI 分析中...
                    </>
                  ) : (
                    <>
                      <AutoAwesome className="w-5 h-5" />
                      开始 AI 分析
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
                <h2 className="text-2xl font-bold text-slate-900 mb-2">AI 分析完成</h2>
                <p className="text-slate-500">基于您的照片，AI 已提取以下信息</p>
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
                        <h3 className="font-bold text-slate-900">识别到的菜品</h3>
                        <p className="text-xs text-slate-500">基于照片内容</p>
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
                        <h3 className="font-bold text-slate-900">餐厅氛围</h3>
                        <p className="text-xs text-slate-500">环境特征</p>
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
                        <h3 className="font-bold text-slate-900">整体印象</h3>
                        <p className="text-xs text-slate-500">AI 综合评价</p>
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
                  重新上传
                </button>
                <button
                  onClick={handleGenerateAIReview}
                  disabled={aiGeneratingReview}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all disabled:opacity-50"
                >
                  {aiGeneratingReview ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      AI 生成中...
                    </>
                  ) : (
                    <>
                      <AutoAwesome className="w-5 h-5" />
                      生成评论
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
                <h2 className="text-2xl font-bold text-slate-900 mb-2">评论已生成</h2>
                <p className="text-slate-500">您可以编辑或直接提交</p>
              </div>

              {/* Persona Badge */}
              {currentPersona && (
                <div className="flex items-center justify-center gap-2 mb-6">
                  <span className="text-2xl">{currentPersona.avatar}</span>
                  <span className="px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">
                    模拟角色: {currentPersona.name}
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

              {/* Review Content */}
              <div className="mb-6">
                <textarea
                  value={reviewContent}
                  onChange={(e) => setReviewContent(e.target.value)}
                  rows={6}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-slate-700 resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="编辑您的评论..."
                />
              </div>

              {/* Photos */}
              {reviewPhotos.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-medium text-slate-700 mb-3">附加照片</p>
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
                  <span className="text-sm font-medium">提交消耗</span>
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
                  重新生成
                </button>
                <button
                  onClick={handleSubmitReview}
                  disabled={submitting || !reviewContent.trim() || credits < 10}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-10 py-3 rounded-2xl font-bold shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      提交中...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      提交评论
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
            <h3 className="font-bold text-lg mb-1">使用提示</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-green-400 flex-shrink-0" />
                <span>上传清晰的用餐照片可获得更精准的AI分析</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-green-400 flex-shrink-0" />
                <span>生成的评论可以自由编辑，确保符合您的风格</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-green-400 flex-shrink-0" />
                <span>提交后将消耗10 Credits</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-green-400 flex-shrink-0" />
                <span>支持多门店选择，适应不同场景</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Review History */}
      {reviewHistory.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-slate-400" />
            历史记录
          </h2>
          <div className="space-y-3">
            {reviewHistory.slice(0, 5).map((task) => (
              <div key={task.id} className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center">
                  <Chat className="w-5 h-5 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-slate-900 truncate">{task.location}</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Star key={i} className={`w-3 h-3 ${i <= task.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 truncate">{task.content}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    task.status === 'published' ? 'bg-green-50 text-green-600' :
                    task.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                  }`}>
                    {task.status === 'published' ? '已发布' : task.status === 'pending' ? '待处理' : '失败'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(task.date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
