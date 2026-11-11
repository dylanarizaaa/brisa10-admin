import { ImageOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getImageUrl } from '../services/product-image-service'

interface ProductThumbnailProps {
  storagePath: string | null
  alt: string
  className?: string
}

/** Miniatura cuadrada de un producto, con un marcador cuando no tiene foto. */
export function ProductThumbnail({ storagePath, alt, className }: ProductThumbnailProps) {
  return (
    <div
      className={cn(
        'flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted',
        className,
      )}
    >
      {storagePath ? (
        <img src={getImageUrl(storagePath)} alt={alt} loading="lazy" className="size-full object-cover" />
      ) : (
        <ImageOff className="size-4 text-muted-foreground" aria-label="Sin fotografía" />
      )}
    </div>
  )
}
