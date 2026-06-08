'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { Workflow, Eye, EyeOff, ArrowRight, LayoutDashboard, KeyRound } from 'lucide-react'

const isGithubOAuthEnabled = process.env.NEXT_PUBLIC_ENABLE_GITHUB_OAUTH === 'true'
const genericResetMessage = 'If an account exists for that email, a reset link has been sent.'

export default function LoginPage() {
  const router = useRouter()
  const { signIn, signInWithOAuth, signUp } = useAuth()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [resetEmail, setResetEmail] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isResetLoading, setIsResetLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [isResetMode, setIsResetMode] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const params = new URLSearchParams(window.location.search)
    if (params.get('message') === 'password-reset') {
      setMessage('Your password has been reset. Please sign in.')
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setMessage('')

    if (isSignUp) {
      const { error } = await signUp(identifier, password)
      if (error) {
        setError(error.message)
      } else {
        setMessage('Check your email to confirm your account!')
      }
    } else {
      const { error } = await signIn(identifier, password)
      if (error) {
        setError(error.message)
      } else {
        router.push('/')
      }
    }
    setIsLoading(false)
  }

  const handlePasswordReset = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setIsResetLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null) as { error?: string } | null
        setError(data?.error || 'Enter a valid email address.')
        return
      }

      setMessage(genericResetMessage)
    } catch {
      setError('Password reset is temporarily unavailable. Try again later.')
    } finally {
      setIsResetLoading(false)
    }
  }

  const switchToResetMode = () => {
    setError('')
    setMessage('')
    setIsSignUp(false)
    setResetEmail(identifier.includes('@') ? identifier : '')
    setIsResetMode(true)
  }

  const switchToSignInMode = () => {
    setError('')
    setMessage('')
    setIsResetMode(false)
    setIsSignUp(false)
  }

  const handleOAuth = async (provider: 'google' | 'github') => {
    setIsLoading(true)
    setError('')
    const { error } = await signInWithOAuth(provider)
    if (error) {
      setError(error.message)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="mx-auto flex w-full max-w-6xl justify-end">
        <a
          href="https://dashboards-panel.maximo-seo.ai/"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-cyan-300/60 bg-cyan-500/15 px-3 text-sm font-semibold text-cyan-100 shadow-lg shadow-cyan-500/15 transition-colors hover:bg-cyan-400/20 hover:text-white"
          aria-label="Back to all dashboards"
          title="Back to all dashboards"
        >
          <LayoutDashboard className="h-4 w-4" />
          <span className="hidden sm:inline">All Dashboards</span>
          <span className="sm:hidden">Dashboards</span>
        </a>
      </div>

      <div className="flex min-h-[calc(100vh-4.75rem)] items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 mb-4 shadow-lg shadow-blue-500/25">
            <Workflow className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">n8n Dashboard</h1>
          <p className="text-slate-400">MaximoSEO Command Center</p>
        </div>

        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-white">
              {isResetMode ? 'Reset password' : isSignUp ? 'Create account' : 'Welcome back'}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {isResetMode
                ? 'Enter your email and we will send a secure reset link'
                : isSignUp
                  ? 'Sign up to access your SEO workflows and tools'
                  : 'Sign in to access your SEO workflows and tools'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isResetMode ? (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                  </div>
                )}
                {message && (
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                    {message}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="resetEmail" className="text-slate-300">Email</Label>
                  <Input
                    id="resetEmail"
                    name="resetEmail"
                    type="email"
                    autoComplete="email"
                    placeholder="name@company.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isResetLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11"
                >
                  {isResetLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4 mr-2" />
                      Send reset link
                    </>
                  )}
                </Button>

                <button
                  type="button"
                  onClick={switchToSignInMode}
                  className="min-h-11 text-sm text-blue-400 hover:text-blue-300 w-full text-center"
                >
                  Back to sign in
                </button>
              </form>
            ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}
              {message && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                  {message}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="identifier" className="text-slate-300">Username or email</Label>
                <Input
                  id="identifier"
                  name="identifier"
                  type="text"
                  autoComplete="username"
                  spellCheck={false}
                  placeholder="Username or name@company.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-slate-800 border-slate-700 pr-12 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-1/2 flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {!isSignUp && (
                <button
                  type="button"
                  onClick={switchToResetMode}
                  className="min-h-11 text-sm text-blue-400 hover:text-blue-300 w-full text-right"
                >
                  Forgot password?
                </button>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                ) : (
                  <>
                    {isSignUp ? 'Sign Up' : 'Sign In'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-slate-900 px-2 text-slate-500">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOAuth('google')}
                  disabled={isLoading}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => isGithubOAuthEnabled ? handleOAuth('github') : setError('GitHub sign-in is not configured yet. Use email/password for now.')}
                  disabled={isLoading}
                  className={
                    isGithubOAuthEnabled
                      ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                      : 'cursor-not-allowed border-slate-800 text-slate-500 hover:bg-transparent'
                  }
                  title={isGithubOAuthEnabled ? 'Continue with GitHub' : 'GitHub OAuth provider is not configured'}
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  <span className="truncate">{isGithubOAuthEnabled ? 'GitHub' : 'GitHub setup needed'}</span>
                </Button>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline" className="text-xs border-slate-700 text-slate-500">
                    Workflows
                  </Badge>
                  <Badge variant="outline" className="text-xs border-slate-700 text-slate-500">
                    URL Previewer
                  </Badge>
                  <Badge variant="outline" className="text-xs border-slate-700 text-slate-500">
                    KW Research
                  </Badge>
                  <Badge variant="outline" className="text-xs border-slate-700 text-slate-500">
                    Link Building
                  </Badge>
                  <Badge variant="outline" className="text-xs border-slate-700 text-slate-500">
                    Nofollow Clone
                  </Badge>
                </div>
                
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="min-h-11 w-full text-center text-sm text-blue-400 hover:text-blue-300"
                >
                  {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                </button>
              </div>
            </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-slate-500 text-sm mt-6">
          Secured by Supabase Auth
        </p>
      </div>
      </div>
    </div>
  )
}
