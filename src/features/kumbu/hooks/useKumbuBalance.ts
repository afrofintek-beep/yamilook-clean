import { useAuth } from '@/hooks/useAuth';
import { levelFor, levelProgress } from '../copy';

/** Derives Kumbu balance, level and progress from the auth profile. */
export function useKumbuBalance() {
  const { profile, loading } = useAuth();

  const available = profile?.kumbu_available ?? 0;
  const lifetime = profile?.kumbu_lifetime ?? 0;
  const level = levelFor(lifetime);
  const progress = levelProgress(lifetime);

  return { available, lifetime, level, progress, loading };
}
