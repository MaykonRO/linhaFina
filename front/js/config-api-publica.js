/* Bootstrap restrito da vitrine pública: nenhum endpoint administrativo é chamado. */
window.LF_API_CONFIG = {
  baseUrl: 'http://localhost:8080/api',
  timeoutMs: 10000,
  credentials: 'include',
  headers: {},
}
window.LF_API_ENDPOINTS = {
  'vitrine.pecas.listar': '/vitrine/publica',
  'configuracoes.buscar': '/configuracoes',
}
