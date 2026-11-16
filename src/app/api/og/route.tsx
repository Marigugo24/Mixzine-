import { ImageResponse } from "next/og";


const FONDOS: Record<string, [string, string]> = {
  tranquilidad: ["#BFE3F5", "#C9B8F0"],
  amor: ["#F59AC4", "#E5348C"],
  ansiedad: ["#2F5BC9", "#5B3C9A"],
  motivacion: ["#F7E34A", "#F59AC4"],
  tristeza: ["#5B3C9A", "#C9B8F0"],
  alegria: ["#FBD9E8", "#F7E34A"],
};
const NOMBRES: Record<string, string> = { tranquilidad: "Tranquilidad", amor: "Amor", ansiedad: "Ansiedad", motivacion: "Motivación", tristeza: "Tristeza", alegria: "Alegría" };

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const t = (sp.get("t") ?? "Una canción").slice(0, 60);
  const a = (sp.get("a") ?? "").slice(0, 50);
  const e = sp.get("e") ?? "amor";
  const de = (sp.get("de") ?? "").slice(0, 30);
  const [c1, c2] = FONDOS[e] ?? FONDOS.amor;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(135deg, ${c1}, ${c2})`, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", transform: "rotate(-3deg)", background: "#FAF5F2", border: "6px solid #111", padding: "48px 64px", boxShadow: "14px 14px 0 #111", maxWidth: 980 }}>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: "#E5348C", textTransform: "uppercase", letterSpacing: 4 }}>mixzine · {NOMBRES[e] ?? ""}</div>
          <div style={{ display: "flex", fontSize: t.length > 24 ? 76 : 104, fontWeight: 900, color: "#111", lineHeight: 1.05, marginTop: 12 }}>{t}</div>
          <div style={{ display: "flex", fontSize: 44, color: "#111", marginTop: 14 }}>{a}</div>
          {de ? <div style={{ display: "flex", fontSize: 30, color: "#5B3C9A", marginTop: 26 }}>Un fanzine de @{de}</div> : null}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
