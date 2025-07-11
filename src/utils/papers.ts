import { getCollection, type CollectionEntry } from 'astro:content';
import { cleanSlug } from '~/utils/permalinks';
import type { Paper } from '~/types';

export async function getAllPapers(): Promise<Paper[]> {
  const posts = (await getCollection('post')) as CollectionEntry<'post'>[];
  const news = (await getCollection('news')) as CollectionEntry<'news'>[];

  const papers: Paper[] = [];

  // Process posts
  for (const post of posts) {
    if (post.data.reference) {
      const slug =
        post.id
          .split('/')
          .pop()
          ?.replace(/\.(md|mdx)$/, '') || '';
      const articleUrl = `/posts/${cleanSlug(post.data.category || '')}/${slug}`;

      papers.push({
        title: post.data.reference.title,
        authors: post.data.reference.authors,
        journal: post.data.reference.journal,
        year: post.data.reference.year,
        doi: post.data.reference.doi,
        articleUrl,
        sources: [{
          type: 'post',
          title: post.data.title,
          url: articleUrl,
        }],
      });
    }
  }

  // Process news
  for (const newsItem of news) {
    if (newsItem.data.references && newsItem.data.references.length > 0) {
      const slug =
        newsItem.id
          .split('/')
          .pop()
          ?.replace(/\.(md|mdx)$/, '') || '';
      const articleUrl = newsItem.data.href ? String(newsItem.data.href) : `/monthly/${slug}`;

      for (const reference of newsItem.data.references) {
        papers.push({
          title: reference.title,
          authors: reference.authors,
          journal: reference.journal,
          year: reference.year,
          doi: reference.doi,
          articleUrl,
          sources: [{
            type: 'news',
            title: newsItem.data.title,
            url: articleUrl,
          }],
        });
      }
    }
  }

  // Group papers by title and authors, combining sources
  const paperMap = new Map<string, Paper>();
  
  for (const paper of papers) {
    const key = `${paper.title}|${JSON.stringify(paper.authors.sort())}`;
    
    if (paperMap.has(key)) {
      // Add source to existing paper
      const existingPaper = paperMap.get(key)!;
      existingPaper.sources.push(...paper.sources);
    } else {
      // Create new paper entry
      paperMap.set(key, paper);
    }
  }

  // Convert map values to array and sort alphabetically by title
  return Array.from(paperMap.values()).sort((a, b) => a.title.localeCompare(b.title));
}
