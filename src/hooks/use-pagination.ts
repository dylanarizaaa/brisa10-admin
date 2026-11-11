import { useState } from 'react'

export interface Pagination<T> {
  page: number
  pageCount: number
  pageItems: T[]
  total: number
  from: number
  to: number
  setPage: (page: number) => void
}

/** Paginación en memoria para listas que ya están cargadas por completo. */
export function usePagination<T>(items: T[], pageSize = 10): Pagination<T> {
  const [requestedPage, setPage] = useState(1)
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))
  // Si la lista se acorta (filtros, borrados), la página se ajusta sola.
  const page = Math.min(requestedPage, pageCount)
  const start = (page - 1) * pageSize
  const pageItems = items.slice(start, start + pageSize)

  return {
    page,
    pageCount,
    pageItems,
    total: items.length,
    from: items.length === 0 ? 0 : start + 1,
    to: start + pageItems.length,
    setPage,
  }
}
