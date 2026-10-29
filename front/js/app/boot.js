/**
 * Inicialização das páginas administrativas.
 *
 * Monta o shell sem simular autenticação. O carregamento da API é iniciado
 * em segundo plano; páginas podem exibir carregando, vazio, erro ou
 * "sem integração" conforme o estado real.
 */

import { iniciarStore, carregarDados, recarregarDados } from './store.js'
import { iniciarSessao } from './sessao.js'
import { montarLayout } from '../components/layout.js'

/**
 * @param {string} pagina id da página atual (data-pagina)
 * @returns {{ db: object } | null}
 */
export function iniciarApp(pagina) {
  iniciarStore()
  iniciarSessao()
  montarLayout(pagina)

  void carregarDados()

  return { db: null }
}

export { recarregarDados }
