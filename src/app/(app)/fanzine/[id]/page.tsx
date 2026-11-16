"use client";
import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fanzinesDePrueba } from "@/lib/seed";
import { useApp, useEditor, toast } from "@/lib/store";
import { Lector } from "@/components/Lector";
import { Button, EmptyState, Icon, TopBar } from "@/components/ui";
import { Pagina, Etiqueta } from "@/components/deco";
import { useLike } from "@/components/FanzineCard";
import { EMOCIONES } from "@/lib/emotions";
import { api, useBackend } from "@/lib/api";
import { normalizarLikes } from "@/lib/sync";
import type { Fanzine } from "@/lib/types";

export default function Detalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const mios = useApp((s) => s.fanzines);
  const recibidos = useApp((s) => s.recibidos);
  const setDraft = useEditor((s) => s.setDraft);
  const local = useMemo(() => [...mios, ...recibidos, ...fanzinesDePrueba()].find((x) => x.id === id), [mios, recibidos, id]);
  const backendOn = useBackend((s) => s.estado === "on");
  const [buscado, setBuscado] = useState<Fanzine | null | undefined>(undefined);
  useEffect(() => {
    if (local || !backendOn) return;
    let vivo = true;
    api<{ fanzine: Fanzine; liked: boolean }>(`/api/fanzines/${encodeURIComponent(id)}`)
      .then((r) => {
        if (!vivo) return;
        useApp.getState().mezclarLikes([id], r.liked ? [id] : []);
        setBuscado(normalizarLikes([r.fanzine], r.liked ? [id] : [])[0]);
      })
      .catch(() => vivo && setBuscado(null));
    return () => {
      vivo = false;
    };
  }, [local, backendOn, id]);
  const f = local ?? buscado ?? undefined;
  if (!f && backendOn && buscado === undefined) return (<><TopBar titulo="Fanzine" atras /><div className="grid place-items-center py-24" aria-busy><img src="/brand/star.webp" alt="Cargando" className="h-12 w-12 animate-spin" style={{ animationDuration: "1.6s" }} /></div></>);
  if (!f) return (<><TopBar titulo="Fanzine" atras /><EmptyState titulo="No lo encontramos" texto="Puede que haya sido eliminado." /></>);
  return <Vista f={f} propio={mios.some((x) => x.id === id)} onEditar={() => { setDraft(JSON.parse(JSON.stringify(f))); router.push("/crear/editor"); }} />;
}

function Vista({ f, propio, onEditar }: { f: import("@/lib/types").Fanzine; propio: boolean; onEditar: () => void }) {
  const { liked, count, hacer } = useLike(f);
  const E = EMOCIONES[f.emocion];
  return (
    <Pagina tono="amarillo">
      <TopBar titulo={f.cancion.titulo} atras />
      <div className="mx-auto max-w-xl space-y-5 px-4 py-6">
        <Lector f={f} />
        <div className="rounded-2xl border-2 border-ink bg-white p-4 shadow-[4px_4px_0_#111]">
          <p className="font-semibold">{f.cancion.titulo} <span className="font-normal text-ink/75">· {f.cancion.artista}</span></p>
          <p className="text-sm text-ink/75">@{f.autorNombre} · {E.nombre}</p>
          {f.mensaje && <p className="mt-3 rounded-lg bg-pink-100 p-3 text-sm">“{f.mensaje}”</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="soft" onClick={hacer} aria-pressed={liked}><Icon n="heart" size={18} fill={liked} className={liked ? "text-pink-500" : ""} /> {count}</Button>
          {f.cancion.enlace && <a href={f.cancion.enlace} target="_blank" rel="noreferrer" className="inline-flex min-h-[44px] items-center gap-2 rounded-full border-2 border-ink bg-white px-5 text-[15px] font-semibold hover:bg-pink-100"><Icon n="link" size={18} /> Escuchar</a>}
          {propio && <><Button onClick={onEditar}>Editar</Button><Link href={`/compartir?id=${f.id}`} className="inline-flex min-h-[44px] items-center gap-2 rounded-full border-2 border-ink bg-cobalt-600 px-5 text-[15px] font-semibold text-white"><Icon n="share" size={18} /> Compartir</Link></>}
        </div>
        {!propio && <p className="text-xs font-semibold text-ink/80">¿Te dieron ganas de hacer el tuyo? <Link className="underline" href="/crear">Crea un fanzine</Link></p>}
      </div>
    </Pagina>
  );
}
void toast;
