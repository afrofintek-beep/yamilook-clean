import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Free API - no key required
const EXCHANGE_RATE_API = "https://open.er-api.com/v6/latest/USD";

interface ExchangeRateResponse {
  result: string;
  base_code: string;
  time_last_update_utc: string;
  rates: Record<string, number>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Fetching exchange rates from API...");
    
    // Fetch current rates from free API
    const response = await fetch(EXCHANGE_RATE_API);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data: ExchangeRateResponse = await response.json();
    
    if (data.result !== "success") {
      throw new Error("API returned unsuccessful result");
    }

    console.log("Rates fetched successfully. Last update:", data.time_last_update_utc);

    // Get all active currencies from our database
    const { data: currencies, error: fetchError } = await supabase
      .from("currency_rates")
      .select("*")
      .eq("is_active", true);

    if (fetchError) {
      throw new Error(`Database fetch error: ${fetchError.message}`);
    }

    const updates: { code: string; success: boolean; rate?: number }[] = [];

    // Update each currency with new rate
    for (const currency of currencies || []) {
      const apiRate = data.rates[currency.currency_code];
      
      if (apiRate) {
        // rate_to_usd is how much 1 unit of local currency is worth in USD
        // API gives us how many units of local currency per 1 USD
        // So rate_to_usd = 1 / apiRate
        const rateToUsd = 1 / apiRate;
        
        // Also calculate EUR rate (using EUR from API)
        const eurRate = data.rates["EUR"] || 0.92;
        const rateToEur = 1 / (apiRate / eurRate);

        const { error: updateError } = await supabase
          .from("currency_rates")
          .update({
            rate_to_usd: rateToUsd,
            rate_to_eur: rateToEur,
            updated_at: new Date().toISOString(),
          })
          .eq("currency_code", currency.currency_code);

        if (updateError) {
          console.error(`Failed to update ${currency.currency_code}:`, updateError);
          updates.push({ code: currency.currency_code, success: false });
        } else {
          console.log(`Updated ${currency.currency_code}: 1 ${currency.currency_code} = $${rateToUsd.toFixed(6)}`);
          updates.push({ code: currency.currency_code, success: true, rate: rateToUsd });
        }
      } else {
        console.warn(`No rate found for ${currency.currency_code}`);
        updates.push({ code: currency.currency_code, success: false });
      }
    }

    const successCount = updates.filter(u => u.success).length;
    const failCount = updates.filter(u => !u.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Updated ${successCount} currencies, ${failCount} failed`,
        lastUpdate: data.time_last_update_utc,
        updates,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error updating currency rates:", errorMessage);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
