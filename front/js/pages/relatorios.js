/**
 * Relatórios (pages/relatorios.html) — indicadores do ateliê por período.
 *
 * Todos os números vêm do store via estatísticas — nada fixo no código.
 * As exportações CSV/PDF serão feitas pelo back-end; até lá, a página apenas
 * informa que a integração está pendente.
 */

import { iniciarApp, recarregarDados } from '../app/boot.js'
import { obterDb, obterEstadoRequisicao, ESTADO_REQUISICAO, assinarStore } from '../app/store.js'
import { blocoEstadoRequisicao, avisoSemIntegracao } from '../components/estados.js'
import { toast } from '../components/toast.js'
import { h } from '../components/dom.js'
import { icone } from '../components/icons.js'
import { pageHeader, statCard, botao, abas, avatar, estadoVazio } from '../components/ui.js'
import { criarDataTable } from '../components/datatable.js'
import { graficoBarras, graficoDonut, graficoEvolucao } from '../components/charts.js'
import {
  cargaEquipe, cliente, relatorioEntregas, servico, serieMensal,
} from '../services/estatisticas.js'
import {
  adicionarDias, chaveMes, diferencaDias, formatarData, formatarDiaMes,
  formatarMesAno, formatarMoeda, formatarPercentual, hojeISO, ultimosMeses,
} from '../utils/format.js'
import { HEX, STATUS_OS_LISTA } from '../utils/status.js'

const ABAS_PERIODO = [
  { id: 'semestre', rotulo: 'Últimos 6 meses' },
  { id: '30-dias', rotulo: 'Últimos 30 dias' },
  { id: 'mes-atual', rotulo: 'Mês atual' },
]

const AVISO_EXPORTACAO =
  'Sem integração: exportação CSV/PDF indisponível até a conexão com o back-end.'

const SERIE_FATURAMENTO = [{ chave: 'faturamento', nome: 'Faturamento', cor: HEX.primary }]
const SERIE_QUANTIDADE = [{ chave: 'quantidade', nome: 'OS', cor: HEX.rosa }]

/** Contagem inteira para tooltips de gráficos de quantidade (sem moeda). */
const formatarContagem = (valor) => new Intl.NumberFormat('pt-BR').format(valor)


/* ---------------- Derivações do período ---------------- */

/** OS que entraram no período selecionado (todas, inclusive canceladas). */
function ordensDoPeriodo(db, periodo, hoje) {
  if (periodo === 'mes-atual') {
    const mesAtual = chaveMes(hoje)
    return db.ordens.filter((o) => chaveMes(o.dataEntrada) === mesAtual)
  }
  if (periodo === '30-dias') {
    const inicio = adicionarDias(hoje, -29)
    return db.ordens.filter((o) => o.dataEntrada >= inicio)
  }
  const meses = new Set(ultimosMeses(6))
  return db.ordens.filter((o) => meses.has(chaveMes(o.dataEntrada)))
}

/** 5 buckets semanais de 7 dias terminando hoje. */
function serieSemanal(ordens, hoje) {
  const inicioPeriodo = adicionarDias(hoje, -29)
  return Array.from({ length: 5 }, (_, i) => {
    const inicio = adicionarDias(hoje, -34 + i * 7)
    const fim = adicionarDias(hoje, -28 + i * 7)
    return {
      semana: formatarDiaMes(inicio < inicioPeriodo ? inicioPeriodo : inicio),
      faturamento: ordens
        .filter((o) => o.dataEntrada >= inicio && o.dataEntrada <= fim)
        .reduce((total, o) => total + o.valorFinal, 0),
    }
  })
}

/** Um ponto por dia do mês atual, do dia 1 até hoje. */
function serieDiaria(ordens, hoje) {
  const prefixo = hoje.slice(0, 8)
  const diaHoje = Number(hoje.slice(8, 10))
  return Array.from({ length: diaHoje }, (_, i) => {
    const dia = i + 1
    const iso = `${prefixo}${String(dia).padStart(2, '0')}`
    return {
      dia: String(dia),
      faturamento: ordens
        .filter((o) => o.dataEntrada === iso)
        .reduce((total, o) => total + o.valorFinal, 0),
    }
  })
}

/** OS do período agrupadas por serviço. */
function agruparServicos(db, ordens) {
  const porServico = new Map()
  for (const os of ordens) {
    const srv = servico(db, os.servicoId)
    if (!srv) continue
    const item =
      porServico.get(srv.nome) ?? { nome: srv.nome, categoria: srv.categoria, quantidade: 0, valor: 0 }
    item.quantidade += 1
    item.valor += os.valorFinal
    porServico.set(srv.nome, item)
  }
  return [...porServico.values()].sort((a, b) => b.quantidade - a.quantidade)
}

/** Rótulo curto para o eixo do gráfico de serviços. */
function nomeCurtoServico(nome) {
  const encurtado = String(nome || '')
    .replace(' sob medida', '')
    .replace(' e alfaiataria', '')
    .replace(' e customização', '')
    .trim()
  return encurtado.length > 18 ? `${encurtado.slice(0, 17)}…` : encurtado
}

/* ---------------- Colunas das tabelas de apoio ---------------- */

const colunasServicos = [
  { chave: 'nome', cabecalho: 'Serviço', ordenar: (s) => s.nome, render: (s) => h('span', { class: 'texto-medio' }, s.nome) },
  { chave: 'categoria', cabecalho: 'Categoria', ordenar: (s) => s.categoria, render: (s) => h('span', { class: 'texto-suave' }, s.categoria) },
  { chave: 'quantidade', cabecalho: 'Quantidade', alinhamento: 'direita', ordenar: (s) => s.quantidade, render: (s) => h('span', { class: 'texto-medio' }, s.quantidade) },
  { chave: 'valor', cabecalho: 'Valor total', alinhamento: 'direita', ordenar: (s) => s.valor, render: (s) => h('span', { class: 'texto-medio' }, formatarMoeda(s.valor)) },
]

const colunasAtraso = [
  { chave: 'codigo', cabecalho: 'OS', ordenar: (o) => o.codigo, render: (o) => h('span', { class: 'tnum texto-medio' }, o.codigo) },
  { chave: 'cliente', cabecalho: 'Cliente', ordenar: (o) => o.clienteNome, render: (o) => h('span', { class: 'texto-suave' }, o.clienteNome) },
  { chave: 'prevista', cabecalho: 'Prevista', alinhamento: 'direita', ordenar: (o) => o.dataPrevistaEntrega, render: (o) => formatarData(o.dataPrevistaEntrega) },
  { chave: 'entregue', cabecalho: 'Entregue', alinhamento: 'direita', ordenar: (o) => o.dataEntrega, render: (o) => formatarData(o.dataEntrega) },
  { chave: 'atraso', cabecalho: 'Dias de atraso', alinhamento: 'direita', ordenar: (o) => o.diasAtraso, render: (o) => h('span', { class: 'texto-medio text-perigo' }, o.diasAtraso) },
]

const colunasEquipe = [
  {
    chave: 'funcionaria',
    cabecalho: 'Funcionária',
    ordenar: (c) => c.funcionaria.nome,
    render: (c) => h('span', { class: 'celula-responsavel' },
      avatar({ nome: c.funcionaria.nome, tamanho: 'sm' }),
      h('span', { class: 'texto-minimo' },
        h('span', { class: 'bloco texto-truncado texto-medio' }, c.funcionaria.nome),
        h('span', { class: 'bloco texto-truncado texto-faint-pequeno' }, c.funcionaria.cargo || 'Sem cargo definido')
      )
    ),
  },
  { chave: 'ativas', cabecalho: 'OS ativas', alinhamento: 'direita', ordenar: (c) => c.osAtivas, render: (c) => h('span', { class: 'texto-medio' }, c.osAtivas) },
  { chave: 'entregues', cabecalho: 'Entregues no mês', alinhamento: 'direita', ordenar: (c) => c.entreguesNoMes, render: (c) => h('span', { class: 'texto-medio' }, c.entreguesNoMes) },
  { chave: 'producao', cabecalho: 'Valor em produção', alinhamento: 'direita', ordenar: (c) => c.valorEmProducao, render: (c) => h('span', { class: 'texto-medio' }, formatarMoeda(c.valorEmProducao)) },
  {
    chave: 'atrasadas',
    cabecalho: 'Atrasadas',
    alinhamento: 'direita',
    ordenar: (c) => c.atrasadas,
    render: (c) =>
      c.atrasadas > 0
        ? h('span', { class: 'texto-medio text-perigo alinhado-inline' },
            h('span', { class: 'ic-caixa', innerHTML: icone('TriangleAlert', 'ic ic--14') }),
            c.atrasadas
          )
        : h('span', { class: 'texto-faint' }, c.atrasadas),
  },
]

class PaginaRelatorios {
  iniciar() {
    this.periodo = 'semestre'
    this.destino = document.getElementById('pagina')
    this.renderizar()
  }

  renderizar() {
    const db = obterDb()
    const requisicao = obterEstadoRequisicao()
    const semDados = requisicao.status === ESTADO_REQUISICAO.SEM_INTEGRACAO
    const blocoEstado = blocoEstadoRequisicao({
      status: requisicao.status,
      erro: requisicao.erro,
      onTentar: () => recarregarDados(),
    })
    const avisoIntegracao = semDados ? avisoSemIntegracao() : null
    const hoje = hojeISO()
    const exportar = () => toast.aviso(AVISO_EXPORTACAO)

    /* --- OS do período (pela data de entrada; canceladas ficam fora das somas) --- */
    const ordensPeriodo = ordensDoPeriodo(db, this.periodo, hoje)
    const ordensValidas = ordensPeriodo.filter((o) => o.status !== 'cancelada')

    const faturamentoPeriodo = ordensValidas.reduce((total, o) => total + o.valorFinal, 0)
    const quantidadePeriodo = ordensValidas.length
    const ticketMedio = quantidadePeriodo > 0 ? faturamentoPeriodo / quantidadePeriodo : 0

    const serieFaturamento =
      this.periodo === 'mes-atual'
        ? serieDiaria(ordensValidas, hoje)
        : this.periodo === '30-dias'
          ? serieSemanal(ordensValidas, hoje)
          : serieMensal(db, 6)

    const servicosPeriodo = agruparServicos(db, ordensValidas)

    /* --- Status considera todas as OS do período (contagem, não soma) --- */
    const contagemStatus = {}
    for (const os of ordensPeriodo) {
      contagemStatus[os.status] = (contagemStatus[os.status] ?? 0) + 1
    }
    const dadosStatus = STATUS_OS_LISTA.map((status) => ({
      nome: status.rotulo,
      valor: contagemStatus[status.id] ?? 0,
      cor: status.cor,
    })).filter((d) => d.valor > 0)
    const totalStatus = ordensPeriodo.length

    /* --- Entregas: valores globais, independem do período --- */
    const entregas = relatorioEntregas(db)
    const participacaoAtraso = entregas.total > 0 ? entregas.atrasadas / entregas.total : 0
    const entregasComAtraso = db.ordens
      .filter((o) => o.status === 'entregue' && o.dataEntrega && o.dataEntrega > o.dataPrevistaEntrega)
      .map((o) => ({
        ...o,
        clienteNome: cliente(db, o.clienteId)?.nome ?? 'Cliente removido',
        diasAtraso: diferencaDias(o.dataPrevistaEntrega, o.dataEntrega),
      }))
      .sort((a, b) => b.diasAtraso - a.diasAtraso)
    const prazoMedio = entregas.prazoMedioDias === 1 ? '1 dia' : `${entregas.prazoMedioDias} dias`

    /* --- Produtividade: sempre atual --- */
    const carga = cargaEquipe(db)

    const textoGrafico =
      this.periodo === 'mes-atual'
        ? { titulo: 'Faturamento do mês', descricao: `Faturamento por dia em ${formatarMesAno(hoje)}.` }
        : this.periodo === '30-dias'
          ? { titulo: 'Evolução do faturamento', descricao: 'Faturamento por semana nos últimos 30 dias.' }
          : { titulo: 'Evolução do faturamento', descricao: 'Faturamento por mês nos últimos 6 meses.' }

    const miniStat = (rotulo, valor, sub = '', tomSub = '') =>
      h('div', { class: 'mini-stat' },
        h('p', { class: 'texto-faint-pequeno' }, rotulo),
        h('p', { class: 'tnum mini-stat-valor' }, valor),
        sub && h('p', { class: `tnum mini-stat-sub ${tomSub === 'success' ? 'text-sucesso' : tomSub === 'danger' ? 'text-perigo' : 'texto-faint'}` }, sub)
      )

    this.destino.replaceChildren(
      h('div', { class: 'pilha-6 animar-entrada' },
        pageHeader({
          titulo: 'Relatórios',
          descricao: 'Indicadores do ateliê calculados a partir dos registros reais da API.',
          acoes: [
            botao({ variante: 'secundario', icone: 'Download', children: ['Exportar CSV'], onClick: exportar }),
            botao({ variante: 'secundario', icone: 'FileText', children: ['Exportar PDF'], onClick: exportar }),
          ],
        }),

        avisoIntegracao,
        blocoEstado,
        !blocoEstado && h('div', { class: 'pilha-4' },
          abas({
            lista: ABAS_PERIODO,
            ativa: this.periodo,
            onMudar: (id) => {
              this.periodo = id
              this.renderizar()
            },
          }),

          /* Linha 1 — faturamento do período (gráfico 2/3 + indicadores 1/3) */
          h('div', { class: 'grade grade-3-lg' },
            h('section', { class: 'card-surface cartao-padrao col-span-2-lg' },
              h('div', { class: 'cartao-titulo' },
                h('div', {},
                  h('h2', { class: 'cartao-rotulo' }, textoGrafico.titulo),
                  h('p', { class: 'cartao-subtitulo' }, textoGrafico.descricao)
                )
              ),
              this.periodo === 'mes-atual'
                ? graficoBarras({
                    dados: serieFaturamento,
                    campoX: 'dia',
                    series: SERIE_FATURAMENTO,
                    altura: 280,
                    semDados: semDados || db.ordens.length === 0,
                    ariaRotulo: 'Faturamento por dia no mês atual',
                  })
                : graficoEvolucao({
                    dados: serieFaturamento,
                    campoX: this.periodo === '30-dias' ? 'semana' : 'rotulo',
                    series: SERIE_FATURAMENTO,
                    altura: 280,
                    semDados: semDados || db.ordens.length === 0,
                    ariaRotulo: 'Evolução do faturamento no período',
                  }),
              h('div', { class: 'stitch stitch--soft divisor-medio' }),
              semDados
                ? h('p', { class: 'nota-periodo' }, 'O resumo do período só é calculado após a integração com a API.')
                : h('p', { class: 'nota-periodo' },
                    h('span', { class: 'tnum texto-medio' }, quantidadePeriodo),
                    ` ${quantidadePeriodo === 1 ? 'OS não cancelada' : 'OS não canceladas'} no período, somando `,
                    h('span', { class: 'tnum texto-medio' }, formatarMoeda(faturamentoPeriodo)),
                    '.'
                  )
            ),

            h('div', { class: 'grade grade-2-sm-1-lg' },
              statCard({
                icone: 'Wallet',
                rotulo: 'Faturamento total do período',
                valor: semDados ? '—' : formatarMoeda(faturamentoPeriodo),
                detalhe: 'soma das OS não canceladas do período',
                tom: 'primary',
              }),
              statCard({
                icone: 'Receipt',
                rotulo: 'Ticket médio do período',
                valor: semDados ? '—' : formatarMoeda(ticketMedio),
                detalhe: 'média de valor por OS do período',
                tom: 'info',
              })
            )
          ),

          /* Linha 2 — serviços · status · entregas · produtividade */
          h('div', { class: 'grade grade-2-lg' },
            h('section', { class: 'card-surface cartao-padrao' },
              h('div', { class: 'cartao-titulo' },
                h('div', {},
                  h('h2', { class: 'cartao-rotulo' }, 'Serviços mais solicitados'),
                  h('p', { class: 'cartao-subtitulo' }, 'OS não canceladas que entraram no período, agrupadas por serviço.')
                )
              ),
              servicosPeriodo.length === 0
                ? estadoVazio({
                    icone: 'Scissors',
                    titulo: 'Nenhum serviço no período',
                    descricao: 'Nenhuma ordem de serviço entrou no período selecionado.',
                  })
                : h('div', {},
                    graficoBarras({
                      dados: servicosPeriodo.map((s) => ({
                        rotulo: nomeCurtoServico(s.nome),
                        quantidade: s.quantidade,
                      })),
                      series: SERIE_QUANTIDADE,
                      altura: 220,
                      formatador: formatarContagem,
                      ariaRotulo: 'Serviços mais solicitados no período',
                    }),
                    criarDataTable({
                      classe: 'divisor-medio',
                      colunas: colunasServicos,
                      linhas: servicosPeriodo,
                      chaveLinha: (s) => s.nome,
                      compacto: true,
                      porPagina: 5,
                      rotuloSingular: 'serviço',
                      rotuloPlural: 'serviços',
                    }).raiz
                  )
            ),

            h('section', { class: 'card-surface cartao-padrao' },
              h('div', { class: 'cartao-titulo' },
                h('div', {},
                  h('h2', { class: 'cartao-rotulo' }, 'OS por status'),
                  h('p', { class: 'cartao-subtitulo' }, 'Situação das OS que entraram no período selecionado.')
                )
              ),
              totalStatus === 0
                ? estadoVazio({
                    icone: 'ClipboardList',
                    titulo: 'Nenhuma OS no período',
                    descricao: 'Nenhuma ordem de serviço entrou no período selecionado.',
                  })
                : graficoDonut({
                    dados: dadosStatus,
                    centroValor: String(totalStatus),
                    centroRotulo: 'OS',
                    altura: 240,
                    formatador: formatarContagem,
                    ariaRotulo: 'Distribuição das OS por status no período',
                  })
            ),

            h('section', { class: 'card-surface cartao-padrao' },
              h('div', { class: 'cartao-titulo' },
                h('div', {},
                  h('h2', { class: 'cartao-rotulo' }, 'Entregues e atrasados'),
                  h('p', { class: 'cartao-subtitulo' }, 'Histórico completo de entregas — independe do período selecionado.')
                )
              ),
              h('div', { class: 'grade-mini-stats' },
                miniStat('Entregues', entregas.total, 'no histórico'),
                miniStat('No prazo', entregas.noPrazo, formatarPercentual(entregas.indiceNoPrazo), 'success'),
                miniStat('Entregues com atraso', entregas.atrasadas, formatarPercentual(participacaoAtraso), 'danger'),
                miniStat('Prazo médio', prazoMedio, 'da entrada à entrega')
              ),
              criarDataTable({
                classe: 'divisor-medio',
                colunas: colunasAtraso,
                linhas: entregasComAtraso,
                compacto: true,
                porPagina: 6,
                rotuloSingular: 'entrega',
                rotuloPlural: 'entregas',
                vazio: {
                  icone: 'CircleCheckBig',
                  titulo: 'Nenhuma entrega atrasada registrada.',
                  descricao: 'As entregas que ultrapassaram o prazo previsto aparecerão aqui.',
                },
              }).raiz
            ),

            h('section', { class: 'card-surface cartao-padrao' },
              h('div', { class: 'cartao-titulo' },
                h('div', {},
                  h('h2', { class: 'cartao-rotulo' }, 'Produtividade'),
                  h('p', { class: 'cartao-subtitulo' }, 'Carga de trabalho atual — independe do período selecionado.')
                )
              ),
              carga.length === 0
                ? estadoVazio({
                    icone: 'Users',
                    titulo: 'Nenhuma funcionária cadastrada.',
                    descricao: 'A distribuição de trabalho será exibida quando houver registros reais da equipe.',
                  })
                : h('div', {},
                    criarDataTable({
                      colunas: colunasEquipe,
                      linhas: carga,
                      chaveLinha: (c) => c.funcionaria.id,
                      compacto: true,
                      porPagina: 6,
                      rotuloSingular: 'funcionária',
                      rotuloPlural: 'funcionárias',
                    }).raiz,
                    h('p', { class: 'nota-produtividade' },
                      'Sem integração: a produtividade oficial será calculada pelo back-end.'
                    )
                  )
            )
          )
        )
      )
    )
  }
}

// Inicialização no fim do arquivo: as classes/constantes do módulo
// precisam estar definidas antes do primeiro uso.
const app = iniciarApp('relatorios')
if (app) {
  const pagina = new PaginaRelatorios()
  assinarStore(() => pagina.renderizar())
  pagina.iniciar()
}
