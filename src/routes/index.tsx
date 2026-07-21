import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import landingHtml from "../landing.html?raw";

// Serve the self-contained Persian landing page as raw HTML from "/".
// This preserves all inline styles, Three.js, Tailwind CDN, and scripts
// exactly as authored, which is the simplest and most reliable delivery
// path for a fully static marketing page.
export const Route = createFileRoute("/")({
  server: {
    handlers: {
      GET: () =>
        new Response(landingHtml, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "public, max-age=300",
          },
        }),
    },
  },
});
