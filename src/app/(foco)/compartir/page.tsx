"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useApp, useEditor, useListo, toast } from "@/lib/store";
import { CONTACTOS } from "@/lib/seed";
import { codificar, urlCorta, urlDeFanzine } from "@/lib/share";
import { useBackend } from "@/lib/api";
import { empujarFanzine } from "@/lib/sync";
import { descargar, renderSheet } from "@/lib/render";
import { Lector } from "@/components/Lector";
import { Button, Chip, EmptyState, Icon, TopBar } from "@/components/ui";
import { Pagina, Etiqueta, Ransom, Marquee, Recorte, Estrella, Chispa, Blobs } from "@/components/deco";


function Contenido() {
  const id = useSearchParams().get("id");
  const router = useRouter();
  const listo = useListo();
  const fanzines = useApp((s) => s.fanzines);
  const user = useApp((s) => s.user);
  const guardar = useApp((s) => s.guardarFanzine);
  const notificar = useApp((s) => s.notificar);
  const draft = useEditor((s) => s.draft);
  const f = useMemo(() => fanzines.find((x) => x.id === id) ?? (draft && draft.id === id ? draft : undefined), [fanzines, draft, id]);
  const [msg, setMsg] = useState("");
  const [para, setPara] = useState<string[]>([]);
  const [publico, setPublico] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const conCuenta = useApp((s) => s.remoto);
  const backendOn = useBackend((s) => s.estado === "on");
  const remoto = conCuenta && backendOn;

  useEffect(() => {
    if (listo && !user) router.replace("/");
  }, [listo, user, router]);
  if (!listo) return null;
  if (!f)
    return (
      <>
        <TopBar titulo="Compartir" atras />
        <EmptyState titulo="No hay nada para compartir" texto="Crea un fanzine y vuelve aquí." accion={<Link href="/crear" className="font-semibold underline">Crear un fanzine</Link>} />
      </>
    );

  // Con cuenta: se guarda en el servidor (con fotos) y el link es corto. Sin cuenta: el fanzine viaja dentro del link.
  const prepararLink = async (): Promise<{ url: string; sinFotos: number }> => {
    const marcado: typeof f = { ...f, borrador: false, visibilidad: publico ? "publico" : "enlace", mensaje: msg.trim() || undefined };
    if (remoto) {
      useApp.setState((s) => ({ fanzines: [marcado, ...s.fanzines.filter((x) => x.id !== marcado.id)] }));
      const ok = await empujarFanzine(marcado);
      if (ok) return { url: urlCorta(location.origin, f.id), sinFotos: 0 };
    } else guardar(marcado);
    const { d, sinFotos } = codificar(marcado, msg.trim() || undefined, user?.handle);
    return { url: urlDeFanzine(location.origin, d), sinFotos };
  };
  const nombres = CONTACTOS.filter((c) => para.includes(c.id)).map((c) => c.nombre);

  const porLink = async () => {
    setOcupado(true);
    const { url, sinFotos } = await prepararLink();
    setOcupado(false);
    try {
      if (navigator.share) await navigator.share({ title: `${f.cancion.titulo} · Mixzine`, text: msg.trim() || "Te hice un fanzine con esta canción", url });
      else {
        await navigator.clipboard.writeText(url);
        toast("Link copiado");
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        try {
          await navigator.clipboard.writeText(url);
          toast("Link copiado");
        } catch {
          window.prompt("Copia este link", url);
        }
      }
    }
    if (sinFotos) toast(`${sinFotos} foto(s) propia(s) no viajan en el link`);
  };
  const porMensaje = async () => {
    setOcupado(true);
    const { url } = await prepararLink();
    setOcupado(false);
    const texto = `${msg.trim() ? msg.trim() + "\n\n" : ""}Te hice un fanzine con «${f.cancion.titulo}» de ${f.cancion.artista}: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
    if (nombres.length) notificar(`Enviaste «${f.cancion.titulo}» a ${nombres.join(", ")}.`, "recibido");
    toast(nombres.length ? `Enviado a ${nombres.join(", ")}` : "Mensaje listo para enviar");
  };
  const imagen = async () => {
    setOcupado(true);
    try {
      const cv = await renderSheet(f, { dpi: 150, guias: false, margen: false });
      descargar(cv.toDataURL("image/png"), `mixzine-${f.cancion.titulo.replace(/\W+/g, "-").toLowerCase()}.png`);
      toast("Imagen descargada");
    } finally {
      setOcupado(false);
    }
  };

  return (
    <Pagina tono="cobalto" recortes={[{ src: "/collage/megafono.webp", w: 110, x: "76%", y: "50%", rot: -10, v: 0.12, modo: "pendulo" }, { src: "/collage/cd.webp", w: 84, x: "2%", y: "78%", rot: 8, v: 0.25, modo: "gira" }]}>
      <TopBar titulo="Compartir" atras />
      <div className="mx-auto max-w-xl space-y-6 px-4 py-6 pb-12">
        <Lector f={f} />
        <section className="space-y-2" aria-labelledby="h-msg">
          <h2 id="h-msg" className="font-abril text-3xl text-ink">Un mensaje corto</h2>
          <textarea value={msg} onChange={(e) => setMsg(e.target.value.slice(0, 160))} rows={3} placeholder="Por qué le mandas esta canción…" className="w-full rounded-xl border-2 border-ink bg-white p-3 text-[15px]" aria-describedby="cuenta" />
          <p id="cuenta" className="text-right text-xs text-ink/70">{msg.length}/160</p>
        </section>
        <section className="space-y-2" aria-labelledby="h-para">
          <h2 id="h-para" className="font-abril text-3xl text-ink">¿A quién?</h2>
          <div className="flex flex-wrap gap-2">
            {CONTACTOS.map((c) => (
              <Chip key={c.id} activo={para.includes(c.id)} onClick={() => setPara((v) => (v.includes(c.id) ? v.filter((x) => x !== c.id) : [...v, c.id]))}>
                {c.nombre} <span className="font-normal opacity-75">{c.tipo === "grupo" ? "· grupo" : ""}</span>
              </Chip>
            ))}
          </div>
        </section>
        <label className="flex items-start gap-3 rounded-xl border-2 border-ink/30 bg-white p-3 text-sm">
          <input type="checkbox" checked={publico} onChange={(e) => setPublico(e.target.checked)} className="mt-1 h-5 w-5 accent-pink-500" />
          <span><strong>Publicar también en la comunidad.</strong> Si no lo marcas, solo lo ve quien tenga tu link.</span>
        </label>
        <div className="grid gap-3">
          <Button onClick={porLink} loading={ocupado}><Icon n="link" size={18} /> Compartir por link</Button>
          <Button variant="ink" onClick={porMensaje} loading={ocupado}><Icon n="send" size={18} /> Enviar por mensaje</Button>
          <Button variant="soft" onClick={imagen} loading={ocupado}><Icon n="download" size={18} /> Descargar como imagen</Button>
          <Link href={`/pliego?id=${f.id}`} className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border-2 border-ink bg-white px-5 font-semibold hover:bg-pink-100"><Icon n="sheet" size={18} /> Imprimir en pliego A4</Link>
        </div>
        <p className="text-xs font-medium text-ink/70">{remoto ? "El link abre tu fanzine completo, con tus fotos. Si lo publicas en la comunidad, cualquiera puede verlo; si no, solo quien tenga el link." : "Sin cuenta, el link lleva tu fanzine dentro de la dirección (sin tus fotos propias). Crea una cuenta para compartir con fotos."}</p>
        <Button variant="amarillo" block onClick={() => router.push("/perfil")}>Listo, ir a mi perfil</Button>
      </div>
    </Pagina>
  );
}
export default function Compartir() {
  return <Suspense><Contenido /></Suspense>;
}
