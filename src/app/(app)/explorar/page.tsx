"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fanzinesDePrueba, GENEROS } from "@/lib/seed";
import { Cuadricula, FanzineCard, TarjetaCargando } from "@/components/FanzineCard";
import { Button, Chip, EmptyState, SearchInput, TopBar, useDebounced } from "@/components/ui";
import { Pagina, Etiqueta, Ransom, Marquee, Recorte, Estrella, Chispa, Blobs } from "@/components/deco";
import { useApp } from "@/lib/store";
import { useFeedRemoto } from "@/lib/feed";
import { DEMO_FEED } from "@/lib/api";
import { Cabecera, Interludio } from "@/components/deco";
import { Fragment } from "react";

const PAGINA = 8;

export default function Explorar() {
  const [q, setQ] = useState("");
  const [gen, setGen] = useState<string[]>([]);
  const [n, setN] = useState(PAGINA);
  const [estado, setEstado] = useState<"cargando" | "ok" | "error">("cargando");
  const [intento, setIntento] = useState(0);
  const dq = useDebounced(q, 300);
  const todos = useApp((s) => s.fanzines);
  const mios = useMemo(() => todos.filter((f) => !f.borrador && f.visibilidad === "publico"), [todos]);

  const remoto = useFeedRemoto({ q: dq, limit: 48 });
  const filtrados = useMemo(() => {
    const t = dq.trim().toLowerCase();
    const reales = remoto.remoto ? remoto.items : mios;
    const ids = new Set(reales.map((f) => f.id));
    const demos = DEMO_FEED ? fanzinesDePrueba().filter((f) => !ids.has(f.id)) : [];
    return [...reales, ...demos].filter((f) => {
      if (gen.length && !gen.includes(f.cancion.genero ?? "")) return false;
      if (!t) return true;
      return `${f.cancion.titulo} ${f.cancion.artista} ${f.autorNombre}`.toLowerCase().includes(t);
    });
  }, [dq, gen, mios, remoto.items, remoto.remoto]);

  // carga simulada (datos de prueba): muestra cargando → ok / error si no hay conexión
  useEffect(() => {
    setEstado("cargando");
    setN(PAGINA);
    const t = setTimeout(() => setEstado(typeof navigator !== "undefined" && navigator.onLine === false ? "error" : "ok"), 450);
    return () => clearTimeout(t);
  }, [dq, gen, intento]);
  const estadoFinal = estado === "ok" && remoto.estado === "cargando" ? "cargando" : estado === "ok" && remoto.estado === "error" ? "error" : estado;

  const centinela = useRef<HTMLLIElement | HTMLDivElement>(null);
  const [mas, setMas] = useState(false);
  const cargarMas = useCallback(() => {
    if (mas || n >= filtrados.length) return;
    setMas(true);
    setTimeout(() => {
      setN((v) => v + PAGINA);
      setMas(false);
    }, 450);
  }, [mas, n, filtrados.length]);
  useEffect(() => {
    const el = centinela.current;
    if (!el || estado !== "ok") return;
    const io = new IntersectionObserver((es) => es[0].isIntersecting && cargarMas(), { rootMargin: "300px" });
    io.observe(el);
    return () => io.disconnect();
  }, [cargarMas, estado, n]);

  const alternar = (g: string) => setGen((v) => (v.includes(g) ? v.filter((x) => x !== g) : [...v, g]));

  return (
    <Pagina tono="oliva" recortes={[{ src: "/collage/globo.webp", w: 110, x: "76%", y: "62%", rot: 12, v: 0.12, modo: "gira" }, { src: "/collage/flor-verde.webp", w: 70, x: "3%", y: "74%", rot: -8, v: 0.25, modo: "late" }, { src: "/collage/cd.webp", w: 84, x: "62%", y: "90%", rot: 6, v: 0.32, modo: "gira" }]}>
      <TopBar titulo="Explorar" />
      <Cabecera titulo="descubre" sub="busca una canción o un fanzine" banda="#E5348C" semilla={5} ancho={36} recortes={[{ src: "/collage/disco.webp", w: 60, right: "6%", top: "-4%", rot: 6, modo: "pendulo" }]} />
      <div className="space-y-3 px-4">
        <SearchInput label="Buscar fanzines y canciones" placeholder="Busca un fanzine o una canción" value={q} onChange={setQ} />
        <div role="group" aria-label="Filtrar por género" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {GENEROS.map((g) => (
            <Chip key={g} activo={gen.includes(g)} onClick={() => alternar(g)}>{g}</Chip>
          ))}
        </div>
      </div>
      {estadoFinal === "cargando" ? (
        <Cuadricula>{Array.from({ length: 8 }, (_, i) => <TarjetaCargando key={i} />)}</Cuadricula>
      ) : estadoFinal === "error" ? (
        <EmptyState titulo="No pudimos cargar" texto="Revisa tu conexión e inténtalo otra vez." accion={<Button onClick={() => { setIntento((v) => v + 1); remoto.recargar(); }}>Reintentar</Button>} />
      ) : filtrados.length === 0 ? (
        <EmptyState titulo="Sin resultados" texto="Prueba con otra palabra o quita algún género." accion={<Button variant="soft" onClick={() => { setQ(""); setGen([]); }}>Limpiar filtros</Button>} />
      ) : (
        <>
          <Cuadricula>
            {filtrados.slice(0, n).map((f, i) => (<Fragment key={f.id}><FanzineCard f={f} i={i % PAGINA} /></Fragment>))}
            {mas && Array.from({ length: 4 }, (_, i) => <TarjetaCargando key={`s${i}`} />)}
          </Cuadricula>
          {n < filtrados.length && <div ref={centinela as React.RefObject<HTMLDivElement>} className="h-8" aria-hidden />}
        </>
      )}
    </Pagina>
  );
}
