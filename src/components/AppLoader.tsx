import React from 'react';

interface AppLoaderProps {
  message?: string;
  subMessage?: string;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
}

export function AppLoader({ message, subMessage, size = 'md', showProgress = true }: AppLoaderProps) {
  const sizes = {
    sm: { container: 80, ring: 0, core: 28 },
    md: { container: 120, ring: 0, core: 40 },
    lg: { container: 160, ring: 0, core: 52 },
  };

  const s = sizes[size];

  return (
    <div
      className="app-loader-container"
      style={{ ['--loader-size' as string]: `${s.container}px` }}
    >
      <div className="app-loader-animation">
        <div className="al-orbit">
          <div className="al-ring al-ring-1" />
          <div className="al-ring al-ring-2" />
          <div className="al-ring al-ring-3" />
          <div className="al-core" style={{ width: s.core, height: s.core }}>
            <div className="al-pulse" />
            <svg
              width={s.core * 0.6}
              height={s.core * 0.6}
              viewBox="0 0 40 40"
              fill="none"
            >
              <defs>
                <linearGradient id="al-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4facfe" />
                  <stop offset="100%" stopColor="#00f2fe" />
                </linearGradient>
              </defs>
              <rect width="40" height="40" rx="10" fill="url(#al-logo-grad)" />
              <path
                d="M20 8L22.5 14.5L29 15L24 20L25.5 27L20 23.5L14.5 27L16 20L11 15L17.5 14.5L20 8Z"
                fill="white"
              />
            </svg>
          </div>
        </div>
        <div className="al-particles">
          <span className="al-particle al-p1" />
          <span className="al-particle al-p2" />
          <span className="al-particle al-p3" />
          <span className="al-particle al-p4" />
          <span className="al-particle al-p5" />
          <span className="al-particle al-p6" />
        </div>
      </div>

      <div className="app-loader-content">
        {message && <div className="al-title">{message}</div>}
        {subMessage && <div className="al-subtitle">{subMessage}</div>}
        {showProgress && (
          <div className="al-progress">
            <div className="al-progress-bar" />
          </div>
        )}
      </div>

      <style>{`
        .app-loader-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 32px;
          padding: 48px;
          background: var(--color-surface);
          min-height: inherit;
        }

        .app-loader-animation {
          position: relative;
          width: var(--loader-size);
          height: var(--loader-size);
        }

        .al-orbit {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .al-ring {
          position: absolute;
          border-radius: 999px;
          border: 2px solid transparent;
          animation: al-orbit-spin linear infinite;
        }

        .al-ring-1 {
          inset: 0;
          border-top-color: var(--color-primary);
          border-right-color: var(--color-border);
          animation-duration: 1.8s;
        }

        .al-ring-2 {
          inset: 14%;
          border-top-color: var(--color-accent);
          border-bottom-color: var(--color-border);
          animation-duration: 2.4s;
          animation-direction: reverse;
        }

        .al-ring-3 {
          inset: 28%;
          border-top-color: var(--color-success);
          border-left-color: var(--color-border);
          animation-duration: 1.5s;
        }

        @keyframes al-orbit-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .al-core {
          position: absolute;
          background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover, #162d4d) 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-on-primary);
          box-shadow:
            0 0 20px var(--color-primary-muted),
            0 0 40px var(--color-border);
          z-index: 2;
        }

        .al-pulse {
          position: absolute;
          inset: -25%;
          border-radius: 50%;
          background: radial-gradient(circle, var(--color-accent-muted) 0%, transparent 70%);
          animation: al-pulse-ring 2s ease-out infinite;
        }

        @keyframes al-pulse-ring {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.8); opacity: 0; }
        }

        .al-particles {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .al-particle {
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--color-primary);
          opacity: 0;
          animation: al-particle-orbit 3s ease-in-out infinite;
        }

        .al-p1 { top: 0; left: 50%; animation-delay: 0s; }
        .al-p2 { top: 50%; right: 0; animation-delay: 0.5s; background: var(--color-accent); }
        .al-p3 { bottom: 0; left: 50%; animation-delay: 1s; background: var(--color-success); }
        .al-p4 { top: 50%; left: 0; animation-delay: 1.5s; background: var(--color-accent); }
        .al-p5 { top: 15%; left: 15%; animation-delay: 0.75s; background: var(--color-warning); }
        .al-p6 { bottom: 15%; right: 15%; animation-delay: 1.25s; background: var(--color-primary); }

        @keyframes al-particle-orbit {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0);
          }
          10% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            opacity: 0.6;
            transform: translate(-50%, -50%) scale(0.8);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0);
          }
        }

        .app-loader-content {
          text-align: center;
          max-width: 320px;
        }

        .al-title {
          font-family: var(--font-headline);
          font-size: 18px;
          font-weight: 600;
          color: var(--color-text-primary);
          margin-bottom: 8px;
          letter-spacing: -0.01em;
        }

        .al-subtitle {
          font-size: 13px;
          color: var(--color-text-muted);
          margin-bottom: 20px;
          animation: al-subtitle-pulse 2s ease-in-out infinite;
        }

        @keyframes al-subtitle-pulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }

        .al-progress {
          width: 200px;
          height: 4px;
          background: var(--color-border);
          border-radius: 999px;
          overflow: hidden;
          margin: 0 auto;
        }

        .al-progress-bar {
          height: 100%;
          width: 100%;
          background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
          border-radius: 999px;
          animation: al-progress-slide 1.5s ease-in-out infinite;
          transform-origin: left;
        }

        @keyframes al-progress-slide {
          0% { transform: translateX(-100%) scaleX(0.3); }
          50% { transform: translateX(0%) scaleX(0.8); }
          100% { transform: translateX(100%) scaleX(0.3); }
        }

        @media (max-width: 768px) {
          .app-loader-container {
            padding: 24px;
            gap: 24px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .al-ring,
          .al-pulse,
          .al-particle,
          .al-progress-bar,
          .al-subtitle {
            animation: none;
          }
        }

        /* ============================================
           APP LAYOUT SYSTEM
           ============================================ */

        /* App Layout Container */
        .app-layout {
          display: flex;
          height: 100vh;
          overflow: hidden;
        }

        /* Main Content Area */
        .main-content-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          width: 100%;
        }

        @media (min-width: 1024px) {
          .main-content-area {
            margin-left: 0;
          }
        }

        /* Main Scroll Area */
        .main-scroll-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
          overflow-y: auto;
          background-color: var(--color-surface);
          padding-top: 60px;
        }

        @media (max-width: 1023px) {
          .main-scroll-area {
            padding-top: 60px;
          }
        }

        /* Page Content */
        .page-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
          padding-left: 256px;
        }

        @media (max-width: 1023px) {
          .page-content {
            padding-left: 0;
          }
        }

        /* RedNote SEO page - extra top padding to clear sticky header */
        .page-container-header {
          padding-top: 80px;
        }
        @media (max-width: 1023px) {
          .page-container-header {
            padding-top: 16px;
          }
        }

        /* Config Warning Banner */
        .config-warning-banner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 16px;
          background-color: var(--color-warning-bg);
          border-bottom: 1px solid var(--color-warning);
          color: var(--color-warning-text);
          font-size: 14px;
        }

        .config-warning-banner svg {
          flex-shrink: 0;
        }

        .config-warning-btn {
          margin-left: 16px;
          padding: 6px 16px;
          background-color: var(--color-warning);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: background-color 0.15s ease;
        }

        .config-warning-btn:hover {
          filter: brightness(1.1);
        }

        /* Selection Styling */
        ::selection {
          background-color: var(--color-primary-muted);
          color: var(--color-primary);
        }

        /* ============================================
           SEO PAGES LAYOUT
           ============================================ */
        .real-comment-container,
        .citations-container {
          padding: 24px 24px 24px 280px;
          max-width: 100%;
          box-sizing: border-box;
        }

        @media (max-width: 1023px) {
          .real-comment-container,
          .citations-container {
            padding-left: 24px;
          }
        }

        /* ============================================
           LEGACY PAGE LOADER STYLES
           ============================================ */
      `}</style>
    </div>
  );
}

// Simple inline loader for buttons and small spaces
export function InlineLoader({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ animation: 'al-inline-spin 0.8s linear infinite' }}
    >
      <style>{`
        @keyframes al-inline-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="32"
        strokeDashoffset="12"
        opacity="0.25"
      />
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="32"
        strokeDashoffset="48"
      />
    </svg>
  );
}

// Skeleton loader for content areas
export function SkeletonLoader({ lines = 3, height = 16 }: { lines?: number; height?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          style={{
            height,
            background: `linear-gradient(90deg, var(--color-surface) 25%, var(--color-border) 50%, var(--color-surface) 75%)`,
            backgroundSize: '200% 100%',
            animation: 'skeleton-loading 1.5s infinite',
            borderRadius: 4,
            width: i === lines - 1 ? '70%' : '100%',
          }}
        />
      ))}
      <style>{`
        @keyframes skeleton-loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
