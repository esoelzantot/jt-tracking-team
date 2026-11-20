import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  writeBatch,
  getDocs,
} from "firebase/firestore";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut as fbSignOut } from "firebase/auth";
import { firebaseEnabled, getFirebase } from "./firebase";
import type { Collection, Dataset } from "./types";

export interface SessionUser {
  uid: string;
  email: string | null;
}

export interface Repo {
  mode: "firebase" | "local";
  subscribe(cb: (data: Dataset) => void, onError?: (e: Error) => void): () => void;
  upsert<C extends Collection>(col: C, item: Dataset[C][number]): Promise<void>;
  remove(col: Collection, id: string): Promise<void>;
  /** Writes the whole dataset; when `replace` is true, docs missing from it are deleted. */
  bulkWrite(data: Dataset, replace: boolean): Promise<void>;
  onAuth(cb: (u: SessionUser | null) => void): () => void;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
}

const COLS: Collection[] = ["clients", "agents", "branches"];
const empty = (): Dataset => ({ clients: [], agents: [], branches: [] });

/** Firestore rejects `undefined` values. */
const strip = <T extends object>(o: T) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T;

// ---------------------------------------------------------------- Firebase
function firebaseRepo(): Repo {
  const { db, auth } = getFirebase()!;
  return {
    mode: "firebase",
    subscribe(cb, onError) {
      const state = empty();
      const ready = new Set<Collection>();
      const unsubs = COLS.map((c) =>
        onSnapshot(
          collection(db, c),
          (snap) => {
            (state[c] as unknown[]) = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
            ready.add(c);
            if (ready.size === COLS.length) cb({ ...state });
          },
          (e) => onError?.(e),
        ),
      );
      return () => unsubs.forEach((u) => u());
    },
    async upsert(col, item) {
      await setDoc(doc(db, col, item.id), strip({ ...item, updatedAt: Date.now() }));
    },
    async remove(col, id) {
      await deleteDoc(doc(db, col, id));
    },
    async bulkWrite(data, replace) {
      const ops: { col: Collection; id: string; value: object | null }[] = [];
      for (const c of COLS) {
        const ids = new Set(data[c].map((x) => x.id));
        for (const item of data[c]) ops.push({ col: c, id: item.id, value: strip({ ...item, updatedAt: Date.now() }) });
        if (replace) {
          const current = await getDocs(collection(db, c));
          current.docs.forEach((d) => !ids.has(d.id) && ops.push({ col: c, id: d.id, value: null }));
        }
      }
      // Firestore batches are limited to 500 writes.
      for (let i = 0; i < ops.length; i += 450) {
        const batch = writeBatch(db);
        for (const op of ops.slice(i, i + 450)) {
          const ref = doc(db, op.col, op.id);
          if (op.value) batch.set(ref, op.value);
          else batch.delete(ref);
        }
        await batch.commit();
      }
    },
    onAuth(cb) {
      return onAuthStateChanged(auth, (u) => cb(u ? { uid: u.uid, email: u.email } : null));
    },
    async signIn(email, password) {
      await signInWithEmailAndPassword(auth, email, password);
    },
    async signOut() {
      await fbSignOut(auth);
    },
  };
}

// ---------------------------------------------------------------- Local demo
const KEY = "jt-hub:data";
const AUTH_KEY = "jt-hub:session";

function localRepo(): Repo {
  const listeners = new Set<(d: Dataset) => void>();
  const authListeners = new Set<(u: SessionUser | null) => void>();
  const read = (): Dataset => {
    try {
      return { ...empty(), ...JSON.parse(localStorage.getItem(KEY) || "{}") };
    } catch {
      return empty();
    }
  };
  const write = (d: Dataset) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(d));
    } catch {}
    listeners.forEach((l) => l(d));
  };
  const session = (): SessionUser | null => {
    try {
      return JSON.parse(localStorage.getItem(AUTH_KEY) || "null");
    } catch {
      return null;
    }
  };

  return {
    mode: "local",
    subscribe(cb) {
      listeners.add(cb);
      cb(read());
      const onStorage = (e: StorageEvent) => e.key === KEY && cb(read());
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(cb);
        window.removeEventListener("storage", onStorage);
      };
    },
    async upsert(col, item) {
      const d = read();
      const list = d[col] as { id: string }[];
      const i = list.findIndex((x) => x.id === item.id);
      const next = { ...item, updatedAt: Date.now() };
      if (i >= 0) list[i] = next;
      else list.push(next);
      write(d);
    },
    async remove(col, id) {
      const d = read();
      (d[col] as { id: string }[]) = (d[col] as { id: string }[]).filter((x) => x.id !== id);
      write(d);
    },
    async bulkWrite(data, replace) {
      if (replace) return write(data);
      const d = read();
      for (const c of COLS) {
        const map = new Map((d[c] as { id: string }[]).map((x) => [x.id, x]));
        (data[c] as { id: string }[]).forEach((x) => map.set(x.id, x));
        (d[c] as unknown[]) = [...map.values()];
      }
      write(d);
    },
    onAuth(cb) {
      authListeners.add(cb);
      cb(session());
      return () => authListeners.delete(cb);
    },
    async signIn(email) {
      const u = { uid: "local", email };
      localStorage.setItem(AUTH_KEY, JSON.stringify(u));
      authListeners.forEach((l) => l(u));
    },
    async signOut() {
      localStorage.removeItem(AUTH_KEY);
      authListeners.forEach((l) => l(null));
    },
  };
}

let repo: Repo | null = null;
export const getRepo = () => (repo ??= firebaseEnabled ? firebaseRepo() : localRepo());
