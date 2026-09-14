import type { RoomMessage, RoomMember, RoomState } from "./music-types";

const rooms = new Map<string, RoomState>();
const memberMaps = new Map<string, Map<string, RoomMember>>();
const HEARTBEAT_INTERVAL = 30_000;
const ROOM_TTL = 24 * 60 * 60_000;

function generateRoomId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const parts = [0, 1, 2, 3].map(() =>
    Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join(""),
  );
  return parts.join("-");
}

function cleanExpiredRooms(): void {
  const now = Date.now();
  for (const [id, room] of rooms) {
    if (now - room.createdAt > ROOM_TTL) {
      rooms.delete(id);
      memberMaps.delete(id);
    }
  }
}

export function createRoom(hostId: string, hostName: string): RoomState {
  cleanExpiredRooms();
  const roomId = generateRoomId();
  const memberMap = new Map<string, RoomMember>([
    [hostId, { id: hostId, name: hostName, joinedAt: Date.now(), isHost: true }],
  ]);
  memberMaps.set(roomId, memberMap);
  const room: RoomState = {
    roomId,
    hostId,
    members: Array.from(memberMap.values()),
    isPlaying: false,
    currentTime: 0,
    queue: [],
    messages: [],
    createdAt: Date.now(),
  };
  rooms.set(roomId, room);
  return room;
}

export function joinRoom(roomId: string, userId: string, userName: string): RoomState | null {
  const room = rooms.get(roomId);
  if (!room) return null;
  const memberMap = memberMaps.get(roomId)!;
  if (memberMap.has(userId)) {
    const member = memberMap.get(userId)!;
    member.joinedAt = Date.now();
    return room;
  }
  memberMap.set(userId, { id: userId, name: userName, joinedAt: Date.now(), isHost: false });
  room.members = Array.from(memberMap.values());
  return room;
}

export function leaveRoom(roomId: string, userId: string): boolean {
  const room = rooms.get(roomId);
  if (!room) return false;
  const memberMap = memberMaps.get(roomId);
  if (!memberMap) return false;
  memberMap.delete(userId);
  room.members = Array.from(memberMap.values());
  if (memberMap.size === 0) {
    rooms.delete(roomId);
    memberMaps.delete(roomId);
  }
  return true;
}

export function updateRoomState(
  roomId: string,
  updates: Partial<Pick<RoomState, "currentTrack" | "isPlaying" | "currentTime" | "queue">>,
): RoomState | null {
  const room = rooms.get(roomId);
  if (!room) return null;
  Object.assign(room, updates);
  return room;
}

export function sendChatMessage(
  roomId: string,
  senderId: string,
  text: string,
): RoomMessage | null {
  const room = rooms.get(roomId);
  if (!room) return null;
  if (!room.members.some((m) => m.id === senderId)) return null;
  const message: RoomMessage = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: "chat",
    senderId,
    timestamp: Date.now(),
    payload: { text },
  };
  room.messages.push(message);
  if (room.messages.length > 200) {
    room.messages = room.messages.slice(-200);
  }
  return message;
}

export function sendPing(roomId: string, senderId: string): RoomMessage | null {
  const room = rooms.get(roomId);
  if (!room) return null;
  const message: RoomMessage = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: "ping",
    senderId,
    timestamp: Date.now(),
    payload: {},
  };
  room.messages.push(message);
  return message;
}

export function getRoomState(roomId: string): RoomState | null {
  const room = rooms.get(roomId);
  if (!room) return null;
  const memberMap = memberMaps.get(roomId);
  if (memberMap) {
    const now = Date.now();
    for (const [id, member] of memberMap) {
      const age = now - member.joinedAt;
      if (age > HEARTBEAT_INTERVAL * 3 && id !== room.hostId) {
        memberMap.delete(id);
      }
    }
    room.members = Array.from(memberMap.values());
  }
  return room;
}

export function getRoomMessages(
  roomId: string,
  since = 0,
): { messages: RoomMessage[]; members: RoomMember[] } {
  const room = rooms.get(roomId);
  if (!room) return { messages: [], members: [] };
  return {
    messages: room.messages.filter((m) => m.timestamp >= since),
    members: room.members,
  };
}

export function getRoomById(roomId: string): RoomState | null {
  return rooms.get(roomId) ?? null;
}

export function isRoomHost(roomId: string, userId: string): boolean {
  const room = rooms.get(roomId);
  if (!room) return false;
  return room.hostId === userId;
}

export function removeMember(roomId: string, userId: string): boolean {
  const room = rooms.get(roomId);
  if (!room) return false;
  if (room.hostId !== userId) return false;
  const memberMap = memberMaps.get(roomId);
  if (memberMap) {
    memberMap.delete(userId);
    if (memberMap.size === 0) {
      rooms.delete(roomId);
      memberMaps.delete(roomId);
    }
  }
  room.members = room.members.filter((m) => m.id !== userId);
  return true;
}

export { HEARTBEAT_INTERVAL, ROOM_TTL };
