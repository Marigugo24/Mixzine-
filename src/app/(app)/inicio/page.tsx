"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fanzinesDePrueba, esAmigo } from "@/lib/seed";
import { Cuadricula, FanzineCard, TarjetaCargando } from "@/components/FanzineCard";
import { EmptyState, Segmentado, TopBar } from "@/components/ui";
import { Cabecera, Interludio } from "@/components/deco";
import { Fragment } from "react";
import { Pagina, Etiqueta, Ransom, Marquee, Recorte, Estrella, Chispa, Blobs } from "@/components/deco";
import { useApp } from "@/lib/store";
import { useFeedRemoto } from "@/lib/feed";
import { DEMO_FEED } from "@/lib/api";

type Vista = "todos" | "amigos" | "tendencias";

export default function Inicio() {
  const [vista, setVista] = useState<Vista>("todos");
  const [cargando, setCargando] = useState(true);
  const todos = useApp((s) => s.fanzines);
  const remoto = useFeedRemoto({ vista });
  const mios = useMemo(() => todos.filter((f) => !f.borrador && f.visibilidad === "publico"), [todos]);
  useEffect(() => {
    setCargando(true);
    const t = setTimeout(() => setCargando(false), 350);
    return () => clearTimeout(t);
  }, [vista]);
  const lista = useMemo(() => {
    // con servidor: fanzines reales; los de prueba solo rellenan (se apagan con NEXT_PUBLIC_DEMO_FEED=0)
    const reales = remoto.remoto ? remoto.items : mios;
    const ids = new Set(reales.map((f) => f.id));
    const demos = DEMO_FEED ? fanzinesDePrueba().filter((f) => !ids.has(f.id)) : [];
    const base = [...reales, ...demos];
    if (vista === "amigos") return remoto.remoto ? [...reales, ...demos.filter(esAmigo)] : base.filter(esAmigo);
    if (vista === "tendencias") return [...base].sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0)).slice(0, 24);
    return base;
  }, [vista, mios, remoto.items, remoto.remoto]);
  return (
    <Pagina tono="naranja" recortes={[{ src: "/collage/megafono.webp", w: 120, x: "78%", y: "58%", rot: -10, v: 0.12, modo: "pendulo" }, { src: "/collage/estrella-azul.webp", w: 70, x: "4%", y: "70%", rot: 14, v: 0.22, modo: "gira" }, { src: "/collage/diamante.webp", w: 90, x: "60%", y: "88%", rot: -8, v: 0.3, modo: "late" }]}>
      <TopBar titulo="Comunidad" accion={<Link href="/pliego" className="hidden min-h-[44px] items-center rounded-full border-2 border-ink px-4 text-sm font-semibold md:inline-flex lg:hidden">Pliego A4</Link>} />
      <Cabecera titulo="lo que suena hoy" sub="fanzines de la comunidad" banda="#F7E34A" semilla={2} ancho={32} recortes={[{ src: "/collage/trompeta.webp", w: 72, right: "3%", top: "-2%", rot: 8, modo: "pendulo" }]} />
      <div className="px-4">
        <Segmentado etiqueta="Vista de la comunidad" valor={vista} onChange={setVista} opciones={[{ id: "todos", nombre: "Todos" }, { id: "amigos", nombre: "Mis amigos" }, { id: "tendencias", nombre: "Tendencias" }]} />
      </div>
      {cargando || remoto.estado === "cargando" ? (
        <Cuadricula>{Array.from({ length: 8 }, (_, i) => <TarjetaCargando key={i} />)}</Cuadricula>
      ) : lista.length === 0 ? (
        <EmptyState titulo="Aún no hay nada aquí" texto="Cuando tus amigos publiquen fanzines, los verás en esta vista." />
      ) : (
        <Cuadricula>{lista.map((f, i) => (<Fragment key={f.id}><FanzineCard f={f} i={i} /></Fragment>))}</Cuadricula>
      )}
    </Pagina>
  );
}
