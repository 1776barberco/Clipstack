'use client'

import { useState } from 'react'
import { useAuthContext } from '@/providers/AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Scissors, Mail, ArrowRight, CheckCircle, Lock } from 'lucide-react'
import { toast } from 'sonner'

type AuthMode = 'sign-in' | 'sign-up' | 'magic-link' | 'forgot-password'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [emailSentMessage, setEmailSentMessage] = useState('')
  const [mode, setMode] = useState<AuthMode>('sign-in')
  const { signInWithMagicLink, signInWithPassword, signUp, resetPassword } = useAuthContext()

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
      default: return 'Welcome to ClipStack'
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
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary">
          <Scissors className="h-8 w-8 text-primary-foreground" />
        </div>
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
