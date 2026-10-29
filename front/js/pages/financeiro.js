/**
 * Financeiro (pages/financeiro.html) — acompanhamento do ateliê.
 *
 * Os indicadores são derivados dos registros reais carregados pela API.
 * A tabela preserva busca e filtros; o registro de pagamento aguarda a API.
 */

import { iniciarApp, recarregarDados } from '../app/boot.js'
import { obterDb, acoes, assinarStore, obterEstadoRequisicao, ESTADO_REQUISICAO } from '../app/store.js'
import { blocoEstadoRequisicao, avisoSemIntegracao } from '../components/estados.js'
import { caminho } from '../app/rotas.js'
import { toast } from '../components/toast.js'
import { h, debounce } from '../components/dom.js'
import { icone } from '../components/icons.js'
import { pageHeader, statCard, badge, botao, campoBusca, criarSelect, campo, campoMoeda } from '../components/ui.js'
import { criarDataTable } from '../components/datatable.js'
import { abrirModal } from '../components/modal.js'
import { graficoEvolucao } from '../components/charts.js'
import { listaPagamentos, resumoFinanceiro, serieMensal } from '../services/estatisticas.js'
import { adicionarDias, contemTexto, formatarData, formatarMoeda, hojeISO } from '../utils/format.js'
import { HEX, STATUS_PAGAMENTO } from '../utils/status.js'

const SITUACOES = Object.keys(STATUS_PAGAMENTO) // 'pago' | 'parcial' | 'pendente'

const PERIODOS = [
  { id: 'qualquer', rotulo: 'Qualquer' },
  { id: 'atraso', rotulo: 'Em atraso' },
  { id: '7', rotulo: 'Próximos 7 dias' },
  { id: '30', rotulo: 'Próximos 30 dias' },
]


/** Vencimento da linha, com aviso de atraso (ícone danger + "Vencida"). */
function vencimento(p, comTexto = false) {
  if (!p.atrasada) return h('span', { class: 'tnum texto-suave' }, formatarData(p.vencimento))
  return h('span', { class: 'tnum celula-vencimento' },
    formatarData(p.vencimento),
    h('span', { title: 'Vencida', class: 'marca-vencida' },
      h('span', { class: 'ic-caixa', innerHTML: icone('TriangleAlert', 'ic ic--14') }),
      comTexto ? 'Vencida' : h('span', { class: 'sr-only' }, 'Vencida')
    )
  )
}

class PaginaFinanceiro {
  iniciar() {
    this.busca = ''
    this.buscaDebounced = ''
    this.filtroSituacao = 'todas'
    this.filtroPeriodo = 'qualquer'
    this.destino = document.getElementById('pagina')
    this.renderizar()
  }

  pagamentos() {
    const db = obterDb()
    const hoje = hojeISO()
    const limite = this.filtroPeriodo === '30' ? adicionarDias(hoje, 30) : adicionarDias(hoje, 7)
    const termo = this.buscaDebounced.trim().toLowerCase()
    return listaPagamentos(db).filter((p) => {
      if (termo && !contemTexto(p.cliente, termo) && !contemTexto(p.codigo, termo)) {
        return false
      }
      if (this.filtroSituacao !== 'todas' && p.situacao !== this.filtroSituacao) return false
      if (this.filtroPeriodo === 'atraso' && (!p.vencimento || p.vencimento >= hoje)) return false
      if (
        (this.filtroPeriodo === '7' || this.filtroPeriodo === '30') &&
        (!p.vencimento || p.vencimento < hoje || p.vencimento > limite)
      ) {
        return false
      }
      return true
    })
  }

  renderizar() {
    const db = obterDb()
    const requisicao = obterEstadoRequisicao()
    const semDados = requisicao.status === ESTADO_REQUISICAO.SEM_INTEGRACAO
    const blocoEstado = blocoEstadoRequisicao({
      status: requisicao.status,
      erro: requisicao.erro,
      onTentar: () => recarregarDados(),
    })
    const avisoIntegracao = semDados ? avisoSemIntegracao() : null
    const resumo = resumoFinanceiro(db)
    const serie = serieMensal(db)
    const pagamentos = this.pagamentos()

    const buscaEl = campoBusca({
      valor: this.busca,
      onValor: (valor) => {
        this.busca = valor
        atualizarDebounced()
      },
      placeholder: 'Buscar por cliente ou código…',
      rotulo: 'Buscar pagamento',
      classe: 'busca-financeiro',
    })
    const atualizarDebounced = debounce(() => {
      this.buscaDebounced = this.busca
      this.renderizar()
    }, 300)

    const selectSituacao = criarSelect({
      'aria-label': 'Filtrar por situação',
      classe: 'filtro-financeiro',
      valor: this.filtroSituacao,
      opcoes: [{ value: 'todas', rotulo: 'Todas' }, ...SITUACOES.map((id) => ({ value: id, rotulo: STATUS_PAGAMENTO[id].rotulo }))],
      onChange: (evento) => {
        this.filtroSituacao = evento.target.value
        this.renderizar()
      },
    })

    const selectPeriodo = criarSelect({
      'aria-label': 'Filtrar por período de vencimento',
      classe: 'filtro-financeiro',
      valor: this.filtroPeriodo,
      opcoes: PERIODOS.map((periodo) => ({ value: periodo.id, rotulo: periodo.rotulo })),
      onChange: (evento) => {
        this.filtroPeriodo = evento.target.value
        this.renderizar()
      },
    })

    const colunas = [
      {
        chave: 'os',
        cabecalho: 'OS',
        ordenar: (p) => p.codigo,
        render: (p) => h('a', { href: caminho('ordens-servico', { os: p.os.id }), class: 'link-os-financeiro tnum' }, p.codigo),
      },
      { chave: 'cliente', cabecalho: 'Cliente', ordenar: (p) => p.cliente, render: (p) => p.cliente },
      {
        chave: 'servico',
        cabecalho: 'Serviço',
        ordenar: (p) => p.servico,
        render: (p) => h('span', { class: 'texto-suave' }, p.servico),
      },
      {
        chave: 'valorFinal',
        cabecalho: 'Valor final',
        alinhamento: 'direita',
        ordenar: (p) => p.valorFinal,
        render: (p) => h('span', { class: 'tnum' }, formatarMoeda(p.valorFinal)),
      },
      {
        chave: 'valorPago',
        cabecalho: 'Pago',
        alinhamento: 'direita',
        ordenar: (p) => p.valorPago,
        render: (p) => h('span', { class: 'tnum' }, formatarMoeda(p.valorPago)),
      },
      {
        chave: 'saldo',
        cabecalho: 'Saldo',
        alinhamento: 'direita',
        ordenar: (p) => p.saldo,
        render: (p) => h('span', { class: p.saldo > 0 ? 'tnum texto-medio text-atencao' : 'tnum' }, formatarMoeda(p.saldo)),
      },
      {
        chave: 'vencimento',
        cabecalho: 'Vencimento',
        ordenar: (p) => p.vencimento,
        render: (p) => vencimento(p),
      },
      {
        chave: 'situacao',
        cabecalho: 'Situação',
        ordenar: (p) => p.situacao,
        render: (p) => badge({ status: STATUS_PAGAMENTO[p.situacao] }),
      },
      {
        chave: 'acoes',
        cabecalho: 'Ação',
        alinhamento: 'direita',
        largura: 'col-estreita',
        render: (p) =>
          botao({
            variante: 'fantasma', tamanho: 'sm',
            'aria-label': 'Marcar pagamento',
            onClick: () => this.abrirModalPagamento(p),
            children: [h('span', { class: 'ic-caixa', innerHTML: icone('Wallet', 'ic ic--16') })],
          }),
      },
    ]

    const tabela = criarDataTable({
      colunas,
      linhas: pagamentos,
      chaveLinha: (p) => p.os.id,
      compacto: true,
      porPagina: 8,
      rotuloSingular: 'pagamento',
      rotuloPlural: 'pagamentos',
      vazio: {
        icone: 'Wallet',
        titulo: db.pagamentos.length === 0
          ? 'Nenhum pagamento registrado.'
          : 'Nenhum pagamento nos filtros.',
        descricao: db.pagamentos.length === 0
          ? 'Os recebimentos aparecerão aqui após a integração com o back-end.'
          : 'Nenhum pagamento corresponde à busca, à situação ou ao período selecionados. Ajuste os filtros para ver os demais.',
      },
      barraFerramentas: h('div', { class: 'pilha-4' },
        h('div', { class: 'cartao-titulo' },
          h('div', {},
            h('h2', { class: 'cartao-rotulo' }, 'Pagamentos'),
            h('p', { class: 'cartao-subtitulo' }, 'Recebimentos e pendências por ordem de serviço')
          )
        ),
        h('div', { class: 'barra-filtros-simples' }, buscaEl, selectSituacao, selectPeriodo)
      ),
      renderLinhaMobile: (p) => this.cartaoMobile(p),
    })

    this.destino.replaceChildren(
      h('div', { class: 'pilha-6 animar-entrada' },
        pageHeader({
          titulo: 'Financeiro',
          descricao: 'Recebimentos e pendências do ateliê após a integração com o back-end.',
        }),
        avisoIntegracao,
        blocoEstado,
        !blocoEstado && h('div', { class: 'grade grade-4-stats' },
          statCard({ icone: 'CircleCheckBig', rotulo: 'Total recebido', valor: semDados ? '—' : formatarMoeda(resumo.recebidoTotal), tom: 'success' }),
          statCard({ icone: 'Hourglass', rotulo: 'Total a receber', valor: semDados ? '—' : formatarMoeda(resumo.aReceber), tom: 'warning' }),
          statCard({ icone: 'Wallet', rotulo: 'Faturamento do mês', valor: semDados ? '—' : formatarMoeda(resumo.faturamentoMes), comparacao: semDados ? null : resumo.crescimento, tom: 'primary' }),
          statCard({ icone: 'TrendingUp', rotulo: 'Recebido no mês', valor: semDados ? '—' : formatarMoeda(resumo.recebidoMes), tom: 'teal' })
        ),

        !blocoEstado && h('section', { class: 'card-surface cartao-padrao' },
          h('div', { class: 'cartao-titulo' },
            h('div', {},
              h('h2', { class: 'cartao-rotulo' }, 'Evolução financeira'),
              h('p', { class: 'cartao-subtitulo' }, 'Últimos 6 meses')
            )
          ),
          graficoEvolucao({
            dados: serie,
            altura: 280,
            semDados: semDados || db.ordens.length === 0,
            ariaRotulo: 'Evolução financeira',
            series: [
              { chave: 'faturamento', nome: 'Faturamento', cor: HEX.primary },
              { chave: 'recebido', nome: 'Recebido', cor: HEX.teal },
            ],
          })
        ),

        !blocoEstado && tabela.raiz,

        h('p', { class: 'nota-dados' }, 'Sem integração: cobrança, recorrência e registro de pagamentos ficam pendentes do back-end.')
      )
    )
  }

  cartaoMobile(p) {
    return h('div', { class: 'pilha-3' },
      h('div', { class: 'linha-entre al-inicio' },
        h('div', {},
          h('a', { href: caminho('ordens-servico', { os: p.os.id }), class: 'tnum texto-medio link-os-financeiro' }, p.codigo),
          h('p', { class: 'texto-truncado texto-faint-pequeno' }, `${p.cliente} · ${p.servico}`)
        ),
        badge({ status: STATUS_PAGAMENTO[p.situacao], classe: 'encolher-0' })
      ),
      h('div', { class: 'linha-entre-envoltoria' },
        h('span', { class: 'texto-faint-pequeno' }, h('span', { class: 'tnum texto-medio' }, formatarMoeda(p.valorFinal))),
        h('span', { class: 'texto-faint-pequeno' }, `Pago ${formatarMoeda(p.valorPago)}`),
        h('span', { class: 'texto-faint-pequeno' },
          'Saldo ',
          h('span', { class: `tnum texto-medio ${p.saldo > 0 ? 'text-atencao' : ''}` }, formatarMoeda(p.saldo))
        )
      ),
      h('div', { class: 'linha-entre' },
        h('p', { class: 'texto-faint-pequeno' }, 'Vence ', vencimento(p, true)),
        botao({
          variante: 'fantasma', tamanho: 'sm',
          'aria-label': 'Marcar pagamento',
          onClick: () => this.abrirModalPagamento(p),
          children: [h('span', { class: 'ic-caixa', innerHTML: icone('Wallet', 'ic ic--16') })],
        })
      )
    )
  }

  abrirModalPagamento(p) {
    let situacao = p.situacao
    let valorPago = p.saldo
    let erroValor = ''

    const resumoItem = (rotulo, valor, classe = '') =>
      h('div', {},
        h('dt', { class: 'texto-faint-pequeno' }, rotulo),
        h('dd', { class: `tnum texto-medio ${classe}` }, valor)
      )

    const selectSituacao = criarSelect({
      valor: situacao,
      opcoes: SITUACOES.map((id) => ({ value: id, rotulo: STATUS_PAGAMENTO[id].rotulo })),
    })

    const areaParcial = h('div', { hidden: situacao !== 'parcial' ? '' : null })
    let campoParcial = null

    const montarParcial = () => {
      areaParcial.replaceChildren()
      if (situacao !== 'parcial') return
      const moedaParcial = campoMoeda({
        valor: valorPago,
        onValor: (novo) => {
          valorPago = novo
          if (erroValor) {
            erroValor = ''
            campoParcial?.definirErro('')
          }
        },
      })
      campoParcial = campo({
        label: 'Valor pago',
        dica: 'Deve ser menor que o valor final',
        controle: moedaParcial.raiz,
      })
      areaParcial.append(campoParcial.raiz)
    }

    selectSituacao.addEventListener('change', () => {
      situacao = selectSituacao.value
      erroValor = ''
      if (situacao === 'parcial') valorPago = p.saldo
      if (situacao === 'parcial') areaParcial.removeAttribute('hidden')
      else areaParcial.setAttribute('hidden', '')
      montarParcial()
    })
    montarParcial()

    const modal = abrirModal({
      titulo: 'Marcar pagamento',
      descricao: 'Atualize a situação do pagamento desta ordem.',
      icone: 'Wallet',
      conteudo: h('div', {},
        h('dl', { class: 'resumo-pagamento' },
          resumoItem('OS', p.codigo),
          h('div', {},
            h('dt', { class: 'texto-faint-pequeno' }, 'Cliente'),
            h('dd', { class: 'tnum texto-truncado texto-medio' }, p.cliente)
          ),
          resumoItem('Valor final', formatarMoeda(p.valorFinal)),
          resumoItem('Pago até agora', formatarMoeda(p.valorPago)),
          resumoItem('Saldo', formatarMoeda(p.saldo), p.saldo > 0 ? 'text-atencao' : '')
        ),
        h('div', { class: 'pilha-4 area-pagamento' },
          campo({ label: 'Situação', controle: selectSituacao }).raiz,
          areaParcial
        ),
        h('div', { class: 'confirmar-acoes borda-superior' },
          botao({ variante: 'secundario', children: ['Cancelar'], onClick: () => modal.fechar() }),
          botao({
            children: ['Registrar pagamento'],
            onClick: async () => {
              if (situacao === 'parcial') {
                if (valorPago <= 0) {
                  erroValor = 'Informe um valor maior que zero.'
                  campoParcial?.definirErro(erroValor)
                  return
                }
                if (valorPago >= p.valorFinal) {
                  erroValor = 'O valor pago deve ser menor que o valor final.'
                  campoParcial?.definirErro(erroValor)
                  return
                }
              }
              const resultado = await acoes.ordens.marcarPagamento(p.os.id, { status: situacao, valorPago })
              if (resultado.ok) {
                toast.sucesso('Pagamento registrado.')
                modal.fechar()
              } else {
                toast.aviso(resultado.erro)
              }
            },
          })
        )
      ),
    })
  }
}

// Inicialização no fim do arquivo: as classes/constantes do módulo
// precisam estar definidas antes do primeiro uso.
const app = iniciarApp('financeiro')
if (app) {
  const pagina = new PaginaFinanceiro()
  assinarStore(() => pagina.renderizar())
  pagina.iniciar()
}
