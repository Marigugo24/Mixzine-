"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { decodificar } from "@/lib/share";
import { Lector } from "@/components/Lector";
import { Button, EmptyState, Icon } from "@/components/ui";
import { useApp, toast } from "@/lib/store";
import { api, useBackend } from "@/lib/api";
import type { Fanzine } from "@/lib/types";
import { EMOCIONES } from "@/lib/emotions";
import { Pagina, Etiqueta, Recorte } from "@/components/deco";

type Vista = { f: Fanzine; m?: string; de?: string };

export function Visor({ d, id }: { d?: string; id?: string }) {
  const local = useMemo(() => decodificar(d), [d]);
  const [remoto, setRemoto] = useState<Vista | null | undefined>(id ? undefined : null);
  const esperando = useBackend((s) => s.estado === "cargando");
  useEffect(() => {
    if (!id || esperando) return;
    let vivo = true;
    api<{ fanzine: Fanzine }>(`/api/fanzines/${encodeURIComponent(id)}`)
      .then((r) => vivo && setRemoto({ f: r.fanzine, m: r.fanzine.mensaje, de: r.fanzine.autorNombre }))
      .catch((e) => vivo && setRemoto(null));
    return () => {
      vivo = false;
    };
  }, [id, esperando]);
  const p: Vista | null = id ? (remoto ?? null) : local;
  if (id && remoto === undefined) return <div className="grid min-h-dvh place-items-center bg-paper" aria-busy><img src="/brand/star.webp" alt="Cargando" className="h-14 w-14 animate-spin" style={{ animationDuration: "1.6s" }} /></div>;
  return <VisorVista p={p} />;
}

function VisorVista({ p }: { p: Vista | null }) {
  const user = useApp((s) => s.user);
  const guardarRecibido = useApp((s) => s.guardarRecibido);
  const yaGuardado = useApp((s) => !!p && s.recibidos.some((x) => x.id === p.f.id));
  const notificar = useApp((s) => s.notificar);
  if (!p)
    return (
      <div className="mx-auto max-w-sm px-6 py-16">
        <EmptyState titulo="Link incompleto" texto="Este link está cortado, o el fanzine ya no es visible. Pídele a quien te lo envió que lo comparta de nuevo." accion={<Link href="/" className="font-semibold underline">Ir a Mixzine</Link>} />
      </div>
    );
  const f = p.f;
  return (
    <Pagina tono="naranja" recortes={[{ src: "/collage/globo.webp", w: 100, x: "76%", y: "50%", rot: 10, v: 0.12, modo: "gira" }, { src: "/collage/audifonos.webp", w: 90, x: "2%", y: "80%", rot: -8, v: 0.25, modo: "pendulo" }]}><div className="mx-auto max-w-xl space-y-5 px-4 py-8">
      <header className="text-center">
        <img src="/brand/wordmark.webp" alt="mixzine" className="mx-auto w-40" />
        <div className="mt-3"><Etiqueta color="olive">@{p.de ?? f.autorNombre} te envió un fanzine</Etiqueta></div>
        <h1 className="font-abril text-5xl leading-none [text-shadow:3px_3px_0_#fff]">{f.cancion.titulo}</h1>
        <p className="text-sm font-semibold">{f.cancion.artista} · {EMOCIONES[f.emocion]?.nombre}</p>
      </header>
      {p.m && <blockquote className="-rotate-1 border-2 border-ink bg-white p-4 font-type text-lg shadow-paper">“{p.m}”</blockquote>}
      <Lector f={f} />
      <div className="flex flex-wrap justify-center gap-2">
        {f.cancion.enlace && (
          <a href={f.cancion.enlace} target="_blank" rel="noreferrer" className="inline-flex min-h-[44px] items-center gap-2 rounded-full border-2 border-ink bg-white px-5 font-semibold hover:bg-pink-100">
            <Icon n="play" size={16} fill /> Escuchar la canción
          </a>
        )}
        {user ? (
          <Button disabled={yaGuardado} onClick={() => { guardarRecibido({ ...f, mensaje: p.m }); notificar(`Guardaste «${f.cancion.titulo}» de @${p.de ?? f.autorNombre}.`, "recibido"); toast("Guardado en Recibidos"); }}>
            {yaGuardado ? "Ya está en tu galería" : "Guardar en mi galería"}
          </Button>
        ) : (
          <Link href="/registro" className="inline-flex min-h-[44px] items-center rounded-full border-2 border-ink bg-yellow-400 px-5 font-semibold text-ink">Crea tu perfil para guardarlo</Link>
        )}
      </div>
      <p className="text-center text-xs text-ink/65">{f.visibilidad === "publico" ? "Este fanzine es público en la comunidad de Mixzine." : "Este fanzine es privado: solo lo ve quien tiene este link."} <Link href="/" className="underline">Haz el tuyo en Mixzine</Link></p>
    </div></Pagina>
  );
}
