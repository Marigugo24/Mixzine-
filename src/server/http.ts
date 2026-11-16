import { NextResponse } from "next/server";
import { dbConfigurada } from "./db";
import { usuarioActual, type UsuarioDB } from "./auth";

export const json = (data: unknown, status = 200, headers?: Record<string, string>) => NextResponse.json(data, { status, headers: { "Cache-Control": "no-store", ...headers } });
export const error = (msg: string, status = 400) => json({ error: msg }, status);

type Ctx = { user: UsuarioDB | null };
/** Envuelve un handler: exige base de datos y, opcionalmente, sesión. */
export function ruta<A extends unknown[]>(opts: { auth?: boolean }, fn: (req: Request, ctx: Ctx, ...a: A) => Promise<Response>) {
  return async (req: Request, ...a: A) => {
    try {
      if (!dbConfigurada()) return error("Backend no configurado", 503);
      if (req.method !== "GET" && req.method !== "HEAD" && !mismoOrigen(req)) return error("Origen no permitido", 403);
      const user = await usuarioActual();
      if (opts.auth && !user) return error("Inicia sesión", 401);
      return await fn(req, { user }, ...a);
    } catch (e) {
      console.error("[api]", e);
      return error("Error del servidor", 500);
    }
  };
}

export async function cuerpo<T>(req: Request, max = 1_500_000): Promise<T | null> {
  const txt = await req.text();
  if (txt.length > max) return null;
  try {
    return JSON.parse(txt) as T;
  } catch {
    return null;
  }
}
export const mismoOrigen = (req: Request) => {
  const o = req.headers.get("origin");
  if (!o) return true;
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  try {
    return new URL(o).host === host;
  } catch {
    return false;
  }
};
