/**
 * Ordens de serviço (pages/ordens-servico.html).
 *
 * Listagem com busca, filtros de status/serviço/período, abas de atalho com
 * contadores e drawer de detalhes (deep-link via ?os=ID).
 */

import { iniciarApp, recarregarDados } from '../app/boot.js'
import { obterDb, acoes, assinarStore, obterEstadoRequisicao, ESTADO_REQUISICAO } from '../app/store.js'
import { blocoEstadoRequisicao, avisoSemIntegracao } from '../components/estados.js'
import { caminho, navegar } from '../app/rotas.js'
import { toast } from '../components/toast.js'
import { h, debounce } from '../components/dom.js'
import { icone } from '../components/icons.js'
import { pageHeader, badge, botao, botaoLink, avatar, abas, criarSelect, campo, criarTextarea, estadoVazio } from '../components/ui.js'
import { criarDataTable } from '../components/datatable.js'
import { abrirDrawer } from '../components/drawer.js'
import { abrirModal } from '../components/modal.js'
import { campoBusca } from '../components/ui.js'
import { cliente, estaAtrasada, funcionaria, servico } from '../services/estatisticas.js'
import { STATUS_OS, STATUS_OS_ABERTOS, STATUS_OS_LISTA, STATUS_PAGAMENTO, PROXIMO_STATUS, corCategoria } from '../utils/status.js'
import { adicionarDias, compararTexto, descreverPrazo, formatarData, formatarMoeda, hojeISO, textoSeguro } from '../utils/format.js'


const PERIODOS = [
  { id: 'qualquer', rotulo: 'Qualquer período' },
  { id: '7', rotulo: 'Últimos 7 dias' },
  { id: '30', rotulo: 'Últimos 30 dias' },
  { id: 'mes', rotulo: 'Este mês' },
]

class PaginaOrdens {
  constructor() {
    this.busca = ''
    this.buscaDebounced = ''
    this.filtroStatus = '' // '' | 'abertas' | 'atrasadas' | id de status
    this.filtroServico = ''
    this.periodo = 'qualquer'
    this.ordemAbertaId = null
    this.tabela = null
    this.destino = document.getElementById('pagina')
  }

  iniciar() {
    // Deep-link ?status=atrasadas (alerta do dashboard): aplica o filtro e limpa o param.
    const parametros = new URLSearchParams(location.search)
    if (parametros.get('status') === 'atrasadas') {
      this.filtroStatus = 'atrasadas'
      parametros.delete('status')
      history.replaceState(null, '', `${location.pathname}${parametros.toString() ? `?${parametros}` : ''}`)
    }

    // Deep-link ?os=ID: o param é preservado até que os dados cheguem; o
    // drawer só pode ser aberto depois que a OS existir no estado real.
    this.osSolicitada = new URLSearchParams(location.search).get('os') || null
    this.renderizar()
  }

  /**
   * Confere o deep-link ?os=ID contra os dados já carregados.
   * Só descarta o param quando a carga terminou e a OS não existe.
   */
  verificarParamOs() {
    if (!this.osSolicitada) return
    const db = obterDb()
    const requisicao = obterEstadoRequisicao()
    const jaCarregou =
      requisicao.status !== ESTADO_REQUISICAO.CARREGANDO && requisicao.status !== ESTADO_REQUISICAO.SEM_INTEGRACAO

    if (db.ordens.some((o) => o.id === this.osSolicitada)) {
      this.ordemAbertaId = this.osSolicitada
      this.osSolicitada = null
      return
    }
    if (!jaCarregou) return // ainda pode chegar da API

    // A OS não existe (ou a API respondeu sem ela): limpa o param.
    const parametros = new URLSearchParams(location.search)
    parametros.delete('os')
    history.replaceState(null, '', `${location.pathname}${parametros.toString() ? `?${parametros}` : ''}`)
    this.osSolicitada = null
  }

  definirParamOs(id) {
    const parametros = new URLSearchParams(location.search)
    if (id) parametros.set('os', id)
    else parametros.delete('os')
    history.replaceState(null, '', `${location.pathname}${parametros.toString() ? `?${parametros}` : ''}`)
  }

  linhasFiltradas() {
    const db = obterDb()
    const termo = this.buscaDebounced.trim().toLowerCase()
    const hoje = hojeISO()
    const limite7 = adicionarDias(hoje, -7)
    const limite30 = adicionarDias(hoje, -30)

    const base = db.ordens.filter((o) => {
      if (termo) {
        const nomeCliente = cliente(db, o.clienteId)?.nome ?? ''
        const alvo = `${textoSeguro(o.codigo)} ${nomeCliente} ${textoSeguro(o.tipoPeca)} ${textoSeguro(o.descricaoPeca)}`.toLowerCase()
        if (!alvo.includes(termo)) return false
      }
      if (this.filtroServico && o.servicoId !== this.filtroServico) return false
      if (this.periodo === '7' && o.dataEntrada < limite7) return false
      if (this.periodo === '30' && o.dataEntrada < limite30) return false
      if (this.periodo === 'mes' && textoSeguro(o.dataEntrada).slice(0, 7) !== hoje.slice(0, 7)) return false
      return true
    })

    const ordenadas = [...base].sort((a, b) => {
      if (a.dataEntrada !== b.dataEntrada) return a.dataEntrada < b.dataEntrada ? 1 : -1
      return compararTexto(b.codigo, a.codigo)
    })

    if (this.filtroStatus === 'abertas') return ordenadas.filter((o) => STATUS_OS_ABERTOS.includes(o.status))
    if (this.filtroStatus === 'atrasadas') return ordenadas.filter((o) => estaAtrasada(o))
    if (this.filtroStatus) return ordenadas.filter((o) => o.status === this.filtroStatus)
    return ordenadas
  }

  contadores() {
    const db = obterDb()
    const hoje = hojeISO()
    const limite7 = adicionarDias(hoje, -7)
    const limite30 = adicionarDias(hoje, -30)
    const base = db.ordens.filter((o) => {
      if (this.filtroServico && o.servicoId !== this.filtroServico) return false
      if (this.periodo === '7' && o.dataEntrada < limite7) return false
      if (this.periodo === '30' && o.dataEntrada < limite30) return false
      if (this.periodo === 'mes' && o.dataEntrada.slice(0, 7) !== hoje.slice(0, 7)) return false
      return true
    })
    const porStatus = {}
    for (const s of STATUS_OS_LISTA) porStatus[s.id] = 0
    let abertas = 0
    for (const o of base) {
      if (porStatus[o.status] != null) porStatus[o.status] += 1
      if (STATUS_OS_ABERTOS.includes(o.status)) abertas += 1
    }
    return { total: base.length, abertas, porStatus }
  }

  renderizar() {
    const db = obterDb()
    // Resolve o deep-link ?os=ID antes de montar a tela (a OS pode ter chegado
    // da API depois da primeira renderização).
    this.verificarParamOs()
    const linhas = this.linhasFiltradas()
    const semRegistros = db.ordens.length === 0
    const contadores = this.contadores()

    const listaAbas = [
      { id: 'todas', rotulo: 'Todas', contador: contadores.total },
      { id: 'abertas', rotulo: 'Abertas', contador: contadores.abertas },
      ...STATUS_OS_LISTA.map((s) => ({ id: s.id, rotulo: s.rotulo, contador: contadores.porStatus[s.id] ?? 0 })),
    ]

    const campoBuscaEl = campoBusca({
      valor: this.busca,
      onValor: (valor) => {
        this.busca = valor
        atualizarComDebounce()
      },
      placeholder: 'Buscar por cliente, código ou peça⬦',
      rotulo: 'Buscar ordem de serviço',
      classe: 'busca-os',
    })

    const selectStatus = criarSelect({
      classe: 'filtro-select',
      valor: this.filtroStatus === 'abertas' || this.filtroStatus === 'atrasadas' ? '' : this.filtroStatus,
      'aria-label': 'Filtrar por status',
      opcoes: [{ value: '', rotulo: 'Todos os status' }, ...STATUS_OS_LISTA.map((s) => ({ value: s.id, rotulo: s.rotulo }))],
      onChange: (evento) => {
        this.filtroStatus = evento.target.value
        this.renderizar()
      },
    })

    const selectServico = criarSelect({
      classe: 'filtro-select',
      valor: this.filtroServico,
      'aria-label': 'Filtrar por serviço',
      opcoes: [{ value: '', rotulo: 'Todos os serviços' }, ...db.servicos.map((s) => ({ value: s.id, rotulo: s.nome }))],
      onChange: (evento) => {
        this.filtroServico = evento.target.value
        this.renderizar()
      },
    })

    const selectPeriodo = criarSelect({
      classe: 'filtro-select',
      valor: this.periodo,
      'aria-label': 'Filtrar por período de entrada',
      opcoes: PERIODOS.map((p) => ({ value: p.id, rotulo: p.rotulo })),
      onChange: (evento) => {
        this.periodo = evento.target.value
        this.renderizar()
      },
    })

    const atualizarComDebounce = debounce(() => {
      this.buscaDebounced = this.busca
      this.renderizar()
    }, 300)

    this.tabela = criarDataTable({
      colunas: this.colunas(),
      linhas,
      vazio: {
        icone: 'ClipboardList',
        titulo: semRegistros
          ? 'Nenhuma ordem de serviço cadastrada.'
          : 'Nenhuma ordem neste filtro.',
        descricao: semRegistros
          ? 'Use a ação “Nova OS” para registrar a primeira ordem quando a integração estiver disponível.'
          : 'Nenhuma ordem corresponde à aba e aos filtros selecionados. Ajuste a busca ou escolha outra aba.',
      },
      barraFerramentas: h('div', { class: 'barra-filtros-os' }, campoBuscaEl, selectStatus, selectServico, selectPeriodo),
      renderLinhaMobile: (o) => this.cartaoMobile(o),
      rotuloSingular: 'ordem',
      rotuloPlural: 'ordens',
      porPagina: 8,
    })

    // Clique em qualquer ponto da linha abre o drawer.
    this.tabela.raiz.addEventListener('click', (evento) => {
      const tr = evento.target.closest('tbody tr')
      if (!tr) return
      const id = tr.querySelector('[data-os-id]')?.getAttribute('data-os-id')
      const ordem = id ? obterDb().ordens.find((o) => o.id === id) : null
      if (ordem && !evento.target.closest('a, button')) this.abrirOrdem(ordem)
    })

    const requisicao = obterEstadoRequisicao()
    const blocoEstado = blocoEstadoRequisicao({
      status: requisicao.status,
      erro: requisicao.erro,
      onTentar: () => recarregarDados(),
    })
    const avisoIntegracao = requisicao.status === ESTADO_REQUISICAO.SEM_INTEGRACAO ? avisoSemIntegracao() : null

    this.destino.replaceChildren(
      h('div', { class: 'pilha-6 animar-entrada' },
        pageHeader({
          titulo: 'Ordens de serviço',
          descricao: 'Acompanhe as ordens do ateliê, da entrada da peça à entrega.',
          acoes: [
            botaoLink({
              para: caminho('ordem-servico-form'),
              children: [h('span', { class: 'ic-caixa', innerHTML: icone('Plus', 'ic ic--16') }), 'Nova OS'],
            }),
          ],
        }),
        avisoIntegracao,
        blocoEstado,
        !blocoEstado && abas({
          lista: listaAbas,
          ativa: this.filtroStatus === '' ? 'todas' : this.filtroStatus,
          onMudar: (id) => {
            this.filtroStatus = id === 'todas' ? '' : id
            this.renderizar()
          },
        }),
        !blocoEstado && this.tabela.raiz
      )
    )

    // Drawer via deep-link (?os=ID) — abre após a primeira renderização.
    if (this.ordemAbertaId) {
      const ordem = db.ordens.find((o) => o.id === this.ordemAbertaId)
      if (ordem && !this.drawerAberto) this.abrirOrdem(ordem, { silencioso: true })
    }
  }

  abrirOrdem(ordem, { silencioso = false } = {}) {
    this.ordemAbertaId = ordem.id
    this.definirParamOs(ordem.id)
    this.drawerAberto = true
    abrirDrawerOrdem({
      ordem,
      onFechar: () => {
        this.ordemAbertaId = null
        this.drawerAberto = false
        this.definirParamOs(null)
      },
      onMudanca: () => this.renderizar(),
    })
    if (!silencioso) this.tabela?.raiz?.querySelector?.('tbody')
  }

  /* --------------------------- Colunas --------------------------- */

  colunas() {
    return [
      {
        chave: 'codigo',
        cabecalho: 'Código',
        render: (o) =>
          h('div', { class: 'celula-codigo' },
            h('button', {
              type: 'button',
              'data-os-id': o.id,
              onClick: (evento) => {
                evento.stopPropagation()
                this.abrirOrdem(o)
              },
              class: 'link-codigo',
            }, h('span', { class: 'tnum' }, o.codigo)),
            o.urgente && h('span', { class: 'marca-urgencia', title: 'Urgente', innerHTML: icone('Zap', 'ic ic--14') }),
            estaAtrasada(o) && h('span', { class: 'marca-atraso', title: 'Previsão vencida', innerHTML: icone('TriangleAlert', 'ic ic--14') })
          ),
      },
      { chave: 'cliente', cabecalho: 'Cliente', render: (o) => cliente(obterDb(), o.clienteId)?.nome ?? '—' },
      { chave: 'servico', cabecalho: 'Serviço', render: (o) => servico(obterDb(), o.servicoId)?.nome ?? '—' },
      { chave: 'peca', cabecalho: 'Peça', render: (o) => o.tipoPeca || '—' },
      {
        chave: 'entrada',
        cabecalho: 'Entrada',
        ordenar: (o) => o.dataEntrada,
        render: (o) => h('span', { class: 'tnum' }, formatarData(o.dataEntrada)),
      },
      {
        chave: 'previsao',
        cabecalho: 'Previsão',
        ordenar: (o) => o.dataPrevistaEntrega,
        render: (o) => {
          const atrasada = estaAtrasada(o)
          return h('div', {},
            h('span', { class: `tnum ${atrasada ? 'text-perigo' : ''}` }, formatarData(o.dataPrevistaEntrega)),
            o.dataPrevistaEntrega &&
              h('span', { class: `previsao-relativa ${atrasada ? 'previsao-relativa--atrasada' : ''}` },
                descreverPrazo(o.dataPrevistaEntrega)
              )
          )
        },
      },
      {
        chave: 'valor',
        cabecalho: 'Valor',
        alinhamento: 'direita',
        ordenar: (o) => o.valorFinal,
        render: (o) => h('span', { class: 'tnum' }, formatarMoeda(o.valorFinal)),
      },
      {
        chave: 'status',
        cabecalho: 'Status',
        ordenar: (o) => STATUS_OS[o.status]?.ordemFluxo ?? 0,
        render: (o) => badge({ status: STATUS_OS[o.status] }),
      },
      {
        chave: 'responsavel',
        cabecalho: 'Responsável',
        render: (o) => {
          const responsavel = funcionaria(obterDb(), o.responsavelId)
          if (!responsavel) return h('span', { class: 'texto-faint' }, '—')
          return h('div', { class: 'celula-responsavel' }, avatar({ nome: responsavel.nome, tamanho: 'sm' }), h('span', { class: 'texto-truncado' }, responsavel.nome))
        },
      },
      { chave: 'acoes', cabecalho: 'Ações', alinhamento: 'direita', render: (o) => this.renderAcoes(o) },
    ]
  }

  renderAcoes(o) {
    const emFluxo = o.status !== 'cancelada' && o.status !== 'entregue'
    return h('div', { class: 'acoes-linha' },
      botao({
        variante: 'fantasma',
        tamanho: 'sm',
        classe: 'botao-acao',
        'aria-label': `Detalhes da OS ${o.codigo}`,
        title: 'Detalhes',
        onClick: (evento) => {
          evento.stopPropagation()
          this.abrirOrdem(o)
        },
        children: [h('span', { class: 'ic-caixa', innerHTML: icone('Eye', 'ic ic--16') })],
      }),
      emFluxo &&
        h('a', {
          href: caminho('ordem-servico-form', { id: o.id }),
          class: 'btn btn--fantasma btn--sm botao-acao',
          'aria-label': `Editar OS ${o.codigo}`,
          title: 'Editar',
          onClick: (evento) => evento.stopPropagation(),
          innerHTML: icone('Pencil', 'ic ic--16'),
        }),
      emFluxo &&
        botao({
          variante: 'fantasma',
          tamanho: 'sm',
          classe: 'botao-acao',
          'aria-label': `Cancelar OS ${o.codigo}`,
          title: 'Cancelar',
          onClick: (evento) => {
            evento.stopPropagation()
            this.confirmarCancelamento(o)
          },
          children: [h('span', { class: 'ic-caixa text-perigo', innerHTML: icone('CircleX', 'ic ic--16') })],
        })
    )
  }

  cartaoMobile(o) {
    const nomeCliente = cliente(obterDb(), o.clienteId)?.nome ?? '—'
    const atrasada = estaAtrasada(o)
    return h('div', { class: 'cartao-os-mobile' },
      h('div', { class: 'cartao-os-mobile-topo' },
        h('div', { class: 'celula-codigo' },
          h('button', {
            type: 'button',
            onClick: () => this.abrirOrdem(o),
            class: 'link-codigo',
          }, h('span', { class: 'tnum' }, o.codigo)),
          o.urgente && h('span', { class: 'marca-urgencia', title: 'Urgente', innerHTML: icone('Zap', 'ic ic--14') }),
          atrasada && h('span', { class: 'marca-atraso', title: 'Previsão vencida', innerHTML: icone('TriangleAlert', 'ic ic--14') })
        ),
        badge({ status: STATUS_OS[o.status] })
      ),
      h('div', {},
        h('p', { class: 'cartao-os-peca' }, o.tipoPeca || '—'),
        h('p', { class: 'cartao-os-cliente' }, nomeCliente)
      ),
      h('div', { class: 'cartao-os-mobile-rodape' },
        h('p', { class: `cartao-os-prazo ${atrasada ? 'text-perigo' : ''}` },
          o.dataPrevistaEntrega
            ? h('span', { class: 'tnum' }, `${formatarData(o.dataPrevistaEntrega)} · ${descreverPrazo(o.dataPrevistaEntrega)}`)
            : '—'
        ),
        h('p', { class: 'cartao-os-valor tnum' }, formatarMoeda(o.valorFinal))
      ),
      this.renderAcoes(o)
    )
  }

  confirmarCancelamento(ordem) {
    abrirModalCancelamentoOS(ordem, {
      onSucesso: () => this.renderizar(),
    })
  }
}

/* ------------------------------------------------------------------ */
/* Drawer de detalhes da OS                                            */
/* ------------------------------------------------------------------ */

function abrirDrawerOrdem({ ordem, onFechar, onMudanca }) {
  const db = obterDb()
  const os = db.ordens.find((o) => o.id === ordem.id) ?? ordem

  const nomeCliente = cliente(db, os.clienteId)?.nome ?? '—'
  const dadosServico = servico(db, os.servicoId)
  const responsavel = funcionaria(db, os.responsavelId)
  const atrasada = estaAtrasada(os)
  const proximoStatus = PROXIMO_STATUS[os.status]
  const podeEditar = os.status !== 'cancelada' && os.status !== 'entregue'
  const saldo = Math.max((os.valorFinal || 0) - (os.valorPago || 0), 0)

  let confirmando = false

  const secao = (titulo, ...filhos) =>
    h('section', { class: 'drawer-secao' },
      h('h3', { class: 'drawer-secao-rotulo' }, titulo),
      h('div', { class: 'drawer-secao-conteudo' }, filhos)
    )

  const dado = (rotulo, valor, tnum = false) =>
    h('div', { class: 'dado-linha' },
      h('span', { class: 'dado-rotulo' }, rotulo),
      h('span', { class: `dado-valor ${tnum ? 'tnum' : ''}` }, valor)
    )

  const texto = (rotulo, valor) =>
    h('div', { class: 'dado-texto' },
      h('p', { class: 'dado-texto-rotulo' }, rotulo),
      h('p', { class: 'dado-texto-valor' }, valor)
    )

  const rodape =
    proximoStatus || podeEditar
      ? h('div', { class: 'drawer-acoes' },
          proximoStatus &&
            botao({
              tamanho: 'sm',
              children: ['Avançar etapa'],
              onClick: async () => {
                const resultado = await acoes.ordens.avancarStatus(os.id)
                if (resultado.ok) {
                  const atualizada = resultado.data
                  toast.sucesso(`Etapa avançada: ${STATUS_OS[atualizada?.status]?.rotulo ?? 'concluída'}`)
                  drawer.fechar()
                  onMudanca?.()
                } else {
                  toast.aviso(resultado.erro)
                }
              },
            }),
          podeEditar &&
            h('div', { class: 'drawer-acoes-secundarias' },
              h('a', { href: caminho('ordem-servico-form', { id: os.id }), class: 'btn btn--secundario btn--sm' }, 'Editar'),
              botao({
                variante: 'perigo',
                tamanho: 'sm',
                children: ['Cancelar OS'],
                onClick: () => {
                  confirmando = true
                  abrirModalCancelamentoOS(os, {
                    onFecharModal: () => {
                      confirmando = false
                    },
                    onSucesso: () => {
                      confirmando = false
                      drawer.fechar()
                      onMudanca?.()
                    },
                  })
                },
              })
            )
        )
      : null

  const drawer = abrirDrawer({
    titulo: os.codigo,
    descricao: `${nomeCliente} · ${os.tipoPeca || '—'}`,
    largura: 'md',
    conteudo: h('div', { class: 'pilha-6' },
      h('div', { class: 'drawer-badges' },
        badge({ status: STATUS_OS[os.status] }),
        badge({ status: STATUS_PAGAMENTO[os.pagamentoStatus] }),
        os.urgente && badge({ variante: 'warning', rotulo: 'Urgente', icone: 'Zap' })
      ),
      secao('Peça',
        dado('Tipo', os.tipoPeca || '—'),
        texto('Descrição', os.descricaoPeca || '—'),
        texto('Observações', os.observacoes || '—'),
        (os.sobMedida || os.ajuste) && h('div', { class: 'drawer-badges' },
          os.sobMedida && badge({ variante: 'lilas', rotulo: 'Sob medida' }),
          os.ajuste && badge({ variante: 'teal', rotulo: 'Ajuste' })
        )
      ),
      secao('Valores',
        dado('Serviço', formatarMoeda(os.valorServico), true),
        dado('Taxa de urgência', formatarMoeda(os.taxaUrgencia), true),
        os.desconto > 0 && dado('Desconto', formatarMoeda(os.desconto), true),
        h('div', { class: 'dado-destaque' },
          h('span', { class: 'dado-destaque-rotulo' }, 'Valor final'),
          h('span', { class: 'dado-destaque-valor tnum' }, formatarMoeda(os.valorFinal))
        ),
        os.pagamentoStatus !== 'pendente' && h('div', {},
          dado('Pago', formatarMoeda(os.valorPago || 0), true),
          dado('Saldo', formatarMoeda(saldo), true)
        )
      ),
      secao('Datas',
        dado('Entrada', formatarData(os.dataEntrada), true),
        os.dataProva && dado('Prova', formatarData(os.dataProva), true),
        dado('Previsão de entrega',
          os.dataPrevistaEntrega
            ? atrasada
              ? h('span', { class: 'previsao-atrasada' },
                  h('span', { class: 'ic-caixa', innerHTML: icone('TriangleAlert', 'ic ic--14') }),
                  `${formatarData(os.dataPrevistaEntrega)} · ${descreverPrazo(os.dataPrevistaEntrega)}`
                )
              : `${formatarData(os.dataPrevistaEntrega)} · ${descreverPrazo(os.dataPrevistaEntrega)}`
            : '—'
        , true),
        os.dataEntrega && dado('Entrega', formatarData(os.dataEntrega), true)
      ),
      secao('Execução',
        h('div', { class: 'dado-linha' },
          h('span', { class: 'dado-rotulo' }, 'Responsável'),
          responsavel
            ? h('span', { class: 'dado-responsavel' },
                avatar({ nome: responsavel.nome, tamanho: 'sm' }),
                h('span', { class: 'dado-responsavel-textos' },
                  h('span', { class: 'dado-responsavel-nome' }, responsavel.nome),
                  h('span', { class: 'dado-responsavel-cargo' }, responsavel.cargo)
                )
              )
            : h('span', { class: 'texto-faint' }, '—')
        ),
        h('div', { class: 'dado-linha' },
          h('span', { class: 'dado-rotulo' }, 'Serviço'),
          dadosServico
            ? h('span', { class: 'dado-servico' },
                h('span', { class: 'dado-servico-marcador', style: { backgroundColor: corCategoria(dadosServico.categoria) } }),
                h('span', { class: 'texto-truncado' }, dadosServico.nome)
              )
            : h('span', { class: 'texto-faint' }, '—')
        )
      ),
      os.status === 'cancelada' && h('div', { class: 'bloco-cancelamento' },
        h('h3', { class: 'bloco-cancelamento-rotulo' }, 'Motivo do cancelamento'),
        h('p', { class: 'bloco-cancelamento-texto' }, os.motivoCancelamento || '—')
      )
    ),
    rodape,
    onFechar: () => {
      if (confirmando) return
      onFechar?.()
    },
  })

  return drawer
}

/* ------------------------------------------------------------------ */
/* Modal de cancelamento com motivo obrigatório                       */
/* ------------------------------------------------------------------ */

function abrirModalCancelamentoOS(os, { onSucesso, onFecharModal } = {}) {
  let erroMotivo = ''
  const textarea = criarTextarea({ rows: 3, placeholder: 'Ex.: cliente desistiu do ajuste' })
  const campoMotivo = campo({ label: 'Motivo do cancelamento', controle: textarea })
  textarea.addEventListener('input', () => {
    if (erroMotivo) {
      erroMotivo = ''
      campoMotivo.definirErro('')
    }
  })

  const modal = abrirModal({
    titulo: 'Cancelar OS?',
    descricao: 'Sem integração: o cancelamento oficial depende do back-end.',
    icone: 'TriangleAlert',
    tamanho: 'sm',
    conteudo: h('div', { class: 'confirmar-corpo' },
      h('p', { class: 'confirmar-descricao' },
        `A OS ${os.codigo} sairá do fluxo de produção e não poderá ser editada. Esta ação não pode ser desfeita.`
      ),
      campoMotivo.raiz,
      h('div', { class: 'confirmar-acoes' },
        botao({
          variante: 'secundario',
          children: ['Voltar'],
          onClick: () => modal.fechar(),
        }),
        botao({
          variante: 'perigo',
          children: ['Cancelar OS'],
          onClick: async () => {
            const motivo = textarea.value.trim()
            if (!motivo) {
              erroMotivo = 'Informe o motivo do cancelamento.'
              campoMotivo.definirErro(erroMotivo)
              return
            }
            const resultado = await acoes.ordens.cancelar(os.id, motivo)
            if (!resultado.ok) {
              toast.aviso(resultado.erro)
              return
            }
            toast.sucesso(`OS ${os.codigo} cancelada.`)
            modal.fechar()
            onSucesso?.()
          },
        })
      )
    ),
    onFechar: onFecharModal,
  })

  return modal
}

// Inicialização no fim do arquivo: as classes/constantes do módulo
// precisam estar definidas antes do primeiro uso.
const app = iniciarApp('ordens-servico')
if (app) {
  const pagina = new PaginaOrdens()
  assinarStore(() => pagina.renderizar())
  pagina.iniciar()
}
