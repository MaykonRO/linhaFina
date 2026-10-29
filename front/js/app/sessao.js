/**
 * Estado de sessão neutro.
 *
 * A autenticação real pertencerá ao Spring Boot/Spring Security. Enquanto isso,
 * não existe identidade fictícia, permissão presumida nem sessão persistida no
 * navegador.
 */

const ouvintes = new Set()
let sessao = null
let initialized = false

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
