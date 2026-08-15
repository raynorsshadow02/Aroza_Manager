// src/lib/api.ts
import { supabase, isSupabaseConfigured } from './supabase';
import { clearAllLocalStorage } from './data-service';

/**
 * Helper functions for making API calls from the client.
 */
export async function resetAllBusinessData() {
  let token: string | undefined;

  if (isSupabaseConfigured() && supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    token = session?.access_token;
  }

  // Always reset client local storage state
  clearAllLocalStorage();

  // If Supabase is connected, call server endpoint for DB and storage reset
  if (isSupabaseConfigured() && token) {
    const res = await fetch('/api/reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to reset business data');
    }

    return res.json();
  }

  return { success: true, mode: 'local' };
}
