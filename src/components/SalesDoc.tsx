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
  OpenInNew,
  AccessTime,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import {
  Search,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { CATEGORIES, type Category, type SubCategory, type Feature } from './SalesDocData';

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
}

function FeatureCard({ feature, isExpanded, onToggle, accentColor }: FeatureCardProps) {
  return (
    <div className="feature-card" style={{ borderLeftColor: accentColor }}>
      <button className="feature-card-header" onClick={onToggle}>
        <div className="feature-card-header-left">
          <span className="feature-name">{feature.name}</span>
          <span className="feature-name-en">{feature.nameEn}</span>
        </div>
        <div className="feature-card-header-right">
          <span className="feature-expand-hint">{isExpanded ? '收起' : '展开'}</span>
          {isExpanded ? (
            <ChevronDown size={18} />
          ) : (
            <ChevronRight size={18} />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="feature-card-body">
          <p className="feature-description">{feature.description}</p>

          <div className="feature-section">
            <div className="feature-section-title">
              <span className="feature-section-num" style={{ backgroundColor: accentColor }}>1</span>
              <span>使用方法</span>
            </div>
            <ol className="feature-steps">
              {feature.usage.map((step, i) => (
                <li key={i} className="feature-step">
                  <span className="step-num" style={{ backgroundColor: `${accentColor}20`, color: accentColor }}>
                    {i + 1}
                  </span>
                  <span className="step-text">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {feature.tips && feature.tips.length > 0 && (
            <div className="feature-section">
              <div className="feature-section-title">
                <span className="feature-section-num" style={{ backgroundColor: accentColor }}>!</span>
                <span>小贴士</span>
              </div>
              <div className="feature-tips">
                {feature.tips.map((tip, i) => (
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
                <span>相关功能</span>
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
}

function SubCategorySection({ sub, accentColor, defaultOpen }: SubCategorySectionProps) {
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
            <span className="subcategory-name">{sub.name}</span>
            <span className="subcategory-name-en">{sub.nameEn}</span>
          </div>
        </div>
        <div className="subcategory-header-right">
          <span className="subcategory-count">{sub.features.length}个功能</span>
          {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </div>
      </button>

      <div
        className="subcategory-content"
        style={{ maxHeight: isOpen ? `${(contentHeight as number) + 16}px` : '0' }}
      >
        <div ref={contentRef} className="subcategory-content-inner">
          <p className="subcategory-desc">{sub.description}</p>
          <div className="subcategory-controls">
            <button className="subcategory-toggle-all" onClick={toggleAll}>
              {expandedFeatures.size === sub.features.length ? '全部收起' : '全部展开'}
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
}

function CategorySection({ category, defaultOpen }: CategorySectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="category-section" id={`cat-${category.id}`}>
      <button className="category-header" onClick={() => setIsOpen(!isOpen)}>
        <div className="category-header-left">
          <CategoryBadge color={category.color} />
          <div className="category-title-group">
            <span className="category-name">{category.name}</span>
            <span className="category-name-en">{category.nameEn}</span>
          </div>
        </div>
        <div className="category-header-right">
          <span className="category-count">
            {category.subcategories.length}个子类 · {category.subcategories.reduce((acc, sub) => acc + sub.features.length, 0)}个功能
          </span>
          {isOpen ? <ChevronDown size={22} /> : <ChevronRight size={22} />}
        </div>
      </button>

      <div className="category-desc-row">
        <p className="category-desc">{category.description}</p>
      </div>

      <div className={`category-content ${isOpen ? 'open' : ''}`}>
        {category.subcategories.map((sub, idx) => (
          <SubCategorySection
            key={sub.id}
            sub={sub}
            accentColor={category.color}
            defaultOpen={idx === 0}
          />
        ))}
      </div>
    </div>
  );
}

export function SalesDoc() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

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
            f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            f.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
              <span className="sales-doc-brand-sub">产品功能文档</span>
            </div>
          </div>
          <div className="sales-doc-topbar-center">
            <div className={`sales-doc-search ${showSearch ? 'active' : ''}`}>
              <Search size={18} />
              <input
                ref={searchRef}
                type="text"
                placeholder="搜索功能..."
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
            <div className="sales-doc-stats">
              <span className="sales-doc-stat-num">{CATEGORIES.length}</span>
              <span className="sales-doc-stat-label">大分类</span>
              <span className="sales-doc-stat-sep">·</span>
              <span className="sales-doc-stat-num">{totalFeatures}</span>
              <span className="sales-doc-stat-label">个功能</span>
            </div>
          </div>
        </div>
      </header>

      <div className="sales-doc-layout">
        {/* Sidebar Navigation */}
        <nav className="sales-doc-sidebar">
          <div className="sales-doc-sidebar-header">
            <MenuBook sx={{ fontSize: 16 }} />
            <span>功能导航</span>
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
                <span className="sales-doc-nav-name">{cat.name}</span>
                <span className="sales-doc-nav-en">{cat.nameEn}</span>
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
                <span>PinKernel 产品功能文档</span>
              </div>
              <h1 className="sales-doc-hero-title">
                完整的功能指南
              </h1>
              <p className="sales-doc-hero-subtitle">
                了解 PinKernel 平台的每一个功能，从快速入门到高级用法，全部收录。
                共 {CATEGORIES.length} 个功能分类，{totalFeatures} 个功能点，助您充分利用平台能力。
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
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Search Results Banner */}
          {searchQuery && (
            <div className="sales-doc-search-results">
              <div className="search-results-inner">
                <Search size={18} className="search-icon-blue" />
                <span>
                  找到 <strong>{filteredCategories.reduce((acc, c) => acc + c.subcategories.reduce((a, s) => a + s.features.length, 0), 0)}</strong> 个与 "
                  <strong>{searchQuery}</strong>" 相关的结果
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
              />
            ))}

            {filteredCategories.length === 0 && (
              <div className="sales-doc-empty">
                <Search size={48} />
                <h3>未找到相关功能</h3>
                <p>尝试使用不同的关键词搜索</p>
              </div>
            )}
          </div>
        </main>
      </div>

      <style>{`
        .sales-doc {
          min-height: 100vh;
          background: #f8fafc;
        }

        /* Topbar */
        .sales-doc-topbar {
          position: sticky;
          top: 0;
          z-index: 100;
          background: white;
          border-bottom: 1px solid #e2e8f0;
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
          background: #1e3a5f;
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
          color: #0f172a;
          letter-spacing: -0.02em;
          line-height: 1.1;
        }

        .sales-doc-brand-sub {
          display: block;
          font-size: 10px;
          color: #94a3b8;
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
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          transition: all 0.2s;
          color: #94a3b8;
        }

        .sales-doc-search.active {
          background: white;
          border-color: #0ea5e9;
          box-shadow: 0 0 0 3px rgba(14,165,233,0.1);
        }

        .sales-doc-search-input {
          flex: 1;
          border: none;
          background: transparent;
          font-size: 14px;
          color: #0f172a;
          outline: none;
        }

        .sales-doc-search-input::placeholder {
          color: #94a3b8;
        }

        .sales-doc-search-clear {
          width: 20px;
          height: 20px;
          border-radius: 999px;
          background: #e2e8f0;
          border: none;
          cursor: pointer;
          font-size: 14px;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          line-height: 1;
        }

        .sales-doc-topbar-right {
          flex-shrink: 0;
        }

        .sales-doc-stats {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          color: #64748b;
        }

        .sales-doc-stat-num {
          font-weight: 700;
          color: #0f172a;
        }

        .sales-doc-stat-sep {
          color: #cbd5e1;
        }

        .sales-doc-stat-label {
          color: #64748b;
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
          background: white;
          border-right: 1px solid #e2e8f0;
        }

        .sales-doc-sidebar-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #94a3b8;
          padding: 0 8px 12px;
          border-bottom: 1px solid #f1f5f9;
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
          background: #f8fafc;
        }

        .sales-doc-nav-item.active {
          background: #f1f5f9;
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
          color: #0f172a;
          flex: 1;
        }

        .sales-doc-nav-en {
          font-size: 11px;
          color: #94a3b8;
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
        }

        /* Hero */
        .sales-doc-hero {
          padding: 56px 0 48px;
          border-bottom: 1px solid #f1f5f9;
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
          background: #f0f9ff;
          color: #0284c7;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 20px;
        }

        .sales-doc-hero-title {
          font-family: 'Manrope', sans-serif;
          font-size: clamp(2rem, 4vw, 2.75rem);
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.03em;
          line-height: 1.15;
          margin: 0 0 16px;
        }

        .sales-doc-hero-subtitle {
          font-size: 16px;
          color: #475569;
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
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          color: #475569;
          cursor: pointer;
          transition: all 0.15s;
        }

        .sales-doc-hero-tag:hover {
          border-color: var(--tag-color);
          color: var(--tag-color);
          background: rgba(0,0,0,0.02);
        }

        .tag-dot {
          width: 6px;
          height: 6px;
          border-radius: 999px;
        }

        .search-icon-blue {
          color: #0ea5e9;
        }

        /* Search Results */
        .sales-doc-search-results {
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 10px;
          padding: 12px 16px;
          margin-bottom: 24px;
        }

        .search-results-inner {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #0284c7;
        }

        /* Categories */
        .sales-doc-categories {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Category Section */
        .category-section {
          background: white;
          border: 1px solid #e2e8f0;
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
          background: white;
          cursor: pointer;
          transition: background 0.15s;
        }

        .category-header:hover {
          background: #f8fafc;
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
          color: #0f172a;
          letter-spacing: -0.02em;
        }

        .category-name-en {
          font-size: 12px;
          color: #94a3b8;
          font-weight: 500;
        }

        .category-header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .category-count {
          font-size: 12px;
          color: #94a3b8;
        }

        .category-desc-row {
          padding: 0 24px 20px;
          border-bottom: 1px solid #f1f5f9;
        }

        .category-desc {
          font-size: 14px;
          color: #475569;
          margin: 0;
          line-height: 1.6;
        }

        .category-content {
          overflow: hidden;
          max-height: 0;
          transition: max-height 0.4s ease;
        }

        .category-content.open {
          max-height: 100000px;
        }

        /* SubCategory Section */
        .subcategory-section {
          border-bottom: 1px solid #f1f5f9;
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
          background: #f8fafc;
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
          color: #0f172a;
        }

        .subcategory-name-en {
          font-size: 11px;
          color: #94a3b8;
        }

        .subcategory-header-right {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #94a3b8;
        }

        .subcategory-count {
          font-size: 12px;
          color: #94a3b8;
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
          color: #64748b;
          margin: 0 0 12px;
          line-height: 1.6;
        }

        .subcategory-controls {
          margin-bottom: 12px;
        }

        .subcategory-toggle-all {
          font-size: 12px;
          font-weight: 500;
          color: #64748b;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          transition: all 0.15s;
        }

        .subcategory-toggle-all:hover {
          background: #f1f5f9;
          color: #1e3a5f;
        }

        .feature-cards {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        /* Feature Card */
        .feature-card {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          border-left-width: 3px;
          background: white;
          overflow: hidden;
          transition: box-shadow 0.2s;
        }

        .feature-card:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
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
          background: #f8fafc;
        }

        .feature-card-header-left {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .feature-name {
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
        }

        .feature-name-en {
          font-size: 11px;
          color: #94a3b8;
        }

        .feature-card-header-right {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #94a3b8;
          flex-shrink: 0;
        }

        .feature-expand-hint {
          font-size: 11px;
          color: #94a3b8;
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
          color: #475569;
          line-height: 1.7;
          margin: 0 0 16px;
          padding: 12px 14px;
          background: #f8fafc;
          border-radius: 8px;
          border-left: 2px solid #e2e8f0;
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
          color: #0f172a;
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
          color: #475569;
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
          color: #475569;
          line-height: 1.5;
          padding: 6px 10px;
          background: #f0fdf4;
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
          background: #f1f5f9;
          color: #64748b;
          border-radius: 6px;
          font-weight: 500;
        }

        /* Empty */
        .sales-doc-empty {
          text-align: center;
          padding: 80px 24px;
          color: #94a3b8;
        }

        .sales-doc-empty h3 {
          font-family: 'Manrope', sans-serif;
          font-size: 18px;
          font-weight: 700;
          color: #64748b;
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
