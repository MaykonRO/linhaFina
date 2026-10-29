/**
 * Drawer (painel lateral deslizante) para detalhes e formulários longos.
 * Drawer nativo para detalhes e formulários longos.
 */

import { icone } from './icons.js'
import { h } from './dom.js'

const LARGURAS = {
  sm: 'drawer-painel--sm',
  md: 'drawer-painel--md',
  lg: 'drawer-painel--lg',
}

let sequenciaDrawer = 0

/**
 * Abre um drawer lateral e devolve { fechar, painel }.
 * @param {object} opcoes
 * @param {string} opcoes.titulo
 * @param {string} [opcoes.descricao]
 * @param {string} [opcoes.largura] sm | md | lg
 * @param {Node} [opcoes.conteudo] corpo do painel
 * @param {Node} [opcoes.rodape] barra inferior (ações)
 * @param {() => void} [opcoes.onFechar]
 */
export function abrirDrawer({
  titulo,
  descricao = '',
  largura = 'md',
  conteudo = null,
  rodape = null,
  onFechar = null,
}) {
  sequenciaDrawer += 1
  const idTitulo = `drawer-titulo-${sequenciaDrawer}`
  const focoAnterior = document.activeElement
  let raiz = null
  let fechado = false

  const painel = h(
    'div',
    {
      class: `pop-surface drawer-painel ${LARGURAS[largura] ?? LARGURAS.md}`,
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': idTitulo,
      tabindex: '-1',
    },
    h(
      'header',
      { class: 'drawer-cabecalho' },
      h(
        'div',
        { class: 'drawer-titulos' },
        h('h2', { class: 'drawer-titulo', id: idTitulo }, titulo),
        descricao && h('p', { class: 'drawer-descricao' }, descricao)
      ),
      h('button', {
        type: 'button',
        class: 'drawer-fechar',
        'aria-label': 'Fechar painel',
        onClick: () => fechar(),
        innerHTML: icone('X', 'ic ic--16'),
      })
    ),
    h('div', { class: 'drawer-corpo' }, conteudo),
    rodape && h('footer', { class: 'drawer-rodape' }, rodape)
  )

  raiz = h(
    'div',
    { class: 'drawer-raiz' },
    h('div', { class: 'drawer-fundo', 'aria-hidden': 'true', onClick: () => fechar() }),
    painel
  )

  document.body.append(raiz)
  document.body.style.overflow = 'hidden'

  const timer = setTimeout(() => painel?.focus(), 30)

  function aoTeclar(evento) {
    if (evento.key === 'Escape') fechar()
  }
  document.addEventListener('keydown', aoTeclar)

  function fechar() {
    if (fechado) return
    fechado = true
    clearTimeout(timer)
    document.removeEventListener('keydown', aoTeclar)
    raiz.classList.add('drawer-raiz--saindo')
    const finalizar = () => {
      raiz.remove()
      if (!document.querySelector('.modal-raiz, .drawer-raiz')) document.body.style.overflow = ''
      focoAnterior instanceof HTMLElement && focoAnterior.focus?.()
      onFechar?.()
    }
    raiz.addEventListener('animationend', (evento) => {
      if (evento.target === raiz) finalizar()
    }, { once: true })
    setTimeout(() => {
      if (raiz.isConnected) finalizar()
    }, 280)
  }

  return { fechar, painel }
}
