import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface SearchInputProps {
  /** Valor aplicado (p. ej. el de la URL). */
  value: string
  /** Se llama cuando el usuario deja de escribir. */
  onChange: (value: string) => void
  placeholder: string
  className?: string
  delay?: number
}

/** Campo de búsqueda que espera a que el usuario termine de escribir antes de avisar. */
export function SearchInput({ value, onChange, placeholder, className, delay = 300 }: SearchInputProps) {
  const [text, setText] = useState(value)
  // Si el valor aplicado cambia desde fuera (otra búsqueda, botón atrás), el campo lo refleja.
  const [lastValue, setLastValue] = useState(value)
  if (value !== lastValue) {
    setLastValue(value)
    setText(value)
  }

  useEffect(() => {
    if (text === value) return
    const timer = setTimeout(() => onChange(text), delay)
    return () => clearTimeout(timer)
  }, [text, value, onChange, delay])

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder={placeholder}
        aria-label={placeholder}
        className="pl-8"
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
    </div>
  )
}
