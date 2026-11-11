#!/usr/bin/env bash
set -euo pipefail
umask 077
root=/opt/type-dutch-sync
if [[ "$EUID" -ne 0 || ! -f "$root/.type-dutch-sync-managed" ]]; then
  printf 'Run as root on the server containing the installed Type Dutch sync service.\n' >&2; exit 1
fi
cd "$root/deploy"
api_host=$(sed -n 's/^API_HOST=//p' .env | head -n 1)
if [[ ! "$api_host" =~ ^[a-zA-Z0-9.-]+$ ]]; then printf 'Invalid API_HOST in the existing service configuration.\n' >&2; exit 1; fi
backup="Caddyfile.before-default-sni.$(date +%Y%m%d%H%M%S)"
cp -p Caddyfile "$backup"
if ! grep -q '^[[:space:]]*default_sni[[:space:]]' Caddyfile; then
  stage=$(mktemp ./Caddyfile.sni.XXXXXX)
  trap 'rm -f -- "$stage"' EXIT
  { printf '{\n  default_sni %s\n}\n\n' "$api_host"; cat "$backup"; } > "$stage"
  # Keep the existing file inode: the running proxy bind-mounts this exact file.
  cat "$stage" > Caddyfile
fi
if docker compose exec -T caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile && docker compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile; then
  printf '\nHTTPS configuration reloaded. Checking the normal IP connection with certificate verification:\n'
  curl --fail --silent --show-error --retry 3 --retry-delay 2 --connect-timeout 5 --max-time 12 "https://$api_host/api/v1/health"
  printf '\nIP HTTPS check completed. Existing accounts, invitations and progress are unchanged.\n'
  # Verify the running service using two randomly named, temporary test accounts.
  # The invitation and generated credentials stay inside the backend container.
  docker compose exec -T backend node --input-type=module <<'NODE'
import { randomBytes } from 'node:crypto'
import { DatabaseSync } from 'node:sqlite'
const base='http://127.0.0.1:5580/api/v1',created=[]
async function call(path,method='GET',body,token){
  const response=await fetch(base+path,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined})
  return {status:response.status,data:await response.json()}
}
function require(condition,message){if(!condition)throw Error(message)}
try{
  const users=[]
  for(let index=0;index<2;index++){
    const username='qa_'+randomBytes(8).toString('hex'),password=randomBytes(24).toString('base64url')
    const result=await call('/auth/register','POST',{username,password,inviteCode:process.env.REGISTRATION_CODE||''})
    require(result.status===201,'Temporary account creation failed: '+result.status)
    created.push({id:result.data.user.id,username});users.push(result.data)
  }
  require((await call('/progress')).status===401,'Unauthenticated progress should be rejected')
  const snapshot={version:1,records:{'type-dutch-dict':JSON.stringify({version:4,val:{noteData:{test:'temporary deployment check'}}})}}
  const saved=await call('/progress','PUT',{expectedRevision:0,snapshot},users[0].token)
  require(saved.status===200&&saved.data.revision===1,'Progress save failed')
  const restored=await call('/progress','GET',undefined,users[0].token)
  require(restored.status===200&&restored.data.snapshot.records['type-dutch-dict']===snapshot.records['type-dutch-dict'],'Saved progress did not restore')
  const isolated=await call('/progress?user_id='+users[0].user.id,'GET',undefined,users[1].token)
  require(isolated.status===200&&isolated.data.revision===0,'Accounts are not isolated')
  const stale=await call('/progress','PUT',{expectedRevision:0,snapshot},users[0].token)
  require(stale.status===409,'Concurrent-save protection failed')
  console.log('Live checks passed: account login, private save/restore, isolation and concurrent-save protection.')
}finally{
  if(created.length){
    const db=new DatabaseSync('/data/dutch.sqlite',{timeout:5000});db.exec('PRAGMA foreign_keys=ON')
    for(const user of created)db.prepare('DELETE FROM users WHERE id=? AND username=?').run(user.id,user.username)
    db.close();console.log('Temporary test accounts removed. Existing learner accounts were not modified.')
  }
}
NODE
else
  cat "$backup" > Caddyfile
  docker compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile || true
  printf 'Validation failed; the previous configuration has been restored.\n' >&2; exit 1
fi
