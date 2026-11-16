"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button, Icon, Segmentado, TopBar, cop } from "@/components/ui";
import { Blobs, Etiqueta, Ransom, Estrella, Decoracion } from "@/components/deco";
import { motion } from "framer-motion";
import { toast as t2, useApp, usePremium } from "@/lib/store";
import { api, ApiError, useBackend } from "@/lib/api";
import { refrescarPremium, type EstadoPremium } from "@/lib/sync";

const PLANES = {
  mensual: { precio: 9900, unidad: "al mes", nota: "Pagas un mes; sin cobros automáticos" },
  anual: { precio: 79900, unidad: "al año", nota: "33 % menos que pagar 12 meses" },
} as const;

function Contenido() {
  const [plan, setPlan] = useState<"mensual" | "anual">("anual");
  const router = useRouter();
  const volver = useSearchParams().get("volver");
  const premium = usePremium();
  const actual = useApp((s) => s.premium);
  const activar = useApp((s) => s.activarPlan);
  const cancelar = useApp((s) => s.cancelarPlan);
  const conCuenta = useApp((s) => s.remoto);
  const backendOn = useBackend((s) => s.estado === "on");
  const remoto = conCuenta && backendOn;
  const [srv, setSrv] = useState<EstadoPremium | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const sp = useSearchParams();
  const txId = sp.get("id");
  useEffect(() => {
    if (!remoto) return;
    let vivo = true;
    (async () => {
      if (txId) {
        // volvimos de Wompi: se confirma el pago con el servidor y se limpia la URL
        const r = await api<{ estado: string }>("/api/premium/verificar", { method: "POST", json: { id: txId } }).catch(() => null);
        t2(r?.estado === "aprobado" ? "¡Pago aprobado! Ya tienes Premium" : r?.estado === "pendiente" ? "Tu pago está pendiente de confirmación" : r ? "El pago no se completó" : "No pudimos confirmar el pago aún");
        router.replace("/planes");
      }
      const e = await refrescarPremium();
      if (vivo) setSrv(e);
    })();
    return () => {
      vivo = false;
    };
  }, [remoto, txId, router]);
  const pagar = async () => {
    setOcupado(true);
    try {
      const r = await api<{ url: string }>("/api/premium/checkout", { method: "POST", json: { plan } });
      window.location.href = r.url;
    } catch (e) {
      t2(e instanceof ApiError ? e.message : "No pudimos abrir el pago");
      setOcupado(false);
    }
  };
  const probar = async () => {
    setOcupado(true);
    try {
      await api("/api/premium/prueba", { method: "POST" });
      setSrv(await refrescarPremium());
      t2("¡Prueba de 7 días activada!");
      router.push(volver ?? "/perfil");
    } catch (e) {
      t2(e instanceof ApiError ? e.message : "No pudimos activar la prueba");
    } finally {
      setOcupado(false);
    }
  };
  const fin = actual ? new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "long" }).format(new Date(actual.hasta ?? actual.finPrueba)) : "";
  return (
    <div className="relative isolate min-h-dvh">
      <Blobs />
      <Decoracion items={[{ src: "/collage/diamante.webp", w: 100, x: "70%", y: "60%", rot: 10, v: 0.14, modo: "late" }, { src: "/collage/disco.webp", w: 56, x: "6%", y: "70%", rot: 0, v: 0.2, modo: "pendulo" }]} />
      <TopBar titulo="Planes" atras />
      <div className="relative mx-auto max-w-xl space-y-5 px-4 pb-32 pt-6">
        <Estrella size={56} color="#F7E34A" className="-right-1 top-2" />
        <div className="text-center">
          <h2 className="font-serif text-5xl italic text-white drop-shadow-[2px_2px_0_#111]">Premium</h2>
          <div className="mt-2"><Etiqueta color="yellow" rot={-2}>7 días gratis · sin cobros automáticos</Etiqueta></div>
        </div>
        {premium && actual ? (
          <div className="rounded-2xl border-2 border-ink bg-white p-5 shadow-paper">
            <p className="font-semibold">Tienes Premium ({actual.plan}).</p>
            <p className="text-sm text-ink/75">{remoto ? `Premium activo hasta el ${fin}.` : `Tu prueba gratuita termina el ${fin}.`}</p>
            {remoto ? (
              srv?.pagos && <Button className="mt-4" loading={ocupado} onClick={pagar}>Añadir {plan === "anual" ? "un año" : "un mes"} ({cop(PLANES[plan].precio)})</Button>
            ) : (
              <Button variant="soft" className="mt-4" onClick={() => { cancelar(); t2("Plan cancelado"); }}>Cancelar plan</Button>
            )}
            {remoto && <p className="mt-2 text-xs text-ink/70">Cada pago suma tiempo a tu Premium. No hay cobros automáticos.</p>}
          </div>
        ) : (
          <>
            <Segmentado etiqueta="Tipo de plan" valor={plan} onChange={setPlan} opciones={[{ id: "mensual", nombre: "Mensual" }, { id: "anual", nombre: "Anual" }]} />
            <ul className="grid gap-4 sm:grid-cols-2">
              {(Object.keys(PLANES) as (keyof typeof PLANES)[]).map((k) => {
                const p = PLANES[k];
                const on = plan === k;
                return (
                  <motion.li key={k} whileHover={{ y: -5, rotate: k === "anual" ? 1 : -1 }}>
                    <button type="button" onClick={() => setPlan(k)} aria-pressed={on} className={`relative w-full rounded-2xl border-2 border-ink p-5 text-left transition ${on ? "bg-pink-100 shadow-paper" : "bg-white"}`}>
                      {k === "anual" && <span className="absolute -top-3 right-3 rounded-full border-2 border-ink bg-yellow-400 px-2 text-xs font-bold">-33 %</span>}
                      <span className="block text-sm font-semibold uppercase">{k}</span>
                      <span className="block font-anton text-4xl tracking-wide">{cop(p.precio)}</span>
                      <span className="block text-sm">{p.unidad}</span>
                      <span className="mt-2 block text-xs text-ink/75">{p.nota}</span>
                    </button>
                  </motion.li>
                );
              })}
            </ul>
            <ul className="space-y-2 rounded-2xl border-2 border-ink bg-white p-4 text-sm">
              {["Descarga del pliego en PDF listo para imprimir", "Paquetes de stickers cromados y retro", "Prueba gratuita de 7 días"].map((x) => (
                <li key={x} className="flex gap-2"><Icon n="check" size={18} className="text-pink-500" /> {x}</li>
              ))}
            </ul>
            {remoto ? (
              <div className="space-y-3">
                {srv && !srv.pruebaUsada && <Button block loading={ocupado} onClick={probar}>Probar 7 días gratis</Button>}
                {srv?.pagos ? (
                  <Button block variant={srv.pruebaUsada ? "primary" : "soft"} loading={ocupado} onClick={pagar}>Pagar plan {plan} · {cop(PLANES[plan].precio)}</Button>
                ) : srv ? (
                  <p className="rounded-xl border-2 border-ink bg-white p-3 text-center text-sm font-semibold">Los pagos se habilitarán pronto.</p>
                ) : null}
              </div>
            ) : (
              <Button block onClick={() => { activar(plan); t2("¡Prueba de 7 días activada!"); router.push(volver ?? "/perfil"); }}>Continuar</Button>
            )}
            <p className="text-center text-xs font-semibold text-white drop-shadow-[1px_1px_0_#111]">
              {remoto ? "Pagas con tarjeta, PSE o Nequi en Wompi. Sin renovación automática: cada pago suma el periodo elegido." : "Demostración: sin cuenta no se cobra nada."} <Link className="underline" href="/terminos">Términos y condiciones</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
export default function Planes() {
  return <Suspense><Contenido /></Suspense>;
}
