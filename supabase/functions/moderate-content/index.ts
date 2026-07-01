// Content moderation edge function.
//
// Fail-open stub that always approves the content. Replace the implementation
// with your preferred moderation provider (e.g. OpenAI Moderation, Perspective
// API, custom classifier) by reading credentials from `Deno.env` and calling
// the provider's HTTP API.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { content } = await req.json().catch(() => ({ content: "" }));

    if (!content || typeof content !== "string") {
      return new Response(
        JSON.stringify({ approved: true, reason: null, category: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // TODO: wire up your moderation provider here.
    return new Response(
      JSON.stringify({ approved: true, reason: null, category: null }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("moderate-content error:", e);
    return new Response(
      JSON.stringify({ approved: true, reason: null, category: null }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
