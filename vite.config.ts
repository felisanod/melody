// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

const pwaConfig: Parameters<typeof VitePWA>[0] = {
  registerType: "autoUpdate",
  injectRegister: null,
  devOptions: { enabled: false },
  manifest: false,
  filename: "sw.js",
  workbox: {
    globPatterns: ["**/*.{js,css,png,svg,ico,woff2}"],
    navigateFallbackDenylist: [/^\/~oauth/, /^\/api\//],
    skipWaiting: true,
    clientsClaim: true,
    runtimeCaching: [
      {
        urlPattern: ({ request, url }: { request: Request; url: URL }) =>
          request.mode === "navigate" && url.origin === self.location.origin &&
          !/^\/(?:~oauth|api)(?:\/|$)/.test(url.pathname),
        handler: "NetworkFirst" as const,
        options: { cacheName: "flex-web-pages", networkTimeoutSeconds: 4 },
      },
      {
        urlPattern: ({ url }: { url: URL }) =>
          url.origin === self.location.origin &&
           /[.-][A-Za-z0-9_-]{8,}\.(?:js|css)$/.test(url.pathname),
        handler: "CacheFirst" as const,
        options: { cacheName: "flex-web-assets" },
      },
    ],
  },
};

export default defineConfig({
  vite: {
    plugins: [
      VitePWA(pwaConfig),
    ],
  },
  tanstackStart: {
    server: { entry: "server" },
  },
});
