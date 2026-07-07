import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Credit packages (prices in AOA — adjust as the exchange rate moves).
const PACKAGES: Record<string, { credits: number; kwanza: number; label: string }> = {
  start: { credits: 1000, kwanza: 9000, label: "Início" },
  pro: { credits: 5000, kwanza: 42000, label: "Pro" },
  max: { credits: 12000, kwanza: 96000, label: "Máximo" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const svc = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(url, anon, { global: { headers: { Authorization: auth } } });
    const { data: { user }, error: uerr } = await userClient.auth.getUser();
    if (uerr || !user) return json({ error: "Invalid session" }, 401);

    const { packageId, method = "GPO", phone } = await req.json();
    const pkg = PACKAGES[packageId as string];
    if (!pkg) return json({ error: "Pacote inválido" }, 400);

    const admin = createClient(url, svc);
    const { data: biz } = await admin
      .from("business_profiles").select("id").eq("user_id", user.id).maybeSingle();
    if (!biz) return json({ error: "Sem perfil de negócio" }, 400);

    // Create the pending purchase first — the source of truth for fulfilment.
    const { data: purchase, error: perr } = await admin
      .from("credit_purchases")
      .insert({
        business_id: biz.id, user_id: user.id, credits: pkg.credits,
        amount_kwanza: pkg.kwanza, provider: "appypay", method,
      })
      .select().single();
    if (perr) return json({ error: perr.message }, 500);

    // --- AppyPay charge ---
    const APPY_KEY = Deno.env.get("APPYPAY_API_KEY");
    const APPY_SECRET = Deno.env.get("APPYPAY_API_SECRET");
    if (!APPY_KEY || !APPY_SECRET) {
      // Gateway not wired yet: purchase stays 'pending' until credentials exist.
      return json({
        purchaseId: purchase.id, status: "gateway_pending",
        message: "Compra registada. Falta configurar as credenciais AppyPay (APPYPAY_API_KEY/SECRET).",
        credits: pkg.credits, amountKwanza: pkg.kwanza,
      });
    }

    // TODO(appypay): complete with the exact spec once we have sandbox docs:
    //   1) OAuth token (client_credentials with APPY_KEY/APPY_SECRET)
    //   2) POST https://api.appypay.ao/... /charges  with body:
    //        { amount: pkg.kwanza, currency: "AOA", paymentMethod: method,
    //          reference: purchase.id, phoneNumber: phone,
    //          callbackUrl: `${url}/functions/v1/appypay-webhook`,
    //          description: `Yamilook créditos (${pkg.credits})` }
    //   3) save the returned charge id -> credit_purchases.provider_ref
    //   4) return the payment instruction (Multicaixa Express push / REF + expiry)
    return json({ purchaseId: purchase.id, status: "created", message: "AppyPay charge — a completar" });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "error" }, 500);
  }
});
