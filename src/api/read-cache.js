// Short-lived public reads only. Never cache errors or private account records.
export function createReadCache({ ttl = 1500, now = Date.now } = {}) {
  const entries = new Map();
  return {
    invalidate() { entries.clear(); },
    run(key, load) {
      const existing = entries.get(key);
      if (existing && (existing.pending || existing.expires > now())) return existing.promise;
      for (const [name, entry] of entries) if (!entry.pending && entry.expires <= now()) entries.delete(name);
      if (entries.size >= 100) entries.delete(entries.keys().next().value);
      const entry = { pending: true, expires: 0 };
      entry.promise = Promise.resolve().then(load).then(data => {
        entry.pending = false; entry.expires = now() + ttl; return data;
      }, error => { if (entries.get(key) === entry) entries.delete(key); throw error; });
      entries.set(key, entry);
      return entry.promise;
    },
  };
}
export const publicReads = createReadCache();
