import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { resolve, sep, extname } from 'node:path'
const root = resolve('.output/public')
const prefix = (process.env.NUXT_APP_BASE_URL || '/Dutch/').replace(/\/$/, '')
const port = Number(process.env.PORT || 5570)
const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.mjs':'text/javascript; charset=utf-8', '.css':'text/css', '.json':'application/json; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.mp3':'audio/mpeg', '.wav':'audio/wav', '.woff2':'font/woff2', '.ico':'image/x-icon' }
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost')
    if (prefix && url.pathname === prefix) { response.writeHead(302,{Location:prefix+'/'}); response.end(); return }
    if (prefix && !url.pathname.startsWith(prefix + '/')) { response.writeHead(404); response.end('Not found'); return }
    const file = resolve(root, '.' + decodeURIComponent(url.pathname.slice(prefix.length)))
    if (file !== root && !file.startsWith(root + sep)) { response.writeHead(403); response.end(); return }
    const target = (await stat(file)).isDirectory() ? resolve(file, 'index.html') : file
    const bytes = await readFile(target)
    response.writeHead(200,{'Content-Type':types[extname(target)] || 'application/octet-stream','Cache-Control':'no-store'})
    response.end(bytes)
  } catch { response.writeHead(404); response.end('Not found') }
})
server.listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}${prefix}/`))
