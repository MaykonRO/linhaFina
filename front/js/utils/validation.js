/**
 * Regras de validação compartilhadas dos formulários.
 * Simples e síncronas: cada validador devolve uma mensagem de erro ou
 * uma string vazia quando o campo está válido.
 */

export const vazio = (valor, mensagem = 'Informe este campo') => {
  const texto = String(valor ?? '').trim()
  return texto ? '' : mensagem
}

export const email = (valor, mensagem = 'Informe um e-mail válido') => {
  const texto = String(valor ?? '').trim()
  if (!texto) return vazio(texto)
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(texto) ? '' : mensagem
}

export const telefone = (valor, mensagem = 'Informe um telefone com DDD') => {
  const digitos = String(valor ?? '').replace(/\D/g, '')
  if (!digitos) return vazio(valor, 'Informe o telefone')
  return digitos.length >= 10 ? '' : mensagem
}

export const positivo = (valor, mensagem = 'Informe um valor maior que zero') => {
  const numero = Number(valor)
  if (!Number.isFinite(numero) || numero <= 0) return mensagem
  return ''
}

export const naoNegativo = (valor, mensagem = 'Valor inválido') => {
  const numero = Number(valor)
  if (!Number.isFinite(numero) || numero < 0) return mensagem
  return ''
}

export const obrigatorioQuando = (condicao, valor, mensagem = 'Informe este campo') =>
  condicao ? vazio(valor, mensagem) : ''

/** Uma data não pode vir antes da outra. */
export const dataAntesDe = (inicial, final, mensagem = 'A data final é anterior à inicial') => {
  if (!inicial || !final) return ''
  return inicial <= final ? '' : mensagem
}

/** Executa um objeto de validadores { campo: mensagem } e devolve { campo: bool }. */
export function validarCampo(mensagens) {
  const erros = {}
  let valido = true
  for (const [campo, mensagem] of Object.entries(mensagens)) {
    if (mensagem) {
      erros[campo] = mensagem
      valido = false
    }
  }
  return { erros, valido }
}
