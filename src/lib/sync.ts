"use client";
import type { Fanzine, Usuario } from "./types";
import { api, ApiError } from "./api";
import { useApp, toast } from "./store";

const esData = (v: unknown): v is string => typeof v === "string" && v.startsWith("data:");

async function subir(dataUrl: string): Promise<string> {
  const blob = await (await fetch(dataUrl)).blob();
  const fd = new FormData();
  fd.append("file", blob, "foto");
  return (await api<{ url: string }>("/api/upload", { method: "POST", form: fd })).url;
}

/** Sube las fotos propias (data:) y devuelve el fanzine con URLs. */
export async function subirFotos(f: Fanzine): Promise<Fanzine> {
  const cache = new Map<string, string>();
  const url = async (d: string) => {
    if (!cache.has(d)) cache.set(d, await subir(d));
    return cache.get(d)!;
  };
  const paneles = [];
  for (const p of f.paneles) {
    const fondo = p.fondo.tipo === "imagen" && esData(p.fondo.valor) ? { ...p.fondo, valor: await url(p.fondo.valor) } : p.fondo;
    const elementos = [];
    for (const e of p.elementos) {
      const src = (e.datos as { src?: unknown }).src;
      elementos.push(e.tipo === "imagen" && esData(src) ? { ...e, datos: { ...e.datos, src: await url(src) } } : e);
    }
    paneles.push({ ...p, fondo, elementos });
  }
  return { ...f, paneles };
}

function marcarPendiente(id: string, pendiente: boolean) {
  useApp.setState((s) => ({ pendientes: pendiente ? Array.from(new Set([...s.pendientes, id])) : s.pendientes.filter((x) => x !== id) }));
}

/** Guarda el fanzine en el servidor. Reemplaza las fotos locales por URLs (también en el dispositivo). */
export async function empujarFanzine(f: Fanzine, silencioso = false): Promise<Fanzine | null> {
  try {
    const listo = await subirFotos(f);
    await api(`/api/fanzines/${encodeURIComponent(f.id)}`, { method: "PUT", json: { fanzine: listo } });
    useApp.setState((s) => ({ fanzines: s.fanzines.map((x) => (x.id === f.id ? { ...x, paneles: listo.paneles } : x)) }));
    marcarPendiente(f.id, false);
    return listo;
  } catch (e) {
    marcarPendiente(f.id, true);
    if (!silencioso) toast(e instanceof ApiError && e.status < 500 && e.status !== 401 ? e.message : "Guardado aquí; se sincroniza cuando haya conexión");
    return null;
  }
}

export async function reintentarPendientes() {
  const { pendientes, fanzines } = useApp.getState();
  for (const id of pendientes) {
    const f = fanzines.find((x) => x.id === id);
    if (f) await empujarFanzine(f, true);
    else marcarPendiente(id, false);
  }
}

export const borrarRemoto = (id: string) => api(`/api/fanzines/${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => undefined);
export const guardarRemoto = (id: string, mensaje?: string) => api(`/api/fanzines/${encodeURIComponent(id)}/guardar`, { method: "POST", json: { mensaje } }).catch(() => undefined);
export const leerRemoto = () => api("/api/notifs/leer", { method: "POST" }).catch(() => undefined);
export const perfilRemoto = (nombre: string, foto?: string) => api<{ user: Usuario }>("/api/auth/me", { method: "PATCH", json: { nombre, foto: foto ?? null } }).catch(() => null);
export async function likeRemoto(id: string): Promise<boolean> {
  try {
    await api(`/api/fanzines/${encodeURIComponent(id)}/like`, { method: "POST" });
    return true;
  } catch {
    return false;
  }
}

/** Trae del servidor mis fanzines, recibidos y avisos. */
export async function refrescarRemoto() {
  const [mios, rec, nt] = await Promise.all([
    api<{ fanzines: Fanzine[] }>("/api/fanzines").catch(() => null),
    api<{ fanzines: Fanzine[]; likedIds: string[] }>("/api/recibidos").catch(() => null),
    api<{ notifs: { id: string; texto: string; fecha: string; leida: boolean; tipo: "like" | "recibido" | "sistema" }[] }>("/api/notifs").catch(() => null),
  ]);
  useApp.getState().cargarRemoto({ fanzines: mios?.fanzines, recibidos: rec?.fanzines, likedIds: rec?.likedIds, notifs: nt?.notifs });
  await refrescarPremium();
}

export type EstadoPremium = { hasta: string | null; activo: boolean; plan: "mensual" | "anual" | null; pruebaUsada: boolean; pagos: boolean };
export async function refrescarPremium(): Promise<EstadoPremium | null> {
  const r = await api<EstadoPremium>("/api/premium").catch(() => null);
  if (r) {
    useApp.setState({ premium: r.activo && r.hasta ? { plan: r.plan ?? "mensual", desde: new Date().toISOString(), finPrueba: r.hasta, hasta: r.hasta } : null });
  }
  return r;
}

/** Normaliza el conteo: la tarjeta suma +1 si el usuario dio like, así que el servidor no debe incluirlo. */
export function normalizarLikes(lista: Fanzine[], likedIds: string[]): Fanzine[] {
  const set = new Set(likedIds);
  return lista.map((f) => ({ ...f, likes: Math.max(0, (f.likes ?? 0) - (set.has(f.id) ? 1 : 0)) }));
}
