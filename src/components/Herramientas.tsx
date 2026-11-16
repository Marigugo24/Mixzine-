"use client";
import Link from "next/link";
import { useRef } from "react";
import { useEditor, toast, usePremium } from "@/lib/store";
import type { Elemento, ImagenDatos, TextoDatos } from "@/lib/types";
import { PANEL_H, PANEL_W } from "@/lib/types";
import { COLORES_FONDO, COLORES_TEXTO, PAPELES, STICKERS, STICKER_MAP, svgUri, stickerSrc } from "@/lib/assets";
import { FUENTES, layoutTexto } from "@/lib/text";
import { Button, Chip, Icon, IconButton } from "./ui";

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

function reducirImagen(file: File, max = 1000): Promise<{ src: string; aspecto: number }> {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      const k = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight));
      const w = Math.round(im.naturalWidth * k);
      const h = Math.round(im.naturalHeight * k);
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      c.getContext("2d")!.drawImage(im, 0, 0, w, h);
      URL.revokeObjectURL(url);
      res({ src: c.toDataURL("image/jpeg", 0.8), aspecto: w / h });
    };
    im.onerror = () => {
      URL.revokeObjectURL(url);
      rej(new Error("No se pudo leer la foto"));
    };
    im.src = url;
  });
}

export function useSel() {
  const { draft, panel, sel } = useEditor();
  const el = draft?.paneles[panel].elementos.find((e) => e.id === sel);
  return el;
}

/* ------------------------- Barra de acciones del elemento ------------------------- */
export function AccionesElemento() {
  const { sel, duplicar, remove, capa, patch, snap } = useEditor();
  const el = useSel();
  if (!sel || !el) return <p className="text-sm text-ink/70">Toca un elemento del panel para moverlo, girarlo o cambiarle el tamaño.</p>;
  const op = (el.datos.opacidad as number | undefined) ?? 1;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1">
        <IconButton label="Duplicar" n="copy" onClick={() => duplicar(el.id)} />
        <IconButton label="Subir de capa" n="up" onClick={() => capa(el.id, 1)} />
        <IconButton label="Bajar de capa" n="down" onClick={() => capa(el.id, -1)} />
        <IconButton label="Borrar" n="trash" onClick={() => remove(el.id)} />
      </div>
      <label className="block text-sm font-semibold">
        Opacidad {Math.round(op * 100)}%
        <input type="range" min={0.1} max={1} step={0.05} value={op} onPointerDown={snap} onChange={(e) => patch(el.id, { datos: { opacidad: Number(e.target.value) } })} className="mt-1 block w-full accent-pink-500" />
      </label>
      <label className="block text-sm font-semibold">
        Rotación {Math.round(el.rotacion)}°
        <input type="range" min={-180} max={180} step={1} value={el.rotacion} onPointerDown={snap} onChange={(e) => patch(el.id, { rotacion: Number(e.target.value) })} className="mt-1 block w-full accent-pink-500" />
      </label>
    </div>
  );
}

/* --------------------------------- Texto --------------------------------- */
export function ToolTexto() {
  const { add, patch, snap } = useEditor();
  const el = useSel();
  const d = el?.tipo === "texto" ? (el.datos as unknown as TextoDatos) : null;
  const nuevo = () => {
    const datos: TextoDatos = { texto: "Escribe aquí", fuente: "marker", tam: 5, color: "#111111", alin: "left", fondo: "etiqueta", opacidad: 1 };
    const L = layoutTexto(datos, 50);
    add({ tipo: "texto", x: 12, y: rnd(30, 60), ancho: 50, alto: L.alto, rotacion: rnd(-3, 3), datos: datos as unknown as Record<string, unknown> });
  };
  const set = (p: Partial<TextoDatos>, solo = false) => {
    if (!el || !d) return;
    if (!solo) snap();
    const nd = { ...d, ...p };
    patch(el.id, { alto: layoutTexto(nd, el.ancho).alto, datos: p as Record<string, unknown> });
  };
  return (
    <div className="space-y-4">
      <Button onClick={nuevo} block>
        <Icon n="plus" size={18} /> Agregar texto
      </Button>
      {d && el && (
        <>
          <label className="block text-sm font-semibold">
            Texto
            <textarea
              value={d.texto}
              onFocus={snap}
              onChange={(e) => set({ texto: e.target.value }, true)}
              rows={3}
              className="mt-1 w-full rounded-xl border-2 border-ink bg-white p-3 text-[15px]"
            />
          </label>
          <fieldset>
            <legend className="mb-1 text-sm font-semibold">Fuente</legend>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(FUENTES) as TextoDatos["fuente"][]).map((k) => (
                <Chip key={k} activo={d.fuente === k} onClick={() => set({ fuente: k })}>
                  <span style={{ fontFamily: FUENTES[k].css }}>{FUENTES[k].nombre}</span>
                </Chip>
              ))}
            </div>
          </fieldset>
          <label className="block text-sm font-semibold">
            Tamaño {d.tam.toFixed(1)} mm
            <input type="range" min={2.5} max={14} step={0.1} value={d.tam} onPointerDown={snap} onChange={(e) => set({ tam: Number(e.target.value) }, true)} className="mt-1 block w-full accent-pink-500" />
          </label>
          <fieldset>
            <legend className="mb-1 text-sm font-semibold">Color</legend>
            <div className="flex flex-wrap gap-2">
              {COLORES_TEXTO.map((c) => (
                <button key={c} type="button" aria-label={`Color ${c}`} aria-pressed={d.color.toLowerCase() === c.toLowerCase()} onClick={() => set({ color: c })} style={{ background: c }} className={`h-11 w-11 rounded-full border-2 ${d.color.toLowerCase() === c.toLowerCase() ? "border-ink ring-2 ring-offset-2 ring-ink" : "border-ink/40"}`} />
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-1 text-sm font-semibold">Soporte (el texto importante va sobre papel o etiqueta)</legend>
            <div className="flex flex-wrap gap-2">
              {(["etiqueta", "papel", "ninguno"] as const).map((k) => (
                <Chip key={k} activo={d.fondo === k} onClick={() => set({ fondo: k })}>
                  {k === "etiqueta" ? "Etiqueta" : k === "papel" ? "Papel" : "Sin soporte"}
                </Chip>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-1 text-sm font-semibold">Alineación</legend>
            <div className="flex gap-2">
              {(["left", "center", "right"] as const).map((k) => (
                <Chip key={k} activo={d.alin === k} onClick={() => set({ alin: k })}>
                  {k === "left" ? "Izquierda" : k === "center" ? "Centro" : "Derecha"}
                </Chip>
              ))}
            </div>
          </fieldset>
        </>
      )}
    </div>
  );
}

/* -------------------------------- Stickers -------------------------------- */
export function ToolStickers({ sugeridos = [] as string[] }: { sugeridos?: string[] }) {
  const { add } = useEditor();
  const premium = usePremium();
  const poner = (id: string) => {
    const def = STICKER_MAP[id];
    if (def.premium && !premium) {
      toast("Este paquete es Premium");
      return;
    }
    const ancho = def.aspecto > 2 ? 34 : 24;
    add({ tipo: "sticker", x: rnd(10, PANEL_W - ancho - 10), y: rnd(14, PANEL_H - 40), ancho, alto: ancho / def.aspecto, rotacion: rnd(-12, 12), datos: { id, opacidad: 1 } });
    navigator.vibrate?.(8);
  };
  const orden = [...STICKERS].sort((a, b) => Number(sugeridos.includes(b.id)) - Number(sugeridos.includes(a.id)));
  return (
    <div>
      <ul className="grid grid-cols-4 gap-2 sm:grid-cols-5">
        {orden.map((s) => {
          const bloqueado = s.premium && !premium;
          return (
            <li key={s.id}>
              <button type="button" onClick={() => poner(s.id)} aria-label={`${s.nombre}${bloqueado ? " (Premium)" : ""}`} className="relative flex aspect-square w-full items-center justify-center rounded-xl border-2 border-ink bg-white p-2 transition active:scale-[0.97] hover:bg-pink-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.src ?? svgUri(s.svg!)} alt="" className={`max-h-full max-w-full ${bloqueado ? "opacity-40" : ""}`} />
                {bloqueado && <Icon n="lock" size={16} className="absolute right-1 top-1 rounded-full bg-ink p-0.5 text-paper" />}
                {sugeridos.includes(s.id) && <span className="absolute -left-1 -top-1 rounded-full bg-pink-500 px-1.5 text-[10px] font-bold text-white">tu emoción</span>}
              </button>
            </li>
          );
        })}
      </ul>
      {!premium && (
        <p className="mt-3 text-sm text-ink/75">
          Los stickers con candado hacen parte del paquete Premium. <Link href="/planes" className="font-semibold underline">Ver planes</Link>
        </p>
      )}
    </div>
  );
}

/* --------------------------------- Fotos --------------------------------- */
export function ToolFotos() {
  const { add, patch, snap } = useEditor();
  const el = useSel();
  const inp = useRef<HTMLInputElement>(null);
  const d = el?.tipo === "imagen" ? (el.datos as unknown as ImagenDatos) : null;
  const subir = async (f?: File) => {
    if (!f) return;
    try {
      const { src, aspecto } = await reducirImagen(f);
      const ancho = 46;
      const datos: ImagenDatos = { src, filtro: "none", rasgado: false, aspecto, opacidad: 1 };
      add({ tipo: "imagen", x: 14, y: 22, ancho, alto: ancho / aspecto, rotacion: rnd(-4, 4), datos: datos as unknown as Record<string, unknown> });
    } catch {
      toast("No pudimos abrir esa foto");
    }
  };
  const set = (p: Partial<ImagenDatos>) => {
    if (!el) return;
    snap();
    patch(el.id, { datos: p as Record<string, unknown> });
  };
  return (
    <div className="space-y-4">
      <input ref={inp} type="file" accept="image/*" className="sr-only" aria-label="Elegir foto de la galería" onChange={(e) => { void subir(e.target.files?.[0]); e.target.value = ""; }} />
      <Button onClick={() => inp.current?.click()} block>
        <Icon n="image" size={18} /> Subir foto de mi galería
      </Button>
      {d ? (
        <>
          <fieldset>
            <legend className="mb-1 text-sm font-semibold">Filtro</legend>
            <div className="flex flex-wrap gap-2">
              {(["none", "grano", "duotono"] as const).map((k) => (
                <Chip key={k} activo={d.filtro === k} onClick={() => set({ filtro: k })}>
                  {k === "none" ? "Original" : k === "grano" ? "Grano" : "Duotono"}
                </Chip>
              ))}
            </div>
          </fieldset>
          <Chip activo={d.rasgado} onClick={() => set({ rasgado: !d.rasgado })}>
            Borde rasgado
          </Chip>
        </>
      ) : (
        <p className="text-sm text-ink/70">Selecciona una foto del panel para aplicarle grano, duotono o borde rasgado.</p>
      )}
    </div>
  );
}

/* -------------------------------- Colores -------------------------------- */
export function ToolColores() {
  const { draft, panel, setFondo } = useEditor();
  const inp = useRef<HTMLInputElement>(null);
  const f = draft?.paneles[panel].fondo;
  const fotoFondo = async (file?: File) => {
    if (!file) return;
    try {
      const { src } = await reducirImagen(file, 900);
      setFondo({ tipo: "imagen", valor: src });
    } catch {
      toast("No pudimos abrir esa foto");
    }
  };
  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="mb-1 text-sm font-semibold">Color liso</legend>
        <div className="flex flex-wrap gap-2">
          {COLORES_FONDO.map((c) => (
            <button key={c} type="button" aria-label={`Fondo ${c}`} aria-pressed={f?.tipo === "color" && f.valor === c} onClick={() => setFondo({ tipo: "color", valor: c })} style={{ background: c }} className={`h-11 w-11 rounded-full border-2 ${f?.tipo === "color" && f.valor === c ? "border-ink ring-2 ring-offset-2 ring-ink" : "border-ink/40"}`} />
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-1 text-sm font-semibold">Papeles y texturas</legend>
        <ul className="grid grid-cols-3 gap-2">
          {PAPELES.map((p) => (
            <li key={p.id}>
              <button type="button" aria-pressed={f?.tipo === "papel" && f.valor === p.id} onClick={() => setFondo({ tipo: "papel", valor: p.id })} className={`block w-full overflow-hidden rounded-lg border-2 ${f?.tipo === "papel" && f.valor === p.id ? "border-ink ring-2 ring-ink ring-offset-2" : "border-ink/50"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={svgUri(p.svg)} alt="" className="aspect-[74/105] w-full object-cover" loading="lazy" />
                <span className="block bg-white py-1 text-xs font-semibold">{p.nombre}</span>
              </button>
            </li>
          ))}
        </ul>
      </fieldset>
      <input ref={inp} type="file" accept="image/*" className="sr-only" aria-label="Foto como fondo" onChange={(e) => { void fotoFondo(e.target.files?.[0]); e.target.value = ""; }} />
      <Button variant="soft" block onClick={() => inp.current?.click()}>
        <Icon n="image" size={18} /> Usar una foto de fondo
      </Button>
    </div>
  );
}

export type { Elemento };
export { stickerSrc };
