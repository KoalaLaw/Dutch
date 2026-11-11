import { resolve } from 'node:path'
import { createSyncServer } from './app.mjs'

process.umask(0o077)
const app=await createSyncServer({
  databasePath:resolve(process.env.DATA_DIRECTORY||'data','dutch.sqlite'),
  origins:(process.env.ALLOWED_ORIGINS||'https://koalalaw.github.io').split(',').map(value=>value.trim()).filter(Boolean),
  registration:process.env.REGISTRATION_MODE||'invite',registrationCode:process.env.REGISTRATION_CODE||'',
  trustProxy:process.env.TRUST_PROXY==='1',
})
const port=Number(process.env.PORT||5580),host=process.env.HOST||'127.0.0.1'
app.server.listen(port,host,()=>console.log('Type Dutch sync API listening on '+host+':'+port))
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,async()=>{await app.close();process.exit(0)})
