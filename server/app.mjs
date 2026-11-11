import { createServer } from 'node:http'
import { scrypt,randomBytes,randomUUID,createHash,timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { openDatabase,readProgress,writeProgress } from './database.mjs'
import { normalizeUsername,validUsername,validPassword,validateSnapshot,MAX_SNAPSHOT_BYTES } from '../shared/cloud-protocol.mjs'

const derive=promisify(scrypt),hashToken=value=>createHash('sha256').update(value).digest('hex')
export async function hashPassword(password){const salt=randomBytes(16).toString('hex');const hash=await derive(password,salt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024});return 'scrypt1:'+salt+':'+hash.toString('hex')}
export async function verifyPassword(password,encoded){
  const [,salt,hex]=encoded.split(':');if(!salt||!hex)return false
  const wanted=Buffer.from(hex,'hex'),actual=await derive(password,salt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024})
  return wanted.length===actual.length&&timingSafeEqual(wanted,actual)
}
function equalSecret(a,b){const aa=createHash('sha256').update(a).digest(),bb=createHash('sha256').update(b).digest();return timingSafeEqual(aa,bb)}

export async function createSyncServer({databasePath='data/dutch.sqlite',origins=['https://koalalaw.github.io'],registration='invite',registrationCode='',trustProxy=false,rateLimit=true,now=()=>Date.now()}={}) {
  if(!['open','invite','closed'].includes(registration)||registration==='invite'&&registrationCode.length<16)throw Error('Configure a registration code with at least 16 characters, or explicitly select open/closed registration.')
  const db=openDatabase(databasePath),dummy=await hashPassword(randomBytes(32).toString('hex')),buckets=new Map()
  let passwordJobs=0
  function limited(key,max,windowMs){if(!rateLimit)return false;const t=now();let item=buckets.get(key);if(!item&&buckets.size>=20000){for(const [k,v]of buckets)if(v.until<=t)buckets.delete(k);if(buckets.size>=20000)return true}if(!item||item.until<=t){item={count:0,until:t+windowMs};buckets.set(key,item)}return ++item.count>max}
  async function passwordWork(action){if(passwordJobs>=4)throw Object.assign(Error('busy'),{status:503});passwordJobs++;try{return await action()}finally{passwordJobs--}}
  async function body(request,limit){
    if(!String(request.headers['content-type']||'').startsWith('application/json'))throw Object.assign(Error('json_required'),{status:415})
    if(Number(request.headers['content-length'])>limit)throw Object.assign(Error('payload_too_large'),{status:413})
    let size=0,parts=[];for await(const chunk of request){size+=chunk.length;if(size>limit)throw Object.assign(Error('payload_too_large'),{status:413});parts.push(chunk)}
    try{return JSON.parse(Buffer.concat(parts).toString('utf8'))}catch{throw Object.assign(Error('invalid_json'),{status:400})}
  }
  function auth(request){
    const header=String(request.headers.authorization||''),match=/^Bearer ([A-Za-z0-9_-]{43})$/.exec(header)
    if(!match)throw Object.assign(Error('unauthorized'),{status:401})
    const tokenHash=hashToken(match[1]),row=db.prepare('SELECT u.id,u.username,s.expires_at FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=?').get(tokenHash)
    if(!row||row.expires_at<=now())throw Object.assign(Error('unauthorized'),{status:401})
    return {id:row.id,username:row.username,tokenHash}
  }
  function session(user){const token=randomBytes(32).toString('base64url'),expiresAt=now()+30*86400000;db.prepare('DELETE FROM sessions WHERE expires_at<=?').run(now());db.prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)').run(hashToken(token),user.id,expiresAt);return {token,user:{id:user.id,username:user.username},expiresAt}}
  const server=createServer(async(request,response)=>{
    const origin=String(request.headers.origin||'')
    const send=(status,data)=>{response.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});response.end(JSON.stringify(data))}
    try{
      if(origin&&!origins.includes(origin)){send(403,{error:'origin_not_allowed'});return}
      if(origin){response.setHeader('Access-Control-Allow-Origin',origin);response.setHeader('Vary','Origin')}
      if(request.method==='OPTIONS'){response.writeHead(204,{'Access-Control-Allow-Methods':'GET, POST, PUT, OPTIONS','Access-Control-Allow-Headers':'Authorization, Content-Type','Access-Control-Max-Age':'600'});response.end();return}
      const path=new URL(request.url,'http://localhost').pathname
      const ip=trustProxy?String(request.headers['x-dutch-client-ip']||request.socket.remoteAddress):String(request.socket.remoteAddress)
      if(limited('all:'+ip,600,60000)){response.setHeader('Retry-After','60');send(429,{error:'rate_limited'});return}
      if(path==='/api/v1/health'&&request.method==='GET'){send(200,{ok:true,version:1,registration,minPasswordLength:12});return}
      if(['/api/v1/auth/register','/api/v1/auth/login'].includes(path)&&request.method==='POST'){
        const data=await body(request,12000),username=normalizeUsername(data.username)
        if(!validUsername(username)||typeof data.password!=='string'||data.password.length>256){send(400,{error:'invalid_credentials_format'});return}
        if(limited('auth-ip:'+ip,30,15*60000)||limited('auth-user:'+username,15,15*60000)){response.setHeader('Retry-After','900');send(429,{error:'rate_limited'});return}
        if(path.endsWith('/register')){
          if(registration==='closed'||registration==='invite'&&!equalSecret(String(data.inviteCode||''),registrationCode)){send(403,{error:'registration_not_allowed'});return}
          if(!validPassword(data.password)){send(400,{error:'weak_password'});return}
          const passwordHash=await passwordWork(()=>hashPassword(data.password)),user={id:randomUUID(),username}
          try{db.prepare('INSERT INTO users(id,username,password_hash,created_at) VALUES(?,?,?,?)').run(user.id,username,passwordHash,new Date(now()).toISOString())}catch(error){if(String(error.code).includes('CONSTRAINT')||String(error.message).includes('UNIQUE')){send(409,{error:'username_unavailable'});return}throw error}
          send(201,session(user));return
        }
        const user=db.prepare('SELECT id,username,password_hash FROM users WHERE username=?').get(username)
        const valid=await passwordWork(()=>verifyPassword(data.password,user?.password_hash||dummy))
        if(!user||!valid){send(401,{error:'invalid_credentials'});return}
        send(200,session(user));return
      }
      const user=auth(request)
      if(path==='/api/v1/auth/me'&&request.method==='GET'){send(200,{user:{id:user.id,username:user.username}});return}
      if(path==='/api/v1/auth/logout'&&request.method==='POST'){db.prepare('DELETE FROM sessions WHERE token_hash=?').run(user.tokenHash);send(200,{ok:true});return}
      if(path==='/api/v1/auth/password'&&request.method==='POST'){
        if(limited('password:'+user.id,5,15*60000)){send(429,{error:'rate_limited'});return}
        const data=await body(request,12000)
        if(!validPassword(data.password)||typeof data.currentPassword!=='string'||data.currentPassword.length>256){send(400,{error:'weak_password'});return}
        const saved=db.prepare('SELECT password_hash FROM users WHERE id=?').get(user.id)
        if(!await passwordWork(()=>verifyPassword(data.currentPassword,saved.password_hash))){send(401,{error:'invalid_credentials'});return}
        const passwordHash=await passwordWork(()=>hashPassword(data.password))
        db.exec('BEGIN IMMEDIATE');try{db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(passwordHash,user.id);db.prepare('DELETE FROM sessions WHERE user_id=?').run(user.id);const result=session(user);db.exec('COMMIT');send(200,result)}catch(error){db.exec('ROLLBACK');throw error}return
      }
      if(path==='/api/v1/progress'&&request.method==='GET'){send(200,readProgress(db,user.id));return}
      if(path==='/api/v1/progress'&&request.method==='PUT'){
        const data=await body(request,MAX_SNAPSHOT_BYTES+2048)
        if(!Number.isSafeInteger(data.expectedRevision)||data.expectedRevision<0){send(400,{error:'invalid_revision'});return}
        let snapshot;try{snapshot=validateSnapshot(data.snapshot)}catch(error){send(400,{error:error.message==='snapshot_too_large'?'snapshot_too_large':'invalid_snapshot'});return}
        const result=writeProgress(db,user.id,data.expectedRevision,snapshot)
        if(result.conflict){send(409,{error:'revision_conflict',revision:result.revision,updatedAt:result.updatedAt});return}
        send(200,result);return
      }
      send(404,{error:'not_found'})
    }catch(error){send(error.status||500,{error:error.status?error.message:'server_error'})}
  })
  server.requestTimeout=30000;server.headersTimeout=15000;server.keepAliveTimeout=5000
  let closing
  return {server,db,close:()=>closing??=(new Promise(resolve=>{server.close(()=>{db.close();resolve()});server.closeAllConnections()}))}
}
