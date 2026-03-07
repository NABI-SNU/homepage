import React from 'react'

import { hasAdminRole } from '@/access/hasAdminRole'
import type { User } from '@/payload-types'

import './index.scss'

const baseClass = 'before-dashboard'

const adminSteps = [
  {
    title: 'Global content',
    description: 'Review Home Page, About Page, and Contact Page to keep public messaging current.',
    links: [],
  },
  {
    title: 'Collections',
    description: 'Update Posts, News, Research, and People as you publish new work.',
    links: [],
  },
  {
    title: 'Schema & access',
    description:
      'Modify access and schema carefully and run migrations when deploying schema changes.',
    links: [],
  },
  {
    title: 'Documentation',
    description: 'Advanced configuration guides.',
    links: [
      { label: 'Collections', href: 'https://payloadcms.com/docs/configuration/collections' },
      { label: 'Fields', href: 'https://payloadcms.com/docs/fields/overview' },
      { label: 'Migrations', href: 'https://payloadcms.com/docs/database/migrations' },
    ],
  },
] as const

const memberSteps = [
  {
    title: 'Profile',
    description:
      'Keep your member profile current so your public bio, avatar, and research topics stay accurate.',
    links: [{ label: 'Open /account', href: '/account' }],
  },
  {
    title: 'Posts',
    description:
      'Create or update your own posts. Your linked People profile remains attached as an author automatically.',
    links: [{ label: 'Create post', href: '/admin/collections/posts/create' }],
  },
  {
    title: 'Wiki',
    description:
      'Create and maintain wiki pages you own. Ownership is assigned automatically when you create a page.',
    links: [{ label: 'Create wiki page', href: '/admin/collections/wiki/create' }],
  },
  {
    title: 'What is hidden',
    description:
      'Sitewide settings and admin-only collections are intentionally hidden here. Ask an admin if you need broader access.',
    links: [],
  },
] as const

type BeforeDashboardProps = {
  user?: User | null
}

const BeforeDashboard: React.FC<BeforeDashboardProps> = ({ user }) => {
  const isAdmin = hasAdminRole(user)
  const steps = isAdmin ? adminSteps : memberSteps
  const intro = isAdmin
    ? 'This is the admin dashboard for the NABI website. Use it to manage public content, structure, and operations.'
    : 'This workspace is scoped to your self-service areas. Use it to update your profile, write posts, and maintain wiki pages.'

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__card`}>
        <div className={`${baseClass}__header`}>
          <span className={`${baseClass}__badge`}>
            {isAdmin ? 'Administrator' : 'Member workspace'}
          </span>
          <h2 className={`${baseClass}__title`}>
            {isAdmin
              ? 'Welcome to the NABI admin dashboard'
              : 'Welcome to your NABI editing workspace'}
          </h2>
        </div>
        <p className={`${baseClass}__intro`}>{intro}</p>
        <p className={`${baseClass}__intro`}>
          {isAdmin
            ? 'Recommended next steps to update the site and keep the data current.'
            : 'Recommended next steps to keep your member-facing content current.'}
        </p>
        <ol className={`${baseClass}__steps`}>
          {steps.map((step, index) => (
            <li key={index} className={`${baseClass}__step`}>
              <span className={`${baseClass}__step-number`}>{index + 1}</span>
              <div className={`${baseClass}__step-body`}>
                <strong className={`${baseClass}__step-title`}>{step.title}</strong>
                <span className={`${baseClass}__step-description`}> — {step.description}</span>
                {step.links.length > 0 && (
                  <span className={`${baseClass}__step-links`}>
                    {step.links.map((link, i) => (
                      <span key={i}>
                        {i > 0 && ' · '}
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${baseClass}__link`}
                        >
                          {link.label}
                        </a>
                      </span>
                    ))}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

export default BeforeDashboard
