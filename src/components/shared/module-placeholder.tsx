import { Construction } from 'lucide-react'

interface ModulePlaceholderProps {
  title: string
  phase: number
}

/** Estado vacío temporal para los módulos que aún no se han implementado. */
export function ModulePlaceholder({ title, phase }: ModulePlaceholderProps) {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-10 text-center">
        <Construction className="size-8 text-muted-foreground" />
        <p className="font-medium">Módulo en construcción</p>
        <p className="text-sm text-muted-foreground">
          Se implementará en la fase {phase} del plan de trabajo.
        </p>
      </div>
    </div>
  )
}
