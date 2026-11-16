import { ruta, json, error } from "@/server/http";
import { aplicarTransaccion, eventoValido, type EventoWompi } from "@/server/wompi";

export const runtime = "nodejs";

/** Wompi avisa aquí cada cambio de estado. Configura esta URL en el panel de Wompi → Eventos. */
export const POST = ruta({}, async (req) => {
  let ev: EventoWompi;
  try {
    ev = (await req.json()) as EventoWompi;
  } catch {
    return error("JSON inválido");
  }
  if (!eventoValido(ev, req.headers.get("x-event-checksum"))) return error("Firma inválida", 401);
  const t = ev.data?.transaction;
  if (ev.event === "transaction.updated" && t) await aplicarTransaccion(t);
  return json({ ok: true });
});
