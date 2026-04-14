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
  ChevronRight,
  ChevronLeft,
  X,
  ZoomIn,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { AppPreview, PREVIEW_CONFIGS } from './AppPreview';

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
  const thumbsRef = useRef<HTMLDivElement>(null);

  const filteredItems = categoryId
    ? PREVIEW_CONFIGS.filter(s => s.id === categoryId)
    : limit
    ? PREVIEW_CONFIGS.slice(0, limit)
    : PREVIEW_CONFIGS;

  const handleSlideChange = (newIndex: number) => {
    if (isTransitioning || newIndex === activeIndex) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveIndex(newIndex);
      setIsTransitioning(false);
    }, 150);
  };

  const handlePrev = () => {
    const newIndex = activeIndex > 0 ? activeIndex - 1 : filteredItems.length - 1;
    handleSlideChange(newIndex);
  };

  const handleNext = () => {
    const newIndex = activeIndex < filteredItems.length - 1 ? activeIndex + 1 : 0;
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

  useEffect(() => {
    if (thumbsRef.current) {
      const activeThumb = thumbsRef.current.children[activeIndex] as HTMLElement;
      if (activeThumb) {
        activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeIndex]);

  if (filteredItems.length === 0) return null;

  const current = filteredItems[activeIndex];

  return (
    <div className="screenshot-gallery">
      {/* Main Preview */}
      <div
        className={`screenshot-preview ${isTransitioning ? 'transitioning' : ''}`}
        onClick={() => setShowLightbox(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setShowLightbox(true)}
        aria-label={isZh ? current.titleZh : current.titleEn}
      >
        {/* Browser Chrome */}
        <div className="screenshot-browser-chrome">
          <div className="browser-dots">
            <span className="dot dot-red" />
            <span className="dot dot-yellow" />
            <span className="dot dot-green" />
          </div>
          <div className="browser-title">
            <span className="browser-url">pinkernelseo.com/{current.id}</span>
          </div>
          <div className="browser-actions">
            <span className="browser-action" />
            <span className="browser-action" />
            <span className="browser-action" />
          </div>
        </div>

        {/* Preview Content */}
        <div className="screenshot-content">
          <AppPreview previewId={current.id} className="screenshot-app-preview" />
        </div>

        {/* Zoom Hint */}
        <div className="screenshot-zoom-hint">
          <ZoomIn size={14} />
          <span>{isZh ? '点击放大' : 'Click to enlarge'}</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="screenshot-navigation">
        <button
          className="screenshot-nav-btn"
          onClick={handlePrev}
          aria-label={isZh ? '上一个' : 'Previous'}
        >
          <ChevronLeft size={18} />
        </button>

        <div className="screenshot-nav-indicator">
          <span className="nav-current">{activeIndex + 1}</span>
          <span className="nav-sep">/</span>
          <span className="nav-total">{filteredItems.length}</span>
        </div>

        <button
          className="screenshot-nav-btn"
          onClick={handleNext}
          aria-label={isZh ? '下一个' : 'Next'}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Thumbnail Strip */}
      <div className="screenshot-thumbs" ref={thumbsRef}>
        {filteredItems.map((item, index) => (
          <button
            key={item.id}
            className={`screenshot-thumb ${index === activeIndex ? 'active' : ''}`}
            onClick={() => handleSlideChange(index)}
            style={{ '--thumb-color': item.color } as React.CSSProperties}
            aria-label={isZh ? item.titleZh : item.titleEn}
          >
            <div
              className="screenshot-thumb-icon"
              style={{ color: item.color, backgroundColor: `${item.color}15` }}
            >
              {item.icon}
            </div>
            <span className="screenshot-thumb-label">
              {isZh ? item.titleZh : item.titleEn}
            </span>
          </button>
        ))}
      </div>

      {/* Features */}
      <div className="screenshot-features">
        {(isZh ? current.featuresZh : current.featuresEn).map((feature, i) => (
          <span
            key={i}
            className="screenshot-feature-pill"
            style={{ animationDelay: `${i * 50}ms`, '--pill-color': current.color } as React.CSSProperties}
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
              <X size={20} />
            </button>

            <button
              className="screenshot-lightbox-nav prev"
              onClick={handlePrev}
              aria-label={isZh ? '上一个' : 'Previous'}
            >
              <ChevronLeft size={24} />
            </button>

            <div className="screenshot-lightbox-preview">
              <AppPreview previewId={current.id} className="screenshot-lightbox-app" />
            </div>

            <button
              className="screenshot-lightbox-nav next"
              onClick={handleNext}
              aria-label={isZh ? '下一个' : 'Next'}
            >
              <ChevronRight size={24} />
            </button>

            <div className="screenshot-lightbox-info">
              <div
                className="screenshot-lightbox-badge"
                style={{ backgroundColor: current.color }}
              >
                {current.icon}
                <span>{isZh ? current.titleZh : current.titleEn}</span>
              </div>
              <p className="screenshot-lightbox-desc">{isZh ? current.descZh : current.descEn}</p>
              <span className="screenshot-lightbox-counter">
                {activeIndex + 1} / {filteredItems.length}
              </span>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .screenshot-gallery {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* Main Preview */
        .screenshot-preview {
          position: relative;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .screenshot-preview:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px -4px rgba(0, 0, 0, 0.12);
          border-color: #cbd5e1;
        }

        .screenshot-preview.transitioning {
          opacity: 0.6;
        }

        /* Browser Chrome */
        .screenshot-browser-chrome {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          background: #1e1e1e;
          border-bottom: 1px solid #333;
        }

        .browser-dots {
          display: flex;
          gap: 5px;
        }

        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .dot-red { background: #ff5f57; }
        .dot-yellow { background: #febc2e; }
        .dot-green { background: #28c840; }

        .browser-title {
          flex: 1;
          display: flex;
          justify-content: center;
        }

        .browser-url {
          padding: 4px 12px;
          background: #2a2a2a;
          border: 1px solid #3a3a3a;
          border-radius: 5px;
          font-size: 10px;
          color: #888;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }

        .browser-actions {
          display: flex;
          gap: 4px;
        }

        .browser-action {
          width: 14px;
          height: 14px;
          border-radius: 3px;
          background: #444;
        }

        /* Preview Content */
        .screenshot-content {
          position: relative;
        }

        .screenshot-app-preview {
          height: 320px;
          border-radius: 0;
          border: none;
          box-shadow: none;
        }

        /* Zoom Hint */
        .screenshot-zoom-hint {
          position: absolute;
          bottom: 12px;
          right: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(8px);
          border-radius: 6px;
          color: white;
          font-size: 11px;
          font-weight: 500;
          opacity: 0;
          transform: translateY(4px);
          transition: all 0.2s;
          pointer-events: none;
        }

        .screenshot-preview:hover .screenshot-zoom-hint {
          opacity: 1;
          transform: translateY(0);
        }

        /* Navigation */
        .screenshot-navigation {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
        }

        .screenshot-nav-btn {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: white;
          color: #64748b;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .screenshot-nav-btn:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #1e3a5f;
        }

        .screenshot-nav-indicator {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 14px;
          font-weight: 500;
        }

        .nav-current {
          font-weight: 700;
          color: #0f172a;
        }

        .nav-sep {
          color: #cbd5e1;
        }

        .nav-total {
          color: #94a3b8;
        }

        /* Thumbnails */
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

        /* Features */
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
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          color: #475569;
          animation: fadeInUp 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          opacity: 0;
        }

        .screenshot-feature-pill svg {
          opacity: 0.5;
          color: var(--pill-color, #64748b);
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

        /* Lightbox */
        .screenshot-lightbox {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.92);
          backdrop-filter: blur(12px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px;
          animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .screenshot-lightbox-content {
          position: relative;
          max-width: 900px;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .screenshot-lightbox-close {
          position: absolute;
          top: -48px;
          right: 0;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
          z-index: 10;
        }

        .screenshot-lightbox-close:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: scale(1.05);
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
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
          z-index: 10;
        }

        .screenshot-lightbox-nav:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-50%) scale(1.05);
        }

        .screenshot-lightbox-nav.prev {
          left: -60px;
        }

        .screenshot-lightbox-nav.next {
          right: -60px;
        }

        .screenshot-lightbox-preview {
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .screenshot-lightbox-app {
          height: 480px;
          border-radius: 0;
          border: none;
          box-shadow: none;
        }

        .screenshot-lightbox-info {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
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
          .screenshot-thumbs {
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
          .screenshot-zoom-hint,
          .screenshot-thumb,
          .screenshot-lightbox,
          .screenshot-lightbox-nav,
          .screenshot-lightbox-close,
          .screenshot-feature-pill {
            transition: none;
            animation: none;
          }

          .screenshot-feature-pill {
            opacity: 1;
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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const thumbsRef = useRef<HTMLDivElement>(null);

  const items = limit ? PREVIEW_CONFIGS.slice(0, limit) : PREVIEW_CONFIGS;

  const handleSlideChange = (newIndex: number) => {
    if (isTransitioning || newIndex === activeIndex) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveIndex(newIndex);
      setIsTransitioning(false);
    }, 150);
  };

  useEffect(() => {
    if (thumbsRef.current) {
      const activeThumb = thumbsRef.current.children[activeIndex] as HTMLElement;
      if (activeThumb) {
        activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeIndex]);

  const current = items[activeIndex];

  return (
    <div className="screenshot-showcase">
      {/* Header */}
      <div className="screenshot-showcase-header">
        <div className="screenshot-showcase-title-row">
          <div
            className="screenshot-showcase-icon"
            style={{ backgroundColor: current.color }}
          >
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
            <ChevronLeft size={16} />
          </button>
          <span>{activeIndex + 1} / {items.length}</span>
          <button
            className="screenshot-showcase-nav-btn"
            onClick={() => handleSlideChange(activeIndex < items.length - 1 ? activeIndex + 1 : 0)}
            aria-label={isZh ? '下一个' : 'Next'}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className={`screenshot-showcase-preview ${isTransitioning ? 'transitioning' : ''}`}>
        {/* Browser Chrome */}
        <div className="screenshot-browser-chrome">
          <div className="browser-dots">
            <span className="dot dot-red" />
            <span className="dot dot-yellow" />
            <span className="dot dot-green" />
          </div>
          <div className="browser-title">
            <span className="browser-url">pinkernelseo.com/{current.id}</span>
          </div>
          <div className="browser-actions">
            <span className="browser-action" />
            <span className="browser-action" />
            <span className="browser-action" />
          </div>
        </div>

        {/* Preview Content */}
        <div className="screenshot-showcase-content">
          <AppPreview previewId={current.id} className="screenshot-showcase-app" />
        </div>
      </div>

      {/* Features */}
      <div className="screenshot-showcase-features">
        {(isZh ? current.featuresZh : current.featuresEn).map((feature, i) => (
          <span
            key={i}
            className="screenshot-showcase-feature"
            style={{ animationDelay: `${i * 60}ms`, '--feat-color': current.color } as React.CSSProperties}
          >
            {current.icon}
            {feature}
          </span>
        ))}
      </div>

      {/* Thumbnails */}
      <div className="screenshot-showcase-thumbs" ref={thumbsRef}>
        {items.map((item, index) => (
          <button
            key={item.id}
            className={`screenshot-showcase-thumb ${index === activeIndex ? 'active' : ''}`}
            onClick={() => handleSlideChange(index)}
            style={{ '--thumb-color': item.color } as React.CSSProperties}
            aria-label={isZh ? item.titleZh : item.titleEn}
          >
            <div
              className="screenshot-showcase-thumb-icon"
              style={{ color: item.color, backgroundColor: `${item.color}15` }}
            >
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
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .screenshot-showcase-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: linear-gradient(to right, #f8fafc, #ffffff);
          border-bottom: 1px solid #f1f5f9;
        }

        .screenshot-showcase-title-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .screenshot-showcase-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        .screenshot-showcase-title-row h3 {
          font-family: 'Manrope', -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 15px;
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
          min-width: 40px;
          text-align: center;
          font-weight: 500;
        }

        .screenshot-showcase-nav-btn {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          background: white;
          color: #64748b;
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
          transition: opacity 0.15s, transform 0.15s;
        }

        .screenshot-showcase-preview.transitioning {
          opacity: 0.6;
        }

        /* Browser Chrome */
        .screenshot-browser-chrome {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          background: #1e1e1e;
          border-bottom: 1px solid #333;
        }

        .browser-dots {
          display: flex;
          gap: 5px;
        }

        .dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
        }

        .dot-red { background: #ff5f57; }
        .dot-yellow { background: #febc2e; }
        .dot-green { background: #28c840; }

        .browser-title {
          flex: 1;
          display: flex;
          justify-content: center;
        }

        .browser-url {
          padding: 3px 10px;
          background: #2a2a2a;
          border: 1px solid #3a3a3a;
          border-radius: 4px;
          font-size: 9px;
          color: #888;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }

        .browser-actions {
          display: flex;
          gap: 3px;
        }

        .browser-action {
          width: 12px;
          height: 12px;
          border-radius: 2px;
          background: #444;
        }

        /* Content */
        .screenshot-showcase-content {
          background: #f8fafc;
        }

        .screenshot-showcase-app {
          height: 280px;
          border-radius: 0;
          border: none;
          box-shadow: none;
        }

        /* Features */
        .screenshot-showcase-features {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          padding: 12px 16px;
          border-top: 1px solid #f1f5f9;
          background: #fafbfc;
        }

        .screenshot-showcase-feature {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 10px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          font-size: 11px;
          font-weight: 500;
          color: #475569;
          animation: fadeInScale 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          opacity: 0;
        }

        .screenshot-showcase-feature svg {
          opacity: 0.4;
          color: var(--feat-color, #64748b);
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

        /* Thumbnails */
        .screenshot-showcase-thumbs {
          display: flex;
          gap: 4px;
          padding: 10px 12px;
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
          gap: 3px;
          padding: 6px 8px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          background: white;
          cursor: pointer;
          transition: all 0.15s;
          flex-shrink: 0;
          min-width: 64px;
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
          width: 26px;
          height: 26px;
          border-radius: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .screenshot-showcase-thumb span {
          font-size: 8px;
          font-weight: 600;
          color: #64748b;
          text-align: center;
          white-space: nowrap;
        }

        /* Responsive */
        @media (max-width: 640px) {
          .screenshot-showcase-header {
            flex-direction: column;
            gap: 10px;
            align-items: flex-start;
          }

          .screenshot-showcase-features {
            justify-content: center;
          }

          .screenshot-showcase-thumb span {
            display: none;
          }

          .screenshot-showcase-thumb {
            min-width: 44px;
            padding: 6px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .screenshot-showcase-preview,
          .screenshot-showcase-feature {
            transition: none;
            animation: none;
          }

          .screenshot-showcase-feature {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

export { PREVIEW_CONFIGS };
