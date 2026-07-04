// Supabase browser client — disconnected from the old project.
// Reads config from env; throws a clear error if not configured.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) || '';
const SUPABASE_PUBLISHABLE_KEY =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) || '';

function createDisconnectedProxy(): ReturnType<typeof createClient<Database>> {
  const message =
    'Supabase is not connected. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to connect a new Supabase project.';
  const handler: ProxyHandler<object> = {
    get() {
      throw new Error(message);
    },
    apply() {
      throw new Error(message);
    },
  };
  return new Proxy({}, handler) as ReturnType<typeof createClient<Database>>;
}

export const supabase =
  SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY
    ? createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: {
          storage:
            typeof window !== 'undefined' ? window.localStorage : undefined,
          persistSession: true,
          autoRefreshToken: true,
        },
      })
    : createDisconnectedProxy();
