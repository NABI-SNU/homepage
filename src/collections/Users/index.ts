import type { CollectionConfig } from 'payload'

import { adminOnly, isAdminRequest } from '../../access/adminOnly'
import { adminOrSelf } from '../../access/adminOrSelf'
import { payloadBetterAuthStrategy } from '@/auth/payloadBetterAuthStrategy'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: ({ req }) => isAdminRequest(req),
    create: adminOnly,
    delete: adminOnly,
    read: adminOrSelf,
    update: adminOrSelf,
  },
  admin: {
    defaultColumns: ['name', 'email', 'isApproved', 'roles'],
    useAsTitle: 'name',
  },
  auth: {
    disableLocalStrategy: {
      enableFields: true,
      optionalPassword: true,
    },
    strategies: [payloadBetterAuthStrategy],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'roles',
      type: 'select',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'User', value: 'user' },
      ],
      required: true,
      defaultValue: 'user',
      saveToJWT: true,
      access: {
        update: ({ req }) => isAdminRequest(req),
      },
    },
    {
      name: 'isApproved',
      type: 'checkbox',
      defaultValue: false,
      required: true,
      access: {
        update: ({ req }) => isAdminRequest(req),
      },
      admin: {
        description: 'Users must be approved by an admin before they can sign in.',
      },
    },
    {
      name: 'betterAuthUserId',
      type: 'text',
      unique: true,
      index: true,
      access: {
        update: ({ req }) => isAdminRequest(req),
      },
      admin: {
        description: 'Mapped BetterAuth user ID for cross-system identity sync.',
      },
    },
  ],
  timestamps: true,
}
