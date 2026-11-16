"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useEffect, useState } from "react";
import type { Elemento, Fanzine, Fondo, Notificacion, Usuario } from "./types";
import { NOTIFS_INICIALES } from "./seed";
import { uid } from "./emotions";
import { borrarRemoto, empujarFanzine, guardarRemoto, leerRemoto, likeRemoto, normalizarLikes, perfilRemoto } from "./sync";

const safeLS = {
  getItem: (k: string) => localStorage.getItem(k),
  setItem: (k: string, v: string) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      queueMicrotask(() => toast("Sin espacio para autoguardar: usa fotos más pequeñas"));
    }
  },
  removeItem: (k: string) => localStorage.removeItem(k),
};

export type Plan = { plan: "mensual" | "anual"; desde: string; finPrueba: string; /** con cuenta, el servidor manda: fecha hasta la que hay Premium */ hasta?: string };

type App = {
  onboarded: boolean;
  user: Usuario | null;
  fanzines: Fanzine[];
  recibidos: Fanzine[];
  likes: Record<string, boolean>;
  premium: Plan | null;
  notifs: Notificacion[];
  /** true cuando la sesión viene de una cuenta en el servidor */
  remoto: boolean;
  /** ids de fanzines que aún no se sincronizaron */
  pendientes: string[];
  iniciarSesionRemota: (u: Usuario) => void;
  cerrarSesionRemota: () => void;
  cargarRemoto: (d: { fanzines?: Fanzine[]; recibidos?: Fanzine[]; likedIds?: string[]; notifs?: Notificacion[] }) => void;
  mezclarLikes: (visibles: string[], likedIds: string[]) => void;
  setOnboarded: () => void;
  setUser: (nombre: string, foto?: string) => void;
  guardarFanzine: (f: Fanzine) => void;
  borrarFanzine: (id: string) => void;
  guardarRecibido: (f: Fanzine) => void;
  toggleLike: (id: string) => boolean;
  activarPlan: (p: "mensual" | "anual") => void;
  cancelarPlan: () => void;
  notificar: (texto: string, tipo: Notificacion["tipo"]) => void;
  marcarLeidas: () => void;
};

export const useApp = create<App>()(
  persist(
    (set, get) => ({
      onboarded: false,
      user: null,
      fanzines: [],
      recibidos: [],
      likes: {},
      premium: null,
      notifs: NOTIFS_INICIALES,
      remoto: false,
      pendientes: [],
      iniciarSesionRemota: (u) => {
        const s0 = get();
        const otraCuenta = s0.remoto && s0.user && s0.user.id !== u.id;
        // Si venías en modo local, tus fanzines se suben a la cuenta; si cambia la cuenta, se limpia el dispositivo.
        set(otraCuenta ? { user: u, onboarded: true, remoto: true, fanzines: [], recibidos: [], likes: {}, notifs: [], pendientes: [] } : { user: u, onboarded: true, remoto: true, notifs: s0.remoto ? s0.notifs : [], pendientes: s0.remoto ? s0.pendientes : s0.fanzines.map((f) => f.id) });
      },
      cerrarSesionRemota: () => set({ user: null, remoto: false, fanzines: [], recibidos: [], likes: {}, notifs: [], pendientes: [], premium: null }),
      cargarRemoto: ({ fanzines, recibidos, likedIds, notifs }) =>
        set((s) => {
          const ids = likedIds ?? Object.keys(s.likes).filter((k) => s.likes[k]);
          const locales = s.fanzines.filter((f) => s.pendientes.includes(f.id));
          const remotos = fanzines ? normalizarLikes(fanzines, ids) : null;
          return {
            fanzines: remotos ? [...locales, ...remotos.filter((f) => !s.pendientes.includes(f.id))] : s.fanzines,
            recibidos: recibidos ? normalizarLikes(recibidos, ids).map((f) => ({ ...f, visibilidad: "enlace" as const })) : s.recibidos,
            likes: likedIds ? { ...s.likes, ...Object.fromEntries(likedIds.map((i) => [i, true])) } : s.likes,
            notifs: notifs ?? s.notifs,
          };
        }),
      mezclarLikes: (visibles, likedIds) =>
        set((s) => {
          const l = { ...s.likes };
          const on = new Set(likedIds);
          for (const id of visibles) l[id] = on.has(id);
          return { likes: l };
        }),
      setOnboarded: () => set({ onboarded: true }),
      setUser: (nombre, foto) => {
        const handle = nombre.trim().toLowerCase().replace(/[^a-z0-9._]+/g, "_").replace(/^_+|_+$/g, "") || "usuario";
        const actual = get().user;
        set({ user: { id: actual?.id ?? uid(), nombre: nombre.trim(), foto, handle: get().remoto && actual ? actual.handle : handle }, onboarded: true });
        if (get().remoto) void perfilRemoto(nombre.trim(), foto);
      },
      guardarFanzine: (f) => {
        set((s) => ({ fanzines: [f, ...s.fanzines.filter((x) => x.id !== f.id)] }));
        if (get().remoto) void empujarFanzine(f);
      },
      borrarFanzine: (id) => {
        set((s) => ({ fanzines: s.fanzines.filter((x) => x.id !== id), pendientes: s.pendientes.filter((x) => x !== id) }));
        if (get().remoto) void borrarRemoto(id);
      },
      guardarRecibido: (f) => {
        set((s) => ({ recibidos: s.recibidos.some((x) => x.id === f.id) ? s.recibidos : [{ ...f, visibilidad: "enlace" }, ...s.recibidos] }));
        if (get().remoto) void guardarRemoto(f.id, f.mensaje);
      },
      toggleLike: (id) => {
        const nuevo = !get().likes[id];
        set((s) => ({ likes: { ...s.likes, [id]: nuevo } }));
        if (get().remoto && !id.startsWith("demo-")) {
          void likeRemoto(id).then((ok) => {
            if (!ok) set((s) => ({ likes: { ...s.likes, [id]: !nuevo } }));
          });
        }
        return nuevo;
      },
      activarPlan: (p) => {
        const ahora = new Date();
        set({ premium: { plan: p, desde: ahora.toISOString(), finPrueba: new Date(ahora.getTime() + 7 * 864e5).toISOString() } });
      },
      cancelarPlan: () => set({ premium: null }),
      notificar: (texto, tipo) =>
        set((s) => ({ notifs: [{ id: uid(), texto, tipo, fecha: new Date().toISOString(), leida: false }, ...s.notifs].slice(0, 50) })),
      marcarLeidas: () => {
        if (get().notifs.some((n) => !n.leida)) {
          set((s) => ({ notifs: s.notifs.map((n) => ({ ...n, leida: true })) }));
          if (get().remoto) void leerRemoto();
        }
      },
    }),
    {
      name: "mixzine-app-v1",
      storage: createJSONStorage(() => safeLS),
      skipHydration: true,
    }
  )
);

/** true cuando ya se leyó localStorage (evita desajustes con el HTML del servidor) */
export const useHydration = create<{ ok: boolean; set: () => void }>((set) => ({ ok: false, set: () => set({ ok: true }) }));
export function useListo() {
  return useHydration((s) => s.ok);
}

export function esPremium(p: Plan | null) {
  if (!p) return false;
  if (p.hasta) return Date.now() < new Date(p.hasta).getTime();
  const dias = p.plan === "anual" ? 365 : 30;
  return Date.now() < new Date(p.desde).getTime() + (7 + dias) * 864e5;
}
export const usePremium = () => esPremium(useApp((s) => s.premium));

/* ------------------------------ Toasts ------------------------------ */
type Toast = { id: number; texto: string };
export const useToasts = create<{ items: Toast[] }>(() => ({ items: [] }));
let tid = 0;
export function toast(texto: string) {
  const id = ++tid;
  useToasts.setState((s) => ({ items: [...s.items, { id, texto }] }));
  setTimeout(() => useToasts.setState((s) => ({ items: s.items.filter((t) => t.id !== id) })), 2000);
}

/* ------------------------------ Editor ------------------------------ */
type Editor = {
  draft: Fanzine | null;
  panel: number;
  sel: string | null;
  past: Fanzine[];
  future: Fanzine[];
  setDraft: (f: Fanzine | null) => void;
  setPanel: (i: number) => void;
  select: (id: string | null) => void;
  snap: () => void;
  patch: (id: string, p: Partial<Elemento> | { datos: Record<string, unknown> }) => void;
  add: (e: Omit<Elemento, "id" | "z"> & { id?: string }) => string;
  remove: (id: string) => void;
  duplicar: (id: string) => void;
  capa: (id: string, dir: 1 | -1) => void;
  setFondo: (f: Fondo) => void;
  undo: () => void;
  redo: () => void;
};

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

export const useEditor = create<Editor>()(
  persist(
    (set, get) => {
      const mutarPanel = (fn: (els: Elemento[]) => Elemento[]) =>
        set((s) => {
          if (!s.draft) return s;
          const paneles = s.draft.paneles.map((p, i) => (i === s.panel ? { ...p, elementos: fn(p.elementos) } : p));
          return { draft: { ...s.draft, paneles } };
        });
      return {
        draft: null,
        panel: 0,
        sel: null,
        past: [],
        future: [],
        setDraft: (f) => set({ draft: f, panel: 0, sel: null, past: [], future: [] }),
        setPanel: (i) => set({ panel: i, sel: null }),
        select: (id) => set({ sel: id }),
        snap: () => {
          const d = get().draft;
          if (!d) return;
          set((s) => ({ past: [...s.past.slice(-59), clone(d)], future: [] }));
        },
        patch: (id, p) =>
          mutarPanel((els) =>
            els.map((e) => (e.id === id ? ({ ...e, ...p, datos: "datos" in p && p.datos ? { ...e.datos, ...p.datos } : e.datos } as Elemento) : e))
          ),
        add: (e) => {
          get().snap();
          const id = e.id ?? uid();
          void import("@/components/PanelView").then((m) => m.marcarNuevo(id));
          mutarPanel((els) => [...els, { ...e, id, z: els.length ? Math.max(...els.map((x) => x.z)) + 1 : 0 }]);
          set({ sel: id });
          return id;
        },
        remove: (id) => {
          get().snap();
          mutarPanel((els) => els.filter((e) => e.id !== id));
          set({ sel: null });
        },
        duplicar: (id) => {
          const d = get().draft;
          const src = d?.paneles[get().panel].elementos.find((e) => e.id === id);
          if (!src) return;
          get().snap();
          const nid = uid();
          mutarPanel((els) => [...els, { ...clone(src), id: nid, x: src.x + 3, y: src.y + 3, z: Math.max(...els.map((x) => x.z)) + 1 }]);
          set({ sel: nid });
        },
        capa: (id, dir) => {
          get().snap();
          mutarPanel((els) => {
            const orden = [...els].sort((a, b) => a.z - b.z);
            const i = orden.findIndex((e) => e.id === id);
            const j = i + dir;
            if (i < 0 || j < 0 || j >= orden.length) return els;
            [orden[i], orden[j]] = [orden[j], orden[i]];
            const z = new Map(orden.map((e, k) => [e.id, k]));
            return els.map((e) => ({ ...e, z: z.get(e.id)! }));
          });
        },
        setFondo: (f) => {
          get().snap();
          set((s) => (s.draft ? { draft: { ...s.draft, paneles: s.draft.paneles.map((p, i) => (i === s.panel ? { ...p, fondo: f } : p)) } } : s));
        },
        undo: () => {
          const { past, draft } = get();
          if (!past.length || !draft) return;
          set((s) => ({ draft: past[past.length - 1], past: past.slice(0, -1), future: [clone(draft), ...s.future], sel: null }));
        },
        redo: () => {
          const { future, draft } = get();
          if (!future.length || !draft) return;
          set((s) => ({ draft: future[0], future: future.slice(1), past: [...s.past, clone(draft)], sel: null }));
        },
      };
    },
    {
      name: "mixzine-borrador-v1",
      storage: createJSONStorage(() => safeLS),
      partialize: (s) => ({ draft: s.draft }) as Partial<Editor>,
      skipHydration: true,
    }
  )
);

/* ---------- Hooks utilitarios ---------- */
export function useFontsListas() {
  const [n, setN] = useState(0);
  useEffect(() => {
    let vivo = true;
    import("./text").then(({ ensureFonts }) => ensureFonts().then(() => vivo && setN((x) => x + 1)));
    return () => {
      vivo = false;
    };
  }, []);
  return n;
}
