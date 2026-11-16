import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { spotifyConfigurado, redirectUri } from "@/server/spotify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Inicia el login con Spotify (Authorization Code). */
export async function GET(req: Request) {
  if (!spotifyConfigurado()) return NextResponse.redirect(new URL("/registro?error=spotify", req.url));
  const state = randomBytes(16).toString("base64url");
  const url = new URL("https://accounts.spotify.com/authorize");
  url.search = new URLSearchParams({ client_id: process.env.SPOTIFY_CLIENT_ID!, response_type: "code", redirect_uri: redirectUri(req), scope: "user-read-email user-read-private", state, show_dialog: "false" }).toString();
  const res = NextResponse.redirect(url);
  res.cookies.set("mz_sp_state", state, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 600 });
  return res;
}
