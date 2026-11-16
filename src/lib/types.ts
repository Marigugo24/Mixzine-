export type Emocion = "tranquilidad" | "amor" | "ansiedad" | "motivacion" | "tristeza" | "alegria";

export type Cancion = {
  titulo: string;
  artista: string;
  caratulaUrl: string;
  enlace: string;
  previewUrl?: string;
  genero?: string;
};

export type ElementoTipo = "texto" | "imagen" | "sticker";

export type Elemento = {
  id: string;
  tipo: ElementoTipo;
  x: number; // mm
  y: number; // mm
  ancho: number; // mm
  alto: number; // mm
  rotacion: number; // grados
  z: number;
  datos: Record<string, unknown>;
};

export type PanelClave = "portada" | "p1" | "p2" | "p3" | "p4" | "p5" | "p6" | "contraportada";

export type Fondo = { tipo: "color" | "papel" | "imagen"; valor: string };

export type Panel = {
  clave: PanelClave;
  fondo: Fondo;
  elementos: Elemento[];
};

export type Visibilidad = "privado" | "enlace" | "publico";

export type Fanzine = {
  id: string;
  autorId: string;
  autorNombre: string;
  cancion: Cancion;
  emocion: Emocion;
  paneles: Panel[]; // siempre 8
  visibilidad: Visibilidad;
  creadoEn: string;
  borrador?: boolean;
  likes?: number;
  mensaje?: string;
};

export const PANEL_W = 74.25;
export const PANEL_H = 105;
export const SHEET_W = 297;
export const SHEET_H = 210;

export const PANEL_CLAVES: PanelClave[] = ["portada", "p1", "p2", "p3", "p4", "p5", "p6", "contraportada"];
export const PANEL_NOMBRES: Record<PanelClave, string> = {
  portada: "Portada",
  p1: "Página 1",
  p2: "Página 2",
  p3: "Página 3",
  p4: "Página 4",
  p5: "Página 5",
  p6: "Página 6",
  contraportada: "Contraportada",
};

/** Imposición de la hoja A4: fila superior girada 180°. */
export const IMPOSICION: { fila: 0 | 1; col: number; clave: PanelClave; girada: boolean }[] = [
  { fila: 0, col: 0, clave: "p4", girada: true },
  { fila: 0, col: 1, clave: "p3", girada: true },
  { fila: 0, col: 2, clave: "p2", girada: true },
  { fila: 0, col: 3, clave: "p1", girada: true },
  { fila: 1, col: 0, clave: "p5", girada: false },
  { fila: 1, col: 1, clave: "p6", girada: false },
  { fila: 1, col: 2, clave: "contraportada", girada: false },
  { fila: 1, col: 3, clave: "portada", girada: false },
];

export type TextoDatos = {
  texto: string;
  fuente: "ui" | "type" | "marker" | "comic";
  tam: number; // mm
  color: string;
  alin: "left" | "center" | "right";
  fondo: "etiqueta" | "papel" | "ninguno";
  opacidad?: number;
};
export type ImagenDatos = {
  src: string;
  filtro: "none" | "grano" | "duotono";
  rasgado: boolean;
  opacidad?: number;
  aspecto: number;
};
export type StickerDatos = { id: string; opacidad?: number };

export type Usuario = { id: string; nombre: string; foto?: string; handle: string };
export type Contacto = { id: string; nombre: string; handle: string; tipo: "contacto" | "grupo" };
export type Notificacion = { id: string; texto: string; fecha: string; leida: boolean; tipo: "like" | "recibido" | "sistema" };
