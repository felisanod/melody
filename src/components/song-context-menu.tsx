import { useState, useRef, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Play,
  PlaySquare,
  ListPlus,
  Heart,
  Plus,
  Share2,
  User,
  Album,
  Music2,
  MessageCircle,
  X,
  Clock,
  List,
  Music,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { MusicItem, SongItem } from "@/lib/music-types";
import { usePlayer } from "@/player/player-context";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface ContextMenuProps {
  song: SongItem;
  children: React.ReactNode;
}

export function SongContextMenu({ song, children }: ContextMenuProps) {
  const { playSong, addToQueue, likeVideo, removeSongFromLibrary } = usePlayer();
  const [liked, setLiked] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleLike = async () => {
    setLiked((prev) => !prev);
    timeoutRef.current = setTimeout(async () => {
      try {
        if (!liked) {
          await likeVideo(song.id, true);
        } else {
          await removeSongFromLibrary(song.id);
        }
      } catch {
        setLiked((prev) => !prev);
      }
    }, 300);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem onClick={() => playSong(song, [song])} className="gap-2">
          <Play className="size-4" />
          <span>Play</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={() => addToQueue(song)} className="gap-2">
          <ListPlus className="size-4" />
          <span>Add to queue</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={() => playSong(song, [song])} className="gap-2">
          <PlaySquare className="size-4" />
          <span>Play next</span>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={handleLike} className="gap-2">
          <Heart className={cn("size-4", liked && "fill-current text-red-500")} />
          <span>{liked ? "Remove from liked" : "Like"}</span>
        </ContextMenuItem>
        <ContextMenuItem className="gap-2">
          <Plus className="size-4" />
          <span>Add to playlist</span>
          <ContextMenuShortcut>⌘P</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem>
          <Link to="/artist/$artistId" params={{ artistId: song.artists[0]?.id ?? "UC" }}>
            <span className="flex items-center gap-2">
              <User className="size-4" /> View artist
            </span>
          </Link>
        </ContextMenuItem>
        <ContextMenuItem>
          <Link to="/album/$browseId" params={{ browseId: song.album?.id ?? "" }}>
            <span className="flex items-center gap-2">
              <Album className="size-4" /> View album
            </span>
          </Link>
        </ContextMenuItem>
        <ContextMenuItem className="gap-2">
          <Music2 className="size-4" />
          <span>View lyrics</span>
        </ContextMenuItem>
        <ContextMenuItem className="gap-2">
          <Share2 className="size-4" />
          <span>Share</span>
          <ContextMenuShortcut>⌘S</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem className="gap-2" onClick={() => {}}>
          <Clock className="size-4" />
          <span>Go to song start</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={() => addToQueue(song)} className="gap-2">
          <List className="size-4" />
          <span>Add to playlist</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={() => {}} className="gap-2 text-destructive">
          <X className="size-4" />
          <span>Remove</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
