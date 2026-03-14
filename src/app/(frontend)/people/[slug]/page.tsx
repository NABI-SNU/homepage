import type { Metadata } from 'next'
import { Mail } from 'lucide-react'

import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Card } from '@/components/Card'
import RichText from '@/components/RichText'
import { PersonAvatar } from '@/components/people/PersonAvatar'
import { PersonRoleBadge } from '@/components/people/PersonRoleBadge'
import { PersonSocialLinks } from '@/components/people/PersonSocialLinks'
import { generateMeta } from '@/utilities/generateMeta'
import {
  getCachedAuthoredPostsByPersonID,
  getCachedPersonSlugs,
  getCachedPublicPersonBySlug,
} from '@/utilities/getPeople'
import { parseResearchTags, toTagSlug } from '@/utilities/researchTags'

export const revalidate = 3600

type Args = {
  params: Promise<{
    slug: string
  }>
}

export async function generateStaticParams() {
  const slugs = await getCachedPersonSlugs()()
  return slugs.map((slug) => ({ slug }))
}

export default async function PersonPage({ params }: Args) {
  const { slug } = await params
  const person = await getCachedPublicPersonBySlug(slug)()
  if (!person) notFound()
  const researchTopics = parseResearchTags(person.research)
  const roleAssignments = [...(person.roleAssignments || [])].sort((a, b) => b.year - a.year)
  const authoredPosts = await getCachedAuthoredPostsByPersonID(person.id)()

  return (
    <main className="pb-20 pt-12">
      <section className="container">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-4xl font-semibold sm:text-5xl">{person.name}</h1>
              {roleAssignments.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {roleAssignments.map((assignment) => (
                    <PersonRoleBadge
                      key={`${assignment.role}-${assignment.year}`}
                      role={assignment.role}
                      year={assignment.year}
                    />
                  ))}
                </div>
              )}
              <div className="mt-6 h-1 w-24 rounded-full bg-linear-to-r from-primary to-accent" />

              <div className="mt-6">
                <p className="text-sm uppercase tracking-[0.18em] text-primary">
                  Research Interests
                </p>
                {researchTopics.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {researchTopics.map((topic) => {
                      const topicSlug = toTagSlug(topic)

                      if (!topicSlug) {
                        return (
                          <span
                            key={topic}
                            className="rounded-full border border-border/70 bg-card/40 px-3 py-1 text-sm text-muted-foreground transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:border-primary/45 hover:bg-card/60 hover:text-primary hover:shadow-lg hover:shadow-primary/20"
                          >
                            {topic}
                          </span>
                        )
                      }

                      return (
                        <Link
                          key={topic}
                          className="rounded-full border border-border/70 bg-card/40 px-3 py-1 text-sm text-muted-foreground transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:border-primary/45 hover:bg-card/60 hover:text-primary hover:shadow-lg hover:shadow-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                          href={`/topics/${topicSlug}`}
                        >
                          {topic}
                        </Link>
                      )
                    })}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    No research interests listed yet.
                  </p>
                )}
              </div>
            </div>

            <PersonAvatar
              avatar={person.avatar}
              className="shrink-0 self-start shadow-lg shadow-black/20"
              email={person.email}
              name={person.name}
              size={132}
            />
          </div>

          {(person.email || (person.socials && person.socials.length > 0)) && (
            <div className="mt-6">
              <p className="text-sm uppercase tracking-[0.18em] text-primary">Contact at</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                {person.email && (
                  <a
                    href={`mailto:${person.email}`}
                    className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/40 px-3 py-1.5 text-sm text-primary transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/45 hover:bg-card/60 hover:shadow-lg hover:shadow-primary/20"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    <span>{person.email}</span>
                  </a>
                )}
                {person.socials && person.socials.length > 0 && (
                  <PersonSocialLinks
                    className="inline-flex gap-3"
                    iconOnly={false}
                    socials={person.socials}
                  />
                )}
              </div>
            </div>
          )}

          <div className="mt-10">
            <h2 className="text-2xl font-semibold">{person.name}&apos;s Bio</h2>
            {person.bio ? (
              <div className="mt-4">
                <RichText
                  data={{
                    root: {
                      type: 'root',
                      children: [
                        {
                          type: 'paragraph',
                          children: [
                            {
                              type: 'text',
                              detail: 0,
                              format: 0,
                              mode: 'normal',
                              style: '',
                              text: person.bio,
                              version: 1,
                            },
                          ],
                          direction: 'ltr',
                          format: '',
                          indent: 0,
                          textFormat: 0,
                          version: 1,
                        },
                      ],
                      direction: 'ltr',
                      format: '',
                      indent: 0,
                      version: 1,
                    },
                  }}
                  enableGutter={false}
                />
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                This person has not yet filled out their bio.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="container mt-14" id="posts">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-semibold">Posts by {person.name}</h2>
          <div className="mt-6 grid grid-cols-4 gap-5 sm:grid-cols-8 lg:grid-cols-12 lg:gap-7">
            {authoredPosts.map((post) => (
              <div className="col-span-4" key={post.id}>
                <Card className="h-full" doc={post} relationTo="posts" />
              </div>
            ))}
            {authoredPosts.length === 0 && (
              <p className="text-sm text-muted-foreground">No posts yet.</p>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const person = await getCachedPublicPersonBySlug(slug)()

  return generateMeta({
    description:
      parseResearchTags(person?.research).join(', ') || person?.bio || 'NABI member profile',
    doc: person
      ? {
          description: person.bio,
          slug: ['people', slug],
          title: person.name,
        }
      : null,
    path: `/people/${slug}`,
    title: person ? person.name : 'Person',
  })
}
