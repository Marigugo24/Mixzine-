import { ruta, json } from "@/server/http";
import { q } from "@/server/db";
import { aFanzine, type FilaFanzine } from "@/server/fanzines";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Comunidad: fanzines públicos. vista = todos | tendencias | amigos (autores que te gustan o guardaste). */
export const GET = ruta({}, async (req, { user }) => {
  const u = new URL(req.url);
  const vista = u.searchParams.get("vista") ?? "todos";
  const texto = (u.searchParams.get("q") ?? "").trim().slice(0, 60);
  const genero = (u.searchParams.get("genero") ?? "").trim().slice(0, 40);
  const limit = Math.min(48, Math.max(1, Number(u.searchParams.get("limit")) || 24));
  const offset = Math.max(0, Number(u.searchParams.get("offset")) || 0);
  const params: unknown[] = [user?.id ?? ""];
  const where = ["f.visibilidad='publico'", "f.borrador=false"];
  if (texto) {
    params.push(`%${texto.replace(/[%_]/g, "")}%`);
    where.push(`(f.titulo ILIKE $${params.length} OR f.artista ILIKE $${params.length} OR u.handle ILIKE $${params.length})`);
  }
  if (genero) {
    params.push(genero);
    where.push(`lower(f.genero)=lower($${params.length})`);
  }
  if (vista === "amigos") {
    if (!user) return json({ fanzines: [], hayMas: false });
    where.push(`f.user_id IN (SELECT f2.user_id FROM likes l JOIN fanzines f2 ON f2.id=l.fanzine_id WHERE l.user_id=$1 UNION SELECT f3.user_id FROM saved s JOIN fanzines f3 ON f3.id=s.fanzine_id WHERE s.user_id=$1)`);
  }
  const orden = vista === "tendencias" ? "likes DESC, f.created_at DESC" : "f.created_at DESC";
  params.push(limit + 1, offset);
  const rows = await q<FilaFanzine>(
    `SELECT f.id,f.user_id,f.data,f.visibilidad,f.created_at,u.handle AS autor_handle,u.nombre AS autor_nombre,
            (SELECT count(*) FROM likes l WHERE l.fanzine_id=f.id) AS likes,
            EXISTS(SELECT 1 FROM likes l WHERE l.fanzine_id=f.id AND l.user_id=$1) AS liked
       FROM fanzines f JOIN users u ON u.id=f.user_id
      WHERE ${where.join(" AND ")} ORDER BY ${orden} LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return json({ fanzines: rows.slice(0, limit).map(aFanzine), likedIds: rows.slice(0, limit).filter((r) => r.liked).map((r) => r.id), hayMas: rows.length > limit });
});
