import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Business image mappings
const businessImages: Record<string, { logo: string; cover: string }> = {
  "da548bf5-e806-40f9-bda8-2331aecce823": { // Mama mia
    logo: "mama-mia-logo.png",
    cover: "mama-mia-cover.jpg"
  },
  "a5037430-3a5b-495c-a85a-dbf97158cdd7": { // AFROFINTEK
    logo: "afrofintek-logo.png", 
    cover: "afrofintek-cover.jpg"
  },
  "7bab76ec-a284-492f-983a-3c28da256198": { // Chuva de ideias
    logo: "chuva-ideias-logo.png",
    cover: "chuva-ideias-cover.jpg"
  },
  "ef1be53a-4303-4aeb-81b5-abea3c738cc1": { // Matabicho
    logo: "matabicho-logo.png",
    cover: "matabicho-cover.jpg"
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const results: any[] = [];

    for (const [businessId, images] of Object.entries(businessImages)) {
      // Check if business exists and needs images
      const { data: business, error: fetchError } = await supabase
        .from("business_profiles")
        .select("id, business_name, logo_url, cover_image_url")
        .eq("id", businessId)
        .single();

      if (fetchError || !business) {
        results.push({ businessId, status: "not_found" });
        continue;
      }

      // Skip if already has images
      if (business.logo_url && business.cover_image_url) {
        results.push({ businessId, name: business.business_name, status: "already_has_images" });
        continue;
      }

      // Use placeholder URLs (we'll update with real storage URLs)
      const baseUrl = `${supabaseUrl}/storage/v1/object/public/media/business`;
      const logoUrl = `${baseUrl}/${images.logo}`;
      const coverUrl = `${baseUrl}/${images.cover}`;

      // Update business profile with demo image URLs
      const { error: updateError } = await supabase
        .from("business_profiles")
        .update({
          logo_url: logoUrl,
          cover_image_url: coverUrl
        })
        .eq("id", businessId);

      if (updateError) {
        results.push({ businessId, name: business.business_name, status: "update_failed", error: updateError.message });
      } else {
        results.push({ businessId, name: business.business_name, status: "updated", logoUrl, coverUrl });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
