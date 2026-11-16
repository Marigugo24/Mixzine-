import { createHash } from "node:crypto";
import { ruta, json, error, cuerpo } from "@/server/http";
import { q } from "@/server/db";
import { hashPassword } from "@/server/auth";

export const runtime = "nodejs";

export const POST = ruta({}, async (req) => {
  const b = await cuerpo<{ token?: string; password?: string }>(req, 2_000);
  const pw = b?.password ?? "";
  if (!b?.token || b.token.length > 100) return error("Enlace inválido");
  if (pw.length < 8 || pw.length > 100) return error("La contraseña debe tener mínimo 8 caracteres");
  const h = createHash("sha256").update(b.token).digest("hex");
  // se consume el token y se cambia la contraseña de una sola vez (un enlace sirve una sola vez)
  const r = await q<{ user_id: string }>("UPDATE password_resets SET used=true WHERE token_hash=$1 AND used=false AND expires_at > now() RETURNING user_id", [h]);
  if (!r.length) return error("Este enlace venció o ya se usó. Pide uno nuevo.", 410);
  await q("UPDATE users SET pass_hash=$2, pass_changed_at=now() WHERE id=$1", [r[0].user_id, hashPassword(pw)]);
  await q("UPDATE password_resets SET used=true WHERE user_id=$1", [r[0].user_id]);
  return json({ ok: true });
});
