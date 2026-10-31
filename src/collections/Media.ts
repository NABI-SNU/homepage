import type { CollectionConfig } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'

import { anyone } from '../access/anyone'
import { adminOnly } from '../access/adminOnly'
import { hideFromNonAdmins } from '../access/hideFromNonAdmins'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
// WebP at effort 3 is close to the default (4) in size but noticeably faster to encode; the
// encode happens on every upload, inside a serverless function, once per generated size.
const webpFormatOptions = {
  format: 'webp',
  options: {
    effort: 3,
    quality: 82,
  },
} as const

export const Media: CollectionConfig = {
  slug: 'media',
  folders: true,
  admin: {
    hidden: hideFromNonAdmins,
  },
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: anyone,
    update: adminOnly,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      //required: true,
    },
    {
      name: 'caption',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()]
        },
      }),
    },
  ],
  upload: {
    // Upload to the public/media directory in Next.js making them publicly accessible even outside of Payload
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    staticDir: path.resolve(dirname, '../../public/media'),
    adminThumbnail: 'thumbnail',
    focalPoint: true,
    formatOptions: webpFormatOptions,
    // The site renders media through Next.js's image optimizer (`/_next/image?url=...`), which
    // resizes on demand and caches the result, so pre-rendered size variants are only needed
    // where a fixed file is required: the admin thumbnail and the Open Graph image used in
    // `generateMeta`. Every extra variant here is one more full WebP encode + upload per save.
    imageSizes: [
      {
        name: 'thumbnail',
        width: 300,
        formatOptions: webpFormatOptions,
      },
      {
        name: 'og',
        width: 1200,
        height: 630,
        crop: 'center',
        formatOptions: webpFormatOptions,
      },
    ],
  },
}
