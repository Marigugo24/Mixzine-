"use client";
import { motion, useReducedMotion } from "framer-motion";

const TIRAS = ["#E5348C", "#F7E34A", "#E8772B", "#3446C8"];

/** Cada cambio de pantalla: tiras de papel de colores cruzan la pantalla y el contenido entra deslizándose. */
export default function Template({ children }: { children: React.ReactNode }) {
  const reducido = useReducedMotion();
  return (
    <>
      {!reducido && (
        <div aria-hidden className="pointer-events-none fixed inset-0 z-[90] overflow-hidden">
          {TIRAS.map((c, i) => (
            <motion.div
              key={i}
              className="absolute inset-x-[-10%] border-y-2 border-ink"
              style={{ top: `${i * 25}%`, height: "25.5%", background: c, rotate: i % 2 ? 1.2 : -1.2 }}
              initial={{ x: "0%" }}
              animate={{ x: i % 2 ? "-110%" : "110%" }}
              transition={{ duration: 0.45, delay: 0.04 * i, ease: [0.7, 0, 0.3, 1] }}
            />
          ))}
        </div>
      )}
      <motion.div initial={{ opacity: 0, x: reducido ? 0 : 28 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25, delay: reducido ? 0 : 0.18, ease: "easeOut" }}>
        {children}
      </motion.div>
    </>
  );
}
