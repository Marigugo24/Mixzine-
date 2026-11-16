"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/lib/store";
import { Button, Icon, TopBar } from "@/components/ui";
import { reducirAvatar } from "@/lib/imagen";
import { api, ApiError, useBackend } from "@/lib/api";
import { refrescarRemoto, reintentarPendientes } from "@/lib/sync";
import { Pagina, Etiqueta, Recorte } from "@/components/deco";
import type { Usuario } from "@/lib/types";

const ERRORES: Record<string, string> = { spotify: "No pudimos entrar con Spotify. Inténtalo otra vez.", backend: "El servidor no está disponible ahora." };

function Contenido() {
  const router = useRouter();
  const sp = useSearchParams();
  const setUser = useApp((s) => s.setUser);
  const iniciar = useApp((s) => s.iniciarSesionRemota);
  const estado = useBackend((s) => s.estado);
  const cfg = useBackend((s) => s.config);
  const [modo, setModo] = useState<"crear" | "entrar">("crear");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [foto, setFoto] = useState<string | undefined>();
  const [error, setError] = useState(sp.get("error") ? ERRORES[sp.get("error")!] ?? "Algo salió mal." : "");
  const [ocupado, setOcupado] = useState(false);
  const inp = useRef<HTMLInputElement>(null);
  const remoto = estado === "on";

  useEffect(() => {
    if (sp.get("error")) router.replace("/registro");
  }, [sp, router]);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!remoto) {
      if (!nombre.trim()) return;
      setUser(nombre, foto);
      router.replace("/inicio");
      return;
    }
    setOcupado(true);
    try {
      const r = await api<{ user: Usuario }>(modo === "crear" ? "/api/auth/registro" : "/api/auth/login", { method: "POST", json: modo === "crear" ? { email, password: pw, nombre, foto } : { email, password: pw } });
      iniciar(r.user);
      await refrescarRemoto();
      void reintentarPendientes(); // sube lo que ya tenías hecho en este dispositivo
      router.replace("/inicio");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No pudimos conectar. Revisa tu internet.");
    } finally {
      setOcupado(false);
    }
  };

  const crear = modo === "crear";
  return (
    <Pagina tono="naranja">
      <TopBar titulo={remoto && !crear ? "Entrar" : "Crea tu perfil"} atras onAtras={() => router.push("/")} />
      <form className="mx-auto flex max-w-sm flex-col gap-5 px-5 py-8" onSubmit={enviar} noValidate={false}>
        {remoto && (
          <div role="tablist" aria-label="Cuenta" className="flex gap-1 rounded-full border-2 border-ink bg-white p-1">
            {(["crear", "entrar"] as const).map((m) => (
              <button key={m} type="button" role="tab" aria-selected={modo === m} onClick={() => { setModo(m); setError(""); }} className={`min-h-[40px] flex-1 rounded-full text-sm font-bold ${modo === m ? "border-2 border-ink bg-yellow-400" : ""}`}>
                {m === "crear" ? "Crear cuenta" : "Ya tengo cuenta"}
              </button>
            ))}
          </div>
        )}
        {(!remoto || crear) && (
          <div className="flex flex-col items-center gap-2">
            <button type="button" onClick={() => inp.current?.click()} aria-label="Elegir foto de perfil (opcional)" className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 border-ink bg-pink-100 shadow-paper">
              {foto ? <img src={foto} alt="Tu foto de perfil" className="h-full w-full object-cover" /> : <Icon n="image" size={34} />}
            </button>
            <Etiqueta color="yellow" rot={2}>Foto (opcional)</Etiqueta>
            <input ref={inp} type="file" accept="image/*" className="sr-only" aria-label="Foto de perfil" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setFoto(await reducirAvatar(f)); }} />
          </div>
        )}
        {(!remoto || crear) && (
          <label className="block text-sm font-semibold">
            ¿Cómo te llamamos?
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={24} required autoComplete="nickname" placeholder="Tu nombre o apodo" className="mt-1 h-12 w-full rounded-xl border-2 border-ink bg-white px-4 text-[15px]" />
          </label>
        )}
        {remoto && (
          <>
            <label className="block text-sm font-semibold">
              Correo
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="tu@correo.com" className="mt-1 h-12 w-full rounded-xl border-2 border-ink bg-white px-4 text-[15px]" />
            </label>
            <label className="block text-sm font-semibold">
              Contraseña {crear && <span className="font-normal opacity-75">(mínimo 8)</span>}
              <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} required minLength={crear ? 8 : 1} autoComplete={crear ? "new-password" : "current-password"} className="mt-1 h-12 w-full rounded-xl border-2 border-ink bg-white px-4 text-[15px]" />
            </label>
          </>
        )}
        {error && <p role="alert" className="rounded-lg border-2 border-ink bg-white p-3 text-sm font-semibold text-ink">{error}</p>}
        <Button type="submit" loading={ocupado} disabled={remoto ? !email || !pw || (crear && !nombre.trim()) : !nombre.trim()} block>
          {remoto ? (crear ? "Crear mi cuenta" : "Entrar") : "Entrar a Mixzine"}
        </Button>
        {remoto && !crear && cfg.correo && (
          <a href="/olvide" className="-mt-2 text-center text-sm font-semibold underline">¿Olvidaste tu contraseña?</a>
        )}
        {remoto && cfg.spotifyLogin && (
          <a href="/api/auth/spotify" className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border-2 border-ink bg-white px-5 text-[15px] font-bold shadow-[3px_3px_0_#111]">
            <span aria-hidden className="inline-block h-5 w-5 rounded-full bg-[#1DB954]" /> Continuar con Spotify
          </a>
        )}
        <p className="rounded bg-paper/90 p-2 text-center text-xs text-ink">
          {remoto ? "Tu cuenta guarda tus fanzines en la nube para que los abras en cualquier dispositivo." : estado === "cargando" ? "Conectando…" : "Por ahora tu perfil y tus fanzines se guardan solo en este dispositivo."}{" "}
          <a href="/terminos" className="underline">Términos</a>
        </p>
      </form>
      <Recorte src="/collage/audifonos.webp" w={100} rot={-8} delay={0.4} arrastrable className="!fixed -left-3 bottom-4" />
      <Recorte src="/collage/megafono.webp" w={96} rot={8} delay={0.6} arrastrable className="!fixed -right-2 bottom-8" />
    </Pagina>
  );
}
export default function Registro() {
  return (
    <Suspense>
      <Contenido />
    </Suspense>
  );
}
