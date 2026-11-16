"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { buscarCanciones, detener, progreso, reproducir } from "@/lib/music";
import type { Cancion, Emocion } from "@/lib/types";
import { EMOCIONES, LISTA_EMOCIONES, crearFanzine } from "@/lib/emotions";
import { useApp, useEditor, useListo } from "@/lib/store";
import { Button, Chip, EmptyState, Icon, SearchInput, Skeleton, TopBar, useDebounced } from "@/components/ui";
import { CATALOGO } from "@/lib/seed";
import { motion, useReducedMotion } from "framer-motion";
import { Pagina, Etiqueta, Ransom, Marquee, Recorte, Estrella, Chispa, Blobs } from "@/components/deco";


function Caratula({ c, size = 56 }: { c: Cancion; size?: number }) {
  return c.caratulaUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={c.caratulaUrl} alt="" width={size} height={size} className="shrink-0 rounded-md border-2 border-ink object-cover" style={{ width: size, height: size }} />
  ) : (
    <span className="flex shrink-0 items-center justify-center rounded-md border-2 border-ink bg-lilac-300" style={{ width: size, height: size }} aria-hidden>
      <Icon n="star" size={size / 2} />
    </span>
  );
}

function FilaCancion({ c, sel, onSel }: { c: Cancion; sel: boolean; onSel: () => void }) {
  const [on, setOn] = useState(false);
  const [p, setP] = useState(0);
  useEffect(() => {
    if (!on) return;
    const t = setInterval(() => setP(progreso()), 100);
    return () => clearInterval(t);
  }, [on]);
  const tocar = () => {
    if (on) {
      detener();
      setOn(false);
      return;
    }
    if (!c.previewUrl) return;
    reproducir(c.previewUrl, () => setOn(false));
    setOn(true);
  };
  return (
    <li className={`flex items-center gap-3 rounded-xl border-2 p-2 ${sel ? "border-ink bg-white shadow-paperSm" : "border-ink/30 bg-white"}`}>
      <button type="button" onClick={onSel} aria-pressed={sel} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-label={`${sel ? "Canción elegida" : "Elegir"}: ${c.titulo}, ${c.artista}`}>
        <Caratula c={c} />
        <span className="min-w-0">
          <span className="block truncate font-semibold">{c.titulo}</span>
          <span className="block truncate text-sm text-ink/75">{c.artista}</span>
        </span>
      </button>
      {c.previewUrl && (
        <button type="button" onClick={tocar} aria-label={`${on ? "Pausar" : "Reproducir"} ${c.titulo}`} className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-white">
          {on && (
            <svg className="absolute inset-0" viewBox="0 0 44 44" aria-hidden>
              <circle cx="22" cy="22" r="20" fill="none" stroke="#E5348C" strokeWidth="3" strokeDasharray={`${p * 125.6} 125.6`} transform="rotate(-90 22 22)" />
            </svg>
          )}
          <Icon n={on ? "pause" : "play"} size={16} fill />
        </button>
      )}
    </li>
  );
}

export default function Crear() {
  const router = useRouter();
  const listo = useListo();
  const user = useApp((s) => s.user);
  const setDraft = useEditor((s) => s.setDraft);
  const borrador = useEditor((s) => s.draft);
  const [q, setQ] = useState("");
  const dq = useDebounced(q, 400);
  const [res, setRes] = useState<Cancion[]>([]);
  const [cargando, setCargando] = useState(false);
  const [fuente, setFuente] = useState<"spotify" | "itunes" | "local">("itunes");
  const [sel, setSel] = useState<Cancion | null>(null);
  const [emo, setEmo] = useState<Emocion | null>(null);
  const [manual, setManual] = useState(false);
  const [mt, setMt] = useState("");
  const [ma, setMa] = useState("");

  useEffect(() => {
    if (listo && !user) router.replace("/");
  }, [listo, user, router]);
  useEffect(() => () => detener(), []);
  useEffect(() => {
    if (!dq.trim()) {
      setRes([]);
      return;
    }
    const ac = new AbortController();
    setCargando(true);
    buscarCanciones(dq, ac.signal)
      .then((r) => {
        setRes(r.items);
        setFuente(r.fuente);
        setCargando(false);
      })
      .catch((e) => e.name !== "AbortError" && setCargando(false));
    return () => ac.abort();
  }, [dq]);

  const cancion: Cancion | null = manual && mt.trim() ? { titulo: mt.trim(), artista: ma.trim() || "Artista", caratulaUrl: "", enlace: `https://music.apple.com/search?term=${encodeURIComponent(mt + " " + ma)}` } : sel;
  const puede = !!cancion && !!emo;
  const crear = () => {
    if (!cancion || !emo) return;
    detener();
    setDraft(crearFanzine(emo, cancion, user));
    router.push("/crear/editor");
  };

  const reducido = useReducedMotion();
  return (
    <Pagina tono="amarillo" recortes={[{ src: "/collage/audifonos.webp", w: 100, x: "78%", y: "52%", rot: 10, v: 0.12, modo: "pendulo" }, { src: "/collage/disco.webp", w: 56, x: "3%", y: "80%", rot: -6, v: 0.25, modo: "pendulo" }]}>
      <TopBar titulo="Elige tu canción" atras onAtras={() => router.push("/inicio")} />
      <div className="mx-auto max-w-xl space-y-6 px-4 py-5 pb-32">
        {borrador && (
          <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-ink bg-yellow-400/60 p-3 text-sm">
            <span>Tienes un borrador de «{borrador.cancion.titulo}».</span>
            <Button variant="ink" onClick={() => router.push("/crear/editor")} className="min-h-[40px] text-sm">Continuar</Button>
          </div>
        )}
        <section aria-labelledby="h-cancion" className="space-y-3">
          <h2 id="h-cancion" className="flex items-center gap-3 font-abril text-3xl leading-tight"><span className="font-anton text-6xl text-yellow-400 [text-shadow:3px_3px_0_#111]">01</span> ¿Qué canción te marcó?</h2>
          {!manual ? (
            <>
              <SearchInput label="Buscar canción" placeholder="Título o artista" value={q} onChange={setQ} />
              {cargando ? (
                <div className="space-y-2" aria-busy>{[0, 1, 2].map((i) => <Skeleton key={i} className="h-[72px]" />)}</div>
              ) : res.length > 0 ? (
                <>
                  <ul className="space-y-2">{res.map((c) => <FilaCancion key={c.enlace + c.titulo} c={c} sel={sel?.enlace === c.enlace && sel?.titulo === c.titulo} onSel={() => setSel(c)} />)}</ul>
                  {fuente === "local" && <p className="text-xs text-ink/70">Sin conexión al buscador: mostrando canciones de ejemplo.</p>}
                </>
              ) : dq.trim() ? (
                <EmptyState titulo="Sin resultados" texto="Prueba otro título o escríbela a mano." />
              ) : (
                <div>
                  <p className="mb-2 text-sm text-ink/75">Ideas para empezar:</p>
                  <ul className="space-y-2">{CATALOGO.slice(0, 3).map((c) => <FilaCancion key={c.titulo} c={c} sel={sel?.titulo === c.titulo} onSel={() => setSel(c)} />)}</ul>
                </div>
              )}
              <button type="button" className="text-sm font-semibold underline" onClick={() => setManual(true)}>No la encuentro: escribirla a mano</button>
            </>
          ) : (
            <div className="space-y-3">
              <label className="block text-sm font-semibold">Título<input value={mt} onChange={(e) => setMt(e.target.value)} className="mt-1 h-12 w-full rounded-xl border-2 border-ink bg-white px-4" /></label>
              <label className="block text-sm font-semibold">Artista<input value={ma} onChange={(e) => setMa(e.target.value)} className="mt-1 h-12 w-full rounded-xl border-2 border-ink bg-white px-4" /></label>
              <button type="button" className="text-sm font-semibold underline" onClick={() => setManual(false)}>Volver a buscar</button>
            </div>
          )}
          <p className="text-xs text-ink/65">Solo guardamos título, artista, carátula y enlace. No importamos letras.</p>
        </section>

        <section aria-labelledby="h-emo" className="space-y-3">
          <h2 id="h-emo" className="flex items-center gap-3 font-abril text-3xl leading-tight"><span className="font-anton text-6xl text-yellow-400 [text-shadow:3px_3px_0_#111]">02</span> ¿Qué emoción te genera?</h2>
          <div role="radiogroup" aria-labelledby="h-emo" className="grid grid-cols-2 gap-2">
            {LISTA_EMOCIONES.map((e, i) => (
              <motion.button key={e.id} type="button" role="radio" aria-checked={emo === e.id} onClick={() => setEmo(e.id)} initial={reducido ? false : { opacity: 0, y: 30, rotate: i % 2 ? 5 : -5 }} animate={{ opacity: 1, y: 0, rotate: emo === e.id ? 0 : i % 2 ? 1.5 : -1.5, scale: emo === e.id ? 1.05 : 1 }} transition={{ type: "spring", stiffness: 300, damping: 15, delay: i * 0.06 }} whileHover={reducido ? undefined : { y: -4, rotate: 0 }} whileTap={reducido ? undefined : { scale: 0.94 }} className={`min-h-[72px] rounded-xl border-2 border-ink p-3 text-left ${emo === e.id ? "shadow-[5px_5px_0_#111]" : "shadow-[2px_2px_0_#111]"}`} style={{ background: e.gradiente }}>
                <span className="block font-abril text-lg text-ink">{e.nombre}{emo === e.id && " ✦"}</span>
                <span className="block text-xs font-medium text-ink/90">{e.descripcion}</span>
              </motion.button>
            ))}
          </div>
          {emo && <p className="text-xs text-ink/70">Tu fanzine arrancará con la paleta, los stickers y la frase de ejemplo de «{EMOCIONES[emo].nombre}».</p>}
        </section>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-ink bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-xl"><Button block disabled={!puede} onClick={crear}>Crear mi fanzine</Button></div>
      </div>
    </Pagina>
  );
}
void Chip;
