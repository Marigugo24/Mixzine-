import { ruta, json } from "@/server/http";
import { q } from "@/server/db";

export const runtime = "nodejs";
export const POST = ruta({ auth: true }, async (_req, { user }) => {
  await q("UPDATE notifs SET leida=true WHERE user_id=$1 AND leida=false", [user!.id]);
  return json({ ok: true });
});
