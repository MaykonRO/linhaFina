/**
 * Clientes (pages/clientes.html) — lista de clientes do ateliê.
 *
 * Busca com debounce (nome, e-mail, telefone), filtro de situação financeira,
 * ordenação por nome, serviços e último atendimento, e ações de editar,
 * excluir e ver perfil.
 */

import { iniciarApp, recarregarDados } from '../app/boot.js'
import { obterDb, acoes, assinarStore, obterEstadoRequisicao, ESTADO_REQUISICAO } from '../app/store.js'
import { blocoEstadoRequisicao, avisoSemIntegracao } from '../components/estados.js'
import { caminho } from '../app/rotas.js'
import { toast } from '../components/toast.js'
import { h, debounce } from '../components/dom.js'
import { icone } from '../components/icons.js'
import { pageHeader, badge, botao, avatar, campoBusca, criarSelect } from '../components/ui.js'
import { criarDataTable } from '../components/datatable.js'
import { abrirModalCliente } from '../components/form-cliente.js'
import { confirmar } from '../components/confirm.js'
import { resumoCliente } from '../services/estatisticas.js'
import { formatarData, formatarTelefone } from '../utils/format.js'
import { SITUACAO_CLIENTE } from '../utils/status.js'


/** Ação de linha compacta: ícone com rótulo acessível (link quando navega). */
function botaoIcone({ rotulo, icone: nome, para = null, onClick, perigo = false }) {
  const classe = `botao-linha${perigo ? ' botao-linha--perigo' : ''}`
  if (para) {
    return h('a', { href: para, 'aria-label': rotulo, title: rotulo, class: classe, innerHTML: icone(nome, 'ic ic--16') })
  }
  return h('button', { type: 'button', 'aria-label': rotulo, title: rotulo, onClick, class: classe, innerHTML: icone(nome, 'ic ic--16') })
}

class PaginaClientes {
  iniciar() {
    this.busca = ''
    this.buscaDebounced = ''
    this.filtroSituacao = ''
    this.destino = document.getElementById('pagina')
    this.renderizar()
  }

  linhasFiltradas() {
    const db = obterDb()
    const linhasBase = db.clientes.map((cliente) => {
      const resumo = resumoCliente(db, cliente.id)
      return { ...cliente, resumo, situacao: resumo.situacao }
    })

    const termo = this.buscaDebounced.trim().toLowerCase()
    const digitosBusca = termo.replace(/\D/g, '')

    return linhasBase.filter((cliente) => {
      if (this.filtroSituacao && cliente.situacao !== this.filtroSituacao) return false
      if (!termo) return true
      if (`${cliente.nome} ${cliente.email}`.toLowerCase().includes(termo)) return true
      // Busca por telefone apenas quando o termo tem dígitos suficientes.
      return digitosBusca.length >= 3 && cliente.telefone.includes(digitosBusca)
    })
  }

  renderizar() {
    const db = obterDb()
    const linhas = this.linhasFiltradas()

    const buscaEl = campoBusca({
      valor: this.busca,
      onValor: (valor) => {
        this.busca = valor
        atualizarComDebounce()
      },
      placeholder: 'Buscar por nome, e-mail ou telefone⬦',
      rotulo: 'Buscar cliente',
      classe: 'busca-clientes',
    })
    const atualizarComDebounce = debounce(() => {
      this.buscaDebounced = this.busca
      this.renderizar()
    }, 300)

    const selectSituacao = criarSelect({
      'aria-label': 'Filtrar por situação financeira',
      valor: this.filtroSituacao,
      classe: 'filtro-clientes',
      opcoes: [
        { value: '', rotulo: 'Todas as situações' },
        { value: 'em_dia', rotulo: 'Em dia' },
        { value: 'pendente', rotulo: 'Pagamento pendente' },
        { value: 'inadimplente', rotulo: 'Inadimplente' },
      ],
      onChange: (evento) => {
        this.filtroSituacao = evento.target.value
        this.renderizar()
      },
    })

    const abrirNova = () => abrirModalCliente({ cliente: null, onFechar: () => this.renderizar() })
    const abrirEdicao = (cliente) => abrirModalCliente({ cliente, onFechar: () => this.renderizar() })
    const excluir = async (cliente) => {
      const resultado = await acoes.clientes.remover(cliente.id)
      if (resultado.ok) {
        toast.sucesso('Cliente removida com sucesso.')
        return true
      }
      toast.aviso(resultado.erro)
      return false
    }

    const colunas = [
      {
        chave: 'nome',
        cabecalho: 'Nome',
        ordenar: (c) => c.nome,
        render: (c) => h('a', { href: caminho('cliente-detalhe', { id: c.id }), class: 'link-cliente' },
          avatar({ nome: c.nome, tamanho: 'sm' }),
          h('span', { class: 'texto-truncado' }, c.nome)
        ),
      },
      {
        chave: 'telefone',
        cabecalho: 'Telefone',
        render: (c) => h('span', { class: 'tnum texto-suave' }, formatarTelefone(c.telefone)),
      },
      { chave: 'email', cabecalho: 'E-mail', render: (c) => h('span', { class: 'texto-suave' }, c.email) },
      {
        chave: 'servicos',
        cabecalho: 'Serviços',
        alinhamento: 'direita',
        ordenar: (c) => c.resumo.totalServicos,
        render: (c) => h('span', { class: 'tnum texto-medio' }, c.resumo.totalServicos),
      },
      {
        chave: 'ultimo',
        cabecalho: 'Último atendimento',
        ordenar: (c) => c.resumo.ultimoAtendimento,
        render: (c) => h('span', { class: 'tnum texto-suave' }, formatarData(c.resumo.ultimoAtendimento)),
      },
      {
        chave: 'situacao',
        cabecalho: 'Situação financeira',
        render: (c) => badge({ status: SITUACAO_CLIENTE[c.situacao] }),
      },
      {
        chave: 'acoes',
        cabecalho: '',
        alinhamento: 'direita',
        largura: 'col-estreita',
        render: (c) =>
          h('div', { class: 'acoes-linha' },
            botaoIcone({ rotulo: `Ver perfil de ${c.nome}`, icone: 'Eye', para: caminho('cliente-detalhe', { id: c.id }) }),
            botaoIcone({ rotulo: `Editar ${c.nome}`, icone: 'Pencil', onClick: () => abrirEdicao(c) }),
            botaoIcone({ rotulo: `Excluir ${c.nome}`, icone: 'Trash2', perigo: true, onClick: () => this.confirmarExclusao(c, excluir) })
          ),
      },
    ]

    const vazio = db.clientes.length
      ? {
          icone: 'SearchX',
          titulo: 'Nenhum cliente encontrado',
          descricao: 'Ajuste a busca ou o filtro de situação financeira.',
        }
      : {
          icone: 'Users',
          titulo: 'Nenhum cliente cadastrado.',
          descricao: 'Use a ação acima para cadastrar a primeira cliente quando a integração estiver disponível.',
          acao: botao({ icone: 'UserPlus', children: ['Nova cliente'], onClick: abrirNova }),
        }

    const tabela = criarDataTable({
      colunas,
      linhas,
      vazio,
      rotuloSingular: 'cliente',
      rotuloPlural: 'clientes',
      porPagina: 8,
      barraFerramentas: h('div', { class: 'barra-filtros-simples' }, buscaEl, selectSituacao),
      renderLinhaMobile: (c) =>
        h('div', { class: 'cartao-cliente-mobile' },
          avatar({ nome: c.nome, tamanho: 'md' }),
          h('div', { class: 'cartao-cliente-mobile-corpo' },
            h('div', { class: 'cartao-cliente-mobile-topo' },
              h('a', { href: caminho('cliente-detalhe', { id: c.id }), class: 'link-cliente texto-truncado' }, c.nome),
              h('div', { class: 'acoes-linha' },
                botaoIcone({ rotulo: `Editar ${c.nome}`, icone: 'Pencil', onClick: () => abrirEdicao(c) }),
                botaoIcone({ rotulo: `Excluir ${c.nome}`, icone: 'Trash2', perigo: true, onClick: () => this.confirmarExclusao(c, excluir) })
              )
            ),
            h('p', { class: 'cartao-cliente-telefone' },
              h('span', { class: 'ic-caixa', innerHTML: icone('Phone', 'ic ic--14') }),
              h('span', { class: 'tnum' }, formatarTelefone(c.telefone))
            ),
            h('div', { class: 'cartao-cliente-badges' },
              badge({ status: SITUACAO_CLIENTE[c.situacao] }),
              badge({
                variante: 'neutral',
                rotulo: `${c.resumo.totalServicos} ${c.resumo.totalServicos === 1 ? 'serviço' : 'serviços'}`,
              })
            )
          )
        ),
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
          titulo: 'Clientes',
          descricao: 'Cadastro, histórico e situação financeira das clientes do ateliê.',
          acoes: [botao({ icone: 'UserPlus', children: ['Nova cliente'], onClick: abrirNova })],
        }),
        avisoIntegracao,
        blocoEstado ?? tabela.raiz
      )
    )
  }

  confirmarExclusao(cliente, excluir) {
    confirmar({
      titulo: 'Excluir cliente?',
      descricao: `Você está excluindo ${cliente.nome}. Esta ação não pode ser desfeita — e clientes com ordens de serviço ou orçamentos no histórico não podem ser removidas.`,
      rotuloConfirmar: 'Excluir',
      onConfirmar: () => excluir(cliente),
      onFechar: () => this.renderizar(),
    })
  }
}

// Inicialização no fim do arquivo: as classes/constantes do módulo
// precisam estar definidas antes do primeiro uso.
const app = iniciarApp('clientes')
if (app) {
  const pagina = new PaginaClientes()
  assinarStore(() => pagina.renderizar())
  pagina.iniciar()
}
