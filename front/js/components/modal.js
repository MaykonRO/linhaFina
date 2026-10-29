/**
 * Modal acessível: overlay, ESC, clique no fundo, foco inicial, aria.
 * Modal nativo com overlay, foco e ESC.
 */

import { icone } from './icons.js'
import { h } from './dom.js'

const TAMANHOS = {
  sm: 'modal-painel--sm',
  md: 'modal-painel--md',
  lg: 'modal-painel--lg',
  xl: 'modal-painel--xl',
}

let sequenciaModal = 0

/**
 * Abre um modal e devolve { fechar, painel }.
 * @param {object} opcoes
 * @param {string} opcoes.titulo
 * @param {string} [opcoes.descricao]
 * @param {string} [opcoes.icone] nome do ícone (icons.js)
 * @param {string} [opcoes.tamanho] sm | md | lg | xl
 * @param {Node} [opcoes.conteudo] nó inserido no corpo
 * @param {() => void} [opcoes.onFechar] chamado ao fechar por ESC/overlay/botão
 */
export function abrirModal({ titulo, descricao = '', icone: nomeIcone = null, tamanho = 'md', conteudo = null, onFechar = null }) {
  sequenciaModal += 1
  const idTitulo = `modal-titulo-${sequenciaModal}`
  const focoAnterior = document.activeElement
  let raiz = null
  let fechado = false

  const botaoFechar = h('button', {
    type: 'button',
    class: 'modal-fechar',
    'aria-label': 'Fechar',
    onClick: () => fechar(),
    innerHTML: icone('X', 'ic ic--16'),
  })

  const painel = h(
    'div',
    {
      class: `pop-surface modal-painel ${TAMANHOS[tamanho] ?? TAMANHOS.md}`,
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': idTitulo,
    },
    h(
      'header',
      { class: 'modal-cabecalho' },
      nomeIcone &&
        h('span', { class: 'modal-icone', innerHTML: icone(nomeIcone, 'ic ic--18') }),
      h(
        'div',
        { class: 'modal-titulos' },
        h('h2', { class: 'modal-titulo', id: idTitulo }, titulo),
        descricao && h('p', { class: 'modal-descricao' }, descricao)
      ),
      botaoFechar
    ),
    h('div', { class: 'modal-corpo' }, conteudo)
  )

  raiz = h(
    'div',
    { class: 'modal-raiz' },
    h('div', { class: 'modal-fundo', 'aria-hidden': 'true', onClick: () => fechar() }),
    painel
  )

  document.body.append(raiz)
  document.body.style.overflow = 'hidden'

  const timer = setTimeout(() => {
    const foco = painel.querySelector(
      'input:not([type=hidden]), select, textarea, button:not([aria-label="Fechar"]), [href]'
    )
    ;(foco ?? painel)?.focus?.()
  }, 30)

  function aoTeclar(evento) {
    if (evento.key === 'Escape') fechar()
  }
  document.addEventListener('keydown', aoTeclar)

  function fechar() {
    if (fechado) return
    fechado = true
    clearTimeout(timer)
    document.removeEventListener('keydown', aoTeclar)
    raiz.classList.add('modal-raiz--saindo')
    raiz.addEventListener(
      'animationend',
      (evento) => {
        if (evento.target !== raiz) return
        raiz.remove()
        if (!document.querySelector('.modal-raiz')) document.body.style.overflow = ''
        focoAnterior instanceof HTMLElement && focoAnterior.focus?.()
        onFechar?.()
      },
      { once: true }
    )
    // Redundância: se a animação não disparar (reduced motion), remove direto.
    setTimeout(() => {
      if (raiz.isConnected) {
        raiz.remove()
        if (!document.querySelector('.modal-raiz')) document.body.style.overflow = ''
        focoAnterior instanceof HTMLElement && focoAnterior.focus?.()
        onFechar?.()
      }
    }, 240)
  }

  return { fechar, painel }
}
