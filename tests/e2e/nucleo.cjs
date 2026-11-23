const { execSync, execFileSync } = require('child_process')
const path = require('path')
const fs = require('fs')
const globalRoot = execSync('npm.cmd root -g', { encoding: 'utf8' }).trim()
const { chromium } = require(path.join(globalRoot, 'playwright-core'))
const { entrarComoAdmin } = require('./util.cjs')

const ids = { clienteId: null, servicoId: null, funcionariaId: null, ordemId: null }
const evidencias = { fluxos: [], consoleErrors: [], pageErrors: [], axe: [] }
const sufixo = Date.now().toString().slice(-8)
const nomeCliente = `Cliente E2E ${sufixo}`
const nomeServico = `Servico E2E ${sufixo}`
const nomeFuncionaria = `Funcionaria E2E ${sufixo}`

function campo(scope, rotulo) {
  const label = scope.locator('label').filter({ hasText: new RegExp(`^${rotulo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\*?$`) }).first()
  return label.locator('..').locator('input, textarea, select').first()
}

async function respostaPost(page, caminho, acao) {
  const espera = page.waitForResponse(r => r.request().method() === 'POST' && new URL(r.url()).pathname === caminho)
  await acao()
  const response = await espera
  if (response.status() >= 400) throw new Error(`${caminho}: HTTP ${response.status()} — ${await response.text()}`)
  return response.json()
}

function limparRegistros() {
  const psql = path.resolve('.tools/postgresql/pgsql/bin/psql.exe')
  const senha = fs.readFileSync('backend/data/.postgres-password', 'utf8').trim()
  const numerico = valor => {
    if (!valor || !/^\d+$/.test(String(valor))) return null
    return String(valor)
  }
  const ordem = numerico(ids.ordemId)
  const cliente = numerico(ids.clienteId)
  const servico = numerico(ids.servicoId)
  const funcionaria = numerico(ids.funcionariaId)
  const sql = ['BEGIN']
  if (ordem) {
    sql.push(`DELETE FROM pagamentos WHERE ordem_servico_id=${ordem}`)
    sql.push(`DELETE FROM ordens_servico WHERE id=${ordem}`)
  }
  if (cliente) {
    sql.push(`DELETE FROM fichas_medidas WHERE cliente_id=${cliente}`)
    sql.push(`DELETE FROM clientes WHERE id=${cliente}`)
    sql.push(`DELETE FROM pessoas WHERE id=${cliente}`)
  }
  if (funcionaria) {
    sql.push(`DELETE FROM funcionarias WHERE id=${funcionaria}`)
    sql.push(`DELETE FROM pessoas WHERE id=${funcionaria}`)
  }
  if (servico) sql.push(`DELETE FROM servicos WHERE id=${servico}`)
  sql.push('COMMIT')
  execFileSync(psql, ['-h', 'localhost', '-p', '5432', '-U', 'linhafina', '-d', 'linhafina', '-v', 'ON_ERROR_STOP=1', '-c', sql.join('; ')], {
    env: { ...process.env, PGPASSWORD: senha }, stdio: 'pipe', encoding: 'utf8',
  })
}

;(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true })
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await context.newPage()
    page.on('console', m => {
      if (m.type() !== 'error') return
      if (m.text().includes('401')) evidencias.verificacoes401AntesDoLogin = (evidencias.verificacoes401AntesDoLogin ?? 0) + 1
      else evidencias.consoleErrors.push(m.text())
    })
    page.on('pageerror', e => evidencias.pageErrors.push(String(e)))
    await entrarComoAdmin(page)

    // Cliente: leitura, formulário e resposta real.
    await page.goto('http://localhost:5180/pages/clientes.html', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Nova cliente', exact: true }).first().click()
    const modalCliente = page.getByRole('dialog', { name: 'Nova cliente', exact: true })
    await campo(modalCliente, 'Nome').fill(nomeCliente)
    await campo(modalCliente, 'Telefone').fill('(11) 91234-5678')
    await campo(modalCliente, 'E-mail').fill(`e2e-${sufixo}@teste.local`)
    await campo(modalCliente, 'Cidade').fill('São Paulo')
    const cliente = await respostaPost(page, '/api/clientes', () => modalCliente.getByRole('button', { name: 'Cadastrar cliente', exact: true }).click())
    ids.clienteId = cliente.id
    await page.getByText(nomeCliente, { exact: true }).first().waitFor()
    evidencias.fluxos.push({ fluxo: 'cliente.criar', id: cliente.id, telefone: cliente.telefone })

    // Serviço: criação e alternância real de situação.
    await page.goto('http://localhost:5180/pages/servicos.html', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Novo serviço', exact: true }).first().click()
    const modalServico = page.getByRole('dialog', { name: 'Novo serviço', exact: true })
    await campo(modalServico, 'Nome').fill(nomeServico)
    await campo(modalServico, 'Categoria').selectOption({ label: 'Ajustes' })
    await campo(modalServico, 'Preço de referência').fill('120,00')
    await campo(modalServico, 'Tempo estimado').fill('3')
    await campo(modalServico, 'Descrição').fill('Serviço criado pelo teste E2E')
    const servico = await respostaPost(page, '/api/servicos', () => modalServico.getByRole('button', { name: 'Cadastrar serviço', exact: true }).click())
    ids.servicoId = servico.id
    await page.getByText(nomeServico, { exact: true }).first().waitFor()
    await page.getByRole('button', { name: `Desativar ${nomeServico}`, exact: true }).click()
    await page.getByRole('button', { name: `Ativar ${nomeServico}`, exact: true }).waitFor()
    await page.getByRole('button', { name: `Ativar ${nomeServico}`, exact: true }).click()
    await page.getByRole('button', { name: `Desativar ${nomeServico}`, exact: true }).waitFor()
    evidencias.fluxos.push({ fluxo: 'servico.criar-e-alternar', id: servico.id })

    // Funcionária: herança Pessoa/Funcionaria usada pela própria UI.
    await page.goto('http://localhost:5180/pages/equipe.html', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Nova funcionária', exact: true }).first().click()
    const modalFuncionaria = page.getByRole('dialog', { name: 'Nova funcionária', exact: true })
    await campo(modalFuncionaria, 'Nome').fill(nomeFuncionaria)
    await campo(modalFuncionaria, 'Cargo').fill('Costureira de teste')
    await campo(modalFuncionaria, 'Especialidade').fill('Ajustes')
    const funcionaria = await respostaPost(page, '/api/funcionarias', () => modalFuncionaria.getByRole('button', { name: 'Cadastrar', exact: true }).click())
    ids.funcionariaId = funcionaria.id
    await page.getByText(nomeFuncionaria, { exact: true }).first().waitFor()
    evidencias.fluxos.push({ fluxo: 'funcionaria.criar', id: funcionaria.id, tipo: funcionaria.tipo })

    // OS: associa cliente, serviço e funcionária e confirma cálculo da API.
    await page.goto('http://localhost:5180/pages/ordem-servico-form.html', { waitUntil: 'networkidle' })
    const form = page.locator('#pagina')
    const comboCliente = campo(form, 'Cliente')
    await comboCliente.fill(nomeCliente)
    await page.getByRole('option', { name: new RegExp(nomeCliente) }).click()
    await campo(form, 'Tipo de serviço').selectOption({ label: nomeServico })
    await campo(form, 'Tipo de peça').fill('Vestido E2E')
    await campo(form, 'Descrição da peça').fill('Vestido criado pelo teste de integração')
    await campo(form, 'Valor do serviço').fill('120,00')
    const hoje = new Date()
    const iso = data => data.toISOString().slice(0, 10)
    await campo(form, 'Data de entrada').fill(iso(hoje))
    await campo(form, 'Previsão de entrega').fill(iso(new Date(hoje.getTime() + 7 * 86400000)))
    await campo(form, 'Funcionária responsável').selectOption({ label: nomeFuncionaria })
    await page.getByLabel('Pedido urgente', { exact: true }).check()
    const previsao = await respostaPost(page, '/api/ordens-servico/previsao', () => form.getByRole('button', { name: 'Calcular previsão', exact: true }).click())
    if (!previsao.dataPrevistaEntrega || previsao.horasServico !== 24) throw new Error(`Previsão inválida: ${JSON.stringify(previsao)}`)
    evidencias.fluxos.push({ fluxo: 'ordem.prever-prazo', previsao })
    const ordem = await respostaPost(page, '/api/ordens-servico', () => form.getByRole('button', { name: 'Salvar OS', exact: true }).click())
    ids.ordemId = ordem.id
    if (Number(ordem.valorFinal) !== 144) throw new Error(`Valor final esperado 144; recebido ${ordem.valorFinal}`)
    await page.waitForURL(/ordens-servico\.html/)
    await page.getByText(ordem.codigo, { exact: true }).first().waitFor()
    evidencias.fluxos.push({ fluxo: 'ordem.criar', id: ordem.id, codigo: ordem.codigo, valorFinal: ordem.valorFinal })

    // Avanço pelo drawer existente.
    await page.getByRole('button', { name: `Detalhes da OS ${ordem.codigo}`, exact: true }).click()
    const drawer = page.locator('.drawer-painel')
    const hrefPdf = await drawer.getByRole('link', { name: 'Baixar PDF', exact: true }).getAttribute('href')
    const respostaPdf = await page.request.get(hrefPdf)
    const bytesPdf = await respostaPdf.body()
    if (respostaPdf.status() !== 200 || bytesPdf.subarray(0, 4).toString() !== '%PDF') throw new Error('PDF inválido no download da OS')
    evidencias.fluxos.push({ fluxo: 'ordem.exportar-pdf', bytes: bytesPdf.length })
    const avancada = await respostaPost(page, `/api/ordens-servico/${ordem.id}/avancar-status`, () => drawer.getByRole('button', { name: 'Avançar etapa', exact: true }).click())
    if (avancada.status !== 'producao') throw new Error(`Status esperado producao; recebido ${avancada.status}`)
    evidencias.fluxos.push({ fluxo: 'ordem.avancar-status', status: avancada.status })

    await page.goto('http://localhost:5180/pages/clientes.html', { waitUntil: 'networkidle' })
    await page.screenshot({ path: 'tests/artifacts/nucleo-final.png', fullPage: true })
    await page.addScriptTag({ path: path.join(globalRoot, 'axe-core', 'axe.min.js') })
    const axe = await page.evaluate(async () => window.axe.run(document, { resultTypes: ['violations'] }))
    evidencias.axe = axe.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.length }))
    evidencias.overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
    console.log('EVIDENCIAS DO NAVEGADOR', JSON.stringify({ consoleErrors: evidencias.consoleErrors, pageErrors: evidencias.pageErrors }, null, 2))
    if (evidencias.consoleErrors.length || evidencias.pageErrors.length) throw new Error('Foram encontrados erros no navegador')
    fs.writeFileSync('tests/artifacts/e2e-resultado.json', JSON.stringify({ ...evidencias, registros: ids }, null, 2))
    console.log(JSON.stringify(evidencias, null, 2))
  } finally {
    await browser.close()
    limparRegistros()
    console.log('Limpeza dos registros E2E concluída.')
  }
})().catch(error => {
  fs.writeFileSync('tests/artifacts/e2e-falha.txt', String(error.stack || error))
  console.error(error)
  process.exit(1)
})
