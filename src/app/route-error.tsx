import { TriangleAlert } from 'lucide-react'
import { FullScreenMessage } from '@/components/shared/full-screen-message'
import { Button } from '@/components/ui/button'

/** Pantalla para errores inesperados al mostrar una página (en lugar de una pantalla en blanco). */
export function RouteError() {
  return (
    <FullScreenMessage
      icon={TriangleAlert}
      title="Ocurrió un error inesperado"
      description="No se pudo mostrar esta página. Vuelve a cargarla; si el problema continúa, contacta al administrador."
    >
      <Button onClick={() => window.location.reload()}>Recargar</Button>
      <Button variant="outline" onClick={() => window.location.assign('/')}>
        Ir al inicio
      </Button>
    </FullScreenMessage>
  )
}
