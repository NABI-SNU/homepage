import type { Payload } from 'payload'

type RevalidateContext = {
  disableRevalidate?: boolean
}

export const isRevalidateDisabled = (context: RevalidateContext | undefined): boolean =>
  Boolean(context?.disableRevalidate)

export const safeRevalidate = (
  payload: Payload,
  label: string,
  callback: () => void,
): void => {
  try {
    callback()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown revalidation error'
    payload.logger.warn(`Skipping ${label} revalidation: ${message}`)
  }
}
