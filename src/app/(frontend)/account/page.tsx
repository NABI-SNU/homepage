'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { FormEvent, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
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

import { authClient } from '@/auth/betterAuthClient'
import { PersonAvatar } from '@/components/people/PersonAvatar'

const providerOptions = [
  { label: 'Continue with GitHub', provider: 'github' },
  { label: 'Continue with Google', provider: 'google' },
  { label: 'Continue with ORCID', provider: 'orcid' },
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

const OrcidLogo = () => (
  <svg aria-hidden className="h-5 w-5" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" fill="#A6CE39" />
    <path
      d="M8.6 8.8a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2zm-1 1.2h2v7h-2v-7zm3.1 0h2.6c2.3 0 3.8 1.3 3.8 3.5S15.6 17 13.3 17h-2.6v-7zm2 1.7v3.6h.6c1.2 0 2-.6 2-1.8s-.8-1.8-2-1.8h-.6z"
      fill="#fff"
    />
  </svg>
)

const providerIconMap = {
  github: <Github className="h-5 w-5" />,
  google: <GoogleLogo />,
  orcid: <OrcidLogo />,
} as const

type ProfileResponse = {
  person?: {
    id: number
    name?: string | null
    slug?: string | null
  } | null
  user?: {
    id: number
    roles?: string | string[] | null
  } | null
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

  const [isSignUpMode, setIsSignUpMode] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)
  const [authMessage, setAuthMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isOAuthPending, setIsOAuthPending] = useState(false)
  const [profile, setProfile] = useState<ProfileResponse | null>(null)
  const [sessionUserOverride, setSessionUserOverride] = useState<{ email?: string | null } | null>(null)

  const effectiveSessionUser = session?.user ?? sessionUserOverride
  const isSignedIn = Boolean(effectiveSessionUser)
  const isSessionCheckPending = isPending && !isSignedIn
  const isAdmin = isAdminRole(profile?.user?.roles)
  const approvalMessage = useMemo(() => {
    const approvalStatus = searchParams.get('approval')
    if (!approvalStatus) return null

    return approvalStatusMessages[approvalStatus] || null
  }, [searchParams])

  useEffect(() => {
    const mode = searchParams.get('mode')
    setIsSignUpMode(mode !== 'login')
  }, [searchParams])

  useEffect(() => {
    if (session?.user) {
      setSessionUserOverride(null)
    }
  }, [session?.user])

  const pageTitle = useMemo(() => {
    return isSignedIn ? 'Your Account' : 'Sign Up or Log In'
  }, [isSignedIn])

  const loadProfile = useCallback(async () => {
    try {
      const response = await fetch('/api/account/profile', {
        cache: 'no-store',
        credentials: 'include',
      })

      if (!response.ok) {
        setProfile(null)
        return
      }

      const data = (await response.json()) as ProfileResponse
      setProfile(data)
    } catch {
      setProfile(null)
    }
  }, [])

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  useEffect(() => {
    if (!session?.user) {
      setProfile(null)
      return
    }

    void loadProfile()
  }, [loadProfile, session?.user])

  const submitAuthForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setAuthError(null)
    setAuthMessage(null)
    setIsSubmitting(true)

    try {
      if (isSignUpMode) {
        const result = await authClient.signUp.email({
          email,
          name,
          password,
          callbackURL: '/account',
        })

        if (result.error) {
          setAuthError(result.error.message || 'Unable to sign up.')
          return
        }

        setAuthMessage(
          'Account created. Verify your email in production. People emails can sign in immediately; others may still need approval.',
        )
      } else {
        const result = await authClient.signIn.email({
          email,
          password,
          callbackURL: '/account',
        })

        if (result.error) {
          setAuthError(
            result.error.message ||
              'Unable to log in. Check email verification and whether your email is listed in People or already approved.',
          )
          return
        }

        setSessionUserOverride({ email })
        setAuthMessage('Signed in successfully.')
      }

      try {
        await refetch()
        await loadProfile()
      } catch {
        // Keep auth success state even if client-side refresh request fails.
      }
      setPassword('')
    } catch {
      setAuthError('Authentication request failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const signInWithProvider = async (provider: (typeof providerOptions)[number]['provider']) => {
    setAuthError(null)
    setAuthMessage(null)
    setIsOAuthPending(true)

    try {
      if (provider === 'orcid') {
        const result = await authClient.signIn.oauth2({
          providerId: 'orcid',
          callbackURL: '/account',
        })

        if (result?.error) {
          setAuthError(result.error.message || 'Unable to authenticate with ORCID.')
        }
      } else {
        const result = await authClient.signIn.social({
          provider,
          callbackURL: '/account',
        })

        if (result?.error) {
          setAuthError(
            result.error.message || `Unable to authenticate with ${provider.toUpperCase()}.`,
          )
        }
      }
    } catch {
      setAuthError(`Unable to authenticate with ${provider.toUpperCase()}.`)
    } finally {
      setIsOAuthPending(false)
    }
  }

  const handleSignOut = async () => {
    setAuthError(null)
    setAuthMessage(null)
    setSessionUserOverride(null)

    await authClient.signOut({
      fetchOptions: {
        onSuccess: async () => {
          await refetch()
          setProfile(null)
        },
      },
    })
  }

  return (
    <main className="container py-16">
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
                name={profile?.person?.name || session?.user?.name || effectiveSessionUser?.email}
                email={effectiveSessionUser?.email}
                size={80}
                className="shrink-0 ring-2 ring-primary/20 ring-offset-2 ring-offset-background"
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="truncate text-2xl font-semibold tracking-tight">
                    {profile?.person?.name || session?.user?.name || 'User'}
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      isAdmin
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
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
                {profile?.person?.name && (
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Linked to member profile
                  </p>
                )}
              </div>
            </div>

            {/* Gradient accent */}
            <div className="mt-5 h-0.5 rounded-full bg-gradient-to-r from-primary via-secondary to-accent opacity-60" />

            {/* Action Cards Grid */}
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {/* Edit Profile */}
              <Link
                href="/account/profile"
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
              {profile?.person?.slug && (
                <Link
                  href={`/people/${profile.person.slug}`}
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

              {/* My Posts */}
              {profile?.person?.slug && (
                <Link
                  href={`/people/${profile.person.slug}#posts`}
                  className="group flex items-start gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:bg-primary/[0.03] hover:shadow-sm"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">My Posts</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      View and manage your publications
                    </p>
                  </div>
                </Link>
              )}

              {/* Admin Dashboard */}
              {isAdmin && session?.user && (
                <Link
                  href="/admin"
                  className="group flex items-start gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:bg-primary/[0.03] hover:shadow-sm"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Admin Dashboard</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      Manage site content and users
                    </p>
                  </div>
                </Link>
              )}
            </div>

            {/* Non-admin note */}
            {profile?.user && !isAdmin && (
              <p className="mt-4 text-center text-xs text-muted-foreground">
                Your account does not include admin dashboard access.
              </p>
            )}

            {/* Sign Out */}
            <div className="mt-8 border-t border-border pt-6">
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
