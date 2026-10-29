/**
 * Mini-hyperscript: criar elementos com props e filhos sem frameworks.
 *
 * h('button', { class: 'btn', onClick: fn }, 'Salvar')
 *  - strings como filhos viram nós de texto (seguro contra injeção)
 *  - prop innerHTML injeta marcação crua (use apenas com conteúdo controlado)
 *  - a prop `children` também é aceita (mesma convenção de botao()/campo())
 */

export function h(tag, props = {}, ...filhos) {
  const node = document.createElement(tag)
  const propsNormalizados = { ...(props || {}) }
  // `children` é uma prop de conteúdo, não um atributo HTML.
  const filhosDaProp = propsNormalizados.children
  delete propsNormalizados.children

  for (const [chave, valor] of Object.entries(propsNormalizados)) {
    if (valor === null || valor === undefined || valor === false) continue
    if (chave === 'class' || chave === 'className') node.className = valor
    else if (chave === 'dataset') Object.assign(node.dataset, valor)
    else if (chave === 'style' && typeof valor === 'object') Object.assign(node.style, valor)
    else if (chave === 'innerHTML') node.innerHTML = valor
    else if (chave.startsWith('on') && typeof valor === 'function') {
      node.addEventListener(chave.slice(2).toLowerCase(), valor)
    } else if (valor === true) node.setAttribute(chave, '')
    else node.setAttribute(chave, String(valor))
  }

  const todosFilhos = filhosDaProp === undefined ? filhos : [filhosDaProp, ...filhos]
  for (const filho of todosFilhos.flat(Infinity)) {
    if (filho === null || filho === undefined || filho === false) continue
    node.append(filho instanceof Node ? filho : document.createTextNode(String(filho)))
  }
  return node
}

/** Limpa o elemento e devolve ele próprio (encadeável). */
export function limpar(elemento) {
  while (elemento.firstChild) elemento.removeChild(elemento.firstChild)
  return elemento
}

/** Substitui o conteúdo de um elemento por um único filho. */
export function preencher(elemento, filho) {
  limpar(elemento)
  if (filho) elemento.append(filho)
  return elemento
}

/**
 * Substitui os filhos de um elemento, ignorando valores vazios.
 * `replaceChildren` nativo converte `false`/`null` em texto ("false").
 */
export function substituirFilhos(elemento, ...filhos) {
  limpar(elemento)
  for (const filho of filhos.flat(Infinity)) {
    if (filho === null || filho === undefined || filho === false || filho === '') continue
    elemento.append(filho instanceof Node ? filho : document.createTextNode(String(filho)))
  }
  return elemento
}

/** Escapa texto para uso seguro em innerHTML (entidades montadas sem literal). */
const AMP = String.fromCharCode(38)
export function escapar(texto) {
  return String(texto)
    .replaceAll(AMP, AMP + 'amp;')
    .replaceAll('<', AMP + 'lt;')
    .replaceAll('>', AMP + 'gt;')
    .replaceAll('"', AMP + 'quot;')
    .replaceAll("'", AMP + '#39;')
}

/** Debounce simples para campos de busca. */
export function debounce(fn, atrasoMs = 300) {
  let timer
  return (...argumentos) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...argumentos), atrasoMs)
  }
}

/** Fecha menus quando o clique acontece fora do elemento. */
export function aoClicarFora(elemento, ativo, onFora) {
  function tratar(evento) {
    if (elemento && !elemento.contains(evento.target)) onFora(evento)
  }
  if (ativo) {
    document.addEventListener('mousedown', tratar)
    return () => document.removeEventListener('mousedown', tratar)
  }
  return () => {}
}

/** Detecta tecla Escape (para fechar modais/menus). */
export function aoEscape(ativo, onEscape) {
  function tratar(evento) {
    if (evento.key === 'Escape') onEscape(evento)
  }
  if (ativo) {
    document.addEventListener('keydown', tratar)
    return () => document.removeEventListener('keydown', tratar)
  }
  return () => {}
}
