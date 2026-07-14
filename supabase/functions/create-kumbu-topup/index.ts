import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// Buy Kumbu via AppyPay. On payment, credits PURCHASED Kumbu (spend-only,
// non-withdrawable) via fulfill_kumbu_purchase. Mirrors create-pro-subscription.

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Kumbu packages (AOA). Adjust as the market/rate moves.
const PACKAGES: Record<string, { kumbu: number; kwanza: number; label: string }> = {
  p100: { kumbu: 100, kwanza: 1000, label: "100 Kumbu" },
  p500: { kumbu: 500, kwanza: 4500, label: "500 Kumbu" },
  p1200: { kumbu: 1200, kwanza: 10000, label: "1200 Kumbu" },
};

const BASE = Deno.env.get("APPYPAY_BASE_URL") ?? "https://gwy-api-tst.appypay.co.ao";
const TOKEN_URL = Deno.env.get("APPYPAY_TOKEN_URL") ??
  "https://login.microsoftonline.com/appypaydev.onmicrosoft.com/oauth2/token";
const RESOURCE = Deno.env.get("APPYPAY_RESOURCE") ?? "2aed7612-de64-46b5-9e59-1f48f8902d14";

async function getAppyToken(clientId: string, clientSecret: string): Promise<string> {
  const body = new URLSearchParams({ grant_type: "client_credentials", client_id: clientId, client_secret: clientSecret, resource: RESOURCE });
  const r = await fetch(TOKEN_URL, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) throw new Error(`Auth AppyPay falhou: ${j.error_description ?? j.error ?? r.status}`);
  return j.access_token as string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

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
    if (method !== "GPO" && method !== "REF") return json({ error: "Método inválido" }, 400);

    const admin = createClient(url, svc);
    const { data: purchase, error: perr } = await admin
      .from("kumbu_purchases")
      .insert({ user_id: user.id, kumbu: pkg.kumbu, amount_kwanza: pkg.kwanza, provider: "appypay", method })
      .select().single();
    if (perr) return json({ error: perr.message }, 500);

    const fail = async (msg: string, status = 502, detail?: unknown) => {
      await admin.from("kumbu_purchases").update({ status: "failed" }).eq("id", purchase.id);
      return json({ error: msg, detail }, status);
    };

    const APPY_KEY = Deno.env.get("APPYPAY_API_KEY");
    const APPY_SECRET = Deno.env.get("APPYPAY_API_SECRET");
    if (!APPY_KEY || !APPY_SECRET) {
      return json({ purchaseId: purchase.id, status: "gateway_pending", message: "Compra registada. Falta configurar as credenciais AppyPay.", kumbu: pkg.kumbu, amountKwanza: pkg.kwanza });
    }

    const methodKey = method === "REF" ? Deno.env.get("APPYPAY_REF_KEY") : Deno.env.get("APPYPAY_GPO_KEY");
    if (!methodKey) return await fail(`Chave AppyPay em falta para ${method} (APPYPAY_${method}_KEY).`, 500);

    const cleanPhone = typeof phone === "string" ? phone.replace(/\D/g, "") : "";
    if (method === "GPO" && cleanPhone.length < 9) return await fail("Número de telemóvel obrigatório para Multicaixa Express.", 400);

    const merchantRef = String(purchase.id).replace(/-/g, "").slice(0, 15);
    await admin.from("kumbu_purchases").update({ merchant_ref: merchantRef }).eq("id", purchase.id);

    // deno-lint-ignore no-explicit-any
    const chargeBody: Record<string, any> = {
      amount: pkg.kwanza, currency: "AOA", description: `Yamilook ${pkg.label}`,
      merchantTransactionId: merchantRef, paymentMethod: methodKey,
    };
    if (method === "GPO") chargeBody.paymentInfo = { phoneNumber: cleanPhone };

    let token: string;
    try { token = await getAppyToken(APPY_KEY, APPY_SECRET); }
    catch (e) { return await fail(e instanceof Error ? e.message : "Auth AppyPay falhou", 502); }

    const cr = await fetch(`${BASE}/v2.0/charges`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(chargeBody),
    });
    // deno-lint-ignore no-explicit-any
    const charge: any = await cr.json().catch(() => ({}));
    if (!cr.ok) return await fail(`AppyPay recusou o pagamento: ${charge?.message ?? charge?.error ?? cr.status}`, 502, charge);

    const chargeId = charge?.id ?? charge?.chargeId ?? charge?.transactionId ?? null;
    if (chargeId) await admin.from("kumbu_purchases").update({ provider_ref: String(chargeId) }).eq("id", purchase.id);

    const rs = charge?.responseStatus ?? {};
    if (Number(rs?.code) === 100) {
      await admin.rpc("fulfill_kumbu_purchase", { p_purchase_id: purchase.id, p_provider_ref: chargeId ?? null });
      return json({ purchaseId: purchase.id, status: "paid", method, message: `Pagamento confirmado! +${pkg.kumbu} Kumbu. ✅`, kumbu: pkg.kumbu, amountKwanza: pkg.kwanza, charge });
    }
    if (method === "GPO") {
      return json({ purchaseId: purchase.id, status: "pending_push", method: "GPO", message: "Confirma o pagamento no teu telemóvel (Multicaixa Express).", kumbu: pkg.kumbu, amountKwanza: pkg.kwanza, charge });
    }
    const refObj = rs?.reference ?? charge?.reference ?? {};
    return json({ purchaseId: purchase.id, status: "pending_ref", method: "REF", message: "Referência gerada. Paga no Multicaixa Express, ATM ou Internet Banking.", entity: refObj?.entity ?? null, reference: refObj?.referenceNumber ?? null, kumbu: pkg.kumbu, amountKwanza: pkg.kwanza, charge });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "error" }, 500);
  }
});
