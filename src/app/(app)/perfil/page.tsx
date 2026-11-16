"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pagina, Etiqueta, Ransom, Marquee, Recorte, Estrella, Chispa, Blobs } from "@/components/deco";
import { useApp, useEditor, usePremium, toast } from "@/lib/store";
import type { Fanzine } from "@/lib/types";
import { PanelView } from "@/components/PanelView";
import { Button, EmptyState, Icon, Segmentado, TopBar } from "@/components/ui";
import { reducirAvatar } from "@/lib/imagen";

type Tab = "creados" | "borradores" | "recibidos";

function Item({ f, propio }: { f: Fanzine; propio: boolean }) {
  const router = useRouter();
  const setDraft = useEditor((s) => s.setDraft);
  const borrar = useApp((s) => s.borrarFanzine);
  const [seguro, setSeguro] = useState(false);
  const editar = () => {
    setDraft(JSON.parse(JSON.stringify(f)));
    router.push("/crear/editor");
  };
  return (
    <li className="rounded-xl border-2 border-ink bg-white p-3 shadow-paperSm">
      <div className="flex gap-3">
        <Link href={`/fanzine/${f.id}`} className="block w-20 shrink-0 border-2 border-ink" aria-label={`Abrir ${f.cancion.titulo}`}><PanelView panel={f.paneles[0]} /></Link>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{f.cancion.titulo}</p>
          <p className="truncate text-sm text-ink/75">{f.cancion.artista}{!propio ? ` · de @${f.autorNombre}` : ""}</p>
          <p className="text-xs text-ink/60">{f.visibilidad === "privado" ? "Privado" : f.visibilidad === "enlace" ? "Solo con link" : "Público"}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {propio && <Button variant="soft" className="min-h-[40px] px-3 text-sm" onClick={editar}>Editar</Button>}
            {propio && !f.borrador && <Link href={`/compartir?id=${f.id}`} className="inline-flex min-h-[40px] items-center rounded-full border-2 border-ink bg-yellow-400 px-3 text-sm font-semibold text-ink">Compartir</Link>}
            {propio && <Link href={`/pliego?id=${f.id}`} className="hidden min-h-[40px] items-center rounded-full border-2 border-ink bg-white px-3 text-sm font-semibold md:inline-flex">Pliego A4</Link>}
            {propio && (seguro ? <Button variant="ink" className="min-h-[40px] px-3 text-sm" onClick={() => { borrar(f.id); toast("Eliminado"); }}>¿Seguro? Borrar</Button> : <Button variant="ghost" className="min-h-[40px] px-3 text-sm" onClick={() => setSeguro(true)} aria-label={`Eliminar ${f.cancion.titulo}`}><Icon n="trash" size={18} /></Button>)}
          </div>
        </div>
      </div>
    </li>
  );
}

export default function Perfil() {
  const router = useRouter();
  const user = useApp((s) => s.user);
  const setUser = useApp((s) => s.setUser);
  const fanzines = useApp((s) => s.fanzines);
  const recibidos = useApp((s) => s.recibidos);
  const premium = usePremium();
  const remoto = useApp((s) => s.remoto);
  const [tab, setTab] = useState<Tab>("creados");
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(user?.nombre ?? "");
  const [foto, setFoto] = useState(user?.foto);
  const [borrarTodo, setBorrarTodo] = useState(false);
  const inp = useRef<HTMLInputElement>(null);
  if (!user) return null;
  const creados = fanzines.filter((f) => !f.borrador);
  const borradores = fanzines.filter((f) => f.borrador);
  const lista = tab === "creados" ? creados : tab === "borradores" ? borradores : recibidos;
  return (
    <Pagina tono="rosa" recortes={[{ src: "/collage/audifonos.webp", w: 100, x: "76%", y: "60%", rot: 10, v: 0.12, modo: "pendulo" }, { src: "/collage/luna-azul.webp", w: 70, x: "2%", y: "76%", rot: -10, v: 0.24, modo: "late" }]}>
      <TopBar titulo="Perfil" accion={<Link href="/planes" className="mr-2 inline-flex min-h-[40px] items-center rounded-full border-2 border-ink px-4 text-sm font-semibold hover:bg-pink-100">{premium ? "Premium ✓" : "Planes"}</Link>} />
      <div className="mx-auto max-w-2xl space-y-5 px-4 py-5">
        <section className="flex items-center gap-4 rounded-2xl border-2 border-ink bg-white p-3 shadow-[4px_4px_0_#111]">
          <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-ink bg-pink-100 shadow-paperSm">
            {user.foto ? <img src={user.foto} alt={`Foto de ${user.nombre}`} className="h-full w-full object-cover" /> : <Icon n="user" size={34} />}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-abril text-3xl">{user.nombre}</h2>
            <Etiqueta color="white" rot={-1} className="!text-[11px]">@{user.handle}</Etiqueta>
          </div>
          <Button variant="soft" className="min-h-[40px] text-sm" onClick={() => setEditando((v) => !v)}>{editando ? "Cerrar" : "Editar"}</Button>
        </section>
        {editando && (
          <form className="space-y-3 rounded-xl border-2 border-ink bg-white p-4" onSubmit={(e) => { e.preventDefault(); if (nombre.trim()) { setUser(nombre, foto); setEditando(false); toast("Perfil actualizado"); } }}>
            <label className="block text-sm font-semibold">Nombre<input value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={24} className="mt-1 h-12 w-full rounded-xl border-2 border-ink px-4" /></label>
            <input ref={inp} type="file" accept="image/*" className="sr-only" aria-label="Cambiar foto" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setFoto(await reducirAvatar(f)); }} />
            <div className="flex gap-2"><Button type="button" variant="soft" onClick={() => inp.current?.click()}>Cambiar foto</Button><Button type="submit">Guardar</Button></div>
          </form>
        )}
        <Segmentado etiqueta="Galería" valor={tab} onChange={setTab} opciones={[{ id: "creados", nombre: `Creados (${creados.length})` }, { id: "borradores", nombre: `Borradores (${borradores.length})` }, { id: "recibidos", nombre: `Recibidos (${recibidos.length})` }]} />
        {lista.length === 0 ? (
          <EmptyState titulo={tab === "recibidos" ? "Nada recibido" : "Aún no hay nada"} texto={tab === "recibidos" ? "Cuando alguien te mande un link de Mixzine y lo guardes, aparecerá aquí." : "Elige una canción y arma tu primer fanzine."} accion={tab !== "recibidos" ? <Button onClick={() => router.push("/crear")}>Crear fanzine</Button> : undefined} />
        ) : (
          <ul className="space-y-3">{lista.map((f) => <Item key={f.id} f={f} propio={tab !== "recibidos"} />)}</ul>
        )}
        <section className="border-t-2 border-ink/20 pt-4">
          {borrarTodo ? (
            <Button variant="ink" onClick={async () => { if (remoto) await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined); localStorage.removeItem("mixzine-app-v1"); localStorage.removeItem("mixzine-borrador-v1"); location.href = "/"; }}>{remoto ? "Confirmar: cerrar sesión en este dispositivo" : "Confirmar: borrar todo y salir"}</Button>
          ) : (
            <Button variant="ghost" onClick={() => setBorrarTodo(true)}>{remoto ? "Cerrar sesión" : "Salir y borrar mis datos de este dispositivo"}</Button>
          )}
        </section>
      </div>
    </Pagina>
  );
}
