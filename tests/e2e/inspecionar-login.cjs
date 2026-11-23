const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')
const globalRoot = execSync('npm.cmd root -g', { encoding: 'utf8' }).trim()
const { chromium } = require(path.join(globalRoot, 'playwright-core'))
;(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true })
  try {
    const page = await browser.newPage()
    const errors = []
    page.on('console', m => errors.push(`${m.type()}: ${m.text()}`))
    page.on('pageerror', e => errors.push(String(e)))
    await page.goto('http://localhost:5180/pages/login.html', { waitUntil: 'networkidle' })
    fs.writeFileSync('tests/artifacts/login.html', await page.content())
    console.log(JSON.stringify({ url: page.url(), texto: (await page.locator('body').innerText()).slice(0, 3000), labels: await page.locator('label').allTextContents(), errors }, null, 2))
  } finally { await browser.close() }
})().catch(e => { console.error(e); process.exit(1) })
