import type {
  CollectionBeforeChangeHook,
  CollectionBeforeDeleteHook,
  PayloadRequest,
} from 'payload'
import { APIError } from 'payload'

const MIN_SYMPOSIUM_COUNT = 1

const countSymposiumDocs = async ({ req }: { req: PayloadRequest }) => {
  const symposiumDocs = await req.payload.find({
    collection: 'activities',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    req,
    where: {
      activityType: {
        equals: 'symposium',
      },
    },
  })

  return symposiumDocs.totalDocs
}

export const ensureSymposiumExistsBeforeChange: CollectionBeforeChangeHook = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (operation !== 'update' || !originalDoc || originalDoc.activityType !== 'symposium') {
    return data
  }

  const nextActivityType = data.activityType ?? originalDoc.activityType

  if (nextActivityType === 'symposium') {
    return data
  }

  const symposiumCount = await countSymposiumDocs({ req })

  if (symposiumCount <= MIN_SYMPOSIUM_COUNT) {
    throw new APIError('At least one symposium entry must always exist.', 400)
  }

  return data
}

export const ensureSymposiumExistsBeforeDelete: CollectionBeforeDeleteHook = async ({
  id,
  req,
}) => {
  const doc = await req.payload.findByID({
    collection: 'activities',
    id,
    depth: 0,
    overrideAccess: true,
    req,
  })

  if (doc.activityType !== 'symposium') {
    return
  }

  const symposiumCount = await countSymposiumDocs({ req })

  if (symposiumCount <= MIN_SYMPOSIUM_COUNT) {
    throw new APIError('Cannot delete the last symposium entry.', 400)
  }
}
