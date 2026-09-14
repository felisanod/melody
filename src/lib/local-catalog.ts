import type { SongItem, Shelf } from "./music-types";

export const LOCAL_CATALOG: SongItem[] = [
  { kind: "song", id: "local-1", title: "Bohemian Rhapsody", artists: [{ name: "Queen" }], album: { name: "A Night at the Opera", id: "alb-1" }, durationText: "5:55", durationSeconds: 355, thumbnail: "https://i.ytimg.com/vi/fJ9rUzIMcZQ/hq720.jpg" },
  { kind: "song", id: "local-2", title: "Stairway to Heaven", artists: [{ name: "Led Zeppelin" }], album: { name: "Led Zeppelin IV", id: "alb-2" }, durationText: "8:02", durationSeconds: 482, thumbnail: "https://i.ytimg.com/vi/QYh6mYIjK2o/hq720.jpg" },
  { kind: "song", id: "local-3", title: "Hotel California", artists: [{ name: "Eagles" }], album: { name: "Hotel California", id: "alb-3" }, durationText: "6:30", durationSeconds: 390, thumbnail: "https://i.ytimg.com/vi/4KiBS7iNh5s/hq720.jpg" },
  { kind: "song", id: "local-4", title: "Imagine", artists: [{ name: "John Lennon" }], album: { name: "Imagine", id: "alb-4" }, durationText: "3:03", durationSeconds: 183, thumbnail: "https://i.ytimg.com/vi/YkgkThdzXW8/hq720.jpg" },
  { kind: "song", id: "local-5", title: "Smells Like Teen Spirit", artists: [{ name: "Nirvana" }], album: { name: "Nevermind", id: "alb-5" }, durationText: "5:01", durationSeconds: 301, thumbnail: "https://i.ytimg.com/vi/hRK7PVJFbSA/hq720.jpg" },
  { kind: "song", id: "local-6", title: "Billie Jean", artists: [{ name: "Michael Jackson" }], album: { name: "Thriller", id: "alb-6" }, durationText: "4:54", durationSeconds: 294, thumbnail: "https://i.ytimg.com/vi/Zi_XLOBDo_Y/hq720.jpg" },
  { kind: "song", id: "local-7", title: "Yesterday", artists: [{ name: "The Beatles" }], album: { name: "Help!", id: "alb-7" }, durationText: "2:05", durationSeconds: 125, thumbnail: "https://i.ytimg.com/vi/W7NYbI6YWSA/hq720.jpg" },
  { kind: "song", id: "local-8", title: "Wonderwall", artists: [{ name: "Oasis" }], album: { name: "(What's the Story) Morning Glory?", id: "alb-8" }, durationText: "4:18", durationSeconds: 258, thumbnail: "https://i.ytimg.com/vi/lkGiM87wMpE/hq720.jpg" },
  { kind: "song", id: "local-9", title: "Sweet Child O' Mine", artists: [{ name: "Guns N' Roses" }], album: { name: "Appetite for Destruction", id: "alb-9" }, durationText: "5:56", durationSeconds: 356, thumbnail: "https://i.ytimg.com/vi/UV1nAX45jGo/hq720.jpg" },
  { kind: "song", id: "local-10", title: "Back in Black", artists: [{ name: "AC/DC" }], album: { name: "Back in Black", id: "alb-10" }, durationText: "4:15", durationSeconds: 255, thumbnail: "https://i.ytimg.com/vi/V-oBTAqj_jg/hq720.jpg" },
  { kind: "song", id: "local-11", title: "Comfortably Numb", artists: [{ name: "Pink Floyd" }], album: { name: "The Wall", id: "alb-11" }, durationText: "6:24", durationSeconds: 384, thumbnail: "https://i.ytimg.com/vi/_a6iBG0vc3I/hq720.jpg" },
  { kind: "song", id: "local-12", title: "Livin' on a Prayer", artists: [{ name: "Bon Jovi" }], album: { name: "Slippery When Wet", id: "alb-12" }, durationText: "4:11", durationSeconds: 251, thumbnail: "https://i.ytimg.com/vi/hT_nvWreIhg/hq720.jpg" },
  { kind: "song", id: "local-13", title: "Don't Stop Believin'", artists: [{ name: "Journey" }], album: { name: "Escape", id: "alb-13" }, durationText: "4:11", durationSeconds: 251, thumbnail: "https://i.ytimg.com/vx/videos/CevxZvSJLk8/hq720.jpg" },
  { kind: "song", id: "local-14", title: "Paint It Black", artists: [{ name: "The Rolling Stones" }], album: { name: "Aftermath", id: "alb-14" }, durationText: "3:45", durationSeconds: 225, thumbnail: "https://i.ytimg.com/vi/YJzYz2TKQzI/hq720.jpg" },
  { kind: "song", id: "local-15", title: "Purple Rain", artists: [{ name: "Prince" }], album: { name: "Purple Rain", id: "alb-15" }, durationText: "8:41", durationSeconds: 521, thumbnail: "https://i.ytimg.com/vi/3TmM6zFCKaQ/hq720.jpg" },
  { kind: "song", id: "local-16", title: "Creep", artists: [{ name: "Radiohead" }], album: { name: "Pablo Honey", id: "alb-16" }, durationText: "3:59", durationSeconds: 239, thumbnail: "https://i.ytimg.com/vi/4NRXx6U8ABQ/hq720.jpg" },
  { kind: "song", id: "local-17", title: "Under the Bridge", artists: [{ name: "Red Hot Chili Peppers" }], album: { name: "Blood Sugar Sex Magik", id: "alb-17" }, durationText: "4:52", durationSeconds: 292, thumbnail: "https://i.ytimg.com/vi/0KSOMA3QBU0/hq720.jpg" },
  { kind: "song", id: "local-18", title: "Losing My Religion", artists: [{ name: "R.E.M." }], album: { name: "Out of Time", id: "alb-18" }, durationText: "4:26", durationSeconds: 266, thumbnail: "https://i.ytimg.com/vi/UZbAWBl63nM/hq720.jpg" },
  { kind: "song", id: "local-19", title: "Black Hole Sun", artists: [{ name: "Soundgarden" }], album: { name: "Superunknown", id: "alb-19" }, durationText: "4:50", durationSeconds: 290, thumbnail: "https://i.ytimg.com/vi/Y3o6-Z4zpbU/hq720.jpg" },
  { kind: "song", id: "local-20", title: "Today", artists: [{ name: "The Smashing Pumpkins" }], album: { name: "Siamese Dream", id: "alb-20" }, durationText: "3:21", durationSeconds: 201, thumbnail: "https://i.ytimg.com/vi/hg7amC0o78Y/hq720.jpg" },
  { kind: "song", id: "local-21", title: "Seven Nation Army", artists: [{ name: "The White Stripes" }], album: { name: "Elephant", id: "alb-21" }, durationText: "3:51", durationSeconds: 231, thumbnail: "https://i.ytimg.com/vi/rbR3K22qJQM/hq720.jpg" },
  { kind: "song", id: "local-22", title: "Take Me Out", artists: [{ name: "Franz Ferdinand" }], album: { name: "Franz Ferdinand", id: "alb-22" }, durationText: "3:57", durationSeconds: 237, thumbnail: "https://i.ytimg.com/vi/TG5lcj3LKsE/hq720.jpg" },
  { kind: "song", id: "local-23", title: "Do I Wanna Know?", artists: [{ name: "Arctic Monkeys" }], album: { name: "AM", id: "alb-23" }, durationText: "4:32", durationSeconds: 272, thumbnail: "https://i.ytimg.com/vi/UHC6GL1hRmI/hq720.jpg" },
  { kind: "song", id: "local-24", title: "R U Mine?", artists: [{ name: "Arctic Monkeys" }], album: { name: "AM", id: "alb-23" }, durationText: "3:21", durationSeconds: 201, thumbnail: "https://i.ytimg.com/vi/WfbGJLU8g4I/hq720.jpg" },
  { kind: "song", id: "local-25", title: "Fluorescent Adolescent", artists: [{ name: "Arctic Monkeys" }], album: { name: "Favourite Worst Nightmare", id: "alb-24" }, durationText: "2:57", durationSeconds: 177, thumbnail: "https://i.ytimg.com/vi/N3ZSj6o8a4g/hq720.jpg" },
];

export function searchLocalCatalog(query: string): Shelf[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const matches = LOCAL_CATALOG.filter(
    (song) =>
      song.title.toLowerCase().includes(q) ||
      song.artists.some((a) => a.name.toLowerCase().includes(q)) ||
      song.album?.name?.toLowerCase().includes(q),
  );

  if (matches.length === 0) return [];

  return [
    {
      title: "Results",
      items: matches,
    },
  ];
}

export function getLocalSuggestions(input: string): string[] {
  const q = input.toLowerCase().trim();
  if (!q) return [];

  const results = new Set<string>();
  for (const song of LOCAL_CATALOG) {
    if (song.title.toLowerCase().includes(q)) results.add(song.title);
    for (const artist of song.artists) {
      if (artist.name.toLowerCase().includes(q)) results.add(artist.name);
    }
  }
  return Array.from(results).slice(0, 8);
}
