import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { q } from "./db";

const COOKIE = "mz_session";
const DIAS = 60;

function secret() {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production") throw new Error("Falta SESSION_SECRET (mínimo 16 caracteres)");
  return "dev-secret-solo-para-local";
}
const b64 = (b: Buffer | string) => Buffer.from(b).toString("base64url");
const firma = (p: string) => createHmac("sha256", secret()).update(p).digest("base64url");

export function hashPassword(pw: string) {
  const salt = randomBytes(16);
  return `s1$${salt.toString("base64url")}$${scryptSync(pw, salt, 64).toString("base64url")}`;
}
export function checkPassword(pw: string, hash: string | null) {
  if (!hash) return false;
  const [v, s, h] = hash.split("$");
  if (v !== "s1" || !s || !h) return false;
  const a = scryptSync(pw, Buffer.from(s, "base64url"), 64);
  const b = Buffer.from(h, "base64url");
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function abrirSesion(uid: string) {
  const payload = b64(JSON.stringify({ u: uid, e: Date.now() + DIAS * 864e5, i: Date.now() }));
  (await cookies()).set(COOKIE, `${payload}.${firma(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DIAS * 86400,
  });
}
export async function cerrarSesion() {
  (await cookies()).delete(COOKIE);
}

export type UsuarioDB = { id: string; email: string; nombre: string; handle: string; foto: string | null };

export async function usuarioActual(): Promise<UsuarioDB | null> {
  const c = (await cookies()).get(COOKIE)?.value;
  if (!c) return null;
  const [p, f] = c.split(".");
  if (!p || !f) return null;
  const esperado = firma(p);
  if (f.length !== esperado.length || !timingSafeEqual(Buffer.from(f), Buffer.from(esperado))) return null;
  try {
    const { u, e, i } = JSON.parse(Buffer.from(p, "base64url").toString()) as { u: string; e: number; i?: number };
    if (!u || Date.now() > e) return null;
    const r = await q<UsuarioDB & { pass_changed_at: Date | null }>("SELECT id,email,nombre,handle,foto,pass_changed_at FROM users WHERE id=$1", [u]);
    const x = r[0];
    if (!x) return null;
    // al cambiar la contraseña se cierran las sesiones abiertas antes
    if (x.pass_changed_at && (i ?? 0) < new Date(x.pass_changed_at).getTime()) return null;
    return { id: x.id, email: x.email, nombre: x.nombre, handle: x.handle, foto: x.foto };
  } catch {
    return null;
  }
}

export function nuevoId(n = 10) {
  return randomBytes(n).toString("base64url").replace(/[-_]/g, "x").slice(0, n + 2);
}

export async function handleLibre(nombre: string) {
  const base = nombre.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9._]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 20) || "usuario";
  for (let i = 0; i < 6; i++) {
    const h = i === 0 ? base : `${base}${Math.floor(Math.random() * 9000 + 1000)}`;
    const r = await q("SELECT 1 FROM users WHERE handle=$1", [h]);
    if (!r.length) return h;
  }
  return `${base}${Date.now() % 100000}`;
}
