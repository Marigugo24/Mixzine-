import { NextResponse } from "next/server";
import { dbConfigurada } from "@/server/db";
import { wompiConfigurado } from "@/server/wompi";
import { correoConfigurado } from "@/server/correo";

export const dynamic = "force-dynamic";
export function GET() {
  return NextResponse.json(
    {
      backend: dbConfigurada(),
      blob: !!process.env.BLOB_READ_WRITE_TOKEN,
      spotifyBusqueda: !!(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET),
      correo: dbConfigurada() && (correoConfigurado() || process.env.MAIL_DEBUG === "1"),
      pagos: dbConfigurada() && wompiConfigurado(),
      spotifyLogin: dbConfigurada() && !!(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
