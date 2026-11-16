"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, TopBar } from "@/components/ui";
import { Pagina } from "@/components/deco";
import { api, ApiError } from "@/lib/api";
import { toast } from "@/lib/store";

function Contenido() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");
  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw !== pw2) return setError("Las contraseñas no coinciden");
    setOcupado(true);
    setError("");
    try {
      await api("/api/auth/restablecer", { method: "POST", json: { token, password: pw } });
      toast("Contraseña cambiada. Ya puedes entrar.");
      router.replace("/registro");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No pudimos conectar. Revisa tu internet.");
      setOcupado(false);
    }
  };
  return (
    <Pagina tono="naranja">
      <TopBar titulo="Nueva contraseña" atras onAtras={() => router.push("/registro")} />
      <div className="mx-auto max-w-sm space-y-5 px-5 py-8">
        {!token ? (
          <div className="rounded-2xl border-2 border-ink bg-white p-5 shadow-paper">
            <p className="font-abril text-2xl">Enlace incompleto</p>
            <p className="mt-2 text-sm">Abre el enlace completo que te enviamos o <Link href="/olvide" className="font-semibold underline">pide uno nuevo</Link>.</p>
          </div>
        ) : (
          <form onSubmit={enviar} className="space-y-5">
            <label className="block text-sm font-semibold">
              Nueva contraseña <span className="font-normal opacity-75">(mínimo 8)</span>
              <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} required minLength={8} autoComplete="new-password" className="mt-1 h-12 w-full rounded-xl border-2 border-ink bg-white px-4 text-[15px]" />
            </label>
            <label className="block text-sm font-semibold">
              Repítela
              <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} required minLength={8} autoComplete="new-password" className="mt-1 h-12 w-full rounded-xl border-2 border-ink bg-white px-4 text-[15px]" />
            </label>
            {error && (
              <p role="alert" className="rounded-lg border-2 border-ink bg-white p-3 text-sm font-semibold">
                {error} {error.includes("venció") && <Link href="/olvide" className="underline">Pedir otro</Link>}
              </p>
            )}
            <Button type="submit" loading={ocupado} disabled={!pw || !pw2} block>Guardar contraseña</Button>
          </form>
        )}
      </div>
    </Pagina>
  );
}
export default function Restablecer() {
  return (
    <Suspense>
      <Contenido />
    </Suspense>
  );
}
