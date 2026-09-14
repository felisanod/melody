# Rename, repair, and installable PWA

## What will change

- Rename every visible “Metrolist” reference to **flex-web**, including navigation, saved-player identifiers, page titles, descriptions, sharing metadata, and server request identification.
- Fix current build issues and harden the hidden YouTube player so queue playback, play/pause, seeking, volume, and track advancement remain reliable.
- Make search fully usable across all filters, with safe query handling, suggestions, loading/error states, and correctly parsed YouTube Music results.
- Make synced lyrics reliable by improving title/artist matching, duration handling, timestamp parsing, track-change loading, active-line highlighting, scrolling, and tap-to-seek behavior.
- Add an online-sourced, permissively licensed music icon as the favicon and generated app-icon sizes.
- Add browser installation and offline app-shell support using a web manifest plus a guarded generated service worker that never runs in Lovable preview or development.

## Verification

- Confirm every content page has unique flex-web title, description, Open Graph metadata, Twitter card metadata, and its own canonical URL.
- Run focused checks for search parsing and lyric timestamp parsing.
- Verify the app compiles without errors.
- Exercise Explore, Search, filtered results, playback controls, the queue, and synced lyrics in the browser at desktop and mobile sizes.
- Confirm the manifest and icons load, and confirm service-worker registration is disabled in preview while remaining configured for published production.

## Technical details

- Use `vite-plugin-pwa` with `generateSW`, `injectRegister: null`, `registerType: autoUpdate`, network-first navigation caching, same-origin hashed-asset caching, and `/~oauth` exclusions.
- Register `/sw.js` from one guarded client module only; support `?sw=off` and unregister stale app-shell workers in preview/development.
- Keep the YouTube Music and LrcLib integrations server-side and preserve the existing TanStack Start routing and query structure.
