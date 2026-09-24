// User photos and generated profiles are stored locally, never seeded with demo plants.
const plantDB = new Promise((resolve,reject)=>{
 const request=indexedDB.open('flowers-user-garden',1);
 request.onupgradeneeded=()=>request.result.createObjectStore('plants',{keyPath:'id'});
 request.onsuccess=()=>resolve(request.result);
 request.onerror=()=>reject(request.error);
});
async function readGarden(){const db=await plantDB;return new Promise((resolve,reject)=>{const r=db.transaction('plants').objectStore('plants').getAll();r.onsuccess=()=>resolve(r.result.sort((a,b)=>b.created-a.created));r.onerror=()=>reject(r.error);});}
async function persistPlant(plant){const db=await plantDB;return new Promise((resolve,reject)=>{const tx=db.transaction('plants','readwrite');tx.objectStore('plants').put(plant);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}
async function deletePlant(id){const db=await plantDB;return new Promise((resolve,reject)=>{const tx=db.transaction('plants','readwrite');tx.objectStore('plants').delete(id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}
