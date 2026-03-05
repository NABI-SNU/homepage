import type { TextFieldSingleValidation } from 'payload'
import {
  AlignFeature,
  BlockquoteFeature,
  BoldFeature,
  ChecklistFeature,
  defaultColors,
  IndentFeature,
  InlineCodeFeature,
  ItalicFeature,
  LinkFeature,
  OrderedListFeature,
  ParagraphFeature,
  RelationshipFeature,
  StrikethroughFeature,
  SubscriptFeature,
  SuperscriptFeature,
  TextStateFeature,
  UnorderedListFeature,
  UploadFeature,
  lexicalEditor,
  UnderlineFeature,
  type LinkFields,
} from '@payloadcms/richtext-lexical'

export const defaultLexical = lexicalEditor({
  features: [
    ParagraphFeature(),
    UnorderedListFeature(),
    OrderedListFeature(),
    ChecklistFeature(),
    AlignFeature(),
    IndentFeature(),
    BlockquoteFeature(),
    UploadFeature({
      enabledCollections: ['media'],
    }),
    RelationshipFeature({
      enabledCollections: ['activities', 'news', 'people', 'posts', 'research', 'wiki'],
      maxDepth: 1,
    }),
    TextStateFeature({
      state: {
        color: {
          ...defaultColors.text,
        },
        background: {
          ...defaultColors.background,
        },
      },
    }),
    UnderlineFeature(),
    BoldFeature(),
    ItalicFeature(),
    StrikethroughFeature(),
    InlineCodeFeature(),
    SubscriptFeature(),
    SuperscriptFeature(),
    LinkFeature({
      enabledCollections: ['activities', 'news', 'people', 'posts', 'research', 'wiki'],
      fields: ({ defaultFields }) => {
        const defaultFieldsWithoutUrl = defaultFields.filter((field) => {
          if ('name' in field && field.name === 'url') return false
          return true
        })

        return [
          ...defaultFieldsWithoutUrl,
          {
            name: 'url',
            type: 'text',
            admin: {
              condition: (_data, siblingData) => siblingData?.linkType !== 'internal',
            },
            label: ({ t }) => t('fields:enterURL'),
            required: true,
            validate: ((value, options) => {
              if ((options?.siblingData as LinkFields)?.linkType === 'internal') {
                return true // no validation needed, as no url should exist for internal links
              }
              return value ? true : 'URL is required'
            }) as TextFieldSingleValidation,
          },
        ]
      },
    }),
  ],
})
