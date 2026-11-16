"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useApp, useListo } from "@/lib/store";
import { Blobs, Chispa, Cinta, Estrella, Etiqueta, Marquee, Papel, Ransom, Recorte } from "@/components/deco";

export default function Bienvenida() {
  const router = useRouter();
  const listo = useListo();
  const user = useApp((s) => s.user);
  const reducido = useReducedMotion();
  useEffect(() => {
    if (listo && user) router.replace("/inicio");
  }, [listo, user, router]);
  return (
    <div className="relative isolate flex min-h-dvh flex-col overflow-hidden">
      <Blobs />
      <h1 className="sr-only">Mixzine. Una canción. Mil formas de sentirla.</h1>

      {/* recortes del collage: se pueden arrastrar */}
      <Recorte src="/collage/cd.webp" w={250} rot={0} delay={0.1} modo="gira" className="z-0 opacity-90" style={{ left: "calc(50% - 125px)", top: "21%" }} />
      <Recorte src="/collage/trompeta.webp" w={92} rot={-8} delay={0.2} arrastrable modo="pendulo" className="left-[3%] top-[3%] z-10" />
      <Recorte src="/collage/globo.webp" w={104} rot={10} delay={0.35} arrastrable modo="gira" className="right-[4%] top-[4%] z-10" />
      <Recorte src="/collage/disco.webp" w={52} rot={0} delay={0.5} arrastrable modo="pendulo" className="left-[42%] top-0 z-10" />
      <Recorte src="/collage/diamante.webp" w={70} rot={-12} delay={0.55} arrastrable modo="late" className="left-[22%] top-[9%] z-10" />
      <Recorte src="/collage/glitter.webp" w={26} rot={14} delay={0.6} modo="pendulo" className="left-[6%] top-[30%] z-10" />
      <Recorte src="/collage/megafono.webp" w={112} rot={-6} delay={0.65} arrastrable modo="late" className="right-[2%] top-[47%] z-10" />
      <Recorte src="/collage/audifonos.webp" w={112} rot={9} delay={0.8} arrastrable modo="pendulo" className="left-[1%] top-[45%] z-10" />
      <Recorte src="/collage/estrella-azul.webp" w={64} rot={14} delay={0.95} arrastrable className="left-[44%] top-[56%] z-10" />
      <Recorte src="/collage/flor-verde.webp" w={70} rot={-10} delay={1.1} arrastrable className="right-[30%] top-[38%] z-10" />
      <Estrella size={70} className="right-[22%] top-[17%]" delay={0.4} />
      <Estrella size={44} color="#F7E34A" className="left-[26%] top-[40%]" delay={0.7} />
      <Estrella size={36} className="left-[8%] top-[30%]" delay={0.9} />
      <Chispa size={34} className="right-[10%] top-[32%]" />
      <Chispa size={24} className="left-[30%] top-[62%]" delay={0.8} />

      <div className="relative z-20 mt-[27dvh] flex flex-1 flex-col items-center px-6 text-center">
        <motion.img
          src="/brand/wordmark.webp"
          alt=""
          aria-hidden
          className="w-[84%] max-w-[420px] drop-shadow-[4px_5px_0_rgba(0,0,0,.3)]"
          initial={reducido ? false : { scale: 0, rotate: -25, y: 60 }}
          animate={{ scale: 1, rotate: -3, y: 0 }}
          transition={{ type: "spring", stiffness: 160, damping: 11, delay: 0.1 }}
          whileHover={reducido ? undefined : { rotate: 3, scale: 1.05 }}
        />
        <div className="relative">
          <Cinta className="-left-2 -top-3" rot={-18} w={70} />
          <Cinta className="-right-2 -top-2" rot={14} w={60} color="rgba(245,154,196,.9)" />
        </div>
        <motion.div className="mt-5" initial={reducido ? false : { opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, type: "spring", stiffness: 140, damping: 14 }}>
          <Etiqueta rot={-2}>Una canción. Mil formas de sentirla.</Etiqueta>
        </motion.div>
      </div>

      <div className="relative z-20 mb-3 flex justify-center px-6">
        <Papel color="#FAF5F2" rot={-2.5} semilla={9} pad="px-5 py-3" className="max-w-[92%]">
          <Ransom texto="recorta pega comparte" size={22} semilla={4} />
        </Papel>
      </div>
      <div className="relative z-20 flex flex-col items-center gap-4 px-6 pb-4">
        <motion.div initial={reducido ? false : { opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1, type: "spring", stiffness: 140, damping: 12 }} className="w-full max-w-sm">
          <motion.div animate={reducido ? undefined : { scale: [1, 1.04, 1] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 2 }}>
            <Link href={user ? "/inicio" : "/registro"} className="block">
              <motion.span whileHover={reducido ? undefined : { y: -3, rotate: -1.5 }} whileTap={reducido ? undefined : { scale: 0.94 }} className="flex min-h-[56px] w-full items-center justify-center rounded-full border-2 border-ink bg-yellow-400 font-anton text-2xl uppercase tracking-wider text-ink shadow-[5px_5px_0_#111]">
                Comenzar ✦
              </motion.span>
            </Link>
          </motion.div>
        </motion.div>
        <p className="text-center text-sm font-semibold text-white drop-shadow-[1px_1px_0_#111]">La música también se comparte en papel.</p>
      </div>
      <Marquee className="relative z-20 pb-[calc(0.375rem+env(safe-area-inset-bottom))]" items={["una canción", "mil formas de sentirla", "recorta · pega · comparte", "la música también se comparte en papel"]} />
    </div>
  );
}
