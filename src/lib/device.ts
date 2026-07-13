import { supabase } from '@/integrations/supabase/client';

const KEY = 'yl_device_fp';

/** Stable per-browser fingerprint (persisted in localStorage). Weak but useful:
 *  two accounts on the same browser profile share it → collusion signal. */
function getFingerprint(): string {
  try {
    let fp = localStorage.getItem(KEY);
    if (!fp) {
      fp = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(KEY, fp);
    }
    return fp;
  } catch {
    return 'unknown';
  }
}

function parseUA() {
  const ua = navigator.userAgent || '';
  const platform = /android/i.test(ua) ? 'Android'
    : /iphone|ipad|ipod/i.test(ua) ? 'iOS'
    : /windows/i.test(ua) ? 'Windows'
    : /mac/i.test(ua) ? 'macOS'
    : /linux/i.test(ua) ? 'Linux' : 'Web';
  const browser = /edg/i.test(ua) ? 'Edge'
    : /chrome|crios/i.test(ua) ? 'Chrome'
    : /firefox|fxios/i.test(ua) ? 'Firefox'
    : /safari/i.test(ua) ? 'Safari' : 'Browser';
  const device_type = /ipad|tablet/i.test(ua) ? 'tablet'
    : /mobile|android|iphone|ipod/i.test(ua) ? 'mobile' : 'desktop';
  return { platform, browser, device_type };
}

/** Record the current device for the signed-in user (anti-collusion signal
 *  used by users_share_device). Best-effort — never throws into the auth flow. */
export async function recordDevice(userId: string): Promise<void> {
  try {
    const fingerprint = getFingerprint();
    const { platform, browser, device_type } = parseUA();
    await supabase.from('device_sessions').upsert(
      {
        user_id: userId, fingerprint, platform, browser, device_type,
        is_current: true, last_active: new Date().toISOString(),
      },
      { onConflict: 'user_id,fingerprint' },
    );
  } catch {
    // device recording must never block login
  }
}
