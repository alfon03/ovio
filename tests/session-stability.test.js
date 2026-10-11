import test from 'node:test';
import assert from 'node:assert/strict';
import {appendListen} from '../src/session-stability.js';

test('añadir una escucha no cambia la lista original ni requiere descargar el catálogo',()=>{
  const before=[{user_id:'a',track_id:'1',created_at:'ayer'}];
  const after=appendListen(before,{user_id:'a',track_id:'2',created_at:'hoy'});
  assert.equal(before.length,1);assert.equal(after.length,2);assert.equal(after[1].track_id,'2');
});
test('el historial local está limitado incluso después de muchas canciones',()=>{
  const before=Array.from({length:1000},(_,i)=>({user_id:'a',track_id:String(i)}));
  const after=appendListen(before,{user_id:'a',track_id:'nuevo',created_at:'hoy'});
  assert.equal(after.length,1000);assert.equal(after[0].track_id,'1');assert.equal(after.at(-1).track_id,'nuevo');
});
test('un evento sin identidad no entra al estado local',()=>{
  const before=[];
  assert.equal(appendListen(before,{track_id:'uno'}),before);
  assert.equal(appendListen(before,null),before);
});
