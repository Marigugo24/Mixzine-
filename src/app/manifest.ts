import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mixzine",
    short_name: "Mixzine",
    description: "Una canción. Mil formas de sentirla.",
    start_url: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#FAF5F2",
    theme_color: "#E5348C",
    lang: "es-CO",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
