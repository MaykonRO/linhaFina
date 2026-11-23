/* Configuracao real da API Java. Carregar antes dos modulos ES da pagina. */
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

  'servicos.listar': '/servicos',
  'servicos.obter': '/servicos/{id}',
  'servicos.criar': '/servicos',
  'servicos.atualizar': '/servicos/{id}',
  'servicos.alternar-situacao': '/servicos/{id}/situacao',
  'servicos.remover': '/servicos/{id}',

  'ordens-servico.listar': '/ordens-servico',
  'ordens-servico.obter': '/ordens-servico/{id}',
  'ordens-servico.criar': '/ordens-servico',
  'ordens-servico.prever-prazo': '/ordens-servico/previsao',
  'ordens-servico.atualizar': '/ordens-servico/{id}',
  'ordens-servico.avancar-status': '/ordens-servico/{id}/avancar-status',
  'ordens-servico.cancelar': '/ordens-servico/{id}/cancelar',
  'ordens-servico.prova': '/ordens-servico/{id}/prova',
  'ordens-servico.pagamento': '/ordens-servico/{id}/pagamento',

  'funcionarias.listar': '/funcionarias',
  'funcionarias.criar': '/funcionarias',
  'funcionarias.atualizar': '/funcionarias/{id}',
  'funcionarias.remover': '/funcionarias/{id}',

  'configuracoes.buscar': '/configuracoes',
  'configuracoes.atualizar': '/configuracoes',

  'autenticacao.entrar': '/autenticacao/entrar',
  'autenticacao.sair': '/autenticacao/sair',
  'autenticacao.sessao': '/autenticacao/sessao',

  'pagamentos.listar': '/pagamentos',
  'pagamentos.registrar': '/pagamentos/{id}',

  'orcamentos.listar': '/orcamentos',
  'orcamentos.obter': '/orcamentos/{id}',
  'orcamentos.criar': '/orcamentos',
  'orcamentos.atualizar': '/orcamentos/{id}',
  'orcamentos.aprovar': '/orcamentos/{id}/aprovar',
  'orcamentos.recusar': '/orcamentos/{id}/recusar',
  'orcamentos.converter': '/orcamentos/{id}/converter',

  'vitrine.pecas.listar': '/vitrine/pecas',
  'vitrine.pecas.criar': '/vitrine/pecas',
  'vitrine.pecas.atualizar': '/vitrine/pecas/{id}',
  'vitrine.pecas.alternar-exibicao': '/vitrine/pecas/{id}/alternar-exibicao',
  'vitrine.pecas.alternar-destaque': '/vitrine/pecas/{id}/alternar-destaque',
  'vitrine.pecas.remover': '/vitrine/pecas/{id}',
  'vitrine.pecas.imagem': '/vitrine/pecas/{id}/imagem',
}
