import test from 'node:test';
import assert from 'node:assert/strict';
import {buildExploreCollections} from '../src/explore-collections.js';
const tracks = [
  {id:'a',artist_id:'art1',genre:'Rap',audio_path:'a.mp3',status:'approved',created_at:'2026-10-09T10:00:00Z'},
  {id:'b',artist_id:'art1',genre:'Rap',audio_path:'b.mp3',status:'approved',created_at:'2026-10-08T10:00:00Z'},
  {id:'c',artist_id:'art2',genre:'Pop',audio_path:'c.mp3',status:'approved',created_at:'2026-10-07T10:00:00Z'},
  {id:'x',artist_id:'art3',genre:'Pop',audio_path:'x.mp3',status:'pending',created_at:'2026-10-11T10:00:00Z'},
  {id:'y',artist_id:'art3',genre:'Pop',status:'approved',created_at:'2026-10-11T10:00:00Z'}
];
test('Explorar muestra solamente audios aprobados',()=>{
  const data=buildExploreCollections({tracks});
  assert.equal(data.total,3);
  assert.deepEqual(data.hiddenGems,[]); // Sin recuentos, no suponer que el artista tiene cero seguidores.
  assert.deepEqual(data.latest.map(t=>t.id),['a','c','b']);
  assert.equal(data.genres.find(g=>g.genre==='Pop').count,1);
});
test('Joyas ocultas se limita a artistas con pocos seguidores',()=>{
  const data=buildExploreCollections({tracks,followerCounts:[{artist_id:'art1',follower_count:100},{artist_id:'art2',follower_count:2}]});
  assert.deepEqual(data.hiddenGems.map(t=>t.id),['c']);
});
test('Sin catálogo no inventa canciones, géneros ni estadísticas',()=>{
  const result=buildExploreCollections({});
  assert.deepEqual(result,{latest:[],hiddenGems:[],genres:[],total:0});
});
test('Limita las tarjetas y prioriza diversidad de artistas',()=>{
  const result=buildExploreCollections({tracks,limit:2});
  assert.deepEqual(result.latest.map(t=>t.id),['a','c']);
});
