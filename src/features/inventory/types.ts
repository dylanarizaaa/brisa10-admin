/** Operaciones manuales de inventario disponibles en la interfaz. */
export type MovementMode = 'entrada' | 'salida' | 'ajuste'

export const movementModeLabels: Record<MovementMode, { title: string; action: string; success: string }> = {
  entrada: { title: 'Registrar entrada', action: 'Registrar entrada', success: 'Entrada registrada' },
  salida: { title: 'Registrar salida', action: 'Registrar salida', success: 'Salida registrada' },
  ajuste: { title: 'Ajustar existencias', action: 'Guardar ajuste', success: 'Existencias ajustadas' },
}
