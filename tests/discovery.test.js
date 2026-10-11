import test from 'node:test';
import assert from 'node:assert/strict';
import {recommendTracks,latestFromFollowed} from '../src/discovery.js';
const daysAgo=n=>new Date(Date.now()-n*86400000).toISOString();
const tracks=[
  {id:'a',artist_id:'x',genre:'Rap',status:'approved',created_at:daysAgo(1)},
  {id:'b',artist_id:'y',genre:'Pop',status:'approved',created_at:daysAgo(2)},
  {id:'c',artist_id:'x',genre:'Rap',status:'approved',created_at:daysAgo(3)},
  {id:'d',artist_id:'x',genre:'Rap',status:'approved',created_at:daysAgo(4)},
  {id:'z',artist_id:'z',genre:'Rap',status:'pending',created_at:daysAgo(0)}
];
test('excluye canciones pendientes',()=>{
  assert.ok(!recommendTracks({tracks}).some(t=>t.id==='z'));
});
test('favorece música compatible con géneros escuchados',()=>{
  const list=recommendTracks({tracks,likes:[{track_id:'c'}]});
  assert.equal(list[0].genre,'Rap');
});
test('un artista seguido gana prioridad',()=>{
  const list=recommendTracks({tracks,follows:[{artist_id:'y'}]});
  assert.equal(list[0].artist_id,'y');
});
test('máximo dos canciones por artista antes de completar otros',()=>{
  const list=recommendTracks({tracks});
  assert.ok(list.findIndex(t=>t.id==='b') < list.findIndex(t=>t.id==='d'));
});
test('novedades seguidas son aprobadas y recientes',()=>{
  assert.deepEqual(latestFromFollowed({tracks,follows:[{artist_id:'x'}],limit:2}).map(t=>t.id),['a','c']);
});
