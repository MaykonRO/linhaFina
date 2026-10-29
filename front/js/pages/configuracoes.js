/**
 * Configurações (pages/configuracoes.html) — dados do ateliê, agenda de
 * trabalho e preferências. Cada seção será salva pela API de forma independente.
 */

import { iniciarApp, recarregarDados } from '../app/boot.js'
import { obterDb, acoes, assinarStore, obterEstadoRequisicao, ESTADO_REQUISICAO } from '../app/store.js'
import { blocoEstadoRequisicao, avisoSemIntegracao } from '../components/estados.js'
import { toast } from '../components/toast.js'
import { h } from '../components/dom.js'
import { icone } from '../components/icons.js'
import { pageHeader, badge, botao, campo, criarInput, interruptor } from '../components/ui.js'
import { formatarData, formatarDataLonga, hojeISO } from '../utils/format.js'
import { email as validarEmail } from '../utils/validation.js'


class PaginaConfiguracoes {
  iniciar() {
    this.destino = document.getElementById('pagina')
    this.rascunho = null
    this.botoesSalvar = {} // secao -> botão (estado sujo)
    this.renderizar()
  }

  sujo(secao) {
    const db = obterDb()
    if (!this.rascunho || !db) return false
    if (secao === 'taxaUrgenciaPadrao') {
      return this.rascunho.taxaUrgenciaPadrao !== db.configuracoes.taxaUrgenciaPadrao
    }
    return JSON.stringify(this.rascunho[secao]) !== JSON.stringify(db.configuracoes[secao])
  }

  atualizarBotoes() {
    for (const [secao, botaoEl] of Object.entries(this.botoesSalvar)) {
      const sujoAgora = this.sujo(secao)
      botaoEl.disabled = !sujoAgora
      botaoEl.className = `btn btn--sm ${sujoAgora ? 'btn--primario' : 'btn--secundario'}`
    }
  }

  async salvarSecao(secao, valor) {
    const resultado = await acoes.configuracoes.atualizar({ [secao]: valor })
    if (resultado.ok) {
      toast.sucesso('Configurações salvas.')
      this.rascunho = null
      this.renderizar()
    } else {
      toast.aviso(resultado.erro)
    }
  }

  secao({ icone: nomeIcone, chave, titulo, descricao, sujo, onSalvar, children, classe = '' }) {
    const botaoSalvar = botao({
      variante: sujo ? 'primario' : 'secundario',
      tamanho: 'sm',
      disabled: sujo ? null : '',
      children: ['Salvar'],
      onClick: onSalvar,
    })
    this.botoesSalvar[chave] = botaoSalvar
    return h('section', { class: `card-surface cartao-padrao ${classe}` },
      h('div', { class: 'cartao-titulo' },
        h('div', {},
          h('h2', { class: 'cartao-rotulo' }, titulo),
          h('p', { class: 'cartao-subtitulo' }, descricao)
        ),
        h('div', { class: 'cartao-titulo-acao' },
          nomeIcone && h('span', { class: 'ic-caixa texto-faint', innerHTML: icone(nomeIcone, 'ic ic--16') }),
          botaoSalvar
        )
      ),
      children
    )
  }

  renderizar() {
    const db = obterDb()
    if (!this.rascunho) this.rascunho = JSON.parse(JSON.stringify(db.configuracoes))
    // Ao salvar, o store muda; mantemos o rascunho como estava (sujo volta a false).
    const r = this.rascunho

    /* ---------------- Dados do ateliê ---------------- */

    const campoTexto = (nomeCampo, rotulo, extras = {}) => {
      const input = criarInput({ value: r.atelie[nomeCampo], ...extras })
      input.addEventListener('input', () => {
        r.atelie[nomeCampo] = input.value
        this.atualizarBotoes()
      })
      return campo({ label: rotulo, controle: input }).raiz
    }

    const secaoAtelie = this.secao({
      icone: 'Store',
      chave: 'atelie',
      titulo: 'Dados do ateliê',
      descricao: 'Aparecem na vitrine pública e em orçamentos.',
      sujo: this.sujo('atelie'),
      onSalvar: () => {
        if (validarEmail(r.atelie.email)) {
          toast.erro('Informe um e-mail válido para o ateliê.')
          return
        }
        this.salvarSecao('atelie', r.atelie)
      },
      classe: 'col-span-2-lg',
      children: h('div', { class: 'grade grade-3-campos' },
        campoTexto('nome', 'Nome do ateliê'),
        campoTexto('telefone', 'Telefone', { inputmode: 'tel' }),
        campoTexto('email', 'E-mail', { type: 'email' }),
        campoTexto('cidade', 'Cidade'),
        campoTexto('endereco', 'Endereço'),
        campoTexto('instagram', 'Instagram', { placeholder: '@atelie' })
      ),
    })

    /* ---------------- Horário de funcionamento ---------------- */

    const secaoHorario = this.secao({
      icone: 'Clock',
      chave: 'horario',
      titulo: 'Horário de funcionamento',
      descricao: 'Dias de atendimento ao público. Dias fechados aparecem na agenda.',
      sujo: this.sujo('horario'),
      onSalvar: () => this.salvarSecao('horario', r.horario),
      classe: 'col-span-2-lg',
      children: h('ul', { class: 'lista-dias' },
        r.horario.map((dia) => {
          const naoInformado = dia.ativo === null || dia.ativo === undefined
          const interruptorDia = interruptor({
            rotulo: naoInformado ? 'Não informado' : dia.ativo ? 'Aberto' : 'Fechado',
            marcado: naoInformado ? null : dia.ativo,
            onMudar: (ativo) => {
              dia.ativo = ativo
              if (ativo && !dia.abre) dia.abre = '09:00'
              if (ativo && !dia.fecha) dia.fecha = '18:00'
              interruptorDia.replaceWith(interruptorDia) // no-op; atualização abaixo
              this.renderizar()
            },
          })
          const linha = h('li', { class: 'linha-dia' },
            h('span', { class: 'linha-dia-rotulo' }, dia.rotulo),
            interruptorDia,
            dia.ativo
              ? h('div', { class: 'linha-dia-horarios' },
                  (() => {
                    const abre = criarInput({ type: 'time', classe: 'input-hora', 'aria-label': `Horário de abertura de ${dia.rotulo}`, value: dia.abre })
                    abre.addEventListener('input', () => { dia.abre = abre.value; this.atualizarBotoes() })
                    const fecha = criarInput({ type: 'time', classe: 'input-hora', 'aria-label': `Horário de fechamento de ${dia.rotulo}`, value: dia.fecha })
                    fecha.addEventListener('input', () => { dia.fecha = fecha.value; this.atualizarBotoes() })
                    return [abre, h('span', { class: 'texto-faint-pequeno' }, 'até'), fecha]
                  })()
                )
              : naoInformado
                ? h('span', { class: 'texto-faint-pequeno' }, 'Horário ainda não informado pela API.')
                : h('span', { class: 'texto-faint-pequeno' }, 'Ateliê fechado neste dia')
          )
          return linha
        })
      ),
    })

    /* ---------------- Dias de folga ---------------- */

    let novaFolga = ''
    let erroFolga = ''
    const inputFolga = criarInput({ type: 'date', min: hojeISO(), value: novaFolga })
    const areaErroFolga = h('p', { class: 'campo-erro', hidden: '' })
    const listaFolgas = h('ul', { class: 'lista-folgas' })
    const areaFolgas = h('div', { class: 'pilha-3' },
      h('div', { class: 'adicao-folga' },
        campo({ label: 'Adicionar folga', controle: inputFolga }).raiz,
        botao({
          variante: 'secundario', icone: 'Plus', children: ['Adicionar'], classe: 'botao-folga',
          onClick: () => {
            erroFolga = ''
            if (!inputFolga.value) erroFolga = 'Escolha uma data.'
            else if (inputFolga.value < hojeISO()) erroFolga = 'A folga precisa ser hoje ou em uma data futura.'
            else if (r.folgas.includes(inputFolga.value)) erroFolga = 'Esta data já está na lista de folgas.'
            if (erroFolga) {
              areaErroFolga.textContent = erroFolga
              areaErroFolga.removeAttribute('hidden')
              return
            }
            r.folgas = [...r.folgas, inputFolga.value].sort()
            inputFolga.value = ''
            novaFolga = ''
            this.renderizar()
          },
        }),
        areaErroFolga
      ),
      listaFolgas
    )

    const renderizarFolgas = () => {
      if (r.folgas.length === 0) {
        // <ul> só aceita <li> como filho direto.
        listaFolgas.replaceChildren(
          h('li', { class: 'texto-faint' }, 'Nenhuma folga pontual cadastrada.')
        )
        return
      }
      listaFolgas.replaceChildren(
        ...r.folgas.map((data) =>
          h('li', { class: 'chip-folga' },
            h('span', { class: 'tnum' }, formatarData(data)),
            h('button', {
              type: 'button',
              'aria-label': `Remover folga de ${formatarData(data)}`,
              class: 'chip-folga-remover',
              onClick: () => {
                r.folgas = r.folgas.filter((f) => f !== data)
                this.renderizar()
              },
              innerHTML: icone('X', 'ic ic--16'),
            })
          )
        )
      )
    }
    renderizarFolgas()

    const secaoFolgas = this.secao({
      icone: 'CalendarOff',
      chave: 'folgas',
      titulo: 'Dias de folga',
      descricao: 'Feriados e folgas pontuais marcadas na agenda.',
      sujo: this.sujo('folgas'),
      onSalvar: () => this.salvarSecao('folgas', r.folgas),
      children: areaFolgas,
    })

    /* ---------------- Taxa de urgência ---------------- */

    const inputTaxa = criarInput({ type: 'number', min: '0', max: '100', classe: 'input-estreito', value: r.taxaUrgenciaPadrao ?? '', 'aria-label': 'Percentual padrão de urgência' })
    inputTaxa.addEventListener('input', () => {
      r.taxaUrgenciaPadrao = Number(inputTaxa.value)
      this.atualizarBotoes()
    })
    const secaoTaxa = this.secao({
      icone: 'Percent',
      chave: 'taxaUrgenciaPadrao',
      titulo: 'Taxa de urgência',
      descricao: 'Percentual aplicado ao valor do serviço em pedidos urgentes.',
      sujo: this.sujo('taxaUrgenciaPadrao'),
      onSalvar: () => this.salvarSecao('taxaUrgenciaPadrao', r.taxaUrgenciaPadrao),
      children: campo({
        label: 'Percentual padrão',
        dica: 'Regra oficial pendente de integração com o back-end.',
        controle: h('div', { class: 'campo-com-sufixo' }, inputTaxa, h('span', { class: 'texto-faint' }, '%')),
      }).raiz,
    })

    /* ---------------- Fidelidade ---------------- */

    let fidelidadeRender = () => {}
    const secaoFidelidade = this.secao({
      icone: 'Heart',
      chave: 'fidelidade',
      titulo: 'Programa de fidelidade',
      descricao: 'Regra exibida no atendimento, pendente de validação pelo back-end.',
      sujo: this.sujo('fidelidade'),
      onSalvar: () => this.salvarSecao('fidelidade', r.fidelidade),
      children: (() => {
        const area = h('div', { class: 'pilha-4' })
        fidelidadeRender = () => {
          const inputDesconto = criarInput({ type: 'number', min: '0', max: '100', classe: 'input-estreito', value: r.fidelidade.descontoPercentual ?? '', 'aria-label': 'Desconto do prêmio em porcentagem', disabled: !r.fidelidade.ativo ? '' : null })
          inputDesconto.addEventListener('input', () => {
            r.fidelidade.descontoPercentual = Number(inputDesconto.value)
            this.atualizarBotoes()
          })
          const inputServicos = criarInput({ type: 'number', min: '1', classe: 'input-estreito', value: r.fidelidade.servicosNecessarios ?? '', 'aria-label': 'Quantidade de serviços necessários', disabled: !r.fidelidade.ativo ? '' : null })
          inputServicos.addEventListener('input', () => {
            r.fidelidade.servicosNecessarios = Number(inputServicos.value)
            this.atualizarBotoes()
          })
          const inputRegra = criarInput({ value: r.fidelidade.regra, disabled: !r.fidelidade.ativo ? '' : null })
          inputRegra.addEventListener('input', () => {
            r.fidelidade.regra = inputRegra.value
            this.atualizarBotoes()
          })

          area.replaceChildren(
            interruptor({
              rotulo: 'Programa ativo',
              descricao: 'Sem integração: o desconto de fidelidade não é calculado automaticamente.',
              marcado: r.fidelidade.ativo,
              onMudar: (ativo) => {
                r.fidelidade.ativo = ativo
                fidelidadeRender()
                this.atualizarBotoes()
              },
            }),
            h('div', { class: 'grade grade-2-sm' },
              campo({
                label: 'Desconto do prêmio',
                controle: h('div', { class: 'campo-com-sufixo' }, inputDesconto, h('span', { class: 'texto-faint' }, '%')),
              }).raiz,
              campo({ label: 'Serviços necessários', controle: inputServicos }).raiz
            ),
            campo({ label: 'Texto da regra', controle: inputRegra }).raiz,
            badge({ variante: 'neutral', rotulo: 'Regra pendente de integração' })
          )
        }
        fidelidadeRender()
        return area
      })(),
    })

    /* ---------------- Notificações ---------------- */

    const secaoNotificacoes = this.secao({
      icone: 'Bell',
      chave: 'notificacoes',
      titulo: 'Notificações',
      descricao: 'Preferências de notificação. Sem integração, o sino não envia avisos ao usuário.',
      sujo: this.sujo('notificacoes'),
      onSalvar: () => this.salvarSecao('notificacoes', r.notificacoes),
      children: h('ul', { class: 'pilha-4' },
        [
          { id: 'atrasos', rotulo: 'Ordens atrasadas', descricao: 'Avisar quando uma OS passar da previsão de entrega.' },
          { id: 'provas', rotulo: 'Provas do dia', descricao: 'Avisar sobre provas marcadas para hoje.' },
          { id: 'orcamentosVencendo', rotulo: 'Orçamentos vencendo', descricao: 'Avisar quando a validade estiver próxima.' },
          { id: 'resumoDiario', rotulo: 'Resumo diário', descricao: 'Resumo do início do dia ao abrir o sistema.' },
        ].map((item) =>
          h('li', {},
            interruptor({
              rotulo: item.rotulo,
              descricao: item.descricao,
              marcado: r.notificacoes[item.id],
              onMudar: (valor) => {
                r.notificacoes[item.id] = valor
                this.atualizarBotoes()
              },
            })
          )
        )
      ),
    })

    /* ---------------- Interface ---------------- */

    const secaoInterface = this.secao({
      icone: 'SlidersHorizontal',
      chave: 'interface',
      titulo: 'Preferências da interface',
      descricao: 'Valem para esta sessão do navegador.',
      sujo: this.sujo('interface'),
      onSalvar: () => this.salvarSecao('interface', r.interface),
      children: h('ul', { class: 'pilha-4' },
        [
          { id: 'compactarTabelas', rotulo: 'Tabelas compactas', descricao: 'Reduz o espaçamento entre linhas.' },
          { id: 'mostrarValores', rotulo: 'Mostrar valores', descricao: 'Exibe valores monetários nas listas e tabelas.' },
        ].map((item) =>
          h('li', {},
            interruptor({
              rotulo: item.rotulo,
              descricao: item.descricao,
              marcado: r.interface[item.id],
              onMudar: (valor) => {
                r.interface[item.id] = valor
                this.atualizarBotoes()
              },
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
          titulo: 'Configurações',
          descricao: 'Dados do ateliê, agenda de trabalho e preferências. Cada seção será salva pela API após a integração.',
        }),
        avisoIntegracao,
        blocoEstado,
        !blocoEstado && h('div', { class: 'grade grade-2-lg' },
          secaoAtelie,
          secaoHorario,
          secaoFolgas,
          secaoTaxa,
          secaoFidelidade,
          secaoNotificacoes,
          secaoInterface
        ),
        h('p', { class: 'texto-faint-pequeno' },
          'Última configuração de folgas: ',
          r.folgas.length > 0
            ? r.folgas.map((f) => formatarDataLonga(f)).join(' · ')
            : 'nenhuma folga pontual.'
        )
      )
    )
  }
}

// Inicialização no fim do arquivo: as classes/constantes do módulo
// precisam estar definidas antes do primeiro uso.
const app = iniciarApp('configuracoes')
if (app) {
  const pagina = new PaginaConfiguracoes()
  assinarStore(() => pagina.renderizar())
  pagina.iniciar()
}
