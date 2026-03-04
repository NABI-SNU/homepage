import type { PayloadRequest } from 'payload'

import { getAccessCache } from './requestAccessCache'

const LINKED_PEOPLE_TTL_MS = 60_000
const linkedPeopleCache = new Map<string, { expiresAt: number; personIDs: number[] }>()
const inFlightLinkedPeopleLookups = new Map<string, Promise<number[]>>()

const readCachedLinkedPeople = (userID: string | number): number[] | null => {
  const entry = linkedPeopleCache.get(String(userID))
  if (!entry) return null

  if (entry.expiresAt <= Date.now()) {
    linkedPeopleCache.delete(String(userID))
    return null
  }

  return entry.personIDs
}

const cacheLinkedPeople = (userID: string | number, personIDs: number[]): void => {
  linkedPeopleCache.set(String(userID), {
    expiresAt: Date.now() + LINKED_PEOPLE_TTL_MS,
    personIDs,
  })
}

export const getLinkedPersonIDs = async (req: PayloadRequest): Promise<number[]> => {
  const cache = getAccessCache(req)
  if (cache.linkedPersonIDs) return cache.linkedPersonIDs

  const userID = req.user?.id
  if (!userID) {
    cache.linkedPersonIDs = []
    return cache.linkedPersonIDs
  }

  const cachedPersonIDs = readCachedLinkedPeople(userID)
  if (cachedPersonIDs) {
    cache.linkedPersonIDs = cachedPersonIDs
    return cache.linkedPersonIDs
  }

  const inFlight = inFlightLinkedPeopleLookups.get(String(userID))
  if (inFlight) {
    cache.linkedPersonIDs = await inFlight
    return cache.linkedPersonIDs
  }

  const lookupPromise = (async () => {
    const linkedPeople = await req.payload.find({
      collection: 'people',
      depth: 0,
      limit: 5,
      overrideAccess: true,
      pagination: false,
      where: {
        user: {
          equals: userID,
        },
      },
    })

    const personIDs = linkedPeople.docs.map((person) => person.id)
    cacheLinkedPeople(userID, personIDs)
    return personIDs
  })()

  inFlightLinkedPeopleLookups.set(String(userID), lookupPromise)

  try {
    cache.linkedPersonIDs = await lookupPromise
    return cache.linkedPersonIDs
  } finally {
    inFlightLinkedPeopleLookups.delete(String(userID))
  }
}
