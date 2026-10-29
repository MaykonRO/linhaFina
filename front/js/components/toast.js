/**
 * Sistema de notificações (toasts) do Linha Fina.
 *
 * Uso: toast.sucesso('Cliente cadastrada com sucesso.')
 *      toast.erro('Não foi possível salvar.')
 *      toast.aviso('…') / toast.info('…')
 *
 * A área de toasts é criada no corpo uma única vez, sob demanda.
 */

import { icone } from './icons.js'
import { h } from './dom.js'

const TIPOS = {
  sucesso: { icone: 'CircleCheckBig', classe: 'toast-ic--sucesso' },
  erro: { icone: 'CircleX', classe: 'toast-ic--erro' },
  aviso: { icone: 'TriangleAlert', classe: 'toast-ic--aviso' },
  info: { icone: 'Info', classe: 'toast-ic--info' },
}

const DURACAO_MS = 4200
const MAXIMO_VISIVEIS = 3

let contador = 0
let area = null

function garantirArea() {
  if (!area) {
    area = h('div', {
      class: 'toast-area',
      'aria-live': 'polite',
    })
    document.body.append(area)
  }
  return area
}

function remover(no) {
  if (!no.isConnected) return
  no.classList.add('toast--saindo')
  no.addEventListener('animationend', () => no.remove(), { once: true })
}

function adicionar(tipo, mensagem) {
  const alvo = garantirArea()
  contador += 1
  const definicao = TIPOS[tipo] ?? TIPOS.info
  const no = h(
    'div',
    { class: 'toast pop-surface', role: 'status' },
    h('span', { class: `toast-icone ${definicao.classe}`, innerHTML: icone(definicao.icone, 'ic ic--16') }),
    h('p', { class: 'toast-mensagem' }, mensagem),
    h(
      'button',
      {
        class: 'toast-fechar',
        'aria-label': 'Fechar notificação',
        onClick: () => remover(no),
      },
      h('span', { class: 'ic-caixa', innerHTML: icone('X', 'ic ic--14') })
    )
  )
  // Mantém no máximo MAXIMO_VISIVEIS + 1 na tela (o mais antigo sai).
  while (alvo.children.length >= MAXIMO_VISIVEIS + 1) alvo.firstChild.remove()
  alvo.append(no)
  setTimeout(() => remover(no), DURACAO_MS)
}

export const toast = {
  sucesso: (mensagem) => adicionar('sucesso', mensagem),
  erro: (mensagem) => adicionar('erro', mensagem),
  aviso: (mensagem) => adicionar('aviso', mensagem),
  info: (mensagem) => adicionar('info', mensagem),
}
