const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')
const globalRoot = execSync('npm.cmd root -g', { encoding: 'utf8' }).trim()
const { chromium } = require(path.join(globalRoot, 'playwright-core'))
const { entrarComoAdmin } = require('./util.cjs')

;(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true })
  const evidencias = { fluxos: [], pageErrors: [], consoleInesperados: [] }
  let original = 20
  let page
  try {
    page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    page.on('pageerror', e => evidencias.pageErrors.push(String(e)))
    page.on('console', m => { if (m.type() === 'error' && !m.text().includes('401')) evidencias.consoleInesperados.push(m.text()) })
    await entrarComoAdmin(page)
    const antes = await page.request.get('http://localhost:8080/api/configuracoes')
    original = (await antes.json()).taxaUrgenciaPadrao
    await page.goto('http://localhost:5180/pages/configuracoes.html', { waitUntil: 'networkidle' })

    const input = page.getByLabel('Percentual padrão de urgência', { exact: true })
    const novaTaxa = original === 25 ? 20 : 25
    await input.fill(String(novaTaxa))
    const secao = input.locator('xpath=ancestor::section[1]')
    let espera = page.waitForResponse(r => r.request().method() === 'PUT' && new URL(r.url()).pathname === '/api/configuracoes')
    await secao.getByRole('button', { name: 'Salvar', exact: true }).click()
    let response = await espera
    if (response.status() !== 200 || (await response.json()).taxaUrgenciaPadrao !== novaTaxa) throw new Error('Taxa não foi persistida pela UI')
    evidencias.fluxos.push({ fluxo: 'configuracoes.taxa-ui-persistiu', valor: novaTaxa })
    await page.getByText('Configurações salvas.', { exact: true }).waitFor()

    await input.fill(String(original))
    espera = page.waitForResponse(r => r.request().method() === 'PUT' && new URL(r.url()).pathname === '/api/configuracoes')
    await secao.getByRole('button', { name: 'Salvar', exact: true }).click()
    response = await espera
    if (response.status() !== 200 || (await response.json()).taxaUrgenciaPadrao !== original) throw new Error('Taxa original não foi restaurada')
    evidencias.fluxos.push({ fluxo: 'configuracoes.taxa-restaurada', valor: original })
    await page.getByText('Configurações salvas.', { exact: true }).waitFor()

    const data = new Date(); data.setDate(data.getDate() + 7)
    const iso = data.toISOString().slice(0, 10)
    await page.getByLabel('Adicionar folga', { exact: true }).fill(iso)
    await page.getByRole('button', { name: 'Adicionar', exact: true }).click()
    const secaoFolga = page.getByLabel('Adicionar folga', { exact: true }).locator('xpath=ancestor::section[1]')
    espera = page.waitForResponse(r => r.request().method() === 'PUT' && new URL(r.url()).pathname === '/api/configuracoes')
    await secaoFolga.getByRole('button', { name: 'Salvar', exact: true }).click()
    response = await espera
    if (response.status() !== 200 || !(await response.json()).folgas.includes(iso)) throw new Error('Folga não foi persistida pela UI')
    evidencias.fluxos.push({ fluxo: 'configuracoes.folga-ui-persistiu', data: iso })

    const restaurar = await page.request.put('http://localhost:8080/api/configuracoes', { data: { folgas: [] } })
    if (restaurar.status() !== 200) throw new Error('Não foi possível limpar a folga de teste')
    evidencias.fluxos.push('configuracoes.folga-de-teste-removida')
    if (evidencias.pageErrors.length || evidencias.consoleInesperados.length) throw new Error(JSON.stringify(evidencias))
    fs.writeFileSync('tests/artifacts/configuracoes-resultado.json', JSON.stringify(evidencias, null, 2))
    console.log(JSON.stringify(evidencias, null, 2))
  } finally {
    if (page) await page.request.put('http://localhost:8080/api/configuracoes', { data: { folgas: [], taxaUrgenciaPadrao: original } }).catch(() => {})
    await browser.close()
  }
})().catch(e => { console.error(e); process.exit(1) })
