/** Listagem, filtro local e exclusão real das ordens de serviço. */
import { iniciarApp, recarregarDados } from '../app/boot.js'
import { obterDb, acoes, assinarStore, obterEstadoRequisicao, ESTADO_REQUISICAO } from '../app/store.js'
import { blocoEstadoRequisicao, avisoSemIntegracao } from '../components/estados.js'
import { caminho } from '../app/rotas.js'
import { toast } from '../components/toast.js'
import { h, debounce } from '../components/dom.js'
import { icone } from '../components/icons.js'
import { pageHeader, badge, botao, botaoLink, criarSelect, campoBusca } from '../components/ui.js'
import { criarDataTable } from '../components/datatable.js'
import { confirmar } from '../components/confirm.js'
import { STATUS_OS, STATUS_OS_LISTA } from '../utils/status.js'
import { compararTexto, formatarData, formatarMoeda, textoSeguro } from '../utils/format.js'

function nomeCliente(db, id) {
  return db.clientes.find((cliente) => String(cliente.id) === String(id))?.nome ?? 'Cliente não encontrado'
}

function linkEdicao(ordem) {
  const rotulo = `Editar OS ${ordem.codigo}`
  return h('a', {
    href: caminho('ordem-servico-form', { id: ordem.id }), class: 'botao-linha',
    'aria-label': rotulo, title: rotulo, innerHTML: icone('Pencil', 'ic ic--16'),
  })
}

class PaginaOrdens {
  iniciar() {
    this.busca = ''
    this.termo = ''
    this.status = ''
    this.destino = document.getElementById('pagina')
    this.renderizar()
  }

  linhasFiltradas() {
    const db = obterDb()
    const termo = this.termo.trim().toLocaleLowerCase('pt-BR')
    return [...db.ordens]
      .filter((ordem) => !this.status || ordem.status === this.status)
      .filter((ordem) => {
        if (!termo) return true
        return `${textoSeguro(ordem.codigo)} ${nomeCliente(db, ordem.clienteId)} ${textoSeguro(ordem.descricaoServico)}`
          .toLocaleLowerCase('pt-BR').includes(termo)
      })
      .sort((a, b) => compararTexto(b.dataEntrada, a.dataEntrada) || compararTexto(a.codigo, b.codigo))
  }

  confirmarExclusao(ordem) {
    confirmar({
      titulo: 'Excluir ordem de serviço?',
      descricao: `Excluir definitivamente a OS ${ordem.codigo}? Esta ação não pode ser desfeita.`,
      rotuloConfirmar: 'Excluir OS',
      onConfirmar: async () => {
        const resultado = await acoes.ordens.remover(ordem.id)
        if (!resultado.ok) { toast.aviso(resultado.erro); return false }
        toast.sucesso(`OS ${ordem.codigo} excluída.`)
        return true
      },
    })
  }

  acoesLinha(ordem) {
    return h('div', { class: 'acoes-linha' },
      linkEdicao(ordem),
      botao({
        variante: 'fantasma', tamanho: 'sm', classe: 'botao-linha botao-linha--perigo',
        'aria-label': `Excluir OS ${ordem.codigo}`, title: `Excluir OS ${ordem.codigo}`,
        onClick: () => this.confirmarExclusao(ordem),
        children: [h('span', { class: 'ic-caixa', innerHTML: icone('Trash2', 'ic ic--16') })],
      })
    )
  }

  renderizar() {
    if (!this.destino) return
    const db = obterDb()
    const linhas = this.linhasFiltradas()
    const busca = campoBusca({
      valor: this.busca, placeholder: 'Buscar por código, cliente ou descrição…',
      rotulo: 'Buscar ordem de serviço', classe: 'busca-os',
      onValor: (valor) => { this.busca = valor; atualizarBusca() },
    })
    const atualizarBusca = debounce(() => { this.termo = this.busca; this.renderizar() }, 250)
    const filtroStatus = criarSelect({
      valor: this.status, 'aria-label': 'Filtrar por status', classe: 'filtro-select',
      opcoes: [{ value: '', rotulo: 'Todos os status' }, ...STATUS_OS_LISTA.map((s) => ({ value: s.id, rotulo: s.rotulo }))],
      onChange: (evento) => { this.status = evento.target.value; this.renderizar() },
    })
    const tabela = criarDataTable({
      linhas,
      colunas: [
        { chave: 'codigo', cabecalho: 'Código', ordenar: (o) => o.codigo, render: (o) => h('span', { class: 'tnum texto-medio' }, o.codigo) },
        { chave: 'cliente', cabecalho: 'Cliente', render: (o) => nomeCliente(db, o.clienteId) },
        { chave: 'descricao', cabecalho: 'Descrição do serviço', render: (o) => h('span', { class: 'texto-suave' }, o.descricaoServico || '—') },
        { chave: 'valor', cabecalho: 'Valor', alinhamento: 'direita', ordenar: (o) => Number(o.valor), render: (o) => h('span', { class: 'tnum' }, formatarMoeda(Number(o.valor))) },
        { chave: 'entrada', cabecalho: 'Entrada', ordenar: (o) => o.dataEntrada, render: (o) => h('span', { class: 'tnum' }, formatarData(o.dataEntrada)) },
        { chave: 'previsao', cabecalho: 'Previsão de entrega', ordenar: (o) => o.dataPrevistaEntrega, render: (o) => h('span', { class: 'tnum' }, formatarData(o.dataPrevistaEntrega)) },
        { chave: 'status', cabecalho: 'Status', ordenar: (o) => STATUS_OS[o.status]?.ordemFluxo ?? 0, render: (o) => badge({ status: STATUS_OS[o.status], rotulo: o.status || 'Não informado' }) },
        { chave: 'acoes', cabecalho: 'Ações', alinhamento: 'direita', render: (o) => this.acoesLinha(o) },
      ],
      vazio: db.ordens.length
        ? { icone: 'SearchX', titulo: 'Nenhuma ordem encontrada', descricao: 'Ajuste a busca ou o filtro de status.' }
        : { icone: 'ClipboardList', titulo: 'Nenhuma ordem de serviço cadastrada', descricao: 'Crie a primeira OS para registrar um serviço.', acao: botaoLink({ para: caminho('ordem-servico-form'), children: ['Nova OS'] }) },
      barraFerramentas: h('div', { class: 'barra-filtros-os' }, busca, filtroStatus),
      rotuloSingular: 'ordem', rotuloPlural: 'ordens', porPagina: 8,
      renderLinhaMobile: (o) => h('div', { class: 'cartao-os-mobile' },
        h('div', { class: 'cartao-os-mobile-topo' }, h('strong', { class: 'tnum' }, o.codigo), badge({ status: STATUS_OS[o.status], rotulo: o.status || 'Não informado' })),
        h('div', {}, h('p', { class: 'cartao-os-peca' }, o.descricaoServico || '—'), h('p', { class: 'cartao-os-cliente' }, nomeCliente(db, o.clienteId))),
        h('p', { class: 'cartao-os-prazo tnum' }, `Entrada: ${formatarData(o.dataEntrada)} · Previsão: ${formatarData(o.dataPrevistaEntrega)}`),
        h('div', { class: 'cartao-os-mobile-rodape' }, h('p', { class: 'cartao-os-valor tnum' }, formatarMoeda(Number(o.valor))), this.acoesLinha(o))
      ),
    })

    const requisicao = obterEstadoRequisicao()
    const blocoEstado = blocoEstadoRequisicao({ status: requisicao.status, erro: requisicao.erro, onTentar: () => recarregarDados() })
    this.destino.replaceChildren(h('div', { class: 'pilha-6 animar-entrada' },
      pageHeader({
        titulo: 'Ordens de Serviço', descricao: 'Registre e acompanhe os serviços do ateliê.',
        acoes: [botaoLink({ para: caminho('ordem-servico-form'), children: [h('span', { class: 'ic-caixa', innerHTML: icone('Plus', 'ic ic--16') }), 'Nova OS'] })],
      }),
      requisicao.status === ESTADO_REQUISICAO.SEM_INTEGRACAO ? avisoSemIntegracao() : null,
      blocoEstado ?? tabela.raiz
    ))
  }
}

iniciarApp('ordens-servico')
const pagina = new PaginaOrdens()
assinarStore(() => pagina.renderizar())
pagina.iniciar()
