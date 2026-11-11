import { ImagePlus, Loader2, Star, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  useDeleteProductImage,
  useReorderProductImages,
  useUploadProductImages,
} from '../hooks/use-products'
import { getImageUrl, IMAGE_TYPES, validateImageFile } from '../services/product-image-service'
import type { ProductImage } from '../types'

const MAX_IMAGES = 8

interface ProductImagesProps {
  productId: string
  productName: string
  images: ProductImage[]
  canEdit: boolean
}

export function ProductImages({ productId, productName, images, canEdit }: ProductImagesProps) {
  const fileInput = useRef<HTMLInputElement>(null)
  const upload = useUploadProductImages(productId)
  const remove = useDeleteProductImage()
  const reorder = useReorderProductImages()
  const [toDelete, setToDelete] = useState<ProductImage | null>(null)

  const busy = upload.isPending || remove.isPending || reorder.isPending
  const remaining = MAX_IMAGES - images.length

  function handleFiles(fileList: FileList | null) {
    const files = Array.from(fileList ?? [])
    if (fileInput.current) fileInput.current.value = ''
    if (files.length === 0) return

    const valid = files.filter((file) => {
      const problem = validateImageFile(file)
      if (problem) toast.error(problem)
      return !problem
    })
    if (valid.length > remaining) {
      toast.error(`Cada producto admite hasta ${MAX_IMAGES} fotografías. Solo se subirán las primeras ${remaining}.`)
    }
    const accepted = valid.slice(0, remaining)
    if (accepted.length === 0) return

    const lastPosition = images.reduce((max, image) => Math.max(max, image.position), -1)
    upload.mutate({ files: accepted, startPosition: lastPosition + 1 })
  }

  function makeMain(image: ProductImage) {
    reorder.mutate([image.id, ...images.filter((other) => other.id !== image.id).map((other) => other.id)])
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-medium">Fotografías</h2>
          {canEdit && (
            <p className="text-sm text-muted-foreground">
              JPG, PNG o WebP de hasta 5 MB. Máximo {MAX_IMAGES} por producto.
            </p>
          )}
        </div>
        {canEdit && (
          <>
            <input
              ref={fileInput}
              type="file"
              multiple
              hidden
              accept={Object.keys(IMAGE_TYPES).join(',')}
              aria-label="Seleccionar fotografías"
              onChange={(event) => handleFiles(event.target.files)}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={busy || remaining <= 0}
              onClick={() => fileInput.current?.click()}
            >
              {upload.isPending ? <Loader2 className="animate-spin" /> : <ImagePlus />}
              {upload.isPending ? 'Subiendo…' : 'Agregar fotos'}
            </Button>
          </>
        )}
      </div>

      {images.length === 0 ? (
        <div className="rounded-lg border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
          Este producto todavía no tiene fotografías.
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((image, index) => (
            <li key={image.id} className="group relative overflow-hidden rounded-lg border bg-muted">
              <img
                src={getImageUrl(image.storage_path)}
                alt={`${productName} — fotografía ${index + 1}`}
                loading="lazy"
                className="aspect-square w-full object-cover"
              />
              {index === 0 && (
                <Badge className="absolute top-2 left-2" variant="secondary">
                  Principal
                </Badge>
              )}
              {canEdit && (
                <div className="absolute right-2 bottom-2 flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                  {index > 0 && (
                    <Button
                      variant="secondary"
                      size="icon-sm"
                      disabled={busy}
                      aria-label={`Usar la fotografía ${index + 1} como principal`}
                      title="Usar como principal"
                      onClick={() => makeMain(image)}
                    >
                      <Star />
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="icon-sm"
                    disabled={busy}
                    aria-label={`Eliminar la fotografía ${index + 1}`}
                    title="Eliminar"
                    onClick={() => setToDelete(image)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="¿Eliminar fotografía?"
        description="La fotografía se borrará de forma permanente."
        confirmLabel="Eliminar"
        destructive
        loading={remove.isPending}
        onConfirm={() => toDelete && remove.mutate(toDelete, { onSettled: () => setToDelete(null) })}
      />
    </section>
  )
}
