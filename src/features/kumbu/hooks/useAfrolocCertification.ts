import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export type AfrolocCertStatus = 'none' | 'pending' | 'certified' | 'rejected';

export interface AfrolocCertResult {
  success: boolean;
  status?: string;
  error?: string;
}

/**
 * Reads the current user's AFROLOC address-certification status from the auth
 * profile and lets them request certification. A "certified" address is the
 * gate for monetization (creator application + payouts).
 */
export function useAfrolocCertification() {
  const { profile, refreshProfile } = useAuth();

  const status = (profile?.afroloc_certification_status ?? 'none') as AfrolocCertStatus;
  const afrolocCode = profile?.afroloc_code ?? null;
  const hasAddress = !!afrolocCode;
  const isCertified = status === 'certified';

  const requestCertification = async (): Promise<AfrolocCertResult> => {
    const { data, error } = await supabase.rpc('request_afroloc_certification');
    if (error) return { success: false, error: error.message };
    const res = (data ?? {}) as AfrolocCertResult;
    if (res.success) await refreshProfile();
    return res;
  };

  /**
   * Auto-verify against the AFROLOC partner API (by phone). On success the
   * profile is certified server-side; we then refresh it locally.
   */
  const verifyWithAfroloc = async (): Promise<{ certified: boolean; reason?: string }> => {
    const { data, error } = await supabase.functions.invoke('afroloc-verify');
    if (error) return { certified: false, reason: 'error' };
    const res = (data ?? {}) as { certified?: boolean; reason?: string };
    if (res.certified) await refreshProfile();
    return { certified: !!res.certified, reason: res.reason };
  };

  return { status, isCertified, hasAddress, afrolocCode, requestCertification, verifyWithAfroloc };
}
