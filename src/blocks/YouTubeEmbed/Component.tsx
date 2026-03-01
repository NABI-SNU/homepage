import React from 'react'

export type YouTubeEmbedBlockProps = {
  blockType: 'youtubeEmbed'
  videoId: string
  title?: string
}

type Props = YouTubeEmbedBlockProps & {
  className?: string
}

export const YouTubeEmbedBlock: React.FC<Props> = ({ className, title, videoId }) => {
  if (!videoId) return null

  const embedUrl = `https://www.youtube.com/embed/${videoId}`

  return (
    <div className={[className, 'not-prose'].filter(Boolean).join(' ')}>
      <div className="aspect-video overflow-hidden rounded-xl border border-border bg-black/90">
        <iframe
          src={embedUrl}
          title={title || 'YouTube video'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="h-full w-full"
          loading="lazy"
        />
      </div>
    </div>
  )
}
