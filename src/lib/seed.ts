import type { Cancion, Contacto, Emocion, Fanzine, Notificacion } from "./types";
import { plantillaPaneles } from "./emotions";

export const GENEROS = ["Pop", "Rock", "Indie", "Feels", "Hip hop", "Electrónica", "Latino", "Jazz"] as const;

type SeedSong = Cancion & { genero: string };
const mk = (titulo: string, artista: string, genero: string): SeedSong => ({
  titulo,
  artista,
  genero,
  caratulaUrl: "",
  enlace: `https://music.apple.com/search?term=${encodeURIComponent(titulo + " " + artista)}`,
});
export const CATALOGO: SeedSong[] = [
  mk("Earrings", "Malcolm Todd", "Indie"),
  mk("Dreams", "Fleetwood Mac", "Rock"),
  mk("Motomami", "Rosalía", "Latino"),
  mk("Kind of Blue", "Miles Davis", "Jazz"),
  mk("Heat Waves", "Glass Animals", "Indie"),
  mk("Blinding Lights", "The Weeknd", "Pop"),
  mk("Creep", "Radiohead", "Rock"),
  mk("Bichota", "Karol G", "Latino"),
  mk("Vampire", "Olivia Rodrigo", "Pop"),
  mk("Motion Sickness", "Phoebe Bridgers", "Feels"),
  mk("Lovefool", "The Cardigans", "Pop"),
  mk("Time", "Pink Floyd", "Rock"),
  mk("Nights", "Frank Ocean", "Feels"),
  mk("Pynk", "Janelle Monáe", "Hip hop"),
  mk("Strobe", "deadmau5", "Electrónica"),
  mk("Cariño", "Los Ángeles Azules", "Latino"),
];

const AUTORES = ["luna.zine", "sofi_recorta", "dj.nube", "tati.g", "mora.collage", "pipe.cassette", "kaleido", "ro.papel", "estrella_dia", "vin.ilo"];
const EMOS: Emocion[] = ["tranquilidad", "amor", "ansiedad", "motivacion", "tristeza", "alegria"];

let cache: Fanzine[] | null = null;
export function fanzinesDePrueba(): Fanzine[] {
  if (cache) return cache;
  const list: Fanzine[] = [];
  for (let i = 0; i < 48; i++) {
    const c = CATALOGO[(i * 7 + 3) % CATALOGO.length];
    const emocion = EMOS[(i * 5 + 2) % 6];
    let n = 0;
    const idGen = () => `s${i}-${n++}`;
    const autor = AUTORES[i % AUTORES.length];
    list.push({
      id: `demo-${i}`,
      autorId: `u-${autor}`,
      autorNombre: autor,
      cancion: c,
      emocion,
      paneles: plantillaPaneles(emocion, c, 100 + i * 13, idGen),
      visibilidad: "publico",
      creadoEn: new Date(2026, 9, 1 + (i % 28)).toISOString(),
      likes: 12 + ((i * 37) % 240),
    });
  }
  cache = list;
  return list;
}
export const esAmigo = (f: Fanzine) => f.autorId.length % 2 === 0 || /luna|tati|sofi/.test(f.autorNombre);

export const CONTACTOS: Contacto[] = [
  { id: "c1", nombre: "Sofi", handle: "@sofi_recorta", tipo: "contacto" },
  { id: "c2", nombre: "Luna", handle: "@luna.zine", tipo: "contacto" },
  { id: "c3", nombre: "Pipe", handle: "@pipe.cassette", tipo: "contacto" },
  { id: "c4", nombre: "Mora", handle: "@mora.collage", tipo: "contacto" },
  { id: "g1", nombre: "Mi parche", handle: "grupo · 6 personas", tipo: "grupo" },
  { id: "g2", nombre: "Playlist del cuarto", handle: "grupo · 3 personas", tipo: "grupo" },
];

export const NOTIFS_INICIALES: Notificacion[] = [
  { id: "n1", texto: "Bienvenida a Mixzine. Elige una canción y arma tu primer fanzine.", fecha: new Date().toISOString(), leida: false, tipo: "sistema" },
  { id: "n2", texto: "@luna.zine le dio like a un fanzine de la comunidad que sigues.", fecha: new Date(Date.now() - 3600e3).toISOString(), leida: false, tipo: "like" },
];
