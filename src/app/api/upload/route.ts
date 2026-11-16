import { put } from "@vercel/blob";
import { ruta, json, error } from "@/server/http";
import { q } from "@/server/db";
import { nuevoId } from "@/server/auth";

export const runtime = "nodejs";
const MAX = 4 * 1024 * 1024;

function tipo(b: Buffer): string | null {
  if (b.length > 12 && b[0] === 0xff && b[1] === 0xd8) return "image/jpeg";
  if (b.length > 12 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (b.length > 12 && b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP") return "image/webp";
  if (b.length > 12 && b.subarray(0, 3).toString() === "GIF") return "image/gif";
  return null;
}

/** Sube una foto. Usa Vercel Blob si hay BLOB_READ_WRITE_TOKEN; si no, la guarda en Postgres. Devuelve una URL propia (/api/img/...). */
export const POST = ruta({ auth: true }, async (req, { user }) => {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return error("Falta la imagen");
  if (file.size > MAX) return error("La imagen pesa más de 4 MB", 413);
  const buf = Buffer.from(await file.arrayBuffer());
  const mime = tipo(buf);
  if (!mime) return error("Formato no permitido (usa JPG, PNG, WebP o GIF)", 415);
  const n = Number((await q<{ n: string }>("SELECT count(*) AS n FROM assets WHERE user_id=$1", [user!.id]))[0].n);
  if (n >= 400) return error("Llegaste al límite de fotos");
  const id = nuevoId(14);
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const ext = mime.split("/")[1];
    const b = await put(`mixzine/${user!.id}/${id}.${ext}`, buf, { access: "public", contentType: mime, addRandomSuffix: true });
    await q("INSERT INTO assets (id,user_id,mime,url) VALUES ($1,$2,$3,$4)", [id, user!.id, mime, b.url]);
  } else {
    await q("INSERT INTO assets (id,user_id,mime,bytes) VALUES ($1,$2,$3,$4)", [id, user!.id, mime, buf]);
  }
  return json({ url: `/api/img/${id}` }, 201);
});
