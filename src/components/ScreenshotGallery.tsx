import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  MapPin,
  MessageSquare,
  Zap,
  Edit3,
  History,
  Calendar,
  BarChart3,
  TrendingUp,
  Search,
  Lightbulb,
  Star,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ScreenshotItem {
  id: string;
  titleZh: string;
  titleEn: string;
  descZh: string;
  descEn: string;
  imagePath: string;
  icon: React.ReactNode;
  color: string;
  featuresZh: string[];
  featuresEn: string[];
}

const SCREENSHOTS: ScreenshotItem[] = [
  {
    id: 'dashboard',
    titleZh: '数据概览 Dashboard',
    titleEn: 'Dashboard Overview',
    descZh: '一站式查看所有门店的核心业务数据，快速掌握经营状况',
    descEn: 'View core business data for all locations in one place',
    imagePath: '/images/screenshots/dashboard.png',
    icon: <LayoutDashboard size={18} />,
    color: '#1e3a5f',
    featuresZh: ['KPI指标卡片', '趋势图表', '健康评分', '最新评论'],
    featuresEn: ['KPI Cards', 'Trend Charts', 'Health Score', 'Recent Reviews'],
  },
  {
    id: 'reviews',
    titleZh: '评价管理 Reviews',
    titleEn: 'Reviews Management',
    descZh: '集中管理所有平台的客户评价，提升在线口碑',
    descEn: 'Centralized customer review management across all platforms',
    imagePath: '/images/screenshots/reviews.png',
    icon: <MessageSquare size={18} />,
    color: '#f59e0b',
    featuresZh: ['评价流展示', 'AI智能回复', '筛选与搜索', '统一收件箱'],
    featuresEn: ['Review Stream', 'AI Smart Reply', 'Filter & Search', 'Unified Inbox'],
  },
  {
    id: 'listings',
    titleZh: '商家列表 Listings',
    titleEn: 'Listings Management',
    descZh: '统一管理所有门店的Google商业信息，保持数据一致性',
    descEn: 'Manage Google business info for all locations with data consistency',
    imagePath: '/images/screenshots/listings.png',
    icon: <MapPin size={18} />,
    color: '#0ea5e9',
    featuresZh: ['门店表格', '编辑信息', '档案分析', '同步管理'],
    featuresEn: ['Location Table', 'Edit Info', 'Profile Analysis', 'Sync Management'],
  },
  {
    id: 'automations',
    titleZh: '自动化规则 Automations',
    titleEn: 'Automation Rules',
    descZh: '设置自动化规则，让AI自动处理新评价',
    descEn: 'Set up automation rules and let AI handle new reviews automatically',
    imagePath: '/images/screenshots/automations.png',
    icon: <Zap size={18} />,
    color: '#8b5cf6',
    featuresZh: ['快速开始向导', 'AI助手管理', '规则状态追踪', '一键启动'],
    featuresEn: ['Quick Start Wizard', 'AI Agent Management', 'Rule Status Tracking', 'One-click Launch'],
  },
  {
    id: 'bulk-edits',
    titleZh: '批量编辑 Bulk Edits',
    titleEn: 'Bulk Edits',
    descZh: '一次操作更新多个门店信息，大幅提升工作效率',
    descEn: 'Update multiple locations in one operation',
    imagePath: '/images/screenshots/bulk-edits.png',
    icon: <Edit3 size={18} />,
    color: '#ec4899',
    featuresZh: ['三步向导', '批量选择门店', '批量更新字段', '审核确认'],
    featuresEn: ['Three-step Wizard', 'Bulk Location Select', 'Bulk Field Update', 'Review & Confirm'],
  },
  {
    id: 'activity-log',
    titleZh: '操作日志 Activity Log',
    titleEn: 'Activity Log',
    descZh: '记录所有操作历史，便于追溯和审计',
    descEn: 'Record all operation history for traceability and auditing',
    imagePath: '/images/screenshots/activity-log.png',
    icon: <History size={18} />,
    color: '#10b981',
    featuresZh: ['活动时间线', '日志筛选', '操作追溯', '状态追踪'],
    featuresEn: ['Activity Timeline', 'Log Filters', 'Operation Trace', 'Status Tracking'],
  },
  {
    id: 'publishing',
    titleZh: '内容发布 Publishing',
    titleEn: 'Content Publishing',
    descZh: '创建和管理Google商家帖子，保持活跃的在线存在感',
    descEn: 'Create and manage Google Business posts',
    imagePath: '/images/screenshots/publishing.png',
    icon: <Calendar size={18} />,
    color: '#f97316',
    featuresZh: ['日历视图', '帖子编辑器', '定时发布', '快捷操作'],
    featuresEn: ['Calendar View', 'Post Composer', 'Schedule Post', 'Quick Actions'],
  },
  {
    id: 'reports',
    titleZh: '数据报告 Reports',
    titleEn: 'GBP Performance Reports',
    descZh: '深度分析业务数据，导出专业报告辅助决策',
    descEn: 'Deep analysis of business data with professional reports',
    imagePath: '/images/screenshots/reports.png',
    icon: <BarChart3 size={18} />,
    color: '#6366f1',
    featuresZh: ['绩效分析', '时间趋势', 'PDF导出', '数据对比'],
    featuresEn: ['Performance Analysis', 'Time Trends', 'PDF Export', 'Data Comparison'],
  },
  {
    id: 'search-overview',
    titleZh: '搜索概览 Search Overview',
    titleEn: 'Search Performance Overview',
    descZh: '可视化展示搜索和用户行为数据',
    descEn: 'Visualize search and user behavior data',
    imagePath: '/images/screenshots/search-overview.png',
    icon: <TrendingUp size={18} />,
    color: '#3b82f6',
    featuresZh: ['环形图表', '搜索份额', '行为分析', '数据可视化'],
    featuresEn: ['Ring Charts', 'Search Share', 'Behavior Analysis', 'Data Visualization'],
  },
  {
    id: 'local-seo',
    titleZh: '本地SEO Local SEO',
    titleEn: 'Local Search Grid',
    descZh: '可视化分析门店在不同地理位置的搜索排名情况',
    descEn: 'Visual analysis of location search rankings across geography',
    imagePath: '/images/screenshots/local-seo.png',
    icon: <Search size={18} />,
    color: '#06b6d4',
    featuresZh: ['网格扫描', '排名可视化', '地图展示', '竞品分析'],
    featuresEn: ['Grid Scan', 'Rank Visualization', 'Map Display', 'Competitor Analysis'],
  },
  {
    id: 'optimization',
    titleZh: '优化中心 Optimization',
    titleEn: 'Optimization Center',
    descZh: 'AI驱动的SEO健康度分析和优化建议',
    descEn: 'AI-powered SEO health analysis and optimization suggestions',
    imagePath: '/images/screenshots/optimization.png',
    icon: <Lightbulb size={18} />,
    color: '#eab308',
    featuresZh: ['健康评分', '快速优化项', '推荐建议', '竞争洞察'],
    featuresEn: ['Health Score', 'Quick Wins', 'Recommendations', 'Competitive Insights'],
  },
  {
    id: 'optimization-detail',
    titleZh: '优化建议 Optimization Details',
    titleEn: 'Optimization Recommendations',
    descZh: '详细的优化步骤和行动指南',
    descEn: 'Detailed optimization steps and action guide',
    imagePath: '/images/screenshots/optimization-detail.png',
    icon: <Lightbulb size={18} />,
    color: '#84cc16',
    featuresZh: ['行动步骤', '影响评估', '投入产出', '详细指导'],
    featuresEn: ['Action Steps', 'Impact Assessment', 'Effort vs Impact', 'Detailed Guide'],
  },
  {
    id: 'real-reviews',
    titleZh: '真实评论 Real Reviews',
    titleEn: 'Real Reviews Generation',
    descZh: '帮助企业获取更多真实的Google评价',
    descEn: 'Help businesses get more authentic Google reviews',
    imagePath: '/images/screenshots/real-reviews.png',
    icon: <Star size={18} />,
    color: '#ef4444',
    featuresZh: ['AI生成评论', '身份选择', '评分设定', '历史管理'],
    featuresEn: ['AI Review Generation', 'Identity Selection', 'Rating Setting', 'History Management'],
  },
];

interface ScreenshotGalleryProps {
  categoryId?: string;
  limit?: number;
}

export function ScreenshotGallery({ categoryId, limit }: ScreenshotGalleryProps) {
  const { language } = useLanguage();
  const isZh = language === 'zh';
  const [activeIndex, setActiveIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const galleryRef = useRef<HTMLDivElement>(null);

  const filteredScreenshots = categoryId
    ? SCREENSHOTS.filter(s => s.id === categoryId)
    : limit
    ? SCREENSHOTS.slice(0, limit)
    : SCREENSHOTS;

  useEffect(() => {
    filteredScreenshots.forEach(screenshot => {
      const img = new Image();
      img.src = screenshot.imagePath;
      img.onload = () => {
        setLoadedImages(prev => new Set(prev).add(screenshot.id));
      };
    });
  }, []);

  const handleSlideChange = (newIndex: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveIndex(newIndex);
      setIsTransitioning(false);
    }, 200);
  };

  const handlePrev = () => {
    const newIndex = activeIndex > 0 ? activeIndex - 1 : filteredScreenshots.length - 1;
    handleSlideChange(newIndex);
  };

  const handleNext = () => {
    const newIndex = activeIndex < filteredScreenshots.length - 1 ? activeIndex + 1 : 0;
    handleSlideChange(newIndex);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showLightbox) {
        if (e.key === 'Escape') setShowLightbox(false);
        if (e.key === 'ArrowLeft') handlePrev();
        if (e.key === 'ArrowRight') handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showLightbox, activeIndex]);

  if (filteredScreenshots.length === 0) return null;

  const current = filteredScreenshots[activeIndex];
  const isImageLoaded = loadedImages.has(current.id);

  return (
    <div className="screenshot-gallery" ref={galleryRef}>
      {/* Main Preview */}
      <div
        className={`screenshot-preview ${isTransitioning ? 'transitioning' : ''}`}
        onClick={() => setShowLightbox(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setShowLightbox(true)}
      >
        <div className="screenshot-preview-header">
          <div className="screenshot-preview-dots">
            <span className="dot dot-red" />
            <span className="dot dot-yellow" />
            <span className="dot dot-green" />
          </div>
          <div className="screenshot-preview-badge" style={{ backgroundColor: current.color }}>
            {current.icon}
            <span>{isZh ? current.titleZh : current.titleEn}</span>
          </div>
        </div>

        <div className="screenshot-image-container">
          {isImageLoaded ? (
            <img
              src={current.imagePath}
              alt={isZh ? current.titleZh : current.titleEn}
              className="screenshot-image"
            />
          ) : (
            <div className="screenshot-placeholder">
              <div className="screenshot-placeholder-inner">
                <div className="screenshot-placeholder-icon" style={{ color: current.color }}>
                  {current.icon}
                </div>
                <span>{isZh ? '加载中...' : 'Loading...'}</span>
                <div className="screenshot-loading-bar">
                  <div className="screenshot-loading-progress" />
                </div>
              </div>
            </div>
          )}
          <div className="screenshot-zoom-hint">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35M11 8v6M8 11h6" />
            </svg>
            <span>{isZh ? '点击放大' : 'Click to enlarge'}</span>
          </div>
        </div>
      </div>

      {/* Thumbnail Strip */}
      <div className="screenshot-thumbs-strip">
        <button
          className="screenshot-thumbs-nav prev"
          onClick={handlePrev}
          aria-label={isZh ? '上一个' : 'Previous'}
        >
          ‹
        </button>

        <div className="screenshot-thumbs">
          {filteredScreenshots.map((screenshot, index) => (
            <button
              key={screenshot.id}
              className={`screenshot-thumb ${index === activeIndex ? 'active' : ''}`}
              onClick={() => handleSlideChange(index)}
              style={{ '--thumb-color': screenshot.color } as React.CSSProperties}
              aria-label={isZh ? screenshot.titleZh : screenshot.titleEn}
            >
              <div className="screenshot-thumb-icon" style={{ color: screenshot.color }}>
                {screenshot.icon}
              </div>
              <span className="screenshot-thumb-label">
                {isZh ? screenshot.titleZh : screenshot.titleEn}
              </span>
            </button>
          ))}
        </div>

        <button
          className="screenshot-thumbs-nav next"
          onClick={handleNext}
          aria-label={isZh ? '下一个' : 'Next'}
        >
          ›
        </button>
      </div>

      {/* Features Pills */}
      <div className="screenshot-features">
        {(isZh ? current.featuresZh : current.featuresEn).map((feature, i) => (
          <span
            key={i}
            className="screenshot-feature-pill"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            {current.icon}
            {feature}
          </span>
        ))}
      </div>

      {/* Lightbox */}
      {showLightbox && (
        <div
          className="screenshot-lightbox"
          onClick={() => setShowLightbox(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="screenshot-lightbox-content" onClick={e => e.stopPropagation()}>
            <button
              className="screenshot-lightbox-close"
              onClick={() => setShowLightbox(false)}
              aria-label={isZh ? '关闭' : 'Close'}
            >
              ×
            </button>

            <button
              className="screenshot-lightbox-nav prev"
              onClick={handlePrev}
              aria-label={isZh ? '上一个' : 'Previous'}
            >
              ‹
            </button>

            <div className="screenshot-lightbox-image-wrapper">
              {isImageLoaded ? (
                <img
                  src={current.imagePath}
                  alt={isZh ? current.titleZh : current.titleEn}
                  className="screenshot-lightbox-image"
                />
              ) : (
                <div className="screenshot-lightbox-placeholder">
                  <div style={{ color: current.color }}>{current.icon}</div>
                </div>
              )}
            </div>

            <button
              className="screenshot-lightbox-nav next"
              onClick={handleNext}
              aria-label={isZh ? '下一个' : 'Next'}
            >
              ›
            </button>

            <div className="screenshot-lightbox-info">
              <div className="screenshot-lightbox-badge" style={{ backgroundColor: current.color }}>
                {current.icon}
                <span>{isZh ? current.titleZh : current.titleEn}</span>
              </div>
              <p className="screenshot-lightbox-desc">{isZh ? current.descZh : current.descEn}</p>
              <span className="screenshot-lightbox-counter">
                {activeIndex + 1} / {filteredScreenshots.length}
              </span>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .screenshot-gallery {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* Main Preview */
        .screenshot-preview {
          position: relative;
          background: white;
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
        }

        .screenshot-preview:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.15);
        }

        .screenshot-preview.transitioning {
          opacity: 0.7;
          transform: scale(0.98);
        }

        .screenshot-preview-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: #1e1e1e;
        }

        .screenshot-preview-dots {
          display: flex;
          gap: 6px;
        }

        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .dot-red { background: #ff5f57; }
        .dot-yellow { background: #febc2e; }
        .dot-green { background: #28c840; }

        .screenshot-preview-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          border-radius: 6px;
          color: white;
          font-size: 12px;
          font-weight: 600;
          margin-left: auto;
        }

        .screenshot-image-container {
          position: relative;
          aspect-ratio: 16/10;
          background: #f8fafc;
          overflow: hidden;
        }

        .screenshot-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .screenshot-preview:hover .screenshot-image {
          transform: scale(1.02);
        }

        .screenshot-placeholder {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        }

        .screenshot-placeholder-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          text-align: center;
          padding: 24px;
        }

        .screenshot-placeholder-icon {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }

        .screenshot-placeholder-inner span {
          font-size: 13px;
          color: #64748b;
        }

        .screenshot-loading-bar {
          width: 120px;
          height: 3px;
          background: #e2e8f0;
          border-radius: 2px;
          overflow: hidden;
        }

        .screenshot-loading-progress {
          width: 30%;
          height: 100%;
          background: #4facfe;
          border-radius: 2px;
          animation: loading 1s ease-in-out infinite;
        }

        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }

        .screenshot-zoom-hint {
          position: absolute;
          bottom: 12px;
          right: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          border-radius: 6px;
          color: white;
          font-size: 11px;
          font-weight: 500;
          opacity: 0;
          transform: translateY(4px);
          transition: all 0.2s;
        }

        .screenshot-preview:hover .screenshot-zoom-hint {
          opacity: 1;
          transform: translateY(0);
        }

        /* Thumbnails Strip */
        .screenshot-thumbs-strip {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .screenshot-thumbs {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          padding: 4px;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .screenshot-thumbs::-webkit-scrollbar {
          display: none;
        }

        .screenshot-thumbs-nav {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: white;
          color: #64748b;
          font-size: 18px;
          cursor: pointer;
          transition: all 0.15s;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .screenshot-thumbs-nav:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #1e3a5f;
        }

        .screenshot-thumb {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 8px 10px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s;
          flex-shrink: 0;
          min-width: 80px;
        }

        .screenshot-thumb:hover {
          border-color: var(--thumb-color);
          background: #fafafa;
        }

        .screenshot-thumb.active {
          border-color: var(--thumb-color);
          background: color-mix(in srgb, var(--thumb-color) 8%, white);
          box-shadow: 0 2px 8px color-mix(in srgb, var(--thumb-color) 20%, transparent);
        }

        .screenshot-thumb-icon {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          background: color-mix(in srgb, var(--thumb-color) 10%, white);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .screenshot-thumb-label {
          font-size: 10px;
          font-weight: 600;
          color: #475569;
          text-align: center;
          white-space: nowrap;
        }

        /* Features Pills */
        .screenshot-features {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
        }

        .screenshot-feature-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: #f1f5f9;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          color: #475569;
          animation: fadeInUp 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          opacity: 0;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .screenshot-feature-pill svg {
          opacity: 0.6;
        }

        /* Lightbox */
        .screenshot-lightbox {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.92);
          backdrop-filter: blur(8px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .screenshot-lightbox-content {
          position: relative;
          max-width: 1200px;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .screenshot-lightbox-close {
          position: absolute;
          top: -50px;
          right: 0;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          font-size: 24px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
          z-index: 10;
        }

        .screenshot-lightbox-close:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: scale(1.1);
        }

        .screenshot-lightbox-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          font-size: 24px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
          z-index: 10;
        }

        .screenshot-lightbox-nav:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-50%) scale(1.1);
        }

        .screenshot-lightbox-nav.prev {
          left: -60px;
        }

        .screenshot-lightbox-nav.next {
          right: -60px;
        }

        .screenshot-lightbox-image-wrapper {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .screenshot-lightbox-image {
          width: 100%;
          height: auto;
          max-height: 70vh;
          object-fit: contain;
          display: block;
        }

        .screenshot-lightbox-placeholder {
          aspect-ratio: 16/10;
          background: #1e1e1e;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .screenshot-lightbox-placeholder svg {
          width: 64px;
          height: 64px;
          opacity: 0.5;
        }

        .screenshot-lightbox-info {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .screenshot-lightbox-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 8px;
          color: white;
          font-size: 14px;
          font-weight: 600;
        }

        .screenshot-lightbox-desc {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
          max-width: 500px;
        }

        .screenshot-lightbox-counter {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
          font-weight: 500;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .screenshot-thumbs-strip {
            gap: 4px;
          }

          .screenshot-thumb-label {
            display: none;
          }

          .screenshot-thumb {
            min-width: 50px;
            padding: 8px;
          }

          .screenshot-lightbox {
            padding: 16px;
          }

          .screenshot-lightbox-nav {
            width: 36px;
            height: 36px;
            font-size: 18px;
          }

          .screenshot-lightbox-nav.prev {
            left: 8px;
          }

          .screenshot-lightbox-nav.next {
            right: 8px;
          }

          .screenshot-lightbox-close {
            top: -44px;
            right: 8px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .screenshot-preview,
          .screenshot-image,
          .screenshot-zoom-hint,
          .screenshot-thumb,
          .screenshot-lightbox,
          .screenshot-lightbox-nav,
          .screenshot-lightbox-close {
            transition: none;
            animation: none;
          }

          .screenshot-placeholder-icon {
            animation: none;
          }

          .screenshot-loading-progress {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

export function ScreenshotShowcase({ limit }: { limit?: number }) {
  const { language } = useLanguage();
  const isZh = language === 'zh';
  const [activeIndex, setActiveIndex] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [isTransitioning, setIsTransitioning] = useState(false);

  const items = limit ? SCREENSHOTS.slice(0, limit) : SCREENSHOTS;

  useEffect(() => {
    items.forEach(item => {
      const img = new Image();
      img.src = item.imagePath;
      img.onload = () => {
        setLoadedImages(prev => new Set(prev).add(item.id));
      };
    });
  }, []);

  const handleSlideChange = (newIndex: number) => {
    if (isTransitioning || newIndex === activeIndex) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveIndex(newIndex);
      setIsTransitioning(false);
    }, 200);
  };

  const current = items[activeIndex];
  const isImageLoaded = loadedImages.has(current.id);

  return (
    <div className="screenshot-showcase">
      {/* Header */}
      <div className="screenshot-showcase-header">
        <div className="screenshot-showcase-title-row">
          <div className="screenshot-showcase-icon" style={{ backgroundColor: current.color }}>
            {current.icon}
          </div>
          <div>
            <h3>{isZh ? current.titleZh : current.titleEn}</h3>
            <p>{isZh ? current.descZh : current.descEn}</p>
          </div>
        </div>
        <div className="screenshot-showcase-nav">
          <button
            className="screenshot-showcase-nav-btn"
            onClick={() => handleSlideChange(activeIndex > 0 ? activeIndex - 1 : items.length - 1)}
            aria-label={isZh ? '上一个' : 'Previous'}
          >
            ‹
          </button>
          <span>{activeIndex + 1} / {items.length}</span>
          <button
            className="screenshot-showcase-nav-btn"
            onClick={() => handleSlideChange(activeIndex < items.length - 1 ? activeIndex + 1 : 0)}
            aria-label={isZh ? '下一个' : 'Next'}
          >
            ›
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className={`screenshot-showcase-preview ${isTransitioning ? 'transitioning' : ''}`}>
        <div className="screenshot-showcase-browser-chrome">
          <div className="screenshot-showcase-browser-dots">
            <span /><span /><span />
          </div>
          <div className="screenshot-showcase-browser-url">
            pinkernelseo.com / {current.id}
          </div>
          <div className="screenshot-showcase-browser-actions">
            <span className="browser-action" />
            <span className="browser-action" />
            <span className="browser-action" />
          </div>
        </div>

        <div className="screenshot-showcase-image">
          {isImageLoaded ? (
            <img
              src={current.imagePath}
              alt={isZh ? current.titleZh : current.titleEn}
              className="screenshot-showcase-img"
            />
          ) : (
            <div className="screenshot-showcase-placeholder">
              <div className="screenshot-showcase-placeholder-icon" style={{ color: current.color }}>
                {React.cloneElement(current.icon as React.ReactElement, { size: 48 })}
              </div>
              <span>{isZh ? '功能界面截图' : 'Feature Screenshot'}</span>
              <span className="screenshot-showcase-placeholder-id">{current.id}</span>
            </div>
          )}
        </div>
      </div>

      {/* Features */}
      <div className="screenshot-showcase-features">
        {(isZh ? current.featuresZh : current.featuresEn).map((feature, i) => (
          <span
            key={i}
            className="screenshot-showcase-feature"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            {current.icon}
            {feature}
          </span>
        ))}
      </div>

      {/* Thumbnails Strip */}
      <div className="screenshot-showcase-thumbs">
        {items.map((item, index) => (
          <button
            key={item.id}
            className={`screenshot-showcase-thumb ${index === activeIndex ? 'active' : ''}`}
            onClick={() => handleSlideChange(index)}
            style={{ '--thumb-color': item.color } as React.CSSProperties}
            aria-label={isZh ? item.titleZh : item.titleEn}
          >
            <div className="screenshot-showcase-thumb-icon" style={{ color: item.color }}>
              {item.icon}
            </div>
            <span>{isZh ? item.titleZh : item.titleEn}</span>
          </button>
        ))}
      </div>

      <style>{`
        .screenshot-showcase {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .screenshot-showcase-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          background: linear-gradient(to right, #f8fafc, #ffffff);
          border-bottom: 1px solid #f1f5f9;
        }

        .screenshot-showcase-title-row {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .screenshot-showcase-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .screenshot-showcase-title-row h3 {
          font-family: 'Manrope', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 2px;
        }

        .screenshot-showcase-title-row p {
          font-size: 12px;
          color: #64748b;
          margin: 0;
        }

        .screenshot-showcase-nav {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .screenshot-showcase-nav span {
          font-size: 12px;
          color: #94a3b8;
          min-width: 44px;
          text-align: center;
          font-weight: 500;
        }

        .screenshot-showcase-nav-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: white;
          color: #64748b;
          font-size: 18px;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .screenshot-showcase-nav-btn:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
          color: #1e3a5f;
        }

        /* Preview */
        .screenshot-showcase-preview {
          position: relative;
          transition: opacity 0.2s, transform 0.2s;
        }

        .screenshot-showcase-preview.transitioning {
          opacity: 0.7;
          transform: scale(0.99);
        }

        .screenshot-showcase-browser-chrome {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          background: #1e1e1e;
          border-bottom: 1px solid #333;
        }

        .screenshot-showcase-browser-dots {
          display: flex;
          gap: 5px;
        }

        .screenshot-showcase-browser-dots span {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #555;
        }

        .screenshot-showcase-browser-dots span:nth-child(1) { background: #ff5f57; }
        .screenshot-showcase-browser-dots span:nth-child(2) { background: #febc2e; }
        .screenshot-showcase-browser-dots span:nth-child(3) { background: #28c840; }

        .screenshot-showcase-browser-url {
          flex: 1;
          background: #2a2a2a;
          border: 1px solid #3a3a3a;
          border-radius: 5px;
          padding: 5px 12px;
          font-size: 11px;
          color: #888;
          text-align: center;
          font-family: 'SF Mono', Monaco, monospace;
        }

        .screenshot-showcase-browser-actions {
          display: flex;
          gap: 4px;
        }

        .browser-action {
          width: 16px;
          height: 16px;
          border-radius: 3px;
          background: #444;
        }

        .screenshot-showcase-image {
          position: relative;
          aspect-ratio: 16/10;
          background: #f8fafc;
          overflow: hidden;
        }

        .screenshot-showcase-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .screenshot-showcase:hover .screenshot-showcase-img {
          transform: scale(1.02);
        }

        .screenshot-showcase-placeholder {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        }

        .screenshot-showcase-placeholder-icon {
          opacity: 0.25;
        }

        .screenshot-showcase-placeholder span {
          font-size: 13px;
          color: #94a3b8;
          font-weight: 500;
        }

        .screenshot-showcase-placeholder-id {
          font-family: 'SF Mono', Monaco, monospace !important;
          font-size: 11px !important;
          color: #cbd5e1 !important;
        }

        /* Features */
        .screenshot-showcase-features {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 16px 24px;
          border-top: 1px solid #f1f5f9;
          background: #fafbfc;
        }

        .screenshot-showcase-feature {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          color: #475569;
          animation: fadeInScale 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          opacity: 0;
        }

        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .screenshot-showcase-feature svg {
          opacity: 0.5;
        }

        /* Thumbs */
        .screenshot-showcase-thumbs {
          display: flex;
          gap: 6px;
          padding: 12px 16px;
          background: white;
          border-top: 1px solid #f1f5f9;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .screenshot-showcase-thumbs::-webkit-scrollbar {
          display: none;
        }

        .screenshot-showcase-thumb {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 8px 10px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.15s;
          flex-shrink: 0;
          min-width: 72px;
        }

        .screenshot-showcase-thumb:hover {
          border-color: var(--thumb-color);
        }

        .screenshot-showcase-thumb.active {
          border-color: var(--thumb-color);
          background: color-mix(in srgb, var(--thumb-color) 8%, white);
          box-shadow: 0 2px 6px color-mix(in srgb, var(--thumb-color) 15%, transparent);
        }

        .screenshot-showcase-thumb-icon {
          width: 30px;
          height: 30px;
          border-radius: 6px;
          background: color-mix(in srgb, var(--thumb-color) 10%, white);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .screenshot-showcase-thumb span {
          font-size: 9px;
          font-weight: 600;
          color: #64748b;
          text-align: center;
          white-space: nowrap;
        }

        /* Responsive */
        @media (max-width: 640px) {
          .screenshot-showcase-header {
            flex-direction: column;
            gap: 12px;
            align-items: flex-start;
          }

          .screenshot-showcase-features {
            justify-content: center;
          }

          .screenshot-showcase-thumb span {
            display: none;
          }

          .screenshot-showcase-thumb {
            min-width: 50px;
            padding: 8px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .screenshot-showcase-preview,
          .screenshot-showcase-img {
            transition: none;
            animation: none;
          }

          .screenshot-showcase-feature {
            animation: none;
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

export { SCREENSHOTS };
