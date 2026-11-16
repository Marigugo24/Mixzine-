"use client";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Fanzine } from "@/lib/types";
import { hashStr } from "@/lib/render";
import { EMOCIONES } from "@/lib/emotions";
import { useApp, toast } from "@/lib/store";
import { PanelView } from "./PanelView";
import { Cinta } from "./deco";
import { Icon, Skeleton } from "./ui";

const PEGATINAS: (string | null)[] = ["/brand/star.webp", "/collage/flor-verde.webp", null, "/collage/estrella-azul.webp", null, "/collage/diamante.webp"];

export function useLike(f: Fanzine) {
  const liked = useApp((s) => !!s.likes[f.id]);
  const toggle = useApp((s) => s.toggleLike);
  const [anim, setAnim] = useState(0);
  const hacer = () => {
    const nuevo = toggle(f.id);
    setAnim((a) => a + 1);
    navigator.vibrate?.(10);
    if (nuevo) toast("Te gustó este fanzine");
  };
  return { liked, count: (f.likes ?? 0) + (liked ? 1 : 0), hacer, anim };
}

export function FanzineCard({ f, i = 0 }: { f: Fanzine; i?: number }) {
  const { liked, count, hacer, anim } = useLike(f);
  const reducido = useReducedMotion();
  const rot = ((hashStr(f.id) % 401) - 200) / 100; // -2° a 2°, fijo por id
  const alt = `Fanzine de @${f.autorNombre} sobre ${f.cancion.titulo}`;
  return (
    <motion.li
      initial={reducido ? false : { opacity: 0, y: 40, rotate: rot + 8, scale: 0.88 }}
      whileInView={{ opacity: 1, y: 0, rotate: rot, scale: 1 }}
      viewport={{ once: true, margin: "0px 0px -40px 0px" }}
      transition={{ type: "spring", stiffness: 220, damping: 16, delay: Math.min(i, 8) * 0.04 }}
      whileHover={reducido ? undefined : { rotate: 0, y: -8, scale: 1.04, zIndex: 5 }}
      whileTap={reducido ? undefined : { scale: 0.96 }}
      className="relative"
    >
            <Cinta className="-top-3 left-3" rot={-12} w={54} />
      <Link href={`/fanzine/${f.id}`} aria-label={alt} className="relative block rounded-sm border-2 border-ink bg-white text-ink shadow-[4px_4px_0_#111]">
        <PanelView panel={f.paneles[0]} />
        <div className="border-t-2 border-ink bg-paper px-2.5 py-2 pr-14">
          <p className="truncate text-[13px] font-bold leading-tight">{f.cancion.titulo}</p>
          <p className="truncate text-xs text-ink/75">@{f.autorNombre}</p>
        </div>
      </Link>
      <button type="button" onClick={hacer} aria-pressed={liked} aria-label={`${liked ? "Quitar me gusta de" : "Me gusta"}: ${alt}`} className="absolute bottom-0 right-0 flex h-11 min-w-11 items-center justify-center gap-1 rounded-tl-xl px-2 text-xs font-bold text-ink">
        <span key={anim} className={anim ? "like-rebote relative inline-flex" : "relative inline-flex"}>
          <Icon n="heart" size={19} fill={liked} className={liked ? "text-pink-500" : ""} />
          <AnimatePresence>
            {liked && anim > 0 && !reducido && [0, 1, 2, 3, 4, 5].map((k) => (
              <motion.span key={k} className="pointer-events-none absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 text-pink-500" initial={{ opacity: 1, x: 0, y: 0, scale: 1 }} animate={{ opacity: 0, x: Math.cos((k / 6) * 6.28) * 26, y: Math.sin((k / 6) * 6.28) * 26 - 6, scale: 0.4, rotate: 120 }} transition={{ duration: 0.6, ease: "easeOut" }}>
                ✦
              </motion.span>
            ))}
          </AnimatePresence>
        </span>
        <span className="tabular-nums" aria-hidden>{count}</span>
      </button>
      <span className="absolute -top-2 left-2 rounded-full border-2 border-ink bg-yellow-400 px-2 py-0.5 text-[10px] font-bold uppercase shadow-[2px_2px_0_#111]">
        {EMOCIONES[f.emocion].nombre}
      </span>
    </motion.li>
  );
}

export function TarjetaCargando() {
  return (
    <li aria-hidden>
      <Skeleton className="aspect-[74/118] w-full border-2 border-ink/30 !bg-white/50" />
    </li>
  );
}

export function Cuadricula({ children }: { children: React.ReactNode }) {
  return <ul className="grid grid-cols-2 gap-x-4 gap-y-7 px-4 py-6 md:grid-cols-3 lg:grid-cols-4">{children}</ul>;
}
