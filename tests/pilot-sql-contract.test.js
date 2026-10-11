import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync(new URL('../sql/012_panel_piloto.sql',import.meta.url),'utf8').toLowerCase();
test('la función RPC valida rol administrador en el servidor y revoca permiso anónimo',()=>{
  assert.ok(sql.includes('not (select public.is_admin())'));
  assert.ok(sql.includes('revoke all on function public.get_ovio_pilot_overview() from public, anon'));
  assert.ok(sql.includes('grant execute on function public.get_ovio_pilot_overview() to authenticated'));
});
test('la escucha medida exige consentimiento y agrega eventos',()=>{
  assert.ok(sql.includes('ls.analytics_enabled=true'));
  assert.ok(sql.includes('count(distinct ps.user_id)'));
  assert.ok(sql.includes('sum(ps.played_seconds)'));
});
