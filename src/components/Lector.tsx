"use client";
import { useRef, useState } from "react";
import type { Fanzine } from "@/lib/types";
import { PANEL_NOMBRES } from "@/lib/types";
import { PanelView } from "./PanelView";
import { IconButton } from "./ui";

/** Modo lectura: un panel a la vez, con flechas, miniaturas y deslizar. */
export function Lector({ f, className = "" }: { f: Fanzine; className?: string }) {
  const [i, setI] = useState(0);
  const x0 = useRef<number | null>(null);
  const ir = (d: number) => setI((v) => Math.min(7, Math.max(0, v + d)));
  const p = f.paneles[i];
  return (
    <section aria-label={`Fanzine de @${f.autorNombre} sobre ${f.cancion.titulo}`} className={className}>
      <div
        className="mx-auto w-full max-w-[320px] touch-pan-y"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "ArrowRight" ? ir(1) : e.key === "ArrowLeft" ? ir(-1) : null)}
        onTouchStart={(e) => (x0.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (x0.current === null) return;
          const dx = e.changedTouches[0].clientX - x0.current;
          if (Math.abs(dx) > 40) ir(dx < 0 ? 1 : -1);
          x0.current = null;
        }}
      >
        <div className="border-2 border-ink shadow-paper">
          <PanelView panel={p} />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-center gap-2">
        <IconButton className="!bg-white !text-ink border-2 border-ink" label="Panel anterior" n="back" onClick={() => ir(-1)} disabled={i === 0} />
        <p className="min-w-[120px] rounded-full border-2 border-ink bg-white px-3 py-1 text-center text-sm font-bold text-ink shadow-[2px_2px_0_#111]" aria-live="polite">
          {PANEL_NOMBRES[p.clave]} · {i + 1}/8
        </p>
        <IconButton label="Panel siguiente" n="back" className="rotate-180 !bg-white !text-ink border-2 border-ink" onClick={() => ir(1)} disabled={i === 7} />
      </div>
      <ul className="mt-3 flex justify-center gap-1.5" aria-label="Paneles">
        {f.paneles.map((q, k) => (
          <li key={q.clave}>
            <button type="button" onClick={() => setI(k)} aria-label={PANEL_NOMBRES[q.clave]} aria-current={k === i} className={`block w-9 overflow-hidden border-2 ${k === i ? "border-pink-500" : "border-ink/40"}`}>
              <PanelView panel={q} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
