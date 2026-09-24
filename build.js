const fs=require('node:fs');
fs.mkdirSync('public/assets',{recursive:true});
for(const name of ['index.html','app.js','style.css','care-model.js','storage.js','manifest.webmanifest'])fs.copyFileSync(name,'public/'+name);
for(const name of ['hero.jpg','icon.svg'])fs.copyFileSync('assets/'+name,'public/assets/'+name);
