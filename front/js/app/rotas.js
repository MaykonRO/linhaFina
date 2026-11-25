/** Rotas das páginas que compõem o MVP. */
const PAGINAS = Object.freeze({
  dashboard: 'index.html',
  login: 'pages/login.html',
  clientes: 'pages/clientes.html',
  'ordens-servico': 'pages/ordens-servico.html',
  'ordem-servico-form': 'pages/ordem-servico-form.html',
})

export function naRaiz() {
  return !location.pathname.includes('/pages/')
}

export function prefixoRaiz() {
  return naRaiz() ? '' : '../'
}

export function caminho(pagina, params) {
  const alvo = PAGINAS[pagina] ?? PAGINAS.dashboard
  let url
  if (naRaiz()) url = alvo
  else if (alvo.startsWith('pages/')) url = alvo.slice('pages/'.length)
  else url = `../${alvo}`

  const busca = new URLSearchParams()
  if (params) {
    for (const [chave, valor] of Object.entries(params)) {
      if (valor !== undefined && valor !== null && valor !== '') busca.set(chave, valor)
    }
  }
  const texto = busca.toString()
  return texto ? `${url}?${texto}` : url
}

export function navegar(pagina, params, { substituir = false } = {}) {
  const destino = caminho(pagina, params)
  if (substituir) location.replace(destino)
  else location.assign(destino)
}
