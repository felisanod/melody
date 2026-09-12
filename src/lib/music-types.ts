// Client-safe domain types, modelled on Metrolist's YTItem hierarchy.

export type Thumbnail = string;

export interface ArtistRef {
  name: string;
  id?: string;
}

export interface SongItem {
  kind: "song";
  id: string;
  title: string;
  artists: ArtistRef[];
  album?: { name: string; id?: string };
  durationText?: string;
  durationSeconds?: number;
  thumbnail?: Thumbnail;
  explicit?: boolean;
}

export interface AlbumItem {
  kind: "album";
  browseId: string;
  playlistId?: string;
  title: string;
  artists: ArtistRef[];
  year?: string;
  thumbnail?: Thumbnail;
  explicit?: boolean;
}

export interface ArtistItem {
  kind: "artist";
  id: string;
  title: string;
  subtitle?: string;
  thumbnail?: Thumbnail;
}

export interface PlaylistItem {
  kind: "playlist";
  id: string;
  title: string;
  author?: string;
  songCountText?: string;
  thumbnail?: Thumbnail;
}

export type MusicItem = SongItem | AlbumItem | ArtistItem | PlaylistItem;

export interface Shelf {
  title: string;
  items: MusicItem[];
}

export interface FeedPage {
  sections: Shelf[];
}

export interface DetailPage {
  title: string;
  subtitle?: string;
  description?: string;
  thumbnail?: Thumbnail;
  songs: SongItem[];
  sections: Shelf[];
}

export interface SearchSummary {
  sections: Shelf[];
}

export interface LyricLine {
  timeMs: number;
  text: string;
}

export interface LyricsResult {
  synced: LyricLine[];
  plain?: string;
  source?: string;
}

export type SearchFilterKey =
  | "all"
  | "songs"
  | "videos"
  | "albums"
  | "artists"
  | "playlists";
