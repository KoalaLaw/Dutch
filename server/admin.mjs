import { resolve } from 'node:path'
import { mkdir,chmod } from 'node:fs/promises'
import { backup } from 'node:sqlite'
import { openDatabase } from './database.mjs'
import { hashPassword } from './app.mjs'
import { validPassword,normalizeUsername } from '../shared/cloud-protocol.mjs'
process.umask(0o077)
const directory=resolve(process.env.DATA_DIRECTORY||'data'),db=openDatabase(resolve(directory,'dutch.sqlite'))
try{
 const [command,username]=process.argv.slice(2)
 if(command==='users')console.log(JSON.stringify(db.prepare('SELECT username,created_at FROM users ORDER BY created_at').all(),null,2))
 else if(command==='backup'){
  const folder=resolve(directory,'backups');await mkdir(folder,{recursive:true,mode:0o700})
  const target=resolve(folder,'dutch-'+new Date().toISOString().replace(/[:.]/g,'-')+'.sqlite')
  await backup(db,target);await chmod(target,0o600);console.log('Backup saved: '+target)
 }else if(command==='reset-password'&&username){
  if(process.stdin.isTTY)throw Error('Read the new password silently in your shell, then pipe it to this command through stdin. Do not put passwords in arguments.')
  let password='';for await(const chunk of process.stdin){password+=chunk.toString();if(password.length>258)throw Error('Password is too long.')}
  password=password.replace(/\r?\n$/,'');if(!validPassword(password))throw Error('Password must have 12–256 characters.')
  const user=db.prepare('SELECT id FROM users WHERE username=?').get(normalizeUsername(username));if(!user)throw Error('User not found.')
  const hash=await hashPassword(password);db.exec('BEGIN IMMEDIATE');try{db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(hash,user.id);db.prepare('DELETE FROM sessions WHERE user_id=?').run(user.id);db.exec('COMMIT')}catch(error){db.exec('ROLLBACK');throw error}
  console.log('Password updated; previous sessions revoked.')
 }else throw Error('Usage: node server/admin.mjs users | backup | reset-password USERNAME')
}finally{db.close()}
