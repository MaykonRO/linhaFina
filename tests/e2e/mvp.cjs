const { execSync } = require('child_process')
const path = require('path')
const globalRoot = execSync('npm.cmd root -g', { encoding: 'utf8' }).trim()
const { chromium } = require(path.join(globalRoot, 'playwright-core'))
const { FRONTEND_URL, campo, entrarComoAdmin, limparRegistros, resposta, verificarViewport } = require('./util.cjs')

const ids = { clienteId: null, ordemId: null }
const sufixo = Date.now().toString()
const nome = `Cliente MVP ${sufixo}`
const nomeEditado = `${nome} Editado`
const descricao = `Ajuste MVP ${sufixo}`
const hoje = new Date()
const entrega = new Date(hoje)
entrega.setDate(entrega.getDate() + 7)
const iso = (data) => `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`

;(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const evidencias = { fluxos: [], consoleErrors: [], pageErrors: [] }
  try {
    const page = await context.newPage()
    page.on('pageerror', (erro) => evidencias.pageErrors.push(String(erro)))
    page.on('console', (mensagem) => {
      if (mensagem.type() === 'error' && !mensagem.text().includes('401')) evidencias.consoleErrors.push(mensagem.text())
    })

    // Autenticação e proteção de rota.
    await page.goto(`${FRONTEND_URL}/pages/clientes.html`, { waitUntil: 'networkidle' })
    await page.waitForURL(/login\.html/)
    await entrarComoAdmin(page)
    await page.getByRole('heading', { name: /^Boas-vindas/ }).waitFor()
    if (await page.locator('.busca-global, .notificacoes-caixa').count()) throw new Error('Busca global ou notificações ainda estão presentes.')
    evidencias.fluxos.push('rota-protegida-e-login-real')

    // Cliente: criar e ler.
    await page.goto(`${FRONTEND_URL}/pages/clientes.html`, { waitUntil: 'networkidle' })
    await verificarViewport(page, 1440, 900, evidencias.fluxos)
    await page.getByRole('button', { name: 'Nova cliente', exact: true }).first().click()
    let modal = page.getByRole('dialog', { name: 'Nova cliente', exact: true })
    await campo(modal, 'Nome').fill(nome)
    await campo(modal, 'Telefone').fill('(11) 91234-5678')
    await campo(modal, 'E-mail').fill(`mvp-${sufixo}@teste.local`)
    const cliente = await resposta(page, 'POST', '/api/clientes', () => modal.getByRole('button', { name: 'Cadastrar cliente', exact: true }).click())
    ids.clienteId = cliente.id
    await page.getByText(nome, { exact: true }).first().waitFor()
    evidencias.fluxos.push('cliente-criar-e-ler')

    // Cliente: atualizar e ler a alteração.
    await page.getByRole('button', { name: `Editar ${nome}`, exact: true }).click()
    modal = page.getByRole('dialog', { name: 'Editar cliente', exact: true })
    await campo(modal, 'Nome').fill(nomeEditado)
    await resposta(page, 'PUT', `/api/clientes/${cliente.id}`, () => modal.getByRole('button', { name: 'Salvar alterações', exact: true }).click())
    await page.getByText(nomeEditado, { exact: true }).first().waitFor()
    evidencias.fluxos.push('cliente-atualizar-e-ler')

    // OS: criar e ler com o cliente recém-cadastrado.
    await page.goto(`${FRONTEND_URL}/pages/ordem-servico-form.html`, { waitUntil: 'networkidle' })
    const form = page.locator('#pagina')
    await campo(form, 'Cliente').selectOption({ label: nomeEditado })
    await campo(form, 'Descrição do serviço').fill(descricao)
    await campo(form, 'Valor').fill('125,50')
    await campo(form, 'Data de entrada').fill(iso(hoje))
    await campo(form, 'Data prevista para entrega').fill(iso(entrega))
    await campo(form, 'Status').selectOption('pendente')
    const ordem = await resposta(page, 'POST', '/api/ordens-servico', () => form.getByRole('button', { name: 'Salvar OS', exact: true }).click())
    ids.ordemId = ordem.id
    await page.waitForURL(/ordens-servico\.html/)
    await page.getByText(ordem.codigo, { exact: true }).first().waitFor()
    await page.getByText(descricao, { exact: true }).first().waitFor()
    evidencias.fluxos.push('os-criar-e-ler')

    // OS: atualizar e ler a alteração.
    await page.getByRole('link', { name: `Editar OS ${ordem.codigo}`, exact: true }).click()
    await page.waitForURL(/ordem-servico-form\.html\?id=/)
    await campo(form, 'Descrição do serviço').fill(`${descricao} atualizado`)
    await campo(form, 'Valor').fill('150,75')
    await campo(form, 'Status').selectOption('em_andamento')
    await resposta(page, 'PUT', `/api/ordens-servico/${ordem.id}`, () => form.getByRole('button', { name: 'Salvar OS', exact: true }).click())
    await page.waitForURL(/ordens-servico\.html/)
    await page.getByText(`${descricao} atualizado`, { exact: true }).first().waitFor()
    evidencias.fluxos.push('os-atualizar-e-ler')

    // Responsividade das páginas centrais antes da exclusão dos registros.
    for (const rota of ['index.html', 'pages/clientes.html', 'pages/ordens-servico.html', `pages/ordem-servico-form.html?id=${ordem.id}`]) {
      await page.goto(`${FRONTEND_URL}/${rota}`, { waitUntil: 'networkidle' })
      await verificarViewport(page, 390, 844, evidencias.fluxos)
    }
    await page.goto(`${FRONTEND_URL}/index.html`, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Abrir menu de navegação', exact: true }).click()
    await page.getByRole('dialog', { name: 'Menu de navegação', exact: true }).getByRole('link', { name: 'Clientes', exact: true }).waitFor()
    evidencias.fluxos.push('menu-mobile-acessivel')

    // OS: exclusão real pela UI, antes da exclusão do cliente.
    await verificarViewport(page, 1440, 900, evidencias.fluxos)
    await page.goto(`${FRONTEND_URL}/pages/ordens-servico.html`, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: `Excluir OS ${ordem.codigo}`, exact: true }).click()
    let confirmacao = page.getByRole('dialog', { name: 'Excluir ordem de serviço?', exact: true })
    await resposta(page, 'DELETE', `/api/ordens-servico/${ordem.id}`, () => confirmacao.getByRole('button', { name: 'Excluir OS', exact: true }).click())
    ids.ordemId = null
    evidencias.fluxos.push('os-excluir')

    // Cliente: exclusão real depois que não há mais OS vinculada.
    await page.goto(`${FRONTEND_URL}/pages/clientes.html`, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: `Excluir ${nomeEditado}`, exact: true }).click()
    confirmacao = page.getByRole('dialog', { name: 'Excluir cliente?', exact: true })
    await resposta(page, 'DELETE', `/api/clientes/${cliente.id}`, () => confirmacao.getByRole('button', { name: 'Excluir cliente', exact: true }).click())
    ids.clienteId = null
    evidencias.fluxos.push('cliente-excluir')

    if (evidencias.consoleErrors.length || evidencias.pageErrors.length) throw new Error('Foram encontrados erros no navegador.')
    console.log(JSON.stringify(evidencias, null, 2))
  } finally {
    await limparRegistros(context, ids)
    await browser.close()
    console.log('Limpeza E2E concluída: OS antes do cliente.')
  }
})().catch((erro) => {
  console.error(erro)
  process.exit(1)
})
