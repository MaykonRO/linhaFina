/** Shell responsivo do MVP: navegação essencial, identidade da sessão e saída. */
import { icone } from './icons.js'
import { h, aoClicarFora, aoEscape } from './dom.js'
import { avatar, badge } from './ui.js'
import { toast } from './toast.js'
import { acoes, assinarStore } from '../app/store.js'
import { assinarSessao, sessaoAtual, sairSessao } from '../app/sessao.js'
import { caminho, navegar } from '../app/rotas.js'
import { barraStatus } from './estados.js'

const CHAVE_RECOLHIDA = 'linha-fina:sidebar-recolhida'
const NAVEGACAO = Object.freeze([
  { pagina: 'dashboard', rotulo: 'Dashboard', icone: 'LayoutDashboard' },
  { pagina: 'clientes', rotulo: 'Clientes', icone: 'Users' },
  { pagina: 'ordens-servico', rotulo: 'Ordens de Serviço', icone: 'ClipboardList' },
])
const TRILHAS = {
  dashboard: 'Dashboard',
  clientes: 'Clientes',
  'ordens-servico': 'Ordens de Serviço',
  'ordem-servico-form': 'Formulário de OS',
}

const SIMBOLO_MARCA = `<svg viewBox="0 0 32 32" class="marca-simbolo" aria-hidden="true">
  <path d="M5 20 C 11 20, 10 11, 16 11 C 22 11, 21 20, 27 20" fill="none"
        stroke="var(--lf-primary)" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="1 6"></path>
  <path d="M27 20 L 23.4 26.6" stroke="var(--lf-azure)" stroke-width="1.8" stroke-linecap="round"></path>
  <circle cx="27" cy="20" r="2" fill="var(--lf-azure)"></circle>
</svg>`

export function marcaLinhaFina({ tamanho = 'md' } = {}) {
  return h('span', { class: `marca ${tamanho === 'lg' ? 'marca--lg' : ''}` },
    h('span', { class: 'marca-simbolo-caixa', innerHTML: SIMBOLO_MARCA }),
    h('span', { class: 'marca-textos' },
      h('span', { class: 'marca-nome' }, 'Linha ', h('span', { class: 'marca-nome-destaque' }, 'Fina')),
      h('span', { class: 'marca-linha', innerHTML: `<svg viewBox="0 0 96 4" preserveAspectRatio="none" aria-hidden="true">
        <line x1="1" y1="2" x2="95" y2="2" stroke="var(--lf-primary)" stroke-width="2"
              stroke-linecap="round" stroke-dasharray="6 6" opacity="0.55"></line>
      </svg>` })
    )
  )
}

export function marcaIcone() {
  return h('span', { class: 'marca-icone-caixa', innerHTML: SIMBOLO_MARCA })
}

function lerRecolhida() {
  try { return localStorage.getItem(CHAVE_RECOLHIDA) === '1' } catch { return false }
}

function construirNavegacao(paginaAtual, onNavegar) {
  return h('ul', { class: 'nav-lista' }, NAVEGACAO.map((item) => {
    const ativo = paginaAtual === item.pagina ||
      (paginaAtual === 'ordem-servico-form' && item.pagina === 'ordens-servico')
    return h('li', {}, h('a', {
      href: caminho(item.pagina),
      class: `nav-item${ativo ? ' nav-item--ativo' : ''}`,
      title: item.rotulo,
      'aria-current': ativo ? 'page' : null,
      onClick: () => onNavegar?.(),
    },
      h('span', { class: 'nav-item-icone', innerHTML: icone(item.icone, 'ic ic--18') }),
      h('span', { class: 'nav-item-rotulo' }, item.rotulo)
    ))
  }))
}

function conteudoSidebar(paginaAtual, { mobile = false, onNavegar, aoAlternar } = {}) {
  return h('div', { class: 'sidebar-inner' },
    h('div', { class: 'sidebar-cabecalho' },
      h('a', { href: caminho('dashboard'), class: 'sidebar-marca', 'aria-label': 'Linha Fina — Dashboard' },
        mobile ? marcaLinhaFina() : h('span', { class: 'sidebar-marca--cheia' }, marcaLinhaFina()),
        !mobile && h('span', { class: 'sidebar-marca--recolhida' }, marcaIcone())
      ),
      aoAlternar
    ),
    h('nav', { class: 'sidebar-nav', 'aria-label': 'Navegação principal' }, construirNavegacao(paginaAtual, onNavegar))
  )
}

function montarSidebar(paginaAtual) {
  const alvo = document.querySelector('.sidebar')
  if (!alvo) return
  const recolhida = lerRecolhida()
  const botaoAlternar = h('button', {
    type: 'button', class: 'sidebar-alternar',
    'aria-label': recolhida ? 'Expandir menu lateral' : 'Recolher menu lateral',
    'aria-pressed': recolhida ? 'true' : 'false',
    innerHTML: icone(recolhida ? 'PanelLeftOpen' : 'PanelLeftClose', 'ic ic--16'),
    onClick: () => {
      const novoValor = !document.body.classList.contains('sidebar-recolhida')
      document.body.classList.toggle('sidebar-recolhida', novoValor)
      try { localStorage.setItem(CHAVE_RECOLHIDA, novoValor ? '1' : '0') } catch { /* preferência apenas em memória */ }
      botaoAlternar.setAttribute('aria-label', novoValor ? 'Expandir menu lateral' : 'Recolher menu lateral')
      botaoAlternar.setAttribute('aria-pressed', String(novoValor))
      botaoAlternar.innerHTML = icone(novoValor ? 'PanelLeftOpen' : 'PanelLeftClose', 'ic ic--16')
    },
  })
  alvo.replaceChildren(conteudoSidebar(paginaAtual, { aoAlternar: botaoAlternar }))
}

function montarGavetaMobile(paginaAtual) {
  let aberta = false
  let focoAnterior = null
  const painel = h('aside', { class: 'gaveta-painel', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Menu de navegação' })
  const fundo = h('div', { class: 'gaveta-fundo', 'aria-hidden': 'true' })
  const raiz = h('div', { class: 'gaveta-mobile', hidden: '' }, fundo, painel)

  function fechar() {
    if (!aberta) return
    aberta = false
    raiz.classList.remove('gaveta-mobile--aberta')
    document.body.style.overflow = ''
    setTimeout(() => {
      raiz.setAttribute('hidden', '')
      focoAnterior?.focus?.()
    }, 240)
  }

  function abrir() {
    focoAnterior = document.activeElement
    aberta = true
    painel.replaceChildren(conteudoSidebar(paginaAtual, {
      mobile: true,
      onNavegar: fechar,
      aoAlternar: h('button', {
        type: 'button', class: 'sidebar-fechar', 'aria-label': 'Fechar menu',
        onClick: fechar, innerHTML: icone('X', 'ic ic--16'),
      }),
    }))
    raiz.removeAttribute('hidden')
    requestAnimationFrame(() => {
      raiz.classList.add('gaveta-mobile--aberta')
      painel.querySelector('button')?.focus()
    })
    document.body.style.overflow = 'hidden'
  }

  fundo.addEventListener('click', fechar)
  document.addEventListener('keydown', (evento) => { if (evento.key === 'Escape' && aberta) fechar() })
  document.body.append(raiz)
  return { abrir, fechar }
}

function montarPerfil() {
  let aberto = false
  const botaoPerfil = h('button', {
    type: 'button', class: 'perfil-botao', 'aria-haspopup': 'menu', 'aria-expanded': 'false',
    onClick: () => (aberto ? fechar() : abrir()),
  })
  const menu = h('div', { class: 'menu-pop pop-surface menu-perfil', role: 'menu', 'aria-label': 'Menu do perfil', hidden: '' })
  const raiz = h('div', { class: 'perfil-caixa' }, botaoPerfil, menu)

  function renderizarBotao() {
    const sessao = sessaoAtual()
    botaoPerfil.replaceChildren(
      h('span', { class: 'sr-only' }, 'Abrir menu do perfil'),
      avatar({ nome: sessao?.nome ?? 'Linha Fina', tamanho: 'sm' }),
      h('span', { class: 'perfil-identificacao' },
        h('span', { class: 'perfil-nome' }, sessao?.nome ?? 'Linha Fina'),
        h('span', { class: 'perfil-papel' }, sessao?.papelRotulo ?? 'Conta')
      ),
      h('span', { class: 'perfil-seta', innerHTML: icone('ChevronDown', 'ic ic--14') })
    )
  }

  function abrir() {
    const sessao = sessaoAtual()
    aberto = true
    menu.replaceChildren(
      h('div', { class: 'menu-perfil-cabecalho' },
        h('p', { class: 'menu-titulo' }, sessao?.nome ?? 'Linha Fina'),
        h('p', { class: 'menu-perfil-email' }, sessao?.email ?? 'Usuário autenticado'),
        badge({ variante: 'neutral', rotulo: sessao?.papelRotulo ?? 'Sessão ativa', classe: 'menu-perfil-selo' })
      ),
      h('div', { class: 'menu-conteudo' }, h('button', {
        type: 'button', role: 'menuitem', class: 'menu-item menu-item--perigo',
        onClick: async () => {
          fechar()
          const resultado = await acoes.autenticacao.sair()
          if (!resultado.ok) { toast.aviso(resultado.erro); return }
          sairSessao()
          toast.sucesso('Sessão encerrada.')
          navegar('login', null, { substituir: true })
        },
      }, h('span', { class: 'ic-caixa', innerHTML: icone('LogOut', 'ic ic--16') }), 'Sair'))
    )
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

export function montarLayout(paginaAtual) {
  montarSidebar(paginaAtual)
  const gaveta = montarGavetaMobile(paginaAtual)
  const perfil = montarPerfil()
  const header = document.querySelector('.header')
  if (header) {
    header.replaceChildren(h('div', { class: 'header-inner' },
      h('button', {
        type: 'button', class: 'botao-icone-cabecalho header-menu-botao',
        'aria-label': 'Abrir menu de navegação', onClick: () => gaveta.abrir(),
        innerHTML: icone('Menu', 'ic ic--20'),
      }),
      h('nav', { class: 'header-trilha', 'aria-label': 'Você está em' },
        h('span', { class: 'header-trilha-grupo' }, 'Linha Fina'),
        h('span', { class: 'header-trilha-separador', 'aria-hidden': 'true' }, '/'),
        h('span', { class: 'header-trilha-atual', 'aria-current': 'page' }, TRILHAS[paginaAtual] ?? 'Dashboard')
      ),
      h('div', { class: 'header-acoes' }, perfil.raiz)
    ))
  }

  if (lerRecolhida()) document.body.classList.add('sidebar-recolhida')
  const status = barraStatus()
  const conteudo = document.querySelector('.conteudo')
  if (conteudo) conteudo.insertBefore(status.raiz, conteudo.querySelector('.conteudo-main'))
  assinarStore((_db, _requisicao, operacao) => status.renderizar(operacao))
  assinarSessao(() => perfil.renderizarBotao())
  return { gaveta }
}
