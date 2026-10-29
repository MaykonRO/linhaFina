/**
 * Configuração central da comunicação HTTP.
 *
 * O front-end é estático e roda sem bundler. Em produção, defina o objeto
 * `window.LF_API_CONFIG` antes dos módulos da aplicação (por exemplo em
 * `config.js` gerado pelo servidor ou por um CDN). Nenhum endpoint é presumido:
 * as rotas são fornecidas em `window.LF_API_ENDPOINTS`.
 */

const PADRAO = Object.freeze({
  baseUrl: 'http://localhost:8080/api',
  timeoutMs: 10000,
  credentials: 'include',
  headers: {},
})

function objetoOuVazio(valor) {
  return valor && typeof valor === 'object' ? valor : {}
}

export function obterConfigApi() {
  const runtime = objetoOuVazio(typeof window !== 'undefined' ? window.LF_API_CONFIG : null)
  const endpoints = objetoOuVazio(
    runtime.endpoints ?? (typeof window !== 'undefined' ? window.LF_API_ENDPOINTS : null),
  )

  return {
    ...PADRAO,
    ...runtime,
    baseUrl: String(runtime.baseUrl ?? PADRAO.baseUrl).replace(/\/$/, ''),
    timeoutMs: Number(runtime.timeoutMs ?? PADRAO.timeoutMs),
    credentials: runtime.credentials ?? PADRAO.credentials,
    headers: { ...PADRAO.headers, ...objetoOuVazio(runtime.headers) },
    endpoints,
  }
}

export function endpointConfigurado(nome) {
  const { endpoints } = obterConfigApi()
  const valor = endpoints[nome]
  return typeof valor === 'string' && valor.trim() ? valor.trim() : null
}
