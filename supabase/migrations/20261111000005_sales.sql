-- =============================================================================
-- Fase 5 — Ventas físicas
-- create_sale y cancel_sale ejecutan todo en una sola transacción: si algo falla
-- (producto inactivo, existencias insuficientes), no queda nada a medias.
-- Los precios se toman de la base de datos, nunca de lo que envía el cliente.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Registrar una venta. Administrador y operador.
-- p_items: [{"product_id": "<uuid>", "quantity": <entero positivo>}, ...]
-- -----------------------------------------------------------------------------
create function public.create_sale(
  p_items jsonb,
  p_payment_method public.payment_method,
  p_notes text default null
)
returns public.sales
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sale public.sales;
  v_item record;
  v_total bigint := 0;
begin
  if not public.is_active_user() then
    raise exception 'No tienes permiso para registrar ventas' using errcode = '42501';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'La venta no tiene productos';
  end if;

  if jsonb_array_length(p_items) > 200 then
    raise exception 'La venta tiene demasiados productos';
  end if;

  if p_payment_method is null then
    raise exception 'Selecciona el método de pago';
  end if;

  if length(coalesce(p_notes, '')) > 300 then
    raise exception 'Las notas no pueden superar los 300 caracteres';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_items) as i(product_id uuid, quantity integer)
    group by i.product_id
    having count(*) > 1
  ) then
    raise exception 'Hay un producto repetido en la venta';
  end if;

  -- Se bloquean todos los productos de la venta, siempre en el mismo orden,
  -- para que dos ventas simultáneas no se bloqueen entre sí.
  perform 1
  from public.products
  where id in (select i.product_id from jsonb_to_recordset(p_items) as i(product_id uuid))
  order by id
  for update;

  insert into public.sales (payment_method, total, notes, created_by)
  values (p_payment_method, 0, nullif(trim(p_notes), ''), auth.uid())
  returning * into v_sale;

  for v_item in
    select i.product_id, i.quantity, p.id as found_id, p.name, p.price, p.is_active
    from jsonb_to_recordset(p_items) as i(product_id uuid, quantity integer)
    left join public.products p on p.id = i.product_id
    order by i.product_id
  loop
    if v_item.found_id is null then
      raise exception 'Uno de los productos de la venta ya no existe';
    end if;

    if not v_item.is_active then
      raise exception 'El producto "%" está inactivo y no se puede vender', v_item.name;
    end if;

    if v_item.quantity is null or v_item.quantity <= 0 then
      raise exception 'La cantidad de "%" debe ser mayor que cero', v_item.name;
    end if;

    if v_item.quantity > 1000000 then
      raise exception 'La cantidad de "%" es demasiado grande', v_item.name;
    end if;

    v_total := v_total + v_item.price::bigint * v_item.quantity;
    if v_total > 2000000000 then
      raise exception 'El total de la venta es demasiado grande';
    end if;

    insert into public.sale_items (sale_id, product_id, product_name, unit_price, quantity, subtotal)
    values (v_sale.id, v_item.product_id, v_item.name, v_item.price, v_item.quantity, v_item.price * v_item.quantity);

    -- Descuenta existencias y registra el movimiento; falla si no alcanza.
    perform public.apply_stock_change(v_item.product_id, 'venta', -v_item.quantity, null, v_sale.id);
  end loop;

  update public.sales set total = v_total where id = v_sale.id returning * into v_sale;

  return v_sale;
end;
$$;

-- -----------------------------------------------------------------------------
-- Anular una venta: devuelve las existencias y deja el registro. Solo administrador.
-- -----------------------------------------------------------------------------
create function public.cancel_sale(
  p_sale_id uuid,
  p_reason text
)
returns public.sales
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sale public.sales;
  v_item record;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede anular ventas' using errcode = '42501';
  end if;

  if length(trim(coalesce(p_reason, ''))) = 0 then
    raise exception 'Indica el motivo de la anulación';
  end if;

  if length(p_reason) > 300 then
    raise exception 'El motivo no puede superar los 300 caracteres';
  end if;

  -- Bloquea la venta: dos anulaciones simultáneas no pueden devolver las existencias dos veces.
  select * into v_sale from public.sales where id = p_sale_id for update;

  if not found then
    raise exception 'La venta no existe';
  end if;

  if v_sale.status = 'anulada' then
    raise exception 'La venta N.º % ya está anulada', v_sale.sale_number;
  end if;

  for v_item in
    select product_id, quantity from public.sale_items where sale_id = p_sale_id order by product_id
  loop
    perform public.apply_stock_change(
      v_item.product_id,
      'cancelacion',
      v_item.quantity,
      'Anulación de venta N.º ' || v_sale.sale_number || ': ' || trim(p_reason),
      p_sale_id
    );
  end loop;

  update public.sales
  set status = 'anulada', cancelled_at = now(), cancelled_by = auth.uid(), cancel_reason = trim(p_reason)
  where id = p_sale_id
  returning * into v_sale;

  return v_sale;
end;
$$;

revoke execute on function public.create_sale(jsonb, public.payment_method, text) from public, anon;
revoke execute on function public.cancel_sale(uuid, text) from public, anon;
grant execute on function public.create_sale(jsonb, public.payment_method, text) to authenticated;
grant execute on function public.cancel_sale(uuid, text) to authenticated;

-- -----------------------------------------------------------------------------
-- Productos más vendidos en los últimos p_days días (ventas completadas).
-- SECURITY INVOKER: respeta RLS.
-- -----------------------------------------------------------------------------
create function public.get_top_products(p_days integer default 30, p_limit integer default 5)
returns table (product_id uuid, product_name text, units bigint, revenue bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select si.product_id, p.name, sum(si.quantity)::bigint, sum(si.subtotal)::bigint
  from public.sale_items si
  join public.sales s on s.id = si.sale_id
  join public.products p on p.id = si.product_id
  where s.status = 'completada'
    and s.created_at >= now() - make_interval(days => least(greatest(p_days, 1), 366))
  group by si.product_id, p.name
  order by sum(si.quantity) desc, sum(si.subtotal) desc, p.name
  limit least(greatest(p_limit, 1), 50);
$$;

revoke execute on function public.get_top_products(integer, integer) from public, anon;
grant execute on function public.get_top_products(integer, integer) to authenticated;
