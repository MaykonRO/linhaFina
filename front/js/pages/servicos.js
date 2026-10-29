/**
 * Serviços (pages/servicos.html) — catálogo do ateliê.
 * O tempo estimado é apenas uma referência cadastrada pela equipe; o prazo
 * oficial de cada OS será confirmado pela API.
 */

import { iniciarApp, recarregarDados } from '../app/boot.js'
import { obterDb, acoes, assinarStore, obterEstadoRequisicao, ESTADO_REQUISICAO } from '../app/store.js'
import { blocoEstadoRequisicao, avisoSemIntegracao } from '../components/estados.js'
import { toast } from '../components/toast.js'
import { h, debounce } from '../components/dom.js'
import { icone } from '../components/icons.js'
import { pageHeader, badge, botao, campoBusca, criarSelect, campo, criarInput, criarTextarea, interruptor, campoMoeda } from '../components/ui.js'
import { criarDataTable } from '../components/datatable.js'
import { abrirModal } from '../components/modal.js'
import { confirmar } from '../components/confirm.js'
import { formatarMoeda, textoSeguro, compararTexto, contemTexto } from '../utils/format.js'
import { corCategoria } from '../utils/status.js'
import { vazio, positivo, naoNegativo } from '../utils/validation.js'

const CATEGORIAS = [
  'Ajustes', 'Consertos', 'Confecção sob medida', 'Reformas', 'Festa e social', 'Outra',
]


class PaginaServicos {
  iniciar() {
    this.busca = ''
    this.buscaDebounced = ''
    this.categoria = 'todas'
    this.situacao = 'todos'
    this.destino = document.getElementById('pagina')
    this.renderizar()
  }

  linhasFiltradas() {
    const db = obterDb()
    const q = this.buscaDebounced.trim().toLowerCase()
    return db.servicos.filter((s) => {
      if (q && !contemTexto(s.nome, q) && !contemTexto(s.descricao, q)) return false
      if (this.categoria !== 'todas' && s.categoria !== this.categoria) return false
      if (this.situacao === 'ativos' && !s.ativo) return false
      if (this.situacao === 'inativos' && s.ativo) return false
      return true
    })
  }

  renderizar() {
    const db = obterDb()
    const linhas = this.linhasFiltradas()
    const categoriasExistentes = [...new Set(db.servicos.map((s) => textoSeguro(s.categoria)))].filter(Boolean).sort((a, b) =>
      compararTexto(a, b)
    )

    const buscaEl = campoBusca({
      valor: this.busca,
      onValor: (valor) => {
        this.busca = valor
        atualizarDebounced()
      },
      placeholder: 'Buscar por nome ou descrição⬦',
      rotulo: 'Buscar serviço',
      classe: 'busca-servicos',
    })
    const atualizarDebounced = debounce(() => {
      this.buscaDebounced = this.busca
      this.renderizar()
    }, 300)

    const selectCategoria = criarSelect({
      'aria-label': 'Filtrar por categoria',
      classe: 'filtro-servicos',
      valor: this.categoria,
      opcoes: [{ value: 'todas', rotulo: 'Todas as categorias' }, ...categoriasExistentes.map((c) => ({ value: c, rotulo: c }))],
      onChange: (evento) => {
        this.categoria = evento.target.value
        this.renderizar()
      },
    })

    const selectSituacao = criarSelect({
      'aria-label': 'Filtrar por situação',
      classe: 'filtro-servicos',
      valor: this.situacao,
      opcoes: [
        { value: 'todos', rotulo: 'Todos' },
        { value: 'ativos', rotulo: 'Ativos' },
        { value: 'inativos', rotulo: 'Inativos' },
      ],
      onChange: (evento) => {
        this.situacao = evento.target.value
        this.renderizar()
      },
    })

    const abrirNovo = () => this.abrirFormulario(null)
    const abrirEdicao = (servico) => this.abrirFormulario(servico)

    const colunas = [
      {
        chave: 'nome',
        cabecalho: 'Serviço',
        ordenar: (s) => s.nome,
        render: (s) => h('div', { class: 'celula-servico' },
          h('span', { class: 'dot-categoria', style: { backgroundColor: corCategoria(s.categoria) } }),
          h('span', { class: 'texto-medio' }, s.nome)
        ),
      },
      {
        chave: 'categoria',
        cabecalho: 'Categoria',
        ordenar: (s) => s.categoria,
        render: (s) => badge({ variante: 'neutral', rotulo: s.categoria, comPonto: false }),
      },
      {
        chave: 'descricao',
        cabecalho: 'Descrição',
        render: (s) => h('span', { class: 'texto-suave descricao-linha' }, s.descricao || '—'),
        ocultarMobile: true,
      },
      {
        chave: 'preco',
        cabecalho: 'Preço de referência',
        alinhamento: 'direita',
        ordenar: (s) => s.precoReferencia,
        render: (s) => h('span', { class: 'tnum' }, formatarMoeda(s.precoReferencia)),
      },
      {
        chave: 'tempo',
        cabecalho: 'Tempo estimado',
        alinhamento: 'direita',
        ordenar: (s) => s.tempoEstimadoDias,
        render: (s) => h('span', { class: 'tnum texto-suave' }, `${s.tempoEstimadoDias} ${s.tempoEstimadoDias === 1 ? 'dia' : 'dias'}`),
      },
      {
        chave: 'situacao',
        cabecalho: 'Situação',
        ordenar: (s) => (s.ativo ? 1 : 0),
        render: (s) => badge({ variante: s.ativo ? 'success' : 'neutral', rotulo: s.ativo ? 'Ativo' : 'Inativo' }),
      },
      {
        chave: 'acoes',
        cabecalho: '',
        alinhamento: 'direita',
        render: (s) => h('div', { class: 'acoes-linha' },
          botao({
            variante: 'fantasma', tamanho: 'sm',
            'aria-label': `Editar ${s.nome}`,
            onClick: () => abrirEdicao(s),
            children: [h('span', { class: 'ic-caixa', innerHTML: icone('Pencil', 'ic ic--16') })],
          }),
          botao({
            variante: 'fantasma', tamanho: 'sm',
            'aria-label': s.ativo ? `Desativar ${s.nome}` : `Ativar ${s.nome}`,
            onClick: async () => {
              const resultado = await acoes.servicos.alternarSituacao(s.id, !s.ativo)
              if (resultado.ok) toast.sucesso(s.ativo ? 'Serviço desativado.' : 'Serviço ativado.')
              else toast.aviso(resultado.erro)
            },
            children: [h('span', { class: `ic-caixa ${s.ativo ? 'texto-faint' : 'text-sucesso'}`, innerHTML: icone('Power', 'ic ic--16') })],
          }),
          botao({
            variante: 'fantasma', tamanho: 'sm',
            classe: 'botao-perigo',
            'aria-label': `Excluir ${s.nome}`,
            onClick: () => this.confirmarExclusao(s),
            children: [h('span', { class: 'ic-caixa text-perigo', innerHTML: icone('Trash2', 'ic ic--16') })],
          })
        ),
      },
    ]

    const tabela = criarDataTable({
      colunas,
      linhas,
      rotuloSingular: 'serviço',
      rotuloPlural: 'serviços',
      vazio: {
        icone: 'Scissors',
        titulo: db.servicos.length === 0
          ? 'Nenhum serviço cadastrado.'
          : 'Nenhum serviço nos filtros.',
        descricao: db.servicos.length === 0
          ? 'Use a ação “Novo serviço” para cadastrar o primeiro tipo de serviço quando a integração estiver disponível.'
          : 'Nenhum serviço corresponde à busca, à categoria ou à situação selecionadas. Ajuste os filtros para ver os demais.',
        acao: db.servicos.length === 0
          ? botao({ icone: 'Plus', children: ['Novo serviço'], onClick: abrirNovo })
          : null,
      },
      barraFerramentas: h('div', { class: 'barra-filtros-os' },
        buscaEl, selectCategoria, selectSituacao,
        h('p', { class: 'tnum contagem-filtro' }, `${linhas.length} de ${db.servicos.length}`)
      ),
      renderLinhaMobile: (s) => h('div', { class: 'pilha-3' },
        h('div', { class: 'linha-entre' },
          h('span', { class: 'celula-servico texto-medio' },
            h('span', { class: 'dot-categoria', style: { backgroundColor: corCategoria(s.categoria) } }),
            s.nome
          ),
          badge({ variante: s.ativo ? 'success' : 'neutral', rotulo: s.ativo ? 'Ativo' : 'Inativo' })
        ),
        h('p', { class: 'texto-suave descricao-linha' }, s.descricao || '—'),
        h('div', { class: 'linha-entre' },
          h('span', { class: 'tnum' }, formatarMoeda(s.precoReferencia)),
          h('span', { class: 'tnum texto-faint-pequeno' }, `${s.tempoEstimadoDias} dias`)
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
          titulo: 'Serviços',
          descricao: 'Catálogo do ateliê. O tempo estimado é uma referência; o prazo oficial de cada OS é confirmado pela API.',
          acoes: [botao({ icone: 'Plus', children: ['Novo serviço'], onClick: abrirNovo })],
        }),
        avisoIntegracao,
        blocoEstado ?? tabela.raiz
      )
    )
  }

  abrirFormulario(servico) {
    const edicao = Boolean(servico)
    const dados = {
      nome: servico?.nome ?? '',
      categoria: servico?.categoria ?? 'Ajustes',
      descricao: servico?.descricao ?? '',
      precoReferencia: servico?.precoReferencia ?? 0,
      tempoEstimadoDias: servico?.tempoEstimadoDias ?? 3,
      ativo: servico?.ativo ?? true,
    }
    const erros = {}

    const inputNome = criarInput({ placeholder: 'Ex.: Ajuste de blazer', value: dados.nome })
    const campoNome = campo({ label: 'Nome', obrigatorio: true, controle: inputNome })

    const selectCategoria = criarSelect({
      valor: dados.categoria,
      opcoes: CATEGORIAS.map((c) => ({ value: c, rotulo: c })),
    })
    const campoCategoria = campo({ label: 'Categoria', obrigatorio: true, controle: selectCategoria })

    const moedaPreco = campoMoeda({
      valor: dados.precoReferencia,
      onValor: (novo) => {
        dados.precoReferencia = novo
        if (erros.precoReferencia) {
          erros.precoReferencia = ''
          campoPreco.definirErro('')
        }
      },
    })
    const campoPreco = campo({ label: 'Preço de referência', obrigatorio: true, controle: moedaPreco.raiz })

    const inputTempo = criarInput({ type: 'number', min: '1', classe: 'input-estreito', value: dados.tempoEstimadoDias })
    const campoTempo = campo({
      label: 'Tempo estimado',
      obrigatorio: true,
      dica: 'Alimenta a sugestão de prazo das OS.',
      controle: h('div', { class: 'campo-com-sufixo' }, inputTempo, h('span', { class: 'texto-faint' }, 'dias')),
    })
    inputTempo.addEventListener('input', () => {
      dados.tempoEstimadoDias = Number(inputTempo.value)
      if (erros.tempoEstimadoDias) {
        erros.tempoEstimadoDias = ''
        campoTempo.definirErro('')
      }
    })

    const textareaDescricao = criarTextarea({ rows: 3, placeholder: 'O que está incluído neste serviço⬦', value: dados.descricao })

    let ativo = dados.ativo
    const switchAtivo = interruptor({
      rotulo: 'Serviço ativo',
      descricao: 'Serviços inativos não aparecem nos formulários de OS.',
      marcado: ativo,
      onMudar: (valor) => {
        ativo = valor
      },
    })

    inputNome.addEventListener('input', () => {
      if (erros.nome) {
        erros.nome = ''
        campoNome.definirErro('')
      }
    })

    const modal = abrirModal({
      titulo: edicao ? 'Editar serviço' : 'Novo serviço',
      descricao: servico?.nome,
      icone: 'Scissors',
      conteudo: h('form', {
        novalidate: '', class: 'pilha-4',
        onSubmit: async (evento) => {
          evento.preventDefault()
          dados.nome = inputNome.value
          dados.categoria = selectCategoria.value
          dados.descricao = textareaDescricao.value
          dados.ativo = ativo

          erros.nome = vazio(dados.nome, 'Informe o nome do serviço')
          erros.categoria = vazio(dados.categoria, 'Selecione a categoria')
          erros.precoReferencia = positivo(dados.precoReferencia, 'Informe um preço de referência')
          erros.tempoEstimadoDias = naoNegativo(dados.tempoEstimadoDias, 'Informe os dias estimados')
          campoNome.definirErro(erros.nome)
          campoCategoria.definirErro(erros.categoria)
          campoPreco.definirErro(erros.precoReferencia)
          campoTempo.definirErro(erros.tempoEstimadoDias)
          if (Object.values(erros).some(Boolean)) {
            toast.erro('Revise os campos destacados.')
            return
          }

          const payload = { ...dados, descricao: dados.descricao.trim() }
          const resultado = edicao
            ? await acoes.servicos.atualizar(servico.id, payload)
            : await acoes.servicos.criar(payload)
          if (resultado.ok) {
            toast.sucesso(edicao ? 'Serviço atualizado.' : 'Serviço cadastrado.')
            modal.fechar()
          } else {
            toast.aviso(resultado.erro)
          }
        },
      },
        h('div', { class: 'grade-form' }, campoNome.raiz, campoCategoria.raiz, campoPreco.raiz, campoTempo.raiz),
        campo({ label: 'Descrição', controle: textareaDescricao }).raiz,
        switchAtivo,
        h('div', { class: 'confirmar-acoes borda-superior' },
          botao({ variante: 'secundario', type: 'button', children: ['Cancelar'], onClick: () => modal.fechar() }),
          botao({ tipo: 'submit', children: [edicao ? 'Salvar alterações' : 'Cadastrar serviço'] })
        )
      ),
      onFechar: () => this.renderizar(),
    })
  }

  confirmarExclusao(servico) {
    const db = obterDb()
    const emUso =
      db.ordens.some((o) => o.servicoId === servico.id) ||
      db.orcamentos.some((o) => o.servicoId === servico.id)

    confirmar({
      titulo: 'Excluir serviço?',
      descricao: emUso
        ? 'Este serviço já foi usado em ordens ou orçamentos e não pode ser removido. Em vez disso, desative-o para preservar o histórico.'
        : 'Esta ação remove o serviço do catálogo e não pode ser desfeita.',
      rotuloConfirmar: 'Excluir serviço',
      onConfirmar: async () => {
        const resultado = await acoes.servicos.remover(servico.id)
        if (resultado.ok) {
          toast.sucesso('Serviço removido do catálogo.')
          return true
        }
        toast.aviso(resultado.erro)
        return false
      },
    })
  }
}

// Inicialização no fim do arquivo: as classes/constantes do módulo
// precisam estar definidas antes do primeiro uso.
const app = iniciarApp('servicos')
if (app) {
  const pagina = new PaginaServicos()
  assinarStore(() => pagina.renderizar())
  pagina.iniciar()
}
