import type { CollectionConfig } from 'payload'

import { adminOnly, isAdminRequest } from '../../access/adminOnly'
import { adminOrSelf } from '../../access/adminOrSelf'
import { authenticated } from '../../access/authenticated'
import { payloadBetterAuthStrategy } from '@/auth/payloadBetterAuthStrategy'
import { hideFromNonAdmins } from '@/access/hideFromNonAdmins'
import { syncUserRoleFields } from './hooks/syncUserRoleFields'
import { sendApprovalRequestEmail } from './hooks/sendApprovalRequestEmail'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: authenticated,
    create: adminOnly,
    delete: adminOnly,
    read: adminOrSelf,
    update: adminOnly,
  },
  admin: {
    defaultColumns: ['name', 'email', 'isApproved', 'roles'],
    hidden: hideFromNonAdmins,
    useAsTitle: 'name',
  },
  auth: {
    disableLocalStrategy: {
      enableFields: true,
      optionalPassword: true,
    },
    strategies: [payloadBetterAuthStrategy({ idType: 'number' })],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'role',
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
      admin: {
        hidden: true,
      },
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
      name: 'emailVerified',
      type: 'checkbox',
      defaultValue: false,
      required: true,
      access: {
        update: ({ req }) => isAdminRequest(req),
      },
      admin: {
        description: 'Mirrors Better Auth email verification status for admin checks.',
        readOnly: true,
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
  hooks: {
    beforeValidate: [syncUserRoleFields],
    afterChange: [sendApprovalRequestEmail],
  },
  timestamps: true,
}
