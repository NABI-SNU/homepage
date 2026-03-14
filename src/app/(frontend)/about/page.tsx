import type { Metadata } from 'next'

import Link from 'next/link'
import Image from 'next/image'
import {
  BarChart3,
  Brain,
  CircuitBoard,
  Cpu,
  Languages,
  Microscope,
  Repeat,
  Sigma,
  Users,
} from 'lucide-react'

import { Card } from '@/components/Card'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { getCachedRecentPosts } from '@/utilities/getPosts'
import type { AboutPage as AboutPageGlobal } from '@/payload-types'

export const revalidate = 3600

const ABOUT_HERO_IMAGE_URL =
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80'
const HIGHLIGHT_ICONS = [
  Cpu,
  Brain,
  CircuitBoard,
  BarChart3,
  Sigma,
  Users,
  Repeat,
  Microscope,
  Languages,
]
const EXTRA_HIGHLIGHT = {
  title: 'Meta-reinforcement learning via orbitofrontal cortex',
  description:
    'The hypothesis that the OFC plays a role in meta-reinforcement learning is proposed, with two algorithms at distinct timescales.',
  url: 'https://doi.org/10.1038/s41593-023-01485-3',
}

export default async function AboutPage() {
  const [aboutPageData, latestPosts] = await Promise.all([
    getCachedGlobal('aboutPage', 1)(),
    getCachedRecentPosts(6)(),
  ])
  const aboutPage = aboutPageData as AboutPageGlobal
  const highlights = [...(aboutPage.highlights || [])]

  if (
    !highlights.some(
      (item) => item?.url === EXTRA_HIGHLIGHT.url || item?.title === EXTRA_HIGHLIGHT.title,
    )
  ) {
    highlights.push(EXTRA_HIGHLIGHT)
  }
  return (
    <main className="page-shell-wide">
      <section className="container page-header">
        <div className="mx-auto grid max-w-5xl items-start gap-10 lg:grid-cols-2 lg:items-center">
          <div className="text-center">
            <p className="page-eyebrow">{aboutPage.tagline}</p>
            <h1 className="page-title">{aboutPage.title}</h1>
            {aboutPage.description && <p className="page-subtitle mt-6">{aboutPage.description}</p>}

            <div className="mx-auto mt-8 max-w-2xl space-y-6">
              {(aboutPage.aboutItems || []).map((item, index) => (
                <article
                  className="flex items-start gap-4 text-left"
                  key={`${item.title}-${index}`}
                >
                  <span className="mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {index + 1}
                  </span>
                  <div>
                    <h2 className="text-xl font-semibold leading-tight">{item.title}</h2>
                    <p className="mt-2 text-muted-foreground">{item.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="relative mx-auto aspect-square w-full max-w-xl overflow-hidden rounded-2xl border border-border/80 bg-card/70 shadow-xl shadow-black/20 lg:mx-0 lg:self-center">
            <Image
              alt="NABI collaborative research"
              className="object-cover object-center"
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              src={ABOUT_HERO_IMAGE_URL}
            />
          </div>
        </div>
      </section>

      <section className="container page-header section-gap-lg">
        <div className="mx-auto max-w-5xl rounded-3xl border border-border/80 bg-card/45 p-8 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-primary">Research Highlights</p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight md:text-4xl">
            {aboutPage.highlightTitle}
          </h2>
          {aboutPage.highlightSubtitle && (
            <p className="mt-2 text-muted-foreground">{aboutPage.highlightSubtitle}</p>
          )}

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {highlights.map((item, index) => {
              const Icon = HIGHLIGHT_ICONS[index % HIGHLIGHT_ICONS.length]

              return (
                <a
                  key={`${item.title}-${index}`}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group rounded-2xl border border-border/80 bg-card/70 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
                >
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                    <Icon aria-hidden className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    Paper {index + 1}
                  </p>
                  <h3 className="text-xl font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                  <p className="mt-4 text-sm font-medium text-primary transition-transform duration-200 group-hover:translate-x-0.5">
                    Read paper <span aria-hidden>↗</span>
                  </p>
                </a>
              )
            })}
          </div>
        </div>
      </section>

      <section className="container page-header section-gap-lg">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div>
            <h2 className="text-3xl font-semibold">{aboutPage.latestPostsTitle}</h2>
            <Link
              className="mt-2 inline-flex text-sm font-medium text-primary transition-colors hover:text-accent"
              href="/posts"
            >
              View all posts →
            </Link>
          </div>
          {aboutPage.latestPostsInfo && (
            <p className="mx-auto max-w-md text-sm text-muted-foreground">
              {aboutPage.latestPostsInfo}
            </p>
          )}
        </div>

        <div className="mt-6 grid grid-cols-4 gap-5 sm:grid-cols-8 lg:grid-cols-12 lg:gap-7">
          {latestPosts.map((post) => (
            <div className="col-span-4" key={post.id}>
              <Card className="h-full" doc={post} relationTo="posts" />
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}

export const metadata: Metadata = {
  title: 'About us',
  description:
    "Discover NABI's mission and how our multidisciplinary community advances brain research at Seoul National University.",
}
