/**
 * Cliente HTTP central para a futura API REST do Spring Boot.
 *
 * Usa `fetch` nativo. As operações lógicas só fazem requisição depois que a
 * respective rota foi confirmada em `window.LF_API_ENDPOINTS`.
 */

import { endpointConfigurado, obterConfigApi } from './config.js'

export class ErroApi extends Error {
  constructor(mensagem, { status = 0, codigo = 'erro-api', causa = null } = {}) {
    super(mensagem)
    this.name = 'ErroApi'
    this.status = status
    this.codigo = codigo
    this.causa = causa
  }
}

export class IntegracaoNaoConfiguradaError extends ErroApi {
  constructor(rota) {
    super(
      `A integração para "${rota}" ainda não foi configurada. Nenhuma requisição foi realizada.`,
      { status: 0, codigo: 'integracao-nao-configurada' },
    )
    this.name = 'IntegracaoNaoConfiguradaError'
    this.rota = rota
  }
}

function montarQuery(params) {
  if (!params) return ''
  const busca = new URLSearchParams()
  for (const [chave, valor] of Object.entries(params)) {
    if (valor !== undefined && valor !== null && valor !== '') busca.append(chave, valor)
  }
  const texto = busca.toString()
  return texto ? `?${texto}` : ''
}

function montarUrl(baseUrl, caminho, params) {
  const prefixo = caminho.startsWith('/') ? caminho : `/${caminho}`
  return `${baseUrl}${prefixo}${montarQuery(params)}`
}

async function lerResposta(resposta) {
  if (resposta.status === 204) return null
  const tipo = resposta.headers.get('content-type') ?? ''
  if (!tipo.includes('application/json')) {
    const texto = await resposta.text()
    return texto ? texto : null
  }

  try {
    return await resposta.json()
  } catch (erro) {
    throw new ErroApi('A API respondeu com JSON inválido.', {
      status: resposta.status,
      codigo: 'resposta-json-invalida',
      causa: erro,
    })
  }
}

async function mensagemDeErro(resposta) {
  try {
    const dados = await resposta.clone().json()
    return dados?.message || dados?.erro || dados?.detail || `Erro ${resposta.status}`
  } catch {
    return `Erro ${resposta.status}`
  }
}

/** Executa uma requisição em uma URL já resolvida pela camada de entidade. */
export async function requestUrl(caminho, { method = 'GET', body, params, signal } = {}) {
  const config = obterConfigApi()
  const controlador = new AbortController()
  const temporizador = setTimeout(() => controlador.abort(), config.timeoutMs)
  const sinais = signal ? [controlador.signal, signal] : [controlador.signal]

  let resposta
  try {
    resposta = await fetch(montarUrl(config.baseUrl, caminho, params), {
      method,
      headers: {
        Accept: 'application/json',
        ...config.headers,
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: config.credentials,
      signal: sinais.length > 1 ? AbortSignal.any(signais) : sinais[0],
    })
  } catch (erro) {
    if (erro?.name === 'AbortError') {
      throw new ErroApi('A API demorou demais para responder. Tente novamente.', {
        status: 0,
        codigo: 'tempo-esgotado',
        causa: erro,
      })
    }
    throw new ErroApi('Não foi possível conectar ao servidor. Verifique se a API está no ar.', {
      status: 0,
      codigo: 'falha-de-rede',
      causa: erro,
    })
  } finally {
    clearTimeout(temporizador)
  }

  if (!resposta.ok) {
    throw new ErroApi(await mensagemDeErro(resposta), {
      status: resposta.status,
      codigo: resposta.status >= 500 ? 'erro-servidor' : 'erro-requisicao',
    })
  }

  return lerResposta(resposta)
}

async function requisicao(rota, opcoes = {}) {
  const caminho = endpointConfigurado(rota)
  if (!caminho) throw new IntegracaoNaoConfiguradaError(rota)
  return requestUrl(caminho, opcoes)
}

export const httpClient = {
  get: (rota, params, opcoes = {}) => requisicao(rota, { ...opcoes, method: 'GET', params }),
  post: (rota, body, opcoes = {}) => requisicao(rota, { ...opcoes, method: 'POST', body }),
  put: (rota, body, opcoes = {}) => requisicao(rota, { ...opcoes, method: 'PUT', body }),
  patch: (rota, body, opcoes = {}) => requisicao(rota, { ...opcoes, method: 'PATCH', body }),
  delete: (rota, opcoes = {}) => requisicao(rota, { ...opcoes, method: 'DELETE' }),
}
