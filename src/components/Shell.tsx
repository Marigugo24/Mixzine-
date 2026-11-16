"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useApp, useListo } from "@/lib/store";
import { Icon } from "./ui";

const ITEMS = [
  { href: "/inicio", n: "home", t: "Inicio" },
  { href: "/explorar", n: "search", t: "Explorar" },
  { href: "/crear", n: "plus", t: "Crear", mas: true },
  { href: "/notificaciones", n: "bell", t: "Notificaciones" },
  { href: "/perfil", n: "user", t: "Perfil" },
] as const;

export function useGuardia() {
  const router = useRouter();
  const listo = useListo();
  const user = useApp((s) => s.user);
  useEffect(() => {
    if (listo && !user) router.replace("/");
  }, [listo, user, router]);
  return listo && !!user;
}

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const ok = useGuardia();
  const reducido = useReducedMotion();
  const sinLeer = useApp((s) => s.notifs.filter((n) => !n.leida).length);
  const activo = (h: string) => path === h || path.startsWith(h + "/");
  if (!ok) return <div className="grid min-h-dvh place-items-center bg-paper" aria-busy><img src="/brand/star.webp" alt="Cargando" className="h-14 w-14 animate-spin" style={{ animationDuration: "1.6s" }} /></div>;
  return (
    <div className="min-h-dvh lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col gap-2 border-r-2 border-ink bg-white p-4 text-ink lg:flex">
        <Link href="/inicio" aria-label="Mixzine, inicio" className="mb-4 block"><motion.img whileHover={{ rotate: -3, scale: 1.05 }} src="/brand/wordmark.webp" alt="mixzine" className="w-44" /></Link>
        <nav aria-label="Principal" className="flex flex-col gap-1">
          {ITEMS.map((it) => (
            <Link key={it.href} href={it.href} aria-current={activo(it.href) ? "page" : undefined} className={`relative flex min-h-[48px] items-center gap-3 rounded-full px-4 font-bold ${"mas" in it ? "mt-2 bg-yellow-400 text-ink border-2 border-ink" : activo(it.href) ? "text-ink" : ""}`}>
              {activo(it.href) && !("mas" in it) && <motion.span layoutId="nav-lado" className="absolute inset-0 rounded-full bg-yellow-400 border-2 border-ink" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
              <span className="relative flex items-center gap-3"><Icon n={it.n} size={22} /> {it.t}</span>
              {it.href === "/notificaciones" && sinLeer > 0 && <span className="relative ml-auto rounded-full bg-yellow-400 border border-ink px-2 text-xs text-ink">{sinLeer}</span>}
            </Link>
          ))}
        </nav>
        <Link href="/pliego" className="mt-auto rounded-xl border-2 border-ink bg-white p-3 text-sm font-bold hover:bg-yellow-400">Editor de pliego A4 →</Link>
      </aside>
      <div className="pb-28 lg:pb-8">{children}</div>
      <nav aria-label="Principal" className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink bg-white pb-[env(safe-area-inset-bottom)] text-ink lg:hidden">
        <ul className="mx-auto flex max-w-xl items-center justify-around px-1">
          {ITEMS.map((it) => (
            <li key={it.href}>
              <Link href={it.href} aria-label={it.t} aria-current={activo(it.href) ? "page" : undefined} className={`relative flex h-14 min-w-[60px] flex-col items-center justify-center text-[11px] font-bold ${activo(it.href) && !("mas" in it) ? "text-ink" : ""}`}>
                {"mas" in it ? (
                  <motion.span whileHover={reducido ? undefined : { rotate: 90, scale: 1.1 }} whileTap={reducido ? undefined : { scale: 0.88 }} transition={{ type: "spring", stiffness: 400, damping: 14 }} className="-mt-5 flex h-14 w-14 items-center justify-center rounded-full border-2 border-ink bg-yellow-400 text-ink shadow-[3px_3px_0_#E5348C]">
                    <Icon n="plus" size={30} />
                  </motion.span>
                ) : (
                  <>
                    {activo(it.href) && <motion.span layoutId="nav-abajo" className="absolute inset-x-1.5 inset-y-1.5 rounded-2xl bg-yellow-400 border-2 border-ink" transition={{ type: "spring", stiffness: 420, damping: 28 }} />}
                    <motion.span className="relative flex flex-col items-center" animate={activo(it.href) && !reducido ? { y: [0, -5, 0] } : {}} transition={{ duration: 0.35 }}>
                      <Icon n={it.n} size={22} fill={activo(it.href) && it.n === "home"} />
                      {it.t === "Notificaciones" ? "Avisos" : it.t}
                    </motion.span>
                  </>
                )}
                {it.href === "/notificaciones" && sinLeer > 0 && <span className="absolute right-3 top-1.5 h-2.5 w-2.5 rounded-full bg-yellow-400 border border-ink ring-2 ring-white" aria-label={`${sinLeer} sin leer`} />}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
