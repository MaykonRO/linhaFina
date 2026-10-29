/**
 * Formatação em português brasileiro: moeda, datas, telefone, percentuais.
 * Toda exibição de valores e datas do sistema passa por aqui.
 */

/**
 * Converte qualquer valor vindo da API em texto seguro.
 * Um registro incompleto (campo ausente) não pode derrubar a página inteira.
 */
export function textoSeguro(valor) {
  if (typeof valor === 'string') return valor
  if (valor === null || valor === undefined) return ''
  if (typeof valor === 'number' || typeof valor === 'boolean') return String(valor)
  return ''
}

/** Compara dois textos da API sem quebrar quando um deles está ausente. */
export function compararTexto(a, b) {
  return textoSeguro(a).localeCompare(textoSeguro(b), 'pt-BR', { sensitivity: 'base' })
}

/** Verifica se um texto da API contém o termo buscado (sem diferenciar caixa). */
export function contemTexto(valor, termo) {
  return textoSeguro(valor).toLowerCase().includes(termo)
}

const moeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const moedaCompacta = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
})

export function formatarMoeda(valor) {
  return moeda.format(Number.isFinite(valor) ? valor : 0)
}

export function formatarMoedaCompacta(valor) {
  return moedaCompacta.format(Number.isFinite(valor) ? valor : 0)
}

/** Converte texto digitado ("1.234,56", "1234.56") para número. */
export function parseMoeda(texto) {
  if (typeof texto === 'number') return texto
  if (!texto) return 0
  const limpo = String(texto)
    .replace(/[^\d,.-]/g, '')
    .trim()
  if (!limpo) return 0
  const normalizado =
    limpo.includes(',') && limpo.includes('.')
      ? limpo.replace(/\./g, '').replace(',', '.')
      : limpo.replace(',', '.')
  const valor = Number.parseFloat(normalizado)
  return Number.isFinite(valor) ? valor : 0
}

/** "2026-03-14" -> "14/03/2026" */
export function formatarData(iso) {
  if (!iso) return '—'
  const d = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/** "2026-03-14" -> "14 de março de 2026" */
export function formatarDataLonga(iso) {
  if (!iso) return '—'
  const d = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function formatarDiaSemana(iso) {
  if (!iso) return ''
  const d = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('pt-BR', { weekday: 'long' })
}

/** "14/03" abreviado para cards e eixos de gráfico. */
export function formatarDiaMes(iso) {
  if (!iso) return ''
  const d = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export function formatarMesAno(iso) {
  const d = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

/** Data ISO de hoje no fuso local (sem conversão UTC). */
export function hojeISO() {
  const d = new Date()
  return toISO(d)
}

export function toISO(d) {
  const ano = d.getFullYear()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

export function adicionarDias(iso, dias) {
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() + dias)
  return toISO(d)
}

export function diferencaDias(de, ate) {
  const a = new Date(`${de}T12:00:00`)
  const b = new Date(`${ate}T12:00:00`)
  return Math.round((b - a) / 86_400_000)
}

/** "14/03/2026" -> "2026-03-14" (para inputs de volta do usuário). */
export function dataBRparaISO(texto) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec((texto || '').trim())
  if (!m) return ''
  return `${m[3]}-${m[2]}-${m[1]}`
}

/** Distância relativa: "hoje", "amanhã", "em 3 dias", "há 2 dias", "atrasada 4d". */
export function descreverPrazo(iso) {
  const dias = diferencaDias(hojeISO(), iso)
  if (dias === 0) return 'hoje'
  if (dias === 1) return 'amanhã'
  if (dias === -1) return 'ontem'
  if (dias > 1) return `em ${dias} dias`
  return `há ${Math.abs(dias)} dias`
}

export function formatarPercentual(fracao, digitos = 0) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: digitos,
    maximumFractionDigits: digitos,
  }).format(Number.isFinite(fracao) ? fracao : 0)
}

export function formatarTelefone(telefone) {
  const digitos = String(telefone || '').replace(/\D/g, '')
  if (digitos.length === 11) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`
  }
  if (digitos.length === 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`
  }
  return telefone || '—'
}

/** Chave de mês para agrupamentos: "2026-03". */
export function chaveMes(iso) {
  return (iso || '').slice(0, 7)
}

/** Rótulo de mês para gráficos: "mar/26". */
export function rotuloMes(chave) {
  const [ano, mes] = chave.split('-')
  const d = new Date(Number(ano), Number(mes) - 1, 1)
  return d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
}

/** Últimos N meses como chaves "2026-03", incluindo o atual. */
export function ultimosMeses(n) {
  const agora = new Date()
  const chaves = []
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1)
    chaves.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return chaves
}

export function iniciais(nome) {
  return String(nome || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('')
}
