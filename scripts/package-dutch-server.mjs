import { readFile,writeFile } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import { createHash } from 'node:crypto'
const files=['server/app.mjs','server/database.mjs','server/start.mjs','server/admin.mjs','shared/cloud-protocol.mjs','deploy/Dockerfile','deploy/Dockerfile.dockerignore','deploy/compose.yaml','deploy/Caddyfile','deploy/.env.example','deploy/README.md']
const parts=[]
function octal(buffer,value,offset,length){buffer.write(value.toString(8).padStart(length-1,'0')+'\0',offset,length,'ascii')}
for(const name of files){
 const content=await readFile(name),header=Buffer.alloc(512)
 header.write(name,0,100,'utf8');octal(header,0o644,100,8);octal(header,0,108,8);octal(header,0,116,8);octal(header,content.length,124,12);octal(header,0,136,12)
 header.fill(32,148,156);header[156]=48;header.write('ustar\0',257,6,'ascii');header.write('00',263,2,'ascii')
 const checksum=header.reduce((sum,byte)=>sum+byte,0);header.write(checksum.toString(8).padStart(6,'0')+'\0 ',148,8,'ascii')
 parts.push(header,content,Buffer.alloc((512-content.length%512)%512))
}
parts.push(Buffer.alloc(1024));const archive=gzipSync(Buffer.concat(parts),{level:9}),path='deploy/type-dutch-sync.tar.gz'
await writeFile(path,archive);await writeFile(path+'.sha256',createHash('sha256').update(archive).digest('hex')+'  type-dutch-sync.tar.gz\n')
console.log(`Packaged ${files.length} public source files (${archive.length} bytes), with SHA-256. No credentials or runtime data included.`)
