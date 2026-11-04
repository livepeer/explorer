/**
 * A list kept in this browser's storage, shared across tabs. If storage
 * can't be written (private mode, a full quota), the list lives in memory
 * for the rest of the visit instead: what was just added still shows, and
 * is checked on, until a reload.
 */
export function localList<T>(key: string) {
  const listeners = new Set<() => void>();
  // Set when a write fails; read from then on, as storage is behind it.
  let memory: T[] | null = null;

  function read(): T[] {
    if (memory) return memory;
    try {
      return JSON.parse(localStorage.getItem(key) ?? "[]");
    } catch {
      return [];
    }
  }

  function write(list: T[]) {
    try {
      localStorage.setItem(key, JSON.stringify(list));
      memory = null;
    } catch {
      memory = list;
    }
    listeners.forEach((l) => l());
  }

  function subscribe(l: () => void) {
    listeners.add(l);
    // Another tab's change, unless this one has fallen back to memory.
    const onStorage = (e: StorageEvent) => e.key === key && !memory && l();
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(l);
      window.removeEventListener("storage", onStorage);
    };
  }

  return { read, write, subscribe };
}
