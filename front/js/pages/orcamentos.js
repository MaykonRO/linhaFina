/**
 * Orçamentos (pages/orcamentos.html) — gestão de propostas do ateliê.
 *
 * Lista com busca e abas por status, ações contextuais (aprovar, recusar,
 * converter em OS, duplicar) e modais de formulário e detalhe. A conversão
 * em OS gera uma ordem a partir da proposta aprovada e navega até ela.
 */

import { iniciarApp, recarregarDados } from '../app/boot.js'
import { obterDb, acoes, assinarStore, obterEstadoRequisicao, ESTADO_REQUISICAO } from '../app/store.js'
import { blocoEstadoRequisicao, avisoSemIntegracao } from '../components/estados.js'
import { caminho, navegar } from '../app/rotas.js'
import { toast } from '../components/toast.js'
import { h, debounce } from '../components/dom.js'
import { icone } from '../components/icons.js'
import { pageHeader, badge, botao, abas, campo, criarInput, criarTextarea, campoBusca, campoMoeda } from '../components/ui.js'
import { criarDataTable } from '../components/datatable.js'
import { abrirModal } from '../components/modal.js'
import { confirmar } from '../components/confirm.js'
import { cliente as buscarCliente, servico as buscarServico } from '../services/estatisticas.js'
import { STATUS_ORCAMENTO } from '../utils/status.js'
import {
  adicionarDias, compararTexto, contemTexto, descreverPrazo, diferencaDias, formatarData, formatarMoeda, hojeISO,
} from '../utils/format.js'
import { dataAntesDe, positivo, validarCampo, vazio } from '../utils/validation.js'

const ABAS = [
  { id: 'todas', rotulo: 'Todas' },
  { id: 'pendente', rotulo: 'Pendentes' },
  { id: 'aprovado', rotulo: 'Aprovados' },
  { id: 'recusado', rotulo: 'Recusados' },
  { id: 'expirado', rotulo: 'Expirados' },
  { id: 'convertido', rotulo: 'Convertidos' },
]

/** Ordenação padrão: criação mais recente primeiro, depois código. */
const porRecente = (a, b) =>
  compararTexto(b.dataCriacao, a.dataCriacao) || compararTexto(b.codigo, a.codigo)

/** Dica de validade dos pendentes: "vencido" / "vence hoje/amanhã/em X dias". */
function dicaValidade(orc) {
  if (orc.status !== 'pendente' || !orc.validade) return null
  const dias = diferencaDias(hojeISO(), orc.validade)
  if (dias < 0) return { texto: 'vencido', classe: 'text-perigo', perigo: true }
  if (dias > 7) return null
  return {
    texto: `vence ${descreverPrazo(orc.validade)}`,
    classe: dias <= 1 ? 'text-atencao' : 'texto-faint',
    perigo: false,
  }
}


class PaginaOrcamentos {
  iniciar() {
    this.busca = ''
    this.buscaDebounced = ''
    this.aba = 'todas'
    this.destino = document.getElementById('pagina')
    this.renderizar()
  }

  listaBuscada() {
    const db = obterDb()
    const termo = this.buscaDebounced.trim().toLowerCase()
    if (!termo) return [...db.orcamentos].sort(porRecente)
    return db.orcamentos
      .filter((orc) => {
        const nome = db.clientes.find((c) => c.id === orc.clienteId)?.nome ?? ''
        return (
          contemTexto(orc.codigo, termo) ||
          contemTexto(orc.descricao, termo) ||
          contemTexto(nome, termo)
        )
      })
      .sort(porRecente)
  }

  renderizar() {
    const db = obterDb()
    const listaBuscada = this.listaBuscada()
    const listaFiltrada = this.aba === 'todas' ? listaBuscada : listaBuscada.filter((orc) => orc.status === this.aba)

    const contadores = { todas: listaBuscada.length, pendente: 0, aprovado: 0, recusado: 0, expirado: 0, convertido: 0 }
    for (const orc of listaBuscada) {
      if (contadores[orc.status] !== undefined) contadores[orc.status] += 1
    }

    const buscaEl = campoBusca({
      valor: this.busca,
      onValor: (valor) => {
        this.busca = valor
        atualizarDebounced()
      },
      rotulo: 'Buscar orçamentos',
      placeholder: 'Buscar por código, descrição ou cliente⬦',
      classe: 'busca-orcamentos',
    })
    const atualizarDebounced = debounce(() => {
      this.buscaDebounced = this.busca
      this.renderizar()
    }, 300)

    const colunas = [
      {
        chave: 'codigo',
        cabecalho: 'Código',
        ordenar: (orc) => orc.codigo,
        render: (orc) => h('span', { class: 'tnum texto-medio' }, orc.codigo),
      },
      {
        chave: 'cliente',
        cabecalho: 'Cliente',
        ordenar: (orc) => this.nomeCliente(orc.clienteId),
        render: (orc) => h('span', { class: 'texto-suave' }, this.nomeCliente(orc.clienteId) || '—'),
      },
      {
        chave: 'descricao',
        cabecalho: 'Descrição',
        ordenar: (orc) => orc.descricao,
        render: (orc) => h('span', { class: 'texto-suave texto-truncado descricao-celula', title: orc.descricao }, orc.descricao),
      },
      {
        chave: 'valor',
        cabecalho: 'Valor estimado',
        alinhamento: 'direita',
        ordenar: (orc) => orc.valorEstimado,
        render: (orc) => h('span', { class: 'tnum texto-medio' }, formatarMoeda(orc.valorEstimado)),
      },
      {
        chave: 'criacao',
        cabecalho: 'Criação',
        ordenar: (orc) => orc.dataCriacao,
        render: (orc) => h('span', { class: 'tnum texto-suave' }, formatarData(orc.dataCriacao)),
      },
      {
        chave: 'validade',
        cabecalho: 'Validade',
        ordenar: (orc) => orc.validade,
        render: (orc) => this.celulaValidade(orc),
      },
      {
        chave: 'status',
        cabecalho: 'Status',
        ordenar: (orc) => orc.status,
        render: (orc) => this.celulaStatus(orc),
      },
      {
        chave: 'acoes',
        cabecalho: '',
        alinhamento: 'direita',
        render: (orc) => this.acoesOrcamento(orc),
      },
    ]

    const tabela = criarDataTable({
      colunas,
      linhas: listaFiltrada,
      compacto: db.configuracoes.interface.compactarTabelas,
      vazio: {
        icone: 'FileText',
        titulo: db.orcamentos.length === 0
          ? 'Nenhum orçamento cadastrado.'
          : 'Nenhum orçamento neste filtro.',
        descricao: db.orcamentos.length === 0
          ? 'Use a ação “Novo orçamento” para registrar a primeira proposta quando a integração estiver disponível.'
          : 'Nenhum orçamento corresponde à aba e à busca selecionadas. Escolha outra aba ou limpe a busca.',
        acao: db.orcamentos.length === 0
          ? botao({ icone: 'Plus', children: ['Novo orçamento'], onClick: () => this.abrirForm(null) })
          : null,
      },
      barraFerramentas: h('div', { class: 'barra-orcamentos' },
        abas({
          lista: ABAS.map((item) => ({ ...item, contador: contadores[item.id] ?? 0 })),
          ativa: this.aba,
          onMudar: (id) => {
            this.aba = id
            this.renderizar()
          },
        }),
        buscaEl
      ),
      renderLinhaMobile: (orc) => this.cartaoMobile(orc),
      rotuloSingular: 'orçamento',
      rotuloPlural: 'orçamentos',
      porPagina: 8,
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
          titulo: 'Orçamentos',
          descricao: 'Registre propostas, acompanhe validades e converta aprovações em ordens de serviço.',
          acoes: [botao({ icone: 'Plus', children: ['Novo orçamento'], onClick: () => this.abrirForm(null) })],
        }),
        avisoIntegracao,
        blocoEstado ?? tabela.raiz
      )
    )
  }

  nomeCliente(clienteId) {
    return buscarCliente(obterDb(), clienteId)?.nome ?? ''
  }

  osVinculada(orc) {
    if (!orc.convertidoOsId) return null
    return obterDb().ordens.find((os) => os.id === orc.convertidoOsId) ?? null
  }

  celulaValidade(orc) {
    const dica = dicaValidade(orc)
    return h('div', { class: 'tnum' },
      h('span', { class: dica?.perigo ? 'texto-medio text-perigo' : 'texto-suave' }, formatarData(orc.validade)),
      dica && h('p', { class: `texto-faint-pequeno ${dica.classe}` }, dica.texto)
    )
  }

  celulaStatus(orc) {
    const os = this.osVinculada(orc)
    return h('div', { class: 'coluna-status' },
      badge({ status: STATUS_ORCAMENTO[orc.status] }),
      orc.status === 'convertido' && os &&
        h('a', {
          href: caminho('ordens-servico', { os: os.id }),
          class: 'tnum link-os-vinculada',
          title: `Ver OS ${os.codigo}`,
        }, os.codigo)
    )
  }

  acoesOrcamento(orc) {
    const botaoIcone = (nome, rotulo, onClick, perigo = false) =>
      botao({
        variante: 'fantasma', tamanho: 'sm', classe: `botao-acao${perigo ? ' botao-perigo' : ''}`,
        'aria-label': rotulo, title: rotulo,
        onClick: () => onClick(orc),
        children: [h('span', { class: 'ic-caixa', innerHTML: icone(nome, 'ic ic--16') })],
      })

    const acoes = []
    if (orc.status === 'pendente') {
      acoes.push(
        botaoIcone('CircleCheck', 'Aprovar orçamento', () => this.confirmarAprovacao(orc)),
        botaoIcone('CircleX', 'Recusar orçamento', () => this.abrirRecusa(orc), true)
      )
    }
    if (orc.status === 'aprovado') {
      acoes.push(
        botao({
          variante: 'secundario', tamanho: 'sm',
          children: [h('span', { class: 'ic-caixa', innerHTML: icone('CircleArrowRight', 'ic ic--16') }), 'Converter em OS'],
          onClick: () => this.confirmarConversao(orc),
        }),
        botaoIcone('CircleX', 'Recusar orçamento', () => this.abrirRecusa(orc), true)
      )
    }
    if (orc.status === 'pendente' || orc.status === 'aprovado') {
      acoes.push(botaoIcone('Pencil', 'Editar orçamento', () => this.abrirForm(orc)))
    }
    if (orc.status === 'recusado' || orc.status === 'expirado') {
      acoes.push(botaoIcone('Copy', 'Duplicar orçamento', () => this.duplicar(orc)))
    }
    acoes.push(botaoIcone('Eye', 'Ver detalhes', () => this.abrirDetalhe(orc)))
    return h('div', { class: 'acoes-orcamento' }, acoes)
  }

  cartaoMobile(orc) {
    const dica = dicaValidade(orc)
    const os = this.osVinculada(orc)
    return h('div', { class: 'pilha-4' },
      h('div', { class: 'linha-entre al-inicio' },
        h('div', {},
          h('p', { class: 'tnum texto-medio' }, orc.codigo),
          h('p', { class: 'texto-truncado texto-suave' }, this.nomeCliente(orc.clienteId) || '—')
        ),
        badge({ status: STATUS_ORCAMENTO[orc.status] })
      ),
      h('p', { class: 'descricao-linha texto-suave' }, orc.descricao),
      h('div', { class: 'linha-entre-envoltoria' },
        h('span', { class: 'tnum texto-medio' }, formatarMoeda(orc.valorEstimado)),
        h('span', { class: 'tnum texto-faint-pequeno' }, `Criado ${formatarData(orc.dataCriacao)} · válido até ${formatarData(orc.validade)}`)
      ),
      dica && h('p', { class: `texto-faint-pequeno ${dica.classe}` }, dica.texto),
      orc.status === 'convertido' && os &&
        h('a', { href: caminho('ordens-servico', { os: os.id }), class: 'link-os-vinculada' },
          `Ver OS ${os.codigo}`,
          h('span', { class: 'ic-caixa', innerHTML: icone('CircleArrowRight', 'ic ic--14') })
        ),
      this.acoesOrcamento(orc)
    )
  }

  /* ------------------------------ Ações ------------------------------ */

  confirmarAprovacao(orc) {
    confirmar({
      titulo: 'Aprovar orçamento?',
      descricao: 'A proposta será marcada como aprovada e poderá ser convertida em ordem de serviço.',
      rotuloConfirmar: 'Aprovar',
      perigo: false,
      onConfirmar: async () => {
        const resultado = await acoes.orcamentos.aprovar(orc.id)
        if (resultado.ok) {
          toast.sucesso(`Orçamento ${orc.codigo} aprovado.`)
          return true
        }
        toast.aviso(resultado.erro)
        return false
      },
    })
  }

  confirmarConversao(orc) {
    confirmar({
      titulo: 'Converter em OS?',
      descricao: 'Será criada uma nova ordem de serviço com os dados desta proposta; o orçamento ficará marcado como convertido.',
      rotuloConfirmar: 'Converter em OS',
      perigo: false,
      conteudo: this.resumoConversao(orc),
      onConfirmar: async () => {
        const resultado = await acoes.orcamentos.converterEmOS(orc.id)
        if (!resultado.ok) {
          toast.aviso(resultado.erro)
          return false
        }
        const os = resultado.data
        toast.sucesso(`OS ${os?.codigo ?? ''} criada a partir do orçamento.`)
        navegar('ordens-servico', { os: os?.id })
        return true
      },
    })
  }

  resumoConversao(orc) {
    const db = obterDb()
    const cliente = buscarCliente(db, orc.clienteId)
    const linha = (rotulo, valor) =>
      h('div', { class: 'dado-linha' },
        h('dt', { class: 'texto-faint-pequeno' }, rotulo),
        h('dd', { class: 'dado-valor' }, valor)
      )
    return h('div', {},
      h('dl', { class: 'resumo-conversao' },
        linha('Cliente', cliente?.nome ?? '—'),
        linha('Descrição', orc.descricao),
        linha('Valor estimado', h('span', { class: 'tnum texto-medio' }, formatarMoeda(orc.valorEstimado)))
      ),
      h('p', { class: 'nota-conversao' },
        h('span', { class: 'ic-caixa', innerHTML: icone('Info', 'ic ic--14') }),
        h('span', {}, 'Sem integração: prazo e dados oficiais da OS serão definidos pelo back-end.')
      )
    )
  }

  abrirRecusa(orc) {
    const textarea = criarTextarea({
      rows: 3,
      placeholder: 'Ex.: cliente considerou o valor acima do planejado',
    })

    const modal = abrirModal({
      tamanho: 'sm',
      icone: 'CircleX',
      titulo: 'Recusar orçamento',
      descricao: `${orc.codigo} · ${this.nomeCliente(orc.clienteId) || 'cliente'}`,
      conteudo: h('div', { class: 'pilha-4' },
        h('p', { class: 'confirmar-descricao' },
          'A proposta ficará marcada como recusada. Registre o motivo para orientar futuros reajustes — ele aparece no detalhe do orçamento.'
        ),
        campo({ label: 'Motivo (opcional)', controle: textarea }).raiz,
        h('div', { class: 'confirmar-acoes' },
          botao({ variante: 'secundario', children: ['Voltar'], onClick: () => modal.fechar() }),
          botao({
            variante: 'perigo',
            children: ['Recusar orçamento'],
            onClick: async () => {
              const resultado = await acoes.orcamentos.recusar(orc.id, textarea.value)
              if (resultado.ok) {
                toast.sucesso(`Orçamento ${orc.codigo} recusado.`)
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

  async duplicar(orc) {
    const hoje = hojeISO()
    const resultado = await acoes.orcamentos.criar({
      clienteId: orc.clienteId,
      servicoId: orc.servicoId,
      descricao: orc.descricao,
      valorEstimado: orc.valorEstimado,
      dataCriacao: hoje,
      validade: orc.validade && orc.validade >= hoje ? orc.validade : adicionarDias(hoje, 30),
    })
    if (resultado.ok) toast.sucesso(`Orçamento ${resultado.data?.codigo ?? ''} criado a partir de ${orc.codigo}.`)
    else toast.aviso(resultado.erro)
  }

  abrirDetalhe(orc) {
    const db = obterDb()
    const cliente = buscarCliente(db, orc.clienteId)
    const servico = buscarServico(db, orc.servicoId)
    const os = this.osVinculada(orc)
    const dica = dicaValidade(orc)

    const itemDetalhe = (rotulo, valor, classe = '') =>
      h('div', { class: classe },
        h('dt', { class: 'item-detalhe-rotulo' }, rotulo),
        h('dd', { class: 'item-detalhe-valor' }, valor)
      )

    abrirModal({
      tamanho: 'md',
      icone: 'FileText',
      titulo: orc.codigo,
      descricao: cliente ? `Proposta para ${cliente.nome}` : undefined,
      conteudo: h('div', { class: 'pilha-4' },
        h('dl', { class: 'grade-detalhe' },
          itemDetalhe('Cliente', cliente?.nome ?? '—'),
          itemDetalhe('Serviço', servico?.nome ?? 'A definir'),
          itemDetalhe('Descrição', orc.descricao, 'item-detalhe--largo'),
          itemDetalhe('Valor estimado', h('span', { class: 'tnum texto-medio' }, formatarMoeda(orc.valorEstimado))),
          itemDetalhe('Status', badge({ status: STATUS_ORCAMENTO[orc.status] })),
          itemDetalhe('Criação', h('span', { class: 'tnum' }, formatarData(orc.dataCriacao))),
          itemDetalhe('Validade',
            h('span', {},
              h('span', { class: `tnum ${dica?.perigo ? 'text-perigo' : ''}` }, formatarData(orc.validade)),
              dica && h('p', { class: `texto-faint-pequeno ${dica.classe}` }, dica.texto)
            )
          ),
          orc.status === 'recusado' && orc.motivo &&
            itemDetalhe('Motivo da recusa', orc.motivo, 'item-detalhe--largo'),
          orc.status === 'convertido' && os &&
            itemDetalhe('OS vinculada',
              h('a', { href: caminho('ordens-servico', { os: os.id }), class: 'link-os-vinculada' },
                os.codigo,
                h('span', { class: 'ic-caixa', innerHTML: icone('CircleArrowRight', 'ic ic--14') })
              ),
              'item-detalhe--largo'
            )
        ),
        h('div', { class: 'alinhado-direita borda-superior' },
          botao({ variante: 'secundario', children: ['Fechar'], onClick: () => modal.fechar() })
        )
      ),
      onFechar: () => this.renderizar(),
    })
  }

  /* ------------------------------ Formulário ------------------------------ */

  abrirForm(orcamento) {
    const db = obterDb()
    const edicao = Boolean(orcamento)
    const dados = {
      clienteId: orcamento?.clienteId ?? '',
      servicoId: orcamento?.servicoId ?? '',
      descricao: orcamento?.descricao ?? '',
      valorEstimado: orcamento?.valorEstimado ?? 0,
      dataCriacao: orcamento?.dataCriacao || hojeISO(),
      validade: orcamento?.validade ?? '',
    }
    const erros = {}

    const clientes = [...db.clientes].sort((a, b) => compararTexto(a.nome, b.nome))
    const servicos = [...db.servicos].sort((a, b) => compararTexto(a.nome, b.nome))

    const selectCliente = h('select', { class: 'input-base' },
      h('option', { value: '' }, 'Selecione⬦'),
      clientes.map((cliente) => h('option', { value: cliente.id }, cliente.nome))
    )
    selectCliente.value = dados.clienteId

    const selectServico = h('select', { class: 'input-base' },
      h('option', { value: '' }, 'A definir'),
      servicos.map((servico) => h('option', { value: servico.id }, servico.nome))
    )
    selectServico.value = dados.servicoId

    const textareaDescricao = criarTextarea({
      rows: 3,
      placeholder: 'Ex.: vestido longo em crepe com forro e bordado no decote',
      value: dados.descricao,
    })

    const moedaEl = campoMoeda({ valor: dados.valorEstimado })

    const inputCriacao = criarInput({ type: 'date', value: dados.dataCriacao })
    const inputValidade = criarInput({ type: 'date', value: dados.validade, min: dados.dataCriacao || undefined })

    const campoCliente = campo({ label: 'Cliente', obrigatorio: true, controle: selectCliente })
    const campoServico = campo({ label: 'Serviço', dica: 'Opcional quando o serviço ainda não foi escolhido.', controle: selectServico })
    const campoDescricao = campo({ label: 'Descrição', obrigatorio: true, controle: textareaDescricao })
    const campoValor = campo({ label: 'Valor estimado', obrigatorio: true, controle: moedaEl.raiz })
    const campoCriacao = campo({ label: 'Data de criação', controle: inputCriacao })
    const campoValidade = campo({ label: 'Validade', obrigatorio: true, controle: inputValidade })

    inputCriacao.addEventListener('input', () => {
      dados.dataCriacao = inputCriacao.value
      inputValidade.min = inputCriacao.value || undefined
    })

    const limparErro = (nomeCampo, campoEl, entrada) => {
      entrada.addEventListener('input', () => {
        if (erros[nomeCampo]) {
          erros[nomeCampo] = ''
          campoEl.definirErro('')
        }
      })
    }
    limparErro('clienteId', campoCliente, selectCliente)
    limparErro('descricao', campoDescricao, textareaDescricao)
    limparErro('validade', campoValidade, inputValidade)

    const modal = abrirModal({
      tamanho: 'lg',
      icone: edicao ? 'Pencil' : 'FileText',
      titulo: edicao ? 'Editar orçamento' : 'Novo orçamento',
      descricao: orcamento?.codigo ?? 'Registre a proposta antes de abrir a ordem de serviço.',
      conteudo: h('form', {
        novalidate: '', class: 'pilha-4',
        onSubmit: async (evento) => {
          evento.preventDefault()
          dados.clienteId = selectCliente.value
          dados.servicoId = selectServico.value
          dados.descricao = textareaDescricao.value
          dados.valorEstimado = moedaEl.valorAtual()
          dados.dataCriacao = inputCriacao.value || hojeISO()
          dados.validade = inputValidade.value

          const validacao = validarCampo({
            clienteId: vazio(dados.clienteId, 'Selecione uma cliente'),
            descricao: vazio(dados.descricao, 'Descreva o serviço orçado'),
            valorEstimado: positivo(dados.valorEstimado),
            validade:
              vazio(dados.validade, 'Informe a data de validade') ||
              dataAntesDe(dados.dataCriacao, dados.validade, 'A validade não pode ser anterior à criação'),
          })
          erros.clienteId = validacao.erros.clienteId
          erros.descricao = validacao.erros.descricao
          erros.valorEstimado = validacao.erros.valorEstimado
          erros.validade = validacao.erros.validade
          campoCliente.definirErro(validacao.erros.clienteId)
          campoDescricao.definirErro(validacao.erros.descricao)
          campoValor.definirErro(validacao.erros.valorEstimado)
          campoValidade.definirErro(validacao.erros.validade)
          if (!validacao.valido) {
            toast.erro('Revise os campos destacados.')
            return
          }

          const payload = {
            clienteId: dados.clienteId,
            servicoId: dados.servicoId,
            descricao: dados.descricao.trim(),
            valorEstimado: dados.valorEstimado,
            dataCriacao: dados.dataCriacao,
            validade: dados.validade,
          }
          const resultado = edicao
            ? await acoes.orcamentos.atualizar(orcamento.id, payload)
            : await acoes.orcamentos.criar(payload)
          if (resultado.ok) {
            toast.sucesso(edicao ? 'Orçamento atualizado.' : 'Orçamento criado.')
            modal.fechar()
          } else {
            toast.aviso(resultado.erro)
          }
        },
      },
        h('div', { class: 'grade-form' }, campoCliente.raiz, campoServico.raiz),
        campoDescricao.raiz,
        h('div', { class: 'grade grade-3-sm' }, campoValor.raiz, campoCriacao.raiz, campoValidade.raiz),
        h('div', { class: 'confirmar-acoes borda-superior' },
          botao({ variante: 'secundario', type: 'button', children: ['Cancelar'], onClick: () => modal.fechar() }),
          botao({ tipo: 'submit', children: [edicao ? 'Salvar alterações' : 'Criar orçamento'] })
        )
      ),
      onFechar: () => this.renderizar(),
    })
  }
}

// Inicialização no fim do arquivo: as classes/constantes do módulo
// precisam estar definidas antes do primeiro uso.
const app = iniciarApp('orcamentos')
if (app) {
  const pagina = new PaginaOrcamentos()
  assinarStore(() => pagina.renderizar())
  pagina.iniciar()
}
