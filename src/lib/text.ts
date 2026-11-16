import type { TextoDatos } from "./types";

export const FUENTES: Record<TextoDatos["fuente"], { css: string; peso: number; nombre: string }> = {
  ui: { css: "Poppins", peso: 600, nombre: "Poppins" },
  type: { css: '"Special Elite"', peso: 400, nombre: "Máquina" },
  marker: { css: '"Permanent Marker"', peso: 400, nombre: "Marcador" },
  comic: { css: "Bangers", peso: 400, nombre: "Cómic" },
};

export const fontShorthand = (f: TextoDatos["fuente"], px: number) => {
  const d = FUENTES[f] ?? FUENTES.ui;
  return `${d.peso} ${px}px ${d.css}, system-ui, sans-serif`;
};

let fontsPromise: Promise<void> | null = null;
export function ensureFonts(): Promise<void> {
  if (typeof document === "undefined" || !("fonts" in document)) return Promise.resolve();
  if (!fontsPromise) {
    fontsPromise = Promise.all(
      (Object.keys(FUENTES) as TextoDatos["fuente"][]).map((k) => document.fonts.load(fontShorthand(k, 24), "Aa áéíñ")).concat(document.fonts.load("400 24px Poppins"))
    )
      .then(() => undefined)
      .catch(() => undefined);
  }
  return fontsPromise;
}

let mctx: CanvasRenderingContext2D | null = null;
function ctx() {
  if (typeof document === "undefined") return null;
  if (!mctx) mctx = document.createElement("canvas").getContext("2d");
  return mctx;
}
const REF = 100;
function ancho(text: string, f: TextoDatos["fuente"], tamMm: number, aprox = false): number {
  const c = aprox ? null : ctx();
  if (!c) return text.length * tamMm * 0.55;
  c.font = fontShorthand(f, REF);
  return (c.measureText(text).width * tamMm) / REF;
}

export type Layout = { lines: string[]; lineH: number; pad: number; alto: number };

export function layoutTexto(d: TextoDatos, anchoMm: number, aprox = false): Layout {
  const pad = d.fondo === "ninguno" ? 0 : 1.6;
  const inner = Math.max(anchoMm - pad * 2, d.tam);
  const lineH = d.tam * 1.2;
  const lines: string[] = [];
  for (const para of (d.texto || " ").split("\n")) {
    const words = para.split(/\s+/).filter(Boolean);
    if (!words.length) {
      lines.push("");
      continue;
    }
    let cur = "";
    for (const w0 of words) {
      let w = w0;
      // palabras más largas que el ancho
      while (ancho(w, d.fuente, d.tam, aprox) > inner && w.length > 1) {
        let cut = w.length - 1;
        while (cut > 1 && ancho(w.slice(0, cut), d.fuente, d.tam, aprox) > inner) cut--;
        if (cur) {
          lines.push(cur);
          cur = "";
        }
        lines.push(w.slice(0, cut));
        w = w.slice(cut);
      }
      const test = cur ? cur + " " + w : w;
      if (ancho(test, d.fuente, d.tam, aprox) <= inner || !cur) cur = test;
      else {
        lines.push(cur);
        cur = w;
      }
    }
    lines.push(cur);
  }
  return { lines, lineH, pad, alto: lines.length * lineH + pad * 2 };
}
