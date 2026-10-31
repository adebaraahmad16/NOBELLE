import { realtimeTables } from './supabase-schema.js';

// One shared channel. Deferred startup/cleanup handles React StrictMode mounts;
// Supabase's client updates its Realtime auth token without recreating channels.
export function createSupabaseSync(client, { changed, status, delay = 200 } = {}) {
  let users = 0, channel, startTimer, stopTimer, refreshTimer, closing;
  const changedTables = new Set();
  function start() {
    if (!client || !users || channel || closing || startTimer) return;
    startTimer = setTimeout(() => {
      startTimer = undefined;
      if (!users || channel || closing) return;
      const active = client.channel('nobelle-live');
      channel = active;
      for (const table of realtimeTables) active.on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        if (!users || channel !== active) return;
        changedTables.add(table);
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(() => {
          if (users && channel === active) changed?.([...changedTables]);
          changedTables.clear();
        }, delay);
      });
      active.subscribe((state, error) => {
        if (users && channel === active) status?.(state, error);
      });
    }, 0);
  }
  return {
    acquire() {
      users++; clearTimeout(stopTimer); start();
      let released = false;
      return () => {
        if (released) return;
        released = true; users--;
        if (users) return;
        clearTimeout(startTimer); startTimer = undefined;
        clearTimeout(refreshTimer); changedTables.clear();
        stopTimer = setTimeout(() => {
          if (users || !channel) return;
          const previous = channel; channel = undefined;
          closing = Promise.resolve(client.removeChannel(previous)).catch(error => status?.('CHANNEL_ERROR', error)).finally(() => { closing = undefined; start(); });
        }, 0);
      };
    },
  };
}

export function affectsTables(event, tables) {
  return !event?.detail?.tables || event.detail.tables.some(table => tables.includes(table));
}
