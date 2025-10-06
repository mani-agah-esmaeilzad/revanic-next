// src/lib/offline-cache.ts
const DB_NAME = 'revanic-offline';
const STORE_NAME = 'articles';
const VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export interface OfflineArticlePayload {
  id: number;
  title: string;
  content: string;
  savedAt: number;
}

export async function storeOfflineArticle(article: OfflineArticlePayload) {
  if (typeof window === 'undefined' || !('indexedDB' in window)) return;
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).put(article);
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getOfflineArticle(id: number): Promise<OfflineArticlePayload | undefined> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) return undefined;
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const request = tx.objectStore(STORE_NAME).get(id);
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result as OfflineArticlePayload | undefined);
    request.onerror = () => reject(request.error);
  });
}

export async function listOfflineArticles(): Promise<OfflineArticlePayload[]> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) return [];
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const request = store.getAll();
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result as OfflineArticlePayload[]);
    request.onerror = () => reject(request.error);
  });
}

export async function removeOfflineArticle(id: number) {
  if (typeof window === 'undefined' || !('indexedDB' in window)) return;
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).delete(id);
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
