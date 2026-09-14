type StoreName =
  | "tracks"
  | "artists"
  | "albums"
  | "playlists"
  | "lyrics"
  | "history"
  | "downloads"
  | "settings"
  | "searchHistory"
  | "queue";

const DB_NAME = "flex-web-db";
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const stores: StoreName[] = [
        "tracks",
        "artists",
        "albums",
        "playlists",
        "lyrics",
        "history",
        "downloads",
        "settings",
        "searchHistory",
        "queue",
      ];
      for (const name of stores) {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { keyPath: "id" });
        }
      }
    };
  });
  return dbPromise;
}

export async function dbGet(
  store: StoreName,
  id: string,
): Promise<Record<string, unknown> | undefined> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const store_ = tx.objectStore(store);
    const request = store_.get(id);
    request.onsuccess = () => resolve(request.result ?? undefined);
    request.onerror = () => reject(request.error);
  });
}

export async function dbPut(store: StoreName, data: Record<string, unknown>): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    const store_ = tx.objectStore(store);
    const request = store_.put(data);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function dbDelete(store: StoreName, id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    const store_ = tx.objectStore(store);
    const request = store_.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function dbGetAll(store: StoreName): Promise<Record<string, unknown>[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const store_ = tx.objectStore(store);
    const request = store_.getAll();
    request.onsuccess = () => resolve(request.result ?? []);
    request.onerror = () => reject(request.error);
  });
}

export async function dbClear(store: StoreName): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    const store_ = tx.objectStore(store);
    const request = store_.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
