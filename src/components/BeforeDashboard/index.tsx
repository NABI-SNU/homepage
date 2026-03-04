import React from 'react'

import './index.scss'

const baseClass = 'before-dashboard'

const STEPS = [
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
]

const BeforeDashboard: React.FC = () => {
  return (
    <div className={baseClass}>
      <div className={`${baseClass}__card`}>
        <h2 className={`${baseClass}__title`}>Welcome to the NABI admin dashboard</h2>
        <p className={`${baseClass}__intro`}>
          Recommended next steps to keep the site current and maintain data integrity.
        </p>
        <ol className={`${baseClass}__steps`}>
          {STEPS.map((step, index) => (
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
