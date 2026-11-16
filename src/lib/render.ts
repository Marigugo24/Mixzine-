import { IMPOSICION, PANEL_H, PANEL_W, SHEET_H, SHEET_W } from "./types";
import type { Elemento, Fanzine, ImagenDatos, Panel, StickerDatos, TextoDatos } from "./types";
import { PALETA, papelSrc, stickerSrc } from "./assets";
import { ensureFonts, fontShorthand, layoutTexto } from "./text";

const imgCache = new Map<string, Promise<HTMLImageElement>>();
export function cargarImg(src: string): Promise<HTMLImageElement> {
  let p = imgCache.get(src);
  if (!p) {
    p = new Promise((res, rej) => {
      const im = new Image();
      im.crossOrigin = "anonymous";
      im.onload = () => res(im);
      im.onerror = () => rej(new Error("img"));
      im.src = src;
    });
    imgCache.set(src, p);
  }
  return p;
}

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
export function hashStr(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/* ------------- Filtros horneados (grano, duotono, borde rasgado) ------------- */
const bakeCache = new Map<string, Promise<string>>();
export function bakeKey(src: string, filtro: string, rasgado: boolean) {
  return `${src.length}:${src.slice(-48)}:${filtro}:${rasgado}`;
}
export function bakeImagen(src: string, filtro: ImagenDatos["filtro"], rasgado: boolean): Promise<string> {
  if (filtro === "none" && !rasgado) return Promise.resolve(src);
  const key = bakeKey(src, filtro, rasgado);
  let p = bakeCache.get(key);
  if (!p) {
    p = (async () => {
      const im = await cargarImg(src);
      const max = 900;
      const k = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight));
      const w = Math.max(2, Math.round(im.naturalWidth * k));
      const h = Math.max(2, Math.round(im.naturalHeight * k));
      const tmp = document.createElement("canvas");
      tmp.width = w;
      tmp.height = h;
      const t = tmp.getContext("2d")!;
      t.drawImage(im, 0, 0, w, h);
      if (filtro !== "none") {
        const data = t.getImageData(0, 0, w, h);
        const d = data.data;
        const r = rng(7);
        for (let i = 0; i < d.length; i += 4) {
          if (filtro === "grano") {
            const n = (r() - 0.5) * 70;
            d[i] = d[i] + n;
            d[i + 1] = d[i + 1] + n;
            d[i + 2] = d[i + 2] + n;
          } else {
            const l = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
            // morado oscuro -> rosa chicle
            d[i] = 91 + (245 - 91) * l;
            d[i + 1] = 60 + (154 - 60) * l;
            d[i + 2] = 154 + (196 - 154) * l;
          }
        }
        t.putImageData(data, 0, 0);
      }
      if (!rasgado) return tmp.toDataURL("image/png");
      const out = document.createElement("canvas");
      out.width = w;
      out.height = h;
      const o = out.getContext("2d")!;
      const rr = rng(hashStr(key));
      const poly = (inset: number, amp: number) => {
        const pts: [number, number][] = [];
        const n = 36;
        const ix = w * inset;
        const iy = h * inset;
        const A = Math.min(w, h) * amp;
        for (let i = 0; i <= n; i++) pts.push([ix + ((w - 2 * ix) * i) / n, iy + (rr() - 0.5) * 2 * A]);
        for (let i = 1; i <= n; i++) pts.push([w - ix + (rr() - 0.5) * 2 * A, iy + ((h - 2 * iy) * i) / n]);
        for (let i = 1; i <= n; i++) pts.push([w - ix - ((w - 2 * ix) * i) / n, h - iy + (rr() - 0.5) * 2 * A]);
        for (let i = 1; i < n; i++) pts.push([ix + (rr() - 0.5) * 2 * A, h - iy - ((h - 2 * iy) * i) / n]);
        return pts;
      };
      const path = (pts: [number, number][]) => {
        o.beginPath();
        pts.forEach(([x, y], i) => (i ? o.lineTo(x, y) : o.moveTo(x, y)));
        o.closePath();
      };
      path(poly(0.012, 0.012));
      o.fillStyle = PALETA.paper;
      o.fill();
      o.save();
      path(poly(0.035, 0.008));
      o.clip();
      o.drawImage(tmp, 0, 0);
      o.restore();
      return out.toDataURL("image/png");
    })();
    bakeCache.set(key, p);
  }
  return p;
}

/* ------------------------------ Dibujo en canvas ------------------------------ */
const getT = (e: Elemento) => e.datos as unknown as TextoDatos;
const getI = (e: Elemento) => e.datos as unknown as ImagenDatos;
const getS = (e: Elemento) => e.datos as unknown as StickerDatos;

export async function drawPanel(c: CanvasRenderingContext2D, panel: Panel, ppm: number) {
  const W = PANEL_W * ppm;
  const H = PANEL_H * ppm;
  c.save();
  c.beginPath();
  c.rect(0, 0, W, H);
  c.clip();
  const f = panel.fondo;
  if (f.tipo === "color") {
    c.fillStyle = f.valor;
    c.fillRect(0, 0, W, H);
  } else if (f.tipo === "papel") {
    try {
      c.drawImage(await cargarImg(papelSrc(f.valor)), 0, 0, W, H);
    } catch {
      c.fillStyle = PALETA.paper;
      c.fillRect(0, 0, W, H);
    }
  } else {
    c.fillStyle = PALETA.paper;
    c.fillRect(0, 0, W, H);
    try {
      const im = await cargarImg(f.valor);
      const s = Math.max(W / im.naturalWidth, H / im.naturalHeight);
      const dw = im.naturalWidth * s;
      const dh = im.naturalHeight * s;
      c.drawImage(im, (W - dw) / 2, (H - dh) / 2, dw, dh);
    } catch {
      /* sin imagen */
    }
  }
  const els = [...panel.elementos].sort((a, b) => a.z - b.z);
  for (const e of els) {
    c.save();
    c.translate((e.x + e.ancho / 2) * ppm, (e.y + e.alto / 2) * ppm);
    c.rotate((e.rotacion * Math.PI) / 180);
    c.translate((-e.ancho / 2) * ppm, (-e.alto / 2) * ppm);
    c.globalAlpha = (e.datos.opacidad as number | undefined) ?? 1;
    try {
      if (e.tipo === "texto") {
        const d = getT(e);
        const L = layoutTexto(d, e.ancho);
        const bw = e.ancho * ppm;
        const bh = L.alto * ppm;
        if (d.fondo === "etiqueta") {
          c.fillStyle = PALETA.ink;
          c.fillRect(0.6 * ppm, 0.6 * ppm, bw, bh);
          c.fillStyle = "#fff";
          c.fillRect(0, 0, bw, bh);
        } else if (d.fondo === "papel") {
          c.fillStyle = PALETA.paper;
          c.fillRect(0, 0, bw, bh);
        }
        c.font = fontShorthand(d.fuente, d.tam * ppm);
        c.fillStyle = d.fondo === "etiqueta" && d.color.toLowerCase() === PALETA.paper.toLowerCase() ? PALETA.ink : d.color;
        c.textBaseline = "middle";
        c.textAlign = d.alin;
        const tx = d.alin === "left" ? L.pad : d.alin === "center" ? e.ancho / 2 : e.ancho - L.pad;
        L.lines.forEach((ln, i) => c.fillText(ln, tx * ppm, (L.pad + (i + 0.5) * L.lineH) * ppm));
      } else if (e.tipo === "sticker") {
        const im = await cargarImg(stickerSrc(getS(e).id));
        c.drawImage(im, 0, 0, e.ancho * ppm, e.alto * ppm);
      } else {
        const d = getI(e);
        const src = await bakeImagen(d.src, d.filtro, d.rasgado);
        const im = await cargarImg(src);
        c.drawImage(im, 0, 0, e.ancho * ppm, e.alto * ppm);
      }
    } catch {
      /* elemento omitido */
    }
    c.restore();
  }
  c.restore();
}

export async function renderPanelCanvas(panel: Panel, ppm: number) {
  await ensureFonts();
  const cv = document.createElement("canvas");
  cv.width = Math.round(PANEL_W * ppm);
  cv.height = Math.round(PANEL_H * ppm);
  await drawPanel(cv.getContext("2d")!, panel, ppm);
  return cv;
}

export type OpcionesPliego = { dpi: number; guias: boolean; margen: boolean };

export async function renderSheet(f: Fanzine, o: OpcionesPliego) {
  await ensureFonts();
  const ppm = o.dpi / 25.4;
  const cv = document.createElement("canvas");
  cv.width = Math.round(SHEET_W * ppm);
  cv.height = Math.round(SHEET_H * ppm);
  const c = cv.getContext("2d")!;
  c.fillStyle = "#fff";
  c.fillRect(0, 0, cv.width, cv.height);
  for (const cell of IMPOSICION) {
    const panel = f.paneles.find((p) => p.clave === cell.clave);
    if (!panel) continue;
    c.save();
    c.translate(cell.col * PANEL_W * ppm, cell.fila * PANEL_H * ppm);
    if (cell.girada) {
      c.translate(PANEL_W * ppm, PANEL_H * ppm);
      c.rotate(Math.PI);
    }
    await drawPanel(c, panel, ppm);
    if (o.margen && o.guias) {
      c.strokeStyle = "rgba(229,52,140,.55)";
      c.lineWidth = 0.15 * ppm;
      c.setLineDash([0.8 * ppm, 0.8 * ppm]);
      c.strokeRect(5 * ppm, 5 * ppm, (PANEL_W - 10) * ppm, (PANEL_H - 10) * ppm);
    }
    c.restore();
  }
  if (o.guias) {
    c.strokeStyle = "rgba(17,17,17,.7)";
    c.lineWidth = Math.max(1, 0.15 * ppm);
    c.setLineDash([2 * ppm, 1.5 * ppm]);
    // dobleces verticales
    for (let i = 1; i < 4; i++) {
      c.beginPath();
      c.moveTo(i * PANEL_W * ppm, 0);
      c.lineTo(i * PANEL_W * ppm, SHEET_H * ppm);
      c.stroke();
    }
    // doblez horizontal en las columnas externas
    c.beginPath();
    c.moveTo(0, PANEL_H * ppm);
    c.lineTo(PANEL_W * ppm, PANEL_H * ppm);
    c.moveTo(3 * PANEL_W * ppm, PANEL_H * ppm);
    c.lineTo(4 * PANEL_W * ppm, PANEL_H * ppm);
    c.stroke();
    // corte central (línea continua)
    c.setLineDash([]);
    c.strokeStyle = PALETA.pink500;
    c.lineWidth = Math.max(1.5, 0.25 * ppm);
    c.beginPath();
    c.moveTo(PANEL_W * ppm, PANEL_H * ppm);
    c.lineTo(3 * PANEL_W * ppm, PANEL_H * ppm);
    c.stroke();
  }
  return cv;
}

/** Imágenes por debajo de 150 dpi al imprimir. */
export async function avisosDpi(f: Fanzine) {
  const out: { panel: string; dpi: number }[] = [];
  for (const p of f.paneles)
    for (const e of p.elementos) {
      if (e.tipo !== "imagen") continue;
      try {
        const im = await cargarImg(getI(e).src);
        const dpi = Math.round(im.naturalWidth / (e.ancho / 25.4));
        if (dpi < 150) out.push({ panel: p.clave, dpi });
      } catch {
        /* ignora */
      }
    }
  return out;
}

export function descargar(url: string, nombre: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
