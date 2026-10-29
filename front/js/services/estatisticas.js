/**
 * Métricas e listas derivadas dos registros reais.
 * Funções puras: recebem o db e devolvem números/listas prontos para exibir.
 * Nenhuma página calcula indicador na mão — tudo sai daqui.
 */

import {
  STATUS_OS,
  STATUS_OS_ABERTOS,
  TIPOS_EVENTO,
  corCategoria,
} from '../utils/status.js'
import {
  chaveMes,
  diferencaDias,
  hojeISO,
  rotuloMes,
  ultimosMeses,
  formatarTelefone,
} from '../utils/format.js'

/* ------------------------------------------------------------------ */
/* Consultas básicas                                                   */
/* ------------------------------------------------------------------ */

export const cliente = (db, id) => db.clientes.find((c) => c.id === id)
export const servico = (db, id) => db.servicos.find((s) => s.id === id)
export const funcionaria = (db, id) => db.funcionarias.find((f) => f.id === id)
export const orcamentoPorOs = (db, osId) =>
  db.orcamentos.find((o) => o.convertidoOsId === osId)

export const osAberta = (os) => STATUS_OS_ABERTOS.includes(os.status)
export const estaAtrasada = (os) =>
  osAberta(os) && os.dataPrevistaEntrega < hojeISO()

/* ------------------------------------------------------------------ */
/* Ordens de serviço                                                   */
/* ------------------------------------------------------------------ */

export function resumoOS(db) {
  const hoje = hojeISO()
  const contagem = { aguardando: 0, producao: 0, prova: 0, pronta: 0, entregue: 0, cancelada: 0 }
  let atrasadas = 0
  let entregasHoje = 0
  let provasHoje = 0
  for (const os of db.ordens) {
    contagem[os.status] = (contagem[os.status] ?? 0) + 1
    if (estaAtrasada(os)) atrasadas += 1
    if (osAberta(os) && os.dataPrevistaEntrega === hoje) entregasHoje += 1
    if (os.dataProva === hoje && (os.status === 'prova' || os.status === 'producao')) provasHoje += 1
  }
  return {
    contagem,
    abertas: contagem.aguardando + contagem.producao + contagem.prova + contagem.pronta,
    atrasadas,
    entregasHoje,
    provasHoje,
    urgentes: db.ordens.filter((o) => osAberta(o) && o.urgente).length,
  }
}

export function osRecentes(db, limite = 6) {
  return [...db.ordens]
    .sort((a, b) => (a.criadoEm < b.criadoEm ? 1 : -1))
    .slice(0, limite)
}

export function proximasEntregas(db, limite = 5) {
  const hoje = hojeISO()
  return db.ordens
    .filter((o) => osAberta(o))
    .sort((a, b) => (a.dataPrevistaEntrega > b.dataPrevistaEntrega ? 1 : -1))
    .slice(0, limite)
    .map((o) => ({ ...o, atrasada: estaAtrasada(o), diasRestantes: diferencaDias(hoje, o.dataPrevistaEntrega) }))
}

/* ------------------------------------------------------------------ */
/* Financeiro                                                          */
/* ------------------------------------------------------------------ */

export function valorEmAberto(os) {
  if (os.status === 'cancelada') return 0
  return Math.max(os.valorFinal - (os.valorPago || 0), 0)
}

export function resumoFinanceiro(db) {
  const hoje = hojeISO()
  const mesAtual = chaveMes(hoje)
  const dataUmMesAtras = new Date()
  dataUmMesAtras.setMonth(dataUmMesAtras.getMonth() - 1)
  const mesAnterior = chaveMes(dataUmMesAtras.toISOString().slice(0, 10))

  let faturamentoMes = 0
  let faturamentoMesAnterior = 0
  let recebidoMes = 0
  let aReceber = 0
  let recebidoTotal = 0

  for (const os of db.ordens) {
    if (os.status === 'cancelada') continue
    const mesEntrada = chaveMes(os.dataEntrada)
    if (mesEntrada === mesAtual) faturamentoMes += os.valorFinal
    if (mesEntrada === mesAnterior) faturamentoMesAnterior += os.valorFinal
    recebidoTotal += os.valorPago || 0
    const dataRefPagamento = os.dataPagamento || os.dataEntrada
    if (os.valorPago > 0 && chaveMes(dataRefPagamento) === mesAtual) recebidoMes += os.valorPago
    aReceber += valorEmAberto(os)
  }

  const crescimento =
    faturamentoMesAnterior > 0
      ? (faturamentoMes - faturamentoMesAnterior) / faturamentoMesAnterior
      : null

  return {
    faturamentoMes,
    faturamentoMesAnterior,
    crescimento,
    recebidoMes,
    recebidoTotal,
    aReceber,
    ticketMedio: calcularTicketMedio(db),
  }
}

export function calcularTicketMedio(db) {
  const validas = db.ordens.filter((o) => o.status !== 'cancelada')
  if (!validas.length) return 0
  return validas.reduce((t, o) => t + o.valorFinal, 0) / validas.length
}

/** Série mensal dos últimos n meses para os gráficos. */
export function serieMensal(db, n = 6) {
  const meses = ultimosMeses(n)
  const base = meses.map((chave) => ({
    chave,
    rotulo: rotuloMes(chave),
    faturamento: 0,
    recebido: 0,
    ordens: 0,
  }))
  const indice = new Map(base.map((m) => [m.chave, m]))
  for (const os of db.ordens) {
    const m = indice.get(chaveMes(os.dataEntrada))
    if (!m || os.status === 'cancelada') continue
    m.faturamento += os.valorFinal
    m.ordens += 1
    m.recebido += os.valorPago || 0
  }
  return base
}

/** Linhas da tabela de pagamentos do financeiro. */
export function listaPagamentos(db) {
  return db.ordens
    .filter((o) => o.status !== 'cancelada')
    .map((o) => ({
      os: o,
      cliente: cliente(db, o.clienteId)?.nome ?? 'Cliente removido',
      servico: servico(db, o.servicoId)?.nome ?? '—',
      codigo: o.codigo,
      valorFinal: o.valorFinal,
      valorPago: o.valorPago || 0,
      saldo: valorEmAberto(o),
      situacao: o.pagamentoStatus,
      vencimento: o.dataPrevistaEntrega,
      atrasada: estaAtrasada(o) || (o.status === 'entregue' && o.pagamentoStatus !== 'pago' && o.dataPrevistaEntrega < hojeISO()),
    }))
    .sort((a, b) => (a.vencimento < b.vencimento ? -1 : 1))
}

/** Situação financeira derivada das ordens reais da cliente. */
export function situacaoCliente(db, clienteId) {
  const doCliente = db.ordens.filter((o) => o.clienteId === clienteId && o.status !== 'cancelada')
  const temInadimplente = doCliente.some((o) => o.status === 'entregue' && o.pagamentoStatus === 'pendente')
  const temPendente = doCliente.some((o) => osAberta(o) && o.pagamentoStatus !== 'pago')
  if (temInadimplente) return 'inadimplente'
  if (temPendente) return 'pendente'
  return 'em_dia'
}

/* ------------------------------------------------------------------ */
/* Clientes                                                            */
/* ------------------------------------------------------------------ */

export function resumoCliente(db, clienteId) {
  const doCliente = db.ordens.filter((o) => o.clienteId === clienteId)
  const validas = doCliente.filter((o) => o.status !== 'cancelada')
  const ultimo = validas
    .map((o) => o.dataEntrada)
    .sort()
    .at(-1)
  return {
    totalServicos: validas.length,
    totalCanceladas: doCliente.length - validas.length,
    ultimoAtendimento: ultimo ?? '',
    valorTotal: validas.reduce((t, o) => t + o.valorFinal, 0),
    valorEmAberto: validas.reduce((t, o) => t + valorEmAberto(o), 0),
    situacao: situacaoCliente(db, clienteId),
  }
}

/** Histórico de peças da cliente (todas as OS, sem canceladas). */
export function pecasDaCliente(db, clienteId) {
  return db.ordens
    .filter((o) => o.clienteId === clienteId && o.status !== 'cancelada')
    .sort((a, b) => (a.dataEntrada < b.dataEntrada ? 1 : -1))
}

/* ------------------------------------------------------------------ */
/* Serviços e categorias                                               */
/* ------------------------------------------------------------------ */

export function distribuicaoCategorias(db, n = 5) {
  const meses = new Set(ultimosMeses(6))
  const porCategoria = new Map()
  for (const os of db.ordens) {
    if (os.status === 'cancelada') continue
    if (!meses.has(chaveMes(os.dataEntrada))) continue
    const cat = servico(db, os.servicoId)?.categoria ?? 'Outros'
    const item = porCategoria.get(cat) ?? { nome: cat, valor: 0, quantidade: 0 }
    item.valor += os.valorFinal
    item.quantidade += 1
    porCategoria.set(cat, item)
  }
  return [...porCategoria.values()]
    .sort((a, b) => b.valor - a.valor)
    .slice(0, n)
    .map((item) => ({ ...item, cor: corCategoria(item.nome) }))
}

export function servicosMaisSolicitados(db, n = 5) {
  const meses = new Set(ultimosMeses(6))
  const porServico = new Map()
  for (const os of db.ordens) {
    if (os.status === 'cancelada') continue
    if (!meses.has(chaveMes(os.dataEntrada))) continue
    const srv = servico(db, os.servicoId)
    if (!srv) continue
    const item = porServico.get(srv.nome) ?? { nome: srv.nome, categoria: srv.categoria, quantidade: 0, valor: 0 }
    item.quantidade += 1
    item.valor += os.valorFinal
    porServico.set(srv.nome, item)
  }
  return [...porServico.values()].sort((a, b) => b.quantidade - a.quantidade).slice(0, n)
}

/* ------------------------------------------------------------------ */
/* Equipe                                                              */
/* ------------------------------------------------------------------ */

export function cargaEquipe(db) {
  return db.funcionarias
    .map((f) => {
      const ativas = db.ordens.filter((o) => o.responsavelId === f.id && osAberta(o))
      const entreguesMes = db.ordens.filter(
        (o) => o.responsavelId === f.id && o.status === 'entregue' && chaveMes(o.dataEntrada) === chaveMes(hojeISO())
      )
      return {
        funcionaria: f,
        osAtivas: ativas.length,
        osAtribuidasTotal: db.ordens.filter((o) => o.responsavelId === f.id && o.status !== 'cancelada').length,
        entreguesNoMes: entreguesMes.length,
        valorEmProducao: ativas.reduce((t, o) => t + o.valorFinal, 0),
        atrasadas: ativas.filter(estaAtrasada).length,
      }
    })
    .sort((a, b) => b.osAtivas - a.osAtivas)
}

/* ------------------------------------------------------------------ */
/* Agenda                                                              */
/* ------------------------------------------------------------------ */

const DIAS_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab']

function toISOLocal(d) {
  const ano = d.getFullYear()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

export function folgasDoPeriodo(db, de, ate) {
  // Só dias explicitamente fechados pela API (`ativo === false`) viram folga.
  // `ativo === null` significa "horário não informado" — não fecha o ateliê.
  const fechados = db.configuracoes.horario.filter((d) => d.ativo === false).map((d) => d.id)
  const dias = []
  let cursor = de
  while (cursor <= ate) {
    const d = new Date(`${cursor}T12:00:00`)
    const idSemana = DIAS_SEMANA[d.getDay()]
    if (fechados.includes(idSemana) || db.configuracoes.folgas.includes(cursor)) {
      dias.push(cursor)
    }
    const prox = new Date(`${cursor}T12:00:00`)
    prox.setDate(prox.getDate() + 1)
    cursor = toISOLocal(prox)
  }
  return dias
}

/** Eventos de um intervalo: entregas, provas, atrasadas (no dia de hoje) e folgas. */
export function eventosEntre(db, de, ate) {
  const eventos = []
  for (const os of db.ordens) {
    if (!osAberta(os)) continue
    const c = cliente(db, os.clienteId)
    if (os.dataPrevistaEntrega >= de && os.dataPrevistaEntrega <= ate) {
      eventos.push({
        id: `entrega-${os.id}`,
        tipo: TIPOS_EVENTO.entrega,
        data: os.dataPrevistaEntrega,
        titulo: `Entrega · ${os.tipoPeca}`,
        os,
        clienteNome: c?.nome ?? '—',
      })
    }
    if (os.dataProva && os.dataProva >= de && os.dataProva <= ate && (os.status === 'prova' || os.status === 'producao')) {
      eventos.push({
        id: `prova-${os.id}`,
        tipo: TIPOS_EVENTO.prova,
        data: os.dataProva,
        titulo: `Prova · ${os.tipoPeca}`,
        os,
        clienteNome: c?.nome ?? '—',
      })
    }
  }
  const hoje = hojeISO()
  if (hoje >= de && hoje <= ate) {
    for (const os of db.ordens.filter((o) => osAberta(o) && estaAtrasada(o))) {
      const c = cliente(db, os.clienteId)
      eventos.push({
        id: `atraso-${os.id}`,
        tipo: TIPOS_EVENTO.atraso,
        data: hoje,
        titulo: `Atrasada · ${os.tipoPeca}`,
        os,
        clienteNome: c?.nome ?? '—',
      })
    }
  }
  for (const data of folgasDoPeriodo(db, de, ate)) {
    eventos.push({
      id: `folga-${data}`,
      tipo: TIPOS_EVENTO.folga,
      data,
      titulo: 'Ateliê fechado',
      os: null,
    })
  }
  return eventos.sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0))
}

/* ------------------------------------------------------------------ */
/* Notificações (sino do cabeçalho)                                    */
/* ------------------------------------------------------------------ */

export function notificacoes(db) {
  const hoje = hojeISO()
  const itens = []
  const resumo = resumoOS(db)

  for (const os of db.ordens.filter(estaAtrasada)) {
    itens.push({
      id: `atraso-${os.id}`,
      tipo: 'atraso',
      titulo: `${os.codigo} está atrasada`,
      descricao: `${os.tipoPeca} de ${cliente(db, os.clienteId)?.nome ?? ''} — prevista para ${os.dataPrevistaEntrega}.`,
      rota: '/ordens-servico',
    })
  }
  if (resumo.entregasHoje > 0) {
    itens.push({
      id: 'entregas-hoje',
      tipo: 'entrega',
      titulo: `${resumo.entregasHoje} entrega${resumo.entregasHoje > 1 ? 's' : ''} para hoje`,
      descricao: 'Confira as peças prontas para retirada.',
      rota: '/agenda',
    })
  }
  if (resumo.provasHoje > 0) {
    itens.push({
      id: 'provas-hoje',
      tipo: 'prova',
      titulo: `${resumo.provasHoje} prova${resumo.provasHoje > 1 ? 's' : ''} marcada${resumo.provasHoje > 1 ? 's' : ''} para hoje`,
      descricao: 'Prepare as peças para as clientes.',
      rota: '/agenda',
    })
  }
  for (const orc of db.orcamentos) {
    const dias = diferencaDias(hoje, orc.validade)
    if (orc.status === 'pendente' && dias >= 0 && dias <= 7) {
      itens.push({
        id: `orc-vence-${orc.id}`,
        tipo: 'orcamento',
        titulo: `Orçamento ${orc.codigo} vence ${dias === 0 ? 'hoje' : `em ${dias} dia${dias > 1 ? 's' : ''}`}`,
        descricao: orc.descricao,
        rota: '/orcamentos',
      })
    }
  }
  for (const orc of db.orcamentos.filter((o) => o.status === 'aprovado')) {
    itens.push({
      id: `orc-aprovado-${orc.id}`,
      tipo: 'orcamento',
      titulo: `Orçamento ${orc.codigo} aprovado`,
      descricao: 'Aguardando conversão em ordem de serviço.',
      rota: '/orcamentos',
    })
  }
  return itens
}

/* ------------------------------------------------------------------ */
/* Relatórios                                                          */
/* ------------------------------------------------------------------ */

export function relatorioEntregas(db) {
  const entregues = db.ordens.filter((o) => o.status === 'entregue' && o.dataEntrega)
  const noPrazo = entregues.filter((o) => o.dataEntrega <= o.dataPrevistaEntrega)
  const emAtrasadas = entregues.filter((o) => o.dataEntrega > o.dataPrevistaEntrega)
  const prazoMedio = entregues.length
    ? entregues.reduce((t, o) => t + diferencaDias(o.dataEntrada, o.dataEntrega), 0) / entregues.length
    : 0
  return {
    total: entregues.length,
    noPrazo: noPrazo.length,
    atrasadas: emAtrasadas.length,
    indiceNoPrazo: entregues.length ? noPrazo.length / entregues.length : 0,
    prazoMedioDias: Math.round(prazoMedio),
    atualmenteAtrasadas: db.ordens.filter(estaAtrasada).length,
  }
}

export function contatoAtelie(db) {
  const { atelie } = db.configuracoes
  return [
    { rotulo: 'Endereço', valor: atelie.endereco },
    { rotulo: 'Telefone', valor: formatarTelefone(atelie.telefone) },
    { rotulo: 'E-mail', valor: atelie.email },
    { rotulo: 'Instagram', valor: atelie.instagram },
  ]
}
