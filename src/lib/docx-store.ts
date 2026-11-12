export interface StoredDocx {
  id: string;
  fileName: string;
  bytes: ArrayBuffer;
  savedAt: number;
}

const DB_NAME = "alinhador-docx";
const STORE_NAME = "docx-files";
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function getDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === "undefined") {
        reject(new Error("IndexedDB indisponível neste navegador."));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;

        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(request.error ?? new Error("Falha ao abrir o IndexedDB."));
    });
  }

  return dbPromise;
}

export async function saveDocxFile(input: {
  id: string;
  fileName: string;
  bytes: ArrayBuffer;
}): Promise<void> {
  const db = await getDb();

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put({
      ...input,
      savedAt: Date.now(),
    } satisfies StoredDocx);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("Falha ao salvar o DOCX."));
  });
}

export async function loadDocxFile(id: string): Promise<StoredDocx | null> {
  const db = await getDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).get(id);

    request.onsuccess = () => resolve((request.result as StoredDocx) ?? null);
    request.onerror = () =>
      reject(request.error ?? new Error("Falha ao carregar o DOCX."));
  });
}

export async function deleteDocxFile(id: string): Promise<void> {
  const db = await getDb();

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(id);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("Falha ao remover o DOCX."));
  });
}
