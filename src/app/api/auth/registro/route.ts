import { ruta, json, error, cuerpo } from "@/server/http";
import { q } from "@/server/db";
import { abrirSesion, handleLibre, hashPassword, nuevoId } from "@/server/auth";

export const runtime = "nodejs";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const POST = ruta({}, async (req) => {
  const b = await cuerpo<{ email?: string; password?: string; nombre?: string; foto?: string }>(req, 400_000);
  if (!b) return error("Datos inválidos");
  const email = (b.email ?? "").trim().toLowerCase();
  const nombre = (b.nombre ?? "").trim().slice(0, 24);
  const pw = b.password ?? "";
  if (!EMAIL.test(email) || email.length > 120) return error("Escribe un correo válido");
  if (pw.length < 8 || pw.length > 100) return error("La contraseña debe tener mínimo 8 caracteres");
  if (!nombre) return error("Escribe tu nombre o apodo");
  const foto = typeof b.foto === "string" && b.foto.startsWith("data:image/") && b.foto.length < 150_000 ? b.foto : null;
  if ((await q("SELECT 1 FROM users WHERE email=$1", [email])).length) return error("Ese correo ya tiene cuenta. Inicia sesión.", 409);
  const id = nuevoId(12);
  const handle = await handleLibre(nombre);
  await q("INSERT INTO users (id,email,nombre,handle,pass_hash,foto) VALUES ($1,$2,$3,$4,$5,$6)", [id, email, nombre, handle, hashPassword(pw), foto]);
  await q("INSERT INTO notifs (id,user_id,tipo,texto) VALUES ($1,$2,'sistema',$3)", [nuevoId(), id, "Bienvenida a Mixzine. Elige una canción y arma tu primer fanzine."]);
  await abrirSesion(id);
  return json({ user: { id, nombre, handle, foto } }, 201);
});
