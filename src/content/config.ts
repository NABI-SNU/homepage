import { glob } from 'astro/loaders';
import { z, defineCollection } from 'astro:content';

const metadataDefinition = () =>
  z
    .object({
      title: z.string().optional(),
      ignoreTitleTemplate: z.boolean().optional(),

      canonical: z.string().url().optional(),

      robots: z
        .object({
          index: z.boolean().optional(),
          follow: z.boolean().optional(),
        })
        .optional(),

      description: z.string().optional(),

      openGraph: z
        .object({
          url: z.string().optional(),
          siteName: z.string().optional(),
          images: z
            .array(
              z.object({
                url: z.string(),
                width: z.number().optional(),
                height: z.number().optional(),
              })
            )
            .optional(),
          locale: z.string().optional(),
          type: z.string().optional(),
        })
        .optional(),

      twitter: z
        .object({
          handle: z.string().optional(),
          site: z.string().optional(),
          cardType: z.string().optional(),
        })
        .optional(),
    })
    .optional();

const paperSchema = z.object({
  title: z.string(),
  authors: z.array(z.string()),
  journal: z.string().optional(),
  year: z.number().optional(),
  doi: z.string().optional(),
  url: z.string().optional(),
  sources: z
    .array(
      z.object({
        type: z.enum(['post', 'news']),
        title: z.string(),
        url: z.string(),
      })
    )
    .optional(),
});

const postCollection = defineCollection({
  loader: glob({ pattern: ['*.md', '*.mdx'], base: 'src/data/post' }),
  schema: z.object({
    publishDate: z.date().optional(),
    updateDate: z.date().optional(),
    draft: z.boolean().optional(),

    title: z.string(),
    excerpt: z.string().optional(),
    image: z.string().optional(),

    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    author: z.string().optional(),

    references: z.array(paperSchema).optional(),
    metadata: metadataDefinition(),
  }),
});

const newsCollection = defineCollection({
  loader: glob({ pattern: ['*.md', '*.mdx'], base: 'src/data/news' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    image: z.string().optional(),
    href: z.string().optional(),
    date: z.string().optional(),
    references: z.array(paperSchema).optional(),
  }),
});

export const collections = {
  post: postCollection,
  news: newsCollection,
};
