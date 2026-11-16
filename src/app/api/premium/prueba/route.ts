import { ruta, json, error } from "@/server/http";
import { q } from "@/server/db";

export const runtime = "nodejs";

/** 7 días de prueba, una sola vez por cuenta y sin tarjeta. */
export const POST = ruta({ auth: true }, async (_req, { user }) => {
  const r = await q<{ premium_until: Date }>(
    `UPDATE users SET trial_used=true, premium_plan=COALESCE(premium_plan,'mensual'), premium_until=GREATEST(COALESCE(premium_until, now()), now()) + interval '7 days' WHERE id=$1 AND trial_used=false RETURNING premium_until`,
    [user!.id]
  );
  if (!r.length) return error("Ya usaste tu prueba gratuita", 409);
  return json({ hasta: new Date(r[0].premium_until).toISOString() });
});
