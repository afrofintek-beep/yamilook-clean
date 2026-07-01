import { useEffect } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useAuth } from '@/hooks/useAuth';

/**
 * Component that tracks and updates the current user's online status.
 * Should be rendered once at the app root level.
 */
export function OnlineStatusTracker() {
  const { user } = useAuth();
  useOnlineStatus(); // This hook handles all the online status tracking

  return null; // This component doesn't render anything
}
