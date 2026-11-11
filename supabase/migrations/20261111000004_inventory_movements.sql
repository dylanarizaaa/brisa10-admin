-- =============================================================================
-- Fase 4 — Movimientos de inventario transaccionales
-- Único camino para cambiar products.stock: cada cambio bloquea la fila del
-- producto, valida que no quede negativo, actualiza las existencias e inserta
-- el movimiento, todo en la misma transacción.
-- Los mensajes de error (SQLSTATE P0001) están en español y se muestran tal cual al usuario.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Función interna: aplica un cambio de existencias y registra el movimiento.
-- No se puede llamar desde el frontend; la usan las funciones públicas
-- (y la usarán las de ventas en la fase 5).
-- -----------------------------------------------------------------------------
create function public.apply_stock_change(
  p_product_id uuid,
  p_type public.movement_type,
  p_delta integer,
  p_reason text,
  p_sale_id uuid default null
)
returns public.inventory_movements
language plpgsql
set search_path = ''
as $$
declare
  v_product_name text;
  v_stock integer;
  v_new_stock integer;
  v_movement public.inventory_movements;
begin
  -- FOR UPDATE: si dos operaciones llegan a la vez sobre el mismo producto, la segunda
  -- espera a que termine la primera y lee las existencias ya actualizadas.
  select name, stock into v_product_name, v_stock
  from public.products
  where id = p_product_id
  for update;

  if not found then
    raise exception 'El producto no existe';
  end if;

  v_new_stock := v_stock + p_delta;

  if v_new_stock < 0 then
    raise exception 'No hay existencias suficientes de "%": hay % y se intentó retirar %',
      v_product_name, v_stock, abs(p_delta);
  end if;

  update public.products set stock = v_new_stock where id = p_product_id;

  insert into public.inventory_movements
    (product_id, type, quantity, stock_before, stock_after, reason, sale_id, created_by)
  values
    (p_product_id, p_type, p_delta, v_stock, v_new_stock, nullif(trim(p_reason), ''), p_sale_id, auth.uid())
  returning * into v_movement;

  return v_movement;
end;
$$;

revoke execute on function public.apply_stock_change(uuid, public.movement_type, integer, text, uuid)
  from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Entrada, salida o devolución de mercancía. Administrador y operador.
-- p_quantity siempre es positivo: la función decide el signo según el tipo.
-- -----------------------------------------------------------------------------
create function public.register_inventory_movement(
  p_product_id uuid,
  p_type public.movement_type,
  p_quantity integer,
  p_reason text default null
)
returns public.inventory_movements
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_active_user() then
    raise exception 'No tienes permiso para registrar movimientos de inventario' using errcode = '42501';
  end if;

  if p_type not in ('entrada', 'salida', 'devolucion') then
    raise exception 'Tipo de movimiento no permitido';
  end if;

  if p_quantity is null or p_quantity <= 0 then
    raise exception 'La cantidad debe ser mayor que cero';
  end if;

  if p_quantity > 1000000 then
    raise exception 'La cantidad es demasiado grande';
  end if;

  if length(coalesce(p_reason, '')) > 300 then
    raise exception 'El motivo no puede superar los 300 caracteres';
  end if;

  if p_type = 'salida' and length(trim(coalesce(p_reason, ''))) = 0 then
    raise exception 'Indica el motivo de la salida';
  end if;

  return public.apply_stock_change(
    p_product_id,
    p_type,
    case when p_type = 'salida' then -p_quantity else p_quantity end,
    p_reason
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- Ajuste manual: fija las existencias al valor realmente contado. Solo administrador.
-- Recibe el valor final (no la diferencia) para que el resultado sea el conteo físico
-- aunque las existencias hayan cambiado mientras se hacía el ajuste.
-- -----------------------------------------------------------------------------
create function public.adjust_inventory(
  p_product_id uuid,
  p_new_stock integer,
  p_reason text
)
returns public.inventory_movements
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_stock integer;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede hacer ajustes de inventario' using errcode = '42501';
  end if;

  if p_new_stock is null or p_new_stock < 0 then
    raise exception 'Las existencias no pueden ser negativas';
  end if;

  if p_new_stock > 1000000 then
    raise exception 'La cantidad es demasiado grande';
  end if;

  if length(trim(coalesce(p_reason, ''))) = 0 then
    raise exception 'Indica el motivo del ajuste';
  end if;

  if length(p_reason) > 300 then
    raise exception 'El motivo no puede superar los 300 caracteres';
  end if;

  -- Se bloquea aquí para calcular la diferencia sobre un valor que ya nadie más puede cambiar.
  select stock into v_stock from public.products where id = p_product_id for update;

  if not found then
    raise exception 'El producto no existe';
  end if;

  if p_new_stock = v_stock then
    raise exception 'Las existencias ya son %: no hay nada que ajustar', v_stock;
  end if;

  return public.apply_stock_change(p_product_id, 'ajuste', p_new_stock - v_stock, p_reason);
end;
$$;

revoke execute on function public.register_inventory_movement(uuid, public.movement_type, integer, text) from public, anon;
revoke execute on function public.adjust_inventory(uuid, integer, text) from public, anon;
grant execute on function public.register_inventory_movement(uuid, public.movement_type, integer, text) to authenticated;
grant execute on function public.adjust_inventory(uuid, integer, text) to authenticated;
