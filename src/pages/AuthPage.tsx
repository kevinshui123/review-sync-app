import React, { useState, useEffect, useRef } from 'react';
import { Mail, Lock, User, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function AuthPage({ onBack }: { onBack?: () => void }) {
  const { login, register, loginWithGoogle } = useAuth();
  const { t } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  const fullText = "PinKernel SEO";

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    let index = 0;
    const timer = setInterval(() => {
      if (index <= fullText.length) {
        setTypedText(fullText.slice(0, index));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 80);
    return () => clearInterval(timer);
  }, [isLoaded]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  return (
    <div className="auth-page">
      {/* Navigation bar with back button */}
      <nav className="auth-nav">
        <button className="auth-nav-back" onClick={handleBack}>
          <ArrowLeft size={18} />
          <span>返回首页</span>
        </button>
        <div className="auth-nav-brand">
          <div className="auth-nav-logo">
            <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
              <defs>
                <linearGradient id="authLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4facfe" />
                  <stop offset="100%" stopColor="#00f2fe" />
                </linearGradient>
              </defs>
              <rect width="40" height="40" rx="10" fill="url(#authLogoGrad)" />
              <path d="M20 8L22.5 14.5L29 15L24 20L25.5 27L20 23.5L14.5 27L16 20L11 15L17.5 14.5L20 8Z" fill="white" />
            </svg>
          </div>
          <span className="auth-nav-brand-name">PinKernel SEO</span>
        </div>
        <div className="auth-nav-spacer" />
      </nav>

      {/* Main content */}
      <div className="auth-layout">
        {/* Left side - Branding */}
        <div className="auth-branding">
          <div className="auth-branding-bg">
            <div className="auth-branding-gradient" />
            <div className="auth-branding-grid" />
            <div className="auth-floating-shapes">
              <div className="auth-shape auth-shape-1" />
              <div className="auth-shape auth-shape-2" />
              <div className="auth-shape auth-shape-3" />
            </div>
          </div>

          <div className="auth-branding-content">
            <div className="auth-branding-badge">
              <span className="auth-badge-dot" />
              Your Local SEO Intelligence Platform
            </div>

            <h1 className="auth-branding-title">
              <span className="auth-title-line">{typedText}</span>
              <span className="auth-cursor">|</span>
            </h1>

            <p className="auth-branding-subtitle">
              Dominate local search results with AI-powered SEO optimization,
              authentic review generation from verified Google Local Guides,
              and intelligent automation.
            </p>

            <div className="auth-branding-stats">
              <div className="auth-stat-item">
                <span className="auth-stat-number">50K+</span>
                <span className="auth-stat-label">Reviews Generated</span>
              </div>
              <div className="auth-stat-divider" />
              <div className="auth-stat-item">
                <span className="auth-stat-number">2.5K+</span>
                <span className="auth-stat-label">Businesses</span>
              </div>
              <div className="auth-stat-divider" />
              <div className="auth-stat-item">
                <span className="auth-stat-number">4.9</span>
                <span className="auth-stat-label">User Rating</span>
              </div>
            </div>

            <div className="auth-trust-badges">
              <span><span className="auth-trust-icon">&#x1F6E1;</span> SOC 2 Compliant</span>
              <span><span className="auth-trust-icon">&#x1F30D;</span> Global Support</span>
              <span><span className="auth-trust-icon">&#x1F512;</span> Enterprise Security</span>
            </div>
          </div>
        </div>

        {/* Right side - Auth form */}
        <div className="auth-form-side">
          <div className={`auth-card ${isLoaded ? 'loaded' : ''}`}>
            {/* Card header with gradient */}
            <div className="auth-card-header">
              <div className="auth-card-logo">
                <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
                  <defs>
                    <linearGradient id="authCardLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#4facfe" />
                      <stop offset="100%" stopColor="#00f2fe" />
                    </linearGradient>
                  </defs>
                  <rect width="40" height="40" rx="10" fill="url(#authCardLogoGrad)" />
                  <path d="M20 8L22.5 14.5L29 15L24 20L25.5 27L20 23.5L14.5 27L16 20L11 15L17.5 14.5L20 8Z" fill="white" />
                </svg>
              </div>
              <h2 className="auth-card-title">
                {isLogin ? 'Welcome back' : 'Create account'}
              </h2>
              <p className="auth-card-subtitle">
                {isLogin
                  ? 'Sign in to continue to your dashboard'
                  : 'Get started with PinKernel SEO today'
                }
              </p>
            </div>

            {/* Tab switcher */}
            <div className="auth-tabs">
              <button
                onClick={() => { setIsLogin(true); setError(''); }}
                className={`auth-tab ${isLogin ? 'active' : ''}`}
              >
                <span className="auth-tab-dot" />
                Sign In
              </button>
              <button
                onClick={() => { setIsLogin(false); setError(''); }}
                className={`auth-tab ${!isLogin ? 'active' : ''}`}
              >
                <span className="auth-tab-dot" />
                Sign Up
              </button>
              <div
                className="auth-tab-indicator"
                style={{ left: isLogin ? '4px' : 'calc(50% + 2px)' }}
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="auth-error">
                <span className="auth-error-icon">!</span>
                {error}
              </div>
            )}

            {/* Form */}
            <form
              key={isLogin ? 'login' : 'register'}
              onSubmit={handleSubmit}
              className="auth-form"
            >
              {!isLogin && (
                <div className="auth-field">
                  <label className="auth-label">Name</label>
                  <div className="auth-input-wrapper">
                    <User className="auth-input-icon" size={16} />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="auth-input"
                    />
                  </div>
                </div>
              )}

              <div className="auth-field">
                <label className="auth-label">Email</label>
                <div className="auth-input-wrapper">
                  <Mail className="auth-input-icon" size={16} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="auth-input"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-label">Password</label>
                <div className="auth-input-wrapper">
                  <Lock className="auth-input-icon" size={16} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    required
                    minLength={6}
                    className="auth-input"
                  />
                </div>
              </div>

              {isLogin && (
                <div className="auth-forgot">
                  <a href="#">Forgot password?</a>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="auth-submit"
              >
                {loading ? (
                  <Loader2 className="auth-spinner" size={18} />
                ) : (
                  <>
                    {isLogin ? 'Sign In' : 'Create Account'}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="auth-divider">
              <span>or continue with</span>
            </div>

            {/* Google button */}
            <button
              onClick={loginWithGoogle}
              className="auth-google-btn"
            >
              <svg className="auth-google-icon" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>
          </div>

          {/* Footer */}
          <p className="auth-footer">
            Powered by PinKernel SEO — Your local search intelligence
          </p>
        </div>
      </div>

      <style>{`
        .auth-page {
          min-height: 100vh;
          background: #f8fafc;
          font-family: 'Figtree', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        /* Navigation */
        .auth-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          height: 60px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid #e2e8f0;
        }

        .auth-nav-back {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border: none;
          background: transparent;
          color: #475569;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .auth-nav-back:hover {
          background: #f1f5f9;
          color: #1e3a5f;
        }

        .auth-nav-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .auth-nav-logo {
          display: flex;
        }

        .auth-nav-brand-name {
          font-family: 'Manrope', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.02em;
        }

        .auth-nav-spacer {
          width: 120px;
        }

        /* Layout */
        .auth-layout {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
        }

        /* Branding Side */
        .auth-branding {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 80px 60px;
          background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0c4a6e 100%);
          overflow: hidden;
        }

        .auth-branding-bg {
          position: absolute;
          inset: 0;
        }

        .auth-branding-gradient {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0c4a6e 100%);
        }

        .auth-branding-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(79, 172, 254, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(79, 172, 254, 0.05) 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: radial-gradient(ellipse at center, black 30%, transparent 70%);
        }

        .auth-floating-shapes {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .auth-shape {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          opacity: 0.5;
          animation: auth-float 20s ease-in-out infinite;
        }

        .auth-shape-1 {
          width: 400px;
          height: 400px;
          background: #4facfe;
          top: 10%;
          left: 10%;
        }

        .auth-shape-2 {
          width: 300px;
          height: 300px;
          background: #00f2fe;
          top: 60%;
          right: 15%;
          animation-delay: -5s;
        }

        .auth-shape-3 {
          width: 200px;
          height: 200px;
          background: #f093fb;
          bottom: 20%;
          left: 30%;
          animation-delay: -10s;
        }

        @keyframes auth-float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(30px, -30px) scale(1.05); }
          50% { transform: translate(-20px, 20px) scale(0.95); }
          75% { transform: translate(20px, 30px) scale(1.02); }
        }

        .auth-branding-content {
          position: relative;
          z-index: 1;
          max-width: 480px;
        }

        .auth-branding-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(79, 172, 254, 0.15);
          border: 1px solid rgba(79, 172, 254, 0.3);
          border-radius: 100px;
          color: #4facfe;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 24px;
          animation: auth-pulse 2s ease-in-out infinite;
        }

        .auth-badge-dot {
          width: 6px;
          height: 6px;
          background: #4facfe;
          border-radius: 50%;
          animation: auth-dot-pulse 1.5s ease-in-out infinite;
        }

        @keyframes auth-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(79, 172, 254, 0.3); }
          50% { box-shadow: 0 0 0 8px rgba(79, 172, 254, 0); }
        }

        @keyframes auth-dot-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }

        .auth-branding-title {
          font-family: 'Manrope', sans-serif;
          font-size: 48px;
          font-weight: 800;
          color: white;
          line-height: 1.1;
          letter-spacing: -0.03em;
          margin: 0 0 20px;
        }

        .auth-title-line {
          display: block;
        }

        .auth-cursor {
          animation: auth-blink 1s step-end infinite;
          color: #4facfe;
        }

        @keyframes auth-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        .auth-branding-subtitle {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.75);
          line-height: 1.7;
          margin: 0 0 32px;
        }

        .auth-branding-stats {
          display: flex;
          align-items: center;
          gap: 24px;
          margin-bottom: 24px;
        }

        .auth-stat-item {
          display: flex;
          flex-direction: column;
        }

        .auth-stat-number {
          font-family: 'Manrope', sans-serif;
          font-size: 28px;
          font-weight: 800;
          color: white;
          line-height: 1;
        }

        .auth-stat-label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
          margin-top: 4px;
        }

        .auth-stat-divider {
          width: 1px;
          height: 40px;
          background: rgba(255, 255, 255, 0.2);
        }

        .auth-trust-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
        }

        .auth-trust-badges span {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
        }

        .auth-trust-icon {
          font-size: 14px;
        }

        /* Form Side */
        .auth-form-side {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 100px 40px 40px;
          background: #f8fafc;
        }

        .auth-card {
          width: 100%;
          max-width: 420px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 32px;
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.06);
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .auth-card.loaded {
          opacity: 1;
          transform: translateY(0);
        }

        .auth-card-header {
          text-align: center;
          margin-bottom: 28px;
        }

        .auth-card-logo {
          display: inline-flex;
          margin-bottom: 16px;
        }

        .auth-card-title {
          font-family: 'Manrope', sans-serif;
          font-size: 24px;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.02em;
          margin: 0 0 8px;
        }

        .auth-card-subtitle {
          font-size: 14px;
          color: #64748b;
          margin: 0;
        }

        /* Tabs */
        .auth-tabs {
          position: relative;
          display: flex;
          background: #f1f5f9;
          border-radius: 12px;
          padding: 4px;
          margin-bottom: 24px;
        }

        .auth-tab {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px 16px;
          border: none;
          background: transparent;
          color: #64748b;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border-radius: 8px;
          transition: color 0.2s;
          z-index: 1;
        }

        .auth-tab.active {
          color: #0f172a;
        }

        .auth-tab-dot {
          width: 6px;
          height: 6px;
          background: currentColor;
          border-radius: 50%;
          opacity: 0.4;
          transition: opacity 0.2s;
        }

        .auth-tab.active .auth-tab-dot {
          opacity: 1;
        }

        .auth-tab-indicator {
          position: absolute;
          top: 4px;
          width: calc(50% - 4px);
          height: calc(100% - 8px);
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: left 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Error */
        .auth-error {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 14px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 10px;
          color: #dc2626;
          font-size: 13px;
          margin-bottom: 16px;
          animation: auth-shake 0.4s ease-out;
        }

        .auth-error-icon {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #dc2626;
          color: white;
          border-radius: 50%;
          font-size: 12px;
          font-weight: 700;
          flex-shrink: 0;
        }

        @keyframes auth-shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-4px); }
          40% { transform: translateX(4px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }

        /* Form */
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .auth-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .auth-label {
          font-size: 12px;
          font-weight: 600;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .auth-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .auth-input-icon {
          position: absolute;
          left: 14px;
          color: #94a3b8;
          pointer-events: none;
        }

        .auth-input {
          width: 100%;
          padding: 12px 14px 12px 42px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          font-size: 14px;
          color: #0f172a;
          transition: all 0.2s;
        }

        .auth-input::placeholder {
          color: #94a3b8;
        }

        .auth-input:focus {
          outline: none;
          border-color: #4facfe;
          box-shadow: 0 0 0 3px rgba(79, 172, 254, 0.1);
          background: white;
        }

        .auth-forgot {
          text-align: right;
          margin-top: -8px;
        }

        .auth-forgot a {
          font-size: 13px;
          color: #4facfe;
          text-decoration: none;
          font-weight: 500;
        }

        .auth-forgot a:hover {
          text-decoration: underline;
        }

        .auth-submit {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 14px 24px;
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          color: white;
          font-size: 15px;
          font-weight: 600;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(79, 172, 254, 0.3);
          margin-top: 8px;
        }

        .auth-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(79, 172, 254, 0.4);
        }

        .auth-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .auth-submit svg:last-child {
          transition: transform 0.2s;
        }

        .auth-submit:hover:not(:disabled) svg:last-child {
          transform: translateX(3px);
        }

        .auth-spinner {
          animation: auth-spin 1s linear infinite;
        }

        @keyframes auth-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Divider */
        .auth-divider {
          display: flex;
          align-items: center;
          gap: 16px;
          margin: 24px 0;
        }

        .auth-divider::before,
        .auth-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #e2e8f0;
        }

        .auth-divider span {
          font-size: 12px;
          color: #94a3b8;
          white-space: nowrap;
        }

        /* Google Button */
        .auth-google-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 12px 24px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          color: #0f172a;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .auth-google-btn:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        .auth-google-icon {
          width: 20px;
          height: 20px;
        }

        /* Footer */
        .auth-footer {
          margin-top: 24px;
          font-size: 12px;
          color: #94a3b8;
          text-align: center;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .auth-layout {
            grid-template-columns: 1fr;
          }

          .auth-branding {
            display: none;
          }

          .auth-form-side {
            padding-top: 80px;
          }
        }

        @media (max-width: 640px) {
          .auth-nav {
            padding: 0 16px;
          }

          .auth-nav-back span {
            display: none;
          }

          .auth-nav-spacer {
            width: 60px;
          }

          .auth-form-side {
            padding: 80px 20px 30px;
          }

          .auth-card {
            padding: 24px;
            border-radius: 16px;
          }

          .auth-branding-title {
            font-size: 36px;
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .auth-shape,
          .auth-branding-badge,
          .auth-badge-dot,
          .auth-cursor {
            animation: none;
          }

          .auth-card {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}
