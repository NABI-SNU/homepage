import { getCollection, type CollectionEntry } from 'astro:content';

import type { ResearchItem } from '~/types';

const getSlug = (id: string) =>
  id
    .split('/')
    .pop()
    ?.replace(/\.(md|mdx)$/i, '') || '';

export const fetchResearch = async (): Promise<ResearchItem[]> => {
  const entries = (await getCollection('research')) as CollectionEntry<'research'>[];

  const items = await Promise.all(
    entries.map(async (entry) => {
      const { data, id } = entry;
      const slug = getSlug(id);
      // Render is called to make MDX Content available if needed later

      return {
        title: data.title,
        description: data.description,
        date: data.date,
        image: data.image,
        slug,
        notebook: data.notebook,
        references: data.references?.map((r) => ({
          ...r,
          url: r.url || '',
          sources: [
            {
              type: 'research',
              title: data.title,
              url: `/labs/${slug}`,
            },
          ],
        })),
      } as ResearchItem;
    })
  );

  // No specific sort required; if date exists, sort desc
  return items.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
};

export const getStaticPathsResearch = async () => {
  const entries = (await getCollection('research')) as CollectionEntry<'research'>[];
  return entries.map((entry) => ({
    params: { slug: getSlug(entry.id) },
    props: { id: entry.id },
  }));
};
