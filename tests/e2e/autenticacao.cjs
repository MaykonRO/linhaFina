const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')
const globalRoot = execSync('npm.cmd root -g', { encoding: 'utf8' }).trim()
const { chromium } = require(path.join(globalRoot, 'playwright-core'))
const { configuracaoLocal, entrarComoAdmin } = require('./util.cjs')

;(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true })
  const evidencias = { fluxos: [], pageErrors: [], consoleInesperados: [] }
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await context.newPage()
    page.on('pageerror', e => evidencias.pageErrors.push(String(e)))
    page.on('console', m => {
      if (m.type() === 'error' && !m.text().includes('401')) evidencias.consoleInesperados.push(m.text())
    })

    // Sem cookie, uma rota administrativa deve terminar no login real.
    await page.goto('http://localhost:5180/pages/clientes.html', { waitUntil: 'networkidle' })
    await page.waitForURL(/login\.html/)
    evidencias.fluxos.push('rota-protegida-redirecionou-para-login')

    // Senha errada não cria sessão.
    const config = configuracaoLocal()
    await page.getByLabel(/^E-mail/).fill(config.APP_ADMIN_EMAIL)
    await page.getByLabel(/^Senha/).fill('senha-incorreta-para-teste')
    let espera = page.waitForResponse(r => r.request().method() === 'POST' && new URL(r.url()).pathname === '/api/autenticacao/entrar')
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    const invalida = await espera
    if (invalida.status() !== 401) throw new Error(`Senha inválida retornou ${invalida.status()}, esperado 401`)
    evidencias.fluxos.push('senha-invalida-retornou-401')

    await entrarComoAdmin(page)
    await page.getByText(config.APP_ADMIN_NAME || 'Administracao Local', { exact: true }).first().waitFor()
    evidencias.fluxos.push('login-valido-e-identidade-restaurada')

    await page.goto('http://localhost:5180/pages/clientes.html', { waitUntil: 'networkidle' })
    await page.getByText(config.APP_ADMIN_NAME || 'Administracao Local', { exact: true }).first().waitFor()
    evidencias.fluxos.push('sessao-preservada-entre-documentos-html')

    await page.locator('.perfil-botao').click()
    espera = page.waitForResponse(r => r.request().method() === 'POST' && new URL(r.url()).pathname === '/api/autenticacao/sair')
    await page.getByRole('menuitem', { name: 'Sair', exact: true }).click()
    const logout = await espera
    if (logout.status() !== 204) throw new Error(`Logout retornou ${logout.status()}, esperado 204`)
    await page.waitForURL(/login\.html/)
    evidencias.fluxos.push('logout-http-204')

    await page.goto('http://localhost:5180/pages/clientes.html', { waitUntil: 'networkidle' })
    await page.waitForURL(/login\.html/)
    evidencias.fluxos.push('rota-bloqueada-apos-logout')
    if (evidencias.pageErrors.length || evidencias.consoleInesperados.length) throw new Error('Erros inesperados no navegador')
    fs.writeFileSync('tests/artifacts/autenticacao-resultado.json', JSON.stringify(evidencias, null, 2))
    console.log(JSON.stringify(evidencias, null, 2))
  } finally {
    await browser.close()
  }
})().catch(error => { console.error(error); process.exit(1) })
