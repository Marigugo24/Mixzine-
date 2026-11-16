"use client";
import { useEffect, useId, useRef, useState } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useToasts } from "@/lib/store";
import { Ransom } from "./deco";

/* ------------------------------- Iconos ------------------------------- */
const P: Record<string, ReactNode> = {
  home: <path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" />,
  search: (<><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></>),
  plus: <path d="M12 5v14M5 12h14" />,
  bell: (<><path d="M6 17V11a6 6 0 0 1 12 0v6l2 2H4z" /><path d="M10 21h4" /></>),
  user: (<><circle cx="12" cy="8" r="4" /><path d="M4 21c1-5 15-5 16 0" /></>),
  heart: <path d="M12 21C5 15 3 11 3 8a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 3-2 7-9 13z" />,
  play: <path d="M7 4l13 8-13 8z" />,
  pause: <path d="M7 4h4v16H7zM13 4h4v16h-4z" />,
  back: <path d="M15 4l-8 8 8 8" />,
  close: <path d="M5 5l14 14M19 5L5 19" />,
  undo: <path d="M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3" />,
  redo: <path d="M15 14l5-5-5-5M20 9H10a6 6 0 0 0 0 12h3" />,
  trash: <path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14" />,
  copy: (<><rect x="8" y="8" width="12" height="12" rx="1" /><path d="M4 16V4h12" /></>),
  up: <path d="M12 19V5M5 12l7-7 7 7" />,
  down: <path d="M12 5v14M5 12l7 7 7-7" />,
  lock: (<><rect x="5" y="11" width="14" height="10" rx="1" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>),
  download: <path d="M12 4v12M6 12l6 6 6-6M4 21h16" />,
  share: (<><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M8.2 11l7.6-4M8.2 13l7.6 4" /></>),
  text: <path d="M5 6V4h14v2M12 4v16M9 20h6" />,
  sticker: <path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z" />,
  image: (<><rect x="3" y="4" width="18" height="16" rx="1" /><circle cx="9" cy="10" r="2" /><path d="M3 18l6-5 4 3 3-3 5 4" /></>),
  palette: (<><path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2s-1-1.5-1-2.5 1-1.5 2-1.5h2a4 4 0 0 0 4-4c0-4-4-8-9-8z" /><circle cx="7.5" cy="11" r="1" /><circle cx="10" cy="7" r="1" /><circle cx="15" cy="7" r="1" /></>),
  check: <path d="M4 12l6 6L20 6" />,
  link: (<><path d="M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1" /><path d="M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1" /></>),
  send: <path d="M3 11l18-8-8 18-2-8z" />,
  grid: (<><rect x="4" y="4" width="7" height="7" /><rect x="13" y="4" width="7" height="7" /><rect x="4" y="13" width="7" height="7" /><rect x="13" y="13" width="7" height="7" /></>),
  rotate: <path d="M20 12a8 8 0 1 1-3-6.2M20 4v5h-5" />,
  zoomin: (<><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4M8 11h6M11 8v6" /></>),
  zoomout: (<><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4M8 11h6" /></>),
  eye: (<><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>),
  sheet: (<><rect x="3" y="5" width="18" height="14" /><path d="M7.5 5v14M12 5v14M16.5 5v14M3 12h18" /></>),
  star: <path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z" />,
};
export function Icon({ n, size = 22, fill = false, className = "" }: { n: keyof typeof P | string; size?: number; fill?: boolean; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" className={className}>
      {P[n] ?? null}
    </svg>
  );
}

/* ------------------------------- Botones ------------------------------- */
type BtnProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart"> & { variant?: "primary" | "ink" | "ghost" | "soft" | "amarillo"; loading?: boolean; block?: boolean };
export function Button({ variant = "primary", loading, block, className = "", children, disabled, ...rest }: BtnProps) {
  const reducido = useReducedMotion();
  const base = "inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-full font-bold text-[15px] border-2 border-ink disabled:opacity-45 disabled:pointer-events-none";
  const v = {
    primary: "bg-yellow-400 text-ink shadow-[3px_3px_0_#111]",
    amarillo: "bg-yellow-400 text-ink shadow-[3px_3px_0_#111]",
    ink: "bg-white text-ink shadow-[3px_3px_0_#111]",
    soft: "bg-white text-ink shadow-[3px_3px_0_#111]",
    ghost: "bg-transparent text-ink border-transparent",
  }[variant];
  return (
    <motion.button
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      whileHover={reducido || variant === "ghost" ? undefined : { y: -2, rotate: -1.2, boxShadow: "5px 6px 0 #111" }}
      whileTap={reducido ? undefined : { scale: 0.95, y: 2, boxShadow: "0px 0px 0 #111" }}
      transition={{ type: "spring", stiffness: 500, damping: 18 }}
      className={`${base} ${v} ${block ? "w-full" : ""} ${className}`}
    >
      {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />}
      {children}
    </motion.button>
  );
}
export function IconButton({ label, n, onClick, disabled, active, size = 22, className = "" }: { label: string; n: string; onClick?: () => void; disabled?: boolean; active?: boolean; size?: number; className?: string }) {
  return (
    <button type="button" aria-label={label} title={label} disabled={disabled} onClick={onClick} className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition active:scale-[0.97] hover:bg-[color-mix(in_srgb,currentColor_15%,transparent)] disabled:opacity-35 ${active ? "bg-ink text-paper hover:bg-ink" : ""} ${className}`}>
      <Icon n={n} size={size} />
    </button>
  );
}

export function Chip({ activo, onClick, children, color }: { activo?: boolean; onClick?: () => void; children: ReactNode; color?: string }) {
  const reducido = useReducedMotion();
  return (
    <motion.button
      type="button"
      aria-pressed={!!activo}
      onClick={onClick}
      style={activo && color ? { background: color } : undefined}
      animate={activo && !reducido ? { rotate: [0, -4, 3, 0], scale: [1, 1.1, 1] } : { rotate: 0, scale: 1 }}
      whileTap={reducido ? undefined : { scale: 0.92 }}
      transition={{ duration: 0.25 }}
      className={`min-h-[44px] shrink-0 rounded-full border-2 border-ink px-4 text-sm font-bold transition-colors duration-150 ${activo ? "bg-ink text-yellow-400 shadow-[2px_2px_0_#E5348C]" : "bg-white text-ink hover:bg-yellow-400"}`}
    >
      {children}
    </motion.button>
  );
}

export function Segmentado<T extends string>({ valor, opciones, onChange, etiqueta }: { valor: T; opciones: { id: T; nombre: string }[]; onChange: (v: T) => void; etiqueta: string }) {
  const gid = useId();
  return (
    <div role="tablist" aria-label={etiqueta} className="flex w-full gap-1 rounded-full border-2 border-ink bg-white p-1 shadow-[3px_3px_0_#111]">
      {opciones.map((o) => (
        <button key={o.id} role="tab" aria-selected={valor === o.id} onClick={() => onChange(o.id)} className={`relative min-h-[40px] flex-1 rounded-full px-3 text-sm font-bold transition-colors duration-150 ${valor === o.id ? "text-ink" : "text-ink hover:bg-pink-100"}`}>
          {valor === o.id && <motion.span layoutId={`seg-${gid}`} className="absolute inset-0 rounded-full bg-yellow-400 border-2 border-ink" transition={{ type: "spring", stiffness: 420, damping: 30 }} />}
          <span className="relative">{o.nombre}</span>
        </button>
      ))}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder, label }: { value: string; onChange: (v: string) => void; placeholder: string; label: string }) {
  return (
    <label className="relative block">
      <span className="sr-only">{label}</span>
      <Icon n="search" size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/60" />
      <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-12 w-full rounded-full border-2 border-ink bg-white pl-11 pr-4 text-[15px] shadow-[3px_3px_0_#111] placeholder:text-ink/55" />
    </label>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-lg bg-ink/10 ${className}`} />;
}

export function EmptyState({ titulo, texto, accion }: { titulo: string; texto?: string; accion?: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-xs flex-col items-center gap-3 py-14 text-center">
      <img src="/brand/star.webp" alt="" aria-hidden className="h-14 w-14 -rotate-6 flota" />
      <h2 className="font-abril text-3xl">{titulo}</h2>
      {texto && <p className="text-sm text-ink/75">{texto}</p>}
      {accion}
    </div>
  );
}

export function TopBar({ titulo, atras, accion, onAtras }: { titulo: ReactNode; atras?: boolean; accion?: ReactNode; onAtras?: () => void }) {
  const texto = typeof titulo === "string" ? titulo : null;
  return (
    <header style={{ background: "var(--bar, #fff)", color: "var(--bar-txt, #111)" }} className="sticky top-0 z-30 flex min-h-[60px] items-center gap-1 border-b-2 border-ink px-2 pt-[env(safe-area-inset-top)]">
      {atras && <IconButton label="Volver" n="back" onClick={onAtras ?? (() => history.back())} />}
      <h1 className="min-w-0 flex-1 px-2 py-1">
        {texto ? (texto.length <= 16 ? <Ransom texto={texto} size={texto.length > 11 ? 19 : 24} semilla={texto.length} /> : <span className="block truncate font-comic text-2xl tracking-wide">{texto}</span>) : titulo}
      </h1>
      {accion}
    </header>
  );
}

/* ------------------------------ Toaster ------------------------------ */
export function Toaster() {
  const items = useToasts((s) => s.items);
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-[100] flex flex-col items-center gap-2 px-4 lg:bottom-8">
      <AnimatePresence>
        {items.map((t) => (
          <motion.div key={t.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="rounded-full border-2 border-ink bg-yellow-400 px-5 py-2 text-sm font-bold text-ink shadow-paperSm">
            {t.texto}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ---------------------------- Hoja inferior ---------------------------- */
export function BottomSheet({ abierto, onCerrar, titulo, children }: { abierto: boolean; onCerrar: () => void; titulo: string; children: ReactNode }) {
  const reducido = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!abierto) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", k);
    ref.current?.focus();
    return () => window.removeEventListener("keydown", k);
  }, [abierto, onCerrar]);
  return (
    <AnimatePresence>
      {abierto && (
        <>
          <motion.div key="fondo" className="fixed inset-0 z-40 bg-ink/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} onClick={onCerrar} aria-hidden />
          <motion.div key="hoja" ref={ref} tabIndex={-1} role="dialog" aria-modal="false" aria-label={titulo} className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[62dvh] max-w-xl overflow-y-auto rounded-t-3xl border-2 border-b-0 border-ink bg-paper pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_0_#111] outline-none" initial={{ y: reducido ? 0 : "100%", opacity: reducido ? 0 : 1 }} animate={{ y: 0, opacity: 1 }} exit={{ y: reducido ? 0 : "100%", opacity: reducido ? 0 : 1 }} transition={{ duration: 0.3, ease: "easeOut" }}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b-2 border-ink bg-paper px-4 py-1">
              <h2 className="font-comic text-2xl tracking-wide">{titulo}</h2>
              <IconButton label="Cerrar" n="close" onClick={onCerrar} />
            </div>
            <div className="p-4">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function useDebounced<T>(v: T, ms: number) {
  const [d, setD] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setD(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return d;
}

export function usePrecio() {
  return (n: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}
export const cop = (n: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
