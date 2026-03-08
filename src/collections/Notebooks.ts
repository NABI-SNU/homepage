import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload'

import { APIError } from 'payload'
import path from 'path'
import { fileURLToPath } from 'url'

import { adminOnly } from '@/access/adminOnly'
import { hideFromNonAdmins } from '@/access/hideFromNonAdmins'
import { publishedResearchNotebook } from '@/access/publishedResearchNotebook'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const allowedNotebookMimeTypes = [
  'application/x-ipynb+json',
  'application/json',
  'application/octet-stream',
  'text/plain',
] as const

const validateNotebookExtension: CollectionBeforeValidateHook = ({ operation, req }) => {
  if (operation !== 'create' && operation !== 'update') return

  const file = req.file as { name?: string } | undefined
  if (!file?.name) return

  if (path.extname(file.name).toLowerCase() !== '.ipynb') {
    throw new APIError('Only .ipynb notebook uploads are allowed.', 400)
  }
}

export const Notebooks: CollectionConfig = {
  slug: 'notebooks',
  admin: {
    defaultColumns: ['filename', 'updatedAt', 'createdAt'],
    hidden: hideFromNonAdmins,
    useAsTitle: 'filename',
  },
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: publishedResearchNotebook,
    update: adminOnly,
  },
  fields: [],
  hooks: {
    beforeValidate: [validateNotebookExtension],
  },
  upload: {
    mimeTypes: [...allowedNotebookMimeTypes],
    // Keep notebook files outside Next's public directory so Payload can enforce read access.
    staticDir: path.resolve(dirname, '../../storage/notebooks'),
  },
}
