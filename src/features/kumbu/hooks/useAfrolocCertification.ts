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

  return { status, isCertified, hasAddress, afrolocCode, requestCertification };
}
