import { ruta, json, error, cuerpo } from "@/server/http";
import { q } from "@/server/db";
import { aFanzine, validarFanzine, type FilaFanzine } from "@/server/fanzines";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type P = { params: Promise<{ id: string }> };
const ID = /^[A-Za-z0-9_-]{6,40}$/;

/** Ver un fanzine: público, por enlace o propio. */
export const GET = ruta({}, async (_req, { user }, { params }: P) => {
  const { id } = await params;
  if (!ID.test(id)) return error("No encontrado", 404);
  const r = (
    await q<FilaFanzine & { mensaje: string | null }>(
      `SELECT f.id,f.user_id,f.data,f.visibilidad,f.created_at,u.handle AS autor_handle,u.nombre AS autor_nombre,
              (SELECT count(*) FROM likes l WHERE l.fanzine_id=f.id) AS likes,
              EXISTS(SELECT 1 FROM likes l WHERE l.fanzine_id=f.id AND l.user_id=$2) AS liked
         FROM fanzines f JOIN users u ON u.id=f.user_id WHERE f.id=$1`,
      [id, user?.id ?? ""]
    )
  )[0];
  if (!r) return error("No encontrado", 404);
  const propio = user?.id === r.user_id;
  if (!propio && (r.visibilidad === "privado" || r.data.borrador)) return error("No encontrado", 404);
  return json({ fanzine: aFanzine(r), liked: !!r.liked, propio });
});

/** Crear o actualizar (solo el dueño). */
export const PUT = ruta({ auth: true }, async (req, { user }, { params }: P) => {
  const { id } = await params;
  if (!ID.test(id)) return error("Id inválido");
  const b = await cuerpo<{ fanzine?: unknown }>(req);
  if (!b) return error("Fanzine demasiado grande o inválido", 413);
  const v = validarFanzine(b.fanzine, user!, id);
  if ("error" in v) return error(v.error);
  const f = v.f;
  const ex = (await q<{ user_id: string }>("SELECT user_id FROM fanzines WHERE id=$1", [id]))[0];
  if (ex && ex.user_id !== user!.id) return error("Este fanzine no es tuyo", 403);
  if (!ex && (await q<{ n: string }>("SELECT count(*) AS n FROM fanzines WHERE user_id=$1", [user!.id]))[0].n >= "500") return error("Llegaste al límite de fanzines");
  await q(
    `INSERT INTO fanzines (id,user_id,data,titulo,artista,genero,emocion,visibilidad,borrador,created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     ON CONFLICT (id) DO UPDATE SET data=$3,titulo=$4,artista=$5,genero=$6,emocion=$7,visibilidad=$8,borrador=$9,updated_at=now()`,
    [id, user!.id, JSON.stringify(f), f.cancion.titulo, f.cancion.artista, f.cancion.genero ?? null, f.emocion, f.visibilidad, !!f.borrador, f.creadoEn]
  );
  return json({ ok: true, id });
});

export const DELETE = ruta({ auth: true }, async (_req, { user }, { params }: P) => {
  const { id } = await params;
  await q("DELETE FROM fanzines WHERE id=$1 AND user_id=$2", [id, user!.id]);
  return json({ ok: true });
});
