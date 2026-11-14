-- =============================================================================
-- Brisa10 Admin — Limpieza de datos de prueba antes de empezar a operar
--
-- ⚠️  DESTRUCTIVO E IRREVERSIBLE. Borra, sin papelera:
--      · ventas y sus productos vendidos
--      · historial de movimientos de inventario
--      · productos, costos y registros de fotografías
--     y reinicia la numeración de ventas (la próxima será la N.º 1).
--
--   NO borra: usuarios (Authentication), perfiles y roles, datos del negocio
--   y umbral de bajo inventario (Configuración), ni la estructura de la base
--   de datos (tablas, funciones, políticas, bucket de Storage).
--
--   Las FOTOS ya subidas no se borran desde aquí: quedan en Storage sin ningún
--   producto que las use. Bórralas aparte (ver README, "Empezar de cero").
--
-- Cómo usarlo (Supabase → SQL Editor → New query):
--   1. Haz un respaldo si hay algo que quieras conservar (README → "Empezar de cero").
--   2. Ajusta las dos opciones marcadas con ← (solo están en este bloque).
--   3. Cambia  v_confirmacion  de 'NO' a 'BORRAR'.
--   4. Pulsa Run. Si algo sale mal, no se borra nada (el borrado es atómico).
--
-- Si dejas 'NO', el script se detiene sin tocar nada.
-- =============================================================================

-- Todo el borrado ocurre dentro de este único bloque, que es atómico: si falla, no se borra nada.
do $$
declare
  -- ── OPCIONES ───────────────────────────────────────────────────────────────
  -- Escribe BORRAR (en mayúsculas) para confirmar que quieres borrar los datos.
  v_confirmacion         text    := 'NO';    -- ←

  -- true  = borra TODAS las categorías (también las que creaste) y vuelve a
  --         crear las seis iniciales: Cerámicas, Peluches, Decoración, Regalos,
  --         Accesorios y Otros.
  -- false = conserva las categorías tal como están.
  v_reiniciar_categorias boolean := false;   -- ←
  -- ───────────────────────────────────────────────────────────────────────────

  v_admins integer;
begin
  if v_confirmacion is distinct from 'BORRAR' then
    raise exception 'Cancelado: no se borró nada. Para continuar, cambia v_confirmacion de ''NO'' a ''BORRAR''.';
  end if;

  -- Protección: el sistema no puede quedarse sin ningún administrador activo.
  select count(*) into v_admins from public.profiles where role = 'admin' and is_active;
  if v_admins = 0 then
    raise exception 'Cancelado: no hay ningún administrador activo en profiles. Revisa los usuarios antes de limpiar.';
  end if;

  -- Resumen de lo que se va a borrar (aparece en la pestaña "Notices"/"Messages" del resultado).
  raise notice 'Se borrarán: % ventas, % productos vendidos, % movimientos de inventario, % productos, % fotografías (registros), % costos.',
    (select count(*) from public.sales),
    (select count(*) from public.sale_items),
    (select count(*) from public.inventory_movements),
    (select count(*) from public.products),
    (select count(*) from public.product_images),
    (select count(*) from public.product_costs);

  -- Una sola sentencia con todas las tablas relacionadas.
  --   · RESTART IDENTITY reinicia el consecutivo de ventas.
  --   · TRUNCATE no activa el bloqueo que impide modificar los movimientos de inventario;
  --     ese bloqueo evita ediciones accidentales, no una limpieza total deliberada.
  truncate table
    public.sale_items,
    public.inventory_movements,
    public.sales,
    public.product_images,
    public.product_costs,
    public.products
  restart identity;

  if v_reiniciar_categorias then
    delete from public.categories;
    insert into public.categories (name) values
      ('Cerámicas'), ('Peluches'), ('Decoración'), ('Regalos'), ('Accesorios'), ('Otros');
    raise notice 'Categorías reiniciadas a las seis iniciales.';
  else
    raise notice 'Categorías conservadas.';
  end if;
end
$$;

-- Verificación: ventas, productos y movimientos deben quedar en 0.
select
  (select count(*) from public.sales)               as ventas,
  (select count(*) from public.sale_items)          as productos_vendidos,
  (select count(*) from public.inventory_movements) as movimientos,
  (select count(*) from public.products)            as productos,
  (select count(*) from public.product_images)      as fotos_registradas,
  (select count(*) from public.categories)          as categorias,
  (select count(*) from public.profiles)            as usuarios_conservados;
