/**
 * Mensagens e estados reutilizáveis para operações sem back-end conectado.
 */

import { h } from './dom.js'
import { icone } from './icons.js'
import { estadoVazio } from './ui.js'

export const MENSAGEM_SEM_INTEGRACAO =
  'Esta ação depende da integração com o back-end real, que ainda não foi configurada.'

export const MENSAGEM_SEM_DADOS =
  'A API está conectada e respondeu, mas ainda não há registros cadastrados.'

export function avisoIntegracao({ mensagem = MENSAGEM_SEM_INTEGRACAO, classe = '' } = {}) {
  return h(
    'div',
    { class: `aviso-integracao${classe ? ` ${classe}` : ''}`, role: 'note' },
    h('span', { class: 'ic-caixa aviso-integracao-icone', innerHTML: icone('Info', 'ic ic--16') }),
    h('p', { class: 'aviso-integracao-texto' }, mensagem),
  )
}

export function estadoSemIntegracao({
  titulo = 'Integração com o back-end pendente.',
  descricao = MENSAGEM_SEM_INTEGRACAO,
  acao = null,
} = {}) {
  return estadoVazio({
    icone: 'PlugZap',
    titulo,
    descricao,
    acao,
    classe: 'estado-sem-integracao',
  })
}
