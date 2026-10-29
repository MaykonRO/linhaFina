/**
 * Rotas do Linha Fina — navegação convencional entre páginas HTML.
 *
 * O index.html fica na raiz (é a "Visão geral"); as demais páginas moram em
 * pages/. Este módulo abstrai a diferença de profundidade: cada página chama
 * caminho('ordens-servico') e recebe a URL correta a partir de onde estiver.
 */

const PAGINAS = {
  dashboard: 'index.html',
  login: 'pages/login.html',
  'vitrine-publica': 'pages/vitrine-publica.html',
  agenda: 'pages/agenda.html',
  'ordens-servico': 'pages/ordens-servico.html',
  'ordem-servico-form': 'pages/ordem-servico-form.html',
  orcamentos: 'pages/orcamentos.html',
  clientes: 'pages/clientes.html',
  'cliente-detalhe': 'pages/cliente-detalhe.html',
  servicos: 'pages/servicos.html',
  vitrine: 'pages/vitrine.html',
  equipe: 'pages/equipe.html',
  financeiro: 'pages/financeiro.html',
  relatorios: 'pages/relatorios.html',
  configuracoes: 'pages/configuracoes.html',
  'nao-encontrada': 'pages/nao-encontrada.html',
}

/** true quando a página atual está na raiz (index.html). */
export function naRaiz() {
  return !location.pathname.includes('/pages/')
}

/**
 * Prefixo de URL para alcançar a raiz a partir da página atual ('' ou '../').
 * Usado por links que precisam sair de pages/ (ex.: assets na raiz).
 */
export function prefixoRaiz() {
  return naRaiz() ? '' : '../'
}

/**
 * Monta a URL de uma página.
 *
 * A URL é sempre relativa ao diretório da página atual:
 *   - na raiz:        `pages/agenda.html`, `index.html`
 *   - dentro de pages/: `agenda.html` (mesma pasta), `../index.html` (raiz)
 *
 * @param {string} pagina chave de PAGINAS
 * @param {Record<string, string>} [params] query params (ignora valores vazios)
 */
export function caminho(pagina, params) {
  const alvo = PAGINAS[pagina] ?? PAGINAS['nao-encontrada']
  let url
  if (naRaiz()) {
    url = alvo
  } else if (alvo.startsWith('pages/')) {
    // Mesma pasta: basta o nome do arquivo (sem `../`, que levaria à raiz).
    url = alvo.slice('pages/'.length)
  } else {
    // Página da raiz (dashboard): sobe um nível.
    url = `../${alvo}`
  }
  const busca = new URLSearchParams()
  if (params) {
    for (const [chave, valor] of Object.entries(params)) {
      if (valor !== undefined && valor !== null && valor !== '') busca.set(chave, valor)
    }
  }
  const texto = busca.toString()
  return texto ? `${url}?${texto}` : url
}

/** Navega para uma página (substitui o histórico em fluxos de formulário). */
export function navegar(pagina, params, { substituir = false } = {}) {
  const destino = caminho(pagina, params)
  if (substituir) location.replace(destino)
  else location.assign(destino)
}
