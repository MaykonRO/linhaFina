/**
 * Página 404 — o mesmo tom do resto do sistema (pages/nao-encontrada.html).
 */

import { h } from '../components/dom.js'
import { icone } from '../components/icons.js'
import { caminho } from '../app/rotas.js'

const destino = document.getElementById('pagina')
if (destino) {
  destino.replaceChildren(
    h('div', { class: 'pagina-404' },
      h('span', { class: 'pagina-404-icone', innerHTML: icone('Pin', 'ic ic--24') }),
      h('div', { class: 'pagina-404-textos' },
        h('p', { class: 'pagina-404-codigo tnum' }, '404'),
        h('h1', { class: 'pagina-404-titulo' }, 'O ponto se perdeu no caminho'),
        h('p', { class: 'pagina-404-descricao' },
          'A página que você tentou abrir não existe ou foi removida do sistema.'
        )
      ),
      h('a', { href: caminho('dashboard'), class: 'btn btn--primario btn--lg pagina-404-botao' },
        'Voltar para a visão geral'
      )
    )
  )
}
