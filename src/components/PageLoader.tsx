import React from 'react';

interface PageLoaderProps {
  message?: string;
  subMessage?: string;
}

export function PageLoader({ message, subMessage }: PageLoaderProps) {
  return (
    <div className="pgloader">
      <div className="pgloader-orb">
        <div className="pgloader-ring pgloader-ring-outer" />
        <div className="pgloader-ring pgloader-ring-middle" />
        <div className="pgloader-ring pgloader-ring-inner" />
        <div className="pgloader-core">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L12 6M12 18L12 22M2 12L6 12M18 12L22 12M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <div className="pgloader-dot pgloader-dot-1" />
        <div className="pgloader-dot pgloader-dot-2" />
        <div className="pgloader-dot pgloader-dot-3" />
      </div>
      <div className="pgloader-text">
        <div className="pgloader-title">{message || 'Loading...'}</div>
        {subMessage && <div className="pgloader-sub">{subMessage}</div>}
        <div className="pgloader-bar">
          <div className="pgloader-bar-inner" />
        </div>
      </div>
    </div>
  );
}
