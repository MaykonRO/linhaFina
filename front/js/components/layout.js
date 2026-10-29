/**
 * Shell administrativo: sidebar + header com busca global, notificações e
 * perfil.
 *
 * Cada página administrativa contém no HTML:
 *   <aside class="sidebar"></aside>
 *   <div class="conteudo"><header class="header"></header><main …></main></div>
 * e chama montarLayout('id-da-pagina') no controlador.
 */

import { icone } from './icons.js'
import { h, aoClicarFora, aoEscape, substituirFilhos } from './dom.js'
import { avatar, badge } from './ui.js'
import { toast } from './toast.js'
import { assinarStore, obterDb } from '../app/store.js'
import { assinarSessao, sessaoAtual, sairSessao } from '../app/sessao.js'
import { caminho, navegar } from '../app/rotas.js'
import { notificacoes, cliente as buscarCliente } from '../services/estatisticas.js'
import { debounce } from './dom.js'
import { barraStatus } from './estados.js'
import { textoSeguro, contemTexto } from '../utils/format.js'

const CHAVE_RECOLHIDA = 'linha-fina:sidebar-recolhida'

const GRUPOS = [
  {
    rotulo: null,
    itens: [
      { pagina: 'dashboard', rotulo: 'Visão geral', icone: 'LayoutDashboard', exata: true },
      { pagina: 'agenda', rotulo: 'Agenda', icone: 'CalendarDays' },
    ],
  },
  {
    rotulo: 'Atendimento',
    itens: [
      { pagina: 'ordens-servico', rotulo: 'Ordens de serviço', icone: 'ClipboardList', comContador: 'ordens' },
      { pagina: 'orcamentos', rotulo: 'Orçamentos', icone: 'Receipt', comContador: 'orcamentos' },
      { pagina: 'clientes', rotulo: 'Clientes', icone: 'Users' },
    ],
  },
  {
    rotulo: 'Catálogo',
    itens: [
      { pagina: 'servicos', rotulo: 'Serviços', icone: 'Scissors' },
      { pagina: 'vitrine', rotulo: 'Vitrine', icone: 'Store' },
    ],
  },
  {
    rotulo: 'Gestão',
    itens: [
      { pagina: 'equipe', rotulo: 'Equipe', icone: 'UsersRound' },
      { pagina: 'financeiro', rotulo: 'Financeiro', icone: 'Wallet' },
      { pagina: 'relatorios', rotulo: 'Relatórios', icone: 'BarChart3' },
    ],
  },
  {
    rotulo: 'Sistema',
    itens: [{ pagina: 'configuracoes', rotulo: 'Configurações', icone: 'Settings' }],
  },
]

const TRILHAS = {
  dashboard: { grupo: 'Principal', rotulo: 'Visão geral' },
  agenda: { grupo: 'Principal', rotulo: 'Agenda' },
  'ordem-servico-form': { grupo: 'Atendimento', rotulo: 'Nova OS' },
  'ordens-servico': { grupo: 'Atendimento', rotulo: 'Ordens de serviço' },
  orcamentos: { grupo: 'Atendimento', rotulo: 'Orçamentos' },
  clientes: { grupo: 'Atendimento', rotulo: 'Clientes' },
  'cliente-detalhe': { grupo: 'Atendimento', rotulo: 'Perfil da cliente' },
  servicos: { grupo: 'Catálogo', rotulo: 'Serviços' },
  vitrine: { grupo: 'Catálogo', rotulo: 'Vitrine' },
  equipe: { grupo: 'Gestão', rotulo: 'Equipe' },
  financeiro: { grupo: 'Gestão', rotulo: 'Financeiro' },
  relatorios: { grupo: 'Gestão', rotulo: 'Relatórios' },
  configuracoes: { grupo: 'Sistema', rotulo: 'Configurações' },
}

/**
 * Páginas filhas: ao abrir uma delas, o item do menu-pai continua destacado.
 * `exata: true` no item desliga esse comportamento (usado no dashboard).
 */
const PAGINA_PAI = {
  'ordem-servico-form': 'ordens-servico',
  'cliente-detalhe': 'clientes',
}

const ROTAS_NOTIFICACAO = {
  '/ordens-servico': 'ordens-servico',
  '/agenda': 'agenda',
  '/orcamentos': 'orcamentos',
}

/* ------------------------------------------------------------------ */
/* Marca                                                               */
/* ------------------------------------------------------------------ */

const SIMBOLO_MARCA = `<svg viewBox="0 0 32 32" class="marca-simbolo" aria-hidden="true">
  <path d="M5 20 C 11 20, 10 11, 16 11 C 22 11, 21 20, 27 20" fill="none"
        stroke="var(--lf-primary)" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="1 6"></path>
  <path d="M27 20 L 23.4 26.6" stroke="var(--lf-azure)" stroke-width="1.8" stroke-linecap="round"></path>
  <circle cx="27" cy="20" r="2" fill="var(--lf-azure)"></circle>
</svg>`

export function marcaLinhaFina({ tamanho = 'md' } = {}) {
  return h(
    'span',
    { class: `marca ${tamanho === 'lg' ? 'marca--lg' : ''}` },
    h('span', { class: 'marca-simbolo-caixa', innerHTML: SIMBOLO_MARCA }),
    h(
      'span',
      { class: 'marca-textos' },
      h(
        'span',
        { class: 'marca-nome' },
        'Linha ',
        h('span', { class: 'marca-nome-destaque' }, 'Fina')
      ),
      h('span', {
        class: 'marca-linha',
        innerHTML: `<svg viewBox="0 0 96 4" preserveAspectRatio="none" aria-hidden="true">
          <line x1="1" y1="2" x2="95" y2="2" stroke="var(--lf-primary)" stroke-width="2"
                stroke-linecap="round" stroke-dasharray="6 6" opacity="0.55"></line>
        </svg>`,
      })
    )
  )
}

export function marcaIcone() {
  return h('span', { class: 'marca-icone-caixa', innerHTML: SIMBOLO_MARCA })
}

/* ------------------------------------------------------------------ */
/* Sidebar                                                             */
/* ------------------------------------------------------------------ */

function lerRecolhida() {
  try {
    return localStorage.getItem(CHAVE_RECOLHIDA) === '1'
  } catch {
    return false
  }
}

function contadoresDoDb(db) {
  return {
    ordens: db?.ordens.filter((o) => ['aguardando', 'producao', 'prova', 'pronta'].includes(o.status)).length,
    orcamentos: db?.orcamentos.filter((o) => o.status === 'pendente').length,
  }
}

function construirNavegacao(paginaAtual, onNavegar) {
  const db = obterDb()
  const contadores = contadoresDoDb(db)

  return GRUPOS.map((grupo) =>
    h(
      'div',
      { class: 'nav-grupo' },
      grupo.rotulo && h('p', { class: 'nav-grupo-rotulo' }, grupo.rotulo),
      grupo.rotulo && h('div', { class: 'stitch stitch--soft nav-grupo-divisor', 'aria-hidden': 'true' }),
      h(
        'ul',
        { class: 'nav-lista' },
        grupo.itens.map((item) => {
          const ativo = item.exata
            ? paginaAtual === item.pagina
            : paginaAtual === item.pagina || PAGINA_PAI[paginaAtual] === item.pagina
          const contador = item.comContador ? contadores[item.comContador] ?? 0 : 0
          return h(
            'li',
            {},
            h(
              'a',
              {
                href: caminho(item.pagina),
                class: `nav-item${ativo ? ' nav-item--ativo' : ''}`,
                title: item.rotulo,
                'aria-current': ativo ? 'page' : null,
                onClick: () => onNavegar?.(),
              },
              h('span', { class: 'nav-item-icone', innerHTML: icone(item.icone, 'ic ic--18') }),
              h('span', { class: 'nav-item-rotulo' }, item.rotulo),
              contador > 0 && h('span', { class: `nav-item-contador tnum${ativo ? ' nav-item-contador--ativo' : ''}` }, contador)
            )
          )
        })
      )
    )
  )
}

function montarSidebar(paginaAtual) {
  const alvo = document.querySelector('.sidebar')
  if (!alvo) return null

  const botaoAlternar = h('button', {
    type: 'button',
    class: 'sidebar-alternar',
    'aria-label': lerRecolhida() ? 'Expandir menu lateral' : 'Recolher menu lateral',
    'aria-pressed': lerRecolhida() ? 'true' : 'false',
    onClick: () => {
      const recolhida = !document.body.classList.contains('sidebar-recolhida')
      document.body.classList.toggle('sidebar-recolhida', recolhida)
      try {
        localStorage.setItem(CHAVE_RECOLHIDA, recolhida ? '1' : '0')
      } catch {
        /* sem storage: a preferência vale apenas nesta sessão */
      }
      botaoAlternar.setAttribute('aria-label', recolhida ? 'Expandir menu lateral' : 'Recolher menu lateral')
      botaoAlternar.setAttribute('aria-pressed', recolhida ? 'true' : 'false')
      botaoAlternar.innerHTML = icone(recolhida ? 'PanelLeftOpen' : 'PanelLeftClose', 'ic ic--16')
    },
    innerHTML: icone(lerRecolhida() ? 'PanelLeftOpen' : 'PanelLeftClose', 'ic ic--16'),
  })

  const nav = h('nav', { class: 'sidebar-nav', 'aria-label': 'Navegação principal' })
  function renderizarNavegacao() {
    nav.replaceChildren(...construirNavegacao(paginaAtual))
  }
  renderizarNavegacao()

  alvo.replaceChildren(
    h(
      'div',
      { class: 'sidebar-inner' },
      h(
        'div',
        { class: 'sidebar-cabecalho' },
        h(
          'a',
          {
            href: caminho('dashboard'),
            class: 'sidebar-marca',
            'aria-label': 'Linha Fina — visão geral',
          },
          h('span', { class: 'sidebar-marca--cheia' }, marcaLinhaFina()),
          h('span', { class: 'sidebar-marca--recolhida' }, marcaIcone())
        ),
        botaoAlternar
      ),
      nav,
      h(
        'p',
        { class: 'sidebar-nota' },
        'Front-end sem dados fictícios — a operação real depende da integração com o back-end.'
      )
    )
  )

  return renderizarNavegacao
}

/* ------------------------------------------------------------------ */
/* Gaveta mobile                                                       */
/* ------------------------------------------------------------------ */

function montarGavetaMobile(paginaAtual) {
  let aberta = false
  const painel = h('aside', {
    class: 'gaveta-painel',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-label': 'Menu de navegação',
  })
  const fundo = h('div', { class: 'gaveta-fundo', 'aria-hidden': 'true' })
  const raiz = h('div', { class: 'gaveta-mobile', hidden: '' }, fundo, painel)

  function renderizar() {
    painel.replaceChildren(
      h(
        'div',
        { class: 'sidebar-inner' },
        h(
          'div',
          { class: 'sidebar-cabecalho' },
          h('a', { href: caminho('dashboard'), class: 'sidebar-marca', 'aria-label': 'Linha Fina — visão geral' }, marcaLinhaFina()),
          h('button', {
            type: 'button',
            class: 'sidebar-fechar',
            'aria-label': 'Fechar menu',
            onClick: fechar,
            innerHTML: icone('X', 'ic ic--16'),
          })
        ),
        h('nav', { class: 'sidebar-nav', 'aria-label': 'Navegação principal' }, construirNavegacao(paginaAtual)),
        h('p', { class: 'sidebar-nota' }, 'Front-end sem dados fictícios — a operação real depende da integração com o back-end.')
      )
    )
  }

  function abrir() {
    aberta = true
    renderizar()
    raiz.removeAttribute('hidden')
    requestAnimationFrame(() => raiz.classList.add('gaveta-mobile--aberta'))
    document.body.style.overflow = 'hidden'
  }

  function fechar() {
    if (!aberta) return
    aberta = false
    raiz.classList.remove('gaveta-mobile--aberta')
    document.body.style.overflow = ''
    setTimeout(() => raiz.setAttribute('hidden', ''), 240)
  }

  fundo.addEventListener('click', fechar)
  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && aberta) fechar()
  })

  document.body.append(raiz)
  return { abrir, fechar }
}

/* ------------------------------------------------------------------ */
/* Busca global                                                        */
/* ------------------------------------------------------------------ */

const TIPOS_RESULTADO = {
  cliente: { icone: 'User', rotulo: 'Clientes', classe: 'busca-resultado-icone--ciano' },
  os: { icone: 'ClipboardList', rotulo: 'Ordens de serviço', classe: 'busca-resultado-icone--primary' },
  orcamento: { icone: 'Receipt', rotulo: 'Orçamentos', classe: 'busca-resultado-icone--lilas' },
  servico: { icone: 'Scissors', rotulo: 'Serviços', classe: 'busca-resultado-icone--rosa' },
}

function calcularResultados(termo) {
  const db = obterDb()
  const q = termo.trim().toLowerCase()
  if (!q || q.length < 2 || !db) return []
  const itens = []

  for (const c of db.clientes) {
    if (
      contemTexto(c.nome, q) ||
      contemTexto(c.email, q) ||
      contemTexto(c.cidade, q)
    ) {
      itens.push({
        tipo: 'cliente',
        chave: c.id,
        titulo: c.nome,
        detalhe: c.cidade || c.email,
        pagina: 'cliente-detalhe',
        params: { id: c.id },
      })
    }
  }
  for (const o of db.ordens) {
    const nomeCliente = buscarCliente(db, o.clienteId)?.nome ?? ''
    if (
      contemTexto(o.codigo, q) ||
      contemTexto(o.tipoPeca, q) ||
      contemTexto(o.descricaoPeca, q) ||
      contemTexto(nomeCliente, q)
    ) {
      itens.push({
        tipo: 'os',
        chave: o.id,
        titulo: `${textoSeguro(o.codigo)} — ${textoSeguro(o.tipoPeca)}`,
        detalhe: nomeCliente,
        pagina: 'ordens-servico',
        params: { os: o.id },
      })
    }
  }
  for (const orc of db.orcamentos) {
    if (contemTexto(orc.codigo, q) || contemTexto(orc.descricao, q)) {
      itens.push({
        tipo: 'orcamento',
        chave: orc.id,
        titulo: `${textoSeguro(orc.codigo)} — ${textoSeguro(orc.descricao)}`,
        detalhe: buscarCliente(db, orc.clienteId)?.nome ?? '',
        pagina: 'orcamentos',
      })
    }
  }
  for (const s of db.servicos) {
    if (contemTexto(s.nome, q) || contemTexto(s.categoria, q)) {
      itens.push({
        tipo: 'servico',
        chave: s.id,
        titulo: s.nome,
        detalhe: s.categoria,
        pagina: 'servicos',
      })
    }
  }
  return itens.slice(0, 10)
}

function criarBuscaGlobal({ id = 'busca-global', placeholder = 'Buscar clientes, OS, orçamentos…', autoFocus = false } = {}) {
  let ativo = 0
  let resultados = []

  const lista = h('div', { class: 'busca-global-resultados pop-surface', id: `${id}-lista`, role: 'listbox', hidden: '' })
  const input = h('input', {
    id,
    type: 'search',
    role: 'combobox',
    'aria-expanded': 'false',
    'aria-controls': `${id}-lista`,
    'aria-label': 'Busca global',
    autocomplete: 'off',
    class: 'input-base busca-global-input',
    placeholder,
  })
  const raiz = h('div', { class: 'busca-global' },
    h('span', { class: 'busca-icone', 'aria-hidden': 'true', innerHTML: icone('Search', 'ic ic--16') }),
    input,
    h('kbd', { class: 'busca-atalho' }, 'Ctrl K'),
    lista
  )

  function renderizarResultados() {
    input.setAttribute('aria-expanded', String(resultados.length > 0 && !lista.hidden))
    if (lista.hidden) return
    if (resultados.length === 0) {
      lista.replaceChildren(
        h('p', { class: 'busca-global-vazio' }, `Nada encontrado para “${input.value}”.`)
      )
      return
    }
    lista.replaceChildren(
      ...resultados.map((item, i) => {
        const tipo = TIPOS_RESULTADO[item.tipo]
        return h(
          'button',
          {
            type: 'button',
            role: 'option',
            'aria-selected': String(i === ativo),
            class: `busca-resultado${i === ativo ? ' busca-resultado--ativo' : ''}`,
            onMouseEnter: () => {
              ativo = i
              renderizarResultados()
            },
            onClick: () => abrir(item),
          },
          h('span', { class: `busca-resultado-icone ${tipo.classe}`, innerHTML: icone(tipo.icone, 'ic ic--16') }),
          h(
            'span',
            { class: 'busca-resultado-textos' },
            h('span', { class: 'busca-resultado-titulo' }, item.titulo),
            item.detalhe && h('span', { class: 'busca-resultado-detalhe' }, item.detalhe)
          ),
          h('span', { class: 'busca-resultado-tipo' }, tipo.rotulo),
          i === ativo && h('span', { class: 'busca-resultado-enter', innerHTML: icone('CornerDownLeft', 'ic ic--14') })
        )
      })
    )
  }

  function mostrar() {
    if (input.value.trim().length >= 2) {
      lista.removeAttribute('hidden')
      renderizarResultados()
    }
  }

  function esconder() {
    lista.setAttribute('hidden', '')
    input.setAttribute('aria-expanded', 'false')
  }

  function abrir(item) {
    input.value = ''
    resultados = []
    esconder()
    navegar(item.pagina, item.params)
  }

  input.addEventListener('input', () => {
    resultados = calcularResultados(input.value)
    ativo = 0
    mostrar()
  })
  input.addEventListener('focus', mostrar)
  input.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape') {
      esconder()
      input.blur()
      return
    }
    if (lista.hidden || resultados.length === 0) return
    if (evento.key === 'ArrowDown') {
      evento.preventDefault()
      ativo = Math.min(ativo + 1, resultados.length - 1)
      renderizarResultados()
    } else if (evento.key === 'ArrowUp') {
      evento.preventDefault()
      ativo = Math.max(ativo - 1, 0)
      renderizarResultados()
    } else if (evento.key === 'Enter') {
      evento.preventDefault()
      const item = resultados[ativo]
      if (item) abrir(item)
    }
  })

  aoClicarFora(raiz, true, esconder)

  if (autoFocus) setTimeout(() => input.focus(), 30)

  return raiz
}

function instalarAtalhoBusca() {
  document.addEventListener('keydown', (evento) => {
    if ((evento.metaKey || evento.ctrlKey) && evento.key.toLowerCase() === 'k') {
      evento.preventDefault()
      const campo = document.getElementById('busca-global') ?? document.getElementById('busca-global-mobile')
      campo?.focus()
    }
  })
}

/* ------------------------------------------------------------------ */
/* Notificações                                                        */
/* ------------------------------------------------------------------ */

const ICONES_NOTIFICACAO = {
  atraso: { icone: 'TriangleAlert', classe: 'notificacao-icone--atraso' },
  entrega: { icone: 'CalendarCheck2', classe: 'notificacao-icone--entrega' },
  prova: { icone: 'Shirt', classe: 'notificacao-icone--prova' },
  orcamento: { icone: 'Receipt', classe: 'notificacao-icone--orcamento' },
}

function montarNotificacoes() {
  let aberto = false
  const botaoSino = h('button', {
    type: 'button',
    class: 'botao-icone-cabecalho',
    'aria-haspopup': 'menu',
    'aria-expanded': 'false',
    onClick: () => (aberto ? fechar() : abrir()),
  })
  const menu = h('div', { class: 'menu-pop pop-surface menu-notificacoes', role: 'menu', 'aria-label': 'Notificações', hidden: '' })
  const raiz = h('div', { class: 'notificacoes-caixa' }, botaoSino, menu)

  function itensAtuais() {
    return notificacoes(obterDb() ?? { ordens: [], orcamentos: [] })
  }

  function renderizarSino() {
    const itens = itensAtuais()
    botaoSino.setAttribute('aria-label', `Notificações${itens.length > 0 ? `: ${itens.length > 9 ? '9+' : itens.length} novas` : ''}`)
    substituirFilhos(
      botaoSino,
      h('span', { class: 'sr-only' }, botaoSino.getAttribute('aria-label')),
      h('span', { class: 'ic-caixa', innerHTML: icone('Bell', 'ic ic--18') }),
      itens.length > 0 && h('span', { class: 'notificacoes-contagem tnum' }, itens.length > 9 ? '9+' : itens.length)
    )
  }

  function renderizarMenu() {
    const itens = itensAtuais()
    menu.replaceChildren(
      h(
        'div',
        { class: 'menu-notificacoes-cabecalho' },
        h('p', { class: 'menu-titulo' }, 'Notificações'),
        h('p', { class: 'menu-subtitulo' }, 'Acompanhamento do dia no ateliê')
      ),
      h(
        'div',
        { class: 'menu-notificacoes-lista' },
        itens.length === 0
          ? h('p', { class: 'menu-vazio' }, 'Nenhuma notificação disponível.')
          : h(
              'ul',
              { class: 'menu-lista-dividida' },
              itens.map((item) => {
                const definicao = ICONES_NOTIFICACAO[item.tipo] ?? ICONES_NOTIFICACAO.orcamento
                return h(
                  'li',
                  {},
                  h(
                    'button',
                    {
                      type: 'button',
                      role: 'menuitem',
                      class: 'menu-item-notificacao',
                      onClick: () => {
                        fechar()
                        navegar(ROTAS_NOTIFICACAO[item.rota] ?? 'dashboard')
                      },
                    },
                    h('span', { class: `notificacao-icone ${definicao.classe}`, innerHTML: icone(definicao.icone, 'ic ic--16') }),
                    h(
                      'span',
                      { class: 'notificacao-textos' },
                      h('span', { class: 'notificacao-titulo' }, item.titulo),
                      h('span', { class: 'notificacao-descricao' }, item.descricao)
                    )
                  )
                )
              })
            )
      )
    )
  }

  function abrir() {
    aberto = true
    renderizarMenu()
    menu.removeAttribute('hidden')
    botaoSino.setAttribute('aria-expanded', 'true')
  }

  function fechar() {
    aberto = false
    menu.setAttribute('hidden', '')
    botaoSino.setAttribute('aria-expanded', 'false')
  }

  aoClicarFora(raiz, true, fechar)
  aoEscape(true, () => aberto && fechar())

  renderizarSino()
  return { renderizarSino, raiz }
}

/* ------------------------------------------------------------------ */
/* Perfil                                                              */
/* ------------------------------------------------------------------ */

function montarPerfil() {
  let aberto = false
  const botaoPerfil = h('button', {
    type: 'button',
    class: 'perfil-botao',
    'aria-haspopup': 'menu',
    'aria-expanded': 'false',
    onClick: () => (aberto ? fechar() : abrir()),
  })
  const menu = h('div', { class: 'menu-pop pop-surface menu-perfil', role: 'menu', 'aria-label': 'Menu do perfil', hidden: '' })
  const raiz = h('div', { class: 'perfil-caixa' }, botaoPerfil, menu)

  function renderizarBotao() {
    const sessao = sessaoAtual()
    botaoPerfil.replaceChildren(
      h('span', { class: 'sr-only' }, 'Abrir menu do perfil'),
      avatar({ nome: sessao?.nome ?? 'Equipe', tamanho: 'sm' }),
      h(
        'span',
        { class: 'perfil-identificacao' },
        h('span', { class: 'perfil-nome' }, sessao?.nome ?? 'Linha Fina'),
        h('span', { class: 'perfil-papel' }, sessao?.papelRotulo ?? 'Integração pendente')
      ),
      h('span', { class: 'perfil-seta', innerHTML: icone('ChevronDown', 'ic ic--14') })
    )
  }

  function renderizarMenu() {
    const sessao = sessaoAtual()
    menu.replaceChildren(
      h(
        'div',
        { class: 'menu-perfil-cabecalho' },
        h('p', { class: 'menu-titulo' }, sessao?.nome ?? 'Linha Fina'),
        h('p', { class: 'menu-perfil-email' }, sessao?.email ?? 'Usuário não conectado'),
        badge({ variante: 'neutral', rotulo: 'Integração pendente', classe: 'menu-perfil-selo' })
      ),
      h(
        'div',
        { class: 'menu-conteudo' },
        h(
          'a',
          { href: caminho('configuracoes'), role: 'menuitem', class: 'menu-item', onClick: () => fechar() },
          h('span', { class: 'ic-caixa', innerHTML: icone('Settings', 'ic ic--16') }),
          'Configurações'
        ),
        h(
          'a',
          { href: caminho('vitrine-publica'), role: 'menuitem', class: 'menu-item', onClick: () => fechar() },
          h('span', { class: 'ic-caixa', innerHTML: icone('Store', 'ic ic--16') }),
          'Ver vitrine pública'
        ),
        h('div', { class: 'menu-divisor', 'aria-hidden': 'true' }),
        h(
          'button',
          {
            type: 'button',
            role: 'menuitem',
            class: 'menu-item menu-item--perigo',
            onClick: () => {
              fechar()
              sairSessao()
              toast.info('A sessão real será encerrada quando a autenticação estiver integrada.')
            },
          },
          h('span', { class: 'ic-caixa', innerHTML: icone('LogOut', 'ic ic--16') }),
          'Sair'
        )
      )
    )
  }

  function abrir() {
    aberto = true
    renderizarMenu()
    menu.removeAttribute('hidden')
    botaoPerfil.setAttribute('aria-expanded', 'true')
    botaoPerfil.querySelector('.perfil-seta')?.classList.add('perfil-seta--aberta')
  }

  function fechar() {
    aberto = false
    menu.setAttribute('hidden', '')
    botaoPerfil.setAttribute('aria-expanded', 'false')
    botaoPerfil.querySelector('.perfil-seta')?.classList.remove('perfil-seta--aberta')
  }

  aoClicarFora(raiz, true, fechar)
  aoEscape(true, () => aberto && fechar())

  renderizarBotao()
  return { renderizarBotao, raiz }
}

/* ------------------------------------------------------------------ */
/* Montagem completa                                                   */
/* ------------------------------------------------------------------ */

export function montarLayout(paginaAtual) {
  const renderizarNavegacao = montarSidebar(paginaAtual)
  const gaveta = montarGavetaMobile(paginaAtual)
  instalarAtalhoBusca()

  const trilha = TRILHAS[paginaAtual]

  const notificacoesMenu = montarNotificacoes()
  const perfilMenu = montarPerfil()

  const header = document.querySelector('.header')
  if (header) {
    const buscaMobileAtiva = { valor: false }
    const buscaMobile = criarBuscaGlobal({ id: 'busca-global-mobile', placeholder: 'Buscar…', autoFocus: true })
    const areaBuscaMobile = h('div', { class: 'header-busca-mobile', hidden: '' }, buscaMobile)

    header.replaceChildren(
      h(
        'div',
        { class: 'header-inner' },
        h('button', {
          type: 'button',
          class: 'botao-icone-cabecalho header-menu-botao',
          'aria-label': 'Abrir menu de navegação',
          onClick: () => gaveta.abrir(),
          innerHTML: icone('Menu', 'ic ic--20'),
        }),
        trilha &&
          h(
            'nav',
            { class: 'header-trilha', 'aria-label': 'Você está em' },
            h('span', { class: 'header-trilha-grupo' }, trilha.grupo),
            h('span', { class: 'header-trilha-separador', 'aria-hidden': 'true' }, '/'),
            h('span', { class: 'header-trilha-atual', 'aria-current': 'page' }, trilha.rotulo)
          ),
        h(
          'div',
          { class: 'header-acoes' },
          h('div', { class: 'header-busca-desktop' }, criarBuscaGlobal({ id: 'busca-global' })),
          h('button', {
            type: 'button',
            class: 'botao-icone-cabecalho header-busca-botao',
            'aria-label': 'Abrir busca',
            'aria-expanded': 'false',
            innerHTML: icone('Search', 'ic ic--18'),
            onClick: (evento) => {
              buscaMobileAtiva.valor = !buscaMobileAtiva.valor
              if (buscaMobileAtiva.valor) areaBuscaMobile.removeAttribute('hidden')
              else areaBuscaMobile.setAttribute('hidden', '')
              evento.currentTarget.setAttribute('aria-label', buscaMobileAtiva.valor ? 'Fechar busca' : 'Abrir busca')
              evento.currentTarget.setAttribute('aria-expanded', String(buscaMobileAtiva.valor))
              evento.currentTarget.innerHTML = icone(buscaMobileAtiva.valor ? 'X' : 'Search', 'ic ic--18')
            },
          }),
          notificacoesMenu.raiz,
          h('div', { class: 'header-divisor', 'aria-hidden': 'true' }),
          perfilMenu.raiz
        )
      ),
      areaBuscaMobile
    )
  }

  // Estado recolhido persistido.
  if (lerRecolhida()) document.body.classList.add('sidebar-recolhida')

  // Barra global de status das operações.
  const status = barraStatus()
  const conteudo = document.querySelector('.conteudo')
  if (conteudo) conteudo.insertBefore(status.raiz, conteudo.querySelector('.conteudo-main'))

  // Re-renderiza contadores/sino quando os dados mudam.
  assinarStore((_db, _requisicao, operacao) => {
    renderizarNavegacao?.()
    notificacoesMenu.renderizarSino()
    status.renderizar(operacao)
  })
  assinarSessao(() => perfilMenu.renderizarBotao())

  return { gaveta }
}
