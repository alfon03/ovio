import test from 'node:test';
import assert from 'node:assert/strict';
import {playbackErrorMessage,canRetryPlayback} from '../src/playback-recovery.js';
test('mensaje de reproducción distingue fallo de red y falta de conexión',()=>{
  assert.match(playbackErrorMessage(2),/conexión/);
  assert.match(playbackErrorMessage(4),/audio/);
  assert.match(playbackErrorMessage(2,true),/Sin conexión/);
});
test('reintentar exige canción aprobada y conexión',()=>{
  const track={audio_path:'music.mp3',status:'approved'};
  assert.equal(canRetryPlayback(track,false),true);
  assert.equal(canRetryPlayback(track,true),false);
  assert.equal(canRetryPlayback({...track,status:'pending'},false),false);
});
