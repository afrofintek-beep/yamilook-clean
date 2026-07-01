/* @refresh reset */
import React, { createContext, useContext } from 'react';
import { useLiveStream } from '@/hooks/useLiveStream';

type LiveStreamContextValue = ReturnType<typeof useLiveStream>;

const LiveStreamContext = createContext<LiveStreamContextValue | null>(null);

export function LiveStreamProvider({ children }: { children: React.ReactNode }) {
  const value = useLiveStream();
  return <LiveStreamContext.Provider value={value}>{children}</LiveStreamContext.Provider>;
}

export function useLiveStreamContext() {
  const ctx = useContext(LiveStreamContext);
  if (!ctx) {
    throw new Error('useLiveStreamContext must be used within LiveStreamProvider');
  }
  return ctx;
}
