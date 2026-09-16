/**
 * Utilitário de persistência robusta usando IndexedDB nativo do navegador.
 * Diferente do localStorage (que tem limite rígido de 5MB e estoura com fotos),
 * o IndexedDB suporta centenas de Megabytes, garantindo que todas as fotos do
 * Cronograma e do Informe Mensal nunca sejam perdidas ao atualizar a página (F5/reload).
 */

const DB_NAME = 'PMESP_Manutencao3Cia_DB';
const DB_VERSION = 1;
const STORE_NAME = 'app_state_store';

function abrirBanco(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB não suportado neste ambiente'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

/**
 * Salva um valor no IndexedDB de forma assíncrona
 */
export async function salvarItemIndexedDB<T>(chave: string, valor: T): Promise<void> {
  try {
    const db = await abrirBanco();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(valor, chave);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`Aviso ao salvar ${chave} no IndexedDB:`, err);
  }
}

/**
 * Carrega um valor do IndexedDB
 */
export async function carregarItemIndexedDB<T>(chave: string): Promise<T | null> {
  try {
    const db = await abrirBanco();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(chave);

      req.onsuccess = () => {
        resolve((req.result as T) ?? null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`Aviso ao carregar ${chave} do IndexedDB:`, err);
    return null;
  }
}

/**
 * Remove um item do IndexedDB
 */
export async function removerItemIndexedDB(chave: string): Promise<void> {
  try {
    const db = await abrirBanco();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(chave);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`Aviso ao remover ${chave} do IndexedDB:`, err);
  }
}
