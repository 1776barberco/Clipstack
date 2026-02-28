'use client'

import { useState } from 'react'
import { useAuthContext } from '@/providers/AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, ArrowRight, CheckCircle, Lock } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'

type AuthMode = 'sign-in' | 'sign-up' | 'magic-link' | 'forgot-password'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [emailSentMessage, setEmailSentMessage] = useState('')
  const [mode, setMode] = useState<AuthMode>('sign-in')
  const { signInWithMagicLink, signInWithPassword, signInWithGoogle, signUp, resetPassword } = useAuthContext()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)

    if (mode === 'magic-link') {
      const { error } = await signInWithMagicLink(email)
      setLoading(false)
      if (error) {
        toast.error('Failed to send magic link. Please try again.')
      } else {
        setEmailSentMessage(`We've sent a magic link to ${email}. Click the link to sign in.`)
        setEmailSent(true)
      }
      return
    }

    if (mode === 'forgot-password') {
      const { error } = await resetPassword(email)
      setLoading(false)
      if (error) {
        toast.error(error.message || 'Failed to send reset email. Please try again.')
      } else {
        setEmailSentMessage(`We've sent a password reset link to ${email}. Check your email.`)
        setEmailSent(true)
      }
      return
    }

    if (!password) {
      setLoading(false)
      toast.error('Please enter a password.')
      return
    }

    if (mode === 'sign-up') {
      if (password.length < 6) {
        setLoading(false)
        toast.error('Password must be at least 6 characters.')
        return
      }
      const { error } = await signUp(email, password)
      setLoading(false)
      if (error) {
        toast.error(error.message || 'Failed to sign up. Please try again.')
      } else {
        toast.success('Account created! Check your email to confirm, then sign in.')
        setMode('sign-in')
        setPassword('')
      }
      return
    }

    const { error } = await signInWithPassword(email, password)
    setLoading(false)
    if (error) {
      toast.error(error.message || 'Invalid email or password.')
    }
  }

  if (emailSent) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Check Your Email</CardTitle>
          <CardDescription>{emailSentMessage}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => { setEmailSent(false); setMode('sign-in') }}
          >
            Back to sign in
          </Button>
        </CardContent>
      </Card>
    )
  }

  const getTitle = () => {
    switch (mode) {
      case 'sign-up': return 'Create Account'
      case 'forgot-password': return 'Reset Password'
      default: return 'Welcome to TipJars'
    }
  }

  const getDescription = () => {
    switch (mode) {
      case 'sign-up': return 'Enter your email and password to get started.'
      case 'magic-link': return 'Enter your email to receive a magic link.'
      case 'forgot-password': return 'Enter your email and we\'ll send you a reset link.'
      default: return 'Sign in with your email and password.'
    }
  }

  const getButtonLabel = () => {
    switch (mode) {
      case 'sign-up': return 'Sign Up'
      case 'magic-link': return 'Send Magic Link'
      case 'forgot-password': return 'Send Reset Link'
      default: return 'Sign In'
    }
  }

  const showPasswordField = mode === 'sign-in' || mode === 'sign-up'

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <Image src="/logo.jpg" alt="TipJars" width={64} height={64} className="mx-auto mb-4" />
        <CardTitle className="text-2xl">{getTitle()}</CardTitle>
        <CardDescription>{getDescription()}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          {showPasswordField && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {mode === 'sign-in' && (
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
                    onClick={() => { setMode('forgot-password'); setPassword('') }}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder={mode === 'sign-up' ? 'At least 6 characters' : 'Your password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              'Loading...'
            ) : (
              <>
                {getButtonLabel()}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={async () => {
            const { error } = await signInWithGoogle()
            if (error) toast.error(error.message || 'Google sign in failed.')
          }}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </Button>

        <div className="mt-4 space-y-2 text-center text-sm">
          {mode === 'sign-in' && (
            <>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
                onClick={() => { setMode('magic-link'); setPassword('') }}
              >
                Sign in with magic link instead
              </button>
              <p className="text-muted-foreground">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  className="text-foreground font-medium underline-offset-4 hover:underline"
                  onClick={() => { setMode('sign-up'); setPassword('') }}
                >
                  Sign up
                </button>
              </p>
            </>
          )}

          {mode === 'sign-up' && (
            <p className="text-muted-foreground">
              Already have an account?{' '}
              <button
                type="button"
                className="text-foreground font-medium underline-offset-4 hover:underline"
                onClick={() => { setMode('sign-in'); setPassword('') }}
              >
                Sign in
              </button>
            </p>
          )}

          {(mode === 'magic-link' || mode === 'forgot-password') && (
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
              onClick={() => setMode('sign-in')}
            >
              Back to sign in
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
