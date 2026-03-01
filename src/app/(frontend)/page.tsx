import type { Metadata } from 'next'

import Link from 'next/link'
import Image from 'next/image'
import { ChevronRight, ExternalLink, FileText, Mail } from 'lucide-react'

import { getCachedGlobal } from '@/utilities/getGlobals'
import type { HomePage as HomePageGlobal } from '@/payload-types'
import heroImage from '@/assets/images/hero-image.png'

export default async function HomePage() {
  const homePageData = await getCachedGlobal('homePage', 2)()
  const homePage = homePageData as HomePageGlobal
  const missionItems = (homePage.faqs || []).slice(0, 4)
  const title = homePage.heroTitle?.trim() || ''
  const hasNabiPrefix = title.toUpperCase().startsWith('NABI')
  const titleRemainder = hasNabiPrefix ? title.slice(4).trimStart() : ''

  return (
    <main className="page-shell-wide">
      <section className="page-header container">
        <div className="mx-auto max-w-4xl text-center">
          <p className="page-eyebrow text-foreground/90">{homePage.heroTagline}</p>
          <h1 className="mt-2 text-5xl font-semibold leading-tight md:text-7xl">
            {hasNabiPrefix ? (
              <>
                <span className="bg-linear-to-r from-[#8d46e7] to-primary bg-clip-text text-transparent">
                  NABI
                </span>{' '}
                {titleRemainder}
              </>
            ) : (
              title
            )}
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-xl leading-relaxed text-muted-foreground">
            {homePage.heroSubtitle}
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-3 text-base font-semibold text-primary-foreground transition-colors hover:bg-secondary"
              href={homePage.primaryCTA.url}
            >
              {homePage.primaryCTA.label}
              <ExternalLink className="h-4 w-4" />
            </Link>
            <Link
              className="inline-flex items-center justify-center rounded-full border border-border px-8 py-3 text-base font-medium transition-colors hover:bg-muted"
              href={homePage.secondaryCTA.url}
            >
              {homePage.secondaryCTA.label}
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-10 w-full max-w-4xl lg:max-w-5xl">
          <Image
            alt="Nodes of the Artificial Brain"
            className="h-auto w-full object-cover"
            placeholder="blur"
            priority
            src={heroImage}
          />
        </div>
      </section>

      {missionItems.length > 0 && (
        <section className="container page-header section-gap-lg">
          <div className="mx-auto max-w-4xl text-center">
            <p className="page-eyebrow text-foreground/90">Our Mission</p>
            <h2 className="mt-2 text-4xl font-semibold leading-tight md:text-5xl">
              Understanding Our Mission
            </h2>
          </div>

          <div className="mx-auto mt-12 grid max-w-6xl gap-x-12 gap-y-12 md:grid-cols-2">
            {missionItems.map((faq, index) => (
              <article className="text-left" key={`${faq.question}-${index}`}>
                <h3 className="flex items-start justify-start gap-2 text-3xl font-semibold leading-tight">
                  <ChevronRight className="mt-2 h-5 w-5 shrink-0 text-primary" />
                  <span>{faq.question}</span>
                </h3>
                <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{faq.answer}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="containerpage-header section-gap-lg">
        <div className="mx-auto max-w-4xl rounded-xl border border-border/70 bg-card/25 px-6 py-10 text-center shadow-sm md:px-10">
          <h2 className="text-5xl font-semibold leading-tight md:text-6xl">{homePage.joinTitle}</h2>
          {homePage.joinSubtitle && (
            <p className="mx-auto mt-4 max-w-3xl text-xl leading-relaxed text-muted-foreground">
              {homePage.joinSubtitle}
            </p>
          )}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-3 text-base font-semibold text-primary-foreground transition-colors hover:bg-secondary"
              href={homePage.joinPrimaryCTA.url}
            >
              {homePage.joinPrimaryCTA.label}
              <ExternalLink className="h-4 w-4" />
            </Link>
            <Link
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-8 py-3 text-base font-medium transition-colors hover:bg-muted"
              href={homePage.joinSecondaryCTA.url}
            >
              {homePage.joinSecondaryCTA.label}
              <Mail className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

export const metadata: Metadata = {
  title: 'NABI | Computational Neuroscience & NeuroAI Study Group at SNU',
  description:
    'Official website of NABI Labs at Seoul National University exploring the intersection of neuroscience and artificial intelligence.',
}
