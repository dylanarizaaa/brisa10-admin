import { MoreHorizontal, Pencil, Power, PowerOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Category } from '../types'

interface CategoriesTableProps {
  categories: Category[]
  /** Sin permisos de edición no se muestra la columna de acciones. */
  canEdit: boolean
  onEdit: (category: Category) => void
  onToggleActive: (category: Category) => void
}

export function CategoriesTable({ categories, canEdit, onEdit, onToggleActive }: CategoriesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead className="hidden md:table-cell">Descripción</TableHead>
          <TableHead className="text-right">Productos</TableHead>
          <TableHead>Estado</TableHead>
          {canEdit && <TableHead className="w-12" />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {categories.map((category) => (
          <TableRow key={category.id}>
            <TableCell className="font-medium">{category.name}</TableCell>
            <TableCell className="hidden max-w-xs truncate text-muted-foreground md:table-cell">
              {category.description ?? '—'}
            </TableCell>
            <TableCell className="text-right tabular-nums">{category.product_count}</TableCell>
            <TableCell>
              <Badge variant={category.is_active ? 'secondary' : 'outline'}>
                {category.is_active ? 'Activa' : 'Inactiva'}
              </Badge>
            </TableCell>
            {canEdit && (
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" aria-label={`Acciones de ${category.name}`}>
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => onEdit(category)}>
                      <Pencil />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onToggleActive(category)}>
                      {category.is_active ? <PowerOff /> : <Power />}
                      {category.is_active ? 'Desactivar' : 'Activar'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
