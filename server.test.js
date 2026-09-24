const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs'),{Readable}=require('node:stream');
test('background identification acknowledges immediately, deduplicates and retains success/errors',async()=>{
 let handler,release,calls=0,timeout;
 const plant=Object.fromEntries(['name','latin','family','origin','type','size','level','water','temp','light','description','fact','safety','uncertainty'].map(f=>[f,'test']));
 Object.assign(plant,{isPlant:true,identifiable:true,days:7,care:[{title:'care',text:'text'}]});
 const context={module:{exports:{}},require:n=>n==='node:http'?{createServer:fn=>{handler=fn;return{on(){},listen(){}};}}:require(n),__dirname:__dirname,process:{env:{OPENAI_API_KEY:'test-only'},loadEnvFile(){}},console,URL,Buffer,setInterval:()=>({unref(){}}),AbortSignal:{timeout:ms=>{timeout=ms;return undefined;}},fetch:async()=>{calls++;return new Promise(resolve=>{release=resolve;});}};
 vm.runInNewContext(fs.readFileSync('server.js','utf8'),context);handler=context.module.exports;
 function request(url,body){let finish;const response=new Promise(resolve=>finish=resolve);const req=Readable.from(body?[Buffer.from(body)]:[]);Object.assign(req,{url,method:body?'POST':'GET',headers:{'content-type':'application/json'}});const res={writeHead(code){this.code=code;},end(text){finish({code:this.code,...JSON.parse(text)});}};const done=handler(req,res);return{response,done};}
 const image='data:image/jpeg;base64,'+Buffer.from([255,216,...Array(20).fill(0)]).toString('base64');
 const payload=JSON.stringify({image});
 const a=request('/api/identify',payload);const accepted=await a.response;
 assert.equal(accepted.code,202);assert.ok(accepted.jobId);assert.equal(timeout,240000);
 const duplicate=await request('/api/identify',payload).response;assert.equal(duplicate.jobId,accepted.jobId);assert.equal(calls,1);
 assert.equal((await request('/api/jobs/'+accepted.jobId).response).status,'processing');
 release({ok:true,json:async()=>({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(plant)}]}]})});await a.done;
 const complete=await request('/api/jobs/'+accepted.jobId).response;assert.equal(complete.status,'completed');assert.equal(complete.plant.name,'test');
 assert.equal((await request('/api/identify',payload).response).jobId,accepted.jobId);assert.equal(calls,1);
 assert.equal((await request('/api/jobs/missing').response).code,404);
 assert.equal((await request('/api/identify','{"image":"invalid"}').response).code,400);
 // Distinct image and an upstream error must release the job slot for a retry.
 const distinct=JSON.stringify({image:'data:image/jpeg;base64,'+Buffer.from([255,216,...Array(21).fill(1)]).toString('base64')});
 const b=request('/api/identify',distinct);const started=await b.response;
 release({ok:false,status:429,json:async()=>({error:{code:'insufficient_quota'}})});await b.done;
 assert.equal((await request('/api/jobs/'+started.jobId).response).status,'failed');
 const retry=request('/api/identify',distinct);const again=await retry.response;assert.notEqual(again.jobId,started.jobId);
 release({ok:false,status:401,json:async()=>({})});await retry.done;
});


