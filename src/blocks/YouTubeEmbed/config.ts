import type { Block } from 'payload'

export const YouTubeEmbed: Block = {
  slug: 'youtubeEmbed',
  interfaceName: 'YouTubeEmbedBlock',
  fields: [
    {
      name: 'videoId',
      type: 'text',
      required: true,
    },
    {
      name: 'title',
      type: 'text',
    },
  ],
}
