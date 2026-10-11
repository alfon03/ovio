import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateLyricDraft,cleanLyricDraft,LYRIC_BODY_MAX} from '../src/lyric-drafts.js';
import {readFileSync} from 'node:fs';

test('El título de un borrador es obligatorio',()=>{
  assert.match(validateLyricDraft({title:'   ',body:'hola'}),/título/);
  assert.equal(validateLyricDraft({title:'Primera canción',body:''}),'');
});
test('El cuerpo tiene límite de caracteres',()=>{
  assert.match(validateLyricDraft({title:'Letra',body:'x'.repeat(LYRIC_BODY_MAX+1)}),/superar/);
});
test('Limpiar borrador no lo convierte en publicación',()=>{
  assert.deepEqual(cleanLyricDraft({title:'  Hola  ',body:'uno\r\ndos',track_id:''}),{title:'Hola',body:'uno\ndos',track_id:null});
});
test('SQL protege letras por propietario con RLS y no concede lectura a anon',()=>{
  const sql=readFileSync(new URL('../sql/013_lyrics_private.sql',import.meta.url),'utf8');
  assert.match(sql,/enable row level security/i);
  assert.match(sql,/owner_id\s*=\s*\(select auth\.uid\(\)\)/i);
  assert.match(sql,/revoke all on public\.artist_lyric_drafts from public, anon, authenticated/i);
  assert.match(sql,/grant select, delete on public\.artist_lyric_drafts to authenticated/i);
  assert.doesNotMatch(sql,/create\s+(or replace\s+)?view/i);
});
test('PWA tiene manifest y servicio que no cachea solicitudes remotas',()=>{
  const manifest=JSON.parse(readFileSync(new URL('../public/manifest.webmanifest',import.meta.url),'utf8'));
  assert.equal(manifest.display,'standalone');
  assert.ok(manifest.icons.some(icon=>icon.sizes==='512x512'));
  const sw=readFileSync(new URL('../public/sw.js',import.meta.url),'utf8');
  assert.match(sw,/url\.origin !== self\.location\.origin/);
  assert.match(sw,/request\.method !== 'GET'/);
});
