/** Cores e vocabulário de status compartilhados pelos componentes do MVP. */
export const HEX = Object.freeze({
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
})

export const STATUS_OS = Object.freeze({
  pendente: {
    id: 'pendente', rotulo: 'Pendente', badge: 'badge--warning',
    cor: HEX.warning, icone: 'Clock4', ordemFluxo: 1,
  },
  em_andamento: {
    id: 'em_andamento', rotulo: 'Em andamento', badge: 'badge--info',
    cor: HEX.info, icone: 'Scissors', ordemFluxo: 2,
  },
  concluida: {
    id: 'concluida', rotulo: 'Concluída', badge: 'badge--success',
    cor: HEX.success, icone: 'CircleCheckBig', ordemFluxo: 3,
  },
  cancelada: {
    id: 'cancelada', rotulo: 'Cancelada', badge: 'badge--danger',
    cor: HEX.danger, icone: 'CircleX', ordemFluxo: 0,
  },
})

export const STATUS_OS_LISTA = Object.freeze(Object.values(STATUS_OS))
