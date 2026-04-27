import type { GlobalConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { hideFromNonAdmins } from '@/access/hideFromNonAdmins'
import { link } from '@/fields/link'
import { revalidateHeader } from './hooks/revalidateHeader'

export const Header: GlobalConfig = {
  slug: 'header',
  admin: {
    hidden: hideFromNonAdmins,
  },
  access: {
    read: () => true,
    update: adminOnly,
  },
  hooks: {
    afterChange: [revalidateHeader],
  },
  fields: [
    {
      name: 'navItems',
      type: 'array',
      defaultValue: [
        { link: { type: 'custom', label: 'About', url: '/about' } },
        { link: { type: 'custom', label: 'People', url: '/people' } },
        {
          link: { type: 'custom', label: 'Activities', url: '/conferences' },
          links: [
            { link: { type: 'custom', label: 'Announcements', url: '/announcements' } },
            { link: { type: 'custom', label: 'Symposium', url: '/symposium' } },
            { link: { type: 'custom', label: 'Conferences', url: '/conferences' } },
          ],
        },
        {
          link: { type: 'custom', label: 'Articles', url: '/posts' },
          links: [
            { link: { type: 'custom', label: 'All Posts', url: '/posts' } },
            {
              link: { type: 'custom', label: 'Monthly Meetings', url: '/category/monthly-meeting' },
            },
            { link: { type: 'custom', label: 'Opinions', url: '/category/opinions' } },
          ],
        },
        {
          link: { type: 'custom', label: 'Resources', url: '/labs' },
          links: [
            { link: { type: 'custom', label: 'Research', url: '/labs' } },
            { link: { type: 'custom', label: 'News', url: '/news' } },
            { link: { type: 'custom', label: 'Bibliography', url: '/references' } },
            { link: { type: 'custom', label: 'Wiki', url: '/wiki' } },
            {
              link: {
                type: 'custom',
                label: 'Book',
                url: 'https://book.nabilab.org',
                newTab: true,
              },
            },
          ],
        },
        { link: { type: 'custom', label: 'Contact', url: '/contact' } },
      ],
      fields: [
        link({
          appearances: false,
        }),
        {
          name: 'links',
          type: 'array',
          fields: [
            link({
              appearances: false,
            }),
          ],
          maxRows: 8,
          admin: {
            description: 'Optional dropdown links shown under this navigation item.',
            initCollapsed: true,
          },
        },
      ],
      maxRows: 8,
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: '@/Header/RowLabel#RowLabel',
        },
      },
    },
  ],
}
