import type { CSSProperties } from 'react'

/**
 * Colores de los gráficos, por función. La aplicación solo tiene tema claro.
 * - series: una sola serie (ventas). Validado contra la superficie clara (contraste ≥ 3:1).
 * - status: reservados para estados; siempre van acompañados de icono y etiqueta.
 */
export const chartVars = {
  '--chart-series': '#2a78d6',
  '--chart-good': '#0ca30c',
  '--chart-warning': '#fab219',
  '--chart-critical': '#d03b3b',
} as CSSProperties
