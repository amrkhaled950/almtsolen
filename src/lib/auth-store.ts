import { create } from "zustand";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthState = {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  initialized: boolean;
  init: () => Promise<void>;
  signOut: () => Promise<void>;
};

let initStarted = false;

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isAdmin: false,
  loading: true,
  initialized: false,
  init: async () => {
    if (initStarted || typeof window === "undefined") return;
    initStarted = true;

    const checkRole = async (userId: string | undefined) => {
      if (!userId) return false;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      return !!data;
    };

    supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null;
      set({ session, user, loading: false, initialized: true });
      // Defer role lookup so the listener isn't blocked
      setTimeout(async () => {
        const isAdmin = await checkRole(user?.id);
        set({ isAdmin });
      }, 0);
    });

    const { data } = await supabase.auth.getSession();
    const user = data.session?.user ?? null;
    const isAdmin = await checkRole(user?.id);
    set({ session: data.session, user, isAdmin, loading: false, initialized: true });
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, isAdmin: false });
  },
}));

// Convenience initializer to call once in the app shell
export function ensureAuthInit() {
  if (typeof window === "undefined") return;
  const { initialized } = useAuth.getState();
  if (!initialized) useAuth.getState().init();
}
