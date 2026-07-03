import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Verifies, via the AFROLOC partner API, whether the calling Yamilook user's
 * (already phone-verified) number owns a certified AFROLOC address, and if so
 * marks their Yamilook profile as certified. No second OTP: the phone was
 * verified when the user signed up to each app.
 *
 * Required secrets: AFROLOC_API_URL (…/functions/v1/api-v1), YAMILOOK_PARTNER_KEY.
 */
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) return json({ error: "Invalid token" }, 401);
    const userId = claimsData.claims.sub as string;

    const admin = createClient(supabaseUrl, serviceKey);

    // The user's phone, verified at Yamilook sign-up.
    const { data: profile } = await admin
      .from("profiles")
      .select("phone_number")
      .eq("id", userId)
      .single();
    const phone = (profile?.phone_number ?? "").trim();
    if (!phone) return json({ certified: false, reason: "no_phone" });

    const afrolocUrl = Deno.env.get("AFROLOC_API_URL");
    const partnerKey = Deno.env.get("YAMILOOK_PARTNER_KEY");
    if (!afrolocUrl || !partnerKey) {
      return json({ error: "AFROLOC integration not configured" }, 500);
    }

    const res = await fetch(`${afrolocUrl}/partners/certification-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-partner-key": partnerKey },
      body: JSON.stringify({ phone }),
    });
    const payload = await res.json().catch(() => ({}));
    // api-v1 wraps successful results as { success, data }.
    const data = (payload?.data ?? payload) as { certified?: boolean; code?: string; reason?: string };

    if (!data?.certified) {
      return json({ certified: false, reason: data?.reason ?? "not_certified" });
    }

    await admin
      .from("profiles")
      .update({
        afroloc_certification_status: "certified",
        afroloc_certified_at: new Date().toISOString(),
        ...(data.code ? { afroloc_code: data.code } : {}),
      })
      .eq("id", userId);

    return json({ certified: true, code: data.code ?? null });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "unexpected" }, 500);
  }
});
