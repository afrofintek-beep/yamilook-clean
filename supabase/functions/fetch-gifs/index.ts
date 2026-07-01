import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory rate limiting (per user)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 30; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute in ms

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  
  if (userLimit.count >= RATE_LIMIT) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check rate limit
    if (!checkRateLimit(user.id)) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please wait a moment." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { action, query } = await req.json();
    
    // Validate action
    if (!action || !["trending", "search"].includes(action)) {
      return new Response(
        JSON.stringify({ error: "Invalid action. Use 'trending' or 'search'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate search query if provided
    if (action === "search" && query) {
      if (typeof query !== "string" || query.length > 100) {
        return new Response(
          JSON.stringify({ error: "Invalid search query" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const tenorApiKey = Deno.env.get("TENOR_API_KEY");
    if (!tenorApiKey) {
      console.error("TENOR_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "GIF service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let tenorUrl: string;
    
    if (action === "trending") {
      tenorUrl = `https://tenor.googleapis.com/v2/featured?key=${tenorApiKey}&limit=20&media_filter=gif`;
    } else {
      const encodedQuery = encodeURIComponent(query || "");
      tenorUrl = `https://tenor.googleapis.com/v2/search?key=${tenorApiKey}&q=${encodedQuery}&limit=20&media_filter=gif`;
    }

    // Fetch from Tenor API
    const tenorResponse = await fetch(tenorUrl);
    
    if (!tenorResponse.ok) {
      console.error("Tenor API error:", tenorResponse.status);
      return new Response(
        JSON.stringify({ error: "Failed to fetch GIFs" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tenorData = await tenorResponse.json();
    
    // Transform response to only include needed data
    const results = (tenorData.results || []).map((item: Record<string, unknown>) => ({
      id: item.id,
      url: (item.media_formats as Record<string, { url?: string }>)?.gif?.url || 
           (item.media_formats as Record<string, { url?: string }>)?.mediumgif?.url,
      preview: (item.media_formats as Record<string, { url?: string }>)?.tinygif?.url || 
               (item.media_formats as Record<string, { url?: string }>)?.nanogif?.url,
      title: item.title || "",
    }));

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Fetch GIFs error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
