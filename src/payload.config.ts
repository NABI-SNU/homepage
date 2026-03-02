import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import sharp from 'sharp'
import path from 'path'
import { buildConfig, PayloadRequest } from 'payload'
import { fileURLToPath } from 'url'

import { Categories } from './collections/Categories'
import { Media } from './collections/Media'
import { News } from './collections/News'
import { People } from './collections/People'
import { Posts } from './collections/Posts'
import { Research } from './collections/Research'
import { Tags } from './collections/Tags'
import { Users } from './collections/Users'
import { AboutPage } from './globals/AboutPage/config'
import { ContactPage } from './globals/ContactPage/config'
import { Footer } from './Footer/config'
import { Header } from './Header/config'
import { HomePage } from './globals/HomePage/config'
import { plugins } from './plugins'
import { defaultLexical } from '@/fields/defaultLexical'
import { getStorageDatabaseURL, getStoragePgDependency } from './utilities/storageDatabase'
import { getServerSideURL } from './utilities/getURL'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const smtpPort = Number(process.env.SMTP_PORT || 587)
const smtpSecure = process.env.SMTP_SECURE === 'true'
const smtpConfigured = Boolean(
  process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS,
)
const storageDatabaseURL = getStorageDatabaseURL()

export default buildConfig({
  admin: {
    components: {
      // The `BeforeLogin` component renders a message that you see while logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below.
      beforeLogin: ['@/components/BeforeLogin'],
      // The `BeforeDashboard` component renders the 'welcome' block that you see after logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below.
      beforeDashboard: ['@/components/BeforeDashboard'],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Users.slug,
    livePreview: {
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1440,
          height: 900,
        },
      ],
    },
  },
  // This config helps us configure global or default features that the other editors can inherit
  editor: defaultLexical,
  db: postgresAdapter({
    pg: getStoragePgDependency() as any,
    push: process.env.PAYLOAD_PUSH_SCHEMA === 'true',
    pool: {
      connectionString: storageDatabaseURL,
    },
  }),
  collections: [Posts, News, Research, People, Tags, Media, Categories, Users],
  cors: [getServerSideURL()].filter(Boolean),
  email: nodemailerAdapter({
    defaultFromAddress: process.env.SMTP_FROM_ADDRESS || 'no-reply@nabi.local',
    defaultFromName: process.env.SMTP_FROM_NAME || 'NABI Labs',
    transportOptions: smtpConfigured
      ? {
          host: process.env.SMTP_HOST,
          port: Number.isFinite(smtpPort) ? smtpPort : 587,
          secure: smtpSecure,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        }
      : {
          jsonTransport: true,
        },
  }),
  globals: [Header, Footer, HomePage, AboutPage, ContactPage],
  plugins,
  secret: process.env.PAYLOAD_SECRET,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        // Allow logged in users to execute this endpoint (default)
        if (req.user) return true

        const secret = process.env.CRON_SECRET
        if (!secret) return false

        // If there is no logged in user, then check
        // for the Vercel Cron secret to be present as an
        // Authorization header:
        const authHeader = req.headers.get('authorization')
        return authHeader === `Bearer ${secret}`
      },
    },
    tasks: [],
  },
})
