// Re-export the single Supabase client instance to avoid multiple GoTrueClient instances
import { supabase } from "@/integrations/supabase/client";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

export { supabase };

const supabaseUrl = "https://cktbtbpyiqvgadseulpt.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrdGJ0YnB5aXF2Z2Fkc2V1bHB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExMDY5OTEsImV4cCI6MjA4NjY4Mjk5MX0.YJfZ4y3UaTkcO0bnNdjYgZ-dNJ0u4jlK5zJxOxLUql0";

/**
 * Cache wallet clients to avoid creating multiple GoTrueClient instances.
 */
const walletClientCache = new Map<string, SupabaseClient>();

export function getWalletClient(wallet: string) {
  const cached = walletClientCache.get(wallet);
  if (cached) return cached;

  const client = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: { "x-wallet-address": wallet },
    },
  });
  walletClientCache.set(wallet, client);
  return client;
}
