"use client";
import { memo, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { Elemento, ImagenDatos, Panel, StickerDatos, TextoDatos } from "@/lib/types";
import { PANEL_H, PANEL_W } from "@/lib/types";
import { PALETA, papelSrc, stickerSrc } from "@/lib/assets";
import { FUENTES, layoutTexto } from "@/lib/text";
import { bakeImagen } from "@/lib/render";
import { useFontsListas } from "@/lib/store";

const nuevos = new Set<string>();
export const marcarNuevo = (id: string) => nuevos.add(id);

const pw = (mm: number) => `${(mm / PANEL_W) * 100}%`;
const ph = (mm: number) => `${(mm / PANEL_H) * 100}%`;
const cq = (mm: number) => `${(mm / PANEL_W) * 100}cqw`;

function useBaked(d: ImagenDatos) {
  const [src, setSrc] = useState(d.filtro === "none" && !d.rasgado ? d.src : "");
  useEffect(() => {
    let vivo = true;
    if (d.filtro === "none" && !d.rasgado) {
      setSrc(d.src);
      return;
    }
    bakeImagen(d.src, d.filtro, d.rasgado)
      .then((s) => vivo && setSrc(s))
      .catch(() => vivo && setSrc(d.src));
    return () => {
      vivo = false;
    };
  }, [d.src, d.filtro, d.rasgado]);
  return src;
}

function Img({ d }: { d: ImagenDatos }) {
  const src = useBaked(d);
  // eslint-disable-next-line @next/next/no-img-element
  return src ? <img src={src} alt="" draggable={false} className="h-full w-full select-none" style={{ objectFit: "fill" }} /> : null;
}

export function altoElemento(e: Elemento, fontsTick = 0): number {
  void fontsTick;
  if (e.tipo === "texto") return layoutTexto(e.datos as unknown as TextoDatos, e.ancho, fontsTick === 0).alto;
  return e.alto;
}

function ElementoView({ e, editable, fontsTick }: { e: Elemento; editable: boolean; fontsTick: number }) {
  const alto = altoElemento(e, fontsTick);
  const style: CSSProperties = {
    position: "absolute",
    left: pw(e.x),
    top: ph(e.y),
    width: pw(e.ancho),
    height: ph(alto),
    transform: `rotate(${e.rotacion}deg)`,
    transformOrigin: "50% 50%",
    zIndex: e.z,
    opacity: (e.datos.opacidad as number | undefined) ?? 1,
    pointerEvents: editable ? "auto" : "none",
    touchAction: editable ? "none" : undefined,
  };
  const pegar = editable && nuevos.has(e.id);
  if (pegar) {
    nuevos.delete(e.id);
    style.animation = "pegado 200ms ease-out";
  }
  const etiqueta = e.tipo === "texto" ? `Texto: ${String((e.datos as { texto?: string }).texto ?? "").slice(0, 40)}` : e.tipo === "sticker" ? "Sticker" : "Foto";
  const common = editable ? { "data-el-id": e.id, tabIndex: 0, role: "button", "aria-label": etiqueta } : { "aria-hidden": true as const };
  if (e.tipo === "texto") {
    const d = e.datos as unknown as TextoDatos;
    const L = layoutTexto(d, e.ancho, fontsTick === 0);
    const f = FUENTES[d.fuente] ?? FUENTES.ui;
    const color = d.fondo === "etiqueta" && d.color.toLowerCase() === PALETA.paper.toLowerCase() ? PALETA.ink : d.color;
    return (
      <div {...common} style={style}>
        <div
          style={{
            width: "100%",
            height: "100%",
            padding: cq(L.pad),
            boxSizing: "border-box",
            background: d.fondo === "etiqueta" ? "#fff" : d.fondo === "papel" ? PALETA.paper : "transparent",
            boxShadow: d.fondo === "etiqueta" ? `${cq(0.6)} ${cq(0.6)} 0 #111` : undefined,
            fontFamily: `${f.css}, system-ui, sans-serif`,
            fontWeight: f.peso,
            fontSize: cq(d.tam),
            lineHeight: cq(L.lineH),
            color,
            textAlign: d.alin,
            whiteSpace: "pre",
            overflow: "visible",
          }}
        >
          {L.lines.map((ln, i) => (
            <div key={i} style={{ height: cq(L.lineH) }}>
              {ln || " "}
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (e.tipo === "sticker") {
    const d = e.datos as unknown as StickerDatos;
    return (
      <div {...common} style={style}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={stickerSrc(d.id)} alt="" draggable={false} className="h-full w-full select-none" />
      </div>
    );
  }
  return (
    <div {...common} style={style}>
      <Img d={e.datos as unknown as ImagenDatos} />
    </div>
  );
}

type Props = {
  panel: Panel;
  editable?: boolean;
  className?: string;
};

function PanelViewBase({ panel, editable = false, className = "" }: Props) {
  const tick = useFontsListas();
  const f = panel.fondo;
  const fondoStyle: CSSProperties =
    f.tipo === "color" ? { background: f.valor } : f.tipo === "imagen" ? { background: `${PALETA.paper} url(${f.valor}) center/cover` } : {};
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ containerType: "inline-size", aspectRatio: `${PANEL_W} / ${PANEL_H}`, width: "100%", ...fondoStyle }}
      data-panel
    >
      {f.tipo === "papel" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={papelSrc(f.valor)} alt="" aria-hidden draggable={false} className="absolute inset-0 h-full w-full select-none" />
      )}
      {panel.elementos.map((e) => (
        <ElementoView key={e.id} e={e} editable={editable} fontsTick={tick} />
      ))}
    </div>
  );
}
export const PanelView = memo(PanelViewBase);
