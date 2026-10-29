/**
 * Módulos de acesso às entidades.
 *
 * As chaves de rota são configuradas em `window.LF_API_ENDPOINTS` (ou em
 * `window.LF_API_CONFIG.endpoints`). Este arquivo não presume nenhuma rota do
 * Spring Boot: sem configuração, a operação falha antes de qualquer fetch.
 */

import { endpointConfigurado } from './config.js'
import { httpClient, requestUrl, IntegracaoNaoConfiguradaError } from './httpClient.js'

function resolverRota(rota, pathParams = {}) {
  const caminho = endpointConfigurado(rota)
  if (!caminho) throw new IntegracaoNaoConfiguradaError(rota)
  return Object.entries(pathParams).reduce(
    (valor, [chave, item]) => valor.replaceAll(`{${chave}}`, encodeURIComponent(String(item))),
    caminho,
  )
}

async function comId(rota, id, opcoes = {}) {
  return requestUrl(resolverRota(rota, { id }), opcoes)
}

async function comIdEBody(rota, id, method, body, opcoes = {}) {
  return requestUrl(resolverRota(rota, { id }), { ...opcoes, method, body })
}

export const clientesApi = {
  listar: (params, opcoes) => httpClient.get('clientes.listar', params, opcoes),
  obter: (id, opcoes) => comId('clientes.obter', id, opcoes),
  criar: (dados, opcoes) => httpClient.post('clientes.criar', dados, opcoes),
  atualizar: (id, dados, opcoes) => comIdEBody('clientes.atualizar', id, 'PUT', dados, opcoes),
  remover: (id, opcoes) => comIdEBody('clientes.remover', id, 'DELETE', undefined, opcoes),
}

export const servicosApi = {
  listar: (params, opcoes) => httpClient.get('servicos.listar', params, opcoes),
  obter: (id, opcoes) => comId('servicos.obter', id, opcoes),
  criar: (dados, opcoes) => httpClient.post('servicos.criar', dados, opcoes),
  atualizar: (id, dados, opcoes) => comIdEBody('servicos.atualizar', id, 'PUT', dados, opcoes),
  alternarSituacao: (id, ativo, opcoes) => comIdEBody('servicos.alternar-situacao', id, 'PATCH', { ativo }, opcoes),
  remover: (id, opcoes) => comIdEBody('servicos.remover', id, 'DELETE', undefined, opcoes),
}

export const ordensServicoApi = {
  listar: (params, opcoes) => httpClient.get('ordens-servico.listar', params, opcoes),
  obter: (id, opcoes) => comId('ordens-servico.obter', id, opcoes),
  criar: (dados, opcoes) => httpClient.post('ordens-servico.criar', dados, opcoes),
  atualizar: (id, dados, opcoes) => comIdEBody('ordens-servico.atualizar', id, 'PUT', dados, opcoes),
  avancarStatus: (id, opcoes) => comIdEBody('ordens-servico.avancar-status', id, 'POST', undefined, opcoes),
  cancelar: (id, motivo, opcoes) => comIdEBody('ordens-servico.cancelar', id, 'POST', { motivo }, opcoes),
  registrarPagamento: (id, dados, opcoes) => comIdEBody('ordens-servico.pagamento', id, 'POST', dados, opcoes),
}

export const orcamentosApi = {
  listar: (params, opcoes) => httpClient.get('orcamentos.listar', params, opcoes),
  obter: (id, opcoes) => comId('orcamentos.obter', id, opcoes),
  criar: (dados, opcoes) => httpClient.post('orcamentos.criar', dados, opcoes),
  atualizar: (id, dados, opcoes) => comIdEBody('orcamentos.atualizar', id, 'PUT', dados, opcoes),
  aprovar: (id, opcoes) => comIdEBody('orcamentos.aprovar', id, 'POST', undefined, opcoes),
  recusar: (id, motivo, opcoes) => comIdEBody('orcamentos.recusar', id, 'POST', { motivo }, opcoes),
  converterEmOS: (id, opcoes) => comIdEBody('orcamentos.converter', id, 'POST', undefined, opcoes),
}

export const funcionariasApi = {
  listar: (params, opcoes) => httpClient.get('funcionarias.listar', params, opcoes),
  criar: (dados, opcoes) => httpClient.post('funcionarias.criar', dados, opcoes),
  atualizar: (id, dados, opcoes) => comIdEBody('funcionarias.atualizar', id, 'PUT', dados, opcoes),
  remover: (id, opcoes) => comIdEBody('funcionarias.remover', id, 'DELETE', undefined, opcoes),
}

export const vitrineApi = {
  listarPecas: (params, opcoes) => httpClient.get('vitrine.pecas.listar', params, opcoes),
  criarPeca: (dados, opcoes) => httpClient.post('vitrine.pecas.criar', dados, opcoes),
  atualizarPeca: (id, dados, opcoes) => comIdEBody('vitrine.pecas.atualizar', id, 'PUT', dados, opcoes),
  alternarExibicao: (id, opcoes) => comIdEBody('vitrine.pecas.alternar-exibicao', id, 'POST', undefined, opcoes),
  alternarDestaque: (id, opcoes) => comIdEBody('vitrine.pecas.alternar-destaque', id, 'POST', undefined, opcoes),
  removerPeca: (id, opcoes) => comIdEBody('vitrine.pecas.remover', id, 'DELETE', undefined, opcoes),
}

export const pagamentosApi = {
  listar: (params, opcoes) => httpClient.get('pagamentos.listar', params, opcoes),
  registrar: (id, dados, opcoes) => comIdEBody('pagamentos.registrar', id, 'POST', dados, opcoes),
}

export const relatoriosApi = {
  resumo: (params, opcoes) => httpClient.get('relatorios.resumo', params, opcoes),
  entregas: (params, opcoes) => httpClient.get('relatorios.entregas', params, opcoes),
  produtividade: (params, opcoes) => httpClient.get('relatorios.produtividade', params, opcoes),
}

export const configuracoesApi = {
  buscar: (opcoes) => httpClient.get('configuracoes.buscar', undefined, opcoes),
  atualizar: (alteracoes, opcoes) => httpClient.put('configuracoes.atualizar', alteracoes, opcoes),
}

export const autenticacaoApi = {
  entrar: (credenciais, opcoes) => httpClient.post('autenticacao.entrar', credenciais, opcoes),
  sair: (opcoes) => httpClient.post('autenticacao.sair', undefined, opcoes),
  sessaoAtual: (opcoes) => httpClient.get('autenticacao.sessao', undefined, opcoes),
}

export { ErroApi, IntegracaoNaoConfiguradaError } from './httpClient.js'
