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
    navigateFallback: "/",
    navigateFallbackDenylist: [/^\/~oauth/, /^\/api\//],
    skipWaiting: true,
    clientsClaim: true,
    runtimeCaching: [
      {
        urlPattern: ({ request }: { request: Request }) => request.mode === "navigate",
        handler: "NetworkFirst" as const,
        options: { cacheName: "flex-web-pages", networkTimeoutSeconds: 4 },
      },
      {
        urlPattern: ({ url }: { url: URL }) =>
          url.origin === self.location.origin &&
          /\.[a-f0-9]{8,}\.(?:js|css)$/.test(url.pathname),
        handler: "CacheFirst" as const,
        options: { cacheName: "flex-web-assets" },
      },
      {
        urlPattern: ({ url }: { url: URL }) =>
          /(googlevideo|googleapis|ytimg|youtube)\.com/.test(url.hostname),
        handler: "NetworkFirst" as const,
        options: {
          cacheName: "flex-web-media",
          networkTimeoutSeconds: 5,
          expiration: { maxEntries: 20, maxAgeSeconds: 24 * 60 * 60 },
        },
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
