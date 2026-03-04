import { describe, expect, it } from 'vitest'

import config from '@/payload.config'

describe('Admin forbidden-action messaging', () => {
  it('includes admin contact details in forbidden action messages', async () => {
    const payloadConfig = await config
    const enTranslations = (payloadConfig.i18n?.translations as Record<string, unknown> | undefined)?.en as
      | { error?: { notAllowedToAccessPage?: string; notAllowedToPerformAction?: string } }
      | undefined

    expect(enTranslations?.error?.notAllowedToAccessPage).toContain('admin@nabilab.org')
    expect(enTranslations?.error?.notAllowedToPerformAction).toContain('admin@nabilab.org')
  })
})
