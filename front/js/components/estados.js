/**
 * Estados globais de carregamento, erro e integração pendente.
 */

import { h } from './dom.js'
import { icone } from './icons.js'
import { estadoVazio, telaCarregando } from './ui.js'
import { estadoSemIntegracao, MENSAGEM_SEM_INTEGRACAO, MENSAGEM_SEM_DADOS } from './integracao.js'
import { ESTADO_OPERACAO, ESTADO_REQUISICAO } from '../app/store.js'

export { estadoSemIntegracao }

export function estadoCarregando({ mensagem = 'Carregando dados reais…' } = {}) {
  return telaCarregando({ mensagem })
}

export function estadoErro({
  titulo = 'Não foi possível carregar os dados.',
  descricao = 'Verifique a conexão com a API e tente novamente.',
  onTentar = null,
} = {}) {
  return estadoVazio({
    icone: 'TriangleAlert',
    titulo,
    descricao,
    acao: onTentar
      ? h('button', {
          type: 'button',
          class: 'btn btn--secundario btn--md',
          onClick: onTentar,
          children: [h('span', { class: 'ic-caixa', innerHTML: icone('RefreshCw', 'ic ic--16') }), 'Tentar novamente'],
        })
      : null,
    classe: 'estado-erro-dados',
  })
}

/**
 * Bloco de estado da requisição, pronto para inserir no topo de uma página.
 * Retorna null quando a requisição terminou com sucesso.
 */
export function blocoEstadoRequisicao({
  status,
  erro = null,
  onTentar = null,
} = {}) {
  if (status === ESTADO_REQUISICAO.CARREGANDO) {
    return estadoCarregando()
  }
  if (status === ESTADO_REQUISICAO.ERRO) {
    return h('div', { class: 'estado-erro-dados-container' },
      estadoErro({
        titulo: 'Não foi possível carregar os dados.',
        descricao: erro || 'Verifique a conexão com a API e tente novamente.',
        onTentar,
      })
    )
  }
  return null
}

/**
 * Aviso discreto exibido quando a API respondeu, mas ainda não há registros.
 * Diferencia "sem dados" de "sem integração".
 */
export function avisoSemDados({ mensagem = MENSAGEM_SEM_DADOS } = {}) {
  return h('div', { class: 'aviso-integracao aviso-integracao--vazio', role: 'note' },
    h('span', { class: 'ic-caixa aviso-integracao-icone', innerHTML: icone('Inbox', 'ic ic--16') }),
    h('p', { class: 'aviso-integracao-texto' }, mensagem)
  )
}

/** Aviso discreto exibido quando a API ainda não está configurada. */
export function avisoSemIntegracao({ mensagem = MENSAGEM_SEM_INTEGRACAO } = {}) {
  return h('div', { class: 'aviso-integracao', role: 'note' },
    h('span', { class: 'ic-caixa aviso-integracao-icone', innerHTML: icone('Info', 'ic ic--16') }),
    h('p', { class: 'aviso-integracao-texto' }, mensagem)
  )
}

/**
 * Barra global de status: comunica carregamento, operação em andamento,
 * operação concluída e operação não concluída em uma única região viva.
 */
export function barraStatus({ className = '', ocultarAposMs = 4000 } = {}) {
  const raiz = h('div', {
    class: `status-global${className ? ` ${className}` : ''}`,
    role: 'status',
    'aria-live': 'polite',
    hidden: '',
  })
  let temporizador = null

  function esconder() {
    if (temporizador) {
      clearTimeout(temporizador)
      temporizador = null
    }
    raiz.replaceChildren()
    raiz.hidden = true
  }

  function renderizar({ status, erro = null, entidade = null } = {}) {
    if (temporizador) {
      clearTimeout(temporizador)
      temporizador = null
    }

    if (!status) {
      esconder()
      return
    }

    raiz.hidden = false
    if (status === ESTADO_OPERACAO.EM_ANDAMENTO) {
      raiz.className = `status-global status-global--carregando${className ? ` ${className}` : ''}`
      raiz.replaceChildren(
        h('span', { class: 'ic-caixa girar', innerHTML: icone('LoaderCircle', 'ic ic--16') }),
        h('span', { class: 'status-global-texto' }, `${rotuloEntidade(entidade)} em andamento…`)
      )
      return
    }

    const sucesso = status === ESTADO_OPERACAO.CONCLUIDA
    raiz.className = `status-global ${sucesso ? 'status-global--sucesso' : 'status-global--erro'}${className ? ` ${className}` : ''}`
    raiz.replaceChildren(
      h('span', { class: 'ic-caixa', innerHTML: icone(sucesso ? 'CircleCheck' : 'CircleAlert', 'ic ic--16') }),
      h('span', { class: 'status-global-texto' }, sucesso
        ? `${rotuloEntidade(entidade)} concluída.`
        : erro || 'A operação não foi concluída.')
    )

    temporizador = setTimeout(esconder, ocultarAposMs)
  }

  return { raiz, renderizar, esconder }
}

function rotuloEntidade(entidade) {
  if (!entidade) return 'Operação'
  const mapa = {
    clientes: 'Operação de cliente',
    servicos: 'Operação de serviço',
    ordens: 'Operação de ordem de serviço',
    orcamentos: 'Operação de orçamento',
    funcionarias: 'Operação de equipe',
    vitrine: 'Operação de vitrine',
    configuracoes: 'Operação de configurações',
    autenticacao: 'Operação de autenticação',
  }
  return mapa[entidade] ?? 'Operação'
}
