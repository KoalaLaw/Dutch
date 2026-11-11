import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp,rm,readFile } from 'node:fs/promises'
import { gunzipSync } from 'node:zlib'
import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createSyncServer } from '../server/app.mjs'
import { RECORD_KEYS,validateSnapshot,profileDatabase,syncDecision,normalizeApiURL } from '../shared/cloud-protocol.mjs'

const password='Een veilige testzin 2026!'
const snapshot=text=>validateSnapshot({version:1,records:{'type-dutch-dict':JSON.stringify({version:4,val:{noteData:{__type_dutch_daily_v1__:text}}})}})
async function fixture(t,options={}){
 const app=await createSyncServer({databasePath:':memory:',registration:'open',rateLimit:false,...options})
 await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve))
 const base='http://127.0.0.1:'+app.server.address().port+'/api/v1'
 t.after(()=>app.close())
 const request=async(path,{method='GET',token,body,origin}={})=>{
  const response=await fetch(base+path,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{}),...(origin?{Origin:origin}:{})},body:body?JSON.stringify(body):undefined})
  return {status:response.status,headers:response.headers,data:response.status===204?null:await response.json()}
 }
 const register=async(username='alice',extra={})=>{const result=await request('/auth/register',{method:'POST',body:{username,password,...extra}});assert.equal(result.status,201,JSON.stringify(result.data));return result.data}
 return {...app,request,register}
}

test('two users have private progress and a forged owner never selects another account',async t=>{
 const app=await fixture(t),alice=await app.register('alice'),bob=await app.register('bob')
 assert.equal((await app.request('/progress')).status,401)
 assert.equal((await app.request('/progress',{method:'PUT',token:alice.token,body:{expectedRevision:0,snapshot:snapshot('Alice Day 4')}})).status,200)
 const empty=await app.request('/progress?user_id='+alice.user.id,{token:bob.token});assert.equal(empty.data.revision,0)
 const forged=await app.request('/progress',{method:'PUT',token:bob.token,body:{user_id:alice.user.id,expectedRevision:0,snapshot:snapshot('Bob Day 1')}});assert.equal(forged.status,200)
 assert.deepEqual((await app.request('/progress',{token:alice.token})).data.snapshot,snapshot('Alice Day 4'))
 assert.deepEqual((await app.request('/progress',{token:bob.token})).data.snapshot,snapshot('Bob Day 1'))
 const row=app.db.prepare('SELECT password_hash FROM users WHERE id=?').get(alice.user.id)
 assert.ok(row.password_hash.startsWith('scrypt1:'));assert.ok(!row.password_hash.includes(password))
 assert.equal(app.db.prepare('SELECT count(*) AS n FROM sessions WHERE token_hash=?').get(alice.token).n,0)
})

test('simultaneous computers cannot silently overwrite a newer saved revision',async t=>{
 const app=await fixture(t),alice=await app.register(),token=alice.token
 const first=await app.request('/progress',{method:'PUT',token,body:{expectedRevision:0,snapshot:snapshot('first')}});assert.equal(first.data.revision,1)
 const stale=await app.request('/progress',{method:'PUT',token,body:{expectedRevision:0,snapshot:snapshot('stale')}});assert.equal(stale.status,409)
 assert.deepEqual((await app.request('/progress',{token})).data.snapshot,snapshot('first'))
 const second=await app.request('/progress',{method:'PUT',token,body:{expectedRevision:1,snapshot:snapshot('second')}});assert.equal(second.data.revision,2)
 const previous=app.db.prepare('SELECT snapshot FROM progress_history WHERE user_id=? AND revision=1').get(alice.user.id)
 assert.deepEqual(JSON.parse(previous.snapshot),snapshot('first'))
})

test('registration codes, passwords, logout and session expiry are enforced',async t=>{
 let current=Date.now();const code='registration-test-code-2026'
 const app=await fixture(t,{registration:'invite',registrationCode:code,now:()=>current})
 assert.equal((await app.request('/auth/register',{method:'POST',body:{username:'alice',password}})).status,403)
 assert.equal((await app.request('/auth/register',{method:'POST',body:{username:'alice',password:'short',inviteCode:code}})).status,400)
 const alice=await app.register('Alice',{inviteCode:code});assert.equal(alice.user.username,'alice')
 assert.equal((await app.request('/auth/login',{method:'POST',body:{username:'alice',password:'wrong-password'}})).status,401)
 const login=await app.request('/auth/login',{method:'POST',body:{username:'ALICE',password}});assert.equal(login.status,200)
 assert.equal((await app.request('/auth/logout',{method:'POST',token:login.data.token})).status,200)
 assert.equal((await app.request('/auth/me',{token:login.data.token})).status,401)
 current+=31*86400000
 assert.equal((await app.request('/auth/me',{token:alice.token})).status,401)
})

test('password changes verify the old password and revoke every older session',async t=>{
 const app=await fixture(t),alice=await app.register(),nextPassword='Nog een veilige testzin 2026!'
 const change=await app.request('/auth/password',{method:'POST',token:alice.token,body:{currentPassword:password,password:nextPassword}})
 assert.equal(change.status,200);assert.equal((await app.request('/auth/me',{token:alice.token})).status,401)
 assert.equal((await app.request('/auth/me',{token:change.data.token})).status,200)
 assert.equal((await app.request('/auth/login',{method:'POST',body:{username:'alice',password}})).status,401)
 assert.equal((await app.request('/auth/login',{method:'POST',body:{username:'alice',password:nextPassword}})).status,200)
})

test('unapproved origins and malformed snapshots are rejected before saving',async t=>{
 const app=await fixture(t),alice=await app.register()
 assert.equal((await app.request('/health',{origin:'https://unrelated.example'})).status,403)
 const allowed=await app.request('/health',{origin:'https://koalalaw.github.io'});assert.equal(allowed.headers.get('access-control-allow-origin'),'https://koalalaw.github.io')
 assert.equal((await app.request('/progress',{method:'PUT',token:alice.token,body:{expectedRevision:0,snapshot:{version:1,records:{'not-a-learning-record':'secret'}}}})).status,400)
 assert.equal((await app.request('/progress',{method:'PUT',token:alice.token,body:{expectedRevision:-1,snapshot:snapshot('valid')}})).status,400)
 assert.equal((await app.request('/progress',{token:alice.token})).data.revision,0)
})

test('accounts and progress survive a service restart',async t=>{
 const directory=await mkdtemp(join(tmpdir(),'dutch-sync-test-'))
 const app=await fixture(t,{databasePath:join(directory,'progress.sqlite')}),alice=await app.register()
 await app.request('/progress',{method:'PUT',token:alice.token,body:{expectedRevision:0,snapshot:snapshot('saved before restart')}})
 // Open a second connection to the same on-disk database, as a restarted service would.
 const other=await fixture(t,{databasePath:join(directory,'progress.sqlite')})
 assert.deepEqual((await other.request('/progress',{token:alice.token})).data.snapshot,snapshot('saved before restart'))
 await app.close();await other.close();await rm(directory,{recursive:true,force:true})
})

test('profile storage isolates accounts, preserves guest data and refuses unsafe service URLs',()=>{
 const alice='fd119d89-40cf-4b87-8b77-5263599cc842',bob='91e7f4d5-facd-49e1-9965-0b654dfc2cd5'
 assert.notEqual(profileDatabase(alice),profileDatabase(bob));assert.equal(profileDatabase('guest'),'keyval-store');assert.equal(profileDatabase('invalid'),'keyval-store')
 assert.equal(syncDecision(4,true,5),'conflict');assert.equal(syncDecision(4,false,5),'pull');assert.equal(syncDecision(4,true,4),'push');assert.equal(syncDecision(4,false,4),'idle');assert.equal(syncDecision(4,true,3),'server-rollback')
 assert.equal(Object.keys(snapshot('draft').records).length,RECORD_KEYS.length)
 assert.throws(()=>validateSnapshot({version:1,records:{'type-dutch-dict':'not-json'}}))
 assert.throws(()=>normalizeApiURL('http://8.220.72.103/api/v1'))
 assert.throws(()=>normalizeApiURL('https://user:password@example.com'))
 assert.equal(normalizeApiURL('https://sync.example.com/api/v1/'),'https://sync.example.com/api/v1')
 assert.equal(normalizeApiURL('http://127.0.0.1:5580/api/v1'),'http://127.0.0.1:5580/api/v1')
})

test('repeated failed login attempts are rate limited without exposing account existence',async t=>{
 const app=await fixture(t,{rateLimit:true})
 for(let i=0;i<15;i++)assert.equal((await app.request('/auth/login',{method:'POST',body:{username:'notregistered',password:'wrong-password'}})).status,401)
 const limited=await app.request('/auth/login',{method:'POST',body:{username:'notregistered',password:'wrong-password'}})
 assert.equal(limited.status,429);assert.equal(limited.headers.get('retry-after'),'900')
})

test('server deployment archive matches the reviewed source and contains no runtime secrets',async()=>{
 const root=new URL('../',import.meta.url),archive=await readFile(new URL('deploy/type-dutch-sync.tar.gz',root)),expected=(await readFile(new URL('deploy/type-dutch-sync.tar.gz.sha256',root),'utf8')).slice(0,64)
 assert.equal(createHash('sha256').update(archive).digest('hex'),expected)
 const tar=gunzipSync(archive),names=[];let offset=0
 while(offset<tar.length&&tar[offset]){
  const header=tar.subarray(offset,offset+512),name=header.subarray(0,100).toString().replace(/\0.*$/s,''),size=parseInt(header.subarray(124,136).toString().replace(/\0.*$/s,''),8)
  assert.ok(/^(server|shared|deploy)\//.test(name)&&!name.includes('..'))
  assert.ok(!/\.sqlite|registration-code|\/\.env$|node_modules/.test(name))
  assert.deepEqual(tar.subarray(offset+512,offset+512+size),await readFile(new URL(name,root)),name+' must match source')
  names.push(name);offset+=512+Math.ceil(size/512)*512
 }
 assert.equal(names.length,11);assert.equal(new Set(names).size,11);assert.ok(names.includes('deploy/Dockerfile.dockerignore'))
})
