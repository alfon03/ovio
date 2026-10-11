import test from 'node:test';
import assert from 'node:assert/strict';
import {genrePreferences,buildPersonalizedMixes,recommendAlbums} from '../src/mixes.js';
const date=n=>new Date(Date.now()-n*86400000).toISOString();
const tracks = [
 {id:'a',artist_id:'art1',genre:'Rap',status:'approved',release_id:'r1',created_at:date(2)},
 {id:'b',artist_id:'art2',genre:'Pop',status:'approved',release_id:'r2',created_at:date(5)},
 {id:'c',artist_id:'art3',genre:'Rap',status:'approved',release_id:'r1',created_at:date(1)},
 {id:'d',artist_id:'art4',genre:'Indie',status:'approved',created_at:date(4)},
 {id:'x',artist_id:'art9',genre:'Rap',status:'pending',release_id:'r3',created_at:date(0)}
];
const releases=[{id:'r1',artist_id:'art1',created_at:date(2)},{id:'r2',artist_id:'art2',created_at:date(5)},{id:'r3',artist_id:'art9',created_at:date(0)}];
test('preferencias derivan de los propios favoritos y escuchas',()=>{
 const pref=genrePreferences({tracks,likes:[{track_id:'a'}],listens:[{track_id:'b'},{track_id:'b'}]});
 assert.equal(pref[0][0],'Rap'); assert.equal(pref.find(x=>x[0]==='Pop')[1],2);
});
test('no se recomiendan canciones pendientes ni privadas',()=>{
 const m=buildPersonalizedMixes({tracks});
 assert.equal(m.length,3);
 assert.ok(m.every(x=>x.tracks.every(t=>t.status==='approved'&&t.id!=='x')));
});
test('radar prioriza canciones de artistas no seguidos',()=>{
 const m=buildPersonalizedMixes({tracks,follows:[{artist_id:'art1'}]});
 assert.notEqual(m.find(x=>x.id==='radar').tracks[0].artist_id,'art1');
});
test('los mixes cambian de preferencia tras favoritos y escucha',()=>{
 const m=buildPersonalizedMixes({tracks,likes:[{track_id:'b'}],follows:[{artist_id:'art2'}]});
 assert.equal(m.find(x=>x.id==='para-ti').tracks[0].id,'b');
});
test('no hay contenido ficticio cuando no hay canciones públicas',()=>{
 assert.deepEqual(buildPersonalizedMixes({tracks:tracks.filter(t=>t.id==='x')}),[]);
});
test('los mixes respetan el límite pedido y no contienen duplicados',()=>{
 const m=buildPersonalizedMixes({tracks,limit:2});
 assert.ok(m.every(x=>x.tracks.length<=2 && new Set(x.tracks.map(t=>t.id)).size===x.tracks.length));
});
test('solo recomienda álbumes con alguna pista aprobada',()=>{
 assert.deepEqual(recommendAlbums({releases,tracks}).map(r=>r.id).sort(),['r1','r2']);
});
test('un álbum guardado sale de los sugeridos',()=>{
 assert.ok(!recommendAlbums({releases,tracks,savedIds:['r1']}).some(r=>r.id==='r1'));
});
test('mezclas consistentes con entradas equivalentes',()=>{
 assert.deepEqual(buildPersonalizedMixes({tracks,likes:[]}).map(m=>m.tracks.map(t=>t.id)),buildPersonalizedMixes({tracks,likes:[]}).map(m=>m.tracks.map(t=>t.id)));
});
