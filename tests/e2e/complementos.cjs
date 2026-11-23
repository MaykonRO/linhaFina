const { execSync, execFileSync } = require('child_process')
const path = require('path')
const fs = require('fs')
const globalRoot = execSync('npm.cmd root -g', { encoding: 'utf8' }).trim()
const { chromium } = require(path.join(globalRoot, 'playwright-core'))
const { entrarComoAdmin } = require('./util.cjs')

const ids = { clienteId: null, servicoId: null, orcamentoId: null, ordemId: null, pecaId: null, imagemUrl: null }
const evidencias = { fluxos: [], pageErrors: [], consoleInesperados: [] }

function campo(scope, rotulo) {
  const label = scope.locator('label').filter({ hasText: new RegExp(`^${rotulo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\*?$`) }).first()
  return label.locator('..').locator('input, textarea, select').first()
}
async function postApi(page, caminho, data = null) {
  const response = await page.request.post(`http://localhost:8080/api${caminho}`, data === null ? {} : { data })
  if (response.status() >= 400) throw new Error(`${caminho}: ${response.status()} ${await response.text()}`)
  return response.status() === 204 ? null : response.json()
}
async function respostaPost(page, caminho, acao) {
  const espera = page.waitForResponse(r => r.request().method() === 'POST' && new URL(r.url()).pathname === caminho)
  await acao()
  const response = await espera
  if (response.status() >= 400) throw new Error(`${caminho}: HTTP ${response.status()} ${await response.text()}`)
  return response.status() === 204 ? null : response.json()
}
function limpar() {
  if (ids.imagemUrl?.startsWith('/api/vitrine/imagens/')) {
    const diretorio = path.resolve('backend/uploads')
    const nome = path.basename(ids.imagemUrl)
    const arquivo = path.resolve(diretorio, nome)
    if (arquivo.startsWith(diretorio) && /^[a-f0-9-]{36}\.(png|jpg|webp)$/.test(nome)) fs.rmSync(arquivo, { force: true })
  }
  const psql = path.resolve('.tools/postgresql/pgsql/bin/psql.exe')
  const senha = fs.readFileSync('backend/data/.postgres-password', 'utf8').trim()
  const n = v => v && /^\d+$/.test(String(v)) ? String(v) : null
  const cliente = n(ids.clienteId), servico = n(ids.servicoId), orcamento = n(ids.orcamentoId), ordem = n(ids.ordemId), peca = n(ids.pecaId)
  const sql = ['BEGIN']
  if (orcamento) sql.push(`DELETE FROM orcamentos WHERE id=${orcamento}`)
  if (ordem) { sql.push(`DELETE FROM pagamentos WHERE ordem_servico_id=${ordem}`); sql.push(`DELETE FROM ordens_servico WHERE id=${ordem}`) }
  if (peca) sql.push(`DELETE FROM pecas_vitrine WHERE id=${peca}`)
  if (cliente) { sql.push(`DELETE FROM fichas_medidas WHERE cliente_id=${cliente}`); sql.push(`DELETE FROM clientes WHERE id=${cliente}`); sql.push(`DELETE FROM pessoas WHERE id=${cliente}`) }
  if (servico) sql.push(`DELETE FROM servicos WHERE id=${servico}`)
  sql.push('COMMIT')
  execFileSync(psql, ['-h','localhost','-U','linhafina','-d','linhafina','-v','ON_ERROR_STOP=1','-c',sql.join('; ')], { env: { ...process.env, PGPASSWORD: senha }, stdio: 'pipe' })
}

;(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true })
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await context.newPage()
    page.on('pageerror', e => evidencias.pageErrors.push(String(e)))
    page.on('console', m => { if (m.type() === 'error' && !m.text().includes('401')) evidencias.consoleInesperados.push(m.text()) })
    await entrarComoAdmin(page)
    const sufixo = Date.now().toString().slice(-8)
    const cliente = await postApi(page, '/clientes', { nome: `Cliente Complemento ${sufixo}`, telefone: '11912345678', email: `comp-${sufixo}@teste.local` })
    ids.clienteId = cliente.id
    const servico = await postApi(page, '/servicos', { nome: `Servico Complemento ${sufixo}`, categoria: 'Ajustes', descricao: '', precoReferencia: 150, tempoEstimadoDias: 2, ativo: true })
    ids.servicoId = servico.id

    await page.goto('http://localhost:5180/pages/orcamentos.html', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Novo orçamento', exact: true }).first().click()
    const modalOrc = page.getByRole('dialog', { name: 'Novo orçamento', exact: true })
    await campo(modalOrc, 'Cliente').selectOption(cliente.id)
    await campo(modalOrc, 'Serviço').selectOption(servico.id)
    await campo(modalOrc, 'Descrição').fill('Vestido para validar orçamento e conversão')
    await campo(modalOrc, 'Valor estimado').fill('150,00')
    const validade = new Date(); validade.setDate(validade.getDate() + 10)
    await campo(modalOrc, 'Validade').fill(validade.toISOString().slice(0, 10))
    const orcamento = await respostaPost(page, '/api/orcamentos', () => modalOrc.getByRole('button', { name: 'Criar orçamento', exact: true }).click())
    ids.orcamentoId = orcamento.id
    await page.getByRole('button', { name: 'Aprovar orçamento', exact: true }).click()
    const modalAprovar = page.getByRole('dialog', { name: 'Aprovar orçamento?', exact: true })
    await respostaPost(page, `/api/orcamentos/${orcamento.id}/aprovar`, () => modalAprovar.getByRole('button', { name: 'Aprovar', exact: true }).click())
    await page.getByRole('button', { name: 'Converter em OS', exact: true }).click()
    const modalConverter = page.getByRole('dialog', { name: 'Converter em OS?', exact: true })
    const os = await respostaPost(page, `/api/orcamentos/${orcamento.id}/converter`, () => modalConverter.getByRole('button', { name: 'Converter em OS', exact: true }).click())
    ids.ordemId = os.id
    if (Number(os.valorFinal) !== 150) throw new Error(`Conversão retornou valor ${os.valorFinal}`)
    await page.waitForURL(/ordens-servico\.html\?os=/)
    evidencias.fluxos.push({ fluxo: 'orcamento.aprovar-converter', orcamentoId: orcamento.id, osId: os.id, codigo: os.codigo })

    await page.goto('http://localhost:5180/pages/vitrine.html', { waitUntil: 'networkidle' })
    const nomePeca = `Peca E2E ${sufixo}`
    await page.getByRole('button', { name: 'Nova peça', exact: true }).click()
    const modalPeca = page.getByRole('dialog', { name: 'Nova peça', exact: true })
    await campo(modalPeca, 'Nome').fill(nomePeca)
    await campo(modalPeca, 'Categoria').selectOption({ label: 'Vestidos' })
    await campo(modalPeca, 'Descrição').fill('Peça criada pelo teste E2E')
    await campo(modalPeca, 'Preço').fill('250,00')
    await campo(modalPeca, 'Arte').selectOption({ label: 'Vestido longo' })
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64')
    fs.writeFileSync('tests/artifacts/peca-e2e.png', png)
    await campo(modalPeca, 'Foto da peça (opcional)').setInputFiles('tests/artifacts/peca-e2e.png')
    const esperaUpload = page.waitForResponse(r => r.request().method() === 'POST' && /\/api\/vitrine\/pecas\/\d+\/imagem$/.test(new URL(r.url()).pathname))
    const peca = await respostaPost(page, '/api/vitrine/pecas', () => modalPeca.getByRole('button', { name: 'Cadastrar peça', exact: true }).click())
    ids.pecaId = peca.id
    const respostaUpload = await esperaUpload
    if (respostaUpload.status() !== 200) throw new Error(`Upload retornou ${respostaUpload.status()}`)
    const pecaComFoto = await respostaUpload.json()
    ids.imagemUrl = pecaComFoto.imagemUrl
    const imagemHttp = await page.request.get(`http://localhost:8080${ids.imagemUrl}`)
    if (imagemHttp.status() !== 200 || (await imagemHttp.body()).length !== png.length) throw new Error('Imagem enviada não foi recuperada corretamente')
    evidencias.fluxos.push({ fluxo: 'vitrine.upload-multipart', imagemUrl: ids.imagemUrl, bytes: png.length })
    await page.getByRole('button', { name: `Destacar ${nomePeca}`, exact: true }).click()
    await page.getByRole('button', { name: `Remover destaque de ${nomePeca}`, exact: true }).waitFor()
    await page.getByRole('switch', { name: 'Exibir na vitrine', exact: true }).click()
    await page.getByRole('switch', { name: 'Exibir na vitrine', exact: true }).waitFor()
    evidencias.fluxos.push({ fluxo: 'vitrine.criar-destaque-ocultar', pecaId: peca.id })
    fs.rmSync('tests/artifacts/peca-e2e.png', { force: true })

    const publico = await browser.newContext()
    const paginaPublica = await publico.newPage()
    const chamadas = []
    paginaPublica.on('request', r => { if (r.url().includes(':8080')) chamadas.push(r.url()) })
    await paginaPublica.goto('http://localhost:5180/pages/vitrine-publica.html', { waitUntil: 'networkidle' })
    if (chamadas.some(url => !url.includes('/vitrine/publica') && !url.includes('/configuracoes'))) throw new Error(`Página pública chamou API administrativa: ${chamadas}`)
    if (await paginaPublica.getByText(nomePeca, { exact: true }).count()) throw new Error('Peça inativa apareceu na galeria pública')
    evidencias.fluxos.push({ fluxo: 'vitrine.publica-sem-admin-e-sem-inativa', chamadas })
    await publico.close()

    if (evidencias.pageErrors.length || evidencias.consoleInesperados.length) throw new Error(JSON.stringify(evidencias))
    fs.writeFileSync('tests/artifacts/complementos-resultado.json', JSON.stringify(evidencias, null, 2))
    console.log(JSON.stringify(evidencias, null, 2))
  } finally {
    await browser.close()
    limpar()
    console.log('Limpeza dos complementos E2E concluída.')
  }
})().catch(e => { console.error(e); process.exit(1) })
