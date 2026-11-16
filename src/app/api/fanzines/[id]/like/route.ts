import { ruta, json, error } from "@/server/http";
import { q } from "@/server/db";
import { nuevoId } from "@/server/auth";

export const runtime = "nodejs";
type P = { params: Promise<{ id: string }> };

/** Alterna el me gusta. Avisa al autor la primera vez. */
export const POST = ruta({ auth: true }, async (_req, { user }, { params }: P) => {
  const { id } = await params;
  const f = (await q<{ user_id: string; titulo: string; visibilidad: string; borrador: boolean }>("SELECT user_id,titulo,visibilidad,borrador FROM fanzines WHERE id=$1", [id]))[0];
  if (!f || (f.visibilidad === "privado" && f.user_id !== user!.id) || f.borrador) return error("No encontrado", 404);
  const ya = (await q("SELECT 1 FROM likes WHERE user_id=$1 AND fanzine_id=$2", [user!.id, id])).length > 0;
  if (ya) await q("DELETE FROM likes WHERE user_id=$1 AND fanzine_id=$2", [user!.id, id]);
  else {
    await q("INSERT INTO likes (user_id,fanzine_id) VALUES ($1,$2) ON CONFLICT DO NOTHING", [user!.id, id]);
    if (f.user_id !== user!.id) {
      const dup = await q("SELECT 1 FROM notifs WHERE user_id=$1 AND tipo='like' AND texto=$2 AND created_at > now() - interval '1 day'", [f.user_id, `@${user!.handle} le dio like a «${f.titulo}».`]);
      if (!dup.length) await q("INSERT INTO notifs (id,user_id,tipo,texto) VALUES ($1,$2,'like',$3)", [nuevoId(), f.user_id, `@${user!.handle} le dio like a «${f.titulo}».`]);
    }
  }
  const n = Number((await q<{ n: string }>("SELECT count(*) AS n FROM likes WHERE fanzine_id=$1", [id]))[0].n);
  return json({ liked: !ya, likes: n });
});
