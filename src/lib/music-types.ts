// Client-safe domain types, modelled on the Flex Player YTItem hierarchy.

export type Thumbnail = string;

export interface ArtistRef {
  name: string;
  id?: string | undefined;
}

export interface SongItem {
  kind: "song";
  id: string;
  title: string;
  artists: ArtistRef[];
  album?: { name: string; id?: string } | undefined;
  durationText?: string | undefined;
  durationSeconds?: number | undefined;
  thumbnail?: Thumbnail | undefined;
  explicit?: boolean | undefined;
}

export interface AlbumItem {
  kind: "album";
  browseId: string;
  playlistId?: string | undefined;
  title: string;
  artists: ArtistRef[];
  year?: string | undefined;
  thumbnail?: Thumbnail | undefined;
  explicit?: boolean | undefined;
}

export interface ArtistItem {
  kind: "artist";
  id: string;
  title: string;
  subtitle?: string | undefined;
  thumbnail?: Thumbnail | undefined;
}

export interface PlaylistItem {
  kind: "playlist";
  id: string;
  title: string;
  author?: string | undefined;
  songCountText?: string | undefined;
  thumbnail?: Thumbnail | undefined;
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
  subtitle?: string | undefined;
  description?: string | undefined;
  thumbnail?: Thumbnail | undefined;
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
  plain?: string | undefined;
  source?: string | undefined;
}

export interface TranslationResult {
  original: string;
  translated: string;
  mode: TranslationMode;
  source: string;
}

export type TranslationMode = "original" | "translated" | "romanized" | "transcribed";

export type TranslationProvider = "openrouter" | "deepl";

export interface TranslationOptions {
  targetLanguage: string;
  provider: TranslationProvider;
  model?: string | undefined;
  mode: TranslationMode;
  customPrompt?: string | undefined;
  formality?: "default" | "formal" | "informal" | undefined;
}

export type SearchFilterKey = "all" | "songs" | "videos" | "albums" | "artists" | "playlists";

export type VideoFilter = "mixed" | "audioOnly";

export interface LastFmTrack {
  name: string;
  artist: string;
  image?: string | undefined;
  url?: string | undefined;
  duration?: number | undefined;
}

export interface LastFmArtist {
  name: string;
  url?: string | undefined;
  image?: string | undefined;
  listeners?: number | undefined;
  playcount?: number | undefined;
}

export interface RoomMember {
  id: string;
  name: string;
  joinedAt: number;
  isHost: boolean;
}

export interface RoomMessage {
  id: string;
  type: "sync" | "chat" | "ping" | "pong" | "join" | "leave" | "play" | "pause" | "seek" | "queue";
  senderId: string;
  timestamp: number;
  payload: Record<string, string | number | boolean | null>;
}

export interface RoomState {
  roomId: string;
  hostId: string;
  members: RoomMember[];
  currentTrack?: {
    videoId: string;
    title: string;
    artist: string;
    artistId: string;
    duration: number;
    durationText: string;
    thumbnail: string;
  } | undefined;
  isPlaying: boolean;
  currentTime: number;
  queue: string[];
  messages: RoomMessage[];
  createdAt: number;
}

export interface DiscordPresenceData {
  details?: string | undefined;
  state?: string | undefined;
  largeImageKey?: string | undefined;
  largeImageText?: string | undefined;
  smallImageKey?: string | undefined;
  smallImageText?: string | undefined;
  startTimestamp?: number | undefined;
  endTimestamp?: number | undefined;
}
