import test from 'node:test';
import assert from 'node:assert/strict';
import {createQueue, nextPosition, toggleShuffle, cycleRepeat, enqueueNext, removeUpcoming, moveUpcoming, resumePosition} from '../src/player-queue.js';
const ids=['a','b','c','d'];
test('queue starts with selected track and maintains playlist context',()=>{
 const q=createQueue('b',ids);assert.deepEqual(q.ids,ids);assert.equal(q.cursor,1);
 assert.equal(nextPosition(q),2);assert.equal(nextPosition({...q,cursor:3}),null);
});
test('repeat off, all, one and previous are predictable',()=>{
 const q=createQueue('d',ids); assert.equal(nextPosition(q,{ended:true}),null);
 assert.equal(nextPosition({...q,repeat:'all'},{ended:true}),0);
 assert.equal(nextPosition({...q,repeat:'one'},{ended:true}),3);
 assert.equal(nextPosition({...q,cursor:0},{back:true}),0);
});
test('shuffle has no duplicates and keeps the current song',()=>{
 const q=createQueue('b',ids,{shuffle:true,random:()=>0});
 assert.equal(q.ids[0],'b');assert.equal(q.ids.length,4);assert.deepEqual(new Set(q.ids),new Set(ids));
 const off=toggleShuffle(q);assert.deepEqual(off.ids,['b','a','c','d']);
});
test('shuffle leaves listened items and current track untouched',()=>{
 const q=createQueue('b',ids);const shuffled=toggleShuffle(q,()=>0);
 assert.deepEqual(shuffled.ids.slice(0,2),['a','b']);assert.deepEqual(new Set(shuffled.ids),new Set(ids));
});
test('add, move and remove upcoming tracks without touching current track',()=>{
 const q=createQueue('b',ids);const enq=enqueueNext(q,'e');assert.equal(enq.ids[2],'e');
 assert.equal(enqueueNext(enq,'e'),enq);
 const moved=moveUpcoming(enq,'e',1);assert.equal(moved.ids[3],'e');
 assert.equal(removeUpcoming(moved,'a'),moved);
 assert.equal(removeUpcoming(moved,'e').ids.includes('e'),false);
});
test('repeat cycles through 3 modes',()=>{
 let q=createQueue('a',ids);q=cycleRepeat(q);assert.equal(q.repeat,'all');q=cycleRepeat(q);assert.equal(q.repeat,'one');q=cycleRepeat(q);assert.equal(q.repeat,'off');
});
test('resume only meaningful listening positions, never at the end',()=>{
 assert.equal(resumePosition(51,300),51);assert.equal(resumePosition(1,300),0);assert.equal(resumePosition(291,300),0);
 assert.equal(resumePosition(NaN,50),0);
});
