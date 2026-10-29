/**
 * Servidor estático mínimo do Linha Fina — Node.js puro, sem dependências.
 *
 *   node server.mjs            (http://localhost:5180)
 *   PORTA=9000 node server.mjs (porta customizada)
 *
 * Servifica index.html na raiz e as páginas de pages/, css/, js/ e assets/.
 * Para o futuro back-end Spring Boot: sirva esta pasta como recursos estáticos
 * ou mantenha este servidor apenas para desenvolvimento local.
 */

import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'

const PORTA = Number(process.env.PORTA || 5180)
const RAIZ = process.cwd()

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
}

const servidor = createServer(async (requisicao, resposta) => {
  let caminho = '/'
  try {
    caminho = decodeURIComponent(new URL(requisicao.url, `http://${requisicao.headers.host}`).pathname)
    if (caminho === '/' || caminho === '') caminho = '/index.html'
    // Navegadores pedem /favicon.ico automaticamente; serve o SVG da marca.
    if (caminho === '/favicon.ico') caminho = '/assets/favicon.svg'

    // Impede navegação fora da raiz do projeto.
    const alvo = normalize(join(RAIZ, caminho))
    if (!alvo.startsWith(RAIZ)) {
      resposta.writeHead(403).end('Proibido')
      return
    }

    const conteudo = await readFile(alvo)
    resposta.writeHead(200, {
      'Content-Type': TIPOS[extname(alvo).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    })
    resposta.end(conteudo)
  } catch (erro) {
    if (erro.code === 'ENOENT') {
      // Redireciona para a página 404 do próprio sistema. O caminho é
      // relativo à profundidade da URL pedida, para funcionar também quando
      // a pasta é servida em um subdiretório (ex.: /linha-fina/).
      const profundidade = caminho.split('/').filter(Boolean).length
      const prefixo = '../'.repeat(profundidade)
      resposta.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' })
      resposta.end(
        '<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=' +
          `${prefixo}pages/nao-encontrada.html">`,
      )
    } else {
      console.error(`Erro interno em ${requisicao.url}:`, erro.message)
      resposta.writeHead(500).end('Erro interno')
    }
  }
})

servidor.listen(PORTA, () => {
  console.log(`Linha Fina rodando em http://localhost:${PORTA}`)
})
