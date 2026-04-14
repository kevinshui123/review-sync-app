import React from 'react';

interface PageLoaderProps {
  message?: string;
  subMessage?: string;
}

export function PageLoader({ message, subMessage }: PageLoaderProps) {
  return (
    <div className="page-loader-container">
      <div className="page-loader-animation">
        <div className="pl-orbit">
          <div className="pl-ring pl-ring-1" />
          <div className="pl-ring pl-ring-2" />
          <div className="pl-ring pl-ring-3" />
          <div className="pl-core">
            <div className="pl-pulse" />
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3" fill="currentColor" />
            </svg>
          </div>
        </div>
        <div className="pl-particles">
          <span className="pl-particle pl-p1" />
          <span className="pl-particle pl-p2" />
          <span className="pl-particle pl-p3" />
          <span className="pl-particle pl-p4" />
          <span className="pl-particle pl-p5" />
          <span className="pl-particle pl-p6" />
        </div>
      </div>
      <div className="page-loader-content">
        <div className="pl-title">{message || 'Loading...'}</div>
        {subMessage && <div className="pl-subtitle">{subMessage}</div>}
        <div className="pl-progress">
          <div className="pl-progress-bar" />
        </div>
      </div>
    </div>
  );
}
