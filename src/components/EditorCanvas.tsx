"use client";
import { useCallback, useRef } from "react";
import type { PointerEvent as RPE } from "react";
import { useEditor, useFontsListas } from "@/lib/store";
import { PANEL_H, PANEL_W } from "@/lib/types";
import { PanelView, altoElemento } from "./PanelView";
import { toast } from "@/lib/store";

type Gesto =
  | { t: "mover"; id: string; sx: number; sy: number; ox: number; oy: number; mmpx: number }
  | { t: "escala"; id: string; d0: number; ancho0: number; alto0: number; tam0?: number; cx: number; cy: number }
  | { t: "rotar"; id: string; cx: number; cy: number };

export function EditorCanvas({ className = "", onZoom }: { className?: string; onZoom?: (d: number) => void }) {
  const { draft, panel, sel, select, patch, snap, remove, duplicar, undo, redo } = useEditor();
  const caja = useRef<HTMLDivElement>(null);
  const gesto = useRef<Gesto | null>(null);
  const tick = useFontsListas();
  const p = draft?.paneles[panel];
  const el = p?.elementos.find((e) => e.id === sel);

  const mmPorPx = () => {
    const r = caja.current!.getBoundingClientRect();
    return PANEL_W / r.width;
  };
  const centroPx = (e: NonNullable<typeof el>) => {
    const r = caja.current!.getBoundingClientRect();
    const k = r.width / PANEL_W;
    return { cx: r.left + (e.x + e.ancho / 2) * k, cy: r.top + (e.y + altoElemento(e, tick) / 2) * k };
  };

  const down = (ev: RPE<HTMLDivElement>) => {
    const t = (ev.target as HTMLElement).closest("[data-el-id]") as HTMLElement | null;
    if ((ev.target as HTMLElement).closest("[data-handle]")) return;
    if (!t) {
      select(null);
      return;
    }
    const id = t.dataset.elId!;
    const e = p!.elementos.find((x) => x.id === id)!;
    select(id);
    snap();
    gesto.current = { t: "mover", id, sx: ev.clientX, sy: ev.clientY, ox: e.x, oy: e.y, mmpx: mmPorPx() };
    caja.current?.setPointerCapture(ev.pointerId);
  };

  const downHandle = (tipo: "escala" | "rotar") => (ev: RPE<HTMLButtonElement>) => {
    if (!el) return;
    ev.stopPropagation();
    snap();
    const { cx, cy } = centroPx(el);
    if (tipo === "escala") {
      const d0 = Math.hypot(ev.clientX - cx, ev.clientY - cy) || 1;
      gesto.current = { t: "escala", id: el.id, d0, ancho0: el.ancho, alto0: el.alto, tam0: el.tipo === "texto" ? (el.datos.tam as number) : undefined, cx, cy };
    } else gesto.current = { t: "rotar", id: el.id, cx, cy };
    caja.current?.setPointerCapture(ev.pointerId);
  };

  const move = (ev: RPE<HTMLDivElement>) => {
    const g = gesto.current;
    if (!g) return;
    if (g.t === "mover") {
      patch(g.id, { x: round(g.ox + (ev.clientX - g.sx) * g.mmpx), y: round(g.oy + (ev.clientY - g.sy) * g.mmpx) });
    } else if (g.t === "escala") {
      const k = Math.min(6, Math.max(0.15, Math.hypot(ev.clientX - g.cx, ev.clientY - g.cy) / g.d0));
      const a = Math.max(6, round(g.ancho0 * k));
      const real = a / g.ancho0;
      if (g.tam0 !== undefined) patch(g.id, { ancho: a, datos: { tam: Math.max(2, round(g.tam0 * real)) } });
      else patch(g.id, { ancho: a, alto: round(g.alto0 * real) });
    } else {
      let deg = (Math.atan2(ev.clientY - g.cy, ev.clientX - g.cx) * 180) / Math.PI + 90;
      if (ev.shiftKey) deg = Math.round(deg / 15) * 15;
      if (deg > 180) deg -= 360;
      patch(g.id, { rotacion: Math.round(deg * 10) / 10 });
    }
  };
  const up = (ev: RPE<HTMLDivElement>) => {
    if (gesto.current) {
      const g = gesto.current;
      gesto.current = null;
      try {
        caja.current?.releasePointerCapture(ev.pointerId);
      } catch {
        /* ya liberado */
      }
      if (g.t === "mover") navigator.vibrate?.(8);
    }
  };

  const tecla = useCallback(
    (ev: React.KeyboardEvent) => {
      const mod = ev.ctrlKey || ev.metaKey;
      const tag = (ev.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (mod && ev.key.toLowerCase() === "z") {
        ev.preventDefault();
        ev.shiftKey ? redo() : undo();
      } else if (mod && ev.key.toLowerCase() === "y") {
        ev.preventDefault();
        redo();
      } else if (ev.key === "Z" && ev.shiftKey && !mod) {
        ev.preventDefault();
        redo();
      } else if (mod && ev.key.toLowerCase() === "d" && sel) {
        ev.preventDefault();
        duplicar(sel);
      } else if ((ev.key === "Delete" || ev.key === "Backspace") && sel) {
        ev.preventDefault();
        remove(sel);
      } else if (ev.key === "+" || ev.key === "=") onZoom?.(0.1);
      else if (ev.key === "-") onZoom?.(-0.1);
      else if (ev.key === "Escape") select(null);
      else if (el && ev.key.startsWith("Arrow")) {
        ev.preventDefault();
        const s = ev.shiftKey ? 5 : 1;
        snap();
        patch(el.id, {
          x: el.x + (ev.key === "ArrowRight" ? s : ev.key === "ArrowLeft" ? -s : 0),
          y: el.y + (ev.key === "ArrowDown" ? s : ev.key === "ArrowUp" ? -s : 0),
        });
      } else if (ev.key === "Enter" && (ev.target as HTMLElement).dataset.elId) select((ev.target as HTMLElement).dataset.elId!);
    },
    [sel, el, undo, redo, remove, duplicar, patch, snap, select, onZoom]
  );

  if (!p) return null;
  const alto = el ? altoElemento(el, tick) : 0;
  const dentro = (v: number, a: number, max: number) => v >= 0 && v + a <= max;
  void toast;

  return (
    <div
      ref={caja}
      className={`relative touch-none select-none outline-none focus-visible:ring-4 focus-visible:ring-blue-600 ${className}`}
      tabIndex={0}
      role="application"
      aria-label={`Lienzo del panel. Usa las flechas para mover el elemento seleccionado, Supr para borrar.`}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onKeyDown={tecla}
      onFocusCapture={(ev) => {
        const id = (ev.target as HTMLElement).dataset?.elId;
        if (id && id !== sel) select(id);
      }}
      style={{ width: "100%" }}
    >
      <div className="border-2 border-ink shadow-paper">
        <PanelView panel={p} editable />
      </div>
      {/* guía de margen seguro 5 mm */}
      <div aria-hidden className="pointer-events-none absolute border border-dashed border-pink-500/60" style={{ left: `${(5 / PANEL_W) * 100}%`, right: `${(5 / PANEL_W) * 100}%`, top: `${(5 / PANEL_H) * 100}%`, bottom: `${(5 / PANEL_H) * 100}%` }} />
      {el && (
        <div
          aria-hidden
          className="pointer-events-none absolute"
          style={{ left: `${(el.x / PANEL_W) * 100}%`, top: `${(el.y / PANEL_H) * 100}%`, width: `${(el.ancho / PANEL_W) * 100}%`, height: `${(alto / PANEL_H) * 100}%`, transform: `rotate(${el.rotacion}deg)` }}
        >
          <div className={`absolute inset-[-3px] border-2 border-dashed ${dentro(el.x, el.ancho, PANEL_W) && dentro(el.y, alto, PANEL_H) ? "border-blue-600" : "border-pink-500"}`} />
          <button type="button" data-handle tabIndex={-1} aria-label="Rotar" onPointerDown={downHandle("rotar")} className="pointer-events-auto absolute -top-9 left-1/2 flex h-11 w-11 -translate-x-1/2 cursor-grab items-center justify-center">
            <span className="h-5 w-5 rounded-full border-2 border-ink bg-yellow-400" />
          </button>
          <span className="absolute -top-4 left-1/2 h-4 w-px -translate-x-1/2 bg-blue-600" />
          <button type="button" data-handle tabIndex={-1} aria-label="Cambiar tamaño" onPointerDown={downHandle("escala")} className="pointer-events-auto absolute -bottom-5 -right-5 flex h-11 w-11 cursor-nwse-resize items-center justify-center">
            <span className="h-5 w-5 rounded-sm border-2 border-ink bg-pink-500" />
          </button>
        </div>
      )}
    </div>
  );
}
const round = (n: number) => Math.round(n * 100) / 100;
