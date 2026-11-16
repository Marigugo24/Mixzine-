import LZ from "lz-string";
import type { Fanzine } from "./types";

type Payload = { f: Fanzine; m?: string; de?: string };

/** Sin backend, el link lleva el fanzine dentro de la URL (sin las fotos propias). */
export function codificar(f: Fanzine, mensaje?: string, de?: string): { d: string; sinFotos: number } {
  let sinFotos = 0;
  const limpio: Fanzine = {
    ...f,
    borrador: undefined,
    paneles: f.paneles.map((p) => ({
      ...p,
      fondo: p.fondo.tipo === "imagen" ? { tipo: "color", valor: "#FBD9E8" } : p.fondo,
      elementos: p.elementos.filter((e) => {
        const quitar = e.tipo === "imagen" && String((e.datos as { src?: string }).src).startsWith("data:");
        if (quitar) sinFotos++;
        return !quitar;
      }),
    })),
  };
  return { d: LZ.compressToEncodedURIComponent(JSON.stringify({ f: limpio, m: mensaje, de } satisfies Payload)), sinFotos };
}

export function decodificar(d: string | undefined | null): Payload | null {
  if (!d) return null;
  try {
    const s = LZ.decompressFromEncodedURIComponent(d);
    if (!s) return null;
    const p = JSON.parse(s) as Payload;
    if (!p?.f?.paneles || p.f.paneles.length !== 8) return null;
    return p;
  } catch {
    return null;
  }
}

export const urlDeFanzine = (origin: string, d: string) => `${origin}/z?d=${d}`;

export const urlCorta = (origin: string, id: string) => `${origin}/z?id=${encodeURIComponent(id)}`;
