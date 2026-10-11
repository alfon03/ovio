import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const config=JSON.parse(readFileSync(new URL('../vercel.json',import.meta.url),'utf8'));
test('Vercel compila Vite en dist',()=>{assert.equal(config.framework,'vite');assert.equal(config.outputDirectory,'dist');});
test('Los enlaces internos funcionan como SPA',()=>{assert.ok(config.rewrites.some(({source,destination})=>source==='/(.*)'&&destination==='/index.html'));});
test('Robots no indexa la beta provisional',()=>{assert.match(readFileSync(new URL('../public/robots.txt',import.meta.url),'utf8'),/Disallow: \//);});
