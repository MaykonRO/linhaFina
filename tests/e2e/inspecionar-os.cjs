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
    await page.goto('http://localhost:5180/pages/ordem-servico-form.html', { waitUntil: 'networkidle' })
    fs.writeFileSync('tests/artifacts/os-form.html', await page.content())
    await page.screenshot({ path: 'tests/artifacts/os-form.png', fullPage: true })
    console.log(JSON.stringify({
      texto: (await page.locator('#pagina').innerText()).slice(0, 3000),
      labels: await page.locator('#pagina label').allTextContents(),
      inputs: await page.locator('#pagina input').evaluateAll(ns => ns.map(n => ({ type: n.type, role: n.getAttribute('role'), placeholder: n.placeholder }))),
      errors,
    }, null, 2))
  } finally { await browser.close() }
})().catch(e => { console.error(e); process.exit(1) })
