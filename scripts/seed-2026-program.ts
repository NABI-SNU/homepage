/**
 * Creates or updates the NABI 2026 study program: the Foundations Seminar sessions and the
 * Topic Review Series, taken from the 2026 syllabus and timetables in Notion.
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
  activityType: 'seminar' | 'topic-review'
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
  {
    activityType: 'topic-review',
    slug: '2026-september',
    title: 'Topic Review: September 2026',
    description:
      'Representational geometry in prefrontal cortex and the neural signatures of novelty.',
    date: '2026-09-22T09:00:00.000Z',
    location: '117호',
    papers: [
      {
        title:
          'Inferring latent behavioral strategy from the representational geometry of prefrontal cortex activity',
        journal: 'Nature Communications',
        year: 2026,
        doi: '10.1038/s41467-026-69380-6',
      },
      {
        title: 'Representational similarity modulates neural and behavioral signatures of novelty',
        journal: 'Neuron',
        year: 2026,
        doi: '10.1016/j.neuron.2026.01.007',
      },
    ],
    paragraphs: [
      'Two papers reviewed, each with a 40-minute presentation followed by 30 minutes of discussion.',
    ],
  },
  {
    activityType: 'topic-review',
    slug: '2026-october',
    title: 'Topic Review: October 2026',
    description:
      'A brain-wide map of neural activity during complex behaviour, and low-dimensional representations in the expert brain.',
    date: '2026-10-20T09:00:00.000Z',
    location: '401호',
    papers: [
      {
        title: 'A brain-wide map of neural activity during complex behavior',
        journal: 'Nature',
        year: 2025,
        doi: '10.1038/s41586-025-09235-0',
      },
      {
        title:
          'Low-dimensional and optimized representations of high-level information in the expert brain',
        journal: 'Nature Communications',
        year: 2026,
        doi: '10.1038/s41467-026-74566-z',
      },
    ],
    paragraphs: [
      'Two papers reviewed, each with a 40-minute presentation followed by 30 minutes of discussion.',
    ],
  },
  {
    activityType: 'topic-review',
    slug: '2026-november',
    title: 'Topic Review: November 2026',
    description:
      'Aligning machine and human visual representations, and action symbols in primate frontal cortex.',
    date: '2026-11-17T09:00:00.000Z',
    location: '401호',
    papers: [
      {
        title: 'Aligning machine and human visual representations across abstraction levels',
        journal: 'Nature',
        year: 2025,
        doi: '10.1038/s41586-025-09631-6',
      },
      {
        title: 'Neural representation of action symbols in primate frontal cortex',
        journal: 'Nature',
        year: 2026,
        doi: '10.1038/s41586-026-10297-x',
      },
    ],
    paragraphs: [
      'Two papers to be reviewed, each with a 40-minute presentation followed by 30 minutes of discussion.',
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
