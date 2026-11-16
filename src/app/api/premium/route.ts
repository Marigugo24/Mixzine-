import { ruta, json } from "@/server/http";
import { q } from "@/server/db";
import { wompiConfigurado } from "@/server/wompi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = ruta({ auth: true }, async (_req, { user }) => {
  const r = (await q<{ premium_until: Date | null; premium_plan: string | null; trial_used: boolean }>("SELECT premium_until,premium_plan,trial_used FROM users WHERE id=$1", [user!.id]))[0];
  const hasta = r.premium_until ? new Date(r.premium_until).toISOString() : null;
  return json({ hasta, activo: !!hasta && new Date(hasta).getTime() > Date.now(), plan: r.premium_plan, pruebaUsada: r.trial_used, pagos: wompiConfigurado() });
});
