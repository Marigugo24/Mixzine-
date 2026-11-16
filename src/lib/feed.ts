"use client";
import { useCallback, useEffect, useState } from "react";
import type { Fanzine } from "./types";
import { api, useBackend } from "./api";
import { normalizarLikes } from "./sync";
import { useApp } from "./store";

type Estado = "cargando" | "ok" | "error";

/** Fanzines públicos desde el servidor. Con el backend apagado devuelve lista vacía (la app usa solo datos de prueba). */
export function useFeedRemoto(p: { vista?: "todos" | "amigos" | "tendencias"; q?: string; limit?: number }) {
  const on = useBackend((s) => s.estado === "on");
  const [items, setItems] = useState<Fanzine[]>([]);
  const [estado, setEstado] = useState<Estado>("cargando");
  const [intento, setIntento] = useState(0);
  const vista = p.vista ?? "todos";
  const q = p.q ?? "";
  const limit = p.limit ?? 24;
  const esperando = useBackend((s) => s.estado === "cargando");

  useEffect(() => {
    if (esperando) return;
    if (!on) {
      setItems([]);
      setEstado("ok");
      return;
    }
    const ac = new AbortController();
    setEstado("cargando");
    const qs = new URLSearchParams({ vista, limit: String(limit) });
    if (q.trim()) qs.set("q", q.trim());
    api<{ fanzines: Fanzine[]; likedIds: string[] }>(`/api/feed?${qs}`, { signal: ac.signal })
      .then((d) => {
        useApp.getState().mezclarLikes(d.fanzines.map((f) => f.id), d.likedIds);
        setItems(normalizarLikes(d.fanzines, d.likedIds));
        setEstado("ok");
      })
      .catch((e) => {
        if ((e as Error).name !== "AbortError") setEstado("error");
      });
    return () => ac.abort();
  }, [on, esperando, vista, q, limit, intento]);

  const recargar = useCallback(() => setIntento((v) => v + 1), []);
  return { items, estado, recargar, remoto: on };
}
