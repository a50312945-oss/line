// sw.js — 電流小工具快取（kW 版）
const CACHE='power-tool-cache-v4-2025-10-03T09:04:48.853129';
const ASSETS=['./','./index.html','./manifest.webmanifest','./app.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>k===CACHE?null:caches.delete(k)))))});
self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(resp=>{const cp=resp.clone();caches.open(CACHE).then(c=>c.put(e.request,cp)).catch(()=>{});return resp}).catch(()=>caches.match('./index.html'))))});
