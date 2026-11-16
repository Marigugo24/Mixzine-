import { ruta, json, error, cuerpo } from "@/server/http";
import { q } from "@/server/db";
import { nuevoId } from "@/server/auth";

export const runtime = "nodejs";
type P = { params: Promise<{ id: string }> };

/** Guarda en "Recibidos" un fanzine que llegó por link. */
export const POST = ruta({ auth: true }, async (req, { user }, { params }: P) => {
  const { id } = await params;
  const b = await cuerpo<{ mensaje?: string }>(req, 2_000);
  const f = (await q<{ user_id: string; titulo: string; visibilidad: string; borrador: boolean }>("SELECT user_id,titulo,visibilidad,borrador FROM fanzines WHERE id=$1", [id]))[0];
  if (!f || f.visibilidad === "privado" || f.borrador) return error("No encontrado", 404);
  await q("INSERT INTO saved (user_id,fanzine_id,mensaje) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING", [user!.id, id, (b?.mensaje ?? "").slice(0, 160) || null]);
  if (f.user_id !== user!.id) await q("INSERT INTO notifs (id,user_id,tipo,texto) VALUES ($1,$2,'recibido',$3)", [nuevoId(), f.user_id, `@${user!.handle} guardó «${f.titulo}» en su galería.`]);
  return json({ ok: true });
});
