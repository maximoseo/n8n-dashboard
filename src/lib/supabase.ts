import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wtpczvyupmavzrxisvcm.supabase.co'
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0cGN6dnl1cG1hdnpyeGlzdmNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3MjEyOTgsImV4cCI6MjA4NDI5NzI5OH0.-_AP23-lVz_v3HPrqp4HfN4_QJZ_0zklfyRb9tSeTk4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
})
