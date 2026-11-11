// The same validation runs in the browser and in the private sync service.
export const PROFILE_KEY = 'type-dutch-active-profile-v1'
export const SESSION_KEY = 'type-dutch-account-session-v1'
export const SYNC_META_KEY = '__dutch_cloud_sync_meta_v1__'
export const RECORD_KEYS = ['type-dutch-dict','type-dutch-setting','TypeDutchPracticeWord','TypeDutchPracticeArticle','PracticeSaveSentence']
export const MAX_SNAPSHOT_BYTES = 8 * 1024 * 1024

export function normalizeUsername(value) { return typeof value === 'string' ? value.trim().toLowerCase() : '' }
export function validUsername(value) { return /^[a-z0-9][a-z0-9_.-]{2,31}$/.test(value) }
export function validPassword(value) { return typeof value === 'string' && value.length >= 12 && value.length <= 256 }
export function validProfile(value) { return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value) ? value.toLowerCase() : 'guest' }
export function profileDatabase(value) { const id=validProfile(value);return id==='guest'?'keyval-store':'type-dutch-account-'+id }
export function validateSnapshot(value) {
  if (!value || value.version !== 1 || !value.records || Array.isArray(value.records) || typeof value.records !== 'object') throw Error('invalid_snapshot')
  if (Object.keys(value).some(key=>!['version','records'].includes(key)) || Object.keys(value.records).some(key=>!RECORD_KEYS.includes(key))) throw Error('invalid_snapshot')
  const records={}
  for (const key of RECORD_KEYS) {
    const raw=value.records[key]??null
    if(raw!==null){
      if(typeof raw!=='string')throw Error('invalid_snapshot')
      const parsed=JSON.parse(raw)
      if(!parsed||typeof parsed!=='object'||Array.isArray(parsed)||!Number.isInteger(parsed.version)||!Object.hasOwn(parsed,'val'))throw Error('invalid_snapshot')
    }
    records[key]=raw
  }
  const snapshot={version:1,records}
  if(new TextEncoder().encode(JSON.stringify(snapshot)).length>MAX_SNAPSHOT_BYTES)throw Error('snapshot_too_large')
  return snapshot
}
export function sameSnapshot(a,b) { return JSON.stringify(validateSnapshot(a))===JSON.stringify(validateSnapshot(b)) }
export function hasSnapshotData(snapshot) { return RECORD_KEYS.some(key=>snapshot?.records?.[key]!==null&&snapshot?.records?.[key]!==undefined) }
export function syncDecision(localRevision,dirty,remoteRevision) {
  if(!Number.isSafeInteger(localRevision)||localRevision<0||!Number.isSafeInteger(remoteRevision)||remoteRevision<0)throw Error('invalid_revision')
  if(remoteRevision<localRevision)return 'server-rollback'
  if(remoteRevision>localRevision)return dirty?'conflict':'pull'
  return dirty?'push':'idle'
}
export function normalizeApiURL(raw) {
  if(typeof raw!=='string'||!raw.trim())return ''
  const url=new URL(raw.trim())
  if(url.username||url.password||url.search||url.hash)throw Error('invalid_api_url')
  if(url.protocol!=='https:'&&!(url.protocol==='http:'&&['127.0.0.1','localhost','[::1]'].includes(url.hostname)))throw Error('https_required')
  return url.href.replace(/\/$/,'')
}
