import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { q, dbConfigurada } from "@/server/db";
import { abrirSesion, handleLibre, nuevoId } from "@/server/auth";
import { redirectUri } from "@/server/spotify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const fallo = (m: string) => NextResponse.redirect(new URL(`/registro?error=${m}`, req.url));
  if (!dbConfigurada()) return fallo("backend");
  const esperado = (await cookies()).get("mz_sp_state")?.value;
  const code = u.searchParams.get("code");
  if (!code || !esperado || u.searchParams.get("state") !== esperado) return fallo("spotify");
  try {
    const basic = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString("base64");
    const t = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri(req) }),
    });
    if (!t.ok) return fallo("spotify");
    const { access_token } = (await t.json()) as { access_token: string };
    const me = await fetch("https://api.spotify.com/v1/me", { headers: { Authorization: `Bearer ${access_token}` } });
    if (!me.ok) return fallo("spotify");
    const p = (await me.json()) as { id: string; email?: string; display_name?: string; images?: { url: string }[] };
    const email = (p.email ?? `${p.id}@spotify.mixzine.invalid`).toLowerCase();
    let uid = (await q<{ id: string }>("SELECT id FROM users WHERE spotify_id=$1", [p.id]))[0]?.id;
    if (!uid) {
      const porCorreo = p.email ? (await q<{ id: string }>("SELECT id FROM users WHERE email=$1", [email]))[0] : undefined;
      if (porCorreo) {
        uid = porCorreo.id;
        await q("UPDATE users SET spotify_id=$2 WHERE id=$1", [uid, p.id]);
      } else {
        uid = nuevoId(12);
        const nombre = (p.display_name || "Usuario").slice(0, 24);
        await q("INSERT INTO users (id,email,nombre,handle,spotify_id) VALUES ($1,$2,$3,$4,$5)", [uid, email, nombre, await handleLibre(nombre), p.id]);
        await q("INSERT INTO notifs (id,user_id,tipo,texto) VALUES ($1,$2,'sistema',$3)", [nuevoId(), uid, "Bienvenida a Mixzine. Elige una canción y arma tu primer fanzine."]);
      }
    }
    await abrirSesion(uid);
    const res = NextResponse.redirect(new URL("/inicio", req.url));
    res.cookies.delete("mz_sp_state");
    return res;
  } catch (e) {
    console.error("[spotify cb]", e);
    return fallo("spotify");
  }
}
