import { getPermalink, getBlogPermalink, getAsset } from './utils/permalinks';

export const headerData = {
  links: [
    {
      text: 'About Us',
      href: getPermalink('/about'),
    },
    {      
      text: 'Our People',
      href: getPermalink('/people'),
    },
    {
      text: 'Activity',
      href: getPermalink('/activity'),
    },
    {
      text: 'Articles',
      href: getBlogPermalink(),
      links: [
        {
          text: 'Blog List',
          href: getBlogPermalink(),
        },
        {
          text: 'Article',
          href: getPermalink('get-started-website-with-astro-tailwind-css', 'post'),
        },
        {
          text: 'Article (with MDX)',
          href: getPermalink('markdown-elements-demo-post', 'post'),
        },
        {
          text: 'Category Page',
          href: getPermalink('tutorials', 'category'),
        },
        {
          text: 'Tag Page',
          href: getPermalink('astro', 'tag'),
        },
      ],
    },
    {
      text: 'Resources',
      href: getPermalink('/research'),
    },
    {
      text: 'Contact',
      href: getPermalink('/contact'),
    },
  ],
};

export const footerData = {
  links: [
    {
      title: 'Resources',
      links: [
        { text: 'Features', href: getPermalink('/research') },
        { text: 'Security', href: getPermalink('/research') },
        { text: 'Team', href: getPermalink('/research') },
        { text: 'Enterprise', href: getPermalink('/research') },
        { text: 'Pricing', href: getPermalink('/research') },
      ],
    },
    {
      title: 'Support',
      links: [
        { text: 'Docs', href: getPermalink('/contact') },
        { text: 'Community Forum', href: getPermalink('/contact') },
        { text: 'Status', href: getPermalink('/contact') },
      ],
    },
    {
      title: 'Articles',
      links: [
        { text: 'Blog List', href: getBlogPermalink() },
        { text: 'Article', href: getPermalink('get-started-website-with-astro-tailwind-css', 'post') },
        { text: 'Article (with MDX)', href: getPermalink('markdown-elements-demo-post', 'post') },
        { text: 'Category Page', href: getPermalink('tutorials', 'category') },
      ],
    },
    {
      title: 'Company',
      links: [
        { text: 'About Us', href: getPermalink('/about') },
        { text: 'Our People', href: getPermalink('/people') },
        { text: 'Research', href: getPermalink('/research') },
        { text: 'Activity', href: getPermalink('/activity') },
        { text: 'Contact Us', href: getPermalink('/contact') },
      ],
    },
  ],
  secondaryLinks: [
    { text: 'Terms', href: getPermalink('/terms') },
    { text: 'Privacy Policy', href: getPermalink('/privacy') },
  ],
  socialLinks: [
    { ariaLabel: 'RSS', icon: 'tabler:rss', href: getAsset('/rss.xml') },
    { ariaLabel: 'Email', icon: 'tabler:mail', href: 'mailto:nabi.members@gmail.com' },
    { ariaLabel: 'Youtube', icon: 'tabler:brand-youtube', href: 'https://www.youtube.com/@nabi.members' },
    { ariaLabel: 'Github', icon: 'tabler:brand-github', href: 'https://github.com/nabi-snu' },
  ],
};
