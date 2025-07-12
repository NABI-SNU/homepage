import { getCollection, type CollectionEntry } from 'astro:content';
import { cleanSlug } from '~/utils/permalinks';
import type { Paper } from '~/types';

export async function getAllPapers(): Promise<Paper[]> {
  const [posts, news] = await Promise.all([
    getCollection('post') as Promise<CollectionEntry<'post'>[]>,
    getCollection('news') as Promise<CollectionEntry<'news'>[]>,
  ]);

  const papers: Paper[] = [];

  const defaultUrlFactory = {
    post: (item: CollectionEntry<'post'>, slug: string) => `/posts/${cleanSlug(item.data.category ?? '')}/${slug}`,
    news: (item: CollectionEntry<'news'>, slug: string) =>
      item.data.href ? String(item.data.href) : `/monthly/${slug}`,
  } as const;

  function processCollection<T extends keyof typeof defaultUrlFactory>(items: CollectionEntry<T>[], type: T) {
    items.forEach((item) => {
      const refs = item.data.references ?? [];
      if (!refs.length) return;

      const slug =
        item.id
          .split('/')
          .pop()
          ?.replace(/\.(md|mdx)$/, '') ?? '';
      const defaultUrl = defaultUrlFactory[type](item as any, slug); // eslint-disable-line @typescript-eslint/no-explicit-any

      refs.forEach((reference) => {
        const articleUrl = reference.url
          ? reference.url
          : reference.doi
            ? `https://doi.org/${reference.doi}`
            : defaultUrl;

        papers.push({
          title: reference.title,
          authors: reference.authors,
          journal: reference.journal,
          year: reference.year,
          doi: reference.doi,
          url: articleUrl,
          sources: [
            {
              type,
              title: item.data.title,
              url: defaultUrl,
            },
          ],
        });
      });
    });
  }

  processCollection(posts, 'post');
  processCollection(news, 'news');

  const paperMap = new Map<string, Paper>();
  for (const paper of papers) {
    const key = `${paper.title}|${JSON.stringify([...paper.authors].sort())}`;
    if (!paperMap.has(key)) {
      paperMap.set(key, paper);
    } else {
      paperMap.get(key)!.sources.push(...paper.sources);
    }
  }

  return Array.from(paperMap.values());
}
