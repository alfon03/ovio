import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateFeedback} from '../src/beta-feedback.js';
const good={category:'error',screen:'Reproductor',title:'La canción no suena',details:'Al pulsar reproducir no empieza el audio.',priority:'normal'};
test('valida informe normal',()=>assert.equal(validateFeedback(good),null));
test('rechaza categoría arbitraria',()=>assert.ok(validateFeedback({...good,category:'admin'})));
test('rechaza asunto corto',()=>assert.ok(validateFeedback({...good,title:'fallo'})));
test('rechaza detalles insuficientes',()=>assert.ok(validateFeedback({...good,details:'...' })));
test('rechaza prioridad inválida',()=>assert.ok(validateFeedback({...good,priority:'critical'})));
test('limita texto excesivo',()=>assert.ok(validateFeedback({...good,details:'x'.repeat(2001)})));
test('migración tiene RLS y límite servidor',()=>{
  const sql=readFileSync(new URL('../sql/011_feedback_beta.sql',import.meta.url),'utf8');
  assert.match(sql,/enable row level security/i);
  assert.match(sql,/public\.is_admin\(\)/);
  assert.match(sql,/>= 5/);
  assert.match(sql,/grant update \(status,response\)/);
  assert.doesNotMatch(sql,/grant update on table public\.beta_feedback/i);
});
