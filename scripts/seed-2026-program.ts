/**
 * Creates or updates the NABI 2026 Foundations Seminar sessions, taken from the 2026 syllabus
 * and timetable in Notion.
 *
 * Idempotent: activities are matched by slug, so re-running updates them instead of duplicating.
 *
 *   pnpm seed:program-2026
 */
import 'dotenv/config'

import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import { getPayload } from 'payload'

import config from '../src/payload.config'
import type { Activity } from '../src/payload-types'

type Paper = {
  doi: string
  journal: string
  title: string
  year: number
}

type ProgramSeed = {
  activityType: 'seminar'
  bookChapters?: { label: string; url: string }[]
  date: string
  description: string
  location: string
  paragraphs: string[]
  papers?: Paper[]
  recordingUrl?: string
  slug: string
  title: string
}

const BOOK = 'https://book.nabilab.org/tutorials'
const chapter = (label: string, slug: string) => ({
  label,
  url: `${BOOK}/${slug}/student/Intro.html`,
})

const SEMINAR_FORMAT =
  'Format: hands-on Colab tutorial (40 min), break (10 min), applied concepts from the research literature (40 min), and discussion (20 min).'

const program: ProgramSeed[] = [
  {
    activityType: 'seminar',
    slug: '2026-onboarding',
    title: 'Session 1: Linear Models, Dimension Reduction, and Deep Learning',
    description:
      'Onboarding session: three short sessions on fitting models to data, dimensionality reduction, and convolutional neural networks.',
    date: '2026-04-30T09:00:00.000Z',
    location: '117호',
    recordingUrl: 'https://youtu.be/0wJqJhq6No4',
    bookChapters: [
      chapter('Linear Models', 'Session_1_Models'),
      chapter('Dimension Reduction', 'Session_1_DimensionReduction'),
      chapter('Deep Learning', 'Session_1_DeepLearning'),
    ],
    paragraphs: [
      'The first Foundations Seminar of NABI 2026 introduces the machine learning tools used throughout the year: linear models, dimensionality reduction, and convolutional neural networks.',
      'Format: three sub-sessions of 50 minutes each, with a Colab tutorial (40 min) and discussion (10 min).',
    ],
  },
  {
    activityType: 'seminar',
    slug: '2026-bayesian-inference',
    title: 'Session 2: Bayesian Inference',
    description: 'Probabilistic reasoning about hidden causes, uncertainty, and decisions.',
    date: '2026-05-13T09:00:00.000Z',
    location: '401호',
    recordingUrl: 'https://youtu.be/8VYbCRJeFyQ',
    bookChapters: [chapter('Bayesian Inference', 'Session_2_BayesianInference')],
    paragraphs: [
      'How should a brain, or a model, combine noisy evidence with prior expectations? This session introduces Bayesian inference and its use in modelling perception and decision-making.',
      SEMINAR_FORMAT,
    ],
  },
  {
    activityType: 'seminar',
    slug: '2026-hidden-dynamics',
    title: 'Session 3: Hidden Dynamics',
    description: 'Latent-state models of temporal structure, from hidden Markov models onward.',
    date: '2026-05-26T09:00:00.000Z',
    location: 'GDR',
    recordingUrl: 'https://youtu.be/76yK7wj30dU',
    bookChapters: [chapter('Hidden Dynamics', 'Session_3_HiddenDynamics')],
    paragraphs: [
      'Observed behaviour and neural activity are often driven by states we cannot see directly. This session introduces hidden Markov models and latent dynamics for inferring those states over time.',
      SEMINAR_FORMAT,
    ],
  },
  {
    activityType: 'seminar',
    slug: '2026-reinforcement-learning',
    title: 'Session 4: Reinforcement Learning',
    description:
      'Learning from trial, error, and reward: bandits, temporal-difference learning, and the dopamine reward prediction error.',
    date: '2026-07-09T09:00:00.000Z',
    location: 'GDR',
    recordingUrl: 'https://youtu.be/ZyfXsAtiUjg',
    bookChapters: [chapter('Reinforcement Learning', 'Session_4_ReinforcementLearning')],
    paragraphs: [
      'An intuitive tour of reinforcement learning, from the explore–exploit dilemma and the Bellman equation through deep RL, to the temporal-difference error carried by midbrain dopamine neurons and the distinction between model-free and model-based control.',
      SEMINAR_FORMAT,
    ],
  },
  {
    activityType: 'seminar',
    slug: '2026-representation-geometry',
    title: 'Session 5: Representation Geometry',
    description:
      'What a network or brain region represents, and in what form: RSA, cross-condition generalization, and dynamical similarity analysis.',
    date: '2026-07-22T09:00:00.000Z',
    location: 'GDR',
    recordingUrl: 'https://youtu.be/9gWRUOZVniw',
    bookChapters: [chapter('Representation Geometry', 'Session_5_RepresentationGeometry')],
    paragraphs: [
      'Two networks can reach the same accuracy with entirely different internal solutions. This session compares representations with representational similarity analysis (RSA), tests abstraction with cross-condition generalization performance (CCGP), and compares dynamics with dynamical similarity analysis (DSA).',
      SEMINAR_FORMAT,
    ],
  },
]

const richText = (paragraphs: string[]): DefaultTypedEditorState =>
  ({
    root: {
      type: 'root',
      children: paragraphs.map((text) => ({
        type: 'paragraph',
        children: [
          { type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text, version: 1 },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        textFormat: 0,
        version: 1,
      })),
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  }) as DefaultTypedEditorState

const toData = (seed: ProgramSeed): Partial<Activity> => ({
  title: seed.title,
  slug: seed.slug,
  activityType: seed.activityType,
  description: seed.description,
  date: seed.date,
  location: seed.location,
  recordingUrl: seed.recordingUrl ?? null,
  bookChapters: seed.bookChapters ?? [],
  references: (seed.papers ?? []).map((paper) => ({
    title: paper.title,
    journal: paper.journal,
    year: paper.year,
    doi: paper.doi,
    authors: [],
  })),
  content: richText(seed.paragraphs),
  meta: {
    title: `${seed.title} | NABI`,
    description: seed.description,
  },
  _status: 'published',
})

const main = async () => {
  const payload = await getPayload({ config })

  for (const seed of program) {
    const existing = await payload.find({
      collection: 'activities',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: { slug: { equals: seed.slug } },
    })

    const data = toData(seed)
    if (existing.docs[0]) {
      await payload.update({
        collection: 'activities',
        id: existing.docs[0].id,
        data,
        overrideAccess: true,
        context: { disableRevalidate: true },
      })
      payload.logger.info(`[seed-2026-program] Updated ${seed.slug}`)
    } else {
      await payload.create({
        collection: 'activities',
        data: data as Activity,
        overrideAccess: true,
        context: { disableRevalidate: true },
      })
      payload.logger.info(`[seed-2026-program] Created ${seed.slug}`)
    }
  }

  process.exit(0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
