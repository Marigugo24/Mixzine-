"use client";
import { useEffect } from "react";
import { useApp, useEditor, useHydration } from "@/lib/store";
import { api, cargarConfig } from "@/lib/api";
import { refrescarRemoto, reintentarPendientes } from "@/lib/sync";
import type { Usuario } from "@/lib/types";

export function Boot() {
  useEffect(() => {
    let vivo = true;
    (async () => {
      await Promise.all([useApp.persist.rehydrate(), useEditor.persist.rehydrate()]);
      const cfg = await cargarConfig();
      if (cfg.backend) {
        // la sesión vive en una cookie del servidor; manda sobre lo que haya en el dispositivo
        const me = await api<{ user: Usuario | null }>("/api/auth/me").catch(() => undefined);
        const st = useApp.getState();
        if (me?.user) {
          st.iniciarSesionRemota(me.user);
          await refrescarRemoto();
          void reintentarPendientes();
        } else if (me && (st.remoto || st.user)) {
          // sin sesión: se pide entrar (los fanzines locales se conservan para subirlos al entrar)
          useApp.setState({ user: null, remoto: false });
        }
      }
      if (vivo) useHydration.getState().set();
    })();
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    // avisos nuevos (likes, guardados) cada minuto mientras la app está visible
    const t = setInterval(() => {
      const s = useApp.getState();
      if (s.remoto && document.visibilityState === "visible") void refrescarRemoto();
    }, 60_000);
    return () => {
      vivo = false;
      clearInterval(t);
    };
  }, []);
  return null;
}
