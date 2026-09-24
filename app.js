const icons={home:'<path d="m3 10 9-7 9 7v10H3z"/><path d="M9 20v-7h6v7"/>',leaf:'<path d="M20 3C8 2 2 7 5 15s16 4 15-12Z"/><path d="M4 21 16 8"/>',scan:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/><circle cx="12" cy="12" r="4"/>',calendar:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18m-13 4h2m4 0h2"/>',book:'<path d="M12 5C8 2 4 3 2 4v16c3-1 7-1 10 1 3-2 7-2 10-1V4c-2-1-6-2-10 1v16"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>',water:'<path d="M12 2C9 7 5 11 5 15a7 7 0 0 0 14 0c0-4-4-8-7-13Z"/>',temp:'<path d="M9 14V5a3 3 0 0 1 6 0v9a5 5 0 1 1-6 0Z"/><path d="M12 8v10"/>',camera:'<path d="M8 5 9 3h6l1 2h4v15H4V5Z"/><circle cx="12" cy="12" r="4"/>'};
const icon=n=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[n]||icons.leaf}</svg>`;
document.querySelectorAll('[data-icon]').forEach(e=>e.innerHTML=icon(e.dataset.icon));
const main=document.querySelector('#main'),modal=document.querySelector('#modal');
// Animate rendered content without delaying navigation or moving the fixed menu.
let contentAnimation,lastAnimatedRoute=location.hash;
new MutationObserver(()=>{
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const samePlant=location.hash===lastAnimatedRoute&&location.hash.startsWith('#plant/');
 const target=samePlant?(main.querySelector('.article')||main):main;
 lastAnimatedRoute=location.hash;
 contentAnimation?.cancel();
 contentAnimation=target.animate([{opacity:.35,transform:'translateY(7px)'},{opacity:1,transform:'translateY(0)'}],{duration:280,easing:'cubic-bezier(.22,.61,.36,1)'});
}).observe(main,{childList:true});
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

let garden=[],configured=false,photo='',tab='about',result=null,busy=false,previousRoute='home',storageAvailable=true;
const lookup=id=>garden.find(p=>p.id===id)||(result?.id===id?result:null);
const picture=p=>/^data:image\/(jpeg|png);base64,/.test(p.photo||'')?`<img src="${esc(p.photo)}" alt="${esc(p.name)}">`:icon('leaf');
function toast(message){const t=document.querySelector('#toast');t.textContent=message;t.classList.add('show');clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>t.classList.remove('show'),4000);}
const card=p=>`<button class="plant-card" data-action="plant" data-id="${esc(p.id)}"><div class="plant-art">${picture(p)}<span class="tag">${esc(p.level)}</span></div><h3>${esc(p.name)}</h3><p>${esc(p.latin)}</p></button>`;
const empty=(title='Здесь начнётся ваш сад',text='Добавьте первое растение по фото.<br>Мы поможем узнать его и подобрать уход.')=>`<div class="empty">${icon('leaf')}<h2>${title}</h2><p>${text}</p><a class="primary" href="#scan">Добавить растение</a></div>`;
function home(){main.innerHTML=`<section class="intro"><div class="eyebrow muted">ПРИРОДА СТАНОВИТСЯ БЛИЖЕ</div><h1>У каждого растения<br>есть своя история.</h1><p class="muted">Узнайте его имя. Помогите ему расцвести.</p></section><section class="hero"><img src="assets/hero.jpg" alt="Зелёные листья в солнечном свете"><div class="hero-content"><span class="pill">✧ ВАШ КАРМАННЫЙ БОТАНИК</span><h2>Знакомство<br>с одного фото</h2><p>От первого снимка до первого нового листа.</p><a class="primary" href="#scan">${icon('scan')} Определить растение <span style="margin-left:auto">↗</span></a></div></section><div class="steps">${[['camera','Сфотографируйте','Лист или цветок'],['leaf','Узнайте больше','Имя и особенности'],['water','Позаботьтесь','Ваш личный гайд']].map(s=>`<div class="step"><div class="step-icon">${icon(s[0])}</div><strong>${s[1]}</strong>${s[2]}</div>`).join('')}</div><div class="section-title"><h2>Ваши зелёные любимцы</h2>${garden.length?'<a class="text-link" href="#garden">Все растения ↗</a>':''}</div>${garden.length?`<div class="cards">${garden.slice(0,2).map(card).join('')}</div>`:empty()}<div class="footer-note">РАСТИМ ЛЮБОВЬ К ПРИРОДЕ</div>`;}
function scan(){main.innerHTML=`<div class="page-heading"><div class="eyebrow muted" style="margin-bottom:12px">НОВОЕ ЗНАКОМСТВО</div><h1>Кто здесь растёт?</h1><p>Сфотографируйте одно растение поближе.<br>Лучше всего — цветок или лист при дневном свете.</p></div><div class="upload" id="preview">${photo?`<img src="${photo}" alt="Выбранное фото растения">`:`${icon('scan')}<h3>Всё начинается с фото</h3><p>Выберите снимок из галереи<br>или откройте камеру</p>`}</div><input hidden type="file" id="gallery" accept="image/jpeg,image/png,image/webp"><input hidden type="file" id="camera" accept="image/*" capture="environment"><div class="scan-actions">${photo?`<button class="primary" data-action="identify" ${busy?'disabled':''}>${busy?'<span class="loading">Изучаем листья и лепестки…</span>':icon('leaf')+' Определить растение'}</button>`:`<button class="primary" data-action="camera">${icon('camera')} Сделать фото</button>`}<button class="secondary" data-action="gallery" ${busy?'disabled':''}>${photo?'Выбрать другое фото':'Загрузить из галереи'}</button></div><div id="scan-message" role="status"></div>`;document.querySelectorAll('input[type=file]').forEach(input=>input.onchange=()=>loadPhoto(input.files[0]));}
async function loadPhoto(file){if(!file||busy)return;if(!file.type.startsWith('image/'))return toast('Выберите изображение.');if(file.size>8*1024*1024)return toast('Размер фото должен быть не больше 8 МБ.');try{const bitmap=await createImageBitmap(file);const canvas=document.createElement('canvas'),scale=Math.min(1,1280/Math.max(bitmap.width,bitmap.height));canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();photo=canvas.toDataURL('image/jpeg',.82);scan();}catch{toast('Не удалось прочитать снимок. Выберите JPG или PNG.');}}
function catalog(){location.hash='garden';}
function detail(id){const p=lookup(id);if(!p){location.hash='garden';return;}const saved=garden.some(g=>g.id===id);main.innerHTML=`<button class="back" data-action="back">← Назад</button><div class="detail-art">${picture(p)}<span class="pill">✧ Определено по вашему фото</span></div><div class="detail-title"><h1>${esc(p.name)}</h1><p>${esc(p.latin)}</p></div><p class="notice" style="padding-top:0">${esc(p.uncertainty||'Предположение ИИ по фотографии. Сравните признаки растения.')}</p><div class="stats"><div class="stat">${icon('water')}<strong>${esc(p.water)}</strong>проверка грунта</div><div class="stat">${icon('sun')}<strong>${esc(p.light)}</strong>свет</div><div class="stat">${icon('temp')}<strong>${esc(p.temp)}</strong>температура</div></div><button class="primary" data-action="save" data-id="${esc(id)}">${icon('leaf')} ${saved?'Уже в моём саду ✓':'Добавить в мой сад'}</button><div class="tabs"><button class="${tab==='about'?'active':''}" data-action="tab" data-value="about" data-id="${esc(id)}">О растении</button><button class="${tab==='care'?'active':''}" data-action="tab" data-value="care" data-id="${esc(id)}">Гайд по уходу</button></div><div class="article">${tab==='about'?`<p>${esc(p.description)}</p><div class="facts">${[['Семейство',p.family],['Родина',p.origin],['Тип',p.type],['Размер',p.size]].map(([k,v])=>`<div><span>${k}</span><strong>${esc(v)}</strong></div>`).join('')}</div><div class="tip"><span>✧</span><div><h3>Знаете ли вы?</h3><p>${esc(p.fact)}</p></div></div><p style="margin-top:18px">${esc(p.safety)}</p>`:p.care.map((c,i)=>`<details ${i===0?'open':''}><summary>${esc(c.title)}</summary><p>${esc(c.text)}</p></details>`).join('')}</div>`;}
function gardenPage(){main.innerHTML=`<div class="page-heading"><h1>Мой маленький сад</h1><p>${garden.length?'Все ваши растения и их истории.':'Первое растение — начало большой любви.'}</p></div>${garden.length?`<input id="search" class="search" type="search" placeholder="Найти в моём саду…" aria-label="Поиск растений"><div class="cards" id="garden-list"></div><a href="#scan" class="secondary" style="display:block;text-align:center;margin-top:24px">+ Добавить растение</a>`:empty()}`;
 const render=q=>{document.querySelector('#garden-list').innerHTML=garden.filter(p=>(p.name+' '+p.latin).toLowerCase().includes(q)).map(p=>`<div class="garden-card">${card(p)}<button class="remove" data-action="remove" data-id="${esc(p.id)}" aria-label="Удалить из сада">×</button></div>`).join('')||'<p class="notice">Ничего не найдено</p>';};
 if(garden.length){render('');document.querySelector('#search').oninput=e=>render(e.target.value.toLowerCase().trim());}
}
function carePage(){
 const today=CareModel.dayKey(new Date()),all=CareModel.tasksForDay(garden,today,today);
 main.innerHTML=`<div class="page-heading"><div class="eyebrow muted" style="margin-bottom:13px">${new Date().toLocaleDateString('ru',{day:'numeric',month:'long',weekday:'long'})}</div><h1>Забота на сегодня</h1><p>Маленькие дела для каждого растения.</p></div>${garden.length?garden.map(p=>{
 const tasks=all.filter(t=>t.plant.id===p.id),done=tasks.filter(t=>t.done).length,complete=tasks.length>0&&done===tasks.length;
 return `<section class="plant-tasks ${complete?'all-done':''}" data-plant-id="${esc(p.id)}"><div class="plant-task-heading"><div class="mini">${picture(p)}</div><div><h2>${esc(p.name)}</h2><span class="muted">${tasks.length?done+' из '+tasks.length+' выполнено':'Сегодня можно отдохнуть'}</span></div><span class="plant-medal" aria-label="${complete?'Все задачи выполнены':''}">${complete?'✿':''}</span></div>${tasks.map(t=>`<div class="care-row task-row ${t.done?'task-done':''}"><div class="task-symbol">${icon(t.icon)}</div><div class="task-copy"><h3>${esc(t.title)}</h3><p>${esc(t.hint)}</p></div><button class="task-check" role="checkbox" aria-checked="${t.done}" aria-label="${esc(t.title+' — '+p.name)}" data-action="care-toggle" data-id="${esc(p.id)}" data-token="${t.token}">${t.done?'✓':''}</button></div>`).join('')}${complete?'<div class="plant-reward">✧ Вся забота на сегодня подарена!</div>':!tasks.length?'<p class="rest-note">Всё в своём ритме. Новые задачи появятся в нужный день.</p>':''}</section>`;
 }).join(''):empty('Забота начинается с сада','Добавьте растение — и здесь появятся<br>его задачи на день.')}`;
}
function celebratePlant(id){
 const section=[...document.querySelectorAll('[data-plant-id]')].find(el=>el.dataset.plantId===id);if(!section)return;
 section.classList.add('celebrate');
 const burst=document.createElement('div');burst.className='reward-burst';burst.setAttribute('aria-hidden','true');
 burst.innerHTML=Array.from({length:12},(_,i)=>`<span style="--x:${Math.cos(i*Math.PI/6)*110}px;--y:${Math.sin(i*Math.PI/6)*90-30}px;--r:${i*45}deg">${i%3?'✦':'✿'}</span>`).join('');
 section.append(burst);setTimeout(()=>{burst.remove();section.classList.remove('celebrate');},1400);
 toast('Забота завершена — '+(lookup(id)?.name||'растение')+' благодарит вас ✿');
}
async function identify(){
 if(busy||!photo)return;
 busy=true;const submittedPhoto=photo,started=Date.now();scan();
 const progress=setInterval(()=>{
  const target=document.querySelector('#scan-message');
  const seconds=Math.floor((Date.now()-started)/1000);
  if(target)target.innerHTML=`<p class="notice">${seconds<25?'Рассматриваем растение и составляем уход':seconds<70?'Готовим подробную карточку. Это может занять немного времени':'Ответ занимает дольше обычного. Продолжаем ждать — повторно загружать фото не нужно.'} · ${seconds} с</p>`;
 },1000);
 try{
  const r=await fetch('/api/identify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({image:submittedPhoto}),signal:AbortSignal.timeout(270000)});
  let data=await r.json();if(!r.ok)throw Error(data.error);
  if(data.jobId){
   const jobId=data.jobId;let failures=0;
   while(Date.now()-started<270000){
    await new Promise(resolve=>setTimeout(resolve,1800));
    let status;
    try{status=await fetch('/api/jobs/'+encodeURIComponent(jobId),{signal:AbortSignal.timeout(12000)});data=await status.json();failures=0;}
    catch{if(++failures>=5)throw Error('Связь с сервером прервалась. Фото осталось на экране. Нажмите «Определить» ещё раз — продолжающийся анализ не будет запущен повторно.');continue;}
    if(!status.ok||data.status==='failed')throw Error(data.error||'Не удалось получить результат.');
    if(data.status==='completed')break;
   }
  }
  if(!data.plant)throw Error('Сервис пока не вернул результат. Фото сохранено на экране — попробуйте снова чуть позже.');
  result={...data.plant,id:'plant-'+crypto.randomUUID(),photo:submittedPhoto,created:Date.now(),checked:null};
  tab='about';previousRoute='scan';location.hash='plant/'+result.id;
 }catch(e){
  clearInterval(progress);
  const message=e.name==='TimeoutError'?'Не удалось связаться с сервером вовремя. Фото осталось на экране — повторите попытку.':e.message||'Не удалось распознать фото.';
  const target=document.querySelector('#scan-message');if(target)target.innerHTML=`<div class="error">${esc(message)}</div>`;else toast(message);
 }finally{
  clearInterval(progress);busy=false;
  const button=main.querySelector('[data-action=identify]');if(button){button.disabled=false;button.innerHTML=icon('leaf')+' Определить растение';}
  const gallery=main.querySelector('[data-action=gallery]');if(gallery)gallery.disabled=false;
 }
}
function route(){const hash=location.hash.slice(1)||'home';document.querySelectorAll('[data-nav]').forEach(a=>a.classList.toggle('active',a.dataset.nav===hash));if(hash.startsWith('plant/'))detail(hash.split('/')[1]);else({home,scan,garden:gardenPage,care:carePage,catalog}[hash]||home)();window.scrollTo(0,0);}
document.addEventListener('click',async e=>{const b=e.target.closest('[data-action]');if(!b)return;const id=b.dataset.id;switch(b.dataset.action){
case'plant':previousRoute=location.hash.slice(1)||'home';tab='about';location.hash='plant/'+id;break;
case'back':location.hash=previousRoute;break;
case'tab':tab=b.dataset.value;detail(id);break;
case'save':{
 if(garden.some(g=>g.id===id))return toast('Растение уже есть в вашем саду');
 const p=lookup(id);if(!p)return;b.disabled=true;
 try{await persistPlant(p);garden.unshift(p);b.innerHTML=icon('leaf')+' Уже в моём саду ✓';toast('Растение и фотография сохранены');}
 catch{toast('Не удалось сохранить растение. Освободите место или разрешите хранилище браузера.');}finally{b.disabled=false;}break;}
case'remove':{try{await deletePlant(id);garden=garden.filter(g=>g.id!==id);gardenPage();toast('Растение удалено из сада');}catch{toast('Не удалось удалить растение. Попробуйте снова.');}break;}
case'care-toggle':{
 const p=lookup(id);if(!p)return;const today=CareModel.dayKey(new Date());const wasComplete=CareModel.tasksForDay([p],today,today).every(t=>t.done);const careDone={...(p.careDone||{})};
 if(careDone[b.dataset.token])delete careDone[b.dataset.token];else careDone[b.dataset.token]=Date.now();
 const updated={...p,careDone};b.disabled=true;
 try{await persistPlant(updated);garden=garden.map(g=>g.id===id?updated:g);carePage();if(!wasComplete&&CareModel.tasksForDay([updated],today,today).every(t=>t.done))celebratePlant(id);}
 catch{b.disabled=false;toast('Не удалось сохранить отметку.');}break;}
case'camera':document.querySelector('#camera').click();break;case'gallery':document.querySelector('#gallery').click();break;case'identify':identify();break;case'close':modal.close();break;
}});
window.addEventListener('hashchange',route);
(async()=>{main.innerHTML='<p class="notice">Открываем ваш сад…</p>';try{garden=(await readGarden()).map(p=>({...p,careDone:p.careDone??(p.checked?{['soil:'+CareModel.dayKey(p.checked)]:p.checked}:{})}));}catch{storageAvailable=false;toast('Хранилище недоступно. Сохранение растений может не работать.');}route();})();




