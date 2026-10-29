/**
 * Vocabulário central de status: rótulo, classe de badge e ícone (nome do
 * ícone em js/components/icons.js). Toda página usa estas definições —
 * nunca um badge inventado localmente.
 */

/** Hexes das cores auxiliares para SVG e gráficos (var() não funciona em fill). */
export const HEX = {
  teal: '#2DD4BF',
  rosa: '#F472B6',
  ciano: '#38BDF8',
  lilas: '#A78BFA',
  laranja: '#FB923C',
  indigo: '#818CF8',
  primary: '#8B5CF6',
  success: '#4F9D69',
  warning: '#D9A441',
  danger: '#E24C6B',
  info: '#3B82F6',
  faint: '#716C85',
}

export const STATUS_OS = {
  aguardando: {
    id: 'aguardando',
    rotulo: 'Aguardando',
    badge: 'badge--warning',
    cor: HEX.warning,
    icone: 'Clock4',
    ordemFluxo: 1,
  },
  producao: {
    id: 'producao',
    rotulo: 'Em produção',
    badge: 'badge--info',
    cor: HEX.info,
    icone: 'Scissors',
    ordemFluxo: 2,
  },
  prova: {
    id: 'prova',
    rotulo: 'Aguardando prova',
    badge: 'badge--lilas',
    cor: HEX.lilas,
    icone: 'Shirt',
    ordemFluxo: 3,
  },
  pronta: {
    id: 'pronta',
    rotulo: 'Pronta para retirada',
    badge: 'badge--teal',
    cor: HEX.teal,
    icone: 'PackageCheck',
    ordemFluxo: 4,
  },
  entregue: {
    id: 'entregue',
    rotulo: 'Entregue',
    badge: 'badge--success',
    cor: HEX.success,
    icone: 'CircleCheckBig',
    ordemFluxo: 5,
  },
  cancelada: {
    id: 'cancelada',
    rotulo: 'Cancelada',
    badge: 'badge--danger',
    cor: HEX.danger,
    icone: 'CircleX',
    ordemFluxo: 0,
  },
}

export const STATUS_OS_LISTA = Object.values(STATUS_OS)

export const STATUS_OS_FLUXO = [
  STATUS_OS.aguardando,
  STATUS_OS.producao,
  STATUS_OS.prova,
  STATUS_OS.pronta,
  STATUS_OS.entregue,
]

export const STATUS_OS_ABERTOS = ['aguardando', 'producao', 'prova', 'pronta']

export const PROXIMO_STATUS = {
  aguardando: 'producao',
  producao: 'prova',
  prova: 'pronta',
  pronta: 'entregue',
}

export const STATUS_ORCAMENTO = {
  pendente: {
    id: 'pendente',
    rotulo: 'Pendente',
    badge: 'badge--warning',
    icone: 'Hourglass',
  },
  aprovado: {
    id: 'aprovado',
    rotulo: 'Aprovado',
    badge: 'badge--success',
    icone: 'CircleCheck',
  },
  recusado: {
    id: 'recusado',
    rotulo: 'Recusado',
    badge: 'badge--danger',
    icone: 'CircleX',
  },
  expirado: {
    id: 'expirado',
    rotulo: 'Expirado',
    badge: 'badge--neutral',
    icone: 'CircleMinus',
  },
  convertido: {
    id: 'convertido',
    rotulo: 'Convertido em OS',
    badge: 'badge--primary',
    icone: 'Repeat2',
  },
}

export const STATUS_PAGAMENTO = {
  pago: { id: 'pago', rotulo: 'Pago', badge: 'badge--success' },
  parcial: { id: 'parcial', rotulo: 'Parcialmente pago', badge: 'badge--warning' },
  pendente: { id: 'pendente', rotulo: 'Pendente', badge: 'badge--danger' },
}

export const STATUS_FUNCIONARIA = {
  disponivel: { id: 'disponivel', rotulo: 'Disponível', badge: 'badge--success' },
  em_servico: { id: 'em_servico', rotulo: 'Em serviço', badge: 'badge--info' },
  afastada: { id: 'afastada', rotulo: 'Afastada', badge: 'badge--neutral' },
}

export const SITUACAO_CLIENTE = {
  em_dia: { id: 'em_dia', rotulo: 'Em dia', badge: 'badge--success' },
  pendente: { id: 'pendente', rotulo: 'Pagamento pendente', badge: 'badge--warning' },
  inadimplente: { id: 'inadimplente', rotulo: 'Inadimplente', badge: 'badge--danger' },
}

/** Cores fixas por categoria de serviço (nunca aleatórias). */
export const COR_CATEGORIA = {
  Ajustes: HEX.ciano,
  Consertos: HEX.teal,
  'Confecção sob medida': HEX.lilas,
  Reformas: HEX.laranja,
  'Festa e social': HEX.rosa,
}

export function corCategoria(nomeCategoria) {
  return COR_CATEGORIA[nomeCategoria] || HEX.indigo
}

/** Tipos de evento da agenda — cores próprias, consistentes em todo o sistema. */
export const TIPOS_EVENTO = {
  entrega: { id: 'entrega', rotulo: 'Entrega', cor: HEX.teal, badge: 'badge--teal' },
  prova: { id: 'prova', rotulo: 'Prova', cor: HEX.rosa, badge: 'badge--lilas' },
  atraso: { id: 'atraso', rotulo: 'Atrasada', cor: HEX.danger, badge: 'badge--danger' },
  folga: { id: 'folga', rotulo: 'Folga do ateliê', cor: HEX.faint, badge: 'badge--neutral' },
}
