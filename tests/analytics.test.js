import test from 'node:test';
import assert from 'node:assert/strict';
import { listenedDelta, isQualifiedPlayback, recapIsFinal } from '../src/analytics.js';

test('cuenta reproducción normal de 4 segundos',()=>assert.equal(listenedDelta(4,4.1),4));
test('salto de 60 segundos no suma 60 minutos de reproducción',()=>assert.equal(listenedDelta(60,.2),0));
test('movimiento hacia atrás no suma tiempo',()=>assert.equal(listenedDelta(-8,1),0));
test('cuenta 30 segundos como escucha válida para canciones normales',()=>assert.equal(isQualifiedPlayback(30,200),true));
test('ignora escucha de 8 segundos para rankings',()=>assert.equal(isQualifiedPlayback(8,200),false));
test('canción breve requiere media duración',()=>assert.equal(isQualifiedPlayback(12,20),true));
test('resumen se vuelve definitivo el 25 de noviembre UTC',()=>{
  assert.equal(recapIsFinal(2026,new Date('2026-11-24T23:59:59Z')),false);
  assert.equal(recapIsFinal(2026,new Date('2026-11-25T00:00:00Z')),true);
});
