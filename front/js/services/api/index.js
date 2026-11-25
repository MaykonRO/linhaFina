/** Acesso HTTP às entidades e à autenticação usadas pelo MVP. */
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

export const ordensServicoApi = {
  listar: (params, opcoes) => httpClient.get('ordens-servico.listar', params, opcoes),
  obter: (id, opcoes) => comId('ordens-servico.obter', id, opcoes),
  criar: (dados, opcoes) => httpClient.post('ordens-servico.criar', dados, opcoes),
  atualizar: (id, dados, opcoes) => comIdEBody('ordens-servico.atualizar', id, 'PUT', dados, opcoes),
  remover: (id, opcoes) => comIdEBody('ordens-servico.remover', id, 'DELETE', undefined, opcoes),
}

export const autenticacaoApi = {
  entrar: (credenciais, opcoes) => httpClient.post('autenticacao.entrar', credenciais, opcoes),
  sair: (opcoes) => httpClient.post('autenticacao.sair', undefined, opcoes),
  sessaoAtual: (opcoes) => httpClient.get('autenticacao.sessao', undefined, opcoes),
}

export { ErroApi, IntegracaoNaoConfiguradaError } from './httpClient.js'
