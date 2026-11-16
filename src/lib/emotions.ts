import type { Cancion, Elemento, Emocion, Fanzine, Panel, PanelClave, TextoDatos, Usuario } from "./types";
import { PANEL_CLAVES, PANEL_H, PANEL_W } from "./types";
import { PALETA, STICKER_MAP } from "./assets";
import { layoutTexto } from "./text";

export type EmocionDef = {
  id: Emocion;
  nombre: string;
  descripcion: string;
  papeles: string[];
  acento: string;
  stickers: string[];
  frases: string[];
  gradiente: string;
};

export const EMOCIONES: Record<Emocion, EmocionDef> = {
  tranquilidad: {
    id: "tranquilidad",
    nombre: "Tranquilidad",
    descripcion: "Respirar hondo, bajar el volumen del mundo",
    papeles: ["celeste", "hoja", "lila-liquido"],
    acento: PALETA.blue600,
    stickers: ["luna", "flor", "destello"],
    frases: ["respirar despacio", "todo está bien por tres minutos", "suena a domingo"],
    gradiente: "linear-gradient(135deg,#BFE3F5,#C9B8F0)",
  },
  amor: {
    id: "amor",
    nombre: "Amor",
    descripcion: "Una canción con nombre y apellido",
    papeles: ["rosa-arrugado", "halftone", "hoja"],
    acento: PALETA.pink500,
    stickers: ["corazon", "cinta-rosa", "flor"],
    frases: ["te la mando porque eres tú", "esta suena a ti", "dos audífonos, una canción"],
    gradiente: "linear-gradient(135deg,#F59AC4,#E5348C)",
  },
  ansiedad: {
    id: "ansiedad",
    nombre: "Ansiedad",
    descripcion: "Mil pensamientos y un solo estribillo",
    papeles: ["reticula", "morado", "cuaderno"],
    acento: PALETA.yellow400,
    stickers: ["rayo", "estrella-trazo", "flecha"],
    frases: ["mil pensamientos, una canción", "ruido por dentro, ruido por fuera", "no me sueltes el play"],
    gradiente: "linear-gradient(135deg,#2F5BC9,#5B3C9A)",
  },
  motivacion: {
    id: "motivacion",
    nombre: "Motivación",
    descripcion: "Subir el volumen y salir por la puerta",
    papeles: ["amarillo", "halftone", "rosa-arrugado"],
    acento: PALETA.pink500,
    stickers: ["estrella-amarilla", "rayo", "flecha"],
    frases: ["hoy sí", "play y a la calle", "esta me levanta"],
    gradiente: "linear-gradient(135deg,#F7E34A,#F59AC4)",
  },
  tristeza: {
    id: "tristeza",
    nombre: "Tristeza",
    descripcion: "Llorar bonito con audífonos puestos",
    papeles: ["morado", "lila-liquido", "celeste"],
    acento: PALETA.lilac300,
    stickers: ["luna", "nota", "estrella-trazo"],
    frases: ["llorar bonito", "esta me parte en dos", "guardada para los días grises"],
    gradiente: "linear-gradient(135deg,#5B3C9A,#C9B8F0)",
  },
  alegria: {
    id: "alegria",
    nombre: "Alegría",
    descripcion: "Bailar sola en el cuarto",
    papeles: ["halftone", "rosa-arrugado", "amarillo"],
    acento: PALETA.pink500,
    stickers: ["carita", "estrella-rosa", "destello"],
    frases: ["bailando sola en mi cuarto", "esta no se puede escuchar quieta", "sonrisa a todo volumen"],
    gradiente: "linear-gradient(135deg,#FBD9E8,#F7E34A)",
  },
};
export const LISTA_EMOCIONES = Object.values(EMOCIONES);

export const uid = () => Math.random().toString(36).slice(2, 10);

function rngSeed(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

type TxtOpts = Partial<TextoDatos> & { rot?: number };
function txt(id: () => string, x: number, y: number, ancho: number, texto: string, o: TxtOpts = {}): Elemento {
  const datos: TextoDatos = {
    texto,
    fuente: o.fuente ?? "ui",
    tam: o.tam ?? 4,
    color: o.color ?? PALETA.ink,
    alin: o.alin ?? "left",
    fondo: o.fondo ?? "etiqueta",
    opacidad: 1,
  };
  const L = layoutTexto(datos, ancho);
  return { id: id(), tipo: "texto", x, y, ancho, alto: L.alto, rotacion: o.rot ?? 0, z: 0, datos: datos as unknown as Record<string, unknown> };
}
function stk(id: () => string, sid: string, x: number, y: number, ancho: number, rot = 0): Elemento {
  const d = STICKER_MAP[sid];
  return { id: id(), tipo: "sticker", x, y, ancho, alto: ancho / (d?.aspecto ?? 1), rotacion: rot, z: 0, datos: { id: sid, opacidad: 1 } };
}
const zOrden = (els: Elemento[]) => els.map((e, i) => ({ ...e, z: i }));

export function plantillaPaneles(emocion: Emocion, cancion: Cancion, seed = 1, idGen: () => string = uid): Panel[] {
  const E = EMOCIONES[emocion];
  const r = rngSeed(seed);
  const j = (n: number) => (r() - 0.5) * 2 * n;
  const frase = E.frases[Math.floor(r() * E.frases.length)];
  const [s1, s2, s3] = E.stickers;
  const tituloTam = cancion.titulo.length > 18 ? 6.5 : 8.5;
  const P = (clave: PanelClave, papel: string, els: Elemento[]): Panel => ({ clave, fondo: { tipo: "papel", valor: papel }, elementos: zOrden(els) });

  return [
    P("portada", E.papeles[0], [
      stk(idGen, s1, 38 + j(3), 6 + j(2), 30, 10 + j(8)),
      stk(idGen, "cinta-amarilla", 8, 3, 30, -8),
      txt(idGen, 7, 46 + j(2), 60, cancion.titulo, { fuente: "comic", tam: tituloTam, rot: -3 + j(2) }),
      txt(idGen, 10, 74, 46, cancion.artista, { fuente: "type", tam: 3.6, fondo: "papel", rot: 2 }),
      txt(idGen, 9, 90, 40, `una canción · ${E.nombre.toLowerCase()}`, { fuente: "marker", tam: 3.2, fondo: "ninguno", color: E.papeles[0] === "morado" || E.papeles[0] === "reticula" ? PALETA.paper : PALETA.ink }),
    ]),
    P("p1", E.papeles[1], [
      txt(idGen, 7, 12, 58, `Esta canción me hace sentir ${E.nombre.toLowerCase()}.`, { fuente: "comic", tam: 6.2, rot: -2 }),
      stk(idGen, s2, 38, 58, 28, 12 + j(6)),
      txt(idGen, 8, 84, 52, frase, { fuente: "marker", tam: 4, fondo: "papel", rot: 2 }),
    ]),
    P("p2", E.papeles[2], [
      stk(idGen, "cinta-rosa", 22, 2, 32, 4),
      txt(idGen, 8, 18, 56, "¿Dónde estabas cuando la escuchaste por primera vez?", { fuente: "type", tam: 4, fondo: "papel", rot: -1.5 }),
      txt(idGen, 10, 52, 54, "Escribe aquí tu recuerdo.", { fuente: "marker", tam: 4.4, fondo: "etiqueta", rot: 1.5 }),
      stk(idGen, s3, 4, 78, 24, -12),
    ]),
    P("p3", E.papeles[0], [
      stk(idGen, "estrella-amarilla", 44, 8, 22, 14),
      txt(idGen, 7, 30, 58, "Lo que me recuerda", { fuente: "comic", tam: 7, rot: -2 }),
      txt(idGen, 9, 56, 54, "una persona · un lugar · un olor", { fuente: "type", tam: 3.6, fondo: "papel", rot: 1 }),
      stk(idGen, "subrayado", 8, 49, 52, 0),
    ]),
    P("p4", E.papeles[1], [
      stk(idGen, "papel-rasgado", 6, 14, 60, -3),
      txt(idGen, 12, 28, 48, "El verso que no me suelta:", { fuente: "type", tam: 3.8, fondo: "ninguno", rot: -3 }),
      txt(idGen, 12, 50, 48, "(escríbelo con tus palabras)", { fuente: "marker", tam: 3.6, fondo: "ninguno", rot: -3 }),
      stk(idGen, "nota", 46, 74, 22, 10),
    ]),
    P("p5", E.papeles[2], [
      txt(idGen, 7, 10, 50, "Para ti, porque…", { fuente: "comic", tam: 7.2, rot: 2 }),
      txt(idGen, 9, 40, 56, "Quiero que la escuches pensando en esto.", { fuente: "ui", tam: 3.6, fondo: "etiqueta", rot: -1.5 }),
      stk(idGen, s1, 6, 70, 26, -8),
    ]),
    P("p6", E.papeles[0], [
      txt(idGen, 8, 14, 56, `tracklist\n01  ${cancion.titulo}\n    ${cancion.artista}`, { fuente: "type", tam: 3.6, fondo: "papel", rot: -1 }),
      stk(idGen, "vinilo", 36, 58, 34, 0),
      stk(idGen, "cinta-amarilla", 4, 80, 28, 12),
    ]),
    P("contraportada", E.papeles[1], [
      stk(idGen, "marca-wordmark", 8, 36, 58, -3),
      txt(idGen, 14, 52, 46, "hecho con mixzine", { fuente: "marker", tam: 3.8, fondo: "ninguno", alin: "center", rot: 2 }),
      stk(idGen, "marca-estrella", 30, 70, 16, 10),
    ]),
  ];
}

export function crearFanzine(emocion: Emocion, cancion: Cancion, autor: Usuario | null): Fanzine {
  return {
    id: uid() + uid(),
    autorId: autor?.id ?? "anon",
    autorNombre: autor?.handle ?? "tú",
    cancion,
    emocion,
    paneles: plantillaPaneles(emocion, cancion, Math.floor(Math.random() * 1e6)),
    visibilidad: "privado",
    creadoEn: new Date().toISOString(),
    borrador: true,
  };
}

export const PANEL_ORDEN = PANEL_CLAVES;
export { PANEL_W, PANEL_H };
