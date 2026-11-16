import { ruta, json, error, cuerpo } from "@/server/http";
import { q } from "@/server/db";
import { nuevoId } from "@/server/auth";
import { PRECIOS, urlCheckout, wompiConfigurado, type PlanId } from "@/server/wompi";

export const runtime = "nodejs";

/** Crea el pago pendiente y devuelve la URL firmada del Web Checkout de Wompi. */
export const POST = ruta({ auth: true }, async (req, { user }) => {
  if (!wompiConfigurado()) return error("Los pagos aún no están habilitados", 503);
  const b = await cuerpo<{ plan?: string }>(req, 1000);
  const plan = b?.plan as PlanId;
  if (!PRECIOS[plan]) return error("Plan inválido");
  const reference = `MZ-${nuevoId(12)}`;
  await q("INSERT INTO payments (reference,user_id,plan,amount_cents) VALUES ($1,$2,$3,$4)", [reference, user!.id, plan, PRECIOS[plan].cents]);
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || (host?.startsWith("localhost") ? "http" : "https");
  const base = process.env.NEXT_PUBLIC_SITE_URL || `${proto}://${host}`;
  return json({ url: urlCheckout(reference, PRECIOS[plan].cents, `${base}/planes`, user!.email), reference });
});
