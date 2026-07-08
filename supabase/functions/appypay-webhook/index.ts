import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// AppyPay calls this endpoint when a charge settles. verify_jwt is disabled
// (see config.toml) — AppyPay has no Supabase JWT. We authenticate the call with
// a shared secret sent as the custom webhook parameter `x-yamilook-token`, and
// fulfilment is idempotent via fulfill_credit_purchase().

serve(async (req) => {
  const jr = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });
  if (req.method !== "POST") return jr({ error: "Method Not Allowed" }, 405);

  try {
    const raw = await req.text();
    // Log the first real payloads so we can confirm AppyPay's exact field names.
    console.log("appypay-webhook payload:", raw.slice(0, 2000));

    // deno-lint-ignore no-explicit-any
    let payload: any = {};
    try { payload = JSON.parse(raw); } catch { /* non-JSON body */ }

    // --- authenticate the caller via the shared token (header / query / body) ---
    const expected = Deno.env.get("APPYPAY_WEBHOOK_TOKEN");
    if (expected) {
      const provided =
        req.headers.get("x-yamilook-token") ??
        new URL(req.url).searchParams.get("token") ??
        payload["x-yamilook-token"] ??
        payload.token ??
        "";
      if (provided !== expected) return jr({ error: "unauthorized" }, 401);
    }

    const url = Deno.env.get("SUPABASE_URL")!;
    const svc = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, svc);

    // We put credit_purchases.id in merchantTransactionId, so read it back here.
    const purchaseId = (payload.merchantTransactionId ?? payload.reference ??
      payload.merchantReference ?? payload.merchant_transaction_id) as string | undefined;
    const providerRef = (payload.id ?? payload.chargeId ?? payload.transactionId ??
      payload.charge_id ?? null) as string | null;
    const status = String(
      payload.status ?? payload.state ?? payload.paymentStatus ?? payload.responseStatus ?? "",
    ).toLowerCase();

    if (!purchaseId) return jr({ error: "missing merchantTransactionId" }, 400);

    const paid = ["paid", "success", "successful", "completed", "settled", "accepted", "approved", "captured"]
      .some((s) => status.includes(s));
    if (!paid) return jr({ ok: true, ignored: status || "unknown" });

    const { data, error } = await admin.rpc("fulfill_credit_purchase", {
      p_purchase_id: purchaseId,
      p_provider_ref: providerRef,
    });
    if (error) return jr({ error: error.message }, 500);
    return jr({ ok: true, result: data });
  } catch (e) {
    return jr({ error: e instanceof Error ? e.message : "error" }, 500);
  }
});
