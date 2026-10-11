-- Comprobar SIN modificar datos que la función está instalada y no accesible a anon.
select
  to_regprocedure('public.get_ovio_pilot_overview()') is not null as existe_funcion,
  has_function_privilege('authenticated','public.get_ovio_pilot_overview()','EXECUTE') as autenticados_pueden_invocar,
  not has_function_privilege('anon','public.get_ovio_pilot_overview()','EXECUTE') as anon_sin_permiso;
-- ATENCIÓN: el permiso EXECUTE para authenticated no significa permiso de lectura.
-- Dentro de la función se comprueba is_admin(); debes probar con una cuenta no admin.
