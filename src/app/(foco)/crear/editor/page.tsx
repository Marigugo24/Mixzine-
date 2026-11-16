"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Cinta, Decoracion } from "@/components/deco";
import { useApp, useEditor, useListo, toast } from "@/lib/store";
import { PANEL_NOMBRES } from "@/lib/types";
import { EMOCIONES } from "@/lib/emotions";
import { EditorCanvas } from "@/components/EditorCanvas";
import { PanelView } from "@/components/PanelView";
import { AccionesElemento, ToolColores, ToolFotos, ToolStickers, ToolTexto } from "@/components/Herramientas";
import { BottomSheet, Button, Icon, IconButton, TopBar } from "@/components/ui";

type Tool = "texto" | "stickers" | "fotos" | "colores" | null;

export default function EditorMovil() {
  const router = useRouter();
  const listo = useListo();
  const { draft, panel, setPanel, undo, redo, past, future, sel, select } = useEditor();
  const guardar = useApp((s) => s.guardarFanzine);
  const setDraft = useEditor((s) => s.setDraft);
  const [tool, setTool] = useState<Tool>(null);
  const [zoom, setZoom] = useState(1);
  const saliendo = useRef(false);

  useEffect(() => {
    if (listo && !draft && !saliendo.current) router.replace("/crear");
  }, [listo, draft, router]);
  // al seleccionar un elemento no se cierra la hoja; al cerrarla se conserva la selección
  if (!draft) return <div className="grid min-h-dvh place-items-center" aria-busy>Cargando…</div>;

  const finalizar = () => {
    guardar({ ...draft, borrador: false });
    toast("Guardado");
    const id = draft.id;
    saliendo.current = true;
    router.push(`/compartir?id=${id}`);
    setTimeout(() => setDraft(null), 400);
  };
  const borrador = () => {
    guardar({ ...draft, borrador: true });
    toast("Borrador guardado");
    saliendo.current = true;
    router.push("/perfil");
  };
  const E = EMOCIONES[draft.emocion];
  const herramientas: { id: Exclude<Tool, null>; n: string; t: string }[] = [
    { id: "texto", n: "text", t: "Texto" },
    { id: "stickers", n: "sticker", t: "Stickers" },
    { id: "fotos", n: "image", t: "Fotos" },
    { id: "colores", n: "palette", t: "Colores" },
  ];

  return (
    <div className="flex min-h-dvh flex-col fondo-mix text-ink">
      <TopBar
        titulo={<span className="block truncate">{PANEL_NOMBRES[draft.paneles[panel].clave]}</span>}
        atras
        onAtras={() => router.push("/crear")}
        accion={
          <>
            <IconButton label="Deshacer" n="undo" onClick={undo} disabled={!past.length} />
            <IconButton label="Rehacer" n="redo" onClick={redo} disabled={!future.length} />
            <Button className="min-h-[40px] px-4 text-sm" onClick={finalizar}>Guardar</Button>
          </>
        }
      />
      <ul className="flex gap-2 overflow-x-auto border-b-2 border-ink bg-white/80 px-3 py-2" aria-label="Paneles del fanzine">
        {draft.paneles.map((p, i) => (
          <li key={p.clave} className="shrink-0">
            <button type="button" onClick={() => setPanel(i)} aria-label={PANEL_NOMBRES[p.clave]} aria-current={i === panel} className={`block w-10 overflow-hidden border-2 ${i === panel ? "border-pink-500 shadow-paperSm" : "border-ink/40"}`}>
              <PanelView panel={p} />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex flex-1 items-start justify-center px-4 pb-4 pt-5" onClick={() => undefined}>
        <div style={{ width: `min(${zoom * 100}%, calc((100dvh - 330px) * 0.707 * ${zoom}))`, minWidth: 200 }}>
          <div className="relative"><Cinta className="-top-3 left-1/2 z-20 -translate-x-1/2" rot={-3} w={64} /><span aria-hidden className="absolute inset-0 -z-0 translate-x-2 translate-y-2 rotate-2 border-2 border-ink bg-paper" /><div className="relative"><EditorCanvas onZoom={(d) => setZoom((z) => Math.min(1.5, Math.max(0.6, z + d)))} /></div></div>
          <p className="mt-3 text-center text-xs text-ink/70">
            {E.nombre} · se autoguarda · <Link href="/pliego" className="font-semibold underline">editor de pliego A4</Link>
          </p>
          {sel && (
            <div className="mt-3 flex items-center justify-center gap-2">
              <Button variant="soft" className="min-h-[40px] text-sm" onClick={() => setTool(draft.paneles[panel].elementos.find((e) => e.id === sel)?.tipo === "texto" ? "texto" : draft.paneles[panel].elementos.find((e) => e.id === sel)?.tipo === "imagen" ? "fotos" : "stickers")}>Editar elemento</Button>
              <Button variant="ghost" className="min-h-[40px] text-sm" onClick={() => select(null)}>Quitar selección</Button>
            </div>
          )}
        </div>
      </div>
      <nav aria-label="Herramientas" className="sticky bottom-0 z-30 border-t-2 border-ink bg-white text-ink pb-[env(safe-area-inset-bottom)]">
        <ul className="mx-auto flex max-w-xl justify-around">
          {herramientas.map((h) => (
            <li key={h.id}>
              <button type="button" onClick={() => setTool(tool === h.id ? null : h.id)} aria-pressed={tool === h.id} className={`flex h-16 min-w-[72px] flex-col items-center justify-center gap-0.5 text-xs font-semibold ${tool === h.id ? "text-pink-500" : ""}`}>
                <Icon n={h.n} size={24} />
                {h.t}
              </button>
            </li>
          ))}
          <li>
            <button type="button" onClick={borrador} className="flex h-16 min-w-[72px] flex-col items-center justify-center gap-0.5 text-xs font-semibold">
              <Icon n="download" size={24} />
              Borrador
            </button>
          </li>
        </ul>
      </nav>
      <BottomSheet abierto={tool !== null} onCerrar={() => setTool(null)} titulo={tool === "texto" ? "Texto" : tool === "stickers" ? "Stickers" : tool === "fotos" ? "Fotos" : "Colores"}>
        <div className="space-y-5">
          {sel && <div className="rounded-xl border-2 border-ink/30 bg-white p-3"><AccionesElemento /></div>}
          {tool === "texto" && <ToolTexto />}
          {tool === "stickers" && <ToolStickers sugeridos={E.stickers} />}
          {tool === "fotos" && <ToolFotos />}
          {tool === "colores" && <ToolColores />}
        </div>
      </BottomSheet>
    </div>
  );
}
