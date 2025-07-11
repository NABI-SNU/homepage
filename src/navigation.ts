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
          text: 'All Posts',
          href: getBlogPermalink(),
        },
        {
          text: 'Monthly Meetings',
          href: getPermalink('monthly-meeting', 'category'),
        },
        {
          text: 'Opinions',
          href: getPermalink('opinions', 'category'),
        },
      ],
    },
    {
      text: 'Resources',
      href: getPermalink('/research'),
      links: [
        {
          text: 'Research',
          href: getPermalink('/research'),
        },
        {
          text: 'News',
          href: getPermalink('/news'),
        },
        {
          text: 'Papers',
          href: getPermalink('/references'),
        },
      ],
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
      title: 'Support',
      links: [{ text: 'Contact Us', href: getPermalink('/contact') }],
    },
    {
      title: 'Who We Are',
      links: [
        { text: 'About Us', href: getPermalink('/about') },
        { text: 'Our People', href: getPermalink('/people') },
        { text: 'Research', href: getPermalink('/research') },
        { text: 'Activity', href: getPermalink('/activity') },
      ],
    },
    {
      title: 'Articles',
      links: [
        { text: 'All Posts', href: getBlogPermalink() },
        { text: 'Monthly Meetings', href: getPermalink('monthly-meeting', 'category') },
        { text: 'Opinions', href: getPermalink('opinions', 'category') },
      ],
    },
    {
      title: 'Resources',
      links: [
        { text: 'Research', href: getPermalink('/research') },
        { text: 'News', href: getPermalink('/news') },
        { text: 'Papers', href: getPermalink('/references') },
        { text: 'Source Code', href: 'https://www.github.com/NABI-SNU/homepage' },
      ],
    },
  ],
  secondaryLinks: [],
  socialLinks: [
    { ariaLabel: 'RSS', icon: 'tabler:rss', href: getAsset('/rss.xml') },
    { ariaLabel: 'Email', icon: 'tabler:mail', href: 'mailto:nabi.members@gmail.com' },
    { ariaLabel: 'Youtube', icon: 'tabler:brand-youtube', href: 'https://www.youtube.com/@nabi.members' },
    { ariaLabel: 'Github', icon: 'tabler:brand-github', href: 'https://github.com/nabi-snu' },
  ],
};
