const BASE = "https://api.skalepayments.com.br";

export type SkaleTx = { id?: string; status?: string; pix?: { qrcode?: string | null; qrcodeImage?: string | null } | null; message?: string };

export async function skaleFetch(path: string, init?: RequestInit): Promise<{ ok: boolean; status: number; body: SkaleTx }> {
  const key = process.env["SKALE_API_KEY"];
  if (!key) throw new Error("Pagamento não configurado");
  const started = Date.now();
  const res = await fetch(BASE + path, {
    ...init,
    signal: AbortSignal.timeout(20000),
    headers: { "Content-Type": "application/json", "X-API-Key": key, ...(init?.headers ?? {}) },
  });
  const text = await res.text();
  let body: SkaleTx = {};
  try { body = JSON.parse(text) as SkaleTx; } catch { console.error("skale non-json", res.status, text.slice(0, 300)); }
  console.log("skale", init?.method ?? "GET", path, res.status, `${Date.now() - started}ms`);
  return { ok: res.ok, status: res.status, body };
}

export function mapStatus(s?: string): "pending" | "paid" | "failed" {
  if (s === "paid") return "paid";
  if (s === "refused" || s === "cancelled" || s === "refunded") return "failed";
  return "pending";
}

/** Re-reads the transaction from the gateway (source of truth) and updates the order. */
export async function syncOrderFromGateway(txId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const r = await skaleFetch(`/transactions/${encodeURIComponent(txId)}`);
  if (!r.ok) return null;
  const status = mapStatus(r.body.status);
  if (status !== "pending") {
    await supabaseAdmin.from("orders").update({ status }).eq("gateway_transaction_id", txId).eq("status", "pending");
  }
  return status;
}
