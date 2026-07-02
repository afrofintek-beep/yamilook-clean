import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RTCIceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

interface ICEServersResponse {
  iceServers: RTCIceServer[];
  expiresAt: number;
}

// Shape of a single entry returned by the Metered TURN credentials API
interface MeteredIceServer {
  urls?: string | string[];
  url?: string | string[];
  username?: string;
  credential?: string;
}

// Minimal STUN fallback
const FALLBACK_STUN_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

// --- Rate Limiting ---
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // requests per minute per user
const RATE_WINDOW = 60 * 1000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// Periodic cleanup of stale entries (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) rateLimitMap.delete(key);
  }
}, 5 * 60 * 1000);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub as string;

    // Rate limit check
    if (!checkRateLimit(userId)) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please wait a moment." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Metered credentials from environment
    const meteredApiKey = Deno.env.get("METERED_TURN_API_KEY");
    const meteredAppName = Deno.env.get("METERED_TURN_APP_NAME") || "yamilook";

    let iceServers: RTCIceServer[] = [...FALLBACK_STUN_SERVERS];
    let expiresAt = Date.now() + 24 * 60 * 60 * 1000;

    if (meteredApiKey) {
      try {
        const meteredUrl = `https://${meteredAppName}.metered.live/api/v1/turn/credentials?apiKey=${meteredApiKey}`;
        const response = await fetch(meteredUrl);

        if (!response.ok) {
          throw new Error(`Metered API returned ${response.status}: ${await response.text()}`);
        }

        const meteredCredentials = await response.json();

        if (Array.isArray(meteredCredentials) && meteredCredentials.length > 0) {
          expiresAt = Date.now() + 23 * 60 * 60 * 1000;

          const validTurnServers: RTCIceServer[] = (meteredCredentials as MeteredIceServer[])
            .filter((server) => {
              if (server.urls && (
                (typeof server.urls === 'string' && server.urls.startsWith('stun:')) ||
                (Array.isArray(server.urls) && server.urls.some((u: string) => u.startsWith('stun:')))
              )) return true;
              return !!(server.urls && server.username && server.credential);
            })
            .map((server) => ({
              urls: server.urls || server.url || [],
              ...(server.username && { username: server.username }),
              ...(server.credential && { credential: server.credential }),
            }));

          iceServers = [...FALLBACK_STUN_SERVERS, ...validTurnServers];
        }
      } catch (meteredError) {
        console.error("[TURN] Metered API error:", meteredError);
      }
    } else {
      console.error("[TURN] METERED_TURN_API_KEY not configured");
    }

    const result: ICEServersResponse = { iceServers, expiresAt };

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[TURN] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
