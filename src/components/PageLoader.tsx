import React from 'react';
import { AppLoader } from './AppLoader';

interface PageLoaderProps {
  message?: string;
  subMessage?: string;
}

export function PageLoader({ message, subMessage }: PageLoaderProps) {
  return (
    <div className="page-loader-wrapper">
      <AppLoader message={message} subMessage={subMessage} />
      <style>{`
        .page-loader-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: calc(100vh - 200px);
        }
      `}</style>
    </div>
  );
}
