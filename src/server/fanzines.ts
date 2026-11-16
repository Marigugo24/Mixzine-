import type { Fanzine, Visibilidad } from "@/lib/types";
import type { UsuarioDB } from "./auth";

const EMOCIONES = ["tranquilidad", "amor", "ansiedad", "motivacion", "tristeza", "alegria"];
const CLAVES = ["portada", "p1", "p2", "p3", "p4", "p5", "p6", "contraportada"];
const VIS: Visibilidad[] = ["privado", "enlace", "publico"];
const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

const esData = (v: unknown) => typeof v === "string" && v.startsWith("data:");

/** Valida lo que llega del cliente. Devuelve el fanzine limpio o un mensaje de error. */
export function validarFanzine(raw: unknown, user: UsuarioDB, id: string): { f: Fanzine } | { error: string } {
  const f = raw as Partial<Fanzine> | null;
  if (!f || typeof f !== "object") return { error: "Fanzine inválido" };
  if (!Array.isArray(f.paneles) || f.paneles.length !== 8) return { error: "El fanzine debe tener 8 paneles" };
  if (!f.cancion || !EMOCIONES.includes(String(f.emocion))) return { error: "Faltan canción o emoción" };
  for (let i = 0; i < 8; i++) {
    const p = f.paneles[i];
    if (!p || p.clave !== CLAVES[i] || !Array.isArray(p.elementos) || p.elementos.length > 150) return { error: "Panel inválido" };
    if (p.fondo?.tipo === "imagen" && esData(p.fondo.valor)) return { error: "Sube las fotos antes de guardar" };
    for (const e of p.elementos) {
      if (e?.tipo === "imagen" && esData((e.datos as { src?: unknown })?.src)) return { error: "Sube las fotos antes de guardar" };
    }
  }
  const c = f.cancion;
  const vis = VIS.includes(f.visibilidad as Visibilidad) ? (f.visibilidad as Visibilidad) : "privado";
  return {
    f: {
      id,
      autorId: user.id,
      autorNombre: user.nombre,
      cancion: {
        titulo: str(c.titulo, 140),
        artista: str(c.artista, 140),
        caratulaUrl: str(c.caratulaUrl, 500),
        enlace: str(c.enlace, 500),
        previewUrl: c.previewUrl ? str(c.previewUrl, 500) : undefined,
        genero: c.genero ? str(c.genero, 60) : undefined,
      },
      emocion: f.emocion as Fanzine["emocion"],
      paneles: f.paneles as Fanzine["paneles"],
      visibilidad: vis,
      creadoEn: typeof f.creadoEn === "string" ? f.creadoEn : new Date().toISOString(),
      borrador: !!f.borrador,
      mensaje: f.mensaje ? str(f.mensaje, 160) : undefined,
    },
  };
}

export type FilaFanzine = { id: string; user_id: string; data: Fanzine; visibilidad: Visibilidad; created_at: Date; autor_handle: string; autor_nombre: string; likes: string | number; liked?: boolean };
export function aFanzine(r: FilaFanzine): Fanzine {
  return { ...r.data, id: r.id, autorId: r.user_id, autorNombre: r.autor_handle, visibilidad: r.visibilidad, creadoEn: new Date(r.created_at).toISOString(), likes: Number(r.likes ?? 0) };
}
