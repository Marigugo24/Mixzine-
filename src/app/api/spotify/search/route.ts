import { NextResponse } from "next/server";
import { buscarItunes, buscarSpotify, spotifyConfigurado } from "@/server/spotify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const memo = new Map<string, { t: number; items: unknown }>();

export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 100);
  if (!q) return NextResponse.json({ items: [] });
  if (!spotifyConfigurado()) return NextResponse.json({ error: "Spotify no configurado" }, { status: 503 });
  const k = q.toLowerCase();
  const hit = memo.get(k);
  if (hit && Date.now() - hit.t < 60_000) return NextResponse.json({ items: hit.items });
  try {
    const items = await buscarSpotify(q);
    if (memo.size > 200) memo.clear();
    memo.set(k, { t: Date.now(), items });
    return NextResponse.json({ items }, { headers: { "Cache-Control": "private, max-age=30" } });
  } catch (e) {
    console.error("[spotify]", e);
    try {
      return NextResponse.json({ items: await buscarItunes(q), fuente: "itunes" });
    } catch (e2) {
      console.error("[itunes]", e2);
      return NextResponse.json({ error: "Búsqueda no disponible" }, { status: 502 });
    }
  }
}
