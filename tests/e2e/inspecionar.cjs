const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')
const globalRoot = execSync('npm.cmd root -g', { encoding: 'utf8' }).trim()
const { chromium } = require(path.join(globalRoot, 'playwright-core'))

;(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true })
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    const errors = []
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
    page.on('pageerror', e => errors.push(String(e)))
    await page.goto('http://localhost:5180/pages/clientes.html', { waitUntil: 'networkidle' })
    await page.screenshot({ path: 'tests/artifacts/clientes-inicial.png', fullPage: true })
    fs.writeFileSync('tests/artifacts/clientes-inicial.html', await page.content())
    console.log(JSON.stringify({
      titulo: await page.title(),
      botoes: await page.locator('button').evaluateAll(nodes => nodes.map(n => ({ texto: n.textContent.trim(), aria: n.getAttribute('aria-label') }))),
      inputs: await page.locator('input').evaluateAll(nodes => nodes.map(n => ({ type: n.type, placeholder: n.placeholder, aria: n.getAttribute('aria-label'), id: n.id }))),
      erros: errors,
    }, null, 2))
    await page.getByRole('button', { name: 'Nova cliente', exact: true }).first().click()
    const modal = page.getByRole('dialog', { name: 'Nova cliente', exact: true })
    await modal.waitFor()
    await page.screenshot({ path: 'tests/artifacts/cliente-modal.png', fullPage: true })
    console.log('MODAL', JSON.stringify(await modal.locator('input, textarea').evaluateAll(nodes => nodes.map(n => ({ tag: n.tagName, type: n.type, placeholder: n.placeholder, id: n.id, name: n.name, aria: n.getAttribute('aria-label') }))), null, 2))
  } finally {
    await browser.close()
  }
})().catch(error => { console.error(error); process.exit(1) })
