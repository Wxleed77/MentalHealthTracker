// src/utils/supabase.ts
'use client';
import { createClient } from '@supabase/supabase-js';

// Ensure these environment variables are defined
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Basic check for environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is not defined. Check your .env.local file.');
  // In a production app, you might want to throw an error or handle this more gracefully
  // For now, we'll proceed but be aware of potential issues if they're missing.
}

// Create a single Supabase client for the application
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');