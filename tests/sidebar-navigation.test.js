import test from 'node:test';
import assert from 'node:assert/strict';
import {EXPLORE_ITEMS,getNavigationGroups,groupForPage} from '../src/sidebar-navigation.js';

test('Explorar contiene Inicio y Buscar, sin duplicar rutas',()=>{
  const groups=getNavigationGroups();
  assert.equal(groups[0].id,'explore');
  assert.deepEqual(EXPLORE_ITEMS.slice(0,2).map(item=>item.id),['home','search']);
  const ids=groups.flatMap(group=>group.items.map(item=>item.id));
  assert.equal(new Set(ids).size,ids.length);
});
test('Usuarios normales no reciben enlaces administrativos ni letras privadas',()=>{
  const groups=getNavigationGroups();
  assert.deepEqual(groups.map(g=>g.id),['explore','creators']);
  assert.equal(groupForPage('admin'),null);
  assert.equal(groupForPage('lyric-drafts'),null);
  assert.equal(groupForPage('studio'),'creators');
});
test('Artistas aprobados tienen acceso a Mis letras y Estadísticas desde Creadores',()=>{
  const creators=getNavigationGroups({approvedArtist:true})[1];
  assert.ok(creators.items.some(item=>item.id==='lyric-drafts'));
  assert.ok(creators.items.some(item=>item.id==='insights'));
  assert.equal(groupForPage('lyric-drafts',{approvedArtist:true}),'creators');
});
test('El grupo de Moderación solo se muestra a administradores',()=>{
  const groups=getNavigationGroups({isAdmin:true});
  assert.deepEqual(groups.map(g=>g.id),['explore','creators','moderation']);
  assert.deepEqual(groups[2].items.map(item=>item.id),['admin','feedback-admin','pilot-admin']);
  assert.equal(groupForPage('pilot-admin',{isAdmin:true}),'moderation');
});
