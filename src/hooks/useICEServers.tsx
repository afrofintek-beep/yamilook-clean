import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ICEServersResponse {
  iceServers: RTCIceServer[];
  expiresAt: number;
}

const CACHE_KEY = 'yamilook_ice_servers';
const REFRESH_BUFFER_MS = 5 * 60 * 1000; // Refresh 5 minutes before expiry

// Minimal STUN-only fallback (no public TURN - rely on Metered)
const FALLBACK_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export function useICEServers() {
  const [iceServers, setIceServers] = useState<RTCIceServer[]>(FALLBACK_ICE_SERVERS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const expiresAtRef = useRef<number>(0);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchICEServers = useCallback(async (force = false): Promise<RTCIceServer[]> => {
    // Check cache first (unless forced refresh)
    if (!force) {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const parsed: ICEServersResponse = JSON.parse(cached);
          if (parsed.expiresAt > Date.now() + REFRESH_BUFFER_MS) {
            console.log('[ICE] Using cached ICE servers');
            setIceServers(parsed.iceServers);
            expiresAtRef.current = parsed.expiresAt;
            scheduleRefresh(parsed.expiresAt);
            return parsed.iceServers;
          }
        } catch {
          sessionStorage.removeItem(CACHE_KEY);
        }
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('[ICE] 🌐 Fetching ICE servers from edge function');
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.warn('[ICE] ⚠️ No session, using fallback servers');
        return FALLBACK_ICE_SERVERS;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-turn-credentials`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.error('[ICE] ❌ Failed to fetch ICE servers:', response.status);
        throw new Error(`Failed to fetch ICE servers: ${response.status}`);
      }

      const data: ICEServersResponse = await response.json();
      
      // Cache the response
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
      
      setIceServers(data.iceServers);
      expiresAtRef.current = data.expiresAt;
      scheduleRefresh(data.expiresAt);
      
      // Log the servers for debugging
      console.log('[ICE] ✅ Got', data.iceServers.length, 'ICE servers:');
      data.iceServers.forEach((server, i) => {
        const urls = typeof server.urls === 'string' ? server.urls : server.urls[0];
        const hasCredentials = !!server.username && !!server.credential;
        console.log(`[ICE]   ${i + 1}. ${urls.substring(0, 40)}... (credentials: ${hasCredentials})`);
      });
      
      return data.iceServers;
    } catch (err) {
      console.error('[ICE] ❌ Error fetching ICE servers:', err);
      console.log('[ICE] ⚠️ Using fallback STUN/TURN servers');
      setError(err instanceof Error ? err.message : 'Failed to fetch ICE servers');
      return FALLBACK_ICE_SERVERS;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const scheduleRefresh = useCallback((expiresAt: number) => {
    // Clear any existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    // Schedule refresh before expiry
    const refreshIn = expiresAt - Date.now() - REFRESH_BUFFER_MS;
    if (refreshIn > 0) {
      console.log('[ICE] Scheduling refresh in', Math.round(refreshIn / 1000 / 60), 'minutes');
      refreshTimeoutRef.current = setTimeout(() => {
        fetchICEServers(true);
      }, refreshIn);
    }
  }, [fetchICEServers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  // Get fresh servers for a new call
  const getServersForCall = useCallback(async (): Promise<RTCIceServer[]> => {
    // If we have valid cached servers, use them
    if (expiresAtRef.current > Date.now() + REFRESH_BUFFER_MS) {
      return iceServers;
    }
    // Otherwise fetch fresh
    return fetchICEServers(true);
  }, [iceServers, fetchICEServers]);

  return {
    iceServers,
    isLoading,
    error,
    fetchICEServers,
    getServersForCall,
  };
}
