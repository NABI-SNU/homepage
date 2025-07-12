export interface MonthlyItem {
  title: string;
  description?: string;
  icon: string;
  href: string;
  date: Date;
}

export const getLatestMonthlyItems = async (count = 6): Promise<MonthlyItem[]> => {
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
        icon: `tabler:number-${date.getMonth() + 1}`,
        href: `/news/${slug}`,
        date,
      } as MonthlyItem;
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, count);
};
