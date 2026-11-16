"use client";
import { useEffect, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

/* ------------------------- Letras recortadas de revista ------------------------- */
const LETRAS: { f: string; bg: string; c: string; it?: boolean; w?: number }[] = [
  { f: '"Abril Fatface"', bg: "#FFFFFF", c: "#111" },
  { f: "Anton", bg: "#111111", c: "#FFF" },
  { f: '"Special Elite"', bg: "#F7E34A", c: "#111" },
  { f: '"Playfair Display"', bg: "#FBD9E8", c: "#E5348C", it: true, w: 700 },
  { f: "Bangers", bg: "#3446C8", c: "#FFF" },
  { f: '"Permanent Marker"', bg: "#FAF5F2", c: "#E5348C" },
  { f: '"Abril Fatface"', bg: "#E5348C", c: "#FFF" },
  { f: "Anton", bg: "#FAF5F2", c: "#111" },
  { f: "Bangers", bg: "#4F7B1F", c: "#F7E34A" },
];

export function Ransom({ texto, size = 40, className = "", semilla = 0, animar = true, color, jitter = false }: { texto: string; size?: number; className?: string; semilla?: number; animar?: boolean; color?: string; jitter?: boolean }) {
  const reducido = useReducedMotion();
  // stop-motion de fanzine: cada ~0.8 s las letras cambian un poco de ángulo
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!jitter || reducido) return;
    const t = setInterval(() => setTick((v) => v + 1), 800);
    return () => clearInterval(t);
  }, [jitter, reducido]);
    let k = semilla;
  let idx = 0;
  const palabras = texto.split(" ");
  return (
    <span aria-label={texto} role="text" className={`inline-flex flex-wrap items-end gap-x-3 gap-y-2 leading-none ${className}`}>
      {palabras.map((palabra, w) => (
        <span key={w} aria-hidden className="inline-flex flex-nowrap items-end gap-[2px]">
          {palabra.split("").map((ch) => {
            const i = idx++;
            const st = LETRAS[(k++ * 5 + 3) % LETRAS.length];
            const rot = (((i * 37 + semilla * 11) % 9) - 4) * 1.1;
            const big = 1 + (((i * 13) % 5) - 2) * 0.06;
            return (
              <motion.span
                key={i}
                initial={animar && !reducido ? { y: -60, opacity: 0, rotate: rot - 30, scale: 0.6 } : false}
                animate={{ y: 0, opacity: 1, rotate: rot, scale: 1 }}
                transition={{ type: "spring", stiffness: 340, damping: 14, delay: animar ? i * 0.045 : 0 }}
                whileHover={reducido ? undefined : { rotate: rot + 12, y: -6, scale: 1.18 }}
                style={{
                  display: "inline-block",
                  fontFamily: `${st.f}, serif`,
                  fontStyle: st.it ? "italic" : "normal",
                  fontWeight: st.w ?? 400,
                  fontSize: size * big,
                  background: st.bg,
                  color: st.bg === "transparent" && color ? color : st.c,
                  padding: `${size * 0.04}px ${size * 0.1}px`,
                  lineHeight: 1.02,
                  boxShadow: st.bg === "transparent" ? undefined : "1px 2px 0 rgba(0,0,0,.35)",
                  clipPath: i % 3 === 0 ? "polygon(0 4%,100% 0,97% 100%,3% 96%)" : undefined,
                }}
              >
                <span style={{ display: "inline-block", transform: `rotate(${(((i * 7 + tick * 5) % 5) - 2) * 1.4}deg) translateY(${(((i + tick) % 3) - 1) * 1}px)` }}>{ch}</span>
              </motion.span>
            );
          })}
        </span>
      ))}
    </span>
  );
}

/* ------------------------------ Estrellas y chispas ------------------------------ */
const star5 = (R: number, r: number) =>
  Array.from({ length: 10 }, (_, i) => {
    const a = ((-90 + i * 36) * Math.PI) / 180;
    const rad = i % 2 === 0 ? R : r;
    return `${(50 + rad * Math.cos(a)).toFixed(1)},${(52 + rad * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
const STAR = star5(48, 21);

export function Estrella({ size = 48, color = "#E5348C", className = "", style, giro = true, delay = 0 }: { size?: number; color?: string; className?: string; style?: CSSProperties; giro?: boolean; delay?: number }) {
  const reducido = useReducedMotion();
  return (
    <motion.svg
      aria-hidden
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`pointer-events-none absolute ${className}`}
      style={style}
      initial={reducido ? false : { scale: 0, rotate: -90 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 12, delay }}
    >
      <g className={giro ? "gira-lento" : ""} style={{ transformOrigin: "50% 52%" }}>
        <polygon points={STAR} fill={color} />
      </g>
    </motion.svg>
  );
}

export function Chispa({ size = 28, className = "", style, delay = 0 }: { size?: number; className?: string; style?: CSSProperties; delay?: number }) {
  return (
    <svg aria-hidden viewBox="0 0 100 100" width={size} height={size} className={`pointer-events-none absolute titila ${className}`} style={{ animationDelay: `${delay}s`, ...style }}>
      <defs>
        <radialGradient id="chg" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#FFF6B0" />
          <stop offset="1" stopColor="#F59AC4" />
        </radialGradient>
      </defs>
      <path d="M50 2 C54 38 62 46 98 50 C62 54 54 62 50 98 C46 62 38 54 2 50 C38 46 46 38 50 2Z" fill="url(#chg)" />
    </svg>
  );
}

/* ---------------------------- Recortes (collage) ---------------------------- */
export type RecorteProps = { src: string; w: number; className?: string; style?: CSSProperties; rot?: number; delay?: number; arrastrable?: boolean; flota?: boolean; modo?: "flota" | "pendulo" | "gira" | "late" };
export function Recorte({ src, w, className = "", style, rot = 0, delay = 0, arrastrable = false, flota = true, modo = "flota" }: RecorteProps) {
  const reducido = useReducedMotion();
  return (
    <motion.div
      aria-hidden
      className={`absolute ${arrastrable ? "cursor-grab touch-none" : "pointer-events-none"} ${className}`}
      style={{ width: w, ...style }}
      initial={reducido ? false : { opacity: 0, scale: 0.3, rotate: rot - 40, y: 80 }}
      animate={{ opacity: 1, scale: 1, rotate: rot, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 13, delay }}
      drag={arrastrable && !reducido}
      dragElastic={0.35}
      dragSnapToOrigin
      whileDrag={{ scale: 1.12, rotate: rot + 8, zIndex: 50 }}
    >
      <motion.img
        src={src}
        alt=""
        draggable={false}
        className={`block w-full select-none drop-shadow-[3px_4px_0_rgba(0,0,0,.35)] ${flota && !reducido && modo === "flota" ? "flota" : ""}`}
        style={{ ["--r" as string]: `${rot}deg`, animationDelay: `${delay * 1.5}s`, transformOrigin: modo === "pendulo" ? "50% 0%" : "50% 50%" } as CSSProperties}
        animate={
          reducido || !flota
            ? undefined
            : modo === "pendulo"
              ? { rotate: [-9, 9, -9] }
              : modo === "gira"
                ? { rotate: 360 }
                : modo === "late"
                  ? { scale: [1, 1.12, 1, 1.08, 1] }
                  : undefined
        }
        transition={modo === "gira" ? { duration: 16, repeat: Infinity, ease: "linear" } : modo === "late" ? { duration: 1.6, repeat: Infinity } : { duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
  );
}

/* ------------------------------- Etiquetas y cintas ------------------------------- */
export function Etiqueta({ children, color = "olive", rot = -2, className = "" }: { children: ReactNode; color?: "olive" | "ink" | "pink" | "yellow" | "white"; rot?: number; className?: string }) {
  const c = { olive: "bg-olive-600 text-white", ink: "bg-ink text-paper", pink: "bg-pink-500 text-white", yellow: "bg-yellow-400 text-ink", white: "bg-white text-ink" }[color];
  return (
    <motion.span initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", stiffness: 200, damping: 16 }} className={`inline-block px-3 py-1.5 text-[13px] font-bold uppercase leading-tight tracking-wide shadow-[3px_3px_0_#111] ${c} ${className}`} style={{ transform: `rotate(${rot}deg)` }}>
      {children}
    </motion.span>
  );
}

export function Marquee({ items, className = "" }: { items: string[]; className?: string }) {
  const fila = [...items, ...items];
  return (
    <div aria-hidden className={`overflow-hidden whitespace-nowrap border-y-2 border-ink bg-yellow-400 py-1.5 text-ink ${className}`}>
      <div className="marquee-pista">
        {[0, 1].map((k) => (
          <div key={k} className="flex shrink-0 items-center">
            {fila.map((t, i) => (
              <span key={i} className="mx-4 font-anton text-sm uppercase tracking-[0.18em]">
                {t} <span className="text-pink-500">✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------- Fondo de degradado con grano (MVP) ---------------------- */
export function Blobs({ className = "" }: { className?: string }) {
  const reducido = useReducedMotion();
  const bl = (c: string, size: number, x: string, y: string, dx: number, dy: number, d: number) => (
    <motion.div
      className="absolute rounded-full"
      style={{ width: size, height: size, left: x, top: y, background: c, filter: "blur(60px)", opacity: 0.9 }}
      animate={reducido ? undefined : { x: [0, dx, -dx / 2, 0], y: [0, dy, -dy / 2, 0], scale: [1, 1.15, 0.95, 1] }}
      transition={{ duration: d, repeat: Infinity, ease: "easeInOut" }}
    />
  );
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} style={{ background: "linear-gradient(160deg,#E8552B 0%,#E5348C 55%,#7B3FB0 100%)" }}>
      {bl("#F7A12B", 340, "-10%", "-5%", 70, 50, 9)}
      {bl("#F26AB8", 300, "50%", "20%", -60, 70, 11)}
      {bl("#9B5BE0", 360, "5%", "60%", 80, -60, 13)}
      {bl("#FFE27A", 180, "55%", "62%", -50, -40, 8)}
    </div>
  );
}

/* ------------------------------ Página con tono ------------------------------ */
export type Tono = "naranja" | "oliva" | "rosa" | "amarillo" | "cobalto" | "morado";
const TONOS: Record<Tono, { alt: string; bar: string; barTxt: string; oscuro?: boolean; estrella: string }> = {
  naranja: { alt: "#E5348C", bar: "#FFFFFF", barTxt: "#111", estrella: "#E5348C" },
  oliva: { alt: "#F7E34A", bar: "#FFFFFF", barTxt: "#111", estrella: "#E5348C" },
  rosa: { alt: "#F7E34A", bar: "#FFFFFF", barTxt: "#111", estrella: "#F7E34A" },
  amarillo: { alt: "#E5348C", bar: "#FFFFFF", barTxt: "#111", estrella: "#E5348C" },
  cobalto: { alt: "#E5348C", bar: "#FFFFFF", barTxt: "#111", oscuro: true, estrella: "#F7E34A" },
  morado: { alt: "#E8772B", bar: "#FFFFFF", barTxt: "#111", oscuro: true, estrella: "#F7E34A" },
};
export function Pagina({ tono, children, className = "", recortes = [] }: { tono: Tono; children: ReactNode; className?: string; halftone?: boolean; adornos?: boolean; recortes?: ItemDeco[] }) {
  const T = TONOS[tono];
  return (
    <div className={`relative isolate min-h-dvh overflow-x-clip text-ink ${className}`} style={{ ["--bar" as string]: T.bar, ["--bar-txt" as string]: T.barTxt, background: "linear-gradient(180deg,#F58AC0 0%,#EE5FA7 100%) fixed" } as CSSProperties}>
      {/* arriba blanco con una franja amarilla; el resto, rosado */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[290px] border-b-2 border-ink bg-white" style={{ clipPath: "polygon(0 0,100% 0,100% 78%,0 100%)" }} />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[200px] -z-10 h-[110px] bg-yellow-400" style={{ clipPath: "polygon(0 52%,100% 16%,100% 36%,0 76%)", boxShadow: "0 2px 0 #111" }} />
      <Decoracion items={recortes.slice(0, 2)} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/* ============================ COLLAGE ============================ */
const polis = new Map<string, string>();
function polyRasgado(seed: number, n = 22, amp = 1.8) {
  const k = `${seed}-${n}-${amp}`;
  const hit = polis.get(k);
  if (hit) return hit;
  let a = seed * 9301 + 49297;
  const r = () => ((a = (a * 9301 + 49297) % 233280) / 233280);
  const top: string[] = [];
  const bot: string[] = [];
  for (let i = 0; i <= n; i++) top.push(`${((i / n) * 100).toFixed(1)}% ${(r() * amp).toFixed(1)}%`);
  for (let i = n; i >= 0; i--) bot.push(`${((i / n) * 100).toFixed(1)}% ${(100 - r() * amp).toFixed(1)}%`);
  const v = `polygon(${top.join(",")},${bot.join(",")})`;
  polis.set(k, v);
  return v;
}

/** Trozo de papel con bordes rasgados, sombra dura y "pegado" al entrar. */
export function Papel({ children, color = "#FAF5F2", rot = 0, semilla = 1, className = "", pad = "p-4", cinta = true }: { children: ReactNode; color?: string; rot?: number; semilla?: number; className?: string; pad?: string; cinta?: boolean }) {
  const reducido = useReducedMotion();
  return (
    <motion.div
      className={`relative ${className}`}
      initial={reducido ? false : { opacity: 0, scale: 1.18, rotate: rot + 6, y: -20 }}
      whileInView={{ opacity: 1, scale: 1, rotate: rot, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -30px 0px" }}
      transition={{ type: "spring", stiffness: 260, damping: 15 }}
    >
      <div style={{ filter: "drop-shadow(3px 4px 0 rgba(17,17,17,.9))" }}>
        <div className={pad} style={{ clipPath: polyRasgado(semilla), background: color }}>
          {children}
        </div>
      </div>
      {cinta && <Cinta className="-top-3 left-6" rot={-8} />}
    </motion.div>
  );
}

export function Cinta({ className = "", rot = 0, color = "rgba(247,227,74,.82)", w = 64 }: { className?: string; rot?: number; color?: string; w?: number }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute z-10 block ${className}`}
      style={{ width: w, height: w * 0.3, background: color, transform: `rotate(${rot}deg)`, clipPath: "polygon(0 8%,4% 0,8% 10%,12% 0,100% 6%,96% 50%,100% 94%,90% 100%,84% 90%,78% 100%,0 92%,4% 50%)", boxShadow: "inset 0 0 0 1px rgba(0,0,0,.08)" }}
    />
  );
}

/* Decoración fija que se desplaza a distinta velocidad al hacer scroll (parallax) */
export type ItemDeco = { src: string; w: number; x: string; y: string; rot?: number; v?: number; modo?: RecorteProps["modo"] };
function ItemParallax({ it }: { it: ItemDeco }) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 2000], [0, -2000 * (it.v ?? 0.15)]);
  const rotar = useTransform(scrollY, [0, 2000], [it.rot ?? 0, (it.rot ?? 0) + 120 * (it.v ?? 0.15)]);
  return (
    <motion.div aria-hidden className="pointer-events-none fixed z-0" style={{ left: it.x, top: it.y, width: it.w, y, rotate: rotar }}>
      <Recorte src={it.src} w={it.w} className="!relative" modo={it.modo} rot={0} />
    </motion.div>
  );
}
export function Decoracion({ items }: { items: ItemDeco[] }) {
  return (
    <>
      {items.map((it, k) => (
        <ItemParallax key={k} it={it} />
      ))}
    </>
  );
}

/** Cabecera grande con banda diagonal de color, título de revista y recortes encima. */
export function Cabecera({ titulo, sub, banda = "transparent", recortes = [], semilla = 0, ancho = 40 }: { titulo: string; sub?: string; banda?: string; recortes?: { src: string; w: number; right?: string; left?: string; top?: string; rot?: number; modo?: RecorteProps["modo"] }[]; semilla?: number; ancho?: number }) {
  return (
    <div className="relative overflow-hidden px-4 pb-10 pt-7">
      <motion.div aria-hidden className="absolute inset-x-[-5%] top-3 bottom-2 -z-0 " style={{ background: "transparent", clipPath: "polygon(0 10%,100% 0,100% 90%,0 100%)" }} initial={{ x: "-100%" }} animate={{ x: 0 }} transition={{ type: "spring", stiffness: 120, damping: 18, delay: 0.1 }} />
      <div className="relative z-10 max-w-[78%]">
        <Ransom texto={titulo} size={ancho} semilla={semilla} />
        {sub && (
          <div className="mt-3">
            <Etiqueta color="yellow" rot={-1}>
              {sub}
            </Etiqueta>
          </div>
        )}
      </div>
      {recortes.map((r, i) => (
        <Recorte key={i} src={r.src} w={r.w} rot={r.rot ?? 0} delay={0.3 + i * 0.15} modo={r.modo} className="z-10" style={{ right: r.right, left: r.left, top: r.top ?? "10%" }} />
      ))}
    </div>
  );
}

const FRASES = ["recorta", "pega", "comparte", "una canción", "mil formas de sentirla", "hecho a mano", "play ▸", "tu emoción en papel"];
/** Pausa de collage entre filas de la cuadrícula. */
export function Interludio({ i = 0, src = "/collage/audifonos.webp" }: { i?: number; src?: string }) {
  const n = Math.floor(i);
  const f = FRASES[(n * 3) % FRASES.length];
  const col = ["#F7E34A", "#FBD9E8", "#BFE3F5", "#A9B232"][n % 4];
  return (
    <li className="col-span-full my-2" aria-hidden>
      <Papel color={col} rot={n % 2 ? 1.5 : -1.5} semilla={n + 3} className="mx-auto max-w-sm" pad="px-5 py-4">
        <div className="flex items-center gap-3">
          <Ransom texto={f} size={22} semilla={n} />
          <Estrella size={26} className="!relative ml-auto shrink-0" delay={0} />
        </div>
      </Papel>
      <Recorte src={src} w={74} rot={n % 2 ? 12 : -10} className="!relative -mt-10 ml-auto mr-3 block" delay={0.1} modo={n % 2 ? "pendulo" : "flota"} />
    </li>
  );
}
