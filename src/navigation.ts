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
          text: 'Explore our Posts',
          href: getBlogPermalink(),
        },
        {
          text: 'Explore Categories',
          href: getPermalink('monthly-meeting', 'category'),
        },
        {
          text: 'Explore Tags',
          href: getPermalink('bayesian-inference', 'tag'),
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
          text: 'Monthly Papers',
          href: getPermalink('/monthly'),
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
      links: [
        { text: 'Contact Us', href: getPermalink('/contact') },
      ],
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
        { text: 'Meeting Notes', href: getBlogPermalink() },
        { text: 'Monthly Meetings', href: getPermalink('monthly-meeting', 'category') },
        { text: 'Bayesian Inference', href: getPermalink('bayesian-inference', 'tag') },
      ],
    },
    {
      title: 'Resources',
      links: [
        { text: 'Research', href: getPermalink('/research') },
        { text: 'Monthly Papers', href: getPermalink('/monthly')}
      ],
    },
  ],
  secondaryLinks: [

  ],
  socialLinks: [
    { ariaLabel: 'RSS', icon: 'tabler:rss', href: getAsset('/rss.xml') },
    { ariaLabel: 'Email', icon: 'tabler:mail', href: 'mailto:nabi.members@gmail.com' },
    { ariaLabel: 'Youtube', icon: 'tabler:brand-youtube', href: 'https://www.youtube.com/@nabi.members' },
    { ariaLabel: 'Github', icon: 'tabler:brand-github', href: 'https://github.com/nabi-snu' },
  ],
};
