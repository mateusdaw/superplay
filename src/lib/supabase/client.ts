"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

function getSupabaseBrowserConfig():
  | { url: string; anonKey: string }
  | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;

  return { url, anonKey };
}

export function createClient(): SupabaseClient | null {
  const config = getSupabaseBrowserConfig();
  if (!config) return null;

  return createBrowserClient(config.url, config.anonKey);
}

export function createRequiredClient(): SupabaseClient {
  const client = createClient();

  if (!client) {
    throw new Error(
      "Supabase client is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return client;
}
