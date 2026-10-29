/**
 * Diálogo de confirmação para ações destrutivas ou sensíveis.
 * Toda exclusão/cancelamento do sistema passa por aqui.
 */

import { icone } from './icons.js'
import { h } from './dom.js'
import { abrirModal } from './modal.js'
import { botao } from './ui.js'

/**
 * Abre um diálogo de confirmação.
 *
 * @param {object} opcoes
 * @param {string} opcoes.titulo
 * @param {string} [opcoes.descricao]
 * @param {string} [opcoes.rotuloConfirmar='Confirmar']
 * @param {string} [opcoes.rotuloCancelar='Voltar']
 * @param {boolean} [opcoes.perigo=true] botão de confirmação em tom perigo
 * @param {Node} [opcoes.conteudo] conteúdo extra entre a descrição e os botões
 * @param {() => boolean|Promise<boolean>} [opcoes.onConfirmar] devolver false mantém o diálogo aberto
 * @param {() => void} [opcoes.onFechar]
 */
export function confirmar({
  titulo,
  descricao = '',
  rotuloConfirmar = 'Confirmar',
  rotuloCancelar = 'Voltar',
  perigo = true,
  conteudo = null,
  onConfirmar,
  onFechar,
}) {
  const botaoConfirmar = botao({
    variante: perigo ? 'perigo' : 'primario',
    children: [rotuloConfirmar],
    onClick: async () => {
      botaoConfirmar.disabled = true
      botaoConfirmar.setAttribute('aria-busy', 'true')
      try {
        const resultado = await onConfirmar?.()
        if (resultado !== false) modal.fechar()
        else {
          botaoConfirmar.disabled = false
          botaoConfirmar.removeAttribute('aria-busy')
        }
      } catch {
        botaoConfirmar.disabled = false
        botaoConfirmar.removeAttribute('aria-busy')
      }
    },
  })

  const acoes = h(
    'div',
    { class: 'confirmar-acoes' },
    botao({
      variante: 'secundario',
      children: [rotuloCancelar],
      onClick: () => modal.fechar(),
    }),
    botaoConfirmar
  )

  const corpo = h(
    'div',
    { class: 'confirmar-corpo' },
    descricao && h('p', { class: 'confirmar-descricao' }, descricao),
    conteudo,
    acoes
  )

  const modal = abrirModal({
    titulo,
    descricao: '',
    icone: perigo ? iconeNome() : null,
    tamanho: 'sm',
    conteudo: corpo,
    onFechar,
  })

  return modal
}

function iconeNome() {
  // ConfirmDialog original usava TriangleAlert como ícone de perigo.
  return 'TriangleAlert'
}
