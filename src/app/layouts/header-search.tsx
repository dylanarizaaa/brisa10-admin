import { Search } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { Input } from '@/components/ui/input'

/** Búsqueda global del header: lleva a la lista de productos filtrada. */
export function HeaderSearch() {
  const navigate = useNavigate()
  const [text, setText] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const term = text.trim()
    if (!term) return
    void navigate(`/productos?q=${encodeURIComponent(term)}`)
    setText('')
  }

  return (
    <form role="search" onSubmit={handleSubmit} className="relative w-full max-w-xs">
      <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Buscar productos…"
        aria-label="Buscar productos"
        className="pl-8"
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
    </form>
  )
}
