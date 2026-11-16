import { ruta, json, error, cuerpo } from "@/server/http";
import { q } from "@/server/db";
import { aplicarTransaccion, consultarTransaccion } from "@/server/wompi";

export const runtime = "nodejs";

/** Al volver de Wompi (?id=…): confirma la transacción directamente con Wompi y aplica el pago. */
export const POST = ruta({ auth: true }, async (req, { user }) => {
  const b = await cuerpo<{ id?: string }>(req, 500);
  const id = (b?.id ?? "").slice(0, 80);
  if (!id) return error("Falta la transacción");
  const t = await consultarTransaccion(id).catch(() => null);
  if (!t) return error("No pudimos confirmar el pago con Wompi", 502);
  const dueno = (await q<{ user_id: string }>("SELECT user_id FROM payments WHERE reference=$1", [t.reference]))[0];
  if (!dueno || dueno.user_id !== user!.id) return error("Pago no encontrado", 404);
  return json({ estado: await aplicarTransaccion(t) });
});
