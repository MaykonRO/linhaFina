/**
 * Formulário de ordem de serviço — criação e edição
 * (pages/ordem-servico-form.html).
 *
 * - ?id=ID          → edição (OS cancelada fica bloqueada)
 * - ?cliente=ID     → pré-seleciona a cliente (botão "Nova OS" do perfil)
 *
 * A cliente vem de um combobox com filtro e cadastro rápido por modal.
 * Valores e datas são preenchidos pela equipe; a API será a autoridade para
 * cálculos, prazos, status e persistence.
 */

import { iniciarApp, recarregarDados } from '../app/boot.js'
import { obterDb, acoes, obterEstadoRequisicao, ESTADO_REQUISICAO, assinarStore } from '../app/store.js'
import { blocoEstadoRequisicao, avisoSemIntegracao } from '../components/estados.js'
import { caminho, navegar } from '../app/rotas.js'
import { toast } from '../components/toast.js'
import { h } from '../components/dom.js'
import { icone } from '../components/icons.js'
import {
  pageHeader, badge, botao, botaoLink, estadoVazio,
  campo, criarInput, criarTextarea, checkbox, campoMoeda,
} from '../components/ui.js'
import { abrirModal } from '../components/modal.js'
import { compararTexto, contemTexto, formatarMoeda, formatarTelefone, hojeISO } from '../utils/format.js'
import { STATUS_OS, STATUS_OS_LISTA } from '../utils/status.js'
import { dataAntesDe, email as validarEmail, naoNegativo, positivo, telefone as validarTelefone, vazio, validarCampo } from '../utils/validation.js'

const TIPOS_PECA_SUGERIDOS = [
  'Vestido', 'Blazer', 'Calça', 'Camisa', 'Saia', 'Terno', 'Jaqueta', 'Casaco', 'Outra',
]

const porNome = (a, b) => compararTexto(a.nome, b.nome)


class ControladorFormularioOS {
  iniciar() {
    this.destino = document.getElementById('pagina')
    const parametros = new URLSearchParams(location.search)
    this.id = parametros.get('id') || ''
    this.modoEdicao = Boolean(this.id)
    this.clienteParam = parametros.get('cliente') || null
    this.os = null
    this.form = null
    this.erros = {}
    this.tentouEnviar = false
    this.clienteAplicado = false
    this.dadosAplicados = false

    this.renderizar()

    // A carga da API é assíncrona. Enquanto ela não termina, o formulário
    // espera (não pode afirmar que a OS "não existe" antes da resposta).
    // Quando os dados chegam, a tela é redesenhada uma única vez — antes de
    // qualquer digitação do usuário.
    this.cancelarAssinatura = assinarStore(() => {
      if (this.dadosAplicados) return
      if (obterEstadoRequisicao().status === ESTADO_REQUISICAO.CARREGANDO) return
      this.dadosAplicados = true
      this.renderizar()
    })
  }

  formInicial() {
    return {
      clienteId: '', servicoId: '', tipoPeca: '', descricaoPeca: '', observacoes: '',
      sobMedida: false, ajuste: false, urgente: false,
      valorServico: 0, desconto: 0,
      dataEntrada: hojeISO(), dataPrevistaEntrega: '', dataProva: '',
      responsavelId: '', status: 'aguardando',
    }
  }

  formDaOrdem(os) {
    return {
      ...this.formInicial(),
      clienteId: os.clienteId || '',
      servicoId: os.servicoId || '',
      tipoPeca: os.tipoPeca || '',
      descricaoPeca: os.descricaoPeca || '',
      observacoes: os.observacoes || '',
      sobMedida: Boolean(os.sobMedida),
      ajuste: Boolean(os.ajuste),
      urgente: Boolean(os.urgente),
      valorServico: Number(os.valorServico) || 0,
      desconto: Number(os.desconto) || 0,
      dataEntrada: os.dataEntrada || hojeISO(),
      dataPrevistaEntrega: os.dataPrevistaEntrega || '',
      dataProva: os.dataProva || '',
      responsavelId: os.responsavelId || '',
      status: os.status || 'aguardando',
    }
  }

  /* ------------------------------ Validação ------------------------------ */

  erroDataProva() {
    if (!this.form.dataProva) return ''
    if (this.form.dataProva < this.form.dataEntrada) return 'A prova não pode ser anterior à data de entrada'
    if (this.form.dataPrevistaEntrega && this.form.dataProva > this.form.dataPrevistaEntrega) {
      return 'A prova deve acontecer antes da entrega prevista'
    }
    return ''
  }

  calcularErros() {
    const valorFinal = Math.max(this.form.valorServico - this.form.desconto, 0)
    return {
      clienteId: vazio(this.form.clienteId, 'Selecione uma cliente'),
      servicoId: vazio(this.form.servicoId, 'Selecione o tipo de serviço'),
      tipoPeca: vazio(this.form.tipoPeca, 'Informe o tipo de peça'),
      descricaoPeca: vazio(this.form.descricaoPeca, 'Descreva a peça'),
      valorServico: positivo(this.form.valorServico),
      desconto:
        naoNegativo(this.form.desconto) ||
        (this.form.valorServico > 0 && valorFinal <= 0
          ? 'O desconto deixa o valor final zerado — reveja os valores'
          : ''),
      dataEntrada: vazio(this.form.dataEntrada, 'Informe a data de entrada'),
      dataPrevistaEntrega:
        vazio(this.form.dataPrevistaEntrega, 'Informe a previsão de entrega') ||
        dataAntesDe(this.form.dataEntrada, this.form.dataPrevistaEntrega, 'A entrega não pode ser anterior à entrada'),
      dataProva: this.erroDataProva(),
    }
  }

  setCampo(nomeCampo, valor) {
    this.form[nomeCampo] = valor
    if (this.tentouEnviar && this.erros[nomeCampo]) {
      this.erros[nomeCampo] = (this.calcularErros())[nomeCampo] ?? ''
      this.campos?.[nomeCampo]?.definirErro(this.erros[nomeCampo])
    }
    if (['valorServico', 'desconto'].includes(nomeCampo)) this.atualizarResumo()
    if (nomeCampo === 'urgente') this.atualizarAvisoUrgente()
  }

  /* ------------------------------ Renderização ------------------------------ */

  renderizarNaoEncontrada() {
    const trilha = [{ rotulo: 'Ordens de serviço', rota: caminho('ordens-servico') }, { rotulo: 'Editar OS' }]
    this.destino.replaceChildren(
      h('div', { class: 'pilha-6 animar-entrada' },
        pageHeader({ titulo: 'Editar OS', trilha }),
        estadoVazio({
          icone: 'SearchX',
          titulo: 'Ordem de serviço não encontrada',
          descricao: 'A API respondeu e não devolveu esta OS. Ela pode ter sido removida ou o endereço pode estar incorreto.',
          acao: botao({ variante: 'secundario', children: ['Voltar para ordens de serviço'], onClick: () => navegar('ordens-servico') }),
        })
      )
    )
  }

  /**
   * Estado de espera: a OS ainda não pode ser confirmada (carregando, erro
   * de comunicação ou integração não configurada). Não se afirma "não existe"
   * antes de a API responder.
   */
  renderizarAguardando() {
    const requisicao = obterEstadoRequisicao()
    const trilha = [{ rotulo: 'Ordens de serviço', rota: caminho('ordens-servico') }, { rotulo: 'Editar OS' }]
    this.destino.replaceChildren(
      h('div', { class: 'pilha-6 animar-entrada' },
        pageHeader({ titulo: 'Editar OS', trilha }),
        requisicao.status === ESTADO_REQUISICAO.SEM_INTEGRACAO
          ? avisoSemIntegracao()
          : blocoEstadoRequisicao({
              status: requisicao.status,
              erro: requisicao.erro,
              onTentar: () => recarregarDados(),
            })
      )
    )
  }

  renderizarCancelada() {
    const trilha = [{ rotulo: 'Ordens de serviço', rota: caminho('ordens-servico') }, { rotulo: 'Editar OS' }]
    this.destino.replaceChildren(
      h('div', { class: 'pilha-6 animar-entrada' },
        pageHeader({
          titulo: 'Editar ordem de serviço',
          descricao: `OS ${this.os.codigo}`,
          trilha,
          acoes: [badge({ status: STATUS_OS[this.os.status] })],
        }),
        h('section', { class: 'card-surface cartao-padrao largura-max-form pilha-4' },
          h('div', { class: 'aviso-perigo' },
            h('span', { class: 'ic-caixa aviso-perigo-icone', innerHTML: icone('TriangleAlert', 'ic ic--18') }),
            h('div', {},
              h('p', { class: 'aviso-perigo-titulo' }, 'Esta OS está cancelada e não pode ser editada.'),
              h('p', { class: 'aviso-perigo-texto' },
                'Ordens canceladas ficam preservadas para o histórico do ateliê. Se a cliente voltou com a peça, crie uma nova OS para recomeçar o fluxo.'
              )
            )
          ),
          h('div', { class: 'acoes-envoltura' },
            botao({ variante: 'secundario', children: ['Voltar para a listagem'], onClick: () => navegar('ordens-servico') }),
            botaoLink({ para: caminho('ordem-servico-form'), children: ['Criar nova OS'] })
          )
        )
      )
    )
  }

  renderizar() {
    const db = obterDb()
    const requisicao = obterEstadoRequisicao()
    this.campos = {}

    /* Deep-link ?id=ID: a OS pode chegar depois da primeira renderização. */
    if (this.modoEdicao && !this.os) {
      const encontrada = db.ordens.find((o) => o.id === this.id)
      if (!encontrada) {
        // Enquanto a API não respondeu, não é possível concluir que a OS sumiu.
        if (requisicao.status === ESTADO_REQUISICAO.CARREGANDO) return this.renderizarAguardando()
        if (requisicao.status === ESTADO_REQUISICAO.SEM_INTEGRACAO) return this.renderizarAguardando()
        if (requisicao.status === ESTADO_REQUISICAO.ERRO) return this.renderizarAguardando()
        return this.renderizarNaoEncontrada()
      }
      this.os = encontrada
      this.form = this.formDaOrdem(encontrada)
      this.erros = {}
      this.tentouEnviar = false
    }

    if (this.os && this.os.status === 'cancelada') return this.renderizarCancelada()

    /* Formulário inicial (criação). */
    if (!this.form) this.form = this.formInicial()

    /* Deep-link ?cliente=ID: pré-seleciona assim que a cliente existir. */
    if (!this.modoEdicao && !this.clienteAplicado && this.clienteParam) {
      if (db.clientes.some((c) => c.id === this.clienteParam)) {
        this.form.clienteId = this.clienteParam
        this.clienteAplicado = true
      }
    }

    const trilha = [
      { rotulo: 'Ordens de serviço', rota: caminho('ordens-servico') },
      { rotulo: this.modoEdicao ? 'Editar OS' : 'Nova OS' },
    ]

    const servicosAtivos = db.servicos.filter((s) => s.ativo).sort(porNome)
    const funcionariasAtivas = db.funcionarias.filter((f) => f.status !== 'afastada').sort(porNome)
    const funcionariasAfastadas = db.funcionarias.filter((f) => f.status === 'afastada').sort(porNome)
    /* ---------------- 1. Dados da cliente (combobox) ---------------- */

    const inputCliente = criarInput({
      type: 'text', role: 'combobox', 'aria-expanded': 'false', 'aria-haspopup': 'listbox',
      'aria-autocomplete': 'list', autocomplete: 'off',
      placeholder: 'Busque pelo nome, telefone ou cidade…',
    })
    const listaClientes = h('ul', { class: 'pop-surface combobox-lista', role: 'listbox', 'aria-label': 'Clientes cadastradas', hidden: '' })
    const infoCliente = h('div', { class: 'info-cliente' })
    const campoCliente = campo({ label: 'Cliente', obrigatorio: true, controle: inputCliente, classe: 'campo-cliente-os' })

    const combo = {
      aberto: false,
      busca: '',
      ativo: 0,
    }

    const clientesFiltradas = () => {
      const ordenadas = [...db.clientes].sort(porNome)
      const termo = combo.busca.trim().toLowerCase()
      if (!termo) return ordenadas
      return ordenadas.filter((c) => {
        if (contemTexto(c.nome, termo)) return true
        if (contemTexto(c.cidade, termo)) return true
        const digitos = termo.replace(/\D/g, '')
        return digitos.length > 0 && String(c.telefone || '').includes(digitos)
      })
    }

    const renderizarInfoCliente = () => {
      const selecionada = db.clientes.find((c) => c.id === this.form.clienteId) || null
      infoCliente.replaceChildren()
      if (!selecionada) return
      infoCliente.append(
        selecionada.telefone && h('span', { class: 'tnum' }, formatarTelefone(selecionada.telefone)),
        selecionada.cidade && h('span', {}, selecionada.cidade),
        selecionada.medidas && h('span', { class: 'info-cliente-medidas' },
          h('span', { class: 'ic-caixa', innerHTML: icone('Ruler', 'ic ic--12') }),
          'Possui ficha de medidas'
        )
      )
    }

    const fecharCombo = () => {
      combo.aberto = false
      listaClientes.setAttribute('hidden', '')
      inputCliente.setAttribute('aria-expanded', 'false')
      const selecionada = db.clientes.find((c) => c.id === this.form.clienteId)
      inputCliente.value = selecionada?.nome ?? ''
    }

    const renderizarLista = () => {
      const filtradas = clientesFiltradas()
      listaClientes.replaceChildren()
      if (filtradas.length === 0) {
        listaClientes.append(
          h('li', { class: 'combobox-vazia' },
            h('p', { class: 'combobox-vazia-texto' },
              db.clientes.length === 0
                ? 'Nenhuma cliente cadastrada ainda.'
                : `Nenhuma cliente encontrada para “${combo.busca.trim()}”.`
            ),
            h('button', {
              type: 'button',
              class: 'combobox-cadastro',
              onMouseDown: (evento) => evento.preventDefault(),
              onClick: () => {
                fecharCombo()
                this.abrirModalNovaCliente(combo.busca.trim(), (criada) => {
                  this.setCampo('clienteId', criada.id)
                  renderizarInfoCliente()
                  fecharCombo()
                })
              },
            },
              h('span', { class: 'ic-caixa', innerHTML: icone('UserPlus', 'ic ic--12') }),
              db.clientes.length === 0 ? 'Cadastrar primeira cliente' : `Cadastrar “${combo.busca.trim().slice(0, 40)}”`
            )
          )
        )
        return
      }
      listaClientes.append(
        ...filtradas.map((c, i) =>
          h('li', {
            role: 'option',
            'aria-selected': String(c.id === this.form.clienteId),
            id: `${inputCliente.id}-opt-${c.id}`,
            class: `combobox-opcao${i === combo.ativo ? ' combobox-opcao--ativa' : ''}`,
            onMouseDown: (evento) => evento.preventDefault(),
            onClick: () => {
              this.setCampo('clienteId', c.id)
              combo.busca = ''
              renderizarInfoCliente()
              fecharCombo()
            },
          },
            h('p', { class: 'combobox-opcao-nome' }, c.nome),
            h('p', { class: 'combobox-opcao-detalhe tnum' }, `${formatarTelefone(c.telefone)}${c.cidade ? ` · ${c.cidade}` : ''}`)
          )
        )
      )
      inputCliente.setAttribute('aria-activedescendant', `${inputCliente.id}-opt-${filtradas[combo.ativo]?.id ?? ''}`)
    }

    const abrirCombo = () => {
      combo.aberto = true
      combo.ativo = 0
      listaClientes.removeAttribute('hidden')
      inputCliente.setAttribute('aria-expanded', 'true')
      renderizarLista()
    }

    inputCliente.addEventListener('focus', () => {
      const selecionada = db.clientes.find((c) => c.id === this.form.clienteId)
      combo.busca = selecionada?.nome ?? ''
      inputCliente.value = combo.busca
      inputCliente.select()
      abrirCombo()
    })
    inputCliente.addEventListener('blur', () => {
      // Delay para permitir o clique em uma opção (mousedown é prevenido).
      setTimeout(fecharCombo, 120)
    })
    inputCliente.addEventListener('input', () => {
      combo.busca = inputCliente.value
      abrirCombo()
    })
    inputCliente.addEventListener('keydown', (evento) => {
      if (evento.key === 'Escape') {
        fecharCombo()
        return
      }
      if (!combo.aberto) return
      const filtradas = clientesFiltradas()
      if (evento.key === 'Enter') {
        // Enter com a lista aberta nunca deve submeter o formulário da OS.
        evento.preventDefault()
        const alvo = filtradas[Math.min(combo.ativo, filtradas.length - 1)]
        if (alvo) {
          this.setCampo('clienteId', alvo.id)
          combo.busca = ''
          renderizarInfoCliente()
          fecharCombo()
        }
        return
      }
      if (filtradas.length === 0) return
      if (evento.key === 'ArrowDown' || evento.key === 'ArrowUp') {
        evento.preventDefault()
        const delta = evento.key === 'ArrowDown' ? 1 : -1
        combo.ativo = Math.min(Math.max(combo.ativo + delta, 0), filtradas.length - 1)
        renderizarLista()
        requestAnimationFrame(() => {
          listaClientes.querySelectorAll('li[role="option"]')[combo.ativo]?.scrollIntoView({ block: 'nearest' })
        })
      }
    })

    const selecionada = db.clientes.find((c) => c.id === this.form.clienteId)
    inputCliente.value = selecionada?.nome ?? ''
    renderizarInfoCliente()
    this.campos.clienteId = campoCliente

    /* ---------------- 2. Dados da peça ---------------- */

    const selectServico = h('select', { class: 'input-base' },
      h('option', { value: '' }, 'Selecione o serviço…'),
      servicosAtivos.map((s) => h('option', { value: s.id }, s.nome))
    )
    selectServico.value = this.form.servicoId
    const infoServico = h('p', { class: 'info-servico tnum' })
    const campoServico = campo({ label: 'Tipo de serviço', obrigatorio: true, controle: selectServico })

    const renderizarInfoServico = () => {
      const srv = db.servicos.find((s) => s.id === this.form.servicoId)
      infoServico.replaceChildren()
      if (srv) {
        infoServico.append(
          `Referência do catálogo: ${formatarMoeda(srv.precoReferencia)} · tempo estimado: ${srv.tempoEstimadoDias} dias. O valor desta OS é informado pela equipe e confirmado pela API.`
        )
      }
    }
    renderizarInfoServico()

    selectServico.addEventListener('change', () => {
      const servicoId = selectServico.value
      this.form.servicoId = servicoId
      renderizarInfoServico()
      if (this.tentouEnviar && this.erros.servicoId) {
        this.erros.servicoId = ''
        campoServico.definirErro('')
      }
    })
    this.campos.servicoId = campoServico

    const inputTipoPeca = criarInput({ list: 'tipos-peca', placeholder: 'Vestido, blazer, calça…', value: this.form.tipoPeca })
    const datalistTipos = h('datalist', { id: 'tipos-peca' },
      TIPOS_PECA_SUGERIDOS.map((tipo) => h('option', { value: tipo }))
    )
    const campoTipoPeca = campo({ label: 'Tipo de peça', obrigatorio: true, controle: inputTipoPeca })
    inputTipoPeca.addEventListener('input', () => this.setCampo('tipoPeca', inputTipoPeca.value))
    this.campos.tipoPeca = campoTipoPeca

    const inputDescricao = criarInput({ placeholder: 'Ex.: vestido longo de cetim, com forro e zíper invisível', value: this.form.descricaoPeca })
    const campoDescricao = campo({ label: 'Descrição da peça', obrigatorio: true, controle: inputDescricao, classe: 'campo-largo' })
    inputDescricao.addEventListener('input', () => this.setCampo('descricaoPeca', inputDescricao.value))
    this.campos.descricaoPeca = campoDescricao

    const textareaObs = criarTextarea({ placeholder: 'Avisos da cliente, tecidos entregues, combinações de prova…', value: this.form.observacoes })
    const campoObs = campo({ label: 'Observações', controle: textareaObs, classe: 'campo-largo' })
    textareaObs.addEventListener('input', () => this.setCampo('observacoes', textareaObs.value))
    this.campos.observacoes = campoObs

    const checkboxSobMedida = checkbox({
      rotulo: 'Confecção sob medida',
      descricao: 'Peça produzida do zero a partir das medidas da cliente',
      marcado: this.form.sobMedida,
      onChange: (valor) => this.setCampo('sobMedida', valor),
    })
    const checkboxAjuste = checkbox({
      rotulo: 'Ajuste de peça pronta',
      descricao: 'Peça levada pela cliente para ajuste ou reforma',
      marcado: this.form.ajuste,
      onChange: (valor) => this.setCampo('ajuste', valor),
    })

    /* ---------------- 3. Valores e prazos ---------------- */

    const moedaServico = campoMoeda({
      valor: this.form.valorServico,
      onValor: (novo) => {
        this.form.valorServico = novo
        this.atualizarResumo()
      },
    })
    const campoValorServico = campo({
      label: 'Valor do serviço',
      obrigatorio: true,
      dica: 'Valor combinado com a cliente. O cálculo oficial do valor final é confirmado pela API.',
      controle: moedaServico.raiz,
    })
    this.campos.valorServico = campoValorServico
    this.campos.valorServicoInput = moedaServico

    const moedaDesconto = campoMoeda({
      valor: this.form.desconto,
      onValor: (novo) => {
        this.form.desconto = novo
        this.atualizarResumo()
      },
    })
    const campoDesconto = campo({ label: 'Desconto', controle: moedaDesconto.raiz })
    this.campos.desconto = campoDesconto

    this.resumoValorFinal = h('p', { class: 'resumo-valor-final tnum' })
    this.resumoComposicao = h('p', { class: 'resumo-composicao tnum' })

    const inputEntrada = criarInput({ type: 'date', value: this.form.dataEntrada })
    const campoEntrada = campo({ label: 'Data de entrada', obrigatorio: true, controle: inputEntrada })
    inputEntrada.addEventListener('input', () => {
      this.form.dataEntrada = inputEntrada.value
      inputPrevisao.min = inputEntrada.value || undefined
      inputProva.min = inputEntrada.value || undefined
    })
    this.campos.dataEntrada = campoEntrada

    const inputPrevisao = criarInput({ type: 'date', value: this.form.dataPrevistaEntrega, min: this.form.dataEntrada || undefined })
    const campoPrevisao = campo({
      label: 'Previsão de entrega',
      obrigatorio: true,
      dica: 'Data combinada com a cliente. O prazo oficial é confirmado pela API.',
      controle: inputPrevisao,
    })
    inputPrevisao.addEventListener('input', () => this.setCampo('dataPrevistaEntrega', inputPrevisao.value))
    this.campos.dataPrevistaEntrega = campoPrevisao

    /* ---------------- 4. Execução ---------------- */

    const selectResponsavel = h('select', { class: 'input-base' },
      h('option', { value: '' }, 'Sem responsável definida'),
      funcionariasAtivas.map((f) => h('option', { value: f.id }, f.nome)),
      funcionariasAfastadas.map((f) => h('option', { value: f.id, disabled: '' }, `${f.nome} — afastada`))
    )
    selectResponsavel.value = this.form.responsavelId
    selectResponsavel.addEventListener('change', () => this.setCampo('responsavelId', selectResponsavel.value))
    const campoResponsavel = campo({ label: 'Funcionária responsável', controle: selectResponsavel })

    const selectStatus = h('select', { class: 'input-base' },
      STATUS_OS_LISTA.map((st) => h('option', { value: st.id }, st.rotulo))
    )
    selectStatus.value = this.form.status
    selectStatus.addEventListener('change', () => this.setCampo('status', selectStatus.value))
    const campoStatus = campo({ label: 'Status', controle: selectStatus })

    this.avisoUrgente = h('div', { class: 'aviso-atencao', hidden: !this.form.urgente ? '' : null },
      h('span', { class: 'ic-caixa aviso-atencao-icone', innerHTML: icone('TriangleAlert', 'ic ic--16') }),
      h('p', { class: 'aviso-atencao-texto' },
        'Pedido marcado como urgente. A prioridade oficial da fila será aplicada pelo back-end.'
      )
    )
    const checkboxUrgente = checkbox({
      rotulo: 'Pedido urgente',
      descricao: 'Sinaliza uma prioridade; a fila oficial será definida pelo back-end',
      marcado: this.form.urgente,
      onChange: (valor) => this.setCampo('urgente', valor),
    })

    const inputProva = criarInput({ type: 'date', value: this.form.dataProva, min: this.form.dataEntrada || undefined })
    const campoProva = campo({
      label: 'Data de prova intermediária',
      dica: 'Necessária para confecções sob medida — combine a data com a cliente.',
      controle: inputProva,
    })
    inputProva.addEventListener('input', () => this.setCampo('dataProva', inputProva.value))
    this.campos.dataProva = campoProva

    /* ---------------- Formulário ---------------- */

    const botaoSalvar = botao({ tipo: 'submit', children: ['Salvar OS'] })

    const formulario = h('form', { novalidate: '', class: 'largura-max-form pilha-4', onSubmit: (evento) => this.submeter(evento) },
      /* 1. Dados da cliente */
      h('section', { class: 'card-surface cartao-padrao' },
        h('div', { class: 'cartao-titulo' },
          h('div', {},
            h('h2', { class: 'cartao-rotulo' }, 'Dados da cliente'),
            h('p', { class: 'cartao-subtitulo' }, 'Quem leva a peça ao ateliê.')
          ),
          botao({
            variante: 'fantasma', tamanho: 'sm',
            icone: 'UserPlus',
            children: ['Nova cliente'],
            onClick: () => this.abrirModalNovaCliente('', (criada) => {
              this.setCampo('clienteId', criada.id)
              renderizarInfoCliente()
              fecharCombo()
            }),
          })
        ),
        h('div', { class: 'grade-form' },
          h('div', { class: 'campo-largo' },
            h('div', { class: 'combobox-caixa' }, inputCliente, listaClientes),
            infoCliente
          )
        )
      ),
      datalistTipos,
      /* 2. Dados da peça */
      h('section', { class: 'card-surface cartao-padrao' },
        h('div', { class: 'cartao-titulo' },
          h('div', {},
            h('h2', { class: 'cartao-rotulo' }, 'Dados da peça'),
            h('p', { class: 'cartao-subtitulo' }, 'Qual peça entra na bancada e o que será feito nela.')
          )
        ),
        h('div', { class: 'grade-form' },
          h('div', {}, campoServico.raiz, infoServico),
          campoTipoPeca.raiz,
          campoDescricao.raiz,
          campoObs.raiz,
          h('div', { class: 'checkboxes-linha' }, checkboxSobMedida, checkboxAjuste)
        )
      ),
      /* 3. Valores e prazos */
      h('section', { class: 'card-surface cartao-padrao' },
        h('div', { class: 'cartao-titulo' },
          h('div', {},
            h('h2', { class: 'cartao-rotulo' }, 'Valores e prazos'),
            h('p', { class: 'cartao-subtitulo' }, 'Valor combinado, acréscimos e datas do pedido.')
          )
        ),
        h('div', { class: 'grade-form' },
          campoValorServico.raiz,
          campoDesconto.raiz,
          h('div', { class: 'resumo-valores-os campo-largo' },
            h('div', {},
              h('p', { class: 'resumo-rotulo' }, 'Valor final da OS'),
              this.resumoValorFinal
            ),
            this.resumoComposicao,
            h('p', { class: 'texto-faint-pequeno' }, 'Cálculo de apoio. O valor oficial da OS é confirmado pela API.')
          ),
          campoEntrada.raiz,
          campoPrevisao.raiz
        )
      ),
      /* 4. Execução */
      h('section', { class: 'card-surface cartao-padrao' },
        h('div', { class: 'cartao-titulo' },
          h('div', {},
            h('h2', { class: 'cartao-rotulo' }, 'Execução'),
            h('p', { class: 'cartao-subtitulo' }, 'Responsável pela bancada, etapa atual e prioridade.')
          )
        ),
        h('div', { class: 'grade-form' },
          campoResponsavel.raiz,
          campoStatus.raiz,
          h('div', { class: 'campo-largo pilha-4' }, checkboxUrgente, this.avisoUrgente),
          campoProva.raiz
        )
      ),
      /* Ações */
      h('section', { class: 'card-surface cartao-acoes-form' },
        h('p', { class: 'nota-dados' },
          requisicao.status === ESTADO_REQUISICAO.SEM_INTEGRACAO
            ? 'Sem integração: esta OS ainda não foi salva no back-end.'
            : 'A OS só é salva depois que a API confirmar a operação.'
        ),
        h('div', { class: 'acoes-envoltoria' },
          botao({ variante: 'secundario', children: ['Cancelar'], onClick: () => history.back() }),
          botaoSalvar
        )
      )
    )

    this.destino.replaceChildren(
      h('div', { class: 'pilha-6 animar-entrada' },
        pageHeader({
          titulo: this.modoEdicao ? 'Editar ordem de serviço' : 'Nova ordem de serviço',
          descricao: this.modoEdicao
            ? `OS ${this.os.codigo} — revise os dados e salve as alterações.`
            : 'Registre a peça, os valores e o prazo combinado com a cliente.',
          trilha,
          acoes: this.modoEdicao ? [badge({ status: STATUS_OS[this.os.status] })] : [],
        }),
        requisicao.status === ESTADO_REQUISICAO.SEM_INTEGRACAO ? avisoSemIntegracao() : null,
        requisicao.status === ESTADO_REQUISICAO.ERRO
          ? blocoEstadoRequisicao({
              status: requisicao.status,
              erro: requisicao.erro,
              onTentar: () => recarregarDados(),
            })
          : null,
        formulario
      )
    )

    this.atualizarResumo()
  }

  /* ------------------------------ Dinâmicos ------------------------------ */

  atualizarResumo() {
    const valorServico = Number(this.form.valorServico) || 0
    const desconto = Number(this.form.desconto) || 0
    const valorFinal = Math.max(valorServico - desconto, 0)
    if (this.resumoValorFinal) this.resumoValorFinal.textContent = formatarMoeda(valorFinal)
    if (this.resumoComposicao) {
      this.resumoComposicao.textContent =
        `Serviço ${formatarMoeda(valorServico)} − desconto ${formatarMoeda(desconto)}`
    }
  }

  atualizarAvisoUrgente() {
    if (!this.avisoUrgente) return
    if (this.form.urgente) this.avisoUrgente.removeAttribute('hidden')
    else this.avisoUrgente.setAttribute('hidden', '')
  }

  abrirModalNovaCliente(nome, onCriada) {
    const dados = { nome: nome || '', telefone: '', email: '', cidade: '' }
    const erros = {}

    const inputNome = criarInput({ placeholder: 'Nome completo', value: dados.nome })
    const inputTelefone = criarInput({ type: 'tel', inputmode: 'tel', placeholder: '(11) 98765-4321', value: dados.telefone })
    const inputEmail = criarInput({ type: 'email', placeholder: 'nome@email.com', value: dados.email })
    const inputCidade = criarInput({ placeholder: 'São Paulo', value: dados.cidade })

    const campoNome = campo({ label: 'Nome', obrigatorio: true, controle: inputNome })
    const campoTelefone = campo({ label: 'Telefone', obrigatorio: true, controle: inputTelefone })
    const campoEmail = campo({ label: 'E-mail', controle: inputEmail })
    const campoCidade = campo({ label: 'Cidade', controle: inputCidade })

    const limparErro = (nomeCampo, campoEl, input) => {
      input.addEventListener('input', () => {
        if (erros[nomeCampo]) {
          erros[nomeCampo] = ''
          campoEl.definirErro('')
        }
      })
    }
    limparErro('nome', campoNome, inputNome)
    limparErro('telefone', campoTelefone, inputTelefone)
    limparErro('email', campoEmail, inputEmail)

    const modal = abrirModal({
      titulo: 'Nova cliente',
      descricao: 'Cadastro rápido — a cliente já fica selecionada nesta OS.',
      icone: 'UserPlus',
      tamanho: 'sm',
      conteudo: h('form', {
        novalidate: '', class: 'pilha-4',
        onSubmit: async (evento) => {
          evento.preventDefault()
          dados.nome = inputNome.value
          dados.telefone = inputTelefone.value
          dados.email = inputEmail.value
          dados.cidade = inputCidade.value
          const validacao = validarCampo({
            nome: vazio(dados.nome, 'Informe o nome da cliente'),
            telefone: validarTelefone(dados.telefone),
            email: validarEmail(dados.email),
          })
          erros.nome = validacao.erros.nome
          erros.telefone = validacao.erros.telefone
          erros.email = validacao.erros.email
          campoNome.definirErro(validacao.erros.nome)
          campoTelefone.definirErro(validacao.erros.telefone)
          campoEmail.definirErro(validacao.erros.email)
          if (!validacao.valido) return
          const resultado = await acoes.clientes.criar(dados)
          if (resultado.ok) {
            toast.sucesso('Cliente cadastrada com sucesso.')
            modal.fechar()
            onCriada?.(resultado.data)
          } else {
            toast.aviso(resultado.erro)
          }
        },
      },
        campoNome.raiz,
        campoTelefone.raiz,
        campoEmail.raiz,
        campoCidade.raiz,
        h('div', { class: 'confirmar-acoes borda-superior' },
          botao({ variante: 'secundario', type: 'button', children: ['Cancelar'], onClick: () => modal.fechar() }),
          botao({ tipo: 'submit', children: ['Cadastrar cliente'] })
        )
      ),
    })
  }

  /* ------------------------------ Envio ------------------------------ */

  async submeter(evento) {
    evento.preventDefault()
    const validacao = validarCampo(this.calcularErros())
    this.erros = validacao.erros
    this.tentouEnviar = !validacao.valido

    for (const [nomeCampo, mensagem] of Object.entries(validacao.erros)) {
      this.campos?.[nomeCampo]?.definirErro(mensagem)
    }

    if (!validacao.valido) {
      toast.erro('Revise os campos destacados.')
      this.rolarParaPrimeiroErro()
      return
    }

    const dados = { ...this.form }
    const botaoSalvar = this.destino.querySelector('button[type="submit"]')
    if (botaoSalvar) {
      botaoSalvar.disabled = true
      botaoSalvar.setAttribute('aria-busy', 'true')
      botaoSalvar.replaceChildren(
        h('span', { class: 'btn-icone-el girar', innerHTML: icone('Loader2', 'ic ic--16') }),
        'Salvando…'
      )
    }

    const resultado = this.modoEdicao
      ? await acoes.ordens.atualizar(this.id, dados)
      : await acoes.ordens.criar(dados)
    if (resultado.ok) {
      toast.sucesso(this.modoEdicao ? 'Ordem de serviço atualizada.' : 'Ordem de serviço criada.')
      navegar('ordens-servico')
    } else {
      toast.aviso(resultado.erro)
      if (botaoSalvar) {
        botaoSalvar.disabled = false
        botaoSalvar.removeAttribute('aria-busy')
        botaoSalvar.replaceChildren('Salvar OS')
      }
    }
  }

  rolarParaPrimeiroErro() {
    requestAnimationFrame(() => {
      const alvo = this.destino.querySelector('[aria-invalid="true"]')
      if (!alvo) return
      alvo.scrollIntoView({ behavior: 'smooth', block: 'center' })
      alvo.focus?.({ preventScroll: true })
    })
  }
}

// Inicialização no fim do arquivo: as classes/constantes do módulo
// precisam estar definidas antes do primeiro uso.
const app = iniciarApp('ordem-servico-form')
if (app) {
  const controlador = new ControladorFormularioOS()
  controlador.iniciar()
}
