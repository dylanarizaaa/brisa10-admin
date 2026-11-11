import { useNavigate, useParams } from 'react-router'
import { PageHeader } from '@/components/shared/page-header'
import { ProductForm } from '../components/product-form'
import { BackLink, ProductLoader } from '../components/product-page-shell'
import { useProduct, useSaveProduct } from '../hooks/use-products'

export function ProductCreatePage() {
  const navigate = useNavigate()
  const save = useSaveProduct()

  return (
    <div className="flex flex-1 flex-col gap-6">
      <BackLink to="/productos">Productos</BackLink>
      <PageHeader
        title="Nuevo producto"
        description="Después de crearlo podrás agregar sus fotografías. Las existencias se registran desde Inventario."
      />
      <ProductForm
        submitting={save.isPending}
        error={save.error?.message}
        cancelTo="/productos"
        onSubmit={(values) =>
          save.mutate({ values }, { onSuccess: (id) => void navigate(`/productos/${id}`, { replace: true }) })
        }
      />
    </div>
  )
}

export function ProductEditPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const product = useProduct(id)
  const save = useSaveProduct()
  const detailPath = `/productos/${id}`

  return (
    <div className="flex flex-1 flex-col gap-6">
      <BackLink to={detailPath}>Volver al producto</BackLink>
      <ProductLoader query={product}>
        {(data) => (
          <>
            <PageHeader title="Editar producto" description={data.name} />
            <ProductForm
              product={data}
              submitting={save.isPending}
              error={save.error?.message}
              cancelTo={detailPath}
              onSubmit={(values) =>
                save.mutate({ id, values }, { onSuccess: () => void navigate(detailPath) })
              }
            />
          </>
        )}
      </ProductLoader>
    </div>
  )
}
