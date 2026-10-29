/**
 * Kit de componentes de interface do Linha Fina — JavaScript puro.
 *
 * Cada função devolve um elemento pronto para inserir no DOM, com a mesma
 * marcação e classes que o design system define em css/components.css.
 */

import { icone } from './icons.js'
import { h } from './dom.js'
import { formatarPercentual, iniciais, parseMoeda } from '../utils/format.js'
import { HEX } from '../utils/status.js'

/* ------------------------------------------------------------------ */
/* Botões                                                              */
/* ------------------------------------------------------------------ */

const VARIANTES_BOTAO = {
  primario: 'btn--primario',
  secundario: 'btn--secundario',
  fantasma: 'btn--fantasma',
  perigo: 'btn--perigo',
}

const TAMANHOS_BOTAO = {
  sm: 'btn--sm',
  md: 'btn--md',
  lg: 'btn--lg',
}

export function botaoClasses({ variante = 'primario', tamanho = 'md' } = {}) {
  return `btn ${VARIANTES_BOTAO[variante] ?? 'btn--primario'} ${TAMANHOS_BOTAO[tamanho] ?? 'btn--md'}`
}

export function botao({
  variante = 'primario',
  tamanho = 'md',
  tipo = 'button',
  carregando = false,
  desabilitado = false,
  icone: nomeIcone = null,
  classe = '',
  onClick,
  children = [],
  ...props
}) {
  return h(
    'button',
    {
      type: tipo,
      class: `${botaoClasses({ variante, tamanho })}${classe ? ` ${classe}` : ''}`,
      disabled: desabilitado || carregando ? '' : null,
      onClick,
      ...props,
    },
    carregando && h('span', { class: 'btn-icone-el girar', innerHTML: icone('Loader2', 'ic ic--16') }),
    nomeIcone && h('span', { class: 'btn-icone-el', innerHTML: icone(nomeIcone, 'ic ic--16') }),
    children
  )
}

export function botaoLink({ para, variante = 'primario', tamanho = 'md', icone: nomeIcone = null, classe = '', children, onClick, ...props }) {
  return h(
    'a',
    { href: para, class: `${botaoClasses({ variante, tamanho })}${classe ? ` ${classe}` : ''}`, onClick, ...props },
    nomeIcone && h('span', { class: 'btn-icone-el', innerHTML: icone(nomeIcone, 'ic ic--16') }),
    children
  )
}

/* ------------------------------------------------------------------ */
/* Badge                                                               */
/* ------------------------------------------------------------------ */

const VARIANTES_BADGE = {
  success: 'badge--success',
  warning: 'badge--warning',
  danger: 'badge--danger',
  info: 'badge--info',
  primary: 'badge--primary',
  neutral: 'badge--neutral',
  teal: 'badge--teal',
  lilas: 'badge--lilas',
}

export function badge({
  status = null,
  variante = 'neutral',
  rotulo = '',
  comPonto = true,
  icone: nomeIcone = null,
  classe = '',
}) {
  const classeBadge = status?.badge ?? VARIANTES_BADGE[variante] ?? 'badge--neutral'
  const texto = status?.rotulo ?? rotulo
  return h(
    'span',
    { class: `badge ${classeBadge}${classe ? ` ${classe}` : ''}` },
    comPonto && !nomeIcone && h('span', { class: 'badge-ponto' }),
    nomeIcone && h('span', { class: 'badge-icone', innerHTML: icone(nomeIcone, 'ic ic--12') }),
    texto
  )
}

/* ------------------------------------------------------------------ */
/* Avatar                                                              */
/* ------------------------------------------------------------------ */

const PALETA_AVATAR = [HEX.rosa, HEX.ciano, HEX.lilas, HEX.laranja, HEX.indigo, HEX.teal]

function corDoNome(nome) {
  let hash = 0
  for (const letra of String(nome)) hash = (hash * 31 + letra.charCodeAt(0)) % 997
  return PALETA_AVATAR[hash % PALETA_AVATAR.length]
}

const TAMANHOS_AVATAR = { sm: 'avatar--sm', md: 'avatar--md', lg: 'avatar--lg' }

export function avatar({ nome, tamanho = 'md', comPonto = false, corPonto = null, classe = '' }) {
  const cor = corDoNome(nome)
  return h(
    'span',
    { class: `avatar ${TAMANHOS_AVATAR[tamanho] ?? 'avatar--md'}${classe ? ` ${classe}` : ''}` },
    h('span', {
      class: 'avatar-circulo',
      style: {
        backgroundColor: `${cor}26`,
        color: cor,
        borderColor: `${cor}55`,
      },
    }, iniciais(nome) || '?'),
    comPonto &&
      h('span', {
        class: 'avatar-ponto',
        style: { backgroundColor: corPonto ?? cor },
      })
  )
}

/* ------------------------------------------------------------------ */
/* StatCard                                                            */
/* ------------------------------------------------------------------ */

const TINTAS_STAT = {
  primary: 'stat-tinta--primary',
  success: 'stat-tinta--success',
  warning: 'stat-tinta--warning',
  danger: 'stat-tinta--danger',
  info: 'stat-tinta--info',
  teal: 'stat-tinta--teal',
  lilas: 'stat-tinta--lilas',
}

export function statCard({
  icone: nomeIcone = null,
  rotulo,
  valor,
  detalhe = '',
  comparacao = null,
  comparacaoRotulo = 'vs. mês anterior',
  tom = 'primary',
  classe = '',
  rodape = null,
}) {
  return h(
    'article',
    { class: `card-surface stat-card${classe ? ` ${classe}` : ''}` },
    h(
      'div',
      { class: 'stat-card-topo' },
      h('p', { class: 'stat-rotulo' }, rotulo),
      nomeIcone &&
        h('span', { class: `stat-icone ${TINTAS_STAT[tom] ?? TINTAS_STAT.primary}`, innerHTML: icone(nomeIcone, 'ic ic--16') })
    ),
    h('p', { class: 'stat-valor tnum' }, valor),
    h(
      'div',
      { class: 'stat-rodape-linha' },
      comparacao !== null && comparacao !== undefined
        ? h(
            'p',
            { class: 'stat-comparacao' },
            h(
              'span',
              {
                class: `stat-comparacao-valor ${comparacao >= 0 ? 'text-sucesso' : 'text-perigo'}`,
              },
              h('span', {
                class: 'ic-caixa',
                innerHTML: icone(comparacao >= 0 ? 'TrendingUp' : 'TrendingDown', 'ic ic--12'),
              }),
              formatarPercentual(Math.abs(comparacao), 1)
            ),
            h('span', { class: 'stat-comparacao-rotulo' }, comparacaoRotulo)
          )
        : detalhe && h('p', { class: 'stat-detalhe' }, detalhe)
    ),
    rodape
  )
}

/* ------------------------------------------------------------------ */
/* Estados vazios                                                      */
/* ------------------------------------------------------------------ */

export function estadoVazio({ icone: nomeIcone = null, titulo, descricao, acao = null, classe = '' }) {
  return h(
    'div',
    { class: `estado-vazio${classe ? ` ${classe}` : ''}` },
    nomeIcone && h('span', { class: 'estado-vazio-icone', innerHTML: icone(nomeIcone, 'ic ic--20') }),
    h(
      'div',
      { class: 'estado-vazio-textos' },
      h('p', { class: 'estado-vazio-titulo' }, titulo),
      descricao && h('p', { class: 'estado-vazio-descricao' }, descricao)
    ),
    acao
  )
}

export function blocoVazio({ icone: nomeIcone = null, texto, classe = '' }) {
  return h(
    'div',
    { class: `bloco-vazio${classe ? ` ${classe}` : ''}` },
    nomeIcone && h('span', { class: 'bloco-vazio-icone', innerHTML: icone(nomeIcone, 'ic ic--20') }),
    h('p', { class: 'bloco-vazio-texto' }, texto)
  )
}

/* ------------------------------------------------------------------ */
/* Spinner                                                            */
/* ------------------------------------------------------------------ */

export function spinner({ tamanho = 20, rotulo = 'Carregando…' }) {
  return h('span', {
    class: 'spinner',
    role: 'status',
    'aria-label': rotulo,
    innerHTML: icone('LoaderCircle', 'ic girar'),
    style: { '--spinner-tamanho': `${tamanho}px` },
  })
}

export function telaCarregando({ mensagem = 'Preparando a bancada…' } = {}) {
  return h(
    'div',
    { class: 'tela-carregando' },
    spinner({ tamanho: 28 }),
    h('p', { class: 'tela-carregando-texto' }, mensagem)
  )
}

/* ------------------------------------------------------------------ */
/* Cabeçalho de página                                                 */
/* ------------------------------------------------------------------ */

export function pageHeader({ titulo, descricao = '', trilha = [], acoes = null, classe = '' }) {
  return h(
    'header',
    { class: `pagina-cabecalho${classe ? ` ${classe}` : ''}` },
    h(
      'div',
      { class: 'pagina-cabecalho-textos' },
      trilha.length > 0 &&
        h(
          'nav',
          { class: 'trilha-pagina', 'aria-label': 'Trilha de navegação' },
          trilha.map((item, i) =>
            h(
              'span',
              { class: 'trilha-item' },
              i > 0 && h('span', { class: 'trilha-seta', innerHTML: icone('ChevronRight', 'ic ic--12') }),
              item.rota
                ? h('a', { href: item.rota, class: 'trilha-link' }, item.rotulo)
                : h(
                    'span',
                    { class: 'trilha-atual', 'aria-current': i === trilha.length - 1 ? 'page' : null },
                    item.rotulo
                  )
            )
          )
        ),
      h('h1', { class: 'pagina-titulo' }, titulo),
      descricao && h('p', { class: 'pagina-descricao' }, descricao)
    ),
    acoes && h('div', { class: 'pagina-acoes' }, acoes)
  )
}

/* ------------------------------------------------------------------ */
/* Tabs (controle segmentado)                                          */
/* ------------------------------------------------------------------ */

export function abas({ lista, ativa, onMudar, classe = '' }) {
  const listaEl = h(
    'div',
    { class: `tabs${classe ? ` ${classe}` : ''}`, role: 'tablist', onKeyDown: teclado },
    lista.map((aba) => {
      const selecionada = aba.id === ativa
      return h(
        'button',
        {
          type: 'button',
          role: 'tab',
          class: `tab${selecionada ? ' tab--ativa' : ''}`,
          'aria-selected': selecionada ? 'true' : 'false',
          tabindex: selecionada ? 0 : -1,
          onClick: () => onMudar(aba.id),
        },
        aba.rotulo,
        aba.contador != null && h('span', { class: 'tab-contador tnum' }, aba.contador)
      )
    })
  )

  function teclado(evento) {
    const botoes = [...listaEl.querySelectorAll('[role="tab"]')]
    const atual = botoes.findIndex((b) => b === document.activeElement)
    if (atual === -1) return
    let proximo = null
    if (evento.key === 'ArrowRight') proximo = (atual + 1) % botoes.length
    if (evento.key === 'ArrowLeft') proximo = (atual - 1 + botoes.length) % botoes.length
    if (proximo !== null) {
      evento.preventDefault()
      botoes[proximo]?.focus()
      botoes[proximo]?.click()
    }
  }

  return listaEl
}

/* ------------------------------------------------------------------ */
/* Paginação                                                           */
/* ------------------------------------------------------------------ */

export function paginacao({
  pagina,
  totalItens,
  porPagina,
  onMudarPagina,
  rotuloSingular = 'registro',
  rotuloPlural = 'registros',
}) {
  const totalPaginas = Math.max(Math.ceil(totalItens / porPagina), 1)
  const primeiro = totalItens === 0 ? 0 : (pagina - 1) * porPagina + 1
  const ultimo = Math.min(pagina * porPagina, totalItens)

  const paginas = []
  const inicio = Math.max(1, Math.min(pagina - 2, totalPaginas - 4))
  const fim = Math.min(totalPaginas, inicio + 4)
  for (let p = inicio; p <= fim; p += 1) paginas.push(p)

  return h(
    'nav',
    { class: 'paginacao', 'aria-label': 'Paginação' },
    h(
      'p',
      { class: 'paginacao-info tnum' },
      `${primeiro}–${ultimo} de ${totalItens} ${totalItens === 1 ? rotuloSingular : rotuloPlural}`
    ),
    h(
      'div',
      { class: 'paginacao-botoes' },
      h(
        'button',
        {
          type: 'button',
          class: 'paginacao-seta',
          'aria-label': 'Página anterior',
          disabled: pagina <= 1 ? '' : null,
          onClick: () => onMudarPagina(pagina - 1),
          innerHTML: icone('ChevronLeft', 'ic ic--16'),
        }
      ),
      paginas.map((p) =>
        h(
          'button',
          {
            type: 'button',
            class: `paginacao-numero tnum${p === pagina ? ' paginacao-numero--ativa' : ''}`,
            'aria-label': `Ir para a página ${p}`,
            'aria-current': p === pagina ? 'page' : null,
            onClick: () => onMudarPagina(p),
          },
          p
        )
      ),
      h(
        'button',
        {
          type: 'button',
          class: 'paginacao-seta',
          'aria-label': 'Próxima página',
          disabled: pagina >= totalPaginas ? '' : null,
          onClick: () => onMudarPagina(pagina + 1),
          innerHTML: icone('ChevronRight', 'ic ic--16'),
        }
      )
    )
  )
}

/* ------------------------------------------------------------------ */
/* Campos de formulário                                                */
/* ------------------------------------------------------------------ */

let contadorCampo = 0

/**
 * Envolte um controle com label, dica e erro conectados por aria.
 * Devolve { raiz, controle, definirErro }.
 */
export function campo({ label = '', erro = '', dica = '', obrigatorio = false, controle, classe = '' }) {
  contadorCampo += 1
  const id = controle.id || `campo-${contadorCampo}`
  controle.id = id
  const idErro = `${id}-erro`
  const idDica = `${id}-dica`
  const descricoes = [erro && idErro, dica && idDica].filter(Boolean).join(' ')

  if (descricoes) controle.setAttribute('aria-describedby', descricoes)
  if (erro) controle.setAttribute('aria-invalid', 'true')
  else controle.removeAttribute('aria-invalid')

  const paragrafoErro = h(
    'p',
    { class: 'campo-erro', id: idErro, role: 'alert', hidden: !erro },
    h('span', { class: 'ic-caixa', innerHTML: icone('CircleAlert', 'ic ic--14') }),
    erro
  )
  const paragrafoDica = h('p', { class: 'campo-dica', id: idDica, hidden: !(dica && !erro) }, dica)

  const raiz = h(
    'div',
    { class: `campo${classe ? ` ${classe}` : ''}` },
    label &&
      h(
        'label',
        { for: id, class: 'campo-rotulo' },
        label,
        obrigatorio && h('span', { class: 'campo-obrigatorio', 'aria-hidden': 'true' }, ' *')
      ),
    controle,
    paragrafoDica,
    paragrafoErro
  )

  function definirErro(mensagem) {
    paragrafoErro.lastChild.textContent = mensagem ?? ''
    paragrafoErro.hidden = !mensagem
    paragrafoDica.hidden = !(dica && !mensagem)
    if (mensagem) controle.setAttribute('aria-invalid', 'true')
    else controle.removeAttribute('aria-invalid')
  }

  return { raiz, controle, definirErro }
}

export function criarInput(props = {}) {
  const { invalid, classe = '', ...resto } = props
  const no = h('input', { class: `input-base${classe ? ` ${classe}` : ''}`, ...resto })
  if (invalid) no.setAttribute('aria-invalid', 'true')
  return no
}

export function criarTextarea({ rows = 3, invalid, classe = '', ...resto } = {}) {
  const no = h('textarea', { rows, class: `input-base input-textarea${classe ? ` ${classe}` : ''}`, ...resto })
  if (invalid) no.setAttribute('aria-invalid', 'true')
  return no
}

export function criarSelect({ opcoes = [], invalid, classe = '', valor = '', ...resto } = {}) {
  const no = h('select', { class: `input-base${classe ? ` ${classe}` : ''}`, ...resto },
    opcoes.map((op) =>
      typeof op === 'string'
        ? h('option', { value: op }, op)
        : h('option', { value: op.value, disabled: op.desabilitado ? '' : null }, op.rotulo)
    )
  )
  no.value = valor
  if (invalid) no.setAttribute('aria-invalid', 'true')
  return no
}

export function checkbox({ rotulo, descricao = '', marcado = false, onChange, id, classe = '' }) {
  contadorCampo += 1
  const idCampo = id || `checkbox-${contadorCampo}`
  const no = h(
    'div',
    { class: `checkbox-item${classe ? ` ${classe}` : ''}` },
    h('input', {
      id: idCampo,
      type: 'checkbox',
      class: 'checkbox-input',
      ...(marcado ? { checked: '' } : {}),
      onChange: (evento) => onChange?.(evento.target.checked),
    }),
    h(
      'div',
      { class: 'checkbox-textos' },
      h('label', { for: idCampo, class: 'checkbox-rotulo' }, rotulo),
      descricao && h('p', { class: 'checkbox-descricao' }, descricao)
    )
  )
  return no
}

export function interruptor({ rotulo, descricao = '', marcado, onMudar, desabilitado = false, id }) {
  contadorCampo += 1
  const idCampo = id || `switch-${contadorCampo}`
  let ligado = Boolean(marcado)
  const botaoEl = h('button', {
    id: idCampo,
    type: 'button',
    role: 'switch',
    class: `switch${ligado ? ' switch--ligado' : ''}`,
    'aria-checked': ligado ? 'true' : 'false',
    disabled: desabilitado ? '' : null,
    onClick: () => {
      // Atualiza o próprio controle: nem toda página re-renderiza ao mudar
      // uma preferência local. Se a página re-renderizar (ex.: após a API
      // responder), o estado real sobrescreve este.
      ligado = !ligado
      botaoEl.setAttribute('aria-checked', ligado ? 'true' : 'false')
      botaoEl.classList.toggle('switch--ligado', ligado)
      onMudar?.(ligado)
    },
  })
  const raiz = h(
    'div',
    { class: 'switch-item' },
    h(
      'div',
      { class: 'switch-textos' },
      h('label', { for: idCampo, class: 'switch-rotulo' }, rotulo),
      descricao && h('p', { class: 'switch-descricao' }, descricao)
    ),
    botaoEl
  )
  return raiz
}

/* ------------------------------------------------------------------ */
/* Campo monetário                                                     */
/* ------------------------------------------------------------------ */

function formatarDecimal(numero) {
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numero)
}

/**
 * Campo monetário: digitação livre em pt-BR, prefixo R$, valor numérico no estado.
 * onValor recebe o número parseado a cada alteração.
 */
export function campoMoeda({ valor = 0, onValor, desabilitado = false, id, classe = '' }) {
  let texto = valor ? formatarDecimal(valor) : ''
  const input = h('input', {
    id,
    type: 'text',
    inputmode: 'decimal',
    class: `input-base tnum moeda-input${classe ? ` ${classe}` : ''}`,
    placeholder: '0,00',
    value: texto,
    disabled: desabilitado ? '' : null,
  })
  let focado = false
  input.addEventListener('focus', () => {
    focado = true
  })
  input.addEventListener('blur', () => {
    focado = false
    texto = valor ? formatarDecimal(valor) : ''
    input.value = texto
  })
  input.addEventListener('input', () => {
    const novo = input.value.replace(/[^\d.,]/g, '')
    texto = novo
    input.value = novo
    valorAtual = parseMoeda(novo)
  })
  const raiz = h(
    'div',
    { class: 'moeda-campo' },
    h('span', { class: 'moeda-prefixo', 'aria-hidden': 'true' }, 'R$'),
    input
  )
  let valorAtual = valor
  const originalOnValor = onValor
  if (originalOnValor) {
    input.addEventListener('input', () => originalOnValor(parseMoeda(input.value)))
  }
  return {
    raiz,
    input,
    valorAtual: () => valorAtual,
    definirValor(novoValor) {
      valorAtual = novoValor
      if (!focado) {
        texto = novoValor ? formatarDecimal(novoValor) : ''
        input.value = texto
      }
    },
  }
}

/* ------------------------------------------------------------------ */
/* Campo de busca                                                      */
/* ------------------------------------------------------------------ */

export function campoBusca({
  valor = '',
  onValor,
  placeholder = 'Buscar…',
  rotulo = 'Busca',
  classe = '',
  id,
  ...props
}) {
  const input = h('input', {
    id,
    type: 'search',
    class: 'input-base busca-input',
    'aria-label': rotulo,
    placeholder,
    value: valor,
    onInput: (evento) => {
      atualizarBotao(evento.target.value)
      onValor(evento.target.value)
    },
    ...props,
  })
  const botaoLimpar = h('button', {
    type: 'button',
    class: 'busca-limpar',
    'aria-label': 'Limpar busca',
    hidden: !valor ? '' : null,
    onClick: () => {
      input.value = ''
      atualizarBotao('')
      onValor('')
      input.focus()
    },
    innerHTML: icone('X', 'ic ic--14'),
  })
  function atualizarBotao(textoAtual) {
    if (textoAtual) botaoLimpar.removeAttribute('hidden')
    else botaoLimpar.setAttribute('hidden', '')
  }
  const raiz = h(
    'div',
    { class: `busca-campo${classe ? ` ${classe}` : ''}` },
    h('span', { class: 'busca-icone', 'aria-hidden': 'true', innerHTML: icone('Search', 'ic ic--16') }),
    input,
    botaoLimpar
  )
  return raiz
}
