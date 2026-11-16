"use client";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Cinta, Decoracion } from "@/components/deco";
import { useApp, useEditor, useListo, usePremium, toast } from "@/lib/store";
import { PANEL_NOMBRES } from "@/lib/types";
import { EditorCanvas } from "@/components/EditorCanvas";
import { PanelView } from "@/components/PanelView";
import { AccionesElemento, ToolColores, ToolFotos, ToolStickers, ToolTexto } from "@/components/Herramientas";
import { Button, Chip, EmptyState, Icon, IconButton, Segmentado, TopBar, useDebounced } from "@/components/ui";
import { avisosDpi, descargar, renderSheet } from "@/lib/render";
import { EMOCIONES } from "@/lib/emotions";

type Herr = "texto" | "stickers" | "fotos" | "colores";

function Contenido() {
  const router = useRouter();
  const idParam = useSearchParams().get("id");
  const listo = useListo();
  const user = useApp((s) => s.user);
  const fanzines = useApp((s) => s.fanzines);
  const guardar = useApp((s) => s.guardarFanzine);
  const premium = usePremium();
  const { draft, panel, setPanel, setDraft, undo, redo, past, future } = useEditor();
  const [modo, setModo] = useState<"editar" | "pliego">("editar");
  const [herr, setHerr] = useState<Herr>("texto");
  const [guias, setGuias] = useState(true);
  const [margen, setMargen] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [horizontal, setHorizontal] = useState(true);
  const [ocupado, setOcupado] = useState<"" | "pdf" | "png">("");
  const [avisos, setAvisos] = useState<{ panel: string; dpi: number }[]>([]);
  const vista = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (listo && !user) router.replace("/");
  }, [listo, user, router]);
  // cargar el fanzine indicado
  useEffect(() => {
    if (!listo || !idParam || draft?.id === idParam) return;
    const f = fanzines.find((x) => x.id === idParam);
    if (f) setDraft(JSON.parse(JSON.stringify(f)));
  }, [listo, idParam, draft?.id, fanzines, setDraft]);
  // orientación
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px), (min-width: 768px) and (orientation: landscape)");
    const f = () => setHorizontal(mq.matches);
    f();
    mq.addEventListener("change", f);
    return () => mq.removeEventListener("change", f);
  }, []);

  const dd = useDebounced(draft, 350);
  useEffect(() => {
    if (modo !== "pliego" || !dd || !vista.current) return;
    let vivo = true;
    void renderSheet(dd, { dpi: 70, guias, margen }).then((cv) => {
      if (!vivo || !vista.current) return;
      const c = vista.current;
      c.width = cv.width;
      c.height = cv.height;
      c.getContext("2d")!.drawImage(cv, 0, 0);
    });
    return () => {
      vivo = false;
    };
  }, [modo, dd, guias, margen]);
  useEffect(() => {
    if (draft) void avisosDpi(draft).then(setAvisos);
  }, [dd]); // eslint-disable-line react-hooks/exhaustive-deps

  const total = useMemo(() => draft?.paneles.reduce((n, p) => n + p.elementos.length, 0) ?? 0, [draft]);

  if (!listo) return null;
  if (!draft)
    return (
      <>
        <TopBar titulo="Pliego A4" atras onAtras={() => router.push("/perfil")} />
        <EmptyState titulo="Aún no hay fanzine" texto="Crea uno o elige uno de tu perfil para ordenarlo en el pliego." accion={<Link href="/crear" className="font-semibold underline">Crear un fanzine</Link>} />
      </>
    );
  if (!horizontal)
    return (
      <>
        <TopBar titulo="Pliego A4" atras onAtras={() => router.push("/crear/editor")} />
        <EmptyState titulo="Gira tu pantalla" texto="El editor de pliego solo está disponible en horizontal (tablet o escritorio). En el celular edita una cara a la vez." accion={<Link href="/crear/editor" className="inline-flex min-h-[44px] items-center rounded-full border-2 border-ink bg-pink-500 px-5 font-semibold text-ink/70">Editar cara por cara</Link>} />
      </>
    );

  const E = EMOCIONES[draft.emocion];
  const nombreArchivo = `mixzine-${draft.cancion.titulo.replace(/\W+/g, "-").toLowerCase()}`;
  const pdf = async () => {
    if (!premium) {
      toast("El PDF es parte de Premium");
      router.push("/planes?volver=/pliego");
      return;
    }
    setOcupado("pdf");
    try {
      const cv = await renderSheet(draft, { dpi: 300, guias, margen });
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4", compress: true });
      doc.setProperties({ title: `Mixzine · ${draft.cancion.titulo}`, creator: "Mixzine" });
      doc.addImage(cv.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, 297, 210, undefined, "FAST");
      doc.save(`${nombreArchivo}.pdf`);
      toast("PDF descargado");
    } catch {
      toast("No pudimos generar el PDF en este dispositivo");
    } finally {
      setOcupado("");
    }
  };
  const png = async () => {
    setOcupado("png");
    try {
      const cv = await renderSheet(draft, { dpi: 150, guias, margen });
      descargar(cv.toDataURL("image/png"), `${nombreArchivo}.png`);
      toast("Imagen descargada");
    } finally {
      setOcupado("");
    }
  };
  const guardarTodo = () => {
    guardar({ ...draft, borrador: false });
    toast("Guardado");
  };

  return (
    <div className="flex min-h-dvh flex-col fondo-mix text-ink">
      <TopBar
        titulo={<span className="truncate">Pliego A4 · {draft.cancion.titulo}</span>}
        atras
        onAtras={() => router.push("/perfil")}
        accion={
          <>
            <IconButton label="Deshacer" n="undo" onClick={undo} disabled={!past.length} />
            <IconButton label="Rehacer" n="redo" onClick={redo} disabled={!future.length} />
            <Button className="min-h-[40px] px-4 text-sm" onClick={guardarTodo}>Guardar</Button>
          </>
        }
      />
      <div className="grid flex-1 gap-4 p-4 md:grid-cols-[1fr_300px] lg:grid-cols-[210px_1fr_340px]">
        {/* Lista de caras */}
        <nav aria-label="Caras del pliego" className="md:col-span-2 lg:col-span-1">
          <ul className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
            {draft.paneles.map((p, i) => (
              <li key={p.clave} className="shrink-0">
                <button type="button" onClick={() => { setPanel(i); setModo("editar"); }} aria-current={i === panel && modo === "editar"} className={`flex w-full items-center gap-3 rounded-xl border-2 p-2 text-left ${i === panel && modo === "editar" ? "border-ink bg-pink-100 shadow-paperSm" : "border-ink/30 bg-white"}`}>
                  <span className="block w-10 shrink-0 border border-ink/50"><PanelView panel={p} /></span>
                  <span className="min-w-0 text-sm font-semibold">{PANEL_NOMBRES[p.clave]}<span className="block text-xs font-normal text-ink/70">{p.elementos.length} elementos</span></span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-3 hidden text-xs text-ink/70 lg:block">Total: {total} elementos · {E.nombre}</p>
        </nav>

        {/* Centro */}
        <section aria-label="Lienzo" className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="w-56"><Segmentado etiqueta="Modo" valor={modo} onChange={setModo} opciones={[{ id: "editar", nombre: "Editar cara" }, { id: "pliego", nombre: "Ver pliego" }]} /></div>
            {modo === "editar" && (
              <>
                <IconButton label="Alejar (−)" n="zoomout" onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))} />
                <span className="text-sm font-semibold tabular-nums">{Math.round(zoom * 100)}%</span>
                <IconButton label="Acercar (+)" n="zoomin" onClick={() => setZoom((z) => Math.min(1.6, z + 0.1))} />
              </>
            )}
          </div>
          {modo === "editar" ? (
            <div className="flex justify-center">
              <div style={{ width: `calc((100dvh - 200px) * 0.707 * ${zoom})`, minWidth: 220, maxWidth: "100%" }}>
                <div className="relative"><Cinta className="-top-3 left-1/2 z-20 -translate-x-1/2" rot={-3} w={64} /><span aria-hidden className="absolute inset-0 -z-0 translate-x-2 translate-y-2 rotate-2 border-2 border-ink bg-paper" /><div className="relative"><EditorCanvas onZoom={(d) => setZoom((z) => Math.min(1.6, Math.max(0.5, z + d)))} /></div></div>
              </div>
            </div>
          ) : (
            <div className="border-2 border-ink bg-white shadow-paper">
              <canvas ref={vista} role="img" aria-label="Vista del pliego A4 con las 8 caras. La fila superior va girada 180 grados." className="block h-auto w-full" />
            </div>
          )}
          <p className="mt-3 text-xs text-ink/70">Atajos: Ctrl/Cmd+Z deshacer · Ctrl/Cmd+Mayús+Z rehacer · Supr borrar · flechas 1 mm (Mayús 5 mm) · Ctrl/Cmd+D duplicar · + y − zoom</p>
        </section>

        {/* Propiedades */}
        <aside aria-label="Propiedades" className="space-y-4">
          <div className="rounded-2xl border-2 border-ink bg-white p-3">
            <h2 className="mb-2 font-comic text-xl tracking-wide">Elemento</h2>
            <AccionesElemento />
          </div>
          <div className="rounded-2xl border-2 border-ink bg-white p-3">
            <div className="mb-3 flex flex-wrap gap-1.5" role="tablist" aria-label="Herramienta">
              {([["texto", "Texto"], ["stickers", "Stickers"], ["fotos", "Fotos"], ["colores", "Colores"]] as const).map(([id, t]) => (
                <Chip key={id} activo={herr === id} onClick={() => setHerr(id)}>{t}</Chip>
              ))}
            </div>
            <div className="max-h-[42dvh] overflow-y-auto pr-1">
              {herr === "texto" && <ToolTexto />}
              {herr === "stickers" && <ToolStickers sugeridos={E.stickers} />}
              {herr === "fotos" && <ToolFotos />}
              {herr === "colores" && <ToolColores />}
            </div>
          </div>
          <div className="space-y-3 rounded-2xl border-2 border-ink bg-white p-3">
            <h2 className="font-comic text-xl tracking-wide">Exportar</h2>
            <label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" className="h-5 w-5 accent-pink-500" checked={guias} onChange={(e) => setGuias(e.target.checked)} /> Guías de doblez y corte</label>
            <label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" className="h-5 w-5 accent-pink-500" checked={margen} onChange={(e) => setMargen(e.target.checked)} disabled={!guias} /> Margen seguro de 5 mm</label>
            {avisos.length > 0 && (
              <p role="alert" className="rounded-lg bg-yellow-400/60 p-2 text-xs">
                {avisos.length} foto(s) quedarían por debajo de 150 dpi al imprimir (la más baja: {Math.min(...avisos.map((a) => a.dpi))} dpi). Usa una foto más grande o redúcela.
              </p>
            )}
            <Button block onClick={pdf} loading={ocupado === "pdf"}>
              {!premium && <Icon n="lock" size={16} />} Descargar PDF
            </Button>
            <Button block variant="soft" onClick={png} loading={ocupado === "png"}>Descargar imagen (PNG)</Button>
            <p className="text-xs text-ink/65">Hoja A4 horizontal de 297 × 210 mm, 4 × 2 caras. Imprime al 100 % (sin «ajustar a la página»), dobla y corta la línea central rosada.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function Pliego() {
  return <Suspense><Contenido /></Suspense>;
}
