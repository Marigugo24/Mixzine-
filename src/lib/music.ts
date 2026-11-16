import type { Cancion } from "./types";
import { CATALOGO } from "./seed";
import { useBackend } from "./api";

type Itunes = { trackName: string; artistName: string; artworkUrl100: string; trackViewUrl: string; previewUrl?: string; primaryGenreName?: string };

export async function buscarCanciones(q: string, signal?: AbortSignal): Promise<{ items: Cancion[]; fuente: "spotify" | "itunes" | "local" }> {
  const term = q.trim();
  if (!term) return { items: [], fuente: "local" };
  // 1) Spotify por el servidor (las credenciales nunca llegan al navegador)
  if (useBackend.getState().config.spotifyBusqueda) {
    try {
      const r = await fetch(`/api/spotify/search?q=${encodeURIComponent(term)}`, { signal });
      if (r.ok) {
        const j = (await r.json()) as { items: Cancion[] };
        if (j.items.length) return { fuente: "spotify", items: j.items };
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") throw e;
    }
  }
  // 2) iTunes (con previews de 30 s) y 3) catálogo local sin conexión
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=song&limit=12&country=CO`;
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error("itunes");
    const json = (await res.json()) as { results: Itunes[] };
    return {
      fuente: "itunes",
      items: json.results.map((r) => ({
        titulo: r.trackName,
        artista: r.artistName,
        caratulaUrl: r.artworkUrl100.replace("100x100", "300x300"),
        enlace: r.trackViewUrl,
        previewUrl: r.previewUrl,
        genero: r.primaryGenreName,
      })),
    };
  } catch (e) {
    if ((e as Error).name === "AbortError") throw e;
    const t = term.toLowerCase();
    return { fuente: "local", items: CATALOGO.filter((c) => (c.titulo + " " + c.artista).toLowerCase().includes(t)) };
  }
}

let audio: HTMLAudioElement | null = null;
let onEnd: (() => void) | null = null;
export function reproducir(url: string, fin: () => void) {
  detener();
  audio = new Audio(url);
  onEnd = fin;
  audio.addEventListener("ended", fin);
  void audio.play().catch(fin);
}
export function detener() {
  if (audio) {
    audio.pause();
    if (onEnd) audio.removeEventListener("ended", onEnd);
  }
  audio = null;
  onEnd?.();
  onEnd = null;
}
export function progreso() {
  return audio && audio.duration ? audio.currentTime / audio.duration : 0;
}
