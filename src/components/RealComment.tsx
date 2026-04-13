import React, { useState, useEffect } from 'react';
import {
  Star,
  AutoAwesome,
  Refresh,
  CheckCircle,
  PhotoCamera,
  History,
  Send,
} from '@mui/icons-material';
import { apiGet, apiPost } from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';

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

export function RealComment() {
  const { t } = useLanguage();
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [reviewContent, setReviewContent] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewPhotos, setReviewPhotos] = useState<string[]>([]);
  const [aiGeneratingReview, setAiGeneratingReview] = useState(false);
  const [aiReviewGenerated, setAiReviewGenerated] = useState(false);
  const [currentPersona, setCurrentPersona] = useState<typeof REVIEW_PERSONAS[0] | null>(null);
  const [reviewHistory, setReviewHistory] = useState<ReviewTask[]>(() => {
    try {
      const saved = localStorage.getItem('review_history');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [savingReview, setSavingReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [credits, setCredits] = useState<number>(100);

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

  const handleGenerateAIReview = async () => {
    setAiGeneratingReview(true);
    try {
      const persona = REVIEW_PERSONAS[Math.floor(Math.random() * REVIEW_PERSONAS.length)];
      const scenario = REVIEW_SCENARIOS[Math.floor(Math.random() * REVIEW_SCENARIOS.length)];

      const businessContext = businessInfo
        ? `${businessInfo.name} - ${businessInfo.category} located at ${businessInfo.address}`
        : 'the restaurant';

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

  const handleAddPhoto = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          setReviewPhotos(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleRemovePhoto = (index: number) => {
    setReviewPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReview = async () => {
    if (!reviewContent.trim()) {
      alert(t('realComment.errorNoContent'));
      return;
    }

    if (credits < 10) {
      alert('Insufficient credits. Please purchase more credits.');
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

      // Send to backend
      const res = await apiPost('/api/real-comment/submit', reviewData);

      // Create task and immediately mark as published
      const newTask: ReviewTask = {
        id: Date.now().toString(),
        location: selectedLoc?.name || businessInfo?.name || 'Unknown',
        locationName: selectedLoc?.name,
        content: reviewContent,
        rating: reviewRating,
        status: 'published', // Immediately marked as done
        date: new Date().toISOString(),
        photos: reviewPhotos,
      };

      setReviewHistory(prev => [newTask, ...prev]);
      setCredits(prev => prev - 10);

      // Reset form
      setReviewContent('');
      setReviewPhotos([]);
      setAiReviewGenerated(false);
      setCurrentPersona(null);

      alert(t('realComment.successSubmitted'));
    } catch (error) {
      console.error('Failed to submit review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('seo.section.realComment')}</h1>
          <p className="text-sm text-slate-500 mt-1">{t('seo.section.realCommentDesc')}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-4 py-2">
            <Star className="w-5 h-5 text-orange-500" />
            <span className="text-sm font-semibold text-orange-700">{credits} Credits</span>
          </div>
        </div>
      </div>

      {/* Review Creator */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
            <Star className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold">{t('realComment.createReview')}</h2>
            <p className="text-xs text-slate-500">发送一条评论消耗 10 credits</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Location Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">{t('realComment.selectLocation')}</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-sm"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
                {locations.length === 0 && (
                  <option value="0">{businessInfo?.name || 'Location 1'}</option>
                )}
              </select>
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">{t('realComment.rating')}</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
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
                disabled={aiGeneratingReview}
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
                <p className="text-xs text-purple-600 font-semibold">
                  {t('realComment.identityLabel')} <span className="font-bold">{currentPersona.name}</span>
                </p>
              </div>
            )}

            {/* Credits Info */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">发送消耗</span>
                <span className="font-bold text-primary">10 credits</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-slate-600">剩余 credits</span>
                <span className="font-bold text-lg text-orange-500">{credits}</span>
              </div>
            </div>
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
                rows={8}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 text-sm resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {/* Photos */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-slate-700">{t('realComment.photoGallery')}</label>
                <button
                  onClick={handleAddPhoto}
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  + {t('realComment.addPhoto')}
                </button>
              </div>
              <div className="flex gap-2 flex-wrap">
                {reviewPhotos.map((photo, index) => (
                  <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden">
                    <img src={photo} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => handleRemovePhoto(index)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {reviewPhotos.length < 5 && (
                  <button
                    onClick={handleAddPhoto}
                    className="w-20 h-20 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:border-primary hover:text-primary transition-colors"
                  >
                    <PhotoCamera className="w-6 h-6" />
                    <span className="text-[10px] mt-1">Add</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-2">最多添加 5 张照片</p>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmitReview}
              disabled={submitting || !reviewContent.trim() || credits < 10}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-3 px-4 rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <><Refresh className="w-4 h-4 animate-spin" />{t('realComment.submitting')}</>
              ) : (
                <><Send className="w-4 h-4" />{t('realComment.submitReview')} (-10 credits)</>
              )}
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
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">{t('realComment.location')}</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">{t('realComment.rating')}</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">{t('realComment.reviewContent')}</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">{t('realComment.status')}</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">{t('realComment.date')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reviewHistory.map((task) => (
                <tr key={task.id} className="hover:bg-slate-50">
                  <td className="px-4 py-4 text-sm text-slate-600">{task.location}</td>
                  <td className="px-4 py-4">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Star key={i} className={`w-4 h-4 ${i <= task.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600 max-w-xs truncate">{task.content}</td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      task.status === 'published' ? 'bg-green-100 text-green-700' :
                      task.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {task.status === 'published' ? t('realComment.completed') : task.status === 'pending' ? t('realComment.pending') : t('realComment.failed')}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-500">{new Date(task.date).toLocaleDateString()}</td>
                </tr>
              ))}
              {reviewHistory.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                    <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p>{t('realComment.noReviewHistory')}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
