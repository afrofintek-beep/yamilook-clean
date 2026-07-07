import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// AppyPay calls this endpoint (the charge's callbackUrl) when a payment settles.
// verify_jwt is disabled for this function (see config.toml) — AppyPay has no
// Supabase JWT. Fulfilment is idempotent via fulfill_credit_purchase().

serve(async (req) => {
  const jr = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });
  if (req.method !== "POST") return jr({ error: "Method Not Allowed" }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const svc = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, svc);

    const payload = await req.json().catch(() => ({} as Record<string, unknown>));

    // TODO(appypay): verify the callback signature/shared-secret before trusting it.
    // Map AppyPay's payload to our fields once we have the exact spec. We put our
    // credit_purchases.id in the charge "reference", so read it back here.
    const purchaseId =
      (payload.reference ?? payload.merchantTransactionId ?? payload.merchantReference) as string | undefined;
    const providerRef =
      (payload.id ?? payload.chargeId ?? payload.transactionId ?? null) as string | null;
    const status = String(payload.status ?? payload.state ?? "").toLowerCase();

    if (!purchaseId) return jr({ error: "missing reference" }, 400);

    const paid = ["paid", "success", "successful", "completed", "settled", "accepted", "approved"].includes(status);
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
