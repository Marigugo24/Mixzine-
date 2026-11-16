import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        pink: { 500: "#E5348C", 300: "#F59AC4", 100: "#FBD9E8" },
        blue: { 600: "#2F5BC9", 200: "#BFE3F5" },
        purple: { 700: "#5B3C9A" },
        lilac: { 300: "#C9B8F0" },
        ink: "#111111",
        paper: "#FAF5F2",
        yellow: { 400: "#F7E34A" },
        orange: { 500: "#E8772B" },
        olive: { 600: "#4F7B1F", 400: "#A9B232" },
        cobalt: { 600: "#3446C8" },
        char: "#262626",
      },
      fontFamily: {
        ui: ["Poppins", "Inter", "system-ui", "sans-serif"],
        type: ['"Special Elite"', "monospace"],
        marker: ['"Permanent Marker"', "cursive"],
        comic: ["Bangers", "Impact", "sans-serif"],
        abril: ["\"Abril Fatface\"", "serif"],
        anton: ["Anton", "Impact", "sans-serif"],
        serif: ["\"Playfair Display\"", "Georgia", "serif"],
      },
      boxShadow: { paper: "3px 3px 0 #111", paperSm: "2px 2px 0 #111" },
    },
  },
  plugins: [],
} satisfies Config;
