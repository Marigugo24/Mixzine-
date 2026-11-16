let token: { v: string; exp: number } | null = null;

export const spotifyConfigurado = () => !!(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET);

/** Client Credentials: no requiere que el usuario inicie sesión (búsqueda pública). */
export async function tokenApp(): Promise<string> {
  if (token && Date.now() < token.exp - 30_000) return token.v;
  const basic = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString("base64");
  const r = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`spotify token ${r.status}`);
  const j = (await r.json()) as { access_token: string; expires_in: number };
  token = { v: j.access_token, exp: Date.now() + j.expires_in * 1000 };
  return token.v;
}

export type SpTrack = { name: string; artists: { name: string }[]; album: { images: { url: string; width: number }[] }; external_urls: { spotify: string }; preview_url: string | null };
export async function buscarSpotify(q: string) {
  const t = await tokenApp();
  const r = await fetch(`https://api.spotify.com/v1/search?type=track&limit=10&market=CO&q=${encodeURIComponent(q)}`, { headers: { Authorization: `Bearer ${t}` }, cache: "no-store" });
  if (r.status === 401) token = null;
  if (!r.ok) throw new Error(`spotify search ${r.status} ${(await r.text()).slice(0, 200)}`);
  const j = (await r.json()) as { tracks: { items: SpTrack[] } };
  return j.tracks.items.map((s) => ({
    titulo: s.name,
    artista: s.artists.map((a) => a.name).join(", "),
    caratulaUrl: (s.album.images.find((i) => i.width <= 400 && i.width >= 250) ?? s.album.images[0])?.url ?? "",
    enlace: s.external_urls.spotify,
    previewUrl: s.preview_url ?? undefined, // Spotify ya no entrega previews a la mayoría de apps nuevas
  }));
}

export function redirectUri(req: Request) {
  if (process.env.SPOTIFY_REDIRECT_URI) return process.env.SPOTIFY_REDIRECT_URI;
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || (host?.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}/api/auth/spotify/callback`;
}


type Itunes = { trackName: string; artistName: string; artworkUrl100: string; trackViewUrl: string; previewUrl?: string; primaryGenreName?: string };
/** Respaldo: iTunes consultado desde el servidor (no depende de la red ni del navegador de la persona). */
export async function buscarItunes(q: string) {
  const r = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=song&limit=12&country=CO`, { cache: "no-store" });
  if (!r.ok) throw new Error(`itunes ${r.status}`);
  const j = (await r.json()) as { results: Itunes[] };
  return j.results.map((x) => ({
    titulo: x.trackName,
    artista: x.artistName,
    caratulaUrl: x.artworkUrl100.replace("100x100", "300x300"),
    enlace: x.trackViewUrl,
    previewUrl: x.previewUrl,
    genero: x.primaryGenreName,
  }));
}
