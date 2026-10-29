/**
 * Visão geral do ateliê — painel principal (index.html).
 *
 * Todos os números vêm do store via estatísticas — nada fixo no código.
 */

import { iniciarApp, recarregarDados } from '../app/boot.js'
import { obterDb, assinarStore, obterEstadoRequisicao, ESTADO_REQUISICAO } from '../app/store.js'
import { sessaoAtual } from '../app/sessao.js'
import { caminho } from '../app/rotas.js'
import { h } from '../components/dom.js'
import { icone } from '../components/icons.js'
import { pageHeader, statCard, badge, botaoLink, blocoVazio, estadoVazio } from '../components/ui.js'
import { graficoDonut, graficoEvolucao } from '../components/charts.js'
import { blocoEstadoRequisicao, avisoSemIntegracao, avisoSemDados } from '../components/estados.js'
import {
  cliente,
  distribuicaoCategorias,
  osRecentes,
  proximasEntregas,
  resumoFinanceiro,
  resumoOS,
  serieMensal,
} from '../services/estatisticas.js'
import { formatarMoeda, formatarDiaMes, descreverPrazo } from '../utils/format.js'
import { HEX, STATUS_OS } from '../utils/status.js'

function renderizar() {
  const db = obterDb()
  const requisicao = obterEstadoRequisicao()
  const sessao = sessaoAtual()
  const destino = document.getElementById('pagina')
  if (!destino) return

  const resumo = resumoOS(db)
  const financas = resumoFinanceiro(db)
  const serie = serieMensal(db)
  const categorias = distribuicaoCategorias(db)
  const recentes = osRecentes(db, 5)
  const entregas = proximasEntregas(db, 5).map((os) => ({
    ...os,
    clienteNome: cliente(db, os.clienteId)?.nome ?? 'Cliente removido',
  }))

  const temAtrasadas = resumo.atrasadas > 0
  const osNoPeriodo = categorias.reduce((total, c) => total + c.quantidade, 0)
  const faturadoCategorias = categorias.reduce((total, c) => total + c.valor, 0)
  const semDados = requisicao.status === ESTADO_REQUISICAO.SEM_INTEGRACAO
  const semValores =
    semDados ||
    requisicao.status === ESTADO_REQUISICAO.CARREGANDO ||
    requisicao.status === ESTADO_REQUISICAO.ERRO
  const semRegistros = db.ordens.length === 0 && db.clientes.length === 0 && db.servicos.length === 0
  const avisoSemRegistros = requisicao.status === ESTADO_REQUISICAO.VAZIO ? avisoSemDados() : null

  const primeiroNome = sessao?.nome?.trim().split(/\s+/)[0] ?? ''
  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  destino.replaceChildren(
    h('div', { class: 'pilha-6' },
      h('div', {},
        primeiroNome && h('p', { class: 'saudacao' }, `${saudacao}, ${primeiroNome}`),
        pageHeader({ titulo: 'Visão geral', descricao: 'O dia do ateliê de relance.' })
      ),

      blocoEstadoRequisicao({
        status: requisicao.status,
        erro: requisicao.erro,
        onTentar: () => recarregarDados(),
      }),

      semDados && avisoSemIntegracao({
        mensagem: 'O painel está pronto, mas a API do back-end ainda não foi configurada. Nenhum indicador fictício é exibido.',
      }),

      avisoSemRegistros,

      /* Linha 1 — estado do ateliê · ações rápidas + alerta de atraso */
      h('div', { class: 'grade grade-3-lg' },
        cartaoEstadoAtelie(resumo, semValores),
        h('div', { class: 'coluna-flex' },
          h('section', { class: 'card-surface cartao-padrao' },
            h('div', { class: 'cartao-titulo' },
              h('h2', { class: 'cartao-rotulo' }, 'Ações rápidas')
            ),
            h('div', { class: 'acoes-rapidas' },
              botaoLink({ para: caminho('ordem-servico-form'), classe: 'largura-total', children: [h('span', { class: 'ic-caixa', innerHTML: icone('Plus', 'ic ic--16') }), 'Nova OS'] }),
              botaoLink({ para: caminho('clientes'), variante: 'secundario', classe: 'largura-total', children: [h('span', { class: 'ic-caixa', innerHTML: icone('UserPlus', 'ic ic--16') }), 'Cadastrar cliente'] }),
              botaoLink({ para: caminho('orcamentos'), variante: 'secundario', classe: 'largura-total', children: [h('span', { class: 'ic-caixa', innerHTML: icone('FileText', 'ic ic--16') }), 'Gerar orçamento'] })
            )
          ),
          temAtrasadas && h('section', { class: 'card-surface cartao-alerta' },
            h('span', { class: 'cartao-alerta-icone', innerHTML: icone('TriangleAlert', 'ic ic--18') }),
            h('div', { class: 'cartao-alerta-textos' },
              h('p', { class: 'cartao-alerta-titulo tnum' }, resumo.atrasadas === 1 ? '1 OS atrasada' : `${resumo.atrasadas} OS atrasadas`),
              h('p', { class: 'cartao-alerta-descricao' }, 'Peças que passaram do prazo de entrega.')
            ),
            botaoLink({
              para: caminho('ordens-servico', { status: 'atrasadas' }),
              variante: 'secundario',
              tamanho: 'sm',
              classe: 'encolher-0',
              children: ['Ver ordens'],
            })
          )
        )
      ),

      /* Linha 2 — faixa financeira */
      h('div', { class: 'grade grade-3-lg' },
        h('div', { class: 'grade grade-3-sm-1-lg' },
          statCard({
            icone: 'Wallet',
            rotulo: 'Faturamento do mês',
            valor: semValores ? '—' : formatarMoeda(financas.faturamentoMes),
            comparacao: semValores ? null : financas.crescimento,
            detalhe: 'sem faturamento no mês anterior',
            tom: 'primary',
          }),
          statCard({
            icone: 'HandCoins',
            rotulo: 'Recebido no mês',
            valor: semValores ? '—' : formatarMoeda(financas.recebidoMes),
            detalhe: 'entradas confirmadas em caixa',
            tom: 'success',
          }),
          statCard({
            icone: 'Hourglass',
            rotulo: 'A receber',
            valor: semValores ? '—' : formatarMoeda(financas.aReceber),
            detalhe: 'saldo em aberto de todas as OS',
            tom: 'warning',
          })
        ),
        h('section', { class: 'card-surface cartao-padrao col-span-2-lg' },
          h('div', { class: 'cartao-titulo' },
            h('div', {},
              h('h2', { class: 'cartao-rotulo' }, 'Evolução financeira'),
              h('p', { class: 'cartao-subtitulo' }, 'Faturamento e valores recebidos nos últimos 6 meses.')
            )
          ),
          graficoEvolucao({
            dados: serie,
            series: [
              { chave: 'faturamento', nome: 'Faturamento', cor: HEX.primary },
              { chave: 'recebido', nome: 'Recebido', cor: HEX.teal },
            ],
            altura: 320,
            semDados: semValores || semRegistros,
            ariaRotulo: 'Evolução financeira',
          })
        )
      ),

      /* Linha 3 — distribuição · OS recentes · próximas entregas */
      h('div', { class: 'grade grade-3-lg' },
        h('section', { class: 'card-surface cartao-padrao' },
          h('div', { class: 'cartao-titulo' },
            h('div', {},
              h('h2', { class: 'cartao-rotulo' }, 'Distribuição dos serviços'),
              h('p', { class: 'cartao-subtitulo' }, 'Faturamento por categoria nos últimos 6 meses.')
            )
          ),
          categorias.length === 0
            ? estadoVazio({
                icone: 'ChartPie',
                titulo: 'Sem distribuição para exibir',
                descricao: 'Os indicadores serão exibidos quando houver dados disponíveis.',
              })
            : h('div', {},
                graficoDonut({
                  dados: categorias,
                  altura: 260,
                  semDados: semValores || semRegistros,
                  centroValor: String(osNoPeriodo),
                  centroRotulo: 'OS no período',
                  ariaRotulo: 'Distribuição dos serviços por categoria',
                }),
                h('div', { class: 'stitch stitch--soft divisor-medio' }),
                h('p', { class: 'distribuicao-total' },
                  h('span', { class: 'tnum distribuicao-total-valor' }, formatarMoeda(faturadoCategorias)),
                  ' faturados nos últimos 6 meses'
                )
              )
        ),

        h('section', { class: 'card-surface cartao-padrao' },
          h('div', { class: 'cartao-titulo' },
            h('div', {},
              h('h2', { class: 'cartao-rotulo' }, 'OS recentes'),
              h('p', { class: 'cartao-subtitulo' }, 'As últimas ordens que entraram na bancada.')
            )
          ),
          recentes.length === 0
            ? estadoVazio({
          icone: 'ClipboardList',
          titulo: 'Nenhuma ordem de serviço cadastrada.',
          descricao: 'Os indicadores serão exibidos quando houver dados disponíveis.',
        })
            : h('ul', { class: 'lista-recentes' },
                recentes.map((os) =>
                  h('li', {},
                    h('a', {
                      href: caminho('ordens-servico', { os: os.id }),
                      class: 'item-recente',
                    },
                      h('div', { class: 'item-recente-textos' },
                        h('p', { class: 'item-recente-codigo tnum' }, os.codigo),
                        h('p', { class: 'item-recente-detalhe' },
                          `${os.tipoPeca} · ${cliente(db, os.clienteId)?.nome ?? 'Cliente removido'}`
                        )
                      ),
                      h('div', { class: 'item-recente-valores' },
                        h('span', { class: 'item-recente-valor tnum' }, formatarMoeda(os.valorFinal)),
                        badge({ status: STATUS_OS[os.status] })
                      )
                    )
                  )
                )
              )
        ),

        cartaoEntregasProximas(entregas)
      )
    )
  )
}

/* ------------------------------------------------------------------ */
/* Estado do ateliê                                                    */
/* ------------------------------------------------------------------ */

const PIPELINE = [
  { chave: 'aguardando', tinta: 'etapa-tinta--warning' },
  { chave: 'producao', tinta: 'etapa-tinta--info' },
  { chave: 'prova', tinta: 'etapa-tinta--lilas' },
  { chave: 'pronta', tinta: 'etapa-tinta--teal' },
]

function cartaoEstadoAtelie(resumo, semDados = false) {
  const temAtrasadas = resumo.atrasadas > 0
  return h(
    'section',
    { class: 'card-surface cartao-padrao col-span-2-lg cartao-estado' },
    h(
      'div',
      { class: 'cartao-titulo cartao-titulo--destacado' },
      h(
        'div',
        {},
        h('h2', { class: 'cartao-rotulo' }, 'Estado do ateliê'),
        h('p', { class: 'cartao-subtitulo' }, 'Da entrada das peças à retirada.')
      ),
      h(
        'div',
        { class: 'estado-total' },
        h('p', { class: 'estado-total-valor tnum' }, semDados ? '—' : resumo.abertas),
        h('p', { class: 'estado-total-rotulo' }, 'OS abertas')
      )
    ),
    h(
      'div',
      { class: 'pipeline' },
      PIPELINE.map((etapa) => {
        const status = STATUS_OS[etapa.chave]
        return h(
          'div',
          { class: `pipeline-etapa etapa-${etapa.chave}` },
          h('span', { class: `etapa-icone ${etapa.tinta}`, innerHTML: icone(status.icone, 'ic ic--16') }),
          h('p', { class: 'etapa-valor tnum' }, semDados ? '—' : resumo.contagem[etapa.chave]),
          h('p', { class: 'etapa-rotulo' }, status.rotulo)
        )
      })
    ),
    h('div', { class: 'stitch stitch--soft divisor-medio' }),
    h(
      'div',
      { class: 'resumo-dia' },
      h(
        'div',
        { class: 'resumo-caixa' },
        h('span', { class: 'resumo-caixa-icone resumo-caixa-icone--teal', innerHTML: icone('CalendarClock', 'ic ic--18') }),
        h(
          'div',
          { class: 'resumo-caixa-textos' },
          h('p', { class: 'resumo-caixa-valor tnum' }, semDados ? '—' : resumo.entregasHoje),
          h('p', { class: 'resumo-caixa-rotulo' }, 'Entregas de hoje')
        )
      ),
      h(
        'div',
        { class: `resumo-caixa ${temAtrasadas ? 'resumo-caixa--alerta' : ''}` },
        h(
          'span',
          { class: `resumo-caixa-icone ${temAtrasadas ? 'resumo-caixa-icone--danger' : 'resumo-caixa-icone--success'}` },
          h('span', { class: 'ic-caixa', innerHTML: icone(temAtrasadas ? 'TriangleAlert' : 'CircleCheckBig', 'ic ic--18') })
        ),
        h(
          'div',
          { class: 'resumo-caixa-textos' },
          h('p', { class: `resumo-caixa-valor tnum ${temAtrasadas ? 'text-perigo' : ''}` }, semDados ? '—' : resumo.atrasadas),
          h('p', { class: 'resumo-caixa-rotulo' }, temAtrasadas ? 'Atrasadas' : 'Nenhuma atrasada')
        )
      )
    )
  )
}

/* ------------------------------------------------------------------ */
/* Próximas entregas                                                   */
/* ------------------------------------------------------------------ */

function cartaoEntregasProximas(itens) {
  const ultima = itens.length - 1
  return h(
    'section',
    { class: 'card-surface cartao-padrao' },
    h(
      'div',
      { class: 'cartao-titulo' },
      h(
        'div',
        {},
        h('h2', { class: 'cartao-rotulo' }, 'Próximas entregas'),
        h('p', { class: 'cartao-subtitulo' }, 'Os prazos em aberto mais próximos.')
      )
    ),
    itens.length === 0
      ? estadoVazio({
          icone: 'CalendarDays',
          titulo: 'Nenhuma entrega prevista',
          descricao: 'A agenda exibirá os próximos prazos quando houver ordens de serviço reais.',
        })
      : h(
          'ol',
          { class: 'entregas-timeline' },
          itens.map((os, i) =>
            h(
              'li',
              { class: 'entrega-item' },
              h(
                'div',
                { class: 'entrega-marcador', 'aria-hidden': 'true' },
                h('span', { class: `entrega-ponto ${os.atrasada ? 'entrega-ponto--atrasada' : ''}` }),
                i < ultima && h('span', { class: 'stitch stitch--v entrega-linha' })
              ),
              h(
                'div',
                { class: `entrega-textos ${i < ultima ? 'entrega-textos--conectada' : ''}` },
                h(
                  'p',
                  { class: 'entrega-datas' },
                  h('span', { class: 'entrega-data tnum' }, formatarDiaMes(os.dataPrevistaEntrega)),
                  h('span', { class: `entrega-prazo ${os.atrasada ? 'entrega-prazo--atrasada' : ''}` }, descreverPrazo(os.dataPrevistaEntrega)),
                  os.atrasada && badge({ variante: 'danger', rotulo: 'Atrasada' })
                ),
                h('p', { class: 'entrega-peca' }, os.tipoPeca),
                h('p', { class: 'entrega-cliente' }, os.clienteNome)
              )
            )
          )
        )
  )
}

// A inicialização fica no fim do arquivo: renderizar() depende das constantes
// de módulo (PIPELINE), que precisam estar inicializadas antes da chamada.
const app = iniciarApp('dashboard')
if (app) {
  assinarStore(() => renderizar())
  renderizar()
}
