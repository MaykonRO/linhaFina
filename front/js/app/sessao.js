/**
 * Estado de sessão do usuário autenticado.
 *
 * A identidade vem do Spring Boot/Spring Security e é recuperada pela API.
 * O cookie HttpOnly permanece no servidor de sessão; não há identidade fictícia,
 * permissão presumida nem sessão persistida no armazenamento local do navegador.
 */

import { autenticacaoApi } from '../services/api/index.js'

const ouvintes = new Set()
let sessao = null
let initialized = false
let restauracao = null

function notificar() {
  for (const ouvinte of ouvintes) ouvinte(sessao)
}

export function iniciarSessao() {
  if (!initialized) {
    initialized = true
    notificar()
  }
  return sessao
}

export function sessaoAtual() {
  return sessao
}

export function definirSessao(dados) {
  sessao = dados && typeof dados === 'object' ? dados : null
  notificar()
  return sessao
}

/**
 * Entrada real deve ser feita pela API. Esta função não cria uma sessão
 * fictícia; ela será compatível com a resposta de `autenticacaoApi.entrar`.
 */
export function entrarSessao(dados) {
  return definirSessao(dados)
}

export function sairSessao() {
  sessao = null
  notificar()
}

export function assinarSessao(ouvinte) {
  ouvintes.add(ouvinte)
  return () => ouvintes.delete(ouvinte)
}

/** Restaura a identidade a partir do cookie HttpOnly do Spring Boot. */
export function restaurarSessao() {
  if (restauracao) return restauracao
  restauracao = autenticacaoApi.sessaoAtual()
    .then((dados) => definirSessao(dados?.usuario ?? dados))
    .catch(() => definirSessao(null))
  return restauracao
}
