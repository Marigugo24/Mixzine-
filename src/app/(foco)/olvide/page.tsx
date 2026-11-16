"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, TopBar } from "@/components/ui";
import { Pagina } from "@/components/deco";
import { api, ApiError } from "@/lib/api";

export default function Olvide() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");
  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setOcupado(true);
    setError("");
    try {
      await api("/api/auth/olvide", { method: "POST", json: { email } });
      setEnviado(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No pudimos conectar. Revisa tu internet.");
    } finally {
      setOcupado(false);
    }
  };
  return (
    <Pagina tono="naranja">
      <TopBar titulo="Recuperar acceso" atras onAtras={() => router.push("/registro")} />
      <div className="mx-auto max-w-sm space-y-5 px-5 py-8">
        {enviado ? (
          <div role="status" className="rounded-2xl border-2 border-ink bg-white p-5 shadow-paper">
            <p className="font-abril text-2xl">Revisa tu correo</p>
            <p className="mt-2 text-sm">Si hay una cuenta con <strong>{email}</strong>, te enviamos un enlace para elegir una nueva contraseña. Vale 1 hora. Mira también la carpeta de spam.</p>
            <Button className="mt-4" block onClick={() => router.push("/registro")}>Volver a entrar</Button>
          </div>
        ) : (
          <form onSubmit={enviar} className="space-y-5">
            <p className="text-sm font-semibold">Escribe el correo de tu cuenta y te enviamos un enlace para crear una contraseña nueva.</p>
            <label className="block text-sm font-semibold">
              Correo
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="tu@correo.com" className="mt-1 h-12 w-full rounded-xl border-2 border-ink bg-white px-4 text-[15px]" />
            </label>
            {error && <p role="alert" className="rounded-lg border-2 border-ink bg-white p-3 text-sm font-semibold">{error}</p>}
            <Button type="submit" loading={ocupado} disabled={!email} block>Enviar enlace</Button>
          </form>
        )}
      </div>
    </Pagina>
  );
}
