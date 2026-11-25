/** Listagem e CRUD de clientes do MVP. */
import { iniciarApp, recarregarDados } from '../app/boot.js'
import { obterDb, acoes, assinarStore, obterEstadoRequisicao, ESTADO_REQUISICAO } from '../app/store.js'
import { blocoEstadoRequisicao, avisoSemIntegracao } from '../components/estados.js'
import { toast } from '../components/toast.js'
import { h, debounce } from '../components/dom.js'
import { icone } from '../components/icons.js'
import { pageHeader, botao, avatar, campoBusca } from '../components/ui.js'
import { criarDataTable } from '../components/datatable.js'
import { abrirModalCliente } from '../components/form-cliente.js'
import { confirmar } from '../components/confirm.js'
import { formatarData, formatarTelefone, textoSeguro } from '../utils/format.js'

function botaoIcone({ rotulo, icone: nome, onClick, perigo = false }) {
  return h('button', {
    type: 'button', 'aria-label': rotulo, title: rotulo, onClick,
    class: `botao-linha${perigo ? ' botao-linha--perigo' : ''}`,
    innerHTML: icone(nome, 'ic ic--16'),
  })
}

class PaginaClientes {
  iniciar() {
    this.busca = ''
    this.termo = ''
    this.destino = document.getElementById('pagina')
    this.renderizar()
  }

  linhasFiltradas() {
    const termo = this.termo.trim().toLocaleLowerCase('pt-BR')
    if (!termo) return obterDb().clientes
    return obterDb().clientes.filter((cliente) =>
      `${textoSeguro(cliente.nome)} ${textoSeguro(cliente.email)} ${textoSeguro(cliente.telefone)}`
        .toLocaleLowerCase('pt-BR').includes(termo)
    )
  }

  abrirFormulario(cliente = null) {
    abrirModalCliente({ cliente })
  }

  confirmarExclusao(cliente) {
    confirmar({
      titulo: 'Excluir cliente?',
      descricao: `Excluir ${cliente.nome}? A API poderá recusar a operação se houver ordens de serviço vinculadas.`,
      rotuloConfirmar: 'Excluir cliente',
      onConfirmar: async () => {
        const resultado = await acoes.clientes.remover(cliente.id)
        if (!resultado.ok) { toast.aviso(resultado.erro); return false }
        toast.sucesso('Cliente excluído.')
        return true
      },
    })
  }

  renderizar() {
    if (!this.destino) return
    const db = obterDb()
    const linhas = this.linhasFiltradas()
    const busca = campoBusca({
      valor: this.busca, placeholder: 'Buscar por nome, e-mail ou telefone…', rotulo: 'Buscar cliente', classe: 'busca-clientes',
      onValor: (valor) => { this.busca = valor; atualizarBusca() },
    })
    const atualizarBusca = debounce(() => { this.termo = this.busca; this.renderizar() }, 250)
    const acoesLinha = (cliente) => h('div', { class: 'acoes-linha' },
      botaoIcone({ rotulo: `Editar ${cliente.nome}`, icone: 'Pencil', onClick: () => this.abrirFormulario(cliente) }),
      botaoIcone({ rotulo: `Excluir ${cliente.nome}`, icone: 'Trash2', perigo: true, onClick: () => this.confirmarExclusao(cliente) })
    )
    const tabela = criarDataTable({
      linhas,
      colunas: [
        { chave: 'nome', cabecalho: 'Nome', ordenar: (c) => c.nome, render: (c) => h('div', { class: 'link-cliente' }, avatar({ nome: c.nome, tamanho: 'sm' }), h('span', { class: 'texto-truncado' }, c.nome)) },
        { chave: 'telefone', cabecalho: 'Telefone', render: (c) => h('span', { class: 'tnum texto-suave' }, formatarTelefone(c.telefone)) },
        { chave: 'email', cabecalho: 'E-mail', render: (c) => h('span', { class: 'texto-suave' }, c.email || '—') },
        { chave: 'criadoEm', cabecalho: 'Cadastro', ordenar: (c) => c.criadoEm, render: (c) => h('span', { class: 'tnum texto-suave' }, formatarData(c.criadoEm?.slice?.(0, 10))) },
        { chave: 'acoes', cabecalho: 'Ações', alinhamento: 'direita', render: acoesLinha },
      ],
      vazio: db.clientes.length
        ? { icone: 'SearchX', titulo: 'Nenhum cliente encontrado', descricao: 'Revise o termo da busca.' }
        : { icone: 'Users', titulo: 'Nenhum cliente cadastrado', descricao: 'Cadastre o primeiro cliente para começar.', acao: botao({ icone: 'UserPlus', children: ['Nova cliente'], onClick: () => this.abrirFormulario() }) },
      barraFerramentas: h('div', { class: 'barra-filtros-simples' }, busca),
      rotuloSingular: 'cliente', rotuloPlural: 'clientes', porPagina: 8,
      renderLinhaMobile: (c) => h('div', { class: 'cartao-cliente-mobile' },
        avatar({ nome: c.nome, tamanho: 'md' }),
        h('div', { class: 'cartao-cliente-mobile-corpo' },
          h('div', { class: 'cartao-cliente-mobile-topo' }, h('strong', { class: 'texto-truncado' }, c.nome), acoesLinha(c)),
          h('p', { class: 'cartao-cliente-telefone' }, h('span', { class: 'ic-caixa', innerHTML: icone('Phone', 'ic ic--14') }), h('span', { class: 'tnum' }, formatarTelefone(c.telefone))),
          h('p', { class: 'texto-suave' }, c.email || '—')
        )
      ),
    })

    const requisicao = obterEstadoRequisicao()
    const blocoEstado = blocoEstadoRequisicao({ status: requisicao.status, erro: requisicao.erro, onTentar: () => recarregarDados() })
    this.destino.replaceChildren(h('div', { class: 'pilha-6 animar-entrada' },
      pageHeader({
        titulo: 'Clientes', descricao: 'Cadastre e mantenha os dados de contato.',
        acoes: [botao({ icone: 'UserPlus', children: ['Nova cliente'], onClick: () => this.abrirFormulario() })],
      }),
      requisicao.status === ESTADO_REQUISICAO.SEM_INTEGRACAO ? avisoSemIntegracao() : null,
      blocoEstado ?? tabela.raiz
    ))
  }
}

iniciarApp('clientes')
const pagina = new PaginaClientes()
assinarStore(() => pagina.renderizar())
pagina.iniciar()
