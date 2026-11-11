import { useCallback, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router'

const PAGE_PARAM = 'pagina'
const PENDING_TIMEOUT_MS = 1000

/**
 * Parámetros de la URL como estado de filtros: sobreviven a recargar y al botón atrás.
 *
 * `setParam` cambia un parámetro (null, '' o 'all' lo quitan) y vuelve a la primera página,
 * salvo que el parámetro cambiado sea la propia página.
 */
export function useUrlParams<Key extends string>() {
  const [params, setParams] = useSearchParams()

  // Último valor conocido, actualizado en el mismo instante en que se pide un cambio.
  // La navegación no es inmediata: sin esto, dos cambios seguidos partirían de la misma
  // URL y el segundo borraría al primero.
  const latest = useRef(params)
  // Cambio propio que todavía no ha llegado a la URL.
  const pending = useRef<{ search: string; at: number } | null>(null)

  useEffect(() => {
    const own = pending.current
    // Mientras nuestro último cambio está en camino, la URL puede pasar por valores
    // intermedios (cambios anteriores que aún se están aplicando): no se toman como base.
    // El límite de tiempo evita quedarse esperando un cambio que otra navegación reemplazó.
    if (own && params.toString() !== own.search && Date.now() - own.at < PENDING_TIMEOUT_MS) return
    pending.current = null
    latest.current = params
  }, [params])

  const setParam = useCallback(
    (key: Key | typeof PAGE_PARAM, value: string | null) => {
      const next = new URLSearchParams(latest.current)
      if (value === null || value === '' || value === 'all') next.delete(key)
      else next.set(key, value)
      if (key !== PAGE_PARAM) next.delete(PAGE_PARAM)
      latest.current = next
      pending.current = { search: next.toString(), at: Date.now() }
      setParams(next, { replace: true })
    },
    [setParams],
  )

  const page = Math.max(1, Number.parseInt(params.get(PAGE_PARAM) ?? '1', 10) || 1)

  return { params, page, setParam }
}

/** Devuelve `value` si está entre los permitidos; si no, `fallback`. */
export function oneOf<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback
}
