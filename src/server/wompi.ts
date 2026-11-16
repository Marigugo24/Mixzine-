import { createHash, timingSafeEqual } from "node:crypto";
import { q } from "./db";

export const PRECIOS = {
  mensual: { cents: 9900 * 100, dias: 30 },
  anual: { cents: 79900 * 100, dias: 365 },
} as const;
export type PlanId = keyof typeof PRECIOS;

export const wompiConfigurado = () => !!(process.env.WOMPI_PUBLIC_KEY && process.env.WOMPI_INTEGRITY_SECRET);
const apiBase = () => ((process.env.WOMPI_PUBLIC_KEY ?? "").startsWith("pub_test_") ? "https://sandbox.wompi.co/v1" : "https://production.wompi.co/v1");

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

/** Web Checkout de Wompi: la firma de integridad evita que alguien cambie monto o referencia en el navegador. */
export function urlCheckout(reference: string, cents: number, redirect: string, email?: string) {
  const firma = sha256(`${reference}${cents}COP${process.env.WOMPI_INTEGRITY_SECRET}`);
  const p = new URLSearchParams({ "public-key": process.env.WOMPI_PUBLIC_KEY!, currency: "COP", "amount-in-cents": String(cents), reference, "signature:integrity": firma, "redirect-url": redirect });
  if (email) p.set("customer-data:email", email);
  return `https://checkout.wompi.co/p/?${p}`;
}

const igual = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
const ruta = (o: unknown, path: string) => path.split(".").reduce<unknown>((x, k) => (x && typeof x === "object" ? (x as Record<string, unknown>)[k] : undefined), o);

export type EventoWompi = { event?: string; data?: { transaction?: { id: string; reference: string; status: string; amount_in_cents: number; currency: string } }; signature?: { properties?: string[]; checksum?: string }; timestamp?: number };

/** Verifica el checksum del evento (SHA-256 de los campos de signature.properties + timestamp + secreto de eventos). */
export function eventoValido(ev: EventoWompi, headerChecksum?: string | null) {
  const secret = process.env.WOMPI_EVENTS_SECRET;
  const props = ev.signature?.properties;
  const esperado = ev.signature?.checksum ?? headerChecksum;
  if (!secret || !props?.length || !esperado || ev.timestamp === undefined) return false;
  const base = props.map((p) => String(ruta(ev.data, p) ?? "")).join("") + String(ev.timestamp) + secret;
  return igual(sha256(base), String(esperado));
}

/** Aplica el resultado de una transacción. Es idempotente: un pago aprobado solo suma tiempo una vez. */
export async function aplicarTransaccion(t: { id: string; reference: string; status: string; amount_in_cents: number; currency: string }): Promise<"aprobado" | "pendiente" | "rechazado" | "desconocido"> {
  const pago = (await q<{ user_id: string; plan: PlanId; amount_cents: string; aplicado: boolean }>("SELECT user_id,plan,amount_cents,aplicado FROM payments WHERE reference=$1", [t.reference]))[0];
  if (!pago) return "desconocido";
  // el monto y la moneda deben ser los que nosotros creamos
  if (Number(pago.amount_cents) !== Number(t.amount_in_cents) || t.currency !== "COP") return "rechazado";
  if (t.status === "APPROVED") {
    const nuevo = await q<{ user_id: string }>("UPDATE payments SET aplicado=true,status='APPROVED',wompi_id=$2,updated_at=now() WHERE reference=$1 AND aplicado=false RETURNING user_id", [t.reference, t.id]);
    if (nuevo.length) {
      await q(
        `UPDATE users SET premium_plan=$2, premium_until = GREATEST(COALESCE(premium_until, now()), now()) + ($3 || ' days')::interval WHERE id=$1`,
        [pago.user_id, pago.plan, String(PRECIOS[pago.plan].dias)]
      );
    }
    return "aprobado";
  }
  if (t.status === "PENDING") return "pendiente";
  if (!pago.aplicado) await q("UPDATE payments SET status=$2,wompi_id=$3,updated_at=now() WHERE reference=$1", [t.reference, t.status, t.id]);
  return "rechazado";
}

/** Consulta a Wompi la transacción (no se confía solo en lo que trae el navegador). */
export async function consultarTransaccion(id: string) {
  const r = await fetch(`${apiBase()}/transactions/${encodeURIComponent(id)}`, { cache: "no-store" });
  if (!r.ok) return null;
  const j = (await r.json()) as { data?: { id: string; reference: string; status: string; amount_in_cents: number; currency: string } };
  return j.data ?? null;
}
