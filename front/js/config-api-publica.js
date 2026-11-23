/* Bootstrap restrito da vitrine pública: nenhum endpoint administrativo é chamado. */
const LF_API_BASE_URL = window.LF_API_BASE_URL ?? (
  ['localhost', '127.0.0.1'].includes(location.hostname)
    ? 'http://localhost:8080/api'
    : 'https://linha-fina-api.onrender.com/api'
)

window.LF_API_CONFIG = {
  baseUrl: LF_API_BASE_URL,
  timeoutMs: 10000,
  credentials: 'include',
  headers: {},
}
window.LF_API_ENDPOINTS = {
  'vitrine.pecas.listar': '/vitrine/publica',
  'configuracoes.buscar': '/configuracoes',
}
