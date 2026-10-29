/**
 * Perfil da cliente (pages/cliente-detalhe.html?id=…).
 *
 * Cabeçalho com identidade e contatos, resumo de serviços, ficha de medidas
 * (edição inline no próprio card) e histórico de ordens de serviço.
 */

import { iniciarApp, recarregarDados } from '../app/boot.js'
import { obterDb, acoes, assinarStore, obterEstadoRequisicao, ESTADO_REQUISICAO } from '../app/store.js'
import { blocoEstadoRequisicao, avisoSemIntegracao } from '../components/estados.js'
import { caminho, navegar } from '../app/rotas.js'
import { toast } from '../components/toast.js'
import { h } from '../components/dom.js'
import { icone } from '../components/icons.js'
import { pageHeader, badge, botao, botaoLink, avatar, statCard, estadoVazio, campo, criarInput, criarTextarea } from '../components/ui.js'
import { criarDataTable } from '../components/datatable.js'
import { abrirModalCliente } from '../components/form-cliente.js'
import { confirmar } from '../components/confirm.js'
import {
  cliente as buscarCliente,
  pecasDaCliente,
  resumoCliente,
  servico as buscarServico,
} from '../services/estatisticas.js'
import { descreverPrazo, formatarData, formatarMesAno, formatarMoeda, formatarTelefone } from '../utils/format.js'
import { SITUACAO_CLIENTE, STATUS_OS } from '../utils/status.js'
import { naoNegativo, validarCampo } from '../utils/validation.js'

const CAMPOS_MEDIDAS = [
  { chave: 'busto', rotulo: 'Busto' },
  { chave: 'cintura', rotulo: 'Cintura' },
  { chave: 'quadril', rotulo: 'Quadril' },
  { chave: 'ombro', rotulo: 'Ombro' },
  { chave: 'manga', rotulo: 'Manga' },
  { chave: 'comprimento', rotulo: 'Comprimento' },
]


class PaginaClienteDetalhe {
  iniciar() {
    this.id = new URLSearchParams(location.search).get('id') || ''
    this.destino = document.getElementById('pagina')
    this.medidasAbertas = false
    this.formAberto = false
    this.renderizar()
  }

  renderizar() {
    const db = obterDb()
    const requisicao = obterEstadoRequisicao()
    const cliente = buscarCliente(db, this.id)

    if (!cliente) {
      if (requisicao.status === ESTADO_REQUISICAO.CARREGANDO) {
        return this.destino.replaceChildren(
          h('div', { class: 'pilha-6' },
            pageHeader({ titulo: 'Perfil da cliente', trilha: [{ rotulo: 'Clientes', rota: caminho('clientes') }] }),
            blocoEstadoRequisicao({ status: requisicao.status })
          )
        )
      }
      if (requisicao.status === ESTADO_REQUISICAO.ERRO) {
        return this.destino.replaceChildren(
          h('div', { class: 'pilha-6' },
            pageHeader({ titulo: 'Perfil da cliente', trilha: [{ rotulo: 'Clientes', rota: caminho('clientes') }] }),
            blocoEstadoRequisicao({
              status: requisicao.status,
              erro: requisicao.erro,
              onTentar: () => recarregarDados(),
            })
          )
        )
      }
      return this.renderizarNaoEncontrada()
    }

    const resumo = resumoCliente(db, cliente.id)
    const ordens = pecasDaCliente(db, cliente.id)
    const pecasDistintas = [...new Set(ordens.map((o) => o.tipoPeca))]

    const colunasOrdens = [
      {
        chave: 'codigo',
        cabecalho: 'Código',
        ordenar: (o) => o.codigo,
        render: (o) => h('a', { href: caminho('ordens-servico', { os: o.id }), class: 'link-codigo' }, o.codigo),
      },
      {
        chave: 'peca',
        cabecalho: 'Peça / serviço',
        render: (o) => h('div', { class: 'texto-minimo' },
          h('p', { class: 'texto-truncado texto-medio' }, o.tipoPeca),
          h('p', { class: 'texto-truncado texto-faint-pequeno' }, buscarServico(db, o.servicoId)?.nome ?? '—')
        ),
      },
      {
        chave: 'entrada',
        cabecalho: 'Entrada',
        ordenar: (o) => o.dataEntrada,
        render: (o) => h('span', { class: 'tnum texto-suave' }, formatarData(o.dataEntrada)),
      },
      {
        chave: 'entrega',
        cabecalho: 'Entrega',
        ordenar: (o) => o.dataEntrega || o.dataPrevistaEntrega,
        render: (o) => h('span', { class: 'tnum texto-suave' },
          o.dataEntrega ? formatarData(o.dataEntrega) : `prev. ${formatarData(o.dataPrevistaEntrega)}`
        ),
      },
      {
        chave: 'valor',
        cabecalho: 'Valor',
        alinhamento: 'direita',
        ordenar: (o) => o.valorFinal,
        render: (o) => h('span', { class: 'tnum texto-medio' }, formatarMoeda(o.valorFinal)),
      },
      { chave: 'status', cabecalho: 'Status', render: (o) => badge({ status: STATUS_OS[o.status] }) },
    ]

    const tabelaOrdens = criarDataTable({
      colunas: colunasOrdens,
      linhas: ordens,
      compacto: true,
      porPagina: 6,
      rotuloSingular: 'ordem',
      rotuloPlural: 'ordens',
      vazio: {
        icone: 'ClipboardList',
        titulo: 'Nenhuma ordem de serviço cadastrada.',
        descricao: 'Esta cliente ainda não tem serviços registrados no ateliê.',
        acao: botaoLink({ para: caminho('ordem-servico-form', { cliente: cliente.id }), children: ['Nova OS'] }),
      },
      renderLinhaMobile: (o) => h('div', { class: 'pilha-2' },
        h('div', { class: 'linha-entre' },
          h('a', { href: caminho('ordens-servico', { os: o.id }), class: 'link-codigo' }, o.codigo),
          badge({ status: STATUS_OS[o.status] })
        ),
        h('p', { class: 'texto-suave' },
          o.tipoPeca,
          h('span', { class: 'texto-faint' }, ` · ${buscarServico(db, o.servicoId)?.nome ?? '—'}`)
        ),
        h('div', { class: 'linha-entre texto-faint-pequeno' },
          h('span', { class: 'tnum' }, `${formatarData(o.dataEntrada)} → ${formatarData(o.dataEntrega || o.dataPrevistaEntrega)}`),
          h('span', { class: 'tnum texto-medio' }, formatarMoeda(o.valorFinal))
        )
      ),
    })

    const avisoIntegracao = requisicao.status === ESTADO_REQUISICAO.SEM_INTEGRACAO ? avisoSemIntegracao() : null

    this.destino.replaceChildren(
      h('div', { class: 'pilha-6 animar-entrada' },
        pageHeader({
          trilha: [{ rotulo: 'Clientes', rota: caminho('clientes') }, { rotulo: cliente.nome }],
          titulo: h('div', { class: 'titulo-cliente' },
            avatar({ nome: cliente.nome, tamanho: 'lg' }),
            cliente.nome,
            badge({ status: SITUACAO_CLIENTE[resumo.situacao] }),
            cliente.criadoEm && badge({ variante: 'neutral', rotulo: `Cliente desde ${formatarMesAno(cliente.criadoEm)}` })
          ),
          descricao: h('div', { class: 'contatos-cliente' },
            h('a', { href: `tel:${cliente.telefone}`, class: 'contato-item' },
              h('span', { class: 'ic-caixa', innerHTML: icone('Phone', 'ic ic--14') }),
              h('span', { class: 'tnum' }, formatarTelefone(cliente.telefone))
            ),
            h('a', { href: `mailto:${cliente.email}`, class: 'contato-item' },
              h('span', { class: 'ic-caixa', innerHTML: icone('Mail', 'ic ic--14') }),
              cliente.email
            ),
            cliente.cidade && h('span', { class: 'contato-item' },
              h('span', { class: 'ic-caixa', innerHTML: icone('MapPin', 'ic ic--14') }),
              cliente.cidade
            )
          ),
          acoes: [
            botao({
              variante: 'secundario', icone: 'Pencil', children: ['Editar cadastro'],
              onClick: () => this.abrirFormulario(cliente),
            }),
            botao({
              variante: 'perigo', icone: 'Trash2', children: ['Excluir'],
              onClick: () => this.confirmarExclusao(cliente),
            }),
          ],
        }),

        avisoIntegracao,

        h('div', { class: 'grade grade-4-stats' },
          statCard({ icone: 'Scissors', rotulo: 'Total de serviços', valor: resumo.totalServicos, tom: 'primary' }),
          statCard({ icone: 'Wallet', rotulo: 'Valor total histórico', valor: formatarMoeda(resumo.valorTotal), tom: 'success' }),
          statCard({
            icone: 'CircleAlert',
            rotulo: 'Em aberto',
            valor: formatarMoeda(resumo.valorEmAberto),
            tom: resumo.valorEmAberto > 0 ? 'warning' : 'success',
            detalhe: resumo.valorEmAberto > 0 ? 'Aguardando pagamento' : 'Nenhum valor pendente',
          }),
          statCard({
            icone: 'CalendarDays',
            rotulo: 'Último atendimento',
            valor: resumo.ultimoAtendimento ? formatarData(resumo.ultimoAtendimento) : '—',
            tom: 'info',
            detalhe: resumo.ultimoAtendimento ? descreverPrazo(resumo.ultimoAtendimento) : 'Sem atendimentos ainda',
          })
        ),

        this.cartaoMedidas(cliente),

        h('section', { class: 'pilha-3' },
          h('h2', { class: 'rotulo-secao' },
            'Histórico de ordens de serviço',
            h('span', { class: 'tnum rotulo-secao-contagem' }, ordens.length)
          ),
          tabelaOrdens.raiz
        ),

        pecasDistintas.length > 0 && h('section', { class: 'card-surface cartao-padrao' },
          h('div', { class: 'cartao-titulo' },
            h('div', {},
              h('h2', { class: 'cartao-rotulo' }, 'Peças já atendidas'),
              h('p', { class: 'cartao-subtitulo' }, 'Tipos de peça que já passaram pelo ateliê com esta cliente')
            )
          ),
          h('div', { class: 'envoltura-badges' },
            pecasDistintas.map((peca) => badge({ variante: 'neutral', rotulo: peca }))
          )
        )
      )
    )
  }

  renderizarNaoEncontrada() {
    this.destino.replaceChildren(
      h('div', { class: 'pilha-6 animar-entrada' },
        pageHeader({ titulo: 'Perfil da cliente', trilha: [{ rotulo: 'Clientes', rota: caminho('clientes') }] }),
        estadoVazio({
          icone: 'Users',
          titulo: 'Cliente não encontrada',
          descricao: 'O cadastro pode ter sido removido ou o endereço está incorreto.',
          acao: botao({ variante: 'secundario', children: ['Voltar para clientes'], onClick: () => navegar('clientes') }),
        })
      )
    )
  }

  /* ------------------------------ Ficha de medidas ------------------------------ */

  cartaoMedidas(cliente) {
    if (this.medidasAbertas) return this.formularioMedidas(cliente)

    if (cliente.medidas) {
      return h('section', { class: 'card-surface cartao-padrao' },
        h('div', { class: 'cartao-titulo' },
          h('div', {},
            h('h2', { class: 'cartao-rotulo' }, 'Ficha de medidas'),
            h('p', { class: 'cartao-subtitulo' }, 'Unidade em centímetros')
          ),
          botao({
            variante: 'fantasma', tamanho: 'sm', icone: 'Pencil', children: ['Editar'],
            onClick: () => {
              this.medidasAbertas = true
              this.renderizar()
            },
          })
        ),
        h('div', { class: 'pilha-4' },
          h('div', { class: 'grade-medidas' },
            CAMPOS_MEDIDAS.map(({ chave, rotulo }) => {
              const valor = cliente.medidas?.[chave]
              return h('p', { class: 'linha-medida' },
                h('span', { class: 'texto-faint' }, `${rotulo} — `),
                h('span', { class: 'tnum texto-medio' }, valor == null ? '—' : `${valor} cm`)
              )
            })
          ),
          cliente.medidas.observacoes && h('p', { class: 'medidas-observacao' }, cliente.medidas.observacoes)
        )
      )
    }

    return h('section', { class: 'card-surface cartao-padrao' },
      h('div', { class: 'cartao-titulo' },
        h('div', {},
          h('h2', { class: 'cartao-rotulo' }, 'Ficha de medidas'),
          h('p', { class: 'cartao-subtitulo' }, 'Unidade em centímetros')
        )
      ),
      estadoVazio({
        icone: 'Ruler',
        titulo: 'Ficha de medidas ainda não registrada',
        descricao: 'Registre as medidas da cliente para agilizar provas e novas confecções.',
        acao: botao({
          children: ['Registrar medidas'],
          onClick: () => {
            this.medidasAbertas = true
            this.renderizar()
          },
        }),
      })
    )
  }

  formularioMedidas(cliente) {
    const form = {}
    const campos = {}

    const observacoes = criarTextarea({
      placeholder: 'Preferências de caimento, modelagem, ajustes…', rows: 2,
      value: cliente.medidas?.observacoes ?? '',
    })

    const nosCampos = CAMPOS_MEDIDAS.map(({ chave, rotulo }) => {
      const input = criarInput({
        type: 'number', min: '0', step: 'any', inputmode: 'decimal', placeholder: '0',
        value: cliente.medidas?.[chave] == null ? '' : String(cliente.medidas[chave]),
      })
      const campoEl = campo({ label: `${rotulo} (cm)`, controle: input })
      form[chave] = input
      campos[chave] = campoEl
      return campoEl.raiz
    })

    return h('section', { class: 'card-surface cartao-padrao' },
      h('div', { class: 'cartao-titulo' },
        h('div', {},
          h('h2', { class: 'cartao-rotulo' }, 'Ficha de medidas'),
          h('p', { class: 'cartao-subtitulo' }, 'Unidade em centímetros')
        ),
        botao({
          variante: 'fantasma', tamanho: 'sm', children: ['Cancelar'],
          onClick: () => {
            this.medidasAbertas = false
            this.renderizar()
          },
        })
      ),
      h('form', {
        novalidate: '', class: 'pilha-4',
        onSubmit: async (evento) => {
          evento.preventDefault()
          const mensagens = {}
          for (const { chave } of CAMPOS_MEDIDAS) {
            const texto = String(form[chave].value ?? '').trim()
            mensagens[chave] = texto ? naoNegativo(Number(texto)) : ''
          }
          const validacao = validarCampo(mensagens)
          for (const { chave } of CAMPOS_MEDIDAS) campos[chave].definirErro(validacao.erros[chave] ?? '')
          if (!validacao.valido) return

          const medidas = { observacoes: observacoes.value.trim() }
          for (const { chave } of CAMPOS_MEDIDAS) {
            const texto = String(form[chave].value ?? '').trim()
            medidas[chave] = texto ? Number(texto) : null // null = campo ausente
          }

          const resultado = await acoes.clientes.atualizar(cliente.id, { medidas })
          if (resultado.ok) {
            toast.sucesso('Medidas salvas.')
            this.medidasAbertas = false
            this.renderizar()
          } else {
            toast.aviso(resultado.erro)
          }
        },
      },
        h('p', { class: 'texto-faint-pequeno' }, 'Preencha apenas o que foi medido — campos vazios ficam sem registro.'),
        h('div', { class: 'grade-medidas-input' }, nosCampos),
        campo({ label: 'Observações das medidas', controle: observacoes }).raiz,
        h('div', { class: 'confirmar-acoes borda-superior' },
          botao({
            variante: 'secundario', type: 'button', children: ['Cancelar'],
            onClick: () => {
              this.medidasAbertas = false
              this.renderizar()
            },
          }),
          botao({ tipo: 'submit', children: ['Salvar medidas'] })
        )
      )
    )
  }

  /* ------------------------------ Ações ------------------------------ */

  abrirFormulario(cliente) {
    abrirModalCliente({ cliente, onFechar: () => this.renderizar() })
  }

  confirmarExclusao(cliente) {
    confirmar({
      titulo: 'Excluir cliente?',
      descricao: `Você está excluindo ${cliente.nome}. Esta ação não pode ser desfeita — e clientes com ordens de serviço ou orçamentos no histórico não podem ser removidas.`,
      rotuloConfirmar: 'Excluir',
      onConfirmar: async () => {
        const resultado = await acoes.clientes.remover(cliente.id)
        if (resultado.ok) {
          toast.sucesso('Cliente removida com sucesso.')
          navegar('clientes')
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
const app = iniciarApp('cliente-detalhe')
if (app) {
  const pagina = new PaginaClienteDetalhe()
  assinarStore(() => pagina.renderizar())
  pagina.iniciar()
}
