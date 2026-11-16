import { ruta, json, error, cuerpo } from "@/server/http";
import { q } from "@/server/db";
import { abrirSesion, checkPassword } from "@/server/auth";

export const runtime = "nodejs";

type Fila = { id: string; nombre: string; handle: string; foto: string | null; pass_hash: string | null };
// Freno sencillo por correo (en memoria de la instancia): 8 intentos / 10 min.
const intentos = new Map<string, { n: number; t: number }>();

export const POST = ruta({}, async (req) => {
  const b = await cuerpo<{ email?: string; password?: string }>(req, 10_000);
  const email = (b?.email ?? "").trim().toLowerCase();
  if (!email || !b?.password) return error("Escribe tu correo y contraseña");
  const k = intentos.get(email);
  if (k && Date.now() - k.t < 600_000 && k.n >= 8) return error("Demasiados intentos. Espera unos minutos.", 429);
  const r = (await q<Fila>("SELECT id,nombre,handle,foto,pass_hash FROM users WHERE email=$1", [email]))[0];
  if (!r || !checkPassword(b.password, r.pass_hash)) {
    intentos.set(email, { n: k && Date.now() - k.t < 600_000 ? k.n + 1 : 1, t: k && Date.now() - k.t < 600_000 ? k.t : Date.now() });
    return error("Correo o contraseña incorrectos", 401);
  }
  intentos.delete(email);
  await abrirSesion(r.id);
  return json({ user: { id: r.id, nombre: r.nombre, handle: r.handle, foto: r.foto } });
});
