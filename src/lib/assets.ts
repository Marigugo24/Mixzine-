import { PANEL_H, PANEL_W } from "./types";

export const PALETA = {
  pink500: "#E5348C",
  pink300: "#F59AC4",
  pink100: "#FBD9E8",
  blue600: "#2F5BC9",
  blue200: "#BFE3F5",
  purple700: "#5B3C9A",
  lilac300: "#C9B8F0",
  ink: "#111111",
  paper: "#FAF5F2",
  yellow400: "#F7E34A",
};
export const COLORES_TEXTO = [PALETA.ink, PALETA.paper, PALETA.pink500, PALETA.blue600, PALETA.purple700, PALETA.yellow400];
export const COLORES_FONDO = [PALETA.paper, PALETA.pink500, PALETA.pink300, PALETA.pink100, PALETA.blue600, PALETA.blue200, PALETA.purple700, PALETA.lilac300, PALETA.yellow400, PALETA.ink];

const svg = (inner: string, vb = "0 0 100 100") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${inner}</svg>`;

const star5 = (cx: number, cy: number, R: number, r: number, rot = -90) => {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = ((rot + i * 36) * Math.PI) / 180;
    const rad = i % 2 === 0 ? R : r;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(" ");
};

export type StickerDef = {
  id: string;
  nombre: string;
  premium?: boolean;
  aspecto: number; // ancho/alto
  svg?: string;
  src?: string;
};

const defs: StickerDef[] = [
  { id: "estrella-rosa", nombre: "Estrella rosa", aspecto: 1, svg: svg(`<polygon points="${star5(50, 52, 46, 20)}" fill="${PALETA.pink500}" stroke="#111" stroke-width="3" stroke-linejoin="round"/>`) },
  { id: "estrella-amarilla", nombre: "Estrella cómic", aspecto: 1, svg: svg(`<polygon points="${star5(50, 52, 46, 22)}" fill="${PALETA.yellow400}" stroke="#111" stroke-width="5" stroke-linejoin="round"/>`) },
  { id: "estrella-trazo", nombre: "Estrella a mano", aspecto: 1, svg: svg(`<polygon points="${star5(50, 52, 44, 19)}" fill="none" stroke="#111" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" stroke-dasharray="none"/><polygon points="${star5(52, 54, 44, 19)}" fill="none" stroke="${PALETA.pink500}" stroke-width="2" stroke-linejoin="round"/>`) },
  { id: "estrella-cromada", nombre: "Estrella cromada", premium: true, aspecto: 1, svg: svg(`<defs><linearGradient id="c" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="#F59AC4"/><stop offset=".6" stop-color="#2F5BC9"/><stop offset="1" stop-color="#fff"/></linearGradient></defs><polygon points="${star5(50, 52, 46, 24)}" fill="url(#c)" stroke="#111" stroke-width="2.5" stroke-linejoin="round"/>`) },
  { id: "corazon", nombre: "Corazón", aspecto: 1, svg: svg(`<path d="M50 88 C10 56 6 28 28 20 C40 16 48 24 50 32 C52 24 60 16 72 20 C94 28 90 56 50 88Z" fill="${PALETA.pink500}" stroke="#111" stroke-width="3.5" stroke-linejoin="round"/><path d="M24 34 C26 28 32 26 36 28" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/>`) },
  { id: "corazon-cromado", nombre: "Corazón cromado", premium: true, aspecto: 1, svg: svg(`<defs><linearGradient id="c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".4" stop-color="#BFE3F5"/><stop offset=".55" stop-color="#E5348C"/><stop offset="1" stop-color="#FBD9E8"/></linearGradient></defs><path d="M50 88 C10 56 6 28 28 20 C40 16 48 24 50 32 C52 24 60 16 72 20 C94 28 90 56 50 88Z" fill="url(#c)" stroke="#111" stroke-width="2.5"/>`) },
  { id: "cinta-amarilla", nombre: "Cinta", aspecto: 2.6, svg: svg(`<polygon points="2,10 98,6 96,22 98,38 2,42 5,26" fill="${PALETA.yellow400}" fill-opacity=".85" stroke="#111" stroke-opacity=".25" stroke-width="1"/>`, "0 0 100 48") },
  { id: "cinta-rosa", nombre: "Cinta rosa", aspecto: 2.6, svg: svg(`<polygon points="3,8 97,10 99,24 96,40 4,38 1,24" fill="${PALETA.pink300}" fill-opacity=".9" stroke="#111" stroke-opacity=".25" stroke-width="1"/><g stroke="#fff" stroke-opacity=".5" stroke-width="3"><line x1="20" y1="10" x2="14" y2="38"/><line x1="40" y1="10" x2="34" y2="38"/><line x1="60" y1="10" x2="54" y2="38"/><line x1="80" y1="10" x2="74" y2="38"/></g>`, "0 0 100 48") },
  { id: "papel-rasgado", nombre: "Papel rasgado", aspecto: 1.5, svg: svg(`<polygon points="3,8 18,3 33,9 50,2 66,8 82,3 97,9 94,30 98,52 93,72 97,92 80,97 64,91 48,98 30,92 14,98 4,90 8,70 2,50 7,28" fill="${PALETA.paper}" stroke="#111" stroke-width="1.6" stroke-linejoin="round"/>`) },
  { id: "destello", nombre: "Destello", aspecto: 1, svg: svg(`<path d="M50 4 C54 36 64 46 96 50 C64 54 54 64 50 96 C46 64 36 54 4 50 C36 46 46 36 50 4Z" fill="${PALETA.paper}" stroke="#111" stroke-width="3" stroke-linejoin="round"/>`) },
  { id: "carita", nombre: "Carita", aspecto: 1, svg: svg(`<circle cx="50" cy="50" r="44" fill="${PALETA.yellow400}" stroke="#111" stroke-width="4"/><circle cx="35" cy="42" r="6" fill="#111"/><circle cx="65" cy="42" r="6" fill="#111"/><path d="M28 60 Q50 84 72 60" stroke="#111" stroke-width="5" fill="none" stroke-linecap="round"/>`) },
  { id: "vinilo", nombre: "Vinilo", aspecto: 1, svg: svg(`<circle cx="50" cy="50" r="46" fill="#111"/><circle cx="50" cy="50" r="36" fill="none" stroke="#444" stroke-width="1.5"/><circle cx="50" cy="50" r="28" fill="none" stroke="#444" stroke-width="1.5"/><circle cx="50" cy="50" r="17" fill="${PALETA.pink500}"/><circle cx="50" cy="50" r="3.5" fill="${PALETA.paper}"/><path d="M20 22 A40 40 0 0 1 44 10" stroke="#fff" stroke-opacity=".35" stroke-width="3" fill="none" stroke-linecap="round"/>`) },
  { id: "nota", nombre: "Nota musical", aspecto: 1, svg: svg(`<path d="M38 74 V20 L82 10 V62" fill="none" stroke="#111" stroke-width="6" stroke-linejoin="round"/><ellipse cx="30" cy="76" rx="14" ry="11" fill="${PALETA.purple700}" stroke="#111" stroke-width="4"/><ellipse cx="74" cy="64" rx="14" ry="11" fill="${PALETA.purple700}" stroke="#111" stroke-width="4"/>`) },
  { id: "rayo", nombre: "Rayo", aspecto: 1, svg: svg(`<polygon points="58,4 20,56 46,56 38,96 82,40 54,40" fill="${PALETA.yellow400}" stroke="#111" stroke-width="4" stroke-linejoin="round"/>`) },
  { id: "subrayado", nombre: "Subrayado", aspecto: 3.5, svg: svg(`<path d="M4 20 C20 4 30 34 48 16 S78 6 96 22" fill="none" stroke="${PALETA.pink500}" stroke-width="6" stroke-linecap="round"/>`, "0 0 100 30") },
  { id: "flecha", nombre: "Flecha", aspecto: 1.6, svg: svg(`<path d="M6 40 C30 10 60 70 90 36" fill="none" stroke="#111" stroke-width="5" stroke-linecap="round"/><path d="M72 20 L92 36 L70 52" fill="none" stroke="#111" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`, "0 0 100 62") },
  { id: "flor", nombre: "Flor", aspecto: 1, svg: svg(`<g fill="${PALETA.pink300}" stroke="#111" stroke-width="3"><circle cx="50" cy="22" r="17"/><circle cx="78" cy="42" r="17"/><circle cx="68" cy="74" r="17"/><circle cx="32" cy="74" r="17"/><circle cx="22" cy="42" r="17"/></g><circle cx="50" cy="52" r="15" fill="${PALETA.yellow400}" stroke="#111" stroke-width="3"/>`) },
  { id: "luna", nombre: "Luna", aspecto: 1, svg: svg(`<path d="M66 8 A44 44 0 1 0 92 66 A36 36 0 0 1 66 8Z" fill="${PALETA.lilac300}" stroke="#111" stroke-width="4" stroke-linejoin="round"/>`) },
  { id: "explosion", nombre: "¡Pum!", premium: true, aspecto: 1, svg: svg(`<polygon points="50,2 60,28 88,14 76,40 98,50 74,60 88,86 60,74 50,98 40,74 12,86 26,60 2,50 24,40 12,14 40,28" fill="${PALETA.pink500}" stroke="#111" stroke-width="4" stroke-linejoin="round"/><polygon points="50,20 56,38 72,30 64,46 80,50 64,56 72,72 56,64 50,80 44,64 28,72 36,56 20,50 36,46 28,30 44,38" fill="${PALETA.yellow400}"/>`) },
  { id: "ventana-paint", nombre: "Ventana retro", premium: true, aspecto: 1.3, svg: svg(`<rect x="3" y="3" width="94" height="70" fill="#C0C0C0" stroke="#111" stroke-width="2.5"/><rect x="6" y="6" width="88" height="11" fill="#2F5BC9"/><rect x="82" y="8" width="9" height="7" fill="#C0C0C0" stroke="#111"/><rect x="10" y="22" width="80" height="46" fill="#fff" stroke="#111" stroke-width="1.5"/><path d="M16 56 Q30 30 44 52 T74 40" stroke="${PALETA.pink500}" stroke-width="3" fill="none"/>`, "0 0 100 76") },
  { id: "cursor", nombre: "Cursor", premium: true, aspecto: 0.75, svg: svg(`<polygon points="14,6 14,82 34,64 48,94 62,88 48,58 76,58" fill="#fff" stroke="#111" stroke-width="5" stroke-linejoin="round"/>`) },
  { id: "casete", nombre: "Casete", premium: true, aspecto: 1.6, svg: svg(`<rect x="3" y="3" width="94" height="60" rx="5" fill="${PALETA.paper}" stroke="#111" stroke-width="3"/><rect x="12" y="10" width="76" height="22" rx="3" fill="${PALETA.pink300}" stroke="#111" stroke-width="2"/><circle cx="32" cy="42" r="8" fill="#111"/><circle cx="68" cy="42" r="8" fill="#111"/><rect x="38" y="38" width="24" height="8" fill="#fff" stroke="#111" stroke-width="1.5"/>`, "0 0 100 66") },
  { id: "mancha-cromada", nombre: "Burbuja cromada", premium: true, aspecto: 1, svg: svg(`<defs><radialGradient id="c" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff"/><stop offset=".3" stop-color="#BFE3F5"/><stop offset=".65" stop-color="#2F5BC9"/><stop offset="1" stop-color="#111"/></radialGradient></defs><path d="M50 6 C78 6 94 28 90 54 C86 80 64 96 40 92 C16 88 6 62 12 40 C18 18 32 6 50 6Z" fill="url(#c)" stroke="#111" stroke-width="2.5"/>`) },
  { id: "marca-audifonos", nombre: "Audífonos Mixzine", aspecto: 1.62, src: "/brand/headphones.webp" },
  { id: "marca-zine", nombre: "Fanzine Mixzine", aspecto: 0.91, src: "/brand/zine.webp" },
  { id: "marca-estrella", nombre: "Estrella Mixzine", aspecto: 1, src: "/brand/star.webp" },
  { id: "r-globo", nombre: "Planeta", aspecto: 0.99, src: "/collage/globo.webp" },
  { id: "r-audifonos", nombre: "Audífonos", aspecto: 0.91, src: "/collage/audifonos.webp" },
  { id: "r-megafono", nombre: "Megáfono", aspecto: 1.08, src: "/collage/megafono.webp" },
  { id: "r-diamante", nombre: "Diamante", premium: true, aspecto: 1.5, src: "/collage/diamante.webp" },
  { id: "r-cd", nombre: "CD holográfico", premium: true, aspecto: 1, src: "/collage/cd.webp" },
  { id: "r-estrella", nombre: "Estrella azul", premium: true, aspecto: 1.05, src: "/collage/estrella-azul.webp" },
  { id: "r-flor", nombre: "Flor de cristal", premium: true, aspecto: 1.11, src: "/collage/flor-verde.webp" },
  { id: "r-luna", nombre: "Luna de cristal", premium: true, aspecto: 1.01, src: "/collage/luna-azul.webp" },
  { id: "r-tocadiscos", nombre: "Tocadiscos", aspecto: 1, src: "/collage/tocadiscos.webp" },
  { id: "r-disco", nombre: "Bola disco", aspecto: 0.59, src: "/collage/disco.webp" },
  { id: "r-glitter", nombre: "Cinta glitter", premium: true, aspecto: 0.24, src: "/collage/glitter.webp" },
  { id: "r-cinta", nombre: "Cinta de papel", aspecto: 3.6, src: "/collage/cinta.webp" },
  { id: "r-cuaderno", nombre: "Cuaderno", aspecto: 1.27, src: "/collage/cuaderno.webp" },
  { id: "marca-wordmark", nombre: "Logo mixzine", aspecto: 5.77, src: "/brand/wordmark.webp" },
];

export const STICKERS: StickerDef[] = defs;
export const STICKER_MAP: Record<string, StickerDef> = Object.fromEntries(defs.map((d) => [d.id, d]));

export const svgUri = (s: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(s)}`;
export const stickerSrc = (id: string) => {
  const d = STICKER_MAP[id];
  if (!d) return svgUri(svg(`<circle cx="50" cy="50" r="40" fill="${PALETA.pink300}"/>`));
  return d.src ?? svgUri(d.svg!);
};

/* ---------- Fondos de papel (SVG en mm, se usan igual en DOM y en canvas) ---------- */
const grano = (op = 0.3, freq = 1.1) =>
  `<filter id="g" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${op} 0"/></filter>`;
const W = PANEL_W;
const H = PANEL_H;
const wrap = (inner: string, defs = "") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><defs>${defs}${grano()}</defs>${inner}<rect width="${W}" height="${H}" filter="url(#g)"/></svg>`;

export const PAPELES: { id: string; nombre: string; svg: string }[] = [
  { id: "hoja", nombre: "Hoja", svg: wrap(`<rect width="${W}" height="${H}" fill="${PALETA.paper}"/>`) },
  {
    id: "cuaderno",
    nombre: "Cuaderno",
    svg: wrap(
      `<rect width="${W}" height="${H}" fill="#fff"/>` +
        Array.from({ length: 16 }, (_, i) => `<line x1="0" x2="${W}" y1="${10 + i * 6}" y2="${10 + i * 6}" stroke="${PALETA.blue200}" stroke-width=".25"/>`).join("") +
        `<line x1="9" x2="9" y1="0" y2="${H}" stroke="${PALETA.pink300}" stroke-width=".35"/>`
    ),
  },
  {
    id: "rosa-arrugado",
    nombre: "Papel arrugado",
    svg: wrap(
      `<rect width="${W}" height="${H}" fill="url(#p)"/><rect width="${W}" height="${H}" filter="url(#c)" opacity=".55"/>`,
      `<linearGradient id="p" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${PALETA.pink300}"/><stop offset="1" stop-color="${PALETA.pink500}"/></linearGradient><filter id="c" x="0" y="0" width="100%" height="100%"><feTurbulence type="turbulence" baseFrequency=".035 .06" numOctaves="3" seed="4"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  1.6 0 0 0 -0.55"/></filter>`
    ),
  },
  {
    id: "halftone",
    nombre: "Puntos halftone",
    svg: wrap(
      `<rect width="${W}" height="${H}" fill="${PALETA.pink100}"/><rect width="${W}" height="${H}" fill="url(#d)"/>`,
      `<pattern id="d" width="3.2" height="3.2" patternUnits="userSpaceOnUse"><circle cx="1.6" cy="1.6" r="0.85" fill="${PALETA.pink500}"/></pattern>`
    ),
  },
  {
    id: "reticula",
    nombre: "Retícula neón",
    svg: wrap(
      `<rect width="${W}" height="${H}" fill="url(#b)"/><rect width="${W}" height="${H}" fill="url(#r)"/>`,
      `<linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${PALETA.blue600}"/><stop offset="1" stop-color="#1d3a8a"/></linearGradient><pattern id="r" width="7" height="7" patternUnits="userSpaceOnUse"><path d="M7 0H0V7" fill="none" stroke="${PALETA.pink500}" stroke-width=".35"/></pattern>`
    ),
  },
  {
    id: "celeste",
    nombre: "Celeste con grano",
    svg: wrap(
      `<rect width="${W}" height="${H}" fill="url(#c)"/>`,
      `<radialGradient id="c" cx=".3" cy=".25" r=".9"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="${PALETA.blue200}"/><stop offset="1" stop-color="${PALETA.lilac300}"/></radialGradient>`
    ),
  },
  {
    id: "lila-liquido",
    nombre: "Degradado líquido",
    svg: wrap(
      `<rect width="${W}" height="${H}" fill="${PALETA.pink500}"/><g filter="url(#bl)"><circle cx="18" cy="26" r="26" fill="${PALETA.lilac300}"/><circle cx="62" cy="52" r="28" fill="${PALETA.pink100}"/><circle cx="26" cy="86" r="26" fill="${PALETA.blue200}"/><circle cx="70" cy="98" r="18" fill="${PALETA.lilac300}"/></g>`,
      `<filter id="bl" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9"/></filter>`
    ),
  },
  { id: "naranja", nombre: "Naranja halftone", svg: wrap(`<rect width="${W}" height="${H}" fill="#E8772B"/><rect width="${W}" height="${H}" fill="url(#d)"/>`, `<pattern id="d" width="3" height="3" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r=".7" fill="#C95A14"/></pattern>`) },
  { id: "oliva", nombre: "Verde oliva", svg: wrap(`<rect width="${W}" height="${H}" fill="#A9B232"/><rect width="${W}" height="${H}" fill="url(#d)"/>`, `<pattern id="d" width="3" height="3" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r=".6" fill="#7E8A1C"/></pattern>`) },
  { id: "cobalto", nombre: "Cobalto", svg: wrap(`<rect width="${W}" height="${H}" fill="#3446C8"/><g filter="url(#bl)"><circle cx="20" cy="30" r="22" fill="#E5348C"/><circle cx="60" cy="86" r="24" fill="#5B3C9A"/></g>`, `<filter id="bl" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="8"/></filter>`) },
  { id: "atardecer", nombre: "Atardecer", svg: wrap(`<rect width="${W}" height="${H}" fill="#E8772B"/><g filter="url(#bl)"><circle cx="50" cy="30" r="26" fill="#E5348C"/><circle cx="20" cy="90" r="30" fill="#7B3FB0"/><circle cx="62" cy="62" r="14" fill="#F7E34A"/></g>`, `<filter id="bl" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9"/></filter>`) },
  { id: "morado", nombre: "Morado duotono", svg: wrap(`<rect width="${W}" height="${H}" fill="${PALETA.purple700}"/><circle cx="37" cy="52" r="30" fill="${PALETA.pink500}" opacity=".35"/>`) },
  { id: "amarillo", nombre: "Amarillo", svg: wrap(`<rect width="${W}" height="${H}" fill="${PALETA.yellow400}"/>`) },
];
export const PAPEL_MAP: Record<string, string> = Object.fromEntries(PAPELES.map((p) => [p.id, p.svg]));
export const papelSrc = (id: string) => svgUri(PAPEL_MAP[id] ?? PAPEL_MAP.hoja);
