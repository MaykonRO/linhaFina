/** Formulário de criação e edição de OS com os campos do contrato do MVP. */
import { iniciarApp, recarregarDados } from '../app/boot.js'
import { obterDb, acoes, assinarStore, obterEstadoRequisicao, ESTADO_REQUISICAO } from '../app/store.js'
import { blocoEstadoRequisicao, avisoSemIntegracao, estadoCarregando } from '../components/estados.js'
import { caminho, navegar } from '../app/rotas.js'
import { toast } from '../components/toast.js'
import { h } from '../components/dom.js'
import { icone } from '../components/icons.js'
import { pageHeader, badge, botao, botaoLink, estadoVazio, campo, criarInput, criarTextarea, criarSelect } from '../components/ui.js'
import { hojeISO, parseMoeda } from '../utils/format.js'
import { STATUS_OS, STATUS_OS_LISTA } from '../utils/status.js'
import { dataAntesDe, positivo, vazio, validarCampo } from '../utils/validation.js'

class FormularioOS {
  iniciar() {
    this.destino = document.getElementById('pagina')
    this.id = new URLSearchParams(location.search).get('id') || ''
    this.edicao = Boolean(this.id)
    this.dadosAplicados = false
    this.campos = {}
    assinarStore(() => {
      if (this.dadosAplicados || obterEstadoRequisicao().status === ESTADO_REQUISICAO.CARREGANDO) return
      this.dadosAplicados = true
      this.renderizar()
    })
    this.renderizar()
  }

  tentarNovamente() {
    this.dadosAplicados = false
    this.renderizar()
    void recarregarDados()
  }

  cabecalho() {
    return pageHeader({
      titulo: this.edicao ? 'Editar ordem de serviço' : 'Nova ordem de serviço',
      descricao: this.edicao && this.os ? `OS ${this.os.codigo}` : 'Informe o serviço, o valor e as datas combinadas.',
      trilha: [{ rotulo: 'Ordens de Serviço', rota: caminho('ordens-servico') }, { rotulo: this.edicao ? 'Editar OS' : 'Nova OS' }],
      acoes: this.os ? [badge({ status: STATUS_OS[this.os.status] })] : null,
    })
  }

  renderizar() {
    if (!this.destino) return
    const requisicao = obterEstadoRequisicao()
    if (!this.dadosAplicados) {
      this.destino.replaceChildren(h('div', { class: 'pilha-6' }, this.cabecalho(), estadoCarregando({ mensagem: 'Carregando dados do formulário…' })))
      return
    }
    if (requisicao.status === ESTADO_REQUISICAO.ERRO || requisicao.status === ESTADO_REQUISICAO.SEM_INTEGRACAO) {
      this.destino.replaceChildren(h('div', { class: 'pilha-6' },
        this.cabecalho(),
        requisicao.status === ESTADO_REQUISICAO.SEM_INTEGRACAO
          ? avisoSemIntegracao()
          : blocoEstadoRequisicao({ status: requisicao.status, erro: requisicao.erro, onTentar: () => this.tentarNovamente() })
      ))
      return
    }

    const db = obterDb()
    if (this.edicao) {
      this.os = db.ordens.find((ordem) => String(ordem.id) === String(this.id))
      if (!this.os) {
        this.destino.replaceChildren(h('div', { class: 'pilha-6' }, this.cabecalho(), estadoVazio({
          icone: 'SearchX', titulo: 'Ordem de serviço não encontrada',
          descricao: 'Ela pode ter sido excluída ou o endereço está incorreto.',
          acao: botaoLink({ para: caminho('ordens-servico'), children: ['Voltar para ordens'] }),
        })))
        return
      }
    }
    if (db.clientes.length === 0) {
      this.destino.replaceChildren(h('div', { class: 'pilha-6' }, this.cabecalho(), estadoVazio({
        icone: 'Users', titulo: 'Cadastre um cliente primeiro',
        descricao: 'Toda ordem de serviço precisa estar vinculada a um cliente.',
        acao: botaoLink({ para: caminho('clientes'), children: ['Ir para clientes'] }),
      })))
      return
    }

    const origem = this.os ?? {}
    this.form = {
      clienteId: origem.clienteId ?? db.clientes[0].id,
      descricaoServico: origem.descricaoServico ?? '',
      valor: origem.valor ?? '',
      dataEntrada: origem.dataEntrada ?? hojeISO(),
      dataPrevistaEntrega: origem.dataPrevistaEntrega ?? '',
      status: origem.status ?? 'pendente',
    }
    this.montarFormulario(db)
  }

  montarFormulario(db) {
    const selectCliente = criarSelect({
      valor: String(this.form.clienteId),
      opcoes: [...db.clientes].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).map((c) => ({ value: String(c.id), rotulo: c.nome })),
    })
    const inputDescricao = criarTextarea({ rows: 4, placeholder: 'Descreva o serviço a ser realizado' })
    inputDescricao.value = this.form.descricaoServico
    const inputValor = criarInput({
      type: 'text', inputmode: 'decimal', placeholder: '0,00', classe: 'tnum',
      value: this.form.valor === '' ? '' : String(this.form.valor).replace('.', ','),
    })
    const inputEntrada = criarInput({ type: 'date', value: this.form.dataEntrada })
    const inputPrevisao = criarInput({ type: 'date', value: this.form.dataPrevistaEntrega, min: this.form.dataEntrada || null })
    const selectStatus = criarSelect({ valor: this.form.status, opcoes: STATUS_OS_LISTA.map((s) => ({ value: s.id, rotulo: s.rotulo })) })

    this.campos = {
      clienteId: campo({ label: 'Cliente', obrigatorio: true, controle: selectCliente, classe: 'campo-largo' }),
      descricaoServico: campo({ label: 'Descrição do serviço', obrigatorio: true, controle: inputDescricao, classe: 'campo-largo' }),
      valor: campo({ label: 'Valor', obrigatorio: true, controle: inputValor, dica: 'Use vírgula ou ponto para os centavos.' }),
      dataEntrada: campo({ label: 'Data de entrada', obrigatorio: true, controle: inputEntrada }),
      dataPrevistaEntrega: campo({ label: 'Data prevista para entrega', obrigatorio: true, controle: inputPrevisao }),
      status: campo({ label: 'Status', obrigatorio: true, controle: selectStatus }),
    }
    inputEntrada.addEventListener('input', () => { inputPrevisao.min = inputEntrada.value || '' })
    const botaoSalvar = botao({ tipo: 'submit', children: ['Salvar OS'] })
    const formulario = h('form', {
      novalidate: '', class: 'card-surface cartao-padrao largura-max-form pilha-4',
      onSubmit: async (evento) => {
        evento.preventDefault()
        const valor = parseMoeda(inputValor.value)
        const validacao = validarCampo({
          clienteId: vazio(selectCliente.value, 'Selecione um cliente'),
          descricaoServico: vazio(inputDescricao.value, 'Descreva o serviço'),
          valor: positivo(valor, 'Informe um valor maior que zero'),
          dataEntrada: vazio(inputEntrada.value, 'Informe a data de entrada'),
          dataPrevistaEntrega: vazio(inputPrevisao.value, 'Informe a previsão de entrega') ||
            dataAntesDe(inputEntrada.value, inputPrevisao.value, 'A entrega não pode ser anterior à entrada'),
          status: vazio(selectStatus.value, 'Selecione o status'),
        })
        for (const [nome, campoEl] of Object.entries(this.campos)) campoEl.definirErro(validacao.erros[nome])
        if (!validacao.valido) {
          toast.erro('Revise os campos destacados.')
          requestAnimationFrame(() => this.destino.querySelector('[aria-invalid="true"]')?.focus())
          return
        }

        const cliente = db.clientes.find((c) => String(c.id) === selectCliente.value)
        const payload = {
          clienteId: cliente?.id ?? selectCliente.value,
          descricaoServico: inputDescricao.value.trim(),
          valor,
          dataEntrada: inputEntrada.value,
          dataPrevistaEntrega: inputPrevisao.value,
          status: selectStatus.value,
        }
        botaoSalvar.disabled = true
        botaoSalvar.setAttribute('aria-busy', 'true')
        botaoSalvar.replaceChildren(h('span', { class: 'btn-icone-el girar', innerHTML: icone('Loader2', 'ic ic--16') }), 'Salvando…')
        const resultado = this.edicao ? await acoes.ordens.atualizar(this.id, payload) : await acoes.ordens.criar(payload)
        if (resultado.ok) {
          toast.sucesso(this.edicao ? 'Ordem de serviço atualizada.' : 'Ordem de serviço criada.')
          navegar('ordens-servico')
          return
        }
        toast.aviso(resultado.erro)
        botaoSalvar.disabled = false
        botaoSalvar.removeAttribute('aria-busy')
        botaoSalvar.replaceChildren('Salvar OS')
      },
    },
      h('div', { class: 'grade-form' },
        this.campos.clienteId.raiz,
        this.campos.descricaoServico.raiz,
        this.campos.valor.raiz,
        this.campos.status.raiz,
        this.campos.dataEntrada.raiz,
        this.campos.dataPrevistaEntrega.raiz
      ),
      h('div', { class: 'confirmar-acoes borda-superior' },
        botao({ variante: 'secundario', children: ['Cancelar'], onClick: () => navegar('ordens-servico') }),
        botaoSalvar
      )
    )
    this.destino.replaceChildren(h('div', { class: 'pilha-6 animar-entrada' }, this.cabecalho(), formulario))
  }
}

iniciarApp('ordem-servico-form')
new FormularioOS().iniciar()
