import { ruta, json } from "@/server/http";
import { q } from "@/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = ruta({ auth: true }, async (_req, { user }) => {
  const r = await q<{ id: string; tipo: string; texto: string; leida: boolean; created_at: Date }>("SELECT id,tipo,texto,leida,created_at FROM notifs WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50", [user!.id]);
  return json({ notifs: r.map((n) => ({ id: n.id, tipo: n.tipo, texto: n.texto, leida: n.leida, fecha: new Date(n.created_at).toISOString() })) });
});
