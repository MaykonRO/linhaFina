/** Dashboard essencial: boas-vindas e acesso às duas áreas de operação. */
import { iniciarApp } from '../app/boot.js'
import { assinarSessao, sessaoAtual } from '../app/sessao.js'
import { caminho } from '../app/rotas.js'
import { h } from '../components/dom.js'
import { icone } from '../components/icons.js'
import { pageHeader, botaoLink } from '../components/ui.js'

function renderizar() {
  const destino = document.getElementById('pagina')
  if (!destino) return
  const nome = sessaoAtual()?.nome?.trim()
  destino.replaceChildren(h('div', { class: 'pilha-6 animar-entrada' },
    pageHeader({
      titulo: nome ? `Boas-vindas, ${nome.split(/\s+/)[0]}!` : 'Boas-vindas ao Linha Fina!',
      descricao: 'Gerencie clientes e ordens de serviço do ateliê.',
    }),
    h('section', { class: 'card-surface cartao-padrao largura-max-form pilha-4', 'aria-labelledby': 'atalhos-mvp' },
      h('div', {},
        h('h2', { class: 'cartao-rotulo', id: 'atalhos-mvp' }, 'O que você quer fazer?'),
        h('p', { class: 'cartao-subtitulo' }, 'Escolha uma área para começar.')
      ),
      h('div', { class: 'acoes-envoltura' },
        botaoLink({
          para: caminho('clientes'),
          children: [h('span', { class: 'ic-caixa', innerHTML: icone('Users', 'ic ic--16') }), 'Gerenciar clientes'],
        }),
        botaoLink({
          para: caminho('ordens-servico'), variante: 'secundario',
          children: [h('span', { class: 'ic-caixa', innerHTML: icone('ClipboardList', 'ic ic--16') }), 'Ver ordens de serviço'],
        }),
        botaoLink({
          para: caminho('ordem-servico-form'), variante: 'secundario',
          children: [h('span', { class: 'ic-caixa', innerHTML: icone('Plus', 'ic ic--16') }), 'Nova OS'],
        })
      )
    )
  ))
}

iniciarApp('dashboard')
assinarSessao(renderizar)
renderizar()
