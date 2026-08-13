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

function getCachedAdmin(userId: string | undefined): boolean {
  if (!userId || typeof window === "undefined") return false;
  try {
    return localStorage.getItem(`is_admin_${userId}`) === "true";
  } catch {
    return false;
  }
}

function setCachedAdmin(userId: string | undefined, isAdmin: boolean) {
  if (!userId || typeof window === "undefined") return;
  try {
    if (isAdmin) {
      localStorage.setItem(`is_admin_${userId}`, "true");
    } else {
      localStorage.removeItem(`is_admin_${userId}`);
    }
  } catch {
    /* ignore */
  }
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isAdmin: false,
  loading: true,
  initialized: false,
  init: async () => {
    if (initStarted || typeof window === "undefined") return;
    initStarted = true;

    const checkRole = async (user: User | null | undefined): Promise<boolean> => {
      if (!user) return false;

      // If cached as admin for this session, keep it
      if (getCachedAdmin(user.id)) return true;

      // Check app_metadata / user_metadata
      if (user.app_metadata?.role === "admin" || user.user_metadata?.role === "admin") {
        setCachedAdmin(user.id, true);
        return true;
      }

      // Check user_roles table in Supabase
      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (data) {
          setCachedAdmin(user.id, true);
          return true;
        }

        // If query errored due to network/RLS transition, fall back to cache
        if (error && getCachedAdmin(user.id)) {
          return true;
        }
      } catch {
        if (getCachedAdmin(user.id)) return true;
      }

      return false;
    };

    supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null;
      const cached = getCachedAdmin(user?.id);
      set({ session, user, isAdmin: cached, loading: false, initialized: true });

      if (user) {
        const isAdmin = await checkRole(user);
        set({ isAdmin });
      } else {
        set({ isAdmin: false });
      }
    });

    const { data } = await supabase.auth.getSession();
    const user = data.session?.user ?? null;
    const cached = getCachedAdmin(user?.id);
    const isAdmin = user ? (cached || (await checkRole(user))) : false;
    set({ session: data.session, user, isAdmin, loading: false, initialized: true });
  },
  signOut: async () => {
    const currentUserId = get().user?.id;
    if (currentUserId && typeof window !== "undefined") {
      try {
        localStorage.removeItem(`is_admin_${currentUserId}`);
      } catch {}
    }
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
