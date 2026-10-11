import { cn } from 'cn'
import { ImageIcon } from 'lucide-react'
import { useState } from 'react'

import { getVTSImageUrl, VTSCustomImage } from '../../../shared/config'

type ImageThumbnailProps = {
  image: VTSCustomImage
  className?: string
}

const ImageThumbnail = ({ image, className }: ImageThumbnailProps) => {
  const [hasFailed, setHasFailed] = useState(false)

  return (
    <span
      className={cn(
        'bg-muted flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md',
        className
      )}
    >
      {hasFailed ? (
        <ImageIcon className="text-muted-foreground size-4" />
      ) : (
        <img
          src={getVTSImageUrl(image)}
          alt=""
          className="size-full object-contain"
          onError={() => setHasFailed(true)}
        />
      )}
    </span>
  )
}

export default ImageThumbnail
