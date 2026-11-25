/**
 * Estado em memória do MVP: clientes, ordens de serviço e autenticação.
 * Nenhum dado de negócio é simulado ou persistido no navegador.
 */
import { autenticacaoApi, clientesApi, ordensServicoApi } from '../services/api/index.js'
import { IntegracaoNaoConfiguradaError } from '../services/api/httpClient.js'

export const ESTADO_REQUISICAO = Object.freeze({
  CARREGANDO: 'carregando',
  CARREGADO: 'carregado',
  VAZIO: 'vazio',
  ERRO: 'erro',
  SEM_INTEGRACAO: 'sem-integracao',
})

export const ESTADO_OPERACAO = Object.freeze({
  EM_ANDAMENTO: 'em-andamento',
  CONCLUIDA: 'concluida',
  NAO_CONCLUIDA: 'nao-concluida',
  SEM_INTEGRACAO: 'sem-integracao',
})

const FONTES = Object.freeze([
  ['clientes', clientesApi.listar],
  ['ordens', ordensServicoApi.listar],
])

const ouvintes = new Set()
let db = { clientes: [], ordens: [] }
let requisicao = { status: ESTADO_REQUISICAO.SEM_INTEGRACAO, erro: null, atualizadoEm: null }
let operacao = { status: null, erro: null, entidade: null }
let initialized = false

function notificar() {
  for (const ouvinte of ouvintes) ouvinte(db, requisicao, operacao)
}

function definirRequisicao(status, erro = null) {
  requisicao = { status, erro, atualizadoEm: new Date().toISOString() }
  notificar()
}

function definirOperacao(status, { erro = null, entidade = null } = {}) {
  operacao = { status, erro, entidade }
  notificar()
}

function erroAmigavel(erro) {
  if (erro instanceof IntegracaoNaoConfiguradaError) {
    return 'Esta operação depende da configuração da API.'
  }
  if (erro?.name === 'AbortError') return 'A operação foi interrompida antes da conclusão.'
  return erro?.message || 'Não foi possível concluir a operação.'
}

function resultadoFalha(erro, entidade) {
  const semIntegracao = erro instanceof IntegracaoNaoConfiguradaError
  return {
    ok: false,
    status: semIntegracao ? ESTADO_OPERACAO.SEM_INTEGRACAO : ESTADO_OPERACAO.NAO_CONCLUIDA,
    data: null,
    erro: erroAmigavel(erro),
    codigo: erro?.codigo ?? null,
    entidade,
  }
}

async function executarOperacao(entidade, operacaoApi) {
  definirOperacao(ESTADO_OPERACAO.EM_ANDAMENTO, { entidade })
  try {
    const data = await operacaoApi()
    definirOperacao(ESTADO_OPERACAO.CONCLUIDA, { entidade })
    await sincronizarDados()
    return { ok: true, status: ESTADO_OPERACAO.CONCLUIDA, data, erro: null, entidade }
  } catch (erro) {
    const falha = resultadoFalha(erro, entidade)
    definirOperacao(falha.status, { erro: falha.erro, entidade })
    return falha
  }
}

async function executarConsulta(entidade, consultaApi) {
  try {
    return { ok: true, data: await consultaApi(), erro: null, entidade }
  } catch (erro) {
    return resultadoFalha(erro, entidade)
  }
}

const acoes = {
  clientes: {
    criar: (dados) => executarOperacao('clientes', () => clientesApi.criar(dados)),
    atualizar: (id, dados) => executarOperacao('clientes', () => clientesApi.atualizar(id, dados)),
    remover: (id) => executarOperacao('clientes', () => clientesApi.remover(id)),
  },
  ordens: {
    criar: (dados) => executarOperacao('ordens', () => ordensServicoApi.criar(dados)),
    atualizar: (id, dados) => executarOperacao('ordens', () => ordensServicoApi.atualizar(id, dados)),
    remover: (id) => executarOperacao('ordens', () => ordensServicoApi.remover(id)),
  },
  autenticacao: {
    entrar: (credenciais) => executarOperacao('autenticacao', () => autenticacaoApi.entrar(credenciais)),
    sair: () => executarConsulta('autenticacao', () => autenticacaoApi.sair()),
  },
}

export function iniciarStore() {
  if (!initialized) {
    initialized = true
    // Remove somente resíduos de versões antigas; não há storage de negócio no MVP.
    try {
      for (const chave of ['linha-fina:dados:v1', 'linha-fina:sessao:v1']) localStorage.removeItem(chave)
    } catch {
      // A aplicação também funciona com armazenamento bloqueado.
    }
    notificar()
  }
  return db
}

async function buscarColecoes() {
  const respostas = await Promise.allSettled(FONTES.map(([, listar]) => listar()))
  const atual = { ...db }
  let algumaLeitura = false
  let primeiroErro = null

  respostas.forEach((resposta, indice) => {
    const chave = FONTES[indice][0]
    if (resposta.status === 'fulfilled') {
      algumaLeitura = true
      const registros = Array.isArray(resposta.value) ? resposta.value : resposta.value?.data ?? []
      atual[chave] = Array.isArray(registros) ? registros : []
    } else if (!(resposta.reason instanceof IntegracaoNaoConfiguradaError)) {
      primeiroErro ??= resposta.reason
    }
  })
  return { atual, algumaLeitura, primeiroErro }
}

async function sincronizarDados() {
  try {
    const { atual, algumaLeitura, primeiroErro } = await buscarColecoes()
    if (primeiroErro || !algumaLeitura) return
    db = atual
    notificar()
  } catch {
    // A mutação já foi confirmada; uma falha de reconciliação não a desfaz.
  }
}

export async function carregarDados() {
  definirRequisicao(ESTADO_REQUISICAO.CARREGANDO)
  try {
    const { atual, algumaLeitura, primeiroErro } = await buscarColecoes()
    db = atual
    if (primeiroErro) {
      const erro = erroAmigavel(primeiroErro)
      definirRequisicao(ESTADO_REQUISICAO.ERRO, erro)
      return { ok: false, status: ESTADO_REQUISICAO.ERRO, error: erro }
    }
    if (!algumaLeitura) {
      definirRequisicao(ESTADO_REQUISICAO.SEM_INTEGRACAO)
      return { ok: false, status: ESTADO_REQUISICAO.SEM_INTEGRACAO, error: null }
    }
    const vazio = FONTES.every(([chave]) => atual[chave].length === 0)
    definirRequisicao(vazio ? ESTADO_REQUISICAO.VAZIO : ESTADO_REQUISICAO.CARREGADO)
    return { ok: true, status: requisicao.status, error: null }
  } catch (erro) {
    const mensagem = erroAmigavel(erro)
    definirRequisicao(ESTADO_REQUISICAO.ERRO, mensagem)
    return { ok: false, status: ESTADO_REQUISICAO.ERRO, error: mensagem }
  }
}

export function obterDb() { return db }
export function obterEstadoRequisicao() { return requisicao }
export function obterEstadoOperacao() { return operacao }
export function storePronto() { return initialized }
export function estaCarregando() { return requisicao.status === ESTADO_REQUISICAO.CARREGANDO }
export function estaVazio() { return requisicao.status === ESTADO_REQUISICAO.VAZIO }
export function semIntegracao() { return requisicao.status === ESTADO_REQUISICAO.SEM_INTEGRACAO }

export function assinarStore(ouvinte) {
  ouvintes.add(ouvinte)
  return () => ouvintes.delete(ouvinte)
}

export async function recarregarDados() { return carregarDados() }

export { acoes }
