import type { CollectionConfig, FieldAccess } from 'payload'

import { adminOnly, isAdminRequest } from '../../access/adminOnly'
import { authenticated } from '../../access/authenticated'
import { payloadBetterAuthStrategy } from '@/auth/payloadBetterAuthStrategy'
import { hideFromNonAdmins } from '@/access/hideFromNonAdmins'
import { adminOrSelfField, publicReadableUsers } from '@/access/publicReadableUsers'
import { syncUserRoleFields } from './hooks/syncUserRoleFields'
import { sendApprovalRequestEmail } from './hooks/sendApprovalRequestEmail'
import { revokeSessionsOnAccessLoss } from '@/auth/revokeUserSessions'
import { normalizeUserEmail } from './hooks/normalizeUserEmail'
import { normalizeProfileFields } from './hooks/normalizeProfileFields'
import { preventDuplicateUsers } from './hooks/preventDuplicateUsers'
import { ensureUserSlug } from './hooks/ensureUserSlug'
import { revalidateUserProfile, revalidateUserProfileDelete } from './hooks/revalidateUserProfile'
import { revealOnApproval } from './hooks/revealOnApproval'
import { syncResearchTagsFromUser } from './hooks/syncResearchTags'

const adminOnlyUpdate: FieldAccess = ({ req }) => isAdminRequest(req)

/**
 * One record per human. A user is both the login identity (Better Auth) and the public member
 * profile that used to live in the separate `people` collection: members without a login
 * (alumni, past members) are users with no Better Auth account.
 *
 * Members edit their own profile through `/account/profile`, which whitelists the editable
 * fields; direct updates to the collection stay admin-only so nobody can touch their own
 * email, roles or approval.
 */
export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: authenticated,
    create: adminOnly,
    delete: adminOnly,
    read: publicReadableUsers,
    update: adminOnly,
  },
  admin: {
    defaultColumns: ['name', 'email', 'isApproved', 'roles', 'memberType', 'years', 'updatedAt'],
    hidden: hideFromNonAdmins,
    useAsTitle: 'name',
  },
  auth: {
    disableLocalStrategy: {
      enableFields: true,
      optionalPassword: true,
    },
    // Profile-only members (no login) may have no email, so email cannot be required.
    loginWithUsername: {
      allowEmailLogin: true,
      requireEmail: false,
      requireUsername: false,
    },
    strategies: [payloadBetterAuthStrategy({ idType: 'number' })],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      // Declared explicitly so it can be optional. Payload's own auth field honours
      // `loginWithUsername.requireEmail: false`, but the Better Auth plugin re-adds any field its
      // schema lists and the collection lacks — with the schema's `required: true`. Profile-only
      // members (no login) have no email; a `username` (= slug) satisfies the auth collection rule.
      name: 'email',
      type: 'email',
      required: false,
      unique: true,
      index: true,
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        description: 'Public profile URL: /people/<slug>. Generated from the name when empty.',
        position: 'sidebar',
      },
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
        read: adminOrSelfField,
        update: adminOnlyUpdate,
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
        read: adminOrSelfField,
        update: adminOnlyUpdate,
      },
    },
    {
      name: 'isApproved',
      type: 'checkbox',
      defaultValue: false,
      required: true,
      access: {
        read: adminOrSelfField,
        update: adminOnlyUpdate,
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
        read: adminOrSelfField,
        update: adminOnlyUpdate,
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
        read: adminOrSelfField,
        update: adminOnlyUpdate,
      },
      admin: {
        description: 'Mapped BetterAuth user ID for cross-system identity sync.',
      },
    },
    {
      name: 'contactEmail',
      // A text field with an email validator on purpose: Payload's `email` field type inside an
      // auth collection that uses `loginWithUsername` is treated as a login email and becomes
      // required whenever `username` is empty.
      type: 'text',
      index: true,
      validate: (value: unknown) => {
        if (value == null || value === '') return true
        if (typeof value !== 'string') return 'Enter a valid email address.'
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) || 'Enter a valid email address.'
      },
      access: { update: adminOnlyUpdate },
      admin: {
        description:
          'Public contact address shown on the profile. Members without a login are listed with this address; when they later sign up (and verify) with it, the two records are merged.',
      },
    },
    {
      name: 'memberType',
      type: 'select',
      defaultValue: 'user',
      options: [
        { label: 'Member', value: 'user' },
        { label: 'Alumni', value: 'alumni' },
      ],
      access: { update: adminOnlyUpdate },
      admin: {
        description: 'Alumni are listed publicly but cannot sign in to the member workspace.',
      },
    },
    {
      name: 'isVisible',
      type: 'checkbox',
      defaultValue: true,
      index: true,
      access: { update: adminOnlyUpdate },
      admin: {
        description: 'Controls whether this member appears publicly in /people and profile pages.',
      },
    },
    {
      name: 'bio',
      type: 'textarea',
    },
    {
      name: 'research',
      type: 'text',
      hasMany: true,
      admin: {
        description:
          'Research topics are stored as a list of strings and synced into the Tags collection for post tagging.',
        placeholder: 'Add one topic per item',
      },
    },
    {
      name: 'isAuthor',
      type: 'checkbox',
      defaultValue: false,
      index: true,
    },
    {
      name: 'years',
      type: 'number',
      hasMany: true,
      index: true,
      min: 1900,
      max: 2100,
      admin: {
        description: 'Years in which this member has participated in the group.',
      },
    },
    {
      name: 'roleAssignments',
      type: 'array',
      access: { update: adminOnlyUpdate },
      admin: {
        description: 'Optional leadership roles by year, used for public role badges.',
        initCollapsed: true,
      },
      fields: [
        {
          name: 'year',
          type: 'number',
          required: true,
          min: 1900,
          max: 2100,
        },
        {
          name: 'role',
          type: 'select',
          required: true,
          options: [
            { label: 'Executive', value: 'executive' },
            { label: 'President', value: 'president' },
          ],
        },
      ],
    },
    {
      name: 'socials',
      type: 'array',
      fields: [
        {
          name: 'platform',
          type: 'select',
          required: true,
          options: [
            { label: 'X', value: 'x' },
            { label: 'GitHub', value: 'github' },
            { label: 'LinkedIn', value: 'linkedin' },
            { label: 'ORCID', value: 'orcid' },
            { label: 'Website', value: 'website' },
          ],
        },
        {
          name: 'url',
          type: 'text',
          required: true,
        },
        {
          name: 'label',
          type: 'text',
        },
      ],
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
    },
  ],
  hooks: {
    beforeValidate: [
      normalizeUserEmail,
      syncUserRoleFields,
      normalizeProfileFields,
      preventDuplicateUsers,
      ensureUserSlug,
    ],
    afterChange: [
      sendApprovalRequestEmail,
      revealOnApproval,
      revokeSessionsOnAccessLoss,
      syncResearchTagsFromUser,
      revalidateUserProfile,
    ],
    afterDelete: [revalidateUserProfileDelete],
  },
  timestamps: true,
}
