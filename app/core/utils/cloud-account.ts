import { reactive } from 'vue'
import config from '../../data/cloud-config.json'
import { PROFILE_KEY,SESSION_KEY,validProfile,normalizeApiURL,syncDecision,sameSnapshot,hasSnapshotData,validateSnapshot } from '../../../shared/cloud-protocol.mjs'
import { activeProfile,cloudMeta,updateCloudMeta,markCloudDirty,onLocalChange,readProfileSnapshot,installProfileSnapshot,backupProfileSnapshot,emptyCloudMeta } from './local-db'

type User={id:string;username:string}
type Session={token:string;user:User;expiresAt:number}
type Remote={revision:number;snapshot:any;updatedAt:string|null}
type Status='guest'|'local'|'synced'|'pending'|'syncing'|'offline'|'conflict'|'expired'|'error'
export const accountState=reactive({ready:false,configured:false,switching:false,user:null as User|null,status:'guest' as Status,message:'',lastSyncAt:'',revision:0,guestAvailable:false,registration:'closed',conflict:null as Remote|null})
let apiURL='',session:Session|null=null,boot:Promise<void>|undefined,flight:Promise<void>|undefined,timer:ReturnType<typeof setTimeout>|undefined
let flushBridge:(()=>Promise<void>)|undefined,pendingStores=false,pendingSince=0
const messages:Record<string,string>={invalid_credentials:'用户名或密码不正确。',invalid_credentials_format:'用户名使用 3–32 位小写字母、数字、点、横线或下划线。',username_unavailable:'这个用户名已被使用，请换一个。',weak_password:'密码需要 12–256 个字符。',registration_not_allowed:'注册未开放或注册码不正确。',rate_limited:'尝试次数较多，请稍后重试。',unauthorized:'登录已过期，请重新登录；本机进度仍会保留。',https_required:'同步服务需要使用 HTTPS。',snapshot_too_large:'学习数据超过同步容量，请先导出备份并精简自建内容。',invalid_snapshot:'学习数据格式无法同步，请导出备份后检查。',server_error:'服务器暂时无法处理请求，本机进度已保留。',busy:'服务器正忙，请稍后再试。',account_changed:'账号已在另一个标签页切换，请刷新页面。'}
export function accountError(error:any){return messages[error?.code]||error?.message||'暂时无法连接同步服务，本机进度已保留。'}
async function api(path:string,options:{method?:string;body?:any;public?:boolean}={}){
 if(!apiURL)throw Error('同步服务还未配置。')
 if(!options.public&&(localStorage.getItem(PROFILE_KEY)!==activeProfile||readSession()?.token!==session?.token))throw Object.assign(Error(messages.account_changed),{code:'account_changed'})
 let response:Response
 try{response=await fetch(apiURL+path,{method:options.method||'GET',headers:{...(options.body?{'Content-Type':'application/json'}:{}),...(!options.public&&session?{Authorization:'Bearer '+session.token}:{})},body:options.body?JSON.stringify(options.body):undefined,cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(8000)})}catch{throw Object.assign(Error('暂时无法连接同步服务，本机进度已保留。'),{code:'network'})}
 let data:any;try{data=await response.json()}catch{throw Error('同步服务响应异常，本机进度已保留。')}
 if(!response.ok)throw Object.assign(Error(messages[data.error]||'同步未完成，请稍后重试。'),{code:data.error,status:response.status,data})
 return data
}
function readSession():Session|null{try{const value=JSON.parse(localStorage.getItem(SESSION_KEY)||'null');return value&&validProfile(value.user?.id)!=='guest'&&/^[A-Za-z0-9_-]{43}$/.test(value.token)&&typeof value.user.username==='string'?value:null}catch{return null}}
function reloadProfile(profile:string){accountState.switching=true;localStorage.setItem(PROFILE_KEY,profile);window.location.hash='/account';window.location.reload()}
function saveSession(value:Session){localStorage.setItem(SESSION_KEY,JSON.stringify(value));session=value;reloadProfile(value.user.id)}
function fail(error:any){accountState.status=error.code==='unauthorized'?'expired':error.code==='network'?'offline':'error';accountState.message=accountError(error)}
function schedule(){clearTimeout(timer);if(!accountState.user||!accountState.configured||accountState.conflict)return;pendingSince||=Date.now();if(accountState.status!=='syncing')accountState.status='pending';timer=setTimeout(()=>{pendingSince=0;void synchronize().catch(()=>{})},Math.max(0,Math.min(1600,10000-(Date.now()-pendingSince))))}
export function registerStoreFlush(callback:()=>Promise<void>){flushBridge=callback}
export function notifyAccountMutation(){if(!accountState.user||!accountState.ready)return;pendingStores=true;void markCloudDirty().catch(fail);schedule()}
async function flushStores(){if(pendingStores&&flushBridge){pendingStores=false;try{await flushBridge()}catch(error){pendingStores=true;throw error}}}
function supportedMedia(snapshot:any){
 const raw=snapshot.records['type-dutch-dict'];if(!raw)return
 const data=JSON.parse(raw).val
 if(data?.article?.bookList?.some((book:any)=>book.articles?.some((article:any)=>article.audioFileId&&!article.audioSrc)))throw Error('自建文章含有仅保存在本机的音频。请先导出完整备份；内置课程可以正常同步。')
}
async function acknowledge(remote:Remote,generation:number){
 const at=remote.updatedAt||new Date().toISOString()
 await updateCloudMeta(meta=>({...meta,revision:remote.revision,dirty:meta.generation!==generation,lastSyncAt:at}))
 const meta=await cloudMeta();accountState.revision=meta.revision;accountState.lastSyncAt=at;accountState.status=meta.dirty?'pending':'synced';accountState.message=''
 if(meta.dirty)schedule()
}
async function reconcile(remote:Remote,initial=false){
 const meta=await cloudMeta(),local=await readProfileSnapshot(),decision=syncDecision(meta.revision,meta.dirty,remote.revision)
 if(meta.dirty&&remote.snapshot&&sameSnapshot(local,remote.snapshot)){await acknowledge(remote,meta.generation);return}
 if(decision==='conflict'||decision==='server-rollback'){
  accountState.conflict=remote;accountState.status='conflict';accountState.message=decision==='server-rollback'?'服务器版本比本机旧，请选择要保留的版本。':'另一台电脑也保存了进度，请选择使用哪一份。';return
 }
 if(decision==='pull'){
  if(!remote.snapshot)throw Error('服务器进度为空，本机记录已保留。')
  await backupProfileSnapshot(local);await installProfileSnapshot(remote.snapshot,{...emptyCloudMeta(),revision:remote.revision,lastSyncAt:remote.updatedAt||undefined})
  accountState.revision=remote.revision;accountState.lastSyncAt=remote.updatedAt||'';accountState.status='synced'
  if(!initial){accountState.switching=true;window.location.reload()}return
 }
 if(decision==='push'){
  supportedMedia(local)
  try{const result=await api('/progress',{method:'PUT',body:{expectedRevision:meta.revision,snapshot:local}});await acknowledge({...result,snapshot:local},meta.generation)}
  catch(error:any){if(error.code==='revision_conflict'){accountState.conflict=await api('/progress');accountState.status='conflict';accountState.message='另一台电脑刚刚保存了更新，请选择进度版本。'}else throw error}return
 }
 accountState.status='synced';accountState.revision=meta.revision;accountState.lastSyncAt=meta.lastSyncAt||'';accountState.message=''
}
export async function synchronize(){
 if(flight)return flight
 if(!session||!accountState.configured||accountState.switching)return
 if(accountState.conflict)return
 clearTimeout(timer)
 flight=(async()=>{accountState.status='syncing';await flushStores();await reconcile(await api('/progress'))})().catch(error=>{fail(error);throw error}).finally(()=>{flight=undefined})
 return flight
}
export function bootstrapAccount(overrideURL?:string){return boot??=(async()=>{
 try{apiURL=normalizeApiURL(overrideURL||config.apiURL);accountState.configured=!!apiURL;session=readSession()
  if(session&&activeProfile!==session.user.id){reloadProfile(session.user.id);return}
  if(!session&&activeProfile!=='guest'){reloadProfile('guest');return}
  if(session){accountState.user=session.user;accountState.status='local';const meta=await cloudMeta();accountState.revision=meta.revision;accountState.lastSyncAt=meta.lastSyncAt||''}
  if(apiURL){
   void api('/health',{public:true}).then(result=>{accountState.registration=result.registration}).catch(error=>{if(!session)accountState.message=accountError(error)})
   if(session)try{const me=await api('/auth/me');if(me.user.id!==activeProfile)throw Error('账号身份与本机缓存不匹配。');await reconcile(await api('/progress'),true)}catch(error){fail(error)}
  }
  const guest=await readProfileSnapshot('guest');accountState.guestAvailable=hasSnapshotData(guest)
 }catch(error){fail(error)}finally{accountState.ready=true}
 onLocalChange(schedule)
 window.addEventListener('online',()=>{void synchronize().catch(()=>{})})
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)void synchronize().catch(()=>{})})
 window.addEventListener('storage',event=>{if(event.key===PROFILE_KEY&&validProfile(event.newValue)!==activeProfile){accountState.switching=true;void flushStores().finally(()=>window.location.reload())}})
 if((await cloudMeta()).dirty)schedule()
})()}
export async function signIn(username:string,password:string){const result=await api('/auth/login',{method:'POST',body:{username,password},public:true});saveSession(result)}
export async function signUp(username:string,password:string,inviteCode:string){const result=await api('/auth/register',{method:'POST',body:{username,password,inviteCode},public:true});saveSession(result)}
export async function signOut(force=false){
 await flushStores();if(!force){await synchronize();if(accountState.conflict)throw Error('请先处理进度冲突，或选择保留本机副本后退出。');if(['offline','error','expired'].includes(accountState.status))throw Error('云端尚未确认保存。可以稍后重试，或保留本机副本后退出。')}
 try{await api('/auth/logout',{method:'POST'})}catch{/* Retain the account's offline copy; never expose it to the next guest. */}
 localStorage.removeItem(SESSION_KEY);reloadProfile('guest')
}
export async function importGuestProgress(){
 await flushStores();const remote=await api('/progress'),meta=await cloudMeta()
 if(remote.revision||meta.dirty)throw Error('这个账号已有进度，不能直接覆盖。原有访客记录仍保留在访客模式中，可在设置导出。')
 const guest=await readProfileSnapshot('guest');if(!hasSnapshotData(guest))throw Error('此浏览器没有可导入的访客记录。');supportedMedia(guest)
 await backupProfileSnapshot(await readProfileSnapshot());await installProfileSnapshot(guest,{...emptyCloudMeta(),dirty:true,generation:1})
 await synchronize();if(accountState.conflict||accountState.status!=='synced')throw Error('已保留本机导入副本，云端尚未确认，请重试同步。')
 accountState.switching=true;window.location.reload()
}
export async function resolveAccountConflict(source:'local'|'remote'){
 await flushStores();const local=await readProfileSnapshot();await backupProfileSnapshot(local);const latest:Remote=await api('/progress')
 if(source==='remote'){
  if(!latest.snapshot)throw Error('云端没有可恢复的内容。')
  await installProfileSnapshot(latest.snapshot,{...emptyCloudMeta(),revision:latest.revision,lastSyncAt:latest.updatedAt||undefined});accountState.switching=true;window.location.reload();return
 }
 supportedMedia(local);const meta=await cloudMeta()
 try{const result=await api('/progress',{method:'PUT',body:{expectedRevision:latest.revision,snapshot:validateSnapshot(local)}});accountState.conflict=null;await acknowledge({...result,snapshot:local},meta.generation)}catch(error:any){if(error.code==='revision_conflict'){accountState.conflict=await api('/progress');throw Error('云端又有新进度，请重新核对后选择。')}throw error}
}
export async function changeAccountPassword(currentPassword:string,password:string){const result=await api('/auth/password',{method:'POST',body:{currentPassword,password}});localStorage.setItem(SESSION_KEY,JSON.stringify(result));session=result}
