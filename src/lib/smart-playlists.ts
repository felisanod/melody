import type { SongItem } from "./music-types";

export type RuleOperator =
  | "contains"
  | "equals"
  | "startsWith"
  | "endsWith"
  | "greaterThan"
  | "lessThan"
  | "before"
  | "after";

export interface PlaylistRule {
  field: string;
  operator: RuleOperator;
  value: string;
}

export interface SmartPlaylist {
  id: string;
  name: string;
  rules: PlaylistRule[];
  matchAny: boolean;
  createdAt: number;
}

function evaluateRule(song: SongItem, rule: PlaylistRule): boolean {
  const fieldValue = getNestedValue(song, rule.field);
  const strValue = String(fieldValue ?? "");
  const target = rule.value.toLowerCase();

  switch (rule.operator) {
    case "contains":
      return strValue.toLowerCase().includes(target);
    case "equals":
      return strValue.toLowerCase() === target;
    case "startsWith":
      return strValue.toLowerCase().startsWith(target);
    case "endsWith":
      return strValue.toLowerCase().endsWith(target);
    case "greaterThan":
      return Number(fieldValue) > Number(rule.value);
    case "lessThan":
      return Number(fieldValue) < Number(rule.value);
    case "before":
      return (fieldValue as string | number) < rule.value;
    case "after":
      return (fieldValue as string | number) > rule.value;
    default:
      return false;
  }
}

function getNestedValue(obj: unknown, path: string): unknown {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function matchesAllRules(song: SongItem, rules: PlaylistRule[], matchAny: boolean): boolean {
  if (rules.length === 0) return true;
  const results = rules.map((rule) => evaluateRule(song, rule));
  return matchAny ? results.some(Boolean) : results.every(Boolean);
}

export function generateSmartPlaylist(playlist: SmartPlaylist, library: SongItem[]): SongItem[] {
  return library.filter((song) => matchesAllRules(song, playlist.rules, playlist.matchAny));
}

export function generateSmartPlaylists(
  playlists: SmartPlaylist[],
  library: SongItem[],
): Record<string, SongItem[]> {
  const result: Record<string, SongItem[]> = {};
  for (const playlist of playlists) {
    result[playlist.id] = generateSmartPlaylist(playlist, library);
  }
  return result;
}
