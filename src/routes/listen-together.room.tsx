import { useState } from "react";
import { usePlayer } from "@/player/player-context";
import { createFileRoute } from "@tanstack/react-router";
import { Copy, MessageSquare, Music2, Send, Volume2 } from "lucide-react";

import { useRoomSync } from "@/hooks/use-room-sync";
import type { RoomMessage } from "@/lib/music-types";

export const Route = createFileRoute("/listen-together/room")({
  component: RoomPage,
});

const ROOM_ID = "ABC-DEF";
const USER_ID = "host-1";
const USER_NAME = "You";

function RoomPage() {
  const { current } = usePlayer();
  const { room, members, messages, isHost, sendChat } = useRoomSync(ROOM_ID, USER_ID, USER_NAME);
  const [chatText, setChatText] = useState("");

  const handleSendChat = () => {
    if (!chatText.trim()) return;
    sendChat(chatText.trim());
    setChatText("");
  };

  const handleCopy = () => {
    void navigator.clipboard.writeText(ROOM_ID);
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-8 px-4 py-8 sm:px-8">
      <div className="flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-xl neu-raised text-accent-foreground">
          <Volume2 className="size-6" />
        </div>
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight">Room</h1>
          <p className="text-sm text-muted-foreground">Join a synchronized listening session</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="neu-raised rounded-2xl p-6 space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Room Code</p>
          <code className="block font-mono text-2xl tracking-widest">{ROOM_ID}</code>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-2 rounded-lg neu-raised-sm px-3 py-2 text-sm font-medium text-accent-foreground transition hover:neu-inset-sm"
          >
            <Copy className="size-4" /> Copy
          </button>
        </div>
        <div className="neu-raised rounded-2xl p-6 space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Members</p>
          <p className="text-2xl font-semibold">{members.length}</p>
          <div className="space-y-1">
            {members.map((member) => (
              <p key={member.id} className="truncate text-sm">
                {member.name} {member.isHost ? "(Host)" : ""}
              </p>
            ))}
          </div>
        </div>
        <div className="neu-raised rounded-2xl p-6 space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Now Playing</p>
          {current ? (
            <>
              <p className="truncate font-medium">{current.title}</p>
              <p className="truncate text-xs text-muted-foreground">
                {current.artists.map((a) => a.name).join(", ")}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No song playing</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="neu-raised rounded-2xl p-4 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full neu-raised-sm">
            <Music2 className="size-5 text-accent-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">Host</p>
            <p className="text-xs text-muted-foreground">
              {isHost ? "You are the host" : "Waiting for host"}
            </p>
          </div>
        </div>
      </div>

      <div className="neu-raised rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-3 border-b border-border/30">
          <MessageSquare className="size-4 text-accent-foreground" />
          <p className="text-sm font-medium">Chat</p>
        </div>
        <div className="max-h-64 overflow-y-auto px-6 py-4 space-y-2">
          {messages.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-4">No messages yet</p>
          ) : (
            messages.map((msg: RoomMessage) => (
              <div key={msg.id} className="flex gap-2 text-sm">
                <span className="font-medium text-accent-foreground shrink-0">You:</span>
                <span className="text-muted-foreground">{(msg.payload["text"] as string) ?? ""}</span>
              </div>
            ))
          )}
        </div>
        <div className="flex gap-2 px-6 py-3 border-t border-border/30">
          <input
            type="text"
            value={chatText}
            onChange={(e) => setChatText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSendChat();
            }}
            placeholder="Type a message..."
            className="neu-inset-sm flex-1 rounded-lg border border-border/50 bg-transparent px-3 py-2 text-sm outline-none"
          />
          <button
            type="button"
            onClick={handleSendChat}
            className="rounded-lg neu-raised-sm px-4 py-2 text-sm font-medium text-accent-foreground transition hover:neu-inset-sm"
          >
            <Send className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
