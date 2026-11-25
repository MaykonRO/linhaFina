const fs = require('fs')
const path = require('path')

const RAIZ = path.resolve(__dirname, '../..')
const FRONTEND_URL = process.env.LF_E2E_FRONTEND_URL || 'http://localhost:5180'
const API_URL = process.env.LF_E2E_API_URL || 'http://localhost:8080/api'

function configuracaoLocal() {
  if (process.env.LF_E2E_ADMIN_EMAIL && process.env.LF_E2E_ADMIN_PASSWORD) {
    return {
      APP_ADMIN_EMAIL: process.env.LF_E2E_ADMIN_EMAIL,
      APP_ADMIN_PASSWORD: process.env.LF_E2E_ADMIN_PASSWORD,
    }
  }
  const arquivo = path.join(RAIZ, 'backend/.env')
  const valores = {}
  for (const linha of fs.readFileSync(arquivo, 'utf8').split(/\r?\n/)) {
    const indice = linha.indexOf('=')
    if (indice > 0) valores[linha.slice(0, indice)] = linha.slice(indice + 1).trim()
  }
  if (!valores.APP_ADMIN_EMAIL || !valores.APP_ADMIN_PASSWORD) {
    throw new Error('Defina APP_ADMIN_EMAIL e APP_ADMIN_PASSWORD no backend/.env existente.')
  }
  return valores
}

async function entrarComoAdmin(page) {
  const config = configuracaoLocal()
  await page.goto(`${FRONTEND_URL}/pages/login.html`, { waitUntil: 'networkidle' })
  await page.getByLabel(/^E-mail/).fill(config.APP_ADMIN_EMAIL)
  await page.getByLabel(/^Senha/).fill(config.APP_ADMIN_PASSWORD)
  const espera = page.waitForResponse((r) => r.request().method() === 'POST' && new URL(r.url()).pathname === '/api/autenticacao/entrar')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  const response = await espera
  if (response.status() !== 200) throw new Error(`Login administrativo falhou: HTTP ${response.status()}`)
  await page.waitForURL(/index\.html/)
  await page.waitForLoadState('networkidle')
}

function campo(scope, rotulo) {
  const escapado = rotulo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const label = scope.locator('label').filter({ hasText: new RegExp(`^${escapado}\\s*\\*?$`) }).first()
  return label.locator('..').locator('input, textarea, select').first()
}

async function resposta(page, metodo, caminho, acao) {
  const espera = page.waitForResponse((r) => r.request().method() === metodo && new URL(r.url()).pathname === caminho)
  await acao()
  const response = await espera
  if (response.status() >= 400) throw new Error(`${metodo} ${caminho}: HTTP ${response.status()} — ${await response.text()}`)
  if (response.status() === 204) return null
  try { return await response.json() } catch { return null }
}

async function verificarViewport(page, largura, altura, fluxos) {
  await page.setViewportSize({ width: largura, height: altura })
  // Aguarda media queries e transições do shell estabilizarem após o resize.
  await page.waitForFunction(() => document.documentElement.scrollWidth <= window.innerWidth + 1, { timeout: 5000 })
    .catch(async () => {
      const medidas = await page.evaluate(() => ({
        viewport: window.innerWidth,
        documento: document.documentElement.scrollWidth,
      }))
      throw new Error(`Overflow horizontal em ${largura}px na URL ${page.url()}: ${JSON.stringify(medidas)}`)
    })
  fluxos.push(`viewport-${largura}px-sem-overflow:${new URL(page.url()).pathname}`)
}

async function limparRegistros(context, ids) {
  const erros = []
  // A ordem é intencional: remover a dependência antes do cliente.
  for (const [chave, recurso] of [['ordemId', 'ordens-servico'], ['clienteId', 'clientes']]) {
    const id = ids[chave]
    if (!id) continue
    try {
      const response = await context.request.delete(`${API_URL}/${recurso}/${encodeURIComponent(id)}`)
      if (!response.ok() && response.status() !== 404) erros.push(`${recurso}/${id}: HTTP ${response.status()}`)
    } catch (erro) {
      erros.push(`${recurso}/${id}: ${erro.message}`)
    }
  }
  if (erros.length) throw new Error(`Falha na limpeza E2E: ${erros.join('; ')}`)
}

module.exports = { API_URL, FRONTEND_URL, campo, configuracaoLocal, entrarComoAdmin, limparRegistros, resposta, verificarViewport }
