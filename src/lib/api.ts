"use client";
import { create } from "zustand";

export type ConfigBackend = { backend: boolean; blob: boolean; spotifyBusqueda: boolean; spotifyLogin: boolean; pagos: boolean; correo: boolean };
type Estado = "cargando" | "off" | "on";
export const useBackend = create<{ estado: Estado; config: ConfigBackend }>(() => ({
  estado: "cargando",
  config: { backend: false, blob: false, spotifyBusqueda: false, spotifyLogin: false, pagos: false, correo: false },
}));

/** Pregunta al servidor qué piezas del backend están configuradas (sin variables, la app funciona 100 % local). */
export async function cargarConfig(): Promise<ConfigBackend> {
  try {
    const r = await fetch("/api/config", { cache: "no-store" });
    if (!r.ok) throw new Error("config");
    const config = (await r.json()) as ConfigBackend;
    useBackend.setState({ config, estado: config.backend ? "on" : "off" });
    return config;
  } catch {
    useBackend.setState({ estado: "off" });
    return useBackend.getState().config;
  }
}

export class ApiError extends Error {
  constructor(public status: number, mensaje: string) {
    super(mensaje);
  }
}

export async function api<T = unknown>(url: string, init?: Omit<RequestInit, "body"> & { json?: unknown; form?: FormData }): Promise<T> {
  const { json, form, ...rest } = init ?? {};
  const res = await fetch(url, {
    ...rest,
    cache: "no-store",
    headers: json !== undefined ? { "Content-Type": "application/json", ...(rest.headers ?? {}) } : rest.headers,
    body: form ?? (json !== undefined ? JSON.stringify(json) : undefined),
  });
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* sin cuerpo */
  }
  if (!res.ok) throw new ApiError(res.status, (data as { error?: string } | null)?.error ?? "No pudimos conectar con el servidor");
  return data as T;
}

export const hayBackend = () => useBackend.getState().estado === "on";
export const DEMO_FEED = process.env.NEXT_PUBLIC_DEMO_FEED !== "0";
