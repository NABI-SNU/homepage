'use client'

import Link from 'next/link'
import React, { useSyncExternalStore } from 'react'

import { cn } from '@/utilities/ui'

export type CharterLanguage = 'ko' | 'en'

type Bilingual = Record<CharterLanguage, string>

export type CharterText = {
  closing: Bilingual
  note: Bilingual
  preamble: Bilingual
  principles: { ordinal: Bilingual; text: Bilingual; title: Bilingual }[]
  title: Bilingual
}

const STORAGE_KEY = 'nabi-charter-language'
const CHANGE_EVENT = 'nabi-charter-language-change'

// Fallback when localStorage is unavailable (e.g. private mode): the choice lasts for this visit.
let memoryLanguage: CharterLanguage | null = null

const readLanguage = (): CharterLanguage => {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved === 'ko' || saved === 'en') return saved
  } catch {
    // Fall through to the in-memory choice.
  }
  return memoryLanguage ?? 'ko'
}

const writeLanguage = (language: CharterLanguage) => {
  memoryLanguage = language
  try {
    window.localStorage.setItem(STORAGE_KEY, language)
  } catch {
    // Keep the in-memory choice only.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

const subscribe = (onChange: () => void) => {
  window.addEventListener('storage', onChange)
  window.addEventListener(CHANGE_EVENT, onChange)
  return () => {
    window.removeEventListener('storage', onChange)
    window.removeEventListener(CHANGE_EVENT, onChange)
  }
}

const LANGUAGE_LABELS: Record<CharterLanguage, string> = { ko: '한국어', en: 'English' }

export const CharterContent: React.FC<{ charter: CharterText }> = ({ charter }) => {
  // Korean (the authoritative text) on the server and by default; the reader's choice is remembered.
  const language = useSyncExternalStore(subscribe, readLanguage, (): CharterLanguage => 'ko')
  const choose = writeLanguage

  return (
    <div lang={language}>
      <section className="page-header container text-center">
        <p className="page-eyebrow">About NABI</p>
        <h1 className="page-title-lg">{charter.title[language]}</h1>

        <div
          aria-label="Language"
          className="mt-6 inline-flex overflow-hidden rounded-full border border-border"
          role="group"
        >
          {(Object.keys(LANGUAGE_LABELS) as CharterLanguage[]).map((option) => (
            <button
              aria-pressed={language === option}
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors',
                language === option
                  ? 'bg-muted text-foreground'
                  : 'bg-background text-muted-foreground hover:bg-muted/60 hover:text-foreground',
              )}
              key={option}
              lang={option}
              onClick={() => choose(option)}
              type="button"
            >
              {LANGUAGE_LABELS[option]}
            </button>
          ))}
        </div>
      </section>

      <div className="container pb-16">
        <div className="mx-auto mt-4 max-w-3xl">
          <p className="text-lg leading-8">{charter.preamble[language]}</p>

          <ol aria-label={language === 'ko' ? '원칙' : 'Principles'} className="mt-10 space-y-5">
            {charter.principles.map((principle, index) => (
              <li
                className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/70 p-6 shadow-sm"
                key={principle.title.en}
              >
                <div
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-primary to-accent"
                />
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary/15 to-accent/15 text-sm font-semibold text-primary">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      {principle.ordinal[language]}
                    </p>
                    <h2 className="text-xl font-semibold leading-tight">
                      {principle.title[language]}
                    </h2>
                  </div>
                </div>
                <p className="mt-4 leading-7">{principle.text[language]}</p>
              </li>
            ))}
          </ol>

          <p className="mt-10 border-l-4 border-primary/60 pl-5 leading-8">
            {charter.closing[language]}
          </p>

          <p className="mt-12 text-center text-sm text-muted-foreground">
            {charter.note[language]}{' '}
            <Link className="underline hover:text-primary" href="/about">
              {language === 'ko' ? 'NABI 소개' : 'About NABI'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
