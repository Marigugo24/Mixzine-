import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Boot } from "@/components/Boot";
import { Toaster } from "@/components/ui";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")),
  title: { default: "Mixzine — Una canción. Mil formas de sentirla.", template: "%s · Mixzine" },
  description: "Convierte las canciones que te marcan en fanzines-collage y compártelos con contexto, por link o en papel.",
  applicationName: "Mixzine",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icons/icon-192.png", apple: "/icons/icon-192.png" },
  openGraph: { title: "Mixzine", description: "La música también se comparte en papel.", locale: "es_CO", type: "website" },
};
export const viewport: Viewport = {
  themeColor: "#E5348C",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CO">
      <body>
        <Boot />
        <main>{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
