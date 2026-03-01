import { Banner } from '@payloadcms/ui/elements/Banner'
import React from 'react'

import './index.scss'

const baseClass = 'before-dashboard'

const BeforeDashboard: React.FC = () => {
  return (
    <div className={baseClass}>
      <Banner className={`${baseClass}__banner`} type="success">
        <h4>Welcome to the NABI admin dashboard.</h4>
      </Banner>
      Recommended next steps:
      <ul className={`${baseClass}__instructions`}>
        <li>
          Review global content in <strong>Home Page</strong>, <strong>About Page</strong>, and{' '}
          <strong>Contact Page</strong> to keep public messaging current.
        </li>
        <li>
          Update collections such as <strong>Posts</strong>, <strong>News</strong>,{' '}
          <strong>Research</strong>, and <strong>People</strong> as you publish new work.
        </li>
        <li>
          Modify access and schema carefully and run migrations when deploying schema changes.
        </li>
        <li>
          See Payload documentation for advanced configuration:
          {' '}
          <a
            href="https://payloadcms.com/docs/configuration/collections"
            rel="noopener noreferrer"
            target="_blank"
          >
            collections
          </a>
          {' · '}
          <a
            href="https://payloadcms.com/docs/fields/overview"
            rel="noopener noreferrer"
            target="_blank"
          >
            fields
          </a>
          {' · '}
          <a
            href="https://payloadcms.com/docs/database/migrations"
            rel="noopener noreferrer"
            target="_blank"
          >
            migrations
          </a>
        </li>
      </ul>
    </div>
  )
}

export default BeforeDashboard
