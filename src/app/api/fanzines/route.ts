import { ruta, json } from "@/server/http";
import { q } from "@/server/db";
import { aFanzine, type FilaFanzine } from "@/server/fanzines";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Mis fanzines (incluye borradores). */
export const GET = ruta({ auth: true }, async (_req, { user }) => {
  const rows = await q<FilaFanzine>(
    `SELECT f.id,f.user_id,f.data,f.visibilidad,f.created_at,u.handle AS autor_handle,u.nombre AS autor_nombre,
            (SELECT count(*) FROM likes l WHERE l.fanzine_id=f.id) AS likes
       FROM fanzines f JOIN users u ON u.id=f.user_id WHERE f.user_id=$1 ORDER BY f.updated_at DESC LIMIT 200`,
    [user!.id]
  );
  return json({ fanzines: rows.map((r) => ({ ...aFanzine(r), borrador: !!r.data.borrador })) });
});
