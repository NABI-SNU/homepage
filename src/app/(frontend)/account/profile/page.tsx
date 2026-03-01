'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useRef, useState } from 'react'

import { PersonAvatar } from '@/components/people/PersonAvatar'
import type { Person } from '@/payload-types'

type PersonProfile = Pick<Person, 'avatar' | 'bio' | 'id' | 'joinedYear' | 'name' | 'research'>

type ProfilePayload = {
  person?: PersonProfile | null
  user?: {
    email?: string | null
  } | null
}

export default function AccountProfilePage() {
  const [profile, setProfile] = useState<ProfilePayload | null>(null)
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [research, setResearch] = useState('')
  const [joinedYear, setJoinedYear] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [removeAvatar, setRemoveAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    let mounted = true

    const loadProfile = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/account/profile', {
          cache: 'no-store',
          credentials: 'include',
        })

        if (!response.ok) {
          if (response.status === 401 && mounted) {
            setError('Please log in first.')
            setProfile(null)
          }
          return
        }

        const data = (await response.json()) as ProfilePayload
        if (!mounted) return

        setProfile(data)

        const person = data.person

        setName(person?.name || '')
        setBio(person?.bio || '')
        setJoinedYear(person?.joinedYear ? String(person.joinedYear) : '')

        const normalizedResearch = Array.isArray(person?.research)
          ? person?.research.join(', ')
          : (person?.research ?? '')

        setResearch(normalizedResearch)
        setAvatarFile(null)
        setRemoveAvatar(false)
        if (avatarInputRef.current) avatarInputRef.current.value = ''
      } catch {
        if (mounted) {
          setError('Unable to load your profile.')
          setProfile(null)
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    void loadProfile()

    return () => {
      mounted = false
    }
  }, [])

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setIsSaving(true)
    setError(null)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append('name', name)
      formData.append('bio', bio)
      formData.append('joinedYear', joinedYear)
      formData.append('research', research)

      if (avatarFile) {
        formData.append('avatar', avatarFile)
      }

      if (removeAvatar) {
        formData.append('removeAvatar', 'true')
      }

      const response = await fetch('/api/account/profile', {
        method: 'PATCH',
        credentials: 'include',
        body: formData,
      })

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string
        person?: PersonProfile
      }

      if (!response.ok) {
        setError(payload.error || 'Unable to update profile.')
        return
      }

      setMessage('Profile updated successfully.')

      if (payload.person) {
        setProfile((previous) => ({
          ...previous,
          person: payload.person,
        }))
      }

      setAvatarFile(null)
      setRemoveAvatar(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    } catch {
      setError('Unable to update profile.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="container py-16">
      <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.18em] text-primary">Profile</p>
        <h1 className="mt-3 text-4xl font-semibold">Edit Your Profile</h1>

        {isLoading ? <p className="mt-6 text-sm text-muted-foreground">Loading profile...</p> : null}

        {!isLoading && !profile?.person ? (
          <div className="mt-6 grid gap-3">
            <p className="text-sm text-muted-foreground">No linked profile was found for this account.</p>
            <Link href="/account" className="text-sm text-primary hover:underline">
              Back to account
            </Link>
          </div>
        ) : null}

        {!isLoading && profile?.person ? (
          <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
            <label className="grid gap-1 text-sm" htmlFor="profile-email">
              <span>Email</span>
              <input
                id="profile-email"
                className="rounded-md border border-border bg-muted px-3 py-2 text-muted-foreground"
                readOnly
                value={profile.user?.email || ''}
              />
            </label>

            <label className="grid gap-1 text-sm" htmlFor="profile-name">
              <span>Name</span>
              <input
                id="profile-name"
                className="rounded-md border border-border bg-background px-3 py-2"
                onChange={(event) => setName(event.target.value)}
                required
                value={name}
              />
            </label>

            <label className="grid gap-1 text-sm" htmlFor="profile-bio">
              <span>Bio</span>
              <textarea
                id="profile-bio"
                className="min-h-28 rounded-md border border-border bg-background px-3 py-2"
                onChange={(event) => setBio(event.target.value)}
                value={bio}
              />
            </label>

            <div className="grid gap-3 rounded-lg border border-border/80 bg-muted/30 p-4">
              <span className="text-sm font-medium">Avatar</span>
              <div className="flex items-center gap-3">
                <PersonAvatar
                  avatar={removeAvatar ? undefined : profile.person.avatar}
                  email={profile.user?.email}
                  name={name || profile.person.name}
                  size={56}
                />
                <p className="text-sm text-muted-foreground">
                  Uploading an image will replace your Gravatar.
                </p>
              </div>
              <div className="rounded-md border border-dashed border-border/80 bg-background/40 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <label
                    htmlFor="profile-avatar"
                    className="inline-flex cursor-pointer items-center rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    Choose Image
                  </label>
                  <span className="text-sm text-muted-foreground">
                    {avatarFile?.name ? avatarFile.name : 'No file selected'}
                  </span>
                  {avatarFile && (
                    <button
                      className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      onClick={() => {
                        setAvatarFile(null)
                        if (avatarInputRef.current) avatarInputRef.current.value = ''
                      }}
                      type="button"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">PNG, JPG, or WebP. Max size 5MB.</p>
              </div>
              <input
                accept="image/*"
                className="sr-only"
                id="profile-avatar"
                ref={avatarInputRef}
                onChange={(event) => {
                  setAvatarFile(event.target.files?.[0] ?? null)
                  if (event.target.files?.[0]) setRemoveAvatar(false)
                }}
                type="file"
              />
              <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  checked={removeAvatar}
                  onChange={(event) => {
                    setRemoveAvatar(event.target.checked)
                    if (event.target.checked) {
                      setAvatarFile(null)
                      if (avatarInputRef.current) avatarInputRef.current.value = ''
                    }
                  }}
                  type="checkbox"
                />
                Use Gravatar instead of a custom image
              </label>
            </div>

            <label className="grid gap-1 text-sm" htmlFor="profile-research">
              <span>Research (comma separated)</span>
              <input
                id="profile-research"
                className="rounded-md border border-border bg-background px-3 py-2"
                onChange={(event) => setResearch(event.target.value)}
                value={research}
              />
            </label>

            <label className="grid gap-1 text-sm" htmlFor="profile-joined-year">
              <span>Joined Year</span>
              <input
                id="profile-joined-year"
                className="rounded-md border border-border bg-background px-3 py-2"
                max={2100}
                min={1900}
                onChange={(event) => setJoinedYear(event.target.value)}
                type="number"
                value={joinedYear}
              />
            </label>

            <div className="mt-2 flex flex-wrap gap-3">
              <button
                className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSaving}
                type="submit"
              >
                {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
              <Link href="/account" className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">
                Back to account
              </Link>
            </div>
          </form>
        ) : null}

        {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
        {message ? <p className="mt-4 text-sm text-emerald-600">{message}</p> : null}
      </div>
    </main>
  )
}
