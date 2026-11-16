import { ruta, json } from "@/server/http";
import { q } from "@/server/db";
import { aFanzine, type FilaFanzine } from "@/server/fanzines";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = ruta({ auth: true }, async (_req, { user }) => {
  const rows = await q<FilaFanzine & { mensaje: string | null }>(
    `SELECT f.id,f.user_id,f.data,f.visibilidad,f.created_at,u.handle AS autor_handle,u.nombre AS autor_nombre,s.mensaje,
            (SELECT count(*) FROM likes l WHERE l.fanzine_id=f.id) AS likes
       FROM saved s JOIN fanzines f ON f.id=s.fanzine_id JOIN users u ON u.id=f.user_id
      WHERE s.user_id=$1 ORDER BY s.created_at DESC LIMIT 100`,
    [user!.id]
  );
  const likes = await q<{ fanzine_id: string }>("SELECT fanzine_id FROM likes WHERE user_id=$1", [user!.id]);
  return json({ fanzines: rows.map((r) => ({ ...aFanzine(r), mensaje: r.mensaje ?? undefined })), likedIds: likes.map((l) => l.fanzine_id) });
});
