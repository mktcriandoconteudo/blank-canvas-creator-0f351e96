import { useState, useEffect, useCallback } from "react";
import { supabase, getWalletClient } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

interface AuthUser {
  id: string;
  email: string;
  username: string;
  walletAddress: string;
  avatarUrl: string | null;
}

export const useAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (authUser: User) => {
    const { data } = await supabase
      .from("users")
      .select("wallet_address, username, avatar_url")
      .eq("auth_id", authUser.id)
      .maybeSingle();

    if (data) {
      setUser({
        id: authUser.id,
        email: authUser.email ?? "",
        username: data.username ?? "Piloto",
        walletAddress: data.wallet_address,
        avatarUrl: data.avatar_url ?? null,
      });

      // Update last_seen_at for online tracking (needs wallet header for RLS)
      const walletClient = getWalletClient(data.wallet_address);
      walletClient
        .from("users")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("wallet_address", data.wallet_address)
        .then(() => {});
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session?.user) {
          setTimeout(() => fetchProfile(session.user), 0);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  // Heartbeat: update last_seen_at every 5 minutes while user is active
  useEffect(() => {
    if (!user) return;
    const ping = () => {
      const walletClient = getWalletClient(user.walletAddress);
      walletClient
        .from("users")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("wallet_address", user.walletAddress)
        .then(() => {});
    };
    ping();
    const interval = setInterval(ping, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  const signUp = async (email: string, password: string, username: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        emailRedirectTo: window.location.origin,
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return { session, user, loading, signUp, signIn, signOut };
};
