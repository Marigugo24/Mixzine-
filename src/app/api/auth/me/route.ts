import { ruta, json, cuerpo, error } from "@/server/http";
import { q } from "@/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = ruta({}, async (_req, { user }) => json({ user: user ? { id: user.id, nombre: user.nombre, handle: user.handle, foto: user.foto } : null }));

export const PATCH = ruta({ auth: true }, async (req, { user }) => {
  const b = await cuerpo<{ nombre?: string; foto?: string | null }>(req, 400_000);
  if (!b) return error("Datos inválidos");
  const nombre = (b.nombre ?? user!.nombre).trim().slice(0, 24) || user!.nombre;
  const foto = b.foto === null ? null : typeof b.foto === "string" && b.foto.startsWith("data:image/") && b.foto.length < 150_000 ? b.foto : user!.foto;
  await q("UPDATE users SET nombre=$2, foto=$3 WHERE id=$1", [user!.id, nombre, foto]);
  return json({ user: { id: user!.id, nombre, handle: user!.handle, foto } });
});
