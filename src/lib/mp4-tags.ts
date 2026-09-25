// Writes iTunes-style metadata (title, artist, album, lyrics, cover) into an MP4/M4A file.
export interface Mp4Tags {
  title?: string | undefined;
  artist?: string | undefined;
  album?: string | undefined;
  lyrics?: string | undefined;
  comment?: string | undefined;
  cover?: Uint8Array | undefined;
  coverType?: string | undefined;
}

const enc = new TextEncoder();

function u32(n: number): Uint8Array {
  const b = new Uint8Array(4);
  new DataView(b.buffer).setUint32(0, n >>> 0);
  return b;
}

function concat(parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((s, p) => s + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

function box(type: string | Uint8Array, ...payload: Uint8Array[]): Uint8Array {
  const t = typeof type === "string" ? Uint8Array.from(type, (c) => c.charCodeAt(0) & 0xff) : type;
  const body = concat(payload);
  return concat([u32(8 + body.length), t, body]);
}

function dataBox(kind: number, value: Uint8Array): Uint8Array {
  return box("data", u32(kind), u32(0), value);
}

function readType(buf: Uint8Array, at: number): string {
  return String.fromCharCode(buf[at]!, buf[at + 1]!, buf[at + 2]!, buf[at + 3]!);
}

interface Box {
  type: string;
  start: number;
  size: number;
  header: number;
}

function children(buf: Uint8Array, start: number, end: number): Box[] {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const out: Box[] = [];
  let p = start;
  while (p + 8 <= end) {
    let size = dv.getUint32(p);
    let header = 8;
    if (size === 1) {
      size = Number(dv.getBigUint64(p + 8));
      header = 16;
    } else if (size === 0) size = end - p;
    if (size < header || p + size > end) break;
    out.push({ type: readType(buf, p + 4), start: p, size, header });
    p += size;
  }
  return out;
}

function buildIlst(tags: Mp4Tags): Uint8Array {
  const items: Uint8Array[] = [];
  const text = (code: number[], v?: string) => {
    if (v) items.push(box(Uint8Array.from(code), dataBox(1, enc.encode(v))));
  };
  text([0xa9, 0x6e, 0x61, 0x6d], tags.title); // ©nam
  text([0xa9, 0x41, 0x52, 0x54], tags.artist); // ©ART
  text([0x61, 0x41, 0x52, 0x54], tags.artist); // aART
  text([0xa9, 0x61, 0x6c, 0x62], tags.album); // ©alb
  text([0xa9, 0x6c, 0x79, 0x72], tags.lyrics); // ©lyr
  text([0xa9, 0x63, 0x6d, 0x74], tags.comment); // ©cmt
  text([0xa9, 0x74, 0x6f, 0x6f], "flex-web"); // ©too
  if (tags.cover?.length) {
    const kind = tags.coverType?.includes("png") ? 14 : 13;
    items.push(box("covr", dataBox(kind, tags.cover)));
  }
  return box("ilst", ...items);
}

function buildMeta(tags: Mp4Tags): Uint8Array {
  const hdlr = box("hdlr", u32(0), u32(0), enc.encode("mdir"), enc.encode("appl"), u32(0), u32(0), new Uint8Array([0]));
  return box("meta", u32(0), hdlr, buildIlst(tags));
}

/** Returns a new file with metadata embedded, or the original bytes if the layout is unsupported. */
export function writeMp4Tags(input: Uint8Array, tags: Mp4Tags): Uint8Array {
  const top = children(input, 0, input.length);
  const moov = top.find((b) => b.type === "moov");
  if (!moov || !top.some((b) => b.type === "ftyp")) return input;

  const moovBody = input.slice(moov.start + moov.header, moov.start + moov.size);
  // Drop any existing udta and append ours.
  const kids = children(moovBody, 0, moovBody.length).filter((b) => b.type !== "udta");
  const kept = concat(kids.map((b) => moovBody.slice(b.start, b.start + b.size)));
  const newMoov = box("moov", kept, box("udta", buildMeta(tags)));
  const delta = newMoov.length - moov.size;

  // Shift absolute chunk offsets (stco/co64) that point past the moov box.
  if (delta !== 0) {
    const dv = new DataView(newMoov.buffer, newMoov.byteOffset, newMoov.byteLength);
    const walk = (s: number, e: number) => {
      for (const b of children(newMoov, s, e)) {
        const bs = b.start + b.header;
        if (["trak", "mdia", "minf", "stbl"].includes(b.type)) walk(bs, b.start + b.size);
        else if (b.type === "stco") {
          const n = dv.getUint32(bs + 4);
          for (let i = 0; i < n; i++) {
            const at = bs + 8 + i * 4;
            const v = dv.getUint32(at);
            if (v >= moov.start + moov.size) dv.setUint32(at, v + delta);
          }
        } else if (b.type === "co64") {
          const n = dv.getUint32(bs + 4);
          for (let i = 0; i < n; i++) {
            const at = bs + 8 + i * 8;
            const v = dv.getBigUint64(at);
            if (v >= BigInt(moov.start + moov.size)) dv.setBigUint64(at, v + BigInt(delta));
          }
        }
      }
    };
    walk(8, newMoov.length);
  }

  return concat([input.slice(0, moov.start), newMoov, input.slice(moov.start + moov.size)]);
}
