<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# flex_web — Project Notes

## Tech Stack
- React 19 + TypeScript + Vite
- TanStack Router (file-based routing)
- TanStack Start (server functions via `createServerFn`)
- Tailwind CSS v4 (`@import "tailwindcss"`)
- shadcn/ui components
- Lucide React icons
- Zustand (for future stores) / React Context (current)
- YouTube IFrame API (playback engine)
- PWA (vite-plugin-pwa)

## Theme System
- `src/context/settings-context.tsx` — manages light/dark/system theme
- Theme persisted in `localStorage` as `flex-web.theme`
- Dark mode uses `.dark` class on `<html>` element
- Neomorphic shadows via CSS custom properties in `src/styles.css`
- Light neomorphic: white cards on gray background with dual shadows
- Dark neomorphic: dark cards on darker background with reversed shadows

## Architecture
```
src/
  context/settings-context.tsx    — theme state
  context/                        — additional contexts (auth, queue, etc.)
  hooks/use-mobile.tsx            — responsive breakpoint
  lib/
    innertube.server.ts           — YouTube Music API (server-side)
    music.functions.ts            — server functions (search, charts, lyrics)
    music-types.ts                — domain types
    lyrics.server.ts              — lyrics fetching (LrcLib)
    utils.ts                      — cn() helper
  player/player-context.tsx       — playback state (YouTube IFrame engine)
  routes/                         — TanStack Router pages
  components/
    app-shell.tsx                 — root layout with header, sidebar, nav
    sidebar-nav.tsx               — desktop sidebar + mobile bottom nav
    music-cards.tsx               — song/album/artist/playlist cards
    player-bar.tsx                — persistent mini player
    now-playing.tsx               — full-screen player overlay
    detail-view.tsx               — album/artist/playlist detail page
    ui/                           — shadcn/ui components
```

## Playback Engine
- Hidden YouTube IFrame player (`<div id="flex-web-playback-engine">`)
- Controls via YT.Player API (playVideo, pauseVideo, seekTo, etc.)
- State synced via polling (250ms interval)
- Media Session API registered (system media controls)

## API Integration (Phase 2+)
- InnerTube: `src/lib/innertube.server.ts`
- Lyrics: `src/lib/lyrics.server.ts` (5 providers: LrcLib, BetterLyrics, KuGou, Paxsenix, LyricsPlus)
- Lyrics caching: `src/lib/lyrics-cache.ts` (localStorage with 7-day TTL)
- Translation: `src/lib/translation.ts` (OpenRouter, DeepL, Romanization, Transcription)
- IndexedDB storage: `src/lib/storage.ts` (tracks, artists, albums, playlists, lyrics, history, downloads, settings, searchHistory, queue)
- Last.fm: `src/lib/lastfm.server.ts` (scrobble, now playing, top charts, similar artists)
- Room Sync: `src/lib/room-sync.ts` (in-memory room engine with host/player sync, chat, ping/pong)
- Discord Rich Presence: `src/lib/discord-presence.ts` (presence sync, player-based updates)
- Import/Export: `src/lib/import-export.ts` (JSON export/import of music data, settings, queue, library)
- Backup/Restore: `src/lib/backup.ts` (full IndexedDB backup/restore)
- Smart Playlists: `src/lib/smart-playlists.ts` (rule-based playlist generation)
- Server functions: `src/lib/music.functions.ts`

## Routes
- `/` — Explore/Home (feed)
- `/home` — Home dashboard
- `/charts` — Trending charts
- `/search` — Global search with filters
- `/library` — User library
- `/history` — Playback history
- `/listen-together` — Shared listening rooms
- `/listen-together/room` — Room join/create
- `/settings` — App settings
- `/album/$browseId` — Album detail
- `/artist/$artistId` — Artist detail
- `/playlist/$playlistId` — Playlist detail
- `/player/$videoId` — Player page

