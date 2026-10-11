import test from 'node:test';
import assert from 'node:assert/strict';
import {safeCount, formatMonth, normalizedInsights, intervals} from '../src/artist-insights.js';

test('formatea meses UTC en español sin desplazar de mes',()=>{
  assert.match(formatMonth('2026-01'),/ene/i);
  assert.match(formatMonth('2026-12'),/dic/i);
});
test('no acepta métricas negativas, nulas o no numéricas',()=>{
  assert.equal(safeCount(-12),0);
  assert.equal(safeCount('1.9'),1);
  assert.equal(safeCount(undefined),0);
  assert.equal(safeCount('abc'),0);
});
test('normaliza estadísticas reales sin inventar escuchas',()=>{
  const r=normalizedInsights({summary:{plays:18,listeners:5,minutes:42,followers:7},months:[{month:'2026-10',plays:18,listeners:5,minutes:42}],tracks:[{track_id:'x',title:'Intro',genre:'Rap',plays:18,listeners:5,minutes:42}]});
  assert.equal(r.totals.plays,18);
  assert.equal(r.totals.current_followers_joined_last_30d,0);
  assert.deepEqual(r.months.map(x=>x.month),['2026-10']);
  assert.equal(r.tracks[0].title,'Intro');
});
test('normaliza respuesta sin datos para un artista nuevo',()=>{
  const r=normalizedInsights({summary:{},months:[],tracks:[]});
  assert.equal(r.totals.plays,0);
  assert.deepEqual(r.months,[]);
  assert.deepEqual(r.tracks,[]);
});
test('descarta periodos mal formados sin enseñar datos ajenos',()=>{
  const r=normalizedInsights({summary:{},months:[{month:'2026-13',plays:9},{month:'2026-08',plays:2}],tracks:[]});
  assert.deepEqual(r.months.map(m=>m.month),['2026-08']);
  assert.deepEqual(intervals,[1,3,6,12]);
});
test('tolera métricas null sin bloquear la pantalla',()=>{
  const r=normalizedInsights({summary:null,months:[],tracks:[]});
  assert.equal(r.totals.plays,0);
});
