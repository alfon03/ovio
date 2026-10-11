import test from 'node:test';
import assert from 'node:assert/strict';
import {passwordIssue,recoveryRedirectUrl,isRecoveryRoute} from '../src/auth-security.js';

test('valida robustez mínima y longitud',()=>{
  assert.match(passwordIssue('123456'),/12 caracteres/);
  assert.match(passwordIssue('aaaaaaaaaaaa'),/Combina letras/);
  assert.match(passwordIssue('123456789012'),/Combina letras/);
  assert.equal(passwordIssue('Una clave muy larga 123!'),'');
  assert.match(passwordIssue('A'.repeat(129)+'1'),/máximo/);
});
test('redirige al mismo origen y ruta, solo recovery',()=>{
  assert.equal(recoveryRedirectUrl('http://localhost:5173','/'),'http://localhost:5173/?recovery=1');
  assert.equal(recoveryRedirectUrl('https://ovio.example','/app'),'https://ovio.example/app?recovery=1');
});
test('detecta regreso por query o hash',()=>{
  assert.equal(isRecoveryRoute('?recovery=1'),true);
  assert.equal(isRecoveryRoute('','#access_token=aaa&type=recovery'),true);
  assert.equal(isRecoveryRoute('?playlist=abc'),false);
  assert.equal(isRecoveryRoute('?recovery=0'),false);
});
