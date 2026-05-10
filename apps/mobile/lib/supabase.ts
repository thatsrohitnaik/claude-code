import "react-native-url-polyfill/auto";
import { Platform, AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Use env vars or fallback to your actual Supabase project
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://quowgzfzovizdzivvuch.supabase.co";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_DvF-vO3A6GgXW0clFlPVPg_ATqurrvu";

console.log('Supabase URL:', supabaseUrl);

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    ...(Platform.OS !== "web" ? { storage: AsyncStorage } : {}),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === "web",
  },
});

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}