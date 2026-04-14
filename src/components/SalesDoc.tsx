import React, { useState, useEffect, useRef } from 'react';
import {
  Dashboard,
  PushPin,
  RateReview,
  Edit,
  History,
  CalendarToday,
  BarChart,
  Public,
  Settings,
  SmartToy,
  Lightbulb,
  Map,
  CheckCircle,
  ArrowForward,
  ArrowBack,
  MenuBook,
  Star,
  AutoAwesome,
  Bolt,
  AccessTime,
} from '@mui/icons-material';
import {
  Search,
  ChevronDown,
  ChevronRight,
  Globe,
  Monitor,
} from 'lucide-react';
import { CATEGORIES, type Category, type SubCategory, type Feature } from './SalesDocData';
import { ScreenshotShowcase } from './ScreenshotGallery';
import { useLanguage } from '../contexts/LanguageContext';

const ICON_MAP: Record<string, React.ElementType> = {
  Dashboard,
  Listings: PushPin,
  Reviews: RateReview,
  BulkEdits: Edit,
  EditsLog: History,
  Publishing: CalendarToday,
  Reports: BarChart,
  SEO: Public,
  Settings,
  Automations: SmartToy,
  Optimization: Lightbulb,
  Grid: Map,
  Overview: Dashboard,
  LocationList: PushPin,
  EditBusiness: Edit,
  ReviewList: RateReview,
  Wizard: AutoAwesome,
  LogViewer: History,
  Calendar: CalendarToday,
  CreatePost: Edit,
  Performance: BarChart,
  Citations: Public,
  QuickWins: Lightbulb,
  RealReviews: Star,
  RedNote: Star,
  ApiKeys: Bolt,
  Language: Public,
};

function FeatureIcon({ name, size = 18 }: { name: string; size?: number }) {
  const Icon = ICON_MAP[name] || Star;
  return <Icon sx={{ fontSize: size }} />;
}

function CategoryBadge({ color }: { color: string }) {
  return (
    <span
      className="inline-flex items-center justify-center w-8 h-8 rounded-xl text-white font-bold text-sm shadow-md shrink-0"
      style={{ backgroundColor: color }}
    >
      <MenuBook sx={{ fontSize: 16 }} />
    </span>
  );
}

interface FeatureCardProps {
  feature: Feature;
  isExpanded: boolean;
  onToggle: () => void;
  accentColor: string;
  isZh: boolean;
}

function FeatureCard({ feature, isExpanded, onToggle, accentColor, isZh }: FeatureCardProps) {
  return (
    <div className="feature-card" style={{ borderLeftColor: accentColor }}>
      <button className="feature-card-header" onClick={onToggle}>
        <div className="feature-card-header-left">
          <span className="feature-name">{isZh ? feature.name : feature.nameEn}</span>
          <span className="feature-name-en">{isZh ? feature.nameEn : feature.name}</span>
        </div>
        <div className="feature-card-header-right">
          <span className="feature-expand-hint">{isExpanded ? (isZh ? '收起' : 'Collapse') : (isZh ? '展开' : 'Expand')}</span>
          {isExpanded ? (
            <ChevronDown size={18} />
          ) : (
            <ChevronRight size={18} />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="feature-card-body">
          <p className="feature-description">{isZh ? feature.description : feature.descriptionEn}</p>

          <div className="feature-section">
            <div className="feature-section-title">
              <span className="feature-section-num" style={{ backgroundColor: accentColor }}>1</span>
              <span>{isZh ? '使用方法' : 'How to Use'}</span>
            </div>
            <ol className="feature-steps">
              {(isZh ? feature.usage : feature.usageEn).map((step, i) => (
                <li key={i} className="feature-step">
                  <span className="step-num" style={{ backgroundColor: `${accentColor}20`, color: accentColor }}>
                    {i + 1}
                  </span>
                  <span className="step-text">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {(isZh ? feature.tips : feature.tipsEn)?.length > 0 && (
            <div className="feature-section">
              <div className="feature-section-title">
                <span className="feature-section-num" style={{ backgroundColor: accentColor }}>!</span>
                <span>{isZh ? '小贴士' : 'Tips'}</span>
              </div>
              <div className="feature-tips">
                {(isZh ? feature.tips : feature.tipsEn).map((tip, i) => (
                  <div key={i} className="feature-tip">
                    <CheckCircle sx={{ fontSize: 14, color: accentColor }} />
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {feature.relatedFeatures && feature.relatedFeatures.length > 0 && (
            <div className="feature-section">
              <div className="feature-section-title">
                <span className="feature-section-num" style={{ backgroundColor: accentColor }}>
                  <ArrowForward sx={{ fontSize: 12 }} />
                </span>
                <span>{isZh ? '相关功能' : 'Related Features'}</span>
              </div>
              <div className="feature-related">
                {feature.relatedFeatures.map((rel, i) => (
                  <span key={i} className="feature-related-tag">{rel}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface SubCategorySectionProps {
  sub: SubCategory;
  accentColor: string;
  defaultOpen: boolean;
  isZh: boolean;
}

function SubCategorySection({ sub, accentColor, defaultOpen, isZh }: SubCategorySectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(new Set());
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(defaultOpen ? 'auto' : 0);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(isOpen ? contentRef.current.scrollHeight : 0);
    }
  }, [isOpen, expandedFeatures]);

  const toggleFeature = (id: string) => {
    setExpandedFeatures((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (expandedFeatures.size === sub.features.length) {
      setExpandedFeatures(new Set());
    } else {
      setExpandedFeatures(new Set(sub.features.map((f) => f.id)));
    }
  };

  return (
    <div className="subcategory-section">
      <button className="subcategory-header" onClick={() => setIsOpen(!isOpen)}>
        <div className="subcategory-header-left">
          <div className="subcategory-icon" style={{ backgroundColor: `${accentColor}15`, color: accentColor }}>
            <FeatureIcon name={sub.icon} size={20} />
          </div>
          <div className="subcategory-title-group">
            <span className="subcategory-name">{isZh ? sub.name : sub.nameEn}</span>
            <span className="subcategory-name-en">{isZh ? sub.nameEn : sub.name}</span>
          </div>
        </div>
        <div className="subcategory-header-right">
          <span className="subcategory-count">{sub.features.length}{isZh ? '个功能' : ' features'}</span>
          {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </div>
      </button>

      <div
        className="subcategory-content"
        style={{ maxHeight: isOpen ? `${(contentHeight as number) + 16}px` : '0' }}
      >
        <div ref={contentRef} className="subcategory-content-inner">
          <p className="subcategory-desc">{isZh ? sub.description : sub.descriptionEn}</p>
          <div className="subcategory-controls">
            <button className="subcategory-toggle-all" onClick={toggleAll}>
              {expandedFeatures.size === sub.features.length ? (isZh ? '全部收起' : 'Collapse All') : (isZh ? '全部展开' : 'Expand All')}
            </button>
          </div>
          <div className="feature-cards">
            {sub.features.map((feature) => (
              <FeatureCard
                key={feature.id}
                feature={feature}
                isExpanded={expandedFeatures.has(feature.id)}
                onToggle={() => toggleFeature(feature.id)}
                accentColor={accentColor}
                isZh={isZh}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface CategorySectionProps {
  category: Category;
  defaultOpen: boolean;
  isZh: boolean;
}

function CategorySection({ category, defaultOpen, isZh }: CategorySectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="category-section" id={`cat-${category.id}`}>
      <button className="category-header" onClick={() => setIsOpen(!isOpen)}>
        <div className="category-header-left">
          <CategoryBadge color={category.color} />
          <div className="category-title-group">
            <span className="category-name">{isZh ? category.name : category.nameEn}</span>
            <span className="category-name-en">{isZh ? category.nameEn : category.name}</span>
          </div>
        </div>
        <div className="category-header-right">
          <span className="category-count">
            {category.subcategories.length}{isZh ? '个子类' : ' subcategories'} · {category.subcategories.reduce((acc, sub) => acc + sub.features.length, 0)}{isZh ? '个功能' : ' features'}
          </span>
          {isOpen ? <ChevronDown size={22} /> : <ChevronRight size={22} />}
        </div>
      </button>

      <div className="category-desc-row">
        <p className="category-desc">{isZh ? category.description : category.descriptionEn}</p>
      </div>

      <div className={`category-content ${isOpen ? 'open' : ''}`}>
        {category.subcategories.map((sub, idx) => (
          <SubCategorySection
            key={sub.id}
            sub={sub}
            accentColor={category.color}
            defaultOpen={idx === 0}
            isZh={isZh}
          />
        ))}
      </div>
    </div>
  );
}

export function SalesDoc() {
  const { language, setLanguage, t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const isZh = language === 'zh';
  const salesDocTitle = t('nav.salesDoc');

  const totalFeatures = CATEGORIES.reduce(
    (acc, cat) => acc + cat.subcategories.reduce((a, sub) => a + sub.features.length, 0),
    0
  );

  const filteredCategories = CATEGORIES.map((cat) => ({
    ...cat,
    subcategories: cat.subcategories
      .map((sub) => ({
        ...sub,
        features: sub.features.filter(
          (f) =>
            !searchQuery ||
            (isZh ? f.name : f.nameEn).toLowerCase().includes(searchQuery.toLowerCase()) ||
            (isZh ? f.nameEn : f.name).toLowerCase().includes(searchQuery.toLowerCase()) ||
            f.description.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      }))
      .filter((sub) => sub.features.length > 0),
  })).filter((cat) => cat.subcategories.length > 0);

  const handleNavClick = (catId: string) => {
    setActiveCategory(catId);
    const el = document.getElementById(`cat-${catId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const sections = CATEGORIES.map((cat) => document.getElementById(`cat-${cat.id}`));
      const scrollY = window.scrollY + 120;
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = sections[i];
        if (el && el.offsetTop <= scrollY) {
          setActiveCategory(CATEGORIES[i].id);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (showSearch && searchRef.current) {
      searchRef.current.focus();
    }
  }, [showSearch]);

  const handleLangToggle = () => {
    setLanguage(isZh ? 'en' : 'zh');
  };

  return (
    <div className="sales-doc">
      {/* Topbar */}
      <header className="sales-doc-topbar">
        <div className="sales-doc-topbar-inner">
          <div className="sales-doc-brand">
            <div className="sales-doc-logo">
              <AutoAwesome sx={{ fontSize: 20, color: '#fff' }} />
            </div>
            <div className="sales-doc-brand-text">
              <span className="sales-doc-brand-name">PinKernel</span>
              <span className="sales-doc-brand-sub">{salesDocTitle}</span>
            </div>
          </div>
          <div className="sales-doc-topbar-center">
            <div className={`sales-doc-search ${showSearch ? 'active' : ''}`}>
              <Search size={18} />
              <input
                ref={searchRef}
                type="text"
                placeholder={isZh ? '搜索功能...' : 'Search features...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="sales-doc-search-input"
                onFocus={() => setShowSearch(true)}
                onBlur={() => setTimeout(() => setShowSearch(false), 200)}
              />
              {searchQuery && (
                <button className="sales-doc-search-clear" onClick={() => setSearchQuery('')}>
                  ×
                </button>
              )}
            </div>
          </div>
          <div className="sales-doc-topbar-right">
            {/* Language Toggle */}
            <button className="sales-doc-lang-toggle" onClick={handleLangToggle}>
              <Globe size={16} />
              <span>{isZh ? 'EN' : '中文'}</span>
            </button>
            <div className="sales-doc-stats">
              <span className="sales-doc-stat-num">{CATEGORIES.length}</span>
              <span className="sales-doc-stat-label">{isZh ? '大分类' : 'Categories'}</span>
              <span className="sales-doc-stat-sep">·</span>
              <span className="sales-doc-stat-num">{totalFeatures}</span>
              <span className="sales-doc-stat-label">{isZh ? '个功能' : 'Features'}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="sales-doc-layout">
        {/* Sidebar Navigation */}
        <nav className="sales-doc-sidebar">
          <div className="sales-doc-sidebar-header">
            <MenuBook sx={{ fontSize: 16 }} />
            <span>{isZh ? '功能导航' : 'Navigation'}</span>
          </div>
          <div className="sales-doc-nav-list">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className={`sales-doc-nav-item ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => handleNavClick(cat.id)}
                style={{ '--accent': cat.color } as React.CSSProperties}
              >
                <span
                  className="sales-doc-nav-dot"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="sales-doc-nav-name">{isZh ? cat.name : cat.nameEn}</span>
                <span className="sales-doc-nav-en">{isZh ? cat.nameEn : cat.name}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Main Content */}
        <main className="sales-doc-main">
          {/* Hero */}
          <div className="sales-doc-hero">
            <div className="sales-doc-hero-inner">
              <div className="sales-doc-hero-badge">
                <MenuBook sx={{ fontSize: 14 }} />
                <span>PinKernel {salesDocTitle}</span>
              </div>
              <h1 className="sales-doc-hero-title">
                {isZh ? '完整的功能指南' : 'Complete Feature Guide'}
              </h1>
              <p className="sales-doc-hero-subtitle">
                {isZh
                  ? `了解 PinKernel 平台的每一个功能，从快速入门到高级用法，全部收录。共 ${CATEGORIES.length} 个功能分类，${totalFeatures} 个功能点，助您充分利用平台能力。`
                  : `Learn every feature of the PinKernel platform, from quick start to advanced usage. ${CATEGORIES.length} feature categories, ${totalFeatures} features to help you make the most of the platform.`
                }
              </p>
              <div className="sales-doc-hero-tags">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    className="sales-doc-hero-tag"
                    style={{ '--tag-color': cat.color } as React.CSSProperties}
                    onClick={() => handleNavClick(cat.id)}
                  >
                    <span
                      className="tag-dot"
                      style={{ backgroundColor: cat.color }}
                    />
                    {isZh ? cat.name : cat.nameEn}
                  </button>
                ))}
              </div>

              {/* Screenshot Showcase */}
              <div className="sales-doc-hero-screenshots">
                <div className="sales-doc-screenshots-header">
                  <Monitor size={16} />
                  <span>{isZh ? '功能界面预览' : 'Feature Interface Preview'}</span>
                  <span className="sales-doc-screenshots-count">{isZh ? '共13个功能模块' : '13 feature modules'}</span>
                </div>
                <ScreenshotShowcase />
              </div>
            </div>
          </div>

          {/* Search Results Banner */}
          {searchQuery && (
            <div className="sales-doc-search-results">
              <div className="search-results-inner">
                <Search size={18} className="search-icon-blue" />
                <span>
                  {isZh ? '找到 ' : 'Found '}<strong>{filteredCategories.reduce((acc, c) => acc + c.subcategories.reduce((a, s) => a + s.features.length, 0), 0)}</strong> {isZh ? '个与 "' : ' results for "'}<strong>{searchQuery}</strong>{isZh ? '" 相关的结果' : '"'}
                </span>
              </div>
            </div>
          )}

          {/* Categories */}
          <div className="sales-doc-categories">
            {filteredCategories.map((cat, idx) => (
              <CategorySection
                key={cat.id}
                category={cat}
                defaultOpen={idx === 0 && !searchQuery}
                isZh={isZh}
              />
            ))}

            {filteredCategories.length === 0 && (
              <div className="sales-doc-empty">
                <Search size={48} />
                <h3>{isZh ? '未找到相关功能' : 'No Results Found'}</h3>
                <p>{isZh ? '尝试使用不同的关键词搜索' : 'Try using different keywords'}</p>
              </div>
            )}
          </div>
        </main>
      </div>

      <style>{`
        .sales-doc {
          min-height: 100vh;
          background: var(--color-surface);
          color: var(--color-text-primary);
        }

        /* Topbar */
        .sales-doc-topbar {
          position: sticky;
          top: 0;
          z-index: 100;
          background: var(--color-surface-raised);
          border-bottom: 1px solid var(--color-border);
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }

        .sales-doc-topbar-inner {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 24px;
          height: 60px;
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .sales-doc-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .sales-doc-logo {
          width: 36px;
          height: 36px;
          background: var(--color-primary);
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sales-doc-brand-name {
          display: block;
          font-family: 'Manrope', sans-serif;
          font-size: 15px;
          font-weight: 800;
          color: var(--color-text-primary);
          letter-spacing: -0.02em;
          line-height: 1.1;
        }

        .sales-doc-brand-sub {
          display: block;
          font-size: 10px;
          color: var(--color-text-muted);
          font-weight: 500;
          letter-spacing: 0.02em;
          margin-top: 1px;
        }

        .sales-doc-topbar-center {
          flex: 1;
          max-width: 400px;
        }

        .sales-doc-search {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 10px;
          transition: all 0.2s;
          color: var(--color-text-muted);
        }

        .sales-doc-search.active {
          background: var(--color-surface-raised);
          border-color: var(--color-accent);
          box-shadow: 0 0 0 3px rgba(79, 172, 254, 0.1);
        }

        .sales-doc-search-input {
          flex: 1;
          border: none;
          background: transparent;
          font-size: 14px;
          color: var(--color-text-primary);
          outline: none;
        }

        .sales-doc-search-input::placeholder {
          color: var(--color-text-muted);
        }

        .sales-doc-search-clear {
          width: 20px;
          height: 20px;
          border-radius: 999px;
          background: var(--color-border);
          border: none;
          cursor: pointer;
          font-size: 14px;
          color: var(--color-text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          line-height: 1;
        }

        .sales-doc-topbar-right {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-shrink: 0;
        }

        .sales-doc-lang-toggle {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 8px;
          color: var(--color-text-primary);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }

        .sales-doc-lang-toggle:hover {
          background: var(--color-border);
        }

        .sales-doc-stats {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          color: var(--color-text-secondary);
        }

        .sales-doc-stat-num {
          font-weight: 700;
          color: var(--color-text-primary);
        }

        .sales-doc-stat-sep {
          color: var(--color-border-strong);
        }

        .sales-doc-stat-label {
          color: var(--color-text-secondary);
        }

        /* Layout */
        .sales-doc-layout {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          gap: 0;
          min-height: calc(100vh - 60px);
        }

        /* Sidebar */
        .sales-doc-sidebar {
          width: 260px;
          flex-shrink: 0;
          position: sticky;
          top: 60px;
          height: calc(100vh - 60px);
          overflow-y: auto;
          padding: 24px 16px;
          background: var(--color-surface-raised);
          border-right: 1px solid var(--color-border);
        }

        .sales-doc-sidebar-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--color-text-muted);
          padding: 0 8px 12px;
          border-bottom: 1px solid var(--color-divider);
          margin-bottom: 12px;
        }

        .sales-doc-nav-list {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .sales-doc-nav-item {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 8px 10px;
          border: none;
          border-radius: 8px;
          background: transparent;
          cursor: pointer;
          text-align: left;
          transition: all 0.15s;
        }

        .sales-doc-nav-item:hover {
          background: var(--color-surface);
        }

        .sales-doc-nav-item.active {
          background: var(--color-primary-muted);
        }

        .sales-doc-nav-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          flex-shrink: 0;
        }

        .sales-doc-nav-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text-primary);
          flex: 1;
        }

        .sales-doc-nav-en {
          font-size: 11px;
          color: var(--color-text-muted);
          flex-shrink: 0;
        }

        .sales-doc-nav-item.active .sales-doc-nav-name {
          color: var(--accent);
        }

        /* Main Content */
        .sales-doc-main {
          flex: 1;
          min-width: 0;
          padding: 0 32px 80px;
          overflow-x: hidden;
        }

        /* Hero */
        .sales-doc-hero {
          padding: 56px 0 48px;
          border-bottom: 1px solid var(--color-divider);
          margin-bottom: 40px;
        }

        .sales-doc-hero-inner {
          max-width: 720px;
        }

        .sales-doc-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          background: var(--color-accent-muted);
          color: var(--color-accent);
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 20px;
        }

        .sales-doc-hero-title {
          font-family: 'Manrope', sans-serif;
          font-size: clamp(2rem, 4vw, 2.75rem);
          font-weight: 800;
          color: var(--color-text-primary);
          letter-spacing: -0.03em;
          line-height: 1.15;
          margin: 0 0 16px;
        }

        .sales-doc-hero-subtitle {
          font-size: 16px;
          color: var(--color-text-secondary);
          line-height: 1.7;
          margin: 0 0 28px;
          max-width: 600px;
        }

        .sales-doc-hero-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .sales-doc-hero-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: var(--color-surface-raised);
          border: 1px solid var(--color-border);
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          color: var(--color-text-secondary);
          cursor: pointer;
          transition: all 0.15s;
        }

        .sales-doc-hero-tag:hover {
          border-color: var(--tag-color);
          color: var(--tag-color);
          background: var(--color-surface);
        }

        .tag-dot {
          width: 6px;
          height: 6px;
          border-radius: 999px;
        }

        /* Screenshot Showcase */
        .sales-doc-hero-screenshots {
          margin-top: 36px;
          padding-top: 28px;
          border-top: 1px solid var(--color-divider);
        }

        .sales-doc-screenshots-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text-secondary);
          margin-bottom: 16px;
        }

        .sales-doc-screenshots-count {
          margin-left: auto;
          font-size: 11px;
          font-weight: 500;
          color: var(--color-text-muted);
        }

        .search-icon-blue {
          color: var(--color-accent);
        }

        /* Search Results */
        .sales-doc-search-results {
          background: var(--color-accent-muted);
          border: 1px solid var(--color-accent);
          border-radius: 10px;
          padding: 12px 16px;
          margin-bottom: 24px;
        }

        .search-results-inner {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: var(--color-accent);
        }

        /* Categories */
        .sales-doc-categories {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Category Section */
        .category-section {
          background: var(--color-surface-raised);
          border: 1px solid var(--color-border);
          border-radius: 16px;
          overflow: hidden;
        }

        .category-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 20px 24px;
          border: none;
          background: var(--color-surface-raised);
          cursor: pointer;
          transition: background 0.15s;
        }

        .category-header:hover {
          background: var(--color-surface);
        }

        .category-header-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .category-title-group {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .category-name {
          font-family: 'Manrope', sans-serif;
          font-size: 17px;
          font-weight: 700;
          color: var(--color-text-primary);
          letter-spacing: -0.02em;
        }

        .category-name-en {
          font-size: 12px;
          color: var(--color-text-muted);
          font-weight: 500;
        }

        .category-header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .category-count {
          font-size: 12px;
          color: var(--color-text-muted);
        }

        .category-desc-row {
          padding: 0 24px 20px;
          border-bottom: 1px solid var(--color-divider);
        }

        .category-desc {
          font-size: 14px;
          color: var(--color-text-secondary);
          margin: 0;
          line-height: 1.6;
        }

        .category-content {
          overflow: hidden;
          max-height: 0;
          transition: max-height 0.4s ease;
        }

        .category-content.open {
          max-height: none;
        }

        /* SubCategory Section */
        .subcategory-section {
          border-bottom: 1px solid var(--color-divider);
        }

        .subcategory-section:last-child {
          border-bottom: none;
        }

        .subcategory-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 16px 24px;
          border: none;
          background: transparent;
          cursor: pointer;
          transition: background 0.15s;
        }

        .subcategory-header:hover {
          background: var(--color-surface);
        }

        .subcategory-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .subcategory-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .subcategory-title-group {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .subcategory-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--color-text-primary);
        }

        .subcategory-name-en {
          font-size: 11px;
          color: var(--color-text-muted);
        }

        .subcategory-header-right {
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--color-text-muted);
        }

        .subcategory-count {
          font-size: 12px;
          color: var(--color-text-muted);
        }

        .subcategory-content {
          overflow: hidden;
          transition: max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .subcategory-content-inner {
          padding: 0 24px 20px;
        }

        .subcategory-desc {
          font-size: 13px;
          color: var(--color-text-secondary);
          margin: 0 0 12px;
          line-height: 1.6;
        }

        .subcategory-controls {
          margin-bottom: 12px;
        }

        .subcategory-toggle-all {
          font-size: 12px;
          font-weight: 500;
          color: var(--color-text-secondary);
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          transition: all 0.15s;
        }

        .subcategory-toggle-all:hover {
          background: var(--color-surface);
          color: var(--color-primary);
        }

        .feature-cards {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        /* Feature Card */
        .feature-card {
          border: 1px solid var(--color-border);
          border-radius: 12px;
          border-left-width: 3px;
          background: var(--color-surface);
          overflow: hidden;
          transition: box-shadow 0.2s;
        }

        .feature-card:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }

        .feature-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 14px 16px;
          border: none;
          background: transparent;
          cursor: pointer;
          text-align: left;
          transition: background 0.15s;
        }

        .feature-card-header:hover {
          background: var(--color-surface-raised);
        }

        .feature-card-header-left {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .feature-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--color-text-primary);
        }

        .feature-name-en {
          font-size: 11px;
          color: var(--color-text-muted);
        }

        .feature-card-header-right {
          display: flex;
          align-items: center;
          gap: 4px;
          color: var(--color-text-muted);
          flex-shrink: 0;
        }

        .feature-expand-hint {
          font-size: 11px;
          color: var(--color-text-muted);
        }

        .feature-card-body {
          padding: 0 16px 16px;
          animation: slideDown 0.2s ease-out;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .feature-description {
          font-size: 13px;
          color: var(--color-text-secondary);
          line-height: 1.7;
          margin: 0 0 16px;
          padding: 12px 14px;
          background: var(--color-surface-raised);
          border-radius: 8px;
          border-left: 2px solid var(--color-border);
        }

        .feature-section {
          margin-bottom: 14px;
        }

        .feature-section:last-child {
          margin-bottom: 0;
        }

        .feature-section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 700;
          color: var(--color-text-primary);
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .feature-section-num {
          width: 20px;
          height: 20px;
          border-radius: 6px;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .feature-steps {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .feature-step {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .step-num {
          width: 22px;
          height: 22px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .step-text {
          font-size: 13px;
          color: var(--color-text-secondary);
          line-height: 1.6;
          padding-top: 2px;
        }

        .feature-tips {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .feature-tip {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 12px;
          color: var(--color-text-secondary);
          line-height: 1.5;
          padding: 6px 10px;
          background: var(--color-success-bg);
          border-radius: 6px;
        }

        .feature-related {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .feature-related-tag {
          font-size: 11px;
          padding: 3px 8px;
          background: var(--color-surface);
          color: var(--color-text-secondary);
          border-radius: 6px;
          font-weight: 500;
        }

        /* Empty */
        .sales-doc-empty {
          text-align: center;
          padding: 80px 24px;
          color: var(--color-text-muted);
        }

        .sales-doc-empty h3 {
          font-family: 'Manrope', sans-serif;
          font-size: 18px;
          font-weight: 700;
          color: var(--color-text-secondary);
          margin: 16px 0 8px;
        }

        .sales-doc-empty p {
          font-size: 14px;
          margin: 0;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .sales-doc-sidebar {
            display: none;
          }

          .sales-doc-main {
            padding: 0 20px 60px;
          }
        }

        @media (max-width: 640px) {
          .sales-doc-topbar-inner {
            padding: 0 16px;
          }

          .sales-doc-brand-sub,
          .sales-doc-topbar-right,
          .sales-doc-topbar-center {
            display: none;
          }

          .sales-doc-hero {
            padding: 32px 0 32px;
          }

          .sales-doc-hero-title {
            font-size: 1.75rem;
          }

          .sales-doc-hero-tags {
            gap: 6px;
          }

          .sales-doc-hero-tag .tag-dot {
            display: none;
          }

          .category-header,
          .subcategory-header,
          .feature-card-header {
            padding: 14px 16px;
          }

          .category-header-left,
          .subcategory-header-left {
            gap: 10px;
          }

          .category-name {
            font-size: 15px;
          }

          .category-count {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
