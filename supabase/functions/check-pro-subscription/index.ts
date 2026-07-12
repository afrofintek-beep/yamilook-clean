import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// Reconciles pending Pro-subscription purchases by querying the AppyPay charge
// status and activating Pro on the paid ones. Mirrors check-appypay-payment
// (the webhook isn't reliably delivered → polling is the source of truth).
// User-scoped by default; { all: true } with the service role reconciles all.

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BASE = Deno.env.get("APPYPAY_BASE_URL") ?? "https://gwy-api-tst.appypay.co.ao";
const TOKEN_URL = Deno.env.get("APPYPAY_TOKEN_URL") ??
  "https://login.microsoftonline.com/appypaydev.onmicrosoft.com/oauth2/token";
const RESOURCE = Deno.env.get("APPYPAY_RESOURCE") ?? "2aed7612-de64-46b5-9e59-1f48f8902d14";

async function getAppyToken(): Promise<string | null> {
  const key = Deno.env.get("APPYPAY_API_KEY");
  const secret = Deno.env.get("APPYPAY_API_SECRET");
  if (!key || !secret) return null;
  const body = new URLSearchParams({ grant_type: "client_credentials", client_id: key, client_secret: secret, resource: RESOURCE });
  const r = await fetch(TOKEN_URL, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
  const j = await r.json().catch(() => ({}));
  return j.access_token ?? null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const svc = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, svc);

    const { purchaseId, all } = await req.json().catch(() => ({}));

    let query = admin.from("subscription_purchases").select("id, provider_ref, merchant_ref, status").eq("status", "pending");
    if (all === true) {
      const authKey = req.headers.get("apikey") ?? req.headers.get("Authorization")?.replace("Bearer ", "");
      if (authKey !== svc) return json({ error: "forbidden" }, 403);
    } else {
      const auth = req.headers.get("Authorization");
      if (!auth?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
      const userClient = createClient(url, anon, { global: { headers: { Authorization: auth } } });
      const { data: { user } } = await userClient.auth.getUser();
      if (!user) return json({ error: "Invalid session" }, 401);
      query = query.eq("user_id", user.id);
      if (purchaseId) query = query.eq("id", purchaseId);
    }

    const { data: pending } = await query.limit(50);
    if (!pending || pending.length === 0) return json({ checked: 0, activated: 0 });

    const token = await getAppyToken();
    if (!token) return json({ error: "token failed" }, 502);

    let activated = 0;
    for (const p of pending) {
      const ref = p.provider_ref ?? p.merchant_ref;
      if (!ref) continue;
      const r = await fetch(`${BASE}/v2.0/charges/${ref}`, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } });
      if (!r.ok) continue;
      // deno-lint-ignore no-explicit-any
      const data: any = await r.json().catch(() => ({}));
      const status = String(data?.payment?.status ?? data?.status ?? "").toLowerCase();
      if (status === "success") {
        await admin.rpc("fulfill_pro_subscription", { p_purchase_id: p.id, p_provider_ref: p.provider_ref ?? null });
        activated++;
      }
    }
    return json({ checked: pending.length, activated });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "error" }, 500);
  }
});
