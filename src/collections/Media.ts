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

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const webpFormatOptions = {
  format: 'webp',
  options: {
    quality: 82,
  },
} as const

export const Media: CollectionConfig = {
  slug: 'media',
  folders: true,
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
    staticDir: path.resolve(dirname, '../../public/media'),
    adminThumbnail: 'thumbnail',
    focalPoint: true,
    formatOptions: webpFormatOptions,
    imageSizes: [
      {
        name: 'thumbnail',
        width: 300,
        formatOptions: webpFormatOptions,
      },
      {
        name: 'square',
        width: 500,
        height: 500,
        formatOptions: webpFormatOptions,
      },
      {
        name: 'small',
        width: 600,
        formatOptions: webpFormatOptions,
      },
      {
        name: 'medium',
        width: 900,
        formatOptions: webpFormatOptions,
      },
      {
        name: 'large',
        width: 1400,
        formatOptions: webpFormatOptions,
      },
      {
        name: 'xlarge',
        width: 1920,
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
