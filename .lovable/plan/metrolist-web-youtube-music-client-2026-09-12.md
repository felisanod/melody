# Metrolist Web — YouTube Music client

A web music app in the spirit of Metrolist: search, explore/charts feeds, a real queue, synced lyrics, and a fully custom player. Audio comes from a hidden YouTube player, so nothing of YouTube's own interface is visible.

## Screens

- **Home / Explore** (`/`): new releases, moods & genres, and quick chart shelves as horizontal carousels.
- **Charts** (`/charts`): trending, top songs, top artists sections.
- **Search** (`/search`): live suggestions, then results grouped by songs / albums / artists / playlists, with filter chips.
- **Album** (`/album/$id`) and **Artist** (`/artist/$id`): cover art, tracklist, play/shuffle.
- **Playlist** (`/playlist/$id`): tracklist with paging.
- **Player**: persistent bottom bar on every page (art, title, scrubber, play/pause, next/prev, shuffle, repeat, volume) that expands into a full-screen "now playing" view with large art, queue list, and synced lyrics tab.

## Behaviour

- **Queue**: click a song to play it and auto-fill the queue with the related radio; reorder by drag, remove items, clear, shuffle, repeat-one/all. Queue and volume persist between visits on the device.
- **Lyrics**: fetched from LrcLib by title/artist/duration. Timed lyrics auto-scroll and highlight the current line; tapping a line seeks. Falls back to plain lyrics, then to a friendly "no lyrics found" state.
- **Playback**: a hidden YouTube playback engine drives audio; our UI controls it and reads position for the scrubber and lyrics sync. Autoplay of the next track when one ends.

## Design direction

Dark, ink-black surfaces with a warm accent pulled from the current album art, generous album artwork, rounded cards, dense list rows, and smooth crossfades between views. Not a Spotify clone: closer to Material 3 "expressive" with big type and tonal surfaces.

## Technical notes

- **Data**: TanStack server functions proxy the InnerTube endpoints from the docs (`search`, `browse`, `next`, `player`, `music_get_search_suggestions`) against `music.youtube.com/youtubei/v1` with the `WEB_REMIX` client context; renderer parsing lives in server-only modules mapping to the doc's domain types (`SongItem`, `AlbumItem`, `ArtistItem`, `PlaylistItem`) so the UI never sees raw renderers. Server-side keeps requests off the browser's CORS path and hides visitor-data handling.
- **Lyrics**: server function against `lrclib.net/api/get` + `/api/search`, returning parsed LRC lines `{ timeMs, text }`.
- **Playback**: YouTube IFrame API in a 1px hidden container, wrapped in a React context (`PlayerProvider`) exposing state and commands; all UI reads that context. Loaded client-side only.
- **State**: player/queue in a React context with localStorage persistence; server data via TanStack Query with `ensureQueryData` in route loaders.
- No database or login in this first build — no Lovable Cloud needed yet. Library/liked songs, accounts, and scrobbling can come later.

## Out of scope for now

Sign-in to a Google account, library mutations (like/add to playlist), Last.fm, Discord presence, Listen Together, AI lyric translation.
