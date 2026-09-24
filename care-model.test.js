const {test}=require('node:test'),assert=require('node:assert/strict');
const {tasksForDay,dayKey}=require('./care-model');
const p={id:'test',created:new Date(2026,8,1,12).getTime(),days:3};
test('scheduled icons use plant interval and weekly inspection',()=>{
 assert.equal(tasksForDay([p],'2026-09-01','2026-09-01').length,2);
 assert.equal(tasksForDay([p],'2026-09-02','2026-09-01').length,0);
 assert.equal(tasksForDay([p],'2026-09-04','2026-09-01')[0].id,'soil');
 assert.equal(tasksForDay([p],'2026-09-08','2026-09-01')[0].id,'inspect');
});
test('overdue tasks appear today, completion persists and can be undone',()=>{
 const tasks=tasksForDay([p],'2026-09-06','2026-09-06');
 assert.equal(tasks.find(t=>t.id==='soil').due,'2026-09-04');
 const updated={...p,careDone:{'soil:2026-09-04':new Date(2026,8,6,12).getTime()}};
 assert.equal(tasksForDay([updated],'2026-09-06','2026-09-06').find(t=>t.id==='soil').done,true);
 assert.equal(tasksForDay([updated],'2026-09-04','2026-09-06')[0].done,true);
 assert.equal(tasksForDay([p],'2026-09-06','2026-09-06')[0].done,false);
});
test('month boundaries and legacy check dates are respected',()=>{
 const legacy={...p,checked:new Date(2026,8,30,12).getTime()};
 assert.equal(tasksForDay([legacy],'2026-10-03','2026-09-30').find(t=>t.id==='soil').due,'2026-10-03');
 assert.equal(tasksForDay([p],'2026-08-31','2026-09-01').length,0);
 assert.equal(dayKey(new Date(2026,0,1,0,1)),'2026-01-01');
});
