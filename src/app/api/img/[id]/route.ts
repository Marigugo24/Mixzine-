import { q } from "@/server/db";
import { dbConfigurada } from "@/server/db";

export const runtime = "nodejs";
type P = { params: Promise<{ id: string }> };
const CACHE = "public, max-age=31536000, s-maxage=31536000, immutable";

/** Sirve las fotos desde nuestro propio origen (así el canvas del PDF no se "contamina"). */
export async function GET(_req: Request, { params }: P) {
  if (!dbConfigurada()) return new Response("No configurado", { status: 503 });
  const { id } = await params;
  if (!/^[A-Za-z0-9_-]{6,40}$/.test(id)) return new Response("No encontrado", { status: 404 });
  const r = (await q<{ mime: string; bytes: Buffer | null; url: string | null }>("SELECT mime,bytes,url FROM assets WHERE id=$1", [id]))[0];
  if (!r) return new Response("No encontrado", { status: 404 });
  const h = { "Content-Type": r.mime, "Cache-Control": CACHE, "X-Content-Type-Options": "nosniff" };
  if (r.bytes) return new Response(new Uint8Array(r.bytes), { headers: h });
  if (r.url) {
    const up = await fetch(r.url);
    if (!up.ok) return new Response("No encontrado", { status: 404 });
    return new Response(up.body, { headers: h });
  }
  return new Response("No encontrado", { status: 404 });
}
