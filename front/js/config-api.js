/* Configuração real da API Java. Carregar antes dos módulos ES da página. */
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
  'clientes.listar': '/clientes',
  'clientes.obter': '/clientes/{id}',
  'clientes.criar': '/clientes',
  'clientes.atualizar': '/clientes/{id}',
  'clientes.remover': '/clientes/{id}',

  'ordens-servico.listar': '/ordens-servico',
  'ordens-servico.obter': '/ordens-servico/{id}',
  'ordens-servico.criar': '/ordens-servico',
  'ordens-servico.atualizar': '/ordens-servico/{id}',
  'ordens-servico.remover': '/ordens-servico/{id}',

  'autenticacao.entrar': '/autenticacao/entrar',
  'autenticacao.sair': '/autenticacao/sair',
  'autenticacao.sessao': '/autenticacao/sessao',
}
