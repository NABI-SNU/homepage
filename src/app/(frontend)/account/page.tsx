'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { FormEvent, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Github,
  LogOut,
  Pencil,
  ExternalLink,
  FileText,
  Shield,
  Mail,
  User,
  ChevronRight,
} from 'lucide-react'

import {
  getAuthFeedbackForReason,
  inferAuthGateReasonFromError,
  inferAuthGateReasonFromOAuthErrorQuery,
  isAuthGateReason,
  shouldLookupAuthState,
  type AuthGateReason,
} from '@/auth/authGateReason'
import { authClient } from '@/auth/betterAuthClient'
import { PersonAvatar } from '@/components/people/PersonAvatar'

const providerOptions = [
  { label: 'Continue with GitHub', provider: 'github' },
  { label: 'Continue with Google', provider: 'google' },
] as const
const signInRequirementsMessage =
  'Only members of NABI may join. Sign-in requires email verification; member emails listed in People can log in without manual approval.'

const approvalStatusMessages: Record<string, string> = {
  approved: 'User approved successfully.',
  already: 'That user is already approved.',
  expired: 'Approval link expired. Request a new approval email.',
  invalid: 'Approval link is invalid.',
  'not-found': 'User not found for this approval link.',
  error: 'Approval request failed. Please try again.',
}

const GoogleLogo = () => (
  <svg aria-hidden className="h-5 w-5" viewBox="0 0 24 24">
    <path
      d="M21.8 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.5c-.2 1.2-1 2.2-2.1 2.9v2.4h3.4c2-1.8 3-4.4 3-7.1z"
      fill="#4285F4"
    />
    <path
      d="M12 22c2.7 0 5-.9 6.7-2.5l-3.4-2.4c-.9.6-2.1 1-3.3 1-2.5 0-4.7-1.7-5.5-4.1H3v2.5C4.7 19.9 8.1 22 12 22z"
      fill="#34A853"
    />
    <path
      d="M6.5 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.5H3A10 10 0 0 0 2 12c0 1.6.4 3.1 1 4.5L6.5 14z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.9c1.4 0 2.6.5 3.6 1.4l2.7-2.7C16.9 3.2 14.7 2 12 2 8.1 2 4.7 4.1 3 7.5L6.5 10C7.3 7.6 9.5 5.9 12 5.9z"
      fill="#EA4335"
    />
  </svg>
)

const providerIconMap = {
  github: <Github className="h-5 w-5" />,
  google: <GoogleLogo />,
} as const

type ProfileResponse = {
  actions?: {
    adminURL?: string
    postCreateURL?: string
    profileEditURL?: string
    profileURL?: string
    wikiCreateURL?: string
  }
  linkedPerson?: {
    id: number
    name?: string | null
    slug?: string | null
  } | null
  permissions?: {
    canAccessAdmin?: boolean
    canCreatePost?: boolean
    canCreateWiki?: boolean
    canPublishOwnPosts?: boolean
    canPublishOwnWiki?: boolean
  } | null
  recentPosts?: Array<{
    editURL: string
    id: number
    slug: string
    status: 'draft' | 'published'
    title: string
    updatedAt?: string | null
    viewURL: string
  }>
  recentWiki?: Array<{
    editURL: string
    id: number
    slug: string
    status: 'draft' | 'published'
    title: string
    updatedAt?: string | null
    viewURL: string
  }>
  user?: {
    id: number
    name?: string | null
    roles?: string | string[] | null
  } | null
}

type AuthStateLookupResponse = {
  allowed?: boolean
  message?: string
  reason?: string
}

const isAdminRole = (roles: string | string[] | null | undefined): boolean => {
  if (Array.isArray(roles)) return roles.includes('admin')
  return roles === 'admin'
}

const AccountPageFallback = () => (
  <main className="container py-16">
    <div className="mx-auto max-w-2xl rounded-2xl border border-border p-8 shadow-sm sm:p-10">
      <p className="text-center text-base uppercase tracking-[0.2em] text-primary">Account</p>
      <h1 className="mt-3 text-center text-5xl font-semibold sm:text-6xl">Account</h1>
      <p className="mt-6 text-base text-muted-foreground">Loading account...</p>
    </div>
  </main>
)

function AccountPageContent() {
  const { data: session, isPending, refetch } = authClient.useSession()
  const searchParams = useSearchParams()
  const oauthError = searchParams.get('error')
  const lastHandledOAuthError = useRef<string | null>(null)

  const [isSignUpMode, setIsSignUpMode] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)
  const [authMessage, setAuthMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isOAuthPending, setIsOAuthPending] = useState(false)
  const [dashboard, setDashboard] = useState<ProfileResponse | null>(null)
  const [sessionUserOverride, setSessionUserOverride] = useState<{ email?: string | null } | null>(
    null,
  )
  const [authGateReason, setAuthGateReason] = useState<AuthGateReason | null>(null)
  const [toastID, setToastID] = useState(0)
  const [showUnverifiedToast, setShowUnverifiedToast] = useState(false)
  const [showApprovalRequiredToast, setShowApprovalRequiredToast] = useState(false)

  const effectiveSessionUser = session?.user ?? sessionUserOverride
  const isSignedIn = Boolean(effectiveSessionUser)
  const isSessionCheckPending = isPending && !isSignedIn
  const isAdmin = isAdminRole(dashboard?.user?.roles)
  const linkedPerson = dashboard?.linkedPerson ?? null
  const permissions = dashboard?.permissions ?? null
  const recentPosts = dashboard?.recentPosts ?? []
  const recentWiki = dashboard?.recentWiki ?? []
  const canAccessAdmin = permissions?.canAccessAdmin === true
  const canCreatePost = permissions?.canCreatePost === true
  const canCreateWiki = permissions?.canCreateWiki === true
  const approvalMessage = useMemo(() => {
    const approvalStatus = searchParams.get('approval')
    if (!approvalStatus) return null

    return approvalStatusMessages[approvalStatus] || null
  }, [searchParams])

  useEffect(() => {
    const mode = searchParams.get('mode')
    setIsSignUpMode(mode !== 'login')
  }, [searchParams])

  const trackAuthEvent = useCallback((eventName: string, properties: Record<string, unknown>) => {
    if (typeof window === 'undefined') return

    const windowWithDataLayer = window as Window & {
      dataLayer?: Array<Record<string, unknown>>
    }

    if (!Array.isArray(windowWithDataLayer.dataLayer)) return

    windowWithDataLayer.dataLayer.push({
      event: eventName,
      ...properties,
    })
  }, [])

  const applyAuthFeedback = useCallback((reason: AuthGateReason) => {
    if (reason === 'allowed') {
      setAuthGateReason(null)
      setShowUnverifiedToast(false)
      setShowApprovalRequiredToast(false)
      return
    }

    setAuthGateReason(reason)

    if (reason === 'email_not_verified') {
      setToastID((current) => current + 1)
      setShowApprovalRequiredToast(false)
      setShowUnverifiedToast(true)
      return
    }

    if (reason === 'admin_approval_required') {
      setToastID((current) => current + 1)
      setShowUnverifiedToast(false)
      setShowApprovalRequiredToast(true)
      return
    }

    setShowUnverifiedToast(false)
    setShowApprovalRequiredToast(false)
  }, [])

  const resetAuthFeedback = useCallback(() => {
    setAuthGateReason(null)
    setShowUnverifiedToast(false)
    setShowApprovalRequiredToast(false)
  }, [])

  useEffect(() => {
    if (!showUnverifiedToast && !showApprovalRequiredToast) return

    const timeout = window.setTimeout(() => {
      setShowUnverifiedToast(false)
      setShowApprovalRequiredToast(false)
    }, 5000)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [showApprovalRequiredToast, showUnverifiedToast, toastID])

  useEffect(() => {
    if (!oauthError) {
      lastHandledOAuthError.current = null
      return
    }

    if (lastHandledOAuthError.current === oauthError) return
    lastHandledOAuthError.current = oauthError

    const reason = inferAuthGateReasonFromOAuthErrorQuery(oauthError)
    applyAuthFeedback(reason)

    const feedback = getAuthFeedbackForReason(reason)
    setAuthError(feedback.description)
    setAuthMessage(null)

    trackAuthEvent('auth_failure', {
      method: 'oauth',
      reason,
      source: 'oauth-callback',
    })
  }, [applyAuthFeedback, oauthError, trackAuthEvent])

  useEffect(() => {
    if (session?.user) {
      setSessionUserOverride(null)
      setAuthGateReason(null)
    }
  }, [session?.user])

  const pageTitle = useMemo(() => {
    return isSignedIn ? 'Your Account' : 'Sign Up or Log In'
  }, [isSignedIn])

  const loadDashboard = useCallback(async () => {
    try {
      const response = await fetch('/api/account/dashboard', {
        cache: 'no-store',
        credentials: 'include',
      })

      if (!response.ok) {
        setDashboard(null)
        return
      }

      const data = (await response.json()) as ProfileResponse
      setDashboard(data)
    } catch {
      setDashboard(null)
    }
  }, [])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  useEffect(() => {
    if (!session?.user) {
      setDashboard(null)
      return
    }

    void loadDashboard()
  }, [loadDashboard, session?.user])

  const lookupAuthStateByEmail = useCallback(
    async (emailAddress: string): Promise<AuthGateReason | null> => {
      try {
        const response = await fetch('/api/account/auth-state', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            email: emailAddress,
            intent: 'login',
          }),
        })

        if (!response.ok) return null

        const payload = (await response.json().catch(() => ({}))) as AuthStateLookupResponse
        if (!isAuthGateReason(payload.reason)) return null

        return payload.reason
      } catch {
        return null
      }
    },
    [],
  )

  const submitAuthForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setAuthError(null)
    setAuthMessage(null)
    resetAuthFeedback()
    setIsSubmitting(true)

    try {
      if (isSignUpMode) {
        trackAuthEvent('auth_attempt', {
          method: 'email',
          mode: 'signup',
        })

        const result = await authClient.signUp.email({
          email,
          name,
          password,
          callbackURL: '/account',
        })

        if (result.error) {
          const reason = inferAuthGateReasonFromError(result.error)
          applyAuthFeedback(reason)
          trackAuthEvent('auth_failure', {
            method: 'email',
            mode: 'signup',
            reason,
          })

          setAuthError(result.error.message || 'Unable to sign up.')
          return
        }

        trackAuthEvent('auth_success', {
          method: 'email',
          mode: 'signup',
        })

        setAuthMessage(
          'Account created. Verify your email in production. People emails can sign in immediately; others may still need approval.',
        )
      } else {
        trackAuthEvent('auth_attempt', {
          method: 'email',
          mode: 'login',
        })

        const result = await authClient.signIn.email({
          email,
          password,
          callbackURL: '/account',
        })

        if (result.error) {
          let reason = inferAuthGateReasonFromError(result.error)

          if (shouldLookupAuthState(reason)) {
            const lookedUpReason = await lookupAuthStateByEmail(email)
            if (lookedUpReason) {
              reason = lookedUpReason
            }
          }

          applyAuthFeedback(reason)
          trackAuthEvent('auth_failure', {
            method: 'email',
            mode: 'login',
            reason,
          })

          const feedback = getAuthFeedbackForReason(reason)
          setAuthError(
            reason === 'unknown'
              ? result.error.message || feedback.description
              : feedback.description,
          )
          return
        }

        trackAuthEvent('auth_success', {
          method: 'email',
          mode: 'login',
        })

        setSessionUserOverride({ email })
        setAuthMessage('Signed in successfully.')
      }

      try {
        await refetch()
        await loadDashboard()
      } catch {
        // Keep auth success state even if client-side refresh request fails.
      }
      setPassword('')
    } catch {
      applyAuthFeedback('unknown')
      trackAuthEvent('auth_failure', {
        method: 'email',
        mode: isSignUpMode ? 'signup' : 'login',
        reason: 'unknown',
      })
      setAuthError('Authentication request failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const signInWithProvider = async (provider: (typeof providerOptions)[number]['provider']) => {
    setAuthError(null)
    setAuthMessage(null)
    resetAuthFeedback()
    setIsOAuthPending(true)
    trackAuthEvent('auth_attempt', {
      method: provider,
      mode: 'oauth',
    })

    try {
      const result = await authClient.signIn.social({
        provider,
        callbackURL: '/account',
        errorCallbackURL: '/account?mode=login',
      })

      if (result?.error) {
        const reason = inferAuthGateReasonFromError(result.error)
        applyAuthFeedback(reason)
        trackAuthEvent('auth_failure', {
          method: provider,
          mode: 'oauth',
          reason,
        })

        const feedback = getAuthFeedbackForReason(reason)
        setAuthError(
          reason === 'unknown'
            ? result.error.message || feedback.description
            : feedback.description,
        )
      }
    } catch {
      applyAuthFeedback('unknown')
      trackAuthEvent('auth_failure', {
        method: provider,
        mode: 'oauth',
        reason: 'unknown',
      })
      setAuthError(`Unable to authenticate with ${provider.toUpperCase()}.`)
    } finally {
      setIsOAuthPending(false)
    }
  }

  const handleSignOut = async () => {
    setAuthError(null)
    setAuthMessage(null)
    resetAuthFeedback()
    setSessionUserOverride(null)

    await authClient.signOut({
      fetchOptions: {
        onSuccess: async () => {
          await refetch()
          setDashboard(null)
        },
      },
    })
  }

  return (
    <main className="container py-16">
      {showUnverifiedToast || showApprovalRequiredToast ? (
        <div
          aria-live="assertive"
          className="pointer-events-none fixed inset-x-4 top-5 z-50 flex justify-center sm:inset-x-auto sm:right-5"
        >
          {(() => {
            const toastReason: AuthGateReason = showApprovalRequiredToast
              ? 'admin_approval_required'
              : 'email_not_verified'
            const toastFeedback = getAuthFeedbackForReason(toastReason)

            return (
              <div
                role="alert"
                className="pointer-events-auto w-full max-w-sm rounded-xl border border-destructive/35 bg-background px-4 py-3 shadow-lg"
              >
                <p className="text-sm font-semibold text-destructive">{toastFeedback.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{toastFeedback.description}</p>
              </div>
            )
          })()}
        </div>
      ) : null}

      <div className="mx-auto max-w-2xl rounded-2xl border border-border p-8 shadow-sm sm:p-10">
        <p className="text-center text-base uppercase tracking-[0.2em] text-primary">Account</p>
        <h1 className="mt-3 text-center text-5xl font-semibold sm:text-6xl">{pageTitle}</h1>

        {isSessionCheckPending ? (
          <p className="mt-6 text-base text-muted-foreground">Checking your session...</p>
        ) : null}

        {!isSessionCheckPending && !isSignedIn ? (
          <>
            <p className="mx-auto mt-5 max-w-xl text-center text-base leading-relaxed text-muted-foreground sm:text-lg">
              New users should <b>Sign Up</b>. Returning users can <b>Log In</b>.
            </p>
            <p className="mx-auto mt-2 max-w-xl text-center text-base leading-relaxed text-muted-foreground sm:text-lg">
              {signInRequirementsMessage}
            </p>

            <div className="mt-7 flex justify-center">
              <div className="inline-flex rounded-full border border-border p-1.5 text-base">
                <button
                  type="button"
                  className={`rounded-full px-6 py-2.5 transition-colors ${isSignUpMode ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}
                  onClick={() => setIsSignUpMode(true)}
                >
                  Sign Up
                </button>
                <button
                  type="button"
                  className={`rounded-full px-6 py-2.5 transition-colors ${!isSignUpMode ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}
                  onClick={() => setIsSignUpMode(false)}
                >
                  Log In
                </button>
              </div>
            </div>

            <form className="mx-auto mt-8 grid max-w-xl gap-5" onSubmit={submitAuthForm}>
              {isSignUpMode ? (
                <label className="grid gap-1.5 text-base sm:text-lg" htmlFor="account-name">
                  <span>Name</span>
                  <input
                    id="account-name"
                    className="rounded-xl border border-border bg-background px-4 py-3 text-base shadow-sm transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:text-lg"
                    onChange={(event) => setName(event.target.value)}
                    required
                    value={name}
                  />
                </label>
              ) : null}

              <label className="grid gap-1.5 text-base sm:text-lg" htmlFor="account-email">
                <span>Email</span>
                <input
                  id="account-email"
                  className="rounded-xl border border-border bg-background px-4 py-3 text-base shadow-sm transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:text-lg"
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  type="email"
                  value={email}
                />
              </label>

              <label className="grid gap-1.5 text-base sm:text-lg" htmlFor="account-password">
                <span>Password</span>
                <input
                  id="account-password"
                  className="rounded-xl border border-border bg-background px-4 py-3 text-base shadow-sm transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:text-lg"
                  minLength={8}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  type="password"
                  value={password}
                />
              </label>

              <button
                type="submit"
                className="mt-3 rounded-xl bg-foreground px-5 py-3 text-lg font-medium text-background transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : isSignUpMode ? 'Sign Up' : 'Log In'}
              </button>
            </form>

            {authGateReason ? (
              <div className="mx-auto mt-5 max-w-xl rounded-xl border border-border bg-muted/40 p-4">
                <p className="text-sm font-semibold text-foreground">
                  {getAuthFeedbackForReason(authGateReason).title}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {getAuthFeedbackForReason(authGateReason).description}
                </p>
                {authGateReason === 'admin_approval_required' ? (
                  <a
                    className="mt-3 inline-flex text-sm font-medium text-primary hover:underline"
                    href="mailto:admin@nabilab.org"
                    onClick={() =>
                      trackAuthEvent('auth_recovery_action', {
                        action: 'contact_admin',
                        reason: authGateReason,
                      })
                    }
                  >
                    Contact admin@nabilab.org
                  </a>
                ) : null}
              </div>
            ) : null}

            <div className="mx-auto mt-10 max-w-xl">
              <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
                Or continue with OAuth
              </p>
              <div className="mt-4 grid gap-3">
                {providerOptions.map(({ label, provider }) => (
                  <button
                    key={provider}
                    className="flex items-center justify-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-lg transition-all hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isOAuthPending}
                    onClick={() => void signInWithProvider(provider)}
                    type="button"
                  >
                    {providerIconMap[provider]}
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : null}

        {!isSessionCheckPending && isSignedIn ? (
          <div className="mt-8">
            {/* Profile Header */}
            <div className="flex items-center gap-5">
              <PersonAvatar
                name={
                  linkedPerson?.name ||
                  dashboard?.user?.name ||
                  session?.user?.name ||
                  effectiveSessionUser?.email
                }
                email={effectiveSessionUser?.email}
                size={80}
                className="shrink-0 ring-2 ring-primary/20 ring-offset-2 ring-offset-background"
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="truncate text-2xl font-semibold tracking-tight">
                    {linkedPerson?.name || dashboard?.user?.name || session?.user?.name || 'User'}
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      isAdmin ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isAdmin ? (
                      <>
                        <Shield className="h-3 w-3" />
                        Admin
                      </>
                    ) : (
                      <>
                        <User className="h-3 w-3" />
                        Member
                      </>
                    )}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{effectiveSessionUser?.email || 'No email'}</span>
                </div>
                {linkedPerson?.name && (
                  <p className="mt-0.5 text-sm text-muted-foreground">Linked to member profile</p>
                )}
              </div>
            </div>

            {/* Gradient accent */}
            <div className="mt-5 h-0.5 rounded-full bg-gradient-to-r from-primary via-secondary to-accent opacity-60" />

            {!linkedPerson ? (
              <div className="mt-6 rounded-2xl border border-amber-300/60 bg-amber-50/70 p-4 text-sm text-amber-950 shadow-sm">
                <p className="font-semibold">
                  Post publishing is not enabled yet for this account.
                </p>
                <p className="mt-1 text-amber-900/90">
                  You can already create and publish wiki pages. Ask an admin to link your People
                  profile to unlock post authorship and post creation.
                </p>
              </div>
            ) : null}

            {/* Action Cards Grid */}
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {/* Edit Profile */}
              <Link
                href={dashboard?.actions?.profileEditURL || '/account/profile'}
                className="group flex items-start gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:bg-primary/[0.03] hover:shadow-sm"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                  <Pencil className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Edit Profile</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    Update your name, bio, and avatar
                  </p>
                </div>
              </Link>

              {/* View Public Profile */}
              {dashboard?.actions?.profileURL && (
                <Link
                  href={dashboard.actions.profileURL}
                  className="group flex items-start gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:bg-primary/[0.03] hover:shadow-sm"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                    <ExternalLink className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Public Profile</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      See your profile as others see it
                    </p>
                  </div>
                </Link>
              )}

              {canCreatePost && dashboard?.actions?.postCreateURL ? (
                <Link
                  href={dashboard.actions.postCreateURL}
                  className="group flex items-start gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:bg-primary/[0.03] hover:shadow-sm"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Create Post</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      Start a new post in the editor with your member profile attached automatically
                    </p>
                  </div>
                </Link>
              ) : null}

              {canCreateWiki && dashboard?.actions?.wikiCreateURL ? (
                <Link
                  href={dashboard.actions.wikiCreateURL}
                  className="group flex items-start gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:bg-primary/[0.03] hover:shadow-sm"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Create Wiki Page</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      Add a new wiki page to the shared knowledge base
                    </p>
                  </div>
                </Link>
              ) : null}

              {canAccessAdmin && dashboard?.actions?.adminURL ? (
                <Link
                  href={dashboard.actions.adminURL}
                  className="group flex items-start gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:bg-primary/[0.03] hover:shadow-sm"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Open Admin</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      {isAdmin
                        ? 'Manage site content, global settings, and users'
                        : 'Open your scoped editing workspace for posts, wiki pages, and profile management'}
                    </p>
                  </div>
                </Link>
              ) : null}
            </div>

            <div className="mt-8 grid gap-6">
              <section className="min-w-0 rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">Recent Posts</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Your authored posts, including drafts
                    </p>
                  </div>
                  {canCreatePost && dashboard?.actions?.postCreateURL ? (
                    <Link
                      className="shrink-0 text-xs font-medium text-primary hover:underline"
                      href={dashboard.actions.postCreateURL}
                    >
                      New post
                    </Link>
                  ) : null}
                </div>
                {recentPosts.length > 0 ? (
                  <div className="mt-4 grid gap-3">
                    {recentPosts.map((post) => (
                      <div
                        key={post.id}
                        className="min-w-0 rounded-xl border border-border/80 bg-background/70 p-3"
                      >
                        <div className="flex min-w-0 items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">
                              {post.title}
                            </p>
                            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                              {post.status}
                            </p>
                          </div>
                          <Link
                            className="text-xs font-medium text-primary hover:underline"
                            href={post.editURL}
                          >
                            Edit
                          </Link>
                        </div>
                        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                          <Link
                            className="hover:text-foreground hover:underline"
                            href={post.viewURL}
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-muted-foreground">
                    {canCreatePost
                      ? 'You have not created any posts yet.'
                      : 'Post creation will appear here after your People profile is linked.'}
                  </p>
                )}
              </section>

              <section className="min-w-0 rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">Recent Wiki Pages</p>
                    <p className="mt-1 text-xs text-muted-foreground">Wiki pages you own</p>
                  </div>
                  {canCreateWiki && dashboard?.actions?.wikiCreateURL ? (
                    <Link
                      className="shrink-0 text-xs font-medium text-primary hover:underline"
                      href={dashboard.actions.wikiCreateURL}
                    >
                      New wiki page
                    </Link>
                  ) : null}
                </div>
                {recentWiki.length > 0 ? (
                  <div className="mt-4 grid gap-3">
                    {recentWiki.map((wiki) => (
                      <div
                        key={wiki.id}
                        className="min-w-0 rounded-xl border border-border/80 bg-background/70 p-3"
                      >
                        <div className="flex min-w-0 items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">
                              {wiki.title}
                            </p>
                            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                              {wiki.status}
                            </p>
                          </div>
                          <Link
                            className="text-xs font-medium text-primary hover:underline"
                            href={wiki.editURL}
                          >
                            Edit
                          </Link>
                        </div>
                        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                          <Link
                            className="hover:text-foreground hover:underline"
                            href={wiki.viewURL}
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-muted-foreground">
                    You have not created any wiki pages yet.
                  </p>
                )}
              </section>
            </div>

            {!isAdmin ? (
              <p className="mt-4 text-center text-xs text-muted-foreground">
                Sitewide settings and admin-only collections stay hidden here unless your role
                changes.
              </p>
            ) : null}

            {/* Sign Out */}
            <div className="mt-8 border-t-2 border-border pt-6">
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground transition-all hover:border-destructive/40 hover:bg-destructive/5 hover:text-destructive"
                onClick={() => void handleSignOut()}
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        ) : null}

        {authError ? <p className="mt-4 text-sm text-destructive">{authError}</p> : null}
        {approvalMessage ? <p className="mt-4 text-sm text-primary">{approvalMessage}</p> : null}
        {authMessage ? <p className="mt-4 text-sm text-emerald-600">{authMessage}</p> : null}
      </div>
    </main>
  )
}

export default function AccountPage() {
  return (
    <Suspense fallback={<AccountPageFallback />}>
      <AccountPageContent />
    </Suspense>
  )
}
