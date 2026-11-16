"use client";
import { useEffect } from "react";
import { Pagina, Cabecera, Papel } from "@/components/deco";
import { useApp } from "@/lib/store";
import { EmptyState, Icon, TopBar, Button } from "@/components/ui";

const COLORES = { like: "#FFFFFF", recibido: "#FFFFFF", otro: "#FFFFFF" } as const;

export default function Notificaciones() {
  const notifs = useApp((s) => s.notifs);
  const marcar = useApp((s) => s.marcarLeidas);
  useEffect(() => {
    const t = setTimeout(marcar, 1500);
    return () => clearTimeout(t);
  }, [marcar]);
  const fmt = (iso: string) => new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
  return (
    <Pagina tono="oliva" recortes={[{ src: "/collage/megafono.webp", w: 110, x: "74%", y: "58%", rot: -10, v: 0.12, modo: "pendulo" }, { src: "/collage/flor-verde.webp", w: 64, x: "3%", y: "74%", rot: 8, v: 0.24, modo: "late" }, { src: "/collage/estrella-azul.webp", w: 60, x: "60%", y: "88%", rot: 12, v: 0.3, modo: "gira" }]}>
      <TopBar titulo="Avisos" accion={<Button variant="ghost" onClick={marcar} className="text-sm">Marcar leídas</Button>} />
      <Cabecera titulo="avisos" sub="lo que ha pasado" banda="#F59AC4" semilla={7} ancho={40} recortes={[{ src: "/collage/megafono.webp", w: 84, right: "4%", top: "0%", rot: 8, modo: "pendulo" }]} />
      {notifs.length === 0 ? (
        <EmptyState titulo="Todo en silencio" texto="Aquí aparecerán los likes y los fanzines que te envíen." />
      ) : (
        <ul className="space-y-5 px-5 pb-28 pt-2">
          {notifs.map((n, i) => (
            <li key={n.id}>
              <Papel color={COLORES[n.tipo as keyof typeof COLORES] ?? COLORES.otro} rot={i % 2 ? 1.2 : -1.2} semilla={i + 11} pad="px-4 py-4" cinta={i % 2 === 0}>
                <div className="flex items-start gap-3 text-ink">
                  <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-ink ${n.tipo === "like" ? "bg-pink-500 text-white" : n.tipo === "recibido" ? "bg-cobalt-600 text-white" : "bg-yellow-400"}`}>
                    <Icon n={n.tipo === "like" ? "heart" : n.tipo === "recibido" ? "send" : "star"} size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-[15px] ${n.leida ? "" : "font-bold"}`}>{n.texto}</p>
                    <p className="mt-1 text-xs font-semibold text-ink/60">{fmt(n.fecha)}</p>
                  </div>
                  {!n.leida && <span className="mt-2 h-3 w-3 rounded-full border-2 border-ink bg-pink-500" aria-label="Sin leer" />}
                </div>
              </Papel>
            </li>
          ))}
        </ul>
      )}
    </Pagina>
  );
}
