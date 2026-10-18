// Imagens geradas pelo /render guardadas no IndexedDB do navegador, para
// sobreviverem ao recarregar. Tudo com try/catch: sem IndexedDB (modo privado,
// bloqueado), a página segue funcionando só em memória.

const DB_NAME = "audi-checker";
const STORE = "renders";

export type StoredRender = {
  /** `${accountId}:${lang}:${category}` */
  key: string;
  accountId: string;
  blob: Blob;
  createdAt: string;
};

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  dbPromise ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const store = request.result.createObjectStore(STORE, { keyPath: "key" });
      store.createIndex("accountId", "accountId");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  }).catch((err) => {
    dbPromise = null;
    throw err;
  });
  return dbPromise;
}

function done(request: IDBRequest | IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    if (request instanceof IDBTransaction) {
      request.oncomplete = () => resolve();
      request.onerror = () => reject(request.error);
      request.onabort = () => reject(request.error);
    } else {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    }
  });
}

export function renderKey(accountId: string, lang: string, category: string) {
  return `${accountId}:${lang}:${category}`;
}

export async function loadRenders(accountId: string): Promise<StoredRender[]> {
  try {
    const db = await openDb();
    const request = db.transaction(STORE, "readonly").objectStore(STORE).index("accountId").getAll(accountId);
    await done(request);
    return request.result as StoredRender[];
  } catch {
    return [];
  }
}

export async function saveRender(render: StoredRender): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(render);
    await done(tx);
  } catch {
    // sem espaço ou sem IndexedDB: a imagem fica só nesta visita
  }
}

/** Apaga todas as imagens salvas (ao sair da conta). */
export async function clearRenders(): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).clear();
    await done(tx);
  } catch {
    // nada a fazer
  }
}
