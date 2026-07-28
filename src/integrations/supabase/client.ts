// Supabase browser client — disconnected from the old project.
// Reads config from env; throws a clear error if not configured.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SELFHOST_SUPABASE_URL = 'https://supabase-al-mtsolen.creativessquare.store';
const SELFHOST_SUPABASE_PUBLISHABLE_KEY =
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc4MzExOTQyMCwiZXhwIjo0OTM4NzkzMDIwLCJyb2xlIjoiYW5vbiJ9.ykWR6X6NsWxAmjZvUoHJuqwONjUw6OXbCF-X7Bzp8WQ';

const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) || SELFHOST_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  SELFHOST_SUPABASE_PUBLISHABLE_KEY;

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
