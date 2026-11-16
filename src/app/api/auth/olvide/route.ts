import { createHash, randomBytes } from "node:crypto";
import { ruta, json, error, cuerpo } from "@/server/http";
import { q } from "@/server/db";
import { correoConfigurado, correoRestablecer, enviarCorreo } from "@/server/correo";

export const runtime = "nodejs";

/** Pide el correo de recuperación. Siempre responde igual, exista o no la cuenta (no revela quién está registrado). */
export const POST = ruta({}, async (req) => {
  if (!correoConfigurado() && process.env.MAIL_DEBUG !== "1") return error("La recuperación por correo aún no está habilitada", 503);
  const b = await cuerpo<{ email?: string }>(req, 2_000);
  const email = (b?.email ?? "").trim().toLowerCase();
  if (!email || email.length > 120) return error("Escribe tu correo");
  const u = (await q<{ id: string; nombre: string }>("SELECT id,nombre FROM users WHERE email=$1", [email]))[0];
  if (u && !email.endsWith("@spotify.mixzine.invalid")) {
    const recientes = Number((await q<{ n: string }>("SELECT count(*) AS n FROM password_resets WHERE user_id=$1 AND created_at > now() - interval '1 hour'", [u.id]))[0].n);
    if (recientes < 3) {
      const token = randomBytes(32).toString("base64url");
      await q("INSERT INTO password_resets (token_hash,user_id,expires_at) VALUES ($1,$2,now() + interval '1 hour')", [createHash("sha256").update(token).digest("hex"), u.id]);
      const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
      const proto = req.headers.get("x-forwarded-proto") || (host?.startsWith("localhost") ? "http" : "https");
      const enlace = `${process.env.NEXT_PUBLIC_SITE_URL || `${proto}://${host}`}/restablecer?token=${token}`;
      if (process.env.MAIL_DEBUG === "1") console.log(`[correo-debug] ${email} → ${enlace}`);
      else {
        const m = correoRestablecer(u.nombre, enlace);
        await enviarCorreo(email, "Restablece tu contraseña de Mixzine", m.html, m.texto).catch((e) => console.error("[correo]", e));
      }
    }
  }
  return json({ ok: true });
});
