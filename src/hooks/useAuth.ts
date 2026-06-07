'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

const fixedDashboardUsername = process.env.NEXT_PUBLIC_DASHBOARD_AUTH_USERNAME?.trim().toLowerCase()
const fixedDashboardEmail = process.env.NEXT_PUBLIC_DASHBOARD_AUTH_EMAIL?.trim()

function resolveLoginEmail(identifier: string) {
  const trimmedIdentifier = identifier.trim()

  if (
    fixedDashboardUsername &&
    fixedDashboardEmail &&
    trimmedIdentifier.toLowerCase() === fixedDashboardUsername
  ) {
    return fixedDashboardEmail
  }

  return trimmedIdentifier
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (identifier: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: resolveLoginEmail(identifier),
      password,
    })
    return { data, error }
  }

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const signInWithOAuth = async (provider: 'google' | 'github') => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
      },
    })
    return { data, error }
  }

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithOAuth,
    isAuthenticated: !!user,
  }
}
