import { createStore,get as rawGet,set as rawSet,setMany,update as rawUpdate,del as rawDel } from 'idb-keyval'
import { PROFILE_KEY,SYNC_META_KEY,RECORD_KEYS,validProfile,profileDatabase,validateSnapshot } from '../../../shared/cloud-protocol.mjs'

// Fixed for this page's lifetime. Late writes from an old tab cannot enter a new user's database.
export const activeProfile=validProfile(typeof localStorage==='undefined'?'guest':localStorage.getItem(PROFILE_KEY))
const stores=new Map<string,ReturnType<typeof createStore>>()
export function profileStore(profile=activeProfile){const name=profileDatabase(profile);if(!stores.has(name))stores.set(name,createStore(name,'keyval'));return stores.get(name)!}
const listeners=new Set<()=>void>()
export interface CloudMeta { revision:number;dirty:boolean;generation:number;lastSyncAt?:string }
export const emptyCloudMeta=():CloudMeta=>({revision:0,dirty:false,generation:0})
export async function cloudMeta(){return await rawGet<CloudMeta>(SYNC_META_KEY,profileStore())??emptyCloudMeta()}
export async function updateCloudMeta(change:(value:CloudMeta)=>CloudMeta){await rawUpdate(SYNC_META_KEY,value=>change(value??emptyCloudMeta()),profileStore())}
export async function markCloudDirty(){if(activeProfile==='guest')return;await updateCloudMeta(value=>({...value,dirty:true,generation:value.generation+1}));for(const listener of listeners)listener()}
export function onLocalChange(listener:()=>void){listeners.add(listener);return ()=>listeners.delete(listener)}
export function get<T=any>(key:IDBValidKey){return rawGet<T>(key,profileStore())}
export async function set(key:IDBValidKey,value:any){await rawSet(key,value,profileStore());if(RECORD_KEYS.includes(String(key)))await markCloudDirty()}
export async function del(key:IDBValidKey){await rawDel(key,profileStore());if(RECORD_KEYS.includes(String(key)))await markCloudDirty()}
export async function update<T=any>(key:IDBValidKey,updater:(value:T|undefined)=>T){await rawUpdate(key,updater,profileStore());if(RECORD_KEYS.includes(String(key)))await markCloudDirty()}
export async function readProfileSnapshot(profile=activeProfile){
 const records:Record<string,string|null>={}
 for(const key of RECORD_KEYS){const value=await rawGet(key,profileStore(profile));records[key]=value==null?null:typeof value==='string'?value:JSON.stringify(value)}
 return validateSnapshot({version:1,records})
}
export async function installProfileSnapshot(snapshot:any,meta:CloudMeta){
 const checked=validateSnapshot(snapshot)
 await setMany([...RECORD_KEYS.map(key=>[key,checked.records[key]] as [IDBValidKey,any]),[SYNC_META_KEY,meta]],profileStore())
}
export async function backupProfileSnapshot(snapshot:any){
 const key='__dutch_cloud_safety_backups__'
 await rawUpdate(key,(saved:any[])=>[...(Array.isArray(saved)?saved:[]),{at:new Date().toISOString(),snapshot}].slice(-5),profileStore())
}
export async function readProfileSafetyBackups(){return (await rawGet<Array<{at:string;snapshot:any}>>('__dutch_cloud_safety_backups__',profileStore())??[]).filter(item=>item.snapshot?.records?.['type-dutch-dict']).reverse()}
