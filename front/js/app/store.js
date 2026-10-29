/**
 * Contexto de dados do Linha Fina.
 *
 * O front-end não substitui o back-end: o estado começa vazio, as leituras
 * dependem de uma API configurada e as mutações aguardam o Spring Boot. Não há
 * banco local, seed, IDs autorais nem persistência de dados de negócio.
 */

import {
  autenticacaoApi,
  clientesApi,
  configuracoesApi,
  funcionariasApi,
  orcamentosApi,
  ordensServicoApi,
  servicosApi,
  vitrineApi,
} from '../services/api/index.js'
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

function configuracoesVazias() {
  return {
    atelie: {
      nome: '',
      telefone: '',
      email: '',
      cidade: '',
      endereco: '',
      instagram: '',
    },
    // `ativo: null` significa "horário não informado pela API".
    // Só `ativo: false` (confirmado pela API) fecha o ateliê em um dia.
    horario: [
      { id: 'seg', rotulo: 'Segunda', ativo: null, abre: '', fecha: '' },
      { id: 'ter', rotulo: 'Terça', ativo: null, abre: '', fecha: '' },
      { id: 'qua', rotulo: 'Quarta', ativo: null, abre: '', fecha: '' },
      { id: 'qui', rotulo: 'Quinta', ativo: null, abre: '', fecha: '' },
      { id: 'sex', rotulo: 'Sexta', ativo: null, abre: '', fecha: '' },
      { id: 'sab', rotulo: 'Sábado', ativo: null, abre: '', fecha: '' },
      { id: 'dom', rotulo: 'Domingo', ativo: null, abre: '', fecha: '' },
    ],
    folgas: [],
    taxaUrgenciaPadrao: null,
    fidelidade: {
      ativo: false,
      descontoPercentual: null,
      servicosNecessarios: null,
      regra: '',
    },
    notificacoes: {
      atrasos: false,
      provas: false,
      orcamentosVencendo: false,
      resumoDiario: false,
    },
    interface: {
      compactarTabelas: false,
      mostrarValores: true,
    },
  }
}

function dbVazio() {
  return {
    clientes: [],
    servicos: [],
    ordens: [],
    orcamentos: [],
    funcionarias: [],
    pecas: [],
    pagamentos: [],
    configuracoes: configuracoesVazias(),
  }
}

const ouvintes = new Set()
let db = dbVazio()
let requisicao = {
  status: ESTADO_REQUISICAO.SEM_INTEGRACAO,
  erro: null,
  atualizadoEm: null,
}
let operacao = {
  status: null,
  erro: null,
  entidade: null,
}
let initialized = false

function limparDadosLegados() {
  try {
    for (const chave of ['linha-fina:dados:v1', 'linha-fina:sessao:v1']) {
      localStorage.removeItem(chave)
    }
  } catch {
    // Armazenamento pode estar bloqueado; a aplicação continua sem persistência.
  }
}

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
    return 'A funcionalidade depende da integração com o back-end, que ainda não foi configurada.'
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
    // Reconcilia o estado em memória com a resposta real da API.
    await sincronizarDados()
    return { ok: true, status: ESTADO_OPERACAO.CONCLUIDA, data, erro: null, entidade }
  } catch (erro) {
    const falha = resultadoFalha(erro, entidade)
    definirOperacao(falha.status, { erro: falha.erro, entidade })
    return falha
  }
}

const acoes = {
  clientes: {
    criar: (dados) => executarOperacao('clientes', () => clientesApi.criar(dados)),
    atualizar: (id, dados) => executarOperacao('clientes', () => clientesApi.atualizar(id, dados)),
    remover: (id) => executarOperacao('clientes', () => clientesApi.remover(id)),
  },
  servicos: {
    criar: (dados) => executarOperacao('servicos', () => servicosApi.criar(dados)),
    atualizar: (id, dados) => executarOperacao('servicos', () => servicosApi.atualizar(id, dados)),
    alternarSituacao: (id, ativo) => executarOperacao('servicos', () => servicosApi.alternarSituacao(id, ativo)),
    remover: (id) => executarOperacao('servicos', () => servicosApi.remover(id)),
  },
  ordens: {
    criar: (dados) => executarOperacao('ordens', () => ordensServicoApi.criar(dados)),
    atualizar: (id, dados) => executarOperacao('ordens', () => ordensServicoApi.atualizar(id, dados)),
    avancarStatus: (id) => executarOperacao('ordens', () => ordensServicoApi.avancarStatus(id)),
    cancelar: (id, motivo) => executarOperacao('ordens', () => ordensServicoApi.cancelar(id, motivo)),
    marcarPagamento: (id, dados) => executarOperacao('ordens', () => ordensServicoApi.registrarPagamento(id, dados)),
  },
  orcamentos: {
    criar: (dados) => executarOperacao('orcamentos', () => orcamentosApi.criar(dados)),
    atualizar: (id, dados) => executarOperacao('orcamentos', () => orcamentosApi.atualizar(id, dados)),
    aprovar: (id) => executarOperacao('orcamentos', () => orcamentosApi.aprovar(id)),
    recusar: (id, motivo) => executarOperacao('orcamentos', () => orcamentosApi.recusar(id, motivo)),
    converterEmOS: (id) => executarOperacao('orcamentos', () => orcamentosApi.converterEmOS(id)),
  },
  equipe: {
    criar: (dados) => executarOperacao('funcionarias', () => funcionariasApi.criar(dados)),
    atualizar: (id, dados) => executarOperacao('funcionarias', () => funcionariasApi.atualizar(id, dados)),
    remover: (id) => executarOperacao('funcionarias', () => funcionariasApi.remover(id)),
  },
  vitrine: {
    criar: (dados) => executarOperacao('vitrine', () => vitrineApi.criarPeca(dados)),
    atualizar: (id, dados) => executarOperacao('vitrine', () => vitrineApi.atualizarPeca(id, dados)),
    alternarExibicao: (id) => executarOperacao('vitrine', () => vitrineApi.alternarExibicao(id)),
    alternarDestaque: (id) => executarOperacao('vitrine', () => vitrineApi.alternarDestaque(id)),
    remover: (id) => executarOperacao('vitrine', () => vitrineApi.removerPeca(id)),
  },
  configuracoes: {
    atualizar: (alteracoes) => executarOperacao('configuracoes', () => configuracoesApi.atualizar(alteracoes)),
  },
  autenticacao: {
    entrar: (credenciais) => executarOperacao('autenticacao', () => autenticacaoApi.entrar(credenciais)),
    sair: () => executarOperacao('autenticacao', () => autenticacaoApi.sair()),
  },
}

/**
 * Inicializa o estado vazio. A carga real é opcional e só ocorre quando as
 * rotas correspondentes estiverem configuradas.
 */
export function iniciarStore() {
  if (!initialized) {
    initialized = true
    limparDadosLegados()
    notificar()
  }
  return db
}

/**
 * Carrega coleções reais da API. Quando nenhuma rota está configurada, o
 * estado assume "sem integração" sem executar requisições.
 */
const FONTES = Object.freeze([
  ['clientes', clientesApi.listar],
  ['servicos', servicosApi.listar],
  ['ordens', ordensServicoApi.listar],
  ['orcamentos', orcamentosApi.listar],
  ['funcionarias', funcionariasApi.listar],
  ['pecas', vitrineApi.listarPecas],
])

function mesclarConfiguracoes(config) {
  const padrao = configuracoesVazias()
  return {
    ...padrao,
    ...config,
    atelie: { ...padrao.atelie, ...(config.atelie ?? {}) },
    horario: mesclarHorario(config.horario, padrao.horario),
    folgas: Array.isArray(config.folgas) ? config.folgas : [],
    fidelidade: { ...padrao.fidelidade, ...(config.fidelidade ?? {}) },
    notificacoes: { ...padrao.notificacoes, ...(config.notificacoes ?? {}) },
    interface: { ...padrao.interface, ...(config.interface ?? {}) },
  }
}

/**
 * Normaliza o horário vindo da API: preserva os 7 dias, completa campos
 * ausentes e mantém `ativo: null` quando a API não informar o dia.
 */
function mesclarHorario(horario, padrao) {
  if (!Array.isArray(horario)) return padrao
  return padrao.map((diaPadrao) => {
    const dia = horario.find((d) => d?.id === diaPadrao.id)
    if (!dia) return { ...diaPadrao }
    const ativo = dia.ativo === true || dia.ativo === false ? dia.ativo : null
    return {
      ...diaPadrao,
      ...dia,
      ativo,
      abre: typeof dia.abre === 'string' ? dia.abre : diaPadrao.abre,
      fecha: typeof dia.fecha === 'string' ? dia.fecha : diaPadrao.fecha,
    }
  })
}

/** Lê as coleções reais sem alterar o estado de requisição. */
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

  try {
    const config = await configuracoesApi.buscar()
    if (config && typeof config === 'object') {
      atual.configuracoes = mesclarConfiguracoes(config)
      algumaLeitura = true
    }
  } catch (erro) {
    if (!(erro instanceof IntegracaoNaoConfiguradaError)) primeiroErro ??= erro
  }

  return { atual, algumaLeitura, primeiroErro }
}

/** Reconcilia o estado em memória após uma mutação concluída. */
async function sincronizarDados() {
  try {
    const { atual, algumaLeitura, primeiroErro } = await buscarColecoes()
    if (primeiroErro || !algumaLeitura) return
    db = atual
    notificar()
  } catch {
    // A mutação já foi confirmada pela API; a reconciliação é secundária.
  }
}

export async function carregarDados() {
  definirRequisicao(ESTADO_REQUISICAO.CARREGANDO)

  try {
    const { atual, algumaLeitura, primeiroErro } = await buscarColecoes()

    db = atual
    if (primeiroErro) {
      definirRequisicao(ESTADO_REQUISICAO.ERRO, erroAmigavel(primeiroErro))
      return { ok: false, status: ESTADO_REQUISICAO.ERRO, error: erroAmigavel(primeiroErro) }
    }
    if (!algumaLeitura) {
      definirRequisicao(ESTADO_REQUISICAO.SEM_INTEGRACAO)
      return { ok: false, status: ESTADO_REQUISICAO.SEM_INTEGRACAO, error: null }
    }

    // "vazio" considera apenas as coleções de registros — as configurações
    // são um objeto e não determinam se há dados de negócio.
    const colecoesVazias = FONTES.every(([chave]) => (atual[chave] ?? []).length === 0)
    definirRequisicao(colecoesVazias ? ESTADO_REQUISICAO.VAZIO : ESTADO_REQUISICAO.CARREGADO)
    return { ok: true, status: requisicao.status, error: null }
  } catch (erro) {
    definirRequisicao(ESTADO_REQUISICAO.ERRO, erroAmigavel(erro))
    return { ok: false, status: ESTADO_REQUISICAO.ERRO, error: erroAmigavel(erro) }
  }
}

export function obterDb() {
  return db
}

export function obterEstadoRequisicao() {
  return requisicao
}

export function obterEstadoOperacao() {
  return operacao
}

export function storePronto() {
  return initialized
}

export function estaCarregando() {
  return requisicao.status === ESTADO_REQUISICAO.CARREGANDO
}

export function estaVazio() {
  return requisicao.status === ESTADO_REQUISICAO.VAZIO
}

export function semIntegracao() {
  return requisicao.status === ESTADO_REQUISICAO.SEM_INTEGRACAO
}

/** Assina mudanças de dados, requisição e operação. */
export function assinarStore(ouvinte) {
  ouvintes.add(ouvinte)
  return () => ouvintes.delete(ouvinte)
}

/** Recarrega os dados reais; útil após erro de comunicação. */
export async function recarregarDados() {
  return carregarDados()
}

export { acoes }
