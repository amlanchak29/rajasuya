import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Build-only: dev needs inline scripts (react-refresh preamble) and the HMR
// websocket, both of which this policy would block. GitHub Pages can't set
// response headers, hence the meta tag.
const csp: Plugin = {
  name: "inject-csp",
  apply: "build",
  transformIndexHtml: () => [
    {
      tag: "meta",
      injectTo: "head-prepend",
      attrs: {
        "http-equiv": "Content-Security-Policy",
        content: [
          "default-src 'self'",
          "script-src 'self'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data:",
          "font-src 'self'",
          "media-src 'self'",
          "connect-src 'self'",
          "object-src 'none'",
          "base-uri 'none'",
          "form-action 'none'",
        ].join("; "),
      },
    },
  ],
};

export default defineConfig({
  plugins: [react(), tailwindcss(), csp],
  base: "./",
});
