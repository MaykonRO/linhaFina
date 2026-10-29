/**
 * Vitrine pública do ateliê — página aberta, fora do shell administrativo.
 *
 * Identidade própria dentro da marca: header fino com a marca, hero com a
 * assinatura de costura (.stitch), galeria das peças ativas e contato.
 * Os registros e contatos serão carregados da API; nenhuma venda é processada.
 */

import { iniciarStore, obterDb, carregarDados, recarregarDados, assinarStore, obterEstadoRequisicao, ESTADO_REQUISICAO } from '../app/store.js'
import { caminho } from '../app/rotas.js'
import { toast } from '../components/toast.js'
import { marcaLinhaFina } from '../components/layout.js'
import { h } from '../components/dom.js'
import { icone } from '../components/icons.js'
import { badge, botao, estadoVazio } from '../components/ui.js'
import { artePeca } from '../components/arte.js'
import { contatoAtelie } from '../services/estatisticas.js'
import { formatarMoeda, formatarTelefone, textoSeguro, compararTexto } from '../utils/format.js'

iniciarStore()
void carregarDados()

const DESTAQUES_HERO = [
  { icone: 'Scissors', rotulo: 'Sob medida' },
  { icone: 'Shirt', rotulo: 'Provas intermediárias' },
  { icone: 'Truck', rotulo: 'Acompanhamento de ordens' },
]

const ICONES_CONTATO = {
  Endereço: 'MapPin',
  Telefone: 'Phone',
  'E-mail': 'Mail',
  Instagram: 'AtSign',
}

const ABREVIACOES_DIAS = {
  seg: 'Seg', ter: 'Ter', qua: 'Qua', qui: 'Qui', sex: 'Sex', sab: 'Sáb', dom: 'Dom',
}

const ORDEM_SEMANA = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom']

/** Resume o horário agrupando dias consecutivos iguais: "Seg–Sex 09:00–18:00". */
function resumirHorario(horario) {
  const ativos = [...horario]
    .filter((d) => d.ativo && d.abre && d.fecha)
    .sort((a, b) => ORDEM_SEMANA.indexOf(a.id) - ORDEM_SEMANA.indexOf(b.id))

  const grupos = []
  for (const dia of ativos) {
    const ultimo = grupos[grupos.length - 1]
    if (ultimo && ultimo.abre === dia.abre && ultimo.fecha === dia.fecha) {
      ultimo.fim = dia.id
    } else {
      grupos.push({ inicio: dia.id, fim: dia.id, abre: dia.abre, fecha: dia.fecha })
    }
  }

  return grupos
    .map((g) => {
      const dias =
        g.inicio === g.fim
          ? ABREVIACOES_DIAS[g.inicio]
          : `${ABREVIACOES_DIAS[g.inicio]}–${ABREVIACOES_DIAS[g.fim]}`
      return `${dias} ${g.abre}–${g.fecha}`
    })
    .join(' · ')
}

const destino = document.getElementById('pagina')
if (destino) {
  renderizar()
  assinarStore(() => renderizar())
}

function renderizar() {
  const db = obterDb()
  const requisicao = obterEstadoRequisicao()
  const estado = { categoria: 'todas' }

  const atelie = db.configuracoes.atelie
  const contatos = contatoAtelie(db)
  const horarioResumido = resumirHorario(db.configuracoes.horario)
  const telefoneExibido = atelie.telefone ? formatarTelefone(atelie.telefone) : ''
  const nomeAtelie = atelie.nome?.trim() || 'Linha Fina'

  const pecasAtivas = (db.pecas ?? [])
    .filter((p) => p.ativo)
    .sort((a, b) => Number(b.destaque) - Number(a.destaque) || compararTexto(a.nome, b.nome))
  const categorias = [...new Set(pecasAtivas.map((p) => textoSeguro(p.categoria)))].filter(Boolean).sort((a, b) => compararTexto(a, b))

  const areaGaleria = h('div', {})
  const areaChips = h('div', { class: 'vitrine-chips', role: 'group', 'aria-label': 'Filtrar por categoria' })

  function renderizarGaleria() {
    const filtradas =
      estado.categoria === 'todas' ? pecasAtivas : pecasAtivas.filter((p) => p.categoria === estado.categoria)

    areaChips.replaceChildren(
      botaoChip('todas', 'Todas'),
      ...categorias.map((c) => botaoChip(c, c))
    )

    if (filtradas.length === 0) {
      areaGaleria.replaceChildren(
        h('section', { class: 'card-surface' },
          estadoVazio({
            icone: 'Shirt',
            titulo: 'Nenhuma peça em exposição no momento',
            descricao: 'Ainda não há peças cadastradas para exibição. Novas peças aparecerão aqui após a integração com o back-end.',
          })
        )
      )
      return
    }

    areaGaleria.replaceChildren(
      h('ul', { class: 'vitrine-galeria' },
        filtradas.map((peca) =>
          h('li', {},
            h('article', { class: 'card-surface peca-card' },
              artePeca(peca.arte),
              h('div', { class: 'peca-card-corpo' },
                h('div', { class: 'peca-card-topo' },
                  h('h3', { class: 'peca-nome' }, peca.nome),
                  peca.destaque && badge({ variante: 'primary', rotulo: 'Destaque', classe: 'encolher-0' })
                ),
                badge({ variante: 'neutral', rotulo: peca.categoria, comPonto: false }),
                peca.descricao && h('p', { class: 'peca-descricao' }, peca.descricao),
                h('p', { class: 'peca-preco tnum' }, `a partir de ${formatarMoeda(peca.preco)}`)
              )
            )
          )
        )
      ),
      h('p', { class: 'vitrine-nota' }, 'As imagens são ilustrações da peça e não representam trabalhos reais do ateliê.')
    )
  }

  function botaoChip(valor, rotulo) {
    const ativa = estado.categoria === valor
    return h('button', {
      type: 'button',
      class: `vitrine-chip${ativa ? ' vitrine-chip--ativa' : ''}`,
      'aria-pressed': String(ativa),
      onClick: () => {
        estado.categoria = valor
        renderizarGaleria()
      },
    }, rotulo)
  }

  renderizarGaleria()

  destino.replaceChildren(
    h(
      'div',
      { class: 'vitrine-publica' },
      /* Header */
      h(
        'header',
        { class: 'vitrine-header' },
        h(
          'div',
          { class: 'vitrine-header-inner' },
          h('a', { href: caminho('vitrine-publica'), class: 'arredondar', 'aria-label': 'Linha Fina — vitrine pública' }, marcaLinhaFina()),
          h(
            'nav',
            { class: 'vitrine-header-nav', 'aria-label': 'Acesso rápido' },
            h('a', { href: caminho('vitrine'), class: 'vitrine-header-link' }, 'Gestão'),
            h('a', { href: caminho('login'), class: 'vitrine-header-link' }, 'Entrar')
          )
        )
      ),
      /* Conteúdo */
      h(
        'main',
        { class: 'vitrine-main' },
        h(
          'div',
          { class: 'vitrine-conteudo' },
          /* Hero */
          h(
            'section',
            { class: 'vitrine-hero' },
            h(
              'div',
              { class: 'vitrine-hero-textos' },
              h('h1', { class: 'vitrine-titulo' }, nomeAtelie),
              h('p', { class: 'vitrine-subtitulo' },
                'Costura autoral sob medida: cada peça é cortada, provada e finalizada para o seu corpo, do molde ao acabamento.'
              )
            ),
            h('div', { class: 'stitch', 'aria-hidden': 'true' }),
            h(
              'ul',
              { class: 'vitrine-destaques' },
              DESTAQUES_HERO.map(({ icone: nome, rotulo }) =>
                h(
                  'li',
                  { class: 'vitrine-destaque' },
                  h('span', { class: 'vitrine-destaque-icone', innerHTML: icone(nome, 'ic ic--16') }),
                  h('span', { class: 'vitrine-destaque-rotulo' }, rotulo)
                )
              )
            )
          ),
          /* Galeria */
          h(
            'section',
            { class: 'vitrine-secao', 'aria-labelledby': 'rotulo-galeria' },
            h('h2', { class: 'vitrine-secao-rotulo', id: 'rotulo-galeria' }, 'Peças em exposição'),
            requisicao.status === ESTADO_REQUISICAO.SEM_INTEGRACAO
              ? h('div', { class: 'aviso-integracao', role: 'note' },
                  h('span', { class: 'ic-caixa aviso-integracao-icone', innerHTML: icone('Info', 'ic ic--16') }),
                  h('p', { class: 'aviso-integracao-texto' }, 'A vitrine pública está pronta, mas a API do back-end ainda não foi configurada. Nenhuma peça fictícia é exibida.')
                )
              : null,
            requisicao.status === ESTADO_REQUISICAO.ERRO
              ? h('div', { class: 'estado-erro-dados-container' },
                  estadoVazio({
                    icone: 'TriangleAlert',
                    titulo: 'Não foi possível carregar as peças.',
                    descricao: requisicao.erro || 'Verifique a conexão com a API e tente novamente.',
                    acao: h('button', {
                      type: 'button',
                      class: 'btn btn--secundario btn--md',
                      onClick: () => recarregarDados(),
                      children: [h('span', { class: 'ic-caixa', innerHTML: icone('RefreshCw', 'ic ic--16') }), 'Tentar novamente'],
                    }),
                    classe: 'estado-erro-dados',
                  })
                )
              : null,
            requisicao.status !== ESTADO_REQUISICAO.ERRO ? areaChips : null,
            requisicao.status !== ESTADO_REQUISICAO.ERRO ? areaGaleria : null
          ),
          /* Contato */
          h(
            'section',
            { class: 'vitrine-secao', 'aria-labelledby': 'rotulo-contato' },
            h('h2', { class: 'vitrine-secao-rotulo', id: 'rotulo-contato' }, 'Visite o ateliê'),
            h(
              'section',
              { class: 'card-surface vitrine-contato' },
              h(
                'div',
                { class: 'vitrine-contato-coluna' },
                h('h3', { class: 'vitrine-contato-titulo' }, 'Fale com o ateliê'),
                h(
                  'ul',
                  { class: 'vitrine-contatos-lista' },
                  contatos.map((contato) =>
                    h(
                      'li',
                      { class: 'vitrine-contato-item' },
                      h('span', { class: 'vitrine-contato-icone', innerHTML: icone(ICONES_CONTATO[contato.rotulo] ?? 'MapPin', 'ic ic--16') }),
                      h(
                        'div',
                        { class: 'vitrine-contato-textos' },
                        h('p', { class: 'vitrine-contato-rotulo' }, contato.rotulo),
                        h('p', { class: 'vitrine-contato-valor' }, contato.valor || '—')
                      )
                    )
                  )
                ),
                botao({
                  variante: 'secundario',
                  tamanho: 'sm',
                  icone: 'Copy',
                  children: ['Copiar telefone'],
                  disabled: !telefoneExibido ? '' : null,
                  onClick: async () => {
                    if (!telefoneExibido) {
                      toast.aviso('O telefone ainda não foi informado pela API.')
                      return
                    }
                    try {
                      await navigator.clipboard.writeText(telefoneExibido)
                      toast.sucesso('Telefone copiado.')
                    } catch {
                      toast.aviso('Não foi possível copiar aqui — anote o número.')
                    }
                  },
                })
              ),
              h(
                'div',
                { class: 'vitrine-contato-coluna vitrine-contato-coluna--horario' },
                h('h3', { class: 'vitrine-contato-titulo' }, 'Horário de atendimento'),
                horarioResumido
                  ? h('p', { class: 'vitrine-horario tnum' }, horarioResumido)
                  : h('p', { class: 'vitrine-horario' }, 'Horário ainda não informado pela API.')
              )
            )
          )
        )
      ),
      /* Footer */
      h(
        'footer',
        { class: 'vitrine-footer' },
        h(
          'div',
          { class: 'vitrine-footer-inner' },
          marcaLinhaFina(),
          h('p', { class: 'vitrine-footer-nota' },
            'Vitrine pública do Linha Fina. Nenhuma venda é processada neste front-end.'
          )
        )
      )
    )
  )
}
