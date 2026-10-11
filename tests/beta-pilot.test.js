import test from 'node:test';
import assert from 'node:assert/strict';
import {PILOT_STEPS,pilotStepStatus,pilotProgress,pilotMetrics} from '../src/beta-pilot.js';

test('el recorrido tiene cuatro acciones y cada una una navegación',()=>{
  assert.equal(PILOT_STEPS.length,4);
  assert.equal(new Set(PILOT_STEPS.map(s=>s.id)).size,4);
  assert.ok(PILOT_STEPS.every(s=>s.destination));
});
test('cuenta nueva empieza sin pasos completados',()=>{
  assert.equal(pilotProgress(pilotStepStatus({username:'u_12345678901234567890123456789012'})),0);
});
test('las cuentas existentes con identificador pueden completar su perfil',()=>{
  assert.equal(pilotStepStatus({username:'maria_b'}).profile,true);
  assert.equal(pilotStepStatus({username:'u_12345678901234567890123456789012'}).profile,false);
});
test('progreso real según favoritos, listas y seguidos',()=>{
  const status=pilotStepStatus({username:'ana_beats',favoriteCount:1,playlistCount:2,followCount:0});
  assert.equal(pilotProgress(status),3);
  assert.equal(status.follow,false);
});
test('datos nulos o malformados del panel se convierten en cero',()=>{
  const metrics=pilotMetrics({registered_users:22,new_users_7d:-4,artists_approved:'3',valid_plays_7d:'NaN'});
  assert.equal(metrics.registeredUsers,22);
  assert.equal(metrics.newUsers7d,0);
  assert.equal(metrics.approvedArtists,3);
  assert.equal(metrics.validPlays7d,0);
});
test('los minutos escuchados solo provienen de la respuesta y no se infieren',()=>{
  assert.equal(pilotMetrics({active_listeners_7d:5}).listeningMinutes7d,0);
});
