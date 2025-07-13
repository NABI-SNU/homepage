import type { News, Paper } from '~/types';

export const monthlyItemsPerPage = 3;

/** Get season for a given month number (1-12) */
export const getSeason = (month: number): string => {
  if (month === 12 || month < 3) return 'Winter';
  if (month < 6) return 'Spring';
  if (month < 9) return 'Summer';
  return 'Autumn';
};

/** Get season image URL */
export const getSeasonImage = (season: string): string => {
  const images = {
    Spring: 'https://img-svr.nabiresearch.workers.dev/img/webp/czNmcy1.webp',
    Summer: 'https://img-svr.nabiresearch.workers.dev/img/webp/9g8xIWj.webp',
    Autumn: 'https://img-svr.nabiresearch.workers.dev/img/webp/e71F970.webp',
    Winter: 'https://img-svr.nabiresearch.workers.dev/img/webp/FEA1Ppu.webp',
  };
  return images[season] || images['Spring'];
};

/** Fetch and normalize all monthly news items. */
export const fetchMonthlyItems = async (): Promise<News[]> => {
  const modules = import.meta.glob('~/data/news/*.{md,mdx}', { eager: true });

  return Object.entries(modules)
    .map(([path, mod]) => {
      const slug =
        path
          .split('/')
          .pop()
          ?.replace(/\.(md|mdx)$/, '') || '';
      const frontmatter = (mod as { frontmatter?: Record<string, unknown> }).frontmatter || {};
      const date = new Date(slug);

      return {
        title: (frontmatter.title as string) || slug,
        description: frontmatter.description as string,
        icon: date.getMonth() + 1 != 12 ? `tabler:number-${date.getMonth() + 1}` : 'tabler:number-12-small',
        href: `/news/${slug}`,
        date: slug,
        references: frontmatter.references as Paper[],
      } as News;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

/** Group items by season for pagination */
export const groupItemsBySeason = (items: News[]): News[][] => {
  const groups: News[][] = [];
  let currentGroup: News[] = [];
  let currentSeason: string | null = null;

  for (const item of items) {
    const itemDate = new Date(item.date);
    const itemSeason = getSeason(itemDate.getMonth() + 1);

    if (currentSeason === null) {
      // First item
      currentSeason = itemSeason;
      currentGroup = [item];
    } else if (itemSeason === currentSeason) {
      // Same season, add to current group
      currentGroup.push(item);
    } else {
      // Different season, start new group
      if (currentGroup.length > 0) {
        groups.push(currentGroup);
      }
      currentSeason = itemSeason;
      currentGroup = [item];
    }
  }

  // Add the last group
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
};

/** Get the latest N monthly items. */
export const getLatestMonthlyItems = async (count = monthlyItemsPerPage): Promise<News[]> => {
  return (await fetchMonthlyItems()).slice(0, count);
};
