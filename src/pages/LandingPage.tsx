import React, { useState, useEffect, useRef } from 'react';
import AuthPage from './AuthPage';
import { Star, Shield, Zap, BarChart3, MessageSquare, Search, Globe, ArrowRight, Check, Sparkles, Play, Users, TrendingUp, MapPin, Phone, Mail, ChevronDown, Menu, X, Lock, CreditCard, Headphones, Bot, Image, Clock, Award } from 'lucide-react';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlight?: boolean;
}

interface PricingTier {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  popular?: boolean;
  gradient: string;
}

export function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [counters, setCounters] = useState({ reviews: 0, businesses: 0, rating: 0 });
  const [typedText, setTypedText] = useState('');
  const heroRef = useRef<HTMLDivElement>(null);

  // If auth mode is active, show auth page
  if (showAuth) {
    return <AuthPage />;
  }

  const fullText = "Your Local SEO Intelligence Platform";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index <= fullText.length) {
        setTypedText(fullText.slice(0, index));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 50);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const animateCounters = () => {
      const targets = { reviews: 50000, businesses: 2500, rating: 4.9 };
      const duration = 2000;
      const steps = 60;
      const interval = duration / steps;

      let step = 0;
      const timer = setInterval(() => {
        step++;
        const progress = step / steps;
        const easeOut = 1 - Math.pow(1 - progress, 3);

        setCounters({
          reviews: Math.round(targets.reviews * easeOut),
          businesses: Math.round(targets.businesses * easeOut),
          rating: Math.round(targets.rating * 10 * easeOut) / 10,
        });

        if (step >= steps) clearInterval(timer);
      }, interval);

      return timer;
    };

    const timer = setTimeout(animateCounters, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    document.querySelectorAll('.scroll-animate').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const features: Feature[] = [
    {
      icon: <Bot className="w-6 h-6" />,
      title: 'AI Review Generation',
      description: 'Generate authentic, human-like reviews with AI. Upload photos, let AI analyze your business, and create reviews that sound genuinely human.',
      highlight: true
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: 'Smart Review Management',
      description: 'Centralize all your reviews from Google in one dashboard. Filter by status, sentiment, and respond instantly with AI-powered replies.',
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Auto-Reply Automations',
      description: 'Set up AI agents that automatically respond to new reviews 24/7. Choose from Professional, Friendly, or Empathetic tones.',
    },
    {
      icon: <Search className="w-6 h-6" />,
      title: 'Local SEO Intelligence',
      description: 'Visualize your local search rankings across multiple grid points. Identify opportunities and track your SEO progress over time.',
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: 'Business Listings Sync',
      description: 'Connect and manage all your Google Business Profiles in one place. Keep your business information accurate and up-to-date.',
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Analytics Dashboard',
      description: 'Track search impressions, map views, website clicks, and more. Get actionable insights to improve your local presence.',
    },
  ];

  const pricingTiers: PricingTier[] = [
    {
      name: 'Starter',
      price: '$49',
      period: '/month',
      description: 'Perfect for small businesses getting started with local SEO.',
      features: [
        '1 Business Location',
        '100 AI Reviews / month',
        'Basic Review Management',
        'Auto-Reply (up to 50)',
        'Email Support',
      ],
      cta: 'Start Free Trial',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    {
      name: 'Professional',
      price: '$149',
      period: '/month',
      description: 'For growing businesses that need advanced automation.',
      features: [
        '5 Business Locations',
        '500 AI Reviews / month',
        'Advanced Analytics Dashboard',
        'Unlimited Auto-Reply',
        'AI Agent Team',
        'Priority Support',
        'SEO Optimization Reports',
      ],
      cta: 'Start Free Trial',
      popular: true,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    },
    {
      name: 'Enterprise',
      price: '$499',
      period: '/month',
      description: 'For agencies and businesses with multiple locations.',
      features: [
        'Unlimited Locations',
        'Unlimited AI Reviews',
        'White-label Reports',
        'API Access',
        'Dedicated Account Manager',
        'Custom Integrations',
        'SLA Guarantee',
      ],
      cta: 'Contact Sales',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    },
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Owner, Golden Leaf Restaurant',
      content: 'PinKernel transformed how we handle reviews. The AI-generated responses sound so natural, and our customers love the quick replies.',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
      rating: 5,
    },
    {
      name: 'Michael Park',
      role: 'Director, AutoCare Plus',
      content: 'Managing 12 locations used to be a nightmare. Now I handle all reviews from one dashboard with auto-replies working 24/7.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      rating: 5,
    },
    {
      name: 'Emily Rodriguez',
      role: 'Marketing Lead, FitLife Gym',
      content: 'The Real Comment feature is a game-changer. We generated authentic reviews with photos and saw a 40% increase in organic traffic.',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
      rating: 5,
    },
  ];

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className={`landing-nav ${isScrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <div className="nav-brand">
            <div className="brand-logo">
              <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
                <defs>
                  <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4facfe" />
                    <stop offset="100%" stopColor="#00f2fe" />
                  </linearGradient>
                </defs>
                <rect width="40" height="40" rx="10" fill="url(#logoGrad)" />
                <path d="M20 8L22.5 14.5L29 15L24 20L25.5 27L20 23.5L14.5 27L16 20L11 15L17.5 14.5L20 8Z" fill="white" />
              </svg>
            </div>
            <span className="brand-name">PinKernel SEO</span>
          </div>

          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#pricing">Pricing</a>
            <a href="#testimonials">Reviews</a>
          </div>

          <div className="nav-actions">
            <button className="btn-nav-secondary" onClick={() => setShowAuth(true)}>
              Sign In
            </button>
            <button className="btn-nav-primary" onClick={() => setShowAuth(true)}>
              Get Started Free
            </button>
          </div>

          <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="mobile-menu">
            <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            <a href="#testimonials" onClick={() => setMobileMenuOpen(false)}>Reviews</a>
            <button className="btn-nav-primary full-width" onClick={() => setShowAuth(true)}>
              Get Started Free
            </button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="hero-section" ref={heroRef}>
        <div className="hero-bg">
          <div className="hero-gradient" />
          <div className="hero-grid" />
          <div className="floating-shapes">
            <div className="shape shape-1" />
            <div className="shape shape-2" />
            <div className="shape shape-3" />
          </div>
        </div>

        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={14} />
            <span>AI-Powered Local SEO Platform</span>
          </div>

          <h1 className="hero-title">
            <span className="title-line">{typedText}</span>
            <span className="cursor-blink">|</span>
          </h1>

          <p className="hero-subtitle">
            Transform your local business presence with AI-powered review management,
            intelligent automations, and data-driven SEO insights. Join thousands of
            businesses growing with PinKernel.
          </p>

          <div className="hero-cta">
            <button className="btn-hero-primary" onClick={() => setShowAuth(true)}>
              Start Free Trial
              <ArrowRight size={20} />
            </button>
            <button className="btn-hero-secondary">
              <Play size={16} />
              Watch Demo
            </button>
          </div>

          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">{counters.reviews.toLocaleString()}+</span>
              <span className="stat-label">Reviews Generated</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-number">{counters.businesses.toLocaleString()}+</span>
              <span className="stat-label">Businesses</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-number">{counters.rating}</span>
              <span className="stat-label">User Rating</span>
            </div>
          </div>

          <div className="hero-trust">
            <span className="trust-label">Trusted by businesses worldwide</span>
            <div className="trust-badges">
              <Shield size={16} />
              <span>SOC 2 Compliant</span>
              <Globe size={16} />
              <span>Global Support</span>
              <Lock size={16} />
              <span>Enterprise Security</span>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="dashboard-preview">
            <div className="preview-header">
              <div className="preview-dots">
                <span /><span /><span />
              </div>
              <div className="preview-title">Dashboard Overview</div>
            </div>
            <div className="preview-content">
              <div className="preview-metrics">
                <div className="metric-card">
                  <TrendingUp className="metric-icon" />
                  <div className="metric-info">
                    <span className="metric-value">12,847</span>
                    <span className="metric-label">Search Views</span>
                    <span className="metric-change positive">+23.5%</span>
                  </div>
                </div>
                <div className="metric-card">
                  <MapPin className="metric-icon" />
                  <div className="metric-info">
                    <span className="metric-value">8,392</span>
                    <span className="metric-label">Map Views</span>
                    <span className="metric-change positive">+18.2%</span>
                  </div>
                </div>
                <div className="metric-card">
                  <Star className="metric-icon gold" />
                  <div className="metric-info">
                    <span className="metric-value">4.8</span>
                    <span className="metric-label">Avg Rating</span>
                    <span className="metric-change positive">+0.2</span>
                  </div>
                </div>
              </div>
              <div className="preview-chart">
                <div className="chart-bars">
                  <div className="bar" style={{ height: '60%' }} />
                  <div className="bar" style={{ height: '75%' }} />
                  <div className="bar" style={{ height: '45%' }} />
                  <div className="bar" style={{ height: '90%' }} />
                  <div className="bar" style={{ height: '65%' }} />
                  <div className="bar" style={{ height: '80%' }} />
                  <div className="bar" style={{ height: '95%' }} />
                </div>
                <span className="chart-label">Weekly Performance</span>
              </div>
              <div className="preview-reviews">
                <div className="review-item">
                  <div className="review-avatar">
                    <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=40&h=40&fit=crop&crop=face" alt="" />
                  </div>
                  <div className="review-content">
                    <span className="review-name">John D.</span>
                    <div className="review-stars">
                      {[1,2,3,4,5].map(i => <Star key={i} size={12} fill="#f59e0b" color="#f59e0b" />)}
                    </div>
                    <span className="review-text">Amazing service and great atmosphere...</span>
                  </div>
                  <span className="review-time">2h ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="scroll-indicator">
          <ChevronDown size={24} />
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features">
        <div className="section-container">
          <div className="section-header scroll-animate">
            <span className="section-badge">Powerful Features</span>
            <h2 className="section-title">Everything You Need to Dominate Local Search</h2>
            <p className="section-subtitle">
              From AI-generated reviews to comprehensive analytics, PinKernel provides
              all the tools you need to boost your local SEO and grow your business.
            </p>
          </div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`feature-card scroll-animate ${feature.highlight ? 'highlight' : ''}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {feature.highlight && (
                  <div className="feature-badge">
                    <Sparkles size={12} />
                    <span>Popular</span>
                  </div>
                )}
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
                <div className="feature-arrow">
                  <ArrowRight size={16} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Real Comment Spotlight Section */}
      <section className="spotlight-section">
        <div className="section-container">
          <div className="spotlight-content">
            <div className="spotlight-text scroll-animate">
              <span className="section-badge highlight">Featured Feature</span>
              <h2 className="section-title">Generate Authentic Reviews with AI</h2>
              <p className="spotlight-description">
                Our revolutionary Real Comment feature uses advanced AI to analyze your
                business from photos and generate reviews that sound genuinely human.
              </p>

              <div className="spotlight-steps">
                <div className="step-item">
                  <div className="step-number">01</div>
                  <div className="step-content">
                    <Image size={24} />
                    <div>
                      <h4>Upload Photos</h4>
                      <p>Upload photos of your business, products, or services</p>
                    </div>
                  </div>
                </div>
                <div className="step-item">
                  <div className="step-number">02</div>
                  <div className="step-content">
                    <Bot size={24} />
                    <div>
                      <h4>AI Analysis</h4>
                      <p>Our AI analyzes the visual content and context</p>
                    </div>
                  </div>
                </div>
                <div className="step-item">
                  <div className="step-number">03</div>
                  <div className="step-content">
                    <MessageSquare size={24} />
                    <div>
                      <h4>Get Authentic Reviews</h4>
                      <p>Receive reviews that sound naturally human-written</p>
                    </div>
                  </div>
                </div>
              </div>

              <button className="btn-spotlight" onClick={() => setShowAuth(true)}>
                Try Real Comment Free
                <ArrowRight size={20} />
              </button>
            </div>

            <div className="spotlight-visual scroll-animate">
              <div className="ai-demo">
                <div className="demo-header">
                  <Sparkles className="demo-sparkle" size={20} />
                  <span>AI Review Generator</span>
                </div>
                <div className="demo-content">
                  <div className="demo-photos">
                    <div className="photo-placeholder">
                      <Image size={24} />
                      <span>Photo 1</span>
                    </div>
                    <div className="photo-placeholder">
                      <Image size={24} />
                      <span>Photo 2</span>
                    </div>
                    <div className="photo-placeholder">
                      <Image size={24} />
                      <span>Photo 3</span>
                    </div>
                  </div>
                  <div className="demo-analysis">
                    <div className="analysis-item">
                      <span className="analysis-label">Food Type</span>
                      <span className="analysis-value">Asian Fusion, Ramen</span>
                    </div>
                    <div className="analysis-item">
                      <span className="analysis-label">Atmosphere</span>
                      <span className="analysis-value">Cozy, Modern, Authentic</span>
                    </div>
                    <div className="analysis-item">
                      <span className="analysis-label">Quality</span>
                      <span className="analysis-value">Premium Ingredients</span>
                    </div>
                  </div>
                  <div className="demo-result">
                    <div className="result-header">
                      <span>Generated Review</span>
                      <div className="result-stars">
                        {[1,2,3,4,5].map(i => <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />)}
                      </div>
                    </div>
                    <p className="result-text">
                      "Found this gem while exploring the neighborhood! The ramen here is
                      absolutely incredible - rich broth, perfectly cooked noodles, and
                      generous portions. The atmosphere is so cozy and authentic.
                      Definitely coming back soon!"
                    </p>
                    <span className="result-persona">From: Food Blogger Persona</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section" id="how-it-works">
        <div className="section-container">
          <div className="section-header scroll-animate">
            <span className="section-badge">Simple Process</span>
            <h2 className="section-title">Get Started in Minutes</h2>
            <p className="section-subtitle">
              Three easy steps to transform your local SEO strategy
            </p>
          </div>

          <div className="steps-container">
            <div className="step-card scroll-animate">
              <div className="step-icon-container">
                <Users size={32} />
              </div>
              <div className="step-info">
                <h3>Connect Your Business</h3>
                <p>Link your Google Business Profile through our secure OAuth integration. It takes less than 2 minutes.</p>
              </div>
              <div className="step-number-bg">1</div>
            </div>

            <div className="step-connector scroll-animate" />

            <div className="step-card scroll-animate">
              <div className="step-icon-container">
                <MessageSquare size={32} />
              </div>
              <div className="step-info">
                <h3>Manage & Respond</h3>
                <p>Handle all your reviews from a unified dashboard. Use AI to generate thoughtful responses instantly.</p>
              </div>
              <div className="step-number-bg">2</div>
            </div>

            <div className="step-connector scroll-animate" />

            <div className="step-card scroll-animate">
              <div className="step-icon-container">
                <TrendingUp size={32} />
              </div>
              <div className="step-info">
                <h3>Watch Your Growth</h3>
                <p>Track improved rankings, more reviews, and increased customer engagement through your analytics.</p>
              </div>
              <div className="step-number-bg">3</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section" id="testimonials">
        <div className="section-container">
          <div className="section-header scroll-animate">
            <span className="section-badge">Customer Stories</span>
            <h2 className="section-title">Trusted by Businesses Worldwide</h2>
          </div>

          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card scroll-animate" style={{ animationDelay: `${index * 0.15}s` }}>
                <div className="testimonial-stars">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} size={16} fill="#f59e0b" color="#f59e0b" />
                  ))}
                </div>
                <p className="testimonial-content">"{testimonial.content}"</p>
                <div className="testimonial-author">
                  <img src={testimonial.avatar} alt={testimonial.name} className="author-avatar" />
                  <div className="author-info">
                    <span className="author-name">{testimonial.name}</span>
                    <span className="author-role">{testimonial.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pricing-section" id="pricing">
        <div className="section-container">
          <div className="section-header scroll-animate">
            <span className="section-badge">Pricing Plans</span>
            <h2 className="section-title">Simple, Transparent Pricing</h2>
            <p className="section-subtitle">
              Choose the plan that fits your business. All plans include a 14-day free trial.
            </p>
          </div>

          <div className="pricing-grid">
            {pricingTiers.map((tier, index) => (
              <div
                key={index}
                className={`pricing-card scroll-animate ${tier.popular ? 'popular' : ''}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {tier.popular && (
                  <div className="popular-badge">
                    <Award size={14} />
                    <span>Most Popular</span>
                  </div>
                )}
                <div className="pricing-header" style={{ background: tier.gradient }}>
                  <h3 className="pricing-name">{tier.name}</h3>
                  <div className="pricing-price">
                    <span className="price-amount">{tier.price}</span>
                    <span className="price-period">{tier.period}</span>
                  </div>
                  <p className="pricing-description">{tier.description}</p>
                </div>
                <div className="pricing-features">
                  {tier.features.map((feature, i) => (
                    <div key={i} className="pricing-feature">
                      <Check size={18} />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                <button
                  className={`btn-pricing ${tier.popular ? 'primary' : ''}`}
                  onClick={() => setShowAuth(true)}
                >
                  {tier.cta}
                </button>
              </div>
            ))}
          </div>

          <div className="pricing-guarantee scroll-animate">
            <Shield size={24} />
            <div>
              <h4>30-Day Money-Back Guarantee</h4>
              <p>Not satisfied? Get a full refund within 30 days, no questions asked.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-bg">
          <div className="cta-gradient" />
          <div className="cta-shapes">
            <div className="cta-shape shape-1" />
            <div className="cta-shape shape-2" />
          </div>
        </div>
        <div className="section-container">
          <div className="cta-content scroll-animate">
            <h2 className="cta-title">Ready to Transform Your Local SEO?</h2>
            <p className="cta-subtitle">
              Join thousands of businesses already growing with PinKernel.
              Start your free trial today - no credit card required.
            </p>
            <div className="cta-actions">
              <button className="btn-cta-primary" onClick={() => setShowAuth(true)}>
                Start Free Trial
                <ArrowRight size={20} />
              </button>
              <div className="cta-features">
                <span><Check size={16} /> 14-day free trial</span>
                <span><Check size={16} /> No credit card required</span>
                <span><Check size={16} /> Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-main">
            <div className="footer-brand">
              <div className="nav-brand">
                <div className="brand-logo">
                  <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
                    <defs>
                      <linearGradient id="logoGradFooter" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#4facfe" />
                        <stop offset="100%" stopColor="#00f2fe" />
                      </linearGradient>
                    </defs>
                    <rect width="40" height="40" rx="10" fill="url(#logoGradFooter)" />
                    <path d="M20 8L22.5 14.5L29 15L24 20L25.5 27L20 23.5L14.5 27L16 20L11 15L17.5 14.5L20 8Z" fill="white" />
                  </svg>
                </div>
                <span className="brand-name">PinKernel SEO</span>
              </div>
              <p className="footer-tagline">
                Your local SEO intelligence platform. Grow your business with
                AI-powered review management and SEO optimization.
              </p>
            </div>

            <div className="footer-links">
              <div className="footer-column">
                <h4>Product</h4>
                <a href="#features">Features</a>
                <a href="#pricing">Pricing</a>
                <a href="#testimonials">Reviews</a>
                <a href="#">API</a>
              </div>
              <div className="footer-column">
                <h4>Company</h4>
                <a href="#">About Us</a>
                <a href="#">Blog</a>
                <a href="#">Careers</a>
                <a href="#">Press</a>
              </div>
              <div className="footer-column">
                <h4>Support</h4>
                <a href="#">Help Center</a>
                <a href="#">Contact Us</a>
                <a href="#">Community</a>
                <a href="#">Status</a>
              </div>
              <div className="footer-column">
                <h4>Legal</h4>
                <a href="#">Privacy Policy</a>
                <a href="#">Terms of Service</a>
                <a href="#">Cookie Policy</a>
                <a href="#">GDPR</a>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <div className="footer-contact">
              <a href="#"><Mail size={16} /> contact@pinkernelseo.com</a>
              <a href="#"><Phone size={16} /> +1 (555) 123-4567</a>
            </div>
            <div className="footer-social">
              <a href="#" aria-label="Twitter"><Globe size={20} /></a>
              <a href="#" aria-label="LinkedIn"><Users size={20} /></a>
              <a href="#" aria-label="GitHub"><Headphones size={20} /></a>
            </div>
            <div className="footer-copyright">
              <span>2024 PinKernel SEO. All rights reserved.</span>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        /* ============================================
           LANDING PAGE - Premium Marketing Website
           ============================================ */

        .landing-page {
          --primary: #1e3a5f;
          --primary-light: #2d4a6f;
          --accent: #4facfe;
          --accent-dark: #00f2fe;
          --success: #10b981;
          --warning: #f59e0b;
          --text-primary: #0f172a;
          --text-secondary: #475569;
          --text-muted: #94a3b8;
          --surface: #f8fafc;
          --white: #ffffff;
          --border: #e2e8f0;

          font-family: 'Figtree', -apple-system, BlinkMacSystemFont, sans-serif;
          color: var(--text-primary);
          line-height: 1.6;
          overflow-x: hidden;
        }

        /* Navigation */
        .landing-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          padding: 16px 0;
          transition: all 0.3s ease;
        }

        .landing-nav.scrolled {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.08);
        }

        .nav-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .nav-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .brand-logo {
          display: flex;
        }

        .brand-name {
          font-family: 'Manrope', sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: var(--primary);
          letter-spacing: -0.02em;
        }

        .landing-nav:not(.scrolled) .brand-name {
          color: var(--white);
        }

        .nav-links {
          display: flex;
          gap: 32px;
        }

        .nav-links a {
          color: var(--text-secondary);
          text-decoration: none;
          font-weight: 500;
          font-size: 15px;
          transition: color 0.2s;
        }

        .landing-nav:not(.scrolled) .nav-links a {
          color: rgba(255, 255, 255, 0.85);
        }

        .nav-links a:hover {
          color: var(--accent);
        }

        .nav-actions {
          display: flex;
          gap: 12px;
        }

        .btn-nav-secondary {
          padding: 10px 20px;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-weight: 500;
          cursor: pointer;
          transition: color 0.2s;
        }

        .landing-nav:not(.scrolled) .btn-nav-secondary {
          color: rgba(255, 255, 255, 0.85);
        }

        .btn-nav-secondary:hover {
          color: var(--accent);
        }

        .btn-nav-primary {
          padding: 10px 24px;
          border: none;
          background: linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%);
          color: white;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(79, 172, 254, 0.3);
        }

        .btn-nav-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(79, 172, 254, 0.4);
        }

        .btn-nav-primary.full-width {
          width: 100%;
        }

        .mobile-menu-btn {
          display: none;
          border: none;
          background: transparent;
          color: var(--text-primary);
          cursor: pointer;
        }

        .landing-nav:not(.scrolled) .mobile-menu-btn {
          color: white;
        }

        .mobile-menu {
          display: none;
          padding: 16px 24px;
          background: white;
          border-top: 1px solid var(--border);
        }

        .mobile-menu a {
          display: block;
          padding: 12px 0;
          color: var(--text-primary);
          text-decoration: none;
          font-weight: 500;
        }

        @media (max-width: 968px) {
          .nav-links, .nav-actions {
            display: none;
          }
          .mobile-menu-btn {
            display: block;
          }
          .mobile-menu {
            display: block;
          }
        }

        /* Hero Section */
        .hero-section {
          min-height: 100vh;
          display: flex;
          align-items: center;
          position: relative;
          padding: 120px 24px 80px;
          overflow: hidden;
        }

        .hero-bg {
          position: absolute;
          inset: 0;
          z-index: -1;
        }

        .hero-gradient {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0c4a6e 100%);
        }

        .hero-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(79, 172, 254, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(79, 172, 254, 0.05) 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: radial-gradient(ellipse at center, black 30%, transparent 70%);
        }

        .floating-shapes {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .shape {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          opacity: 0.5;
          animation: float 20s ease-in-out infinite;
        }

        .shape-1 {
          width: 400px;
          height: 400px;
          background: var(--accent);
          top: 10%;
          left: 10%;
          animation-delay: 0s;
        }

        .shape-2 {
          width: 300px;
          height: 300px;
          background: var(--accent-dark);
          top: 60%;
          right: 15%;
          animation-delay: -5s;
        }

        .shape-3 {
          width: 200px;
          height: 200px;
          background: #f093fb;
          bottom: 20%;
          left: 30%;
          animation-delay: -10s;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(30px, -30px) scale(1.05); }
          50% { transform: translate(-20px, 20px) scale(0.95); }
          75% { transform: translate(20px, 30px) scale(1.02); }
        }

        .hero-content {
          max-width: 1280px;
          margin: 0 auto;
          width: 100%;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: center;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(79, 172, 254, 0.15);
          border: 1px solid rgba(79, 172, 254, 0.3);
          border-radius: 100px;
          color: var(--accent);
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 24px;
          width: fit-content;
          animation: pulse-badge 2s ease-in-out infinite;
        }

        @keyframes pulse-badge {
          0%, 100% { box-shadow: 0 0 0 0 rgba(79, 172, 254, 0.3); }
          50% { box-shadow: 0 0 0 8px rgba(79, 172, 254, 0); }
        }

        .hero-title {
          font-family: 'Manrope', sans-serif;
          font-size: 56px;
          font-weight: 800;
          color: white;
          line-height: 1.1;
          letter-spacing: -0.03em;
          margin: 0 0 24px;
        }

        .title-line {
          display: block;
        }

        .cursor-blink {
          animation: blink 1s step-end infinite;
          color: var(--accent);
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        .hero-subtitle {
          font-size: 18px;
          color: rgba(255, 255, 255, 0.75);
          line-height: 1.7;
          margin: 0 0 40px;
          max-width: 520px;
        }

        .hero-cta {
          display: flex;
          gap: 16px;
          margin-bottom: 48px;
        }

        .btn-hero-primary {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 16px 32px;
          background: linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%);
          color: white;
          font-size: 16px;
          font-weight: 600;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 8px 30px rgba(79, 172, 254, 0.4);
        }

        .btn-hero-primary:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 40px rgba(79, 172, 254, 0.5);
        }

        .btn-hero-primary svg {
          transition: transform 0.3s;
        }

        .btn-hero-primary:hover svg {
          transform: translateX(4px);
        }

        .btn-hero-secondary {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 16px 32px;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          font-size: 16px;
          font-weight: 600;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-hero-secondary:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .btn-hero-secondary svg {
          width: 20px;
          height: 20px;
          padding: 4px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
        }

        .hero-stats {
          display: flex;
          align-items: center;
          gap: 32px;
          margin-bottom: 32px;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
        }

        .stat-number {
          font-family: 'Manrope', sans-serif;
          font-size: 32px;
          font-weight: 800;
          color: white;
          line-height: 1;
        }

        .stat-label {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.6);
          margin-top: 4px;
        }

        .stat-divider {
          width: 1px;
          height: 40px;
          background: rgba(255, 255, 255, 0.2);
        }

        .hero-trust {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .trust-label {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.5);
        }

        .trust-badges {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .trust-badges span {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.7);
        }

        .trust-badges svg {
          color: var(--accent);
        }

        /* Hero Visual */
        .hero-visual {
          position: relative;
        }

        .dashboard-preview {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
          animation: float-dashboard 6s ease-in-out infinite;
        }

        @keyframes float-dashboard {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }

        .preview-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          background: rgba(255, 255, 255, 0.05);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .preview-dots {
          display: flex;
          gap: 6px;
        }

        .preview-dots span {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
        }

        .preview-dots span:first-child { background: #ff5f57; }
        .preview-dots span:nth-child(2) { background: #ffbd2e; }
        .preview-dots span:last-child { background: #28ca41; }

        .preview-title {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.6);
          margin-left: auto;
          margin-right: auto;
        }

        .preview-content {
          padding: 24px;
        }

        .preview-metrics {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }

        .metric-card {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .metric-icon {
          color: var(--accent);
          flex-shrink: 0;
        }

        .metric-icon.gold {
          color: #f59e0b;
        }

        .metric-info {
          display: flex;
          flex-direction: column;
        }

        .metric-value {
          font-family: 'Manrope', sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: white;
          line-height: 1.2;
        }

        .metric-label {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
          margin: 2px 0;
        }

        .metric-change {
          font-size: 11px;
          font-weight: 600;
        }

        .metric-change.positive {
          color: var(--success);
        }

        .preview-chart {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .chart-bars {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          height: 80px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          margin-bottom: 12px;
        }

        .bar {
          width: 12%;
          background: linear-gradient(to top, var(--accent), var(--accent-dark));
          border-radius: 4px 4px 0 0;
          animation: grow-bar 1s ease-out forwards;
          transform-origin: bottom;
        }

        @keyframes grow-bar {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
        }

        .chart-label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
        }

        .preview-reviews {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .review-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }

        .review-avatar img {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          object-fit: cover;
        }

        .review-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .review-name {
          font-size: 13px;
          font-weight: 600;
          color: white;
        }

        .review-stars {
          display: flex;
          gap: 2px;
        }

        .review-text {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 200px;
        }

        .review-time {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
        }

        /* Scroll Indicator */
        .scroll-indicator {
          position: absolute;
          bottom: 40px;
          left: 50%;
          transform: translateX(-50%);
          color: rgba(255, 255, 255, 0.5);
          animation: bounce 2s ease-in-out infinite;
        }

        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(10px); }
        }

        @media (max-width: 1024px) {
          .hero-content {
            grid-template-columns: 1fr;
            gap: 60px;
          }
          .hero-title {
            font-size: 42px;
          }
          .hero-visual {
            display: none;
          }
        }

        @media (max-width: 640px) {
          .hero-title {
            font-size: 32px;
          }
          .hero-cta {
            flex-direction: column;
          }
          .hero-stats {
            flex-wrap: wrap;
            gap: 20px;
          }
          .stat-divider {
            display: none;
          }
        }

        /* Section Styles */
        .section-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .section-header {
          text-align: center;
          max-width: 720px;
          margin: 0 auto 64px;
        }

        .section-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          background: linear-gradient(135deg, rgba(79, 172, 254, 0.1) 0%, rgba(0, 242, 254, 0.1) 100%);
          border: 1px solid rgba(79, 172, 254, 0.2);
          border-radius: 100px;
          color: var(--accent);
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .section-badge.highlight {
          background: linear-gradient(135deg, rgba(240, 147, 251, 0.15) 0%, rgba(245, 87, 108, 0.15) 100%);
          border-color: rgba(240, 147, 251, 0.3);
          color: #f093fb;
        }

        .section-title {
          font-family: 'Manrope', sans-serif;
          font-size: 42px;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.02em;
          margin: 0 0 16px;
          line-height: 1.2;
        }

        .section-subtitle {
          font-size: 18px;
          color: var(--text-secondary);
          line-height: 1.7;
          margin: 0;
        }

        /* Features Section */
        .features-section {
          padding: 120px 0;
          background: var(--surface);
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }

        .feature-card {
          position: relative;
          padding: 32px;
          background: white;
          border: 1px solid var(--border);
          border-radius: 16px;
          transition: all 0.3s ease;
          opacity: 0;
          transform: translateY(20px);
        }

        .feature-card.animate-in {
          opacity: 1;
          transform: translateY(0);
        }

        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
          border-color: var(--accent);
        }

        .feature-card.highlight {
          background: linear-gradient(135deg, #fef3f2 0%, #fdf2f8 100%);
          border-color: rgba(240, 147, 251, 0.3);
        }

        .feature-badge {
          position: absolute;
          top: -10px;
          right: 20px;
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
          font-size: 11px;
          font-weight: 600;
          border-radius: 100px;
          box-shadow: 0 4px 12px rgba(240, 147, 251, 0.4);
        }

        .feature-icon {
          width: 52px;
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(79, 172, 254, 0.1) 0%, rgba(0, 242, 254, 0.1) 100%);
          border-radius: 12px;
          color: var(--accent);
          margin-bottom: 20px;
        }

        .feature-card.highlight .feature-icon {
          background: linear-gradient(135deg, rgba(240, 147, 251, 0.15) 0%, rgba(245, 87, 108, 0.15) 100%);
          color: #f5576c;
        }

        .feature-title {
          font-family: 'Manrope', sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 12px;
        }

        .feature-description {
          font-size: 15px;
          color: var(--text-secondary);
          line-height: 1.6;
          margin: 0 0 20px;
        }

        .feature-arrow {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          color: var(--accent);
          opacity: 0;
          transform: translateX(-8px);
          transition: all 0.3s;
        }

        .feature-card:hover .feature-arrow {
          opacity: 1;
          transform: translateX(0);
        }

        @media (max-width: 1024px) {
          .features-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .section-title {
            font-size: 36px;
          }
        }

        @media (max-width: 640px) {
          .features-grid {
            grid-template-columns: 1fr;
          }
          .section-title {
            font-size: 28px;
          }
        }

        /* Spotlight Section */
        .spotlight-section {
          padding: 120px 0;
          background: white;
        }

        .spotlight-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: center;
        }

        .spotlight-description {
          font-size: 17px;
          color: var(--text-secondary);
          line-height: 1.7;
          margin: 0 0 40px;
        }

        .spotlight-steps {
          display: flex;
          flex-direction: column;
          gap: 24px;
          margin-bottom: 40px;
        }

        .step-item {
          display: flex;
          gap: 20px;
        }

        .step-number {
          font-family: 'Manrope', sans-serif;
          font-size: 14px;
          font-weight: 800;
          color: var(--accent);
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(79, 172, 254, 0.1) 0%, rgba(0, 242, 254, 0.1) 100%);
          border-radius: 8px;
          flex-shrink: 0;
        }

        .step-content {
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }

        .step-content svg {
          color: var(--accent);
          flex-shrink: 0;
          margin-top: 2px;
        }

        .step-content h4 {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 4px;
        }

        .step-content p {
          font-size: 14px;
          color: var(--text-secondary);
          margin: 0;
        }

        .btn-spotlight {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 16px 32px;
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
          font-size: 16px;
          font-weight: 600;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 8px 30px rgba(245, 87, 108, 0.4);
        }

        .btn-spotlight:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 40px rgba(245, 87, 108, 0.5);
        }

        .btn-spotlight svg {
          transition: transform 0.3s;
        }

        .btn-spotlight:hover svg {
          transform: translateX(4px);
        }

        /* AI Demo */
        .ai-demo {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.1);
        }

        .demo-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 16px 20px;
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
          font-weight: 600;
        }

        .demo-sparkle {
          animation: sparkle 2s ease-in-out infinite;
        }

        @keyframes sparkle {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 1; }
          50% { transform: scale(1.2) rotate(180deg); opacity: 0.7; }
        }

        .demo-content {
          padding: 24px;
        }

        .demo-photos {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }

        .photo-placeholder {
          aspect-ratio: 1;
          background: white;
          border: 2px dashed var(--border);
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: var(--text-muted);
          font-size: 12px;
        }

        .demo-analysis {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        }

        .analysis-item {
          display: flex;
          justify-content: space-between;
          padding: 12px 16px;
          background: white;
          border-radius: 10px;
          border: 1px solid var(--border);
        }

        .analysis-label {
          font-size: 13px;
          color: var(--text-muted);
        }

        .analysis-value {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .demo-result {
          background: white;
          border-radius: 12px;
          padding: 20px;
          border: 1px solid var(--border);
        }

        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .result-header span {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .result-stars {
          display: flex;
          gap: 2px;
        }

        .result-text {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.6;
          font-style: italic;
          margin: 0 0 12px;
        }

        .result-persona {
          font-size: 12px;
          color: var(--accent);
          font-weight: 500;
        }

        @media (max-width: 1024px) {
          .spotlight-content {
            grid-template-columns: 1fr;
            gap: 60px;
          }
        }

        /* How It Works */
        .how-it-works-section {
          padding: 120px 0;
          background: var(--surface);
        }

        .steps-container {
          display: flex;
          align-items: flex-start;
          justify-content: center;
          gap: 0;
        }

        .step-card {
          position: relative;
          flex: 1;
          max-width: 320px;
          padding: 40px 32px;
          background: white;
          border: 1px solid var(--border);
          border-radius: 20px;
          text-align: center;
          z-index: 1;
          opacity: 0;
          transform: translateY(20px);
        }

        .step-card.animate-in {
          opacity: 1;
          transform: translateY(0);
        }

        .step-icon-container {
          width: 72px;
          height: 72px;
          margin: 0 auto 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%);
          border-radius: 20px;
          color: white;
          box-shadow: 0 12px 30px rgba(79, 172, 254, 0.3);
        }

        .step-info h3 {
          font-family: 'Manrope', sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 12px;
        }

        .step-info p {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.6;
          margin: 0;
        }

        .step-number-bg {
          position: absolute;
          top: -20px;
          left: 50%;
          transform: translateX(-50%);
          font-family: 'Manrope', sans-serif;
          font-size: 80px;
          font-weight: 800;
          color: var(--surface);
          line-height: 1;
          z-index: -1;
        }

        .step-connector {
          width: 80px;
          height: 2px;
          background: linear-gradient(90deg, var(--accent), var(--accent-dark));
          margin-top: 80px;
          opacity: 0;
        }

        .step-connector.animate-in {
          opacity: 1;
        }

        @media (max-width: 968px) {
          .steps-container {
            flex-direction: column;
            align-items: center;
            gap: 40px;
          }
          .step-connector {
            width: 2px;
            height: 40px;
            margin-top: 0;
          }
        }

        /* Testimonials */
        .testimonials-section {
          padding: 120px 0;
          background: white;
        }

        .testimonials-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }

        .testimonial-card {
          padding: 32px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          transition: all 0.3s;
          opacity: 0;
          transform: translateY(20px);
        }

        .testimonial-card.animate-in {
          opacity: 1;
          transform: translateY(0);
        }

        .testimonial-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
        }

        .testimonial-stars {
          display: flex;
          gap: 4px;
          margin-bottom: 16px;
        }

        .testimonial-content {
          font-size: 15px;
          color: var(--text-secondary);
          line-height: 1.7;
          margin: 0 0 24px;
        }

        .testimonial-author {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .author-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          object-fit: cover;
        }

        .author-info {
          display: flex;
          flex-direction: column;
        }

        .author-name {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .author-role {
          font-size: 13px;
          color: var(--text-muted);
        }

        @media (max-width: 1024px) {
          .testimonials-grid {
            grid-template-columns: 1fr;
            max-width: 480px;
            margin: 0 auto;
          }
        }

        /* Pricing Section */
        .pricing-section {
          padding: 120px 0;
          background: var(--surface);
        }

        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-bottom: 60px;
        }

        .pricing-card {
          position: relative;
          background: white;
          border: 1px solid var(--border);
          border-radius: 20px;
          overflow: hidden;
          opacity: 0;
          transform: translateY(20px);
        }

        .pricing-card.animate-in {
          opacity: 1;
          transform: translateY(0);
        }

        .pricing-card.popular {
          border-color: var(--accent);
          box-shadow: 0 20px 50px rgba(79, 172, 254, 0.2);
        }

        .popular-badge {
          position: absolute;
          top: 16px;
          right: 16px;
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          background: linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%);
          color: white;
          font-size: 12px;
          font-weight: 600;
          border-radius: 100px;
        }

        .pricing-header {
          padding: 32px;
          color: white;
        }

        .pricing-name {
          font-family: 'Manrope', sans-serif;
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 16px;
          color: white;
        }

        .pricing-price {
          display: flex;
          align-items: baseline;
          gap: 4px;
          margin-bottom: 12px;
        }

        .price-amount {
          font-family: 'Manrope', sans-serif;
          font-size: 48px;
          font-weight: 800;
          line-height: 1;
        }

        .price-period {
          font-size: 16px;
          opacity: 0.8;
        }

        .pricing-description {
          font-size: 14px;
          opacity: 0.9;
          margin: 0;
          line-height: 1.5;
        }

        .pricing-features {
          padding: 32px;
        }

        .pricing-feature {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid var(--border);
        }

        .pricing-feature:last-child {
          border-bottom: none;
        }

        .pricing-feature svg {
          color: var(--success);
          flex-shrink: 0;
        }

        .pricing-feature span {
          font-size: 14px;
          color: var(--text-secondary);
        }

        .btn-pricing {
          display: block;
          width: calc(100% - 64px);
          margin: 0 32px 32px;
          padding: 14px 24px;
          background: var(--surface);
          color: var(--text-primary);
          font-size: 15px;
          font-weight: 600;
          border: 1px solid var(--border);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-pricing:hover {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }

        .btn-pricing.primary {
          background: linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%);
          color: white;
          border: none;
          box-shadow: 0 8px 24px rgba(79, 172, 254, 0.3);
        }

        .btn-pricing.primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(79, 172, 254, 0.4);
        }

        .pricing-guarantee {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: 24px 32px;
          background: white;
          border: 1px solid var(--border);
          border-radius: 16px;
          max-width: 500px;
          margin: 0 auto;
        }

        .pricing-guarantee svg {
          color: var(--success);
          flex-shrink: 0;
        }

        .pricing-guarantee h4 {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 4px;
        }

        .pricing-guarantee p {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0;
        }

        @media (max-width: 1024px) {
          .pricing-grid {
            grid-template-columns: 1fr;
            max-width: 400px;
            margin: 0 auto 60px;
          }
        }

        /* CTA Section */
        .cta-section {
          position: relative;
          padding: 120px 0;
          overflow: hidden;
        }

        .cta-bg {
          position: absolute;
          inset: 0;
          z-index: -1;
        }

        .cta-gradient {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0c4a6e 100%);
        }

        .cta-shapes {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .cta-shape {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.4;
        }

        .cta-shape.shape-1 {
          width: 500px;
          height: 500px;
          background: var(--accent);
          top: -200px;
          right: -100px;
        }

        .cta-shape.shape-2 {
          width: 400px;
          height: 400px;
          background: #f093fb;
          bottom: -200px;
          left: -100px;
        }

        .cta-content {
          text-align: center;
          max-width: 720px;
          margin: 0 auto;
        }

        .cta-title {
          font-family: 'Manrope', sans-serif;
          font-size: 48px;
          font-weight: 800;
          color: white;
          letter-spacing: -0.02em;
          margin: 0 0 20px;
          line-height: 1.2;
        }

        .cta-subtitle {
          font-size: 18px;
          color: rgba(255, 255, 255, 0.75);
          line-height: 1.7;
          margin: 0 0 40px;
        }

        .cta-actions {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
        }

        .btn-cta-primary {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 18px 40px;
          background: linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%);
          color: white;
          font-size: 18px;
          font-weight: 600;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 8px 30px rgba(79, 172, 254, 0.4);
        }

        .btn-cta-primary:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 40px rgba(79, 172, 254, 0.5);
        }

        .cta-features {
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .cta-features span {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.8);
        }

        .cta-features svg {
          color: var(--success);
        }

        @media (max-width: 640px) {
          .cta-title {
            font-size: 32px;
          }
        }

        /* Footer */
        .landing-footer {
          padding: 80px 0 40px;
          background: #0f172a;
          color: rgba(255, 255, 255, 0.7);
        }

        .footer-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .footer-main {
          display: grid;
          grid-template-columns: 1.5fr 2fr;
          gap: 80px;
          margin-bottom: 60px;
          padding-bottom: 60px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .footer-tagline {
          font-size: 14px;
          line-height: 1.7;
          margin: 16px 0 0;
          max-width: 300px;
        }

        .footer-links {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 40px;
        }

        .footer-column h4 {
          font-size: 14px;
          font-weight: 700;
          color: white;
          margin: 0 0 16px;
        }

        .footer-column a {
          display: block;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
          text-decoration: none;
          padding: 6px 0;
          transition: color 0.2s;
        }

        .footer-column a:hover {
          color: var(--accent);
        }

        .footer-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 20px;
        }

        .footer-contact {
          display: flex;
          gap: 24px;
        }

        .footer-contact a {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.6);
          text-decoration: none;
          transition: color 0.2s;
        }

        .footer-contact a:hover {
          color: var(--accent);
        }

        .footer-social {
          display: flex;
          gap: 16px;
        }

        .footer-social a {
          color: rgba(255, 255, 255, 0.6);
          transition: color 0.2s;
        }

        .footer-social a:hover {
          color: var(--accent);
        }

        .footer-copyright {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.4);
        }

        @media (max-width: 968px) {
          .footer-main {
            grid-template-columns: 1fr;
            gap: 40px;
          }
          .footer-links {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .footer-links {
            grid-template-columns: 1fr;
          }
          .footer-bottom {
            flex-direction: column;
            text-align: center;
          }
          .footer-contact {
            flex-direction: column;
            gap: 12px;
          }
        }

        /* Scroll Animation */
        .scroll-animate {
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .scroll-animate.animate-in {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}
