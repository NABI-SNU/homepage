import type { Field } from 'payload'

export const referenceFields: Field[] = [
  {
    name: 'title',
    type: 'text',
    required: true,
  },
  {
    name: 'authors',
    type: 'array',
    fields: [
      {
        name: 'name',
        type: 'text',
        required: true,
      },
    ],
  },
  {
    name: 'journal',
    type: 'text',
  },
  {
    name: 'year',
    type: 'number',
  },
  {
    name: 'doi',
    type: 'text',
  },
  {
    name: 'url',
    type: 'text',
  },
]
