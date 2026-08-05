import { useState, useEffect, useCallback, useRef } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EvaluationDraft {
  evaluation_id: string;
  notes: Array<{ note: number; commentaire?: string; [key: string]: unknown }>;
  commentaire_general?: string;
  saved_at: number; // Date.now()
  synced: boolean;
}

export interface UseOfflineSyncReturn {
  saveDraft: (
    evaluationId: string,
    notes: EvaluationDraft['notes'],
    commentaire?: string,
  ) => Promise<void>;
  getDraft: (evaluationId: string) => Promise<EvaluationDraft | null>;
  deleteDraft: (evaluationId: string) => Promise<void>;
  syncDraft: (evaluationId: string) => Promise<boolean>;
  syncAll: () => Promise<{ synced: number; failed: number }>;
  pendingCount: number;
  isSyncing: boolean;
  isOnline: boolean;
  lastSyncTime: Date | null;
}

// ---------------------------------------------------------------------------
// IndexedDB helpers
// ---------------------------------------------------------------------------

const DB_NAME = 'sabc_eval360_drafts';
const DB_VERSION = 1;
const STORE_NAME = 'drafts';
const TOKEN_KEY = 'sabc_access_token';
const API_BASE_URL = (import.meta as ImportMeta & { env: Record<string, string> }).env
  ?.VITE_API_URL ?? '/api';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'evaluation_id' });
      }
    };

    request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);
    request.onerror = (event) => reject((event.target as IDBOpenDBRequest).error);
  });
}

function idbPut(db: IDBDatabase, draft: EvaluationDraft): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(draft);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function idbGet(db: IDBDatabase, evaluationId: string): Promise<EvaluationDraft | null> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(evaluationId);
    req.onsuccess = () => resolve((req.result as EvaluationDraft) ?? null);
    req.onerror = () => reject(req.error);
  });
}

function idbDelete(db: IDBDatabase, evaluationId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(evaluationId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function idbGetAllPending(db: IDBDatabase): Promise<EvaluationDraft[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => {
      const all = (req.result as EvaluationDraft[]) ?? [];
      resolve(all.filter((d) => !d.synced));
    };
    req.onerror = () => reject(req.error);
  });
}

function idbCountPending(db: IDBDatabase): Promise<number> {
  return idbGetAllPending(db).then((drafts) => drafts.length);
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useOfflineSync(): UseOfflineSyncReturn {
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Keep a stable reference to the open DB — opened once on mount.
  const dbRef = useRef<IDBDatabase | null>(null);
  // Track previous online state to detect the offline → online transition.
  const wasOnlineRef = useRef<boolean>(navigator.onLine);

  // ------------------------------------------------------------------
  // DB initialisation
  // ------------------------------------------------------------------

  const getDb = useCallback(async (): Promise<IDBDatabase> => {
    if (dbRef.current) return dbRef.current;
    const db = await openDatabase();
    dbRef.current = db;
    return db;
  }, []);

  // ------------------------------------------------------------------
  // pendingCount refresh helper
  // ------------------------------------------------------------------

  const refreshPendingCount = useCallback(async () => {
    const db = await getDb();
    const count = await idbCountPending(db);
    setPendingCount(count);
  }, [getDb]);

  // ------------------------------------------------------------------
  // saveDraft
  // ------------------------------------------------------------------

  const saveDraft = useCallback(
    async (
      evaluationId: string,
      notes: EvaluationDraft['notes'],
      commentaire?: string,
    ): Promise<void> => {
      const db = await getDb();
      const draft: EvaluationDraft = {
        evaluation_id: evaluationId,
        notes,
        commentaire_general: commentaire,
        saved_at: Date.now(),
        synced: false,
      };
      await idbPut(db, draft);
      await refreshPendingCount();
    },
    [getDb, refreshPendingCount],
  );

  // ------------------------------------------------------------------
  // getDraft
  // ------------------------------------------------------------------

  const getDraft = useCallback(
    async (evaluationId: string): Promise<EvaluationDraft | null> => {
      const db = await getDb();
      return idbGet(db, evaluationId);
    },
    [getDb],
  );

  // ------------------------------------------------------------------
  // deleteDraft
  // ------------------------------------------------------------------

  const deleteDraft = useCallback(
    async (evaluationId: string): Promise<void> => {
      const db = await getDb();
      await idbDelete(db, evaluationId);
      await refreshPendingCount();
    },
    [getDb, refreshPendingCount],
  );

  // ------------------------------------------------------------------
  // syncDraft
  // ------------------------------------------------------------------

  const syncDraft = useCallback(
    async (evaluationId: string): Promise<boolean> => {
      const db = await getDb();
      const draft = await idbGet(db, evaluationId);
      if (!draft) return false;
      if (draft.synced) return true;

      const token = localStorage.getItem(TOKEN_KEY);
      const url = `${API_BASE_URL}/evaluations/${evaluationId}`;

      try {
        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            notes: draft.notes,
            commentaire_general: draft.commentaire_general,
          }),
        });

        if (!response.ok) return false;

        // Mark as synced in IndexedDB
        const syncedDraft: EvaluationDraft = { ...draft, synced: true };
        await idbPut(db, syncedDraft);
        await refreshPendingCount();
        return true;
      } catch {
        return false;
      }
    },
    [getDb, refreshPendingCount],
  );

  // ------------------------------------------------------------------
  // syncAll
  // ------------------------------------------------------------------

  const syncAll = useCallback(async (): Promise<{ synced: number; failed: number }> => {
    setIsSyncing(true);
    let synced = 0;
    let failed = 0;

    try {
      const db = await getDb();
      const pending = await idbGetAllPending(db);

      await Promise.all(
        pending.map(async (draft) => {
          const success = await syncDraft(draft.evaluation_id);
          if (success) {
            synced += 1;
          } else {
            failed += 1;
          }
        }),
      );

      if (synced > 0) {
        setLastSyncTime(new Date());
      }
    } finally {
      setIsSyncing(false);
    }

    return { synced, failed };
  }, [getDb, syncDraft]);

  // ------------------------------------------------------------------
  // Online/offline listeners + auto-sync on reconnect
  // ------------------------------------------------------------------

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-sync when transitioning from offline to online.
  useEffect(() => {
    if (isOnline && !wasOnlineRef.current) {
      syncAll().catch((err) =>
        console.error('[useOfflineSync] Auto-sync on reconnect failed:', err),
      );
    }
    wasOnlineRef.current = isOnline;
  }, [isOnline, syncAll]);

  // ------------------------------------------------------------------
  // Initial pending count load + DB cleanup on unmount
  // ------------------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    openDatabase()
      .then((db) => {
        dbRef.current = db;
        if (!cancelled) return idbCountPending(db);
        return 0;
      })
      .then((count) => {
        if (!cancelled) setPendingCount(count);
      })
      .catch((err) => console.error('[useOfflineSync] DB init error:', err));

    return () => {
      cancelled = true;
      // Close the DB connection on unmount so the browser can GC it.
      dbRef.current?.close();
      dbRef.current = null;
    };
  }, []);

  // ------------------------------------------------------------------
  // Return
  // ------------------------------------------------------------------

  return {
    saveDraft,
    getDraft,
    deleteDraft,
    syncDraft,
    syncAll,
    pendingCount,
    isSyncing,
    isOnline,
    lastSyncTime,
  };
}

export default useOfflineSync;
