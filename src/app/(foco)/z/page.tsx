import type { Metadata } from "next";
import { decodificar } from "@/lib/share";
import { EMOCIONES } from "@/lib/emotions";
import { dbConfigurada, q } from "@/server/db";
import type { Fanzine } from "@/lib/types";
import { Visor } from "./Visor";

type SP = Promise<{ d?: string; id?: string }>;

async function cargar(id: string) {
  if (!dbConfigurada() || !/^[A-Za-z0-9_-]{6,40}$/.test(id)) return null;
  try {
    const r = (await q<{ data: Fanzine; visibilidad: string; handle: string }>("SELECT f.data,f.visibilidad,u.handle FROM fanzines f JOIN users u ON u.id=f.user_id WHERE f.id=$1", [id]))[0];
    if (!r || r.visibilidad === "privado" || r.data.borrador) return null;
    return { f: r.data, m: r.data.mensaje, de: r.handle };
  } catch {
    return null;
  }
}

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const { d, id } = await searchParams;
  const p = id ? await cargar(id) : decodificar(d);
  if (!p) return { title: "Fanzine", robots: { index: false } };
  const t = `${p.f.cancion.titulo} · ${p.f.cancion.artista}`;
  const de = p.de ?? p.f.autorNombre;
  const og = `/api/og?${new URLSearchParams({ t: p.f.cancion.titulo.slice(0, 60), a: p.f.cancion.artista.slice(0, 50), e: p.f.emocion, de: de.slice(0, 30) })}`;
  const desc = p.m ? p.m.slice(0, 140) : `Un fanzine de @${de} · ${EMOCIONES[p.f.emocion]?.nombre ?? ""}`;
  return {
    title: t,
    description: desc,
    robots: { index: false, follow: false }, // RNF05: no indexable
    openGraph: { title: `${t} — un fanzine en Mixzine`, description: desc, images: [{ url: og, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", images: [og] },
  };
}

export default async function Page({ searchParams }: { searchParams: SP }) {
  const { d, id } = await searchParams;
  return <Visor d={d ?? ""} id={id} />;
}
