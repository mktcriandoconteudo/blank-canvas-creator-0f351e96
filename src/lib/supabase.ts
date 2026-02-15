// Re-export the single Supabase client instance to avoid multiple GoTrueClient instances
import { supabase } from "@/integrations/supabase/client";
import { createClient } from "@supabase/supabase-js";

export { supabase };

const supabaseUrl = "https://cktbtbpyiqvgadseulpt.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrdGJ0YnB5aXF2Z2Fkc2V1bHB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExMDY5OTEsImV4cCI6MjA4NjY4Mjk5MX0.YJfZ4y3UaTkcO0bnNdjYgZ-dNJ0u4jlK5zJxOxLUql0";

/**
 * Creates a Supabase client with the wallet address header
 * for RLS-protected mutations. Uses auth: false to avoid
 * creating additional GoTrueClient instances.
 */
export function getWalletClient(wallet: string) {
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: { "x-wallet-address": wallet },
    },
  });
}
