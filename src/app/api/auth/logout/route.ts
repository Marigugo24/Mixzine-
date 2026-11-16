import { ruta, json } from "@/server/http";
import { cerrarSesion } from "@/server/auth";

export const runtime = "nodejs";
export const POST = ruta({}, async () => {
  await cerrarSesion();
  return json({ ok: true });
});
