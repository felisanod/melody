import { useCallback, useEffect, useRef, useState } from "react";
import { usePlayer } from "@/player/player-context";
import type { RoomMessage, RoomState } from "@/lib/music-types";
import { getRoomMessages, getRoomState, sendPing } from "@/lib/room-sync";

const POLL_INTERVAL = 3_000;

export function useRoomSync(roomId: string | null, userId: string, userName: string) {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [members, setMembers] = useState<RoomState["members"]>([]);
  const [isHost, setIsHost] = useState(false);
  const { current } = usePlayer();

  const seenMessages = useRef<Set<string>>(new Set());
  const poll = useCallback(async () => {
    if (!roomId) return;
    try {
      const [state, msgs] = await Promise.all([
        getRoomState(roomId),
        getRoomMessages(roomId),
      ]);
      if (state) {
        setRoom(state);
        setMembers(state.members);
        setIsHost(state.hostId === userId);
      }
      const newMessages = msgs.messages.filter((m) => !seenMessages.current.has(m.id));
      if (newMessages.length) {
        for (const m of newMessages) seenMessages.current.add(m.id);
        setMessages((prev) => [...prev, ...newMessages]);
      }
    } catch {
      /* polling error */
    }
  }, [roomId, userId]);

  useEffect(() => {
    if (!roomId) return;
    poll();
    const interval = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [poll, roomId]);

  const sendChat = useCallback(
    async (text: string) => {
      if (!roomId) return;
      try {
        const { sendChatMessage } = await import("@/lib/room-sync");
        const message = sendChatMessage(roomId, userId, text);
        if (message) {
          seenMessages.current.add(message.id);
          setMessages((prev) => [...prev, message]);
        }
      } catch {
        /* send error */
      }
    },
    [roomId, userId],
  );

  const syncPlayback = useCallback(
    async (
      state: Partial<Pick<RoomState, "currentTrack" | "isPlaying" | "currentTime" | "queue">>,
    ) => {
      if (!roomId) return;
      try {
        const { updateRoomState } = await import("@/lib/room-sync");
        await updateRoomState(roomId, state);
      } catch {
        /* sync error */
      }
    },
    [roomId],
  );

  const ping = useCallback(async () => {
    if (!roomId) return;
    try {
      const { sendPing } = await import("@/lib/room-sync");
      await sendPing(roomId, userId);
    } catch {
      /* ping error */
    }
  }, [roomId, userId]);

  useEffect(() => {
    const interval = setInterval(ping, 10_000);
    return () => clearInterval(interval);
  }, [ping]);

  useEffect(() => {
    if (!roomId || !current) return;
    syncPlayback({
      currentTrack: {
        videoId: current.id,
        title: current.title,
        artist: current.artists.map((a) => a.name).join(", "),
        artistId: current.artists[0]?.id ?? "",
        duration: current.durationSeconds ?? 0,
        durationText: current.durationText ?? "",
        thumbnail: current.thumbnail ?? "",
      },
      isPlaying: true,
      currentTime: 0,
    });
  }, [roomId, current, syncPlayback]);

  return { room, members, messages, isHost, sendChat, syncPlayback, poll };
}
