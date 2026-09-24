(function(root){
 const dayKey=date=>{const d=new Date(date);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
 const ordinal=key=>{const [y,m,d]=key.split('-').map(Number);return Date.UTC(y,m-1,d)/86400000;};
 const fromOrdinal=n=>new Date(n*86400000).toISOString().slice(0,10);
 const kinds=[{id:'soil',icon:'water',title:'Проверить грунт',hint:'Полить, если грунт подсох'},{id:'inspect',icon:'leaf',title:'Осмотреть растение',hint:'Проверить листья и побеги'}];
 function tasksForDay(plants,key,today=dayKey(new Date())){
  const selected=ordinal(key),now=ordinal(today),tasks=[];
  for(const p of plants)for(const kind of kinds){
   const interval=kind.id==='soil'?Math.max(1,Math.min(30,Number(p.days)||7)):7;
   const anchor=ordinal(dayKey(kind.id==='soil'&&p.checked?p.checked:p.created||Date.now()));
   if(selected<anchor)continue;
   let due=selected;
   if(key===today)due=anchor+Math.floor((now-anchor)/interval)*interval;
   else if((selected-anchor)%interval!==0)continue;
   const dueKey=fromOrdinal(due),token=kind.id+':'+dueKey,done=p.careDone?.[token];
   if(key===today&&due<now&&done&&dayKey(done)!==today)continue;
   tasks.push({...kind,plant:p,token,due:dueKey,done:!!done,overdue:due<now&&!done});
  }
  return tasks;
 }
 const api={dayKey,ordinal,tasksForDay};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CareModel=api;
})(typeof window!=='undefined'?window:globalThis);
