const fs = require('fs')

function configuracaoLocal() {
  const valores = {}
  for (const linha of fs.readFileSync('backend/.env', 'utf8').split(/\r?\n/)) {
    const indice = linha.indexOf('=')
    if (indice > 0) valores[linha.slice(0, indice)] = linha.slice(indice + 1).trim()
  }
  return valores
}

async function entrarComoAdmin(page) {
  const config = configuracaoLocal()
  await page.goto('http://localhost:5180/pages/login.html', { waitUntil: 'networkidle' })
  await page.getByLabel(/^E-mail/).fill(config.APP_ADMIN_EMAIL)
  await page.getByLabel(/^Senha/).fill(config.APP_ADMIN_PASSWORD)
  const espera = page.waitForResponse(r => r.request().method() === 'POST' && new URL(r.url()).pathname === '/api/autenticacao/entrar')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  const response = await espera
  if (response.status() !== 200) throw new Error(`Login administrativo falhou: HTTP ${response.status()}`)
  await page.waitForURL(/index\.html/)
  await page.waitForLoadState('networkidle')
}

module.exports = { configuracaoLocal, entrarComoAdmin }
