/**
 * DataTable: tabela administrativa com ordenação, paginação, estados vazios
 * e apresentação alternativa em cartões no celular (renderLinhaMobile).
 *
 * colunas: [{
 *   chave, cabecalho, render(linha) -> Node|string,
 *   ordenar(linha) -> valor (opcional; sem ordenar, a coluna não é clicável),
 *   alinhamento: 'esquerda' | 'direita' | 'centro',
 *   largura: classe CSS opcional (ex.: 'col-estreita'),
 *   ocultarMobile: bool (some abaixo de md na tabela — use no cartão mobile)
 * }]
 */

import { icone } from './icons.js'
import { h, limpar } from './dom.js'
import { estadoVazio, paginacao } from './ui.js'

function comparar(a, b) {
  if (typeof a === 'number' && typeof b === 'number') return a - b
  const fa = Number(a)
  const fb = Number(b)
  if (typeof a !== 'string' && typeof b !== 'string' && !Number.isNaN(fa) && !Number.isNaN(fb)) {
    return fa - fb
  }
  return String(a ?? '').localeCompare(String(b ?? ''), 'pt-BR', { sensitivity: 'base' })
}

const CLASSE_ALINHAMENTO = {
  esquerda: 'al-esquerda',
  direita: 'al-direita',
  centro: 'al-centro',
}

export function criarDataTable({
  colunas,
  linhas,
  chaveLinha = (l) => l.id,
  vazio = null,
  porPagina = 8,
  paginavel = true,
  compacto = false,
  renderLinhaMobile = null,
  barraFerramentas = null,
  rotuloSingular = 'registro',
  rotuloPlural = 'registros',
  classe = '',
}) {
  let ordenacao = null // {chave, direcao}
  let pagina = 1
  let dadosAtuais = linhas

  const raiz = h('div', { class: `tabela-card card-surface${compacto ? ' tabela-card--compacta' : ''}${classe ? ` ${classe}` : ''}` })

  function ordenadas() {
    if (!ordenacao) return dadosAtuais
    const coluna = colunas.find((c) => c.chave === ordenacao.chave)
    if (!coluna?.ordenar) return dadosAtuais
    const mult = ordenacao.direcao === 'asc' ? 1 : -1
    return [...dadosAtuais].sort((a, b) => mult * comparar(coluna.ordenar(a), coluna.ordenar(b)))
  }

  function renderizar() {
    limpar(raiz)

    if (barraFerramentas) {
      raiz.append(h('div', { class: 'tabela-ferramentas' }, barraFerramentas))
    }

    if (dadosAtuais.length === 0 && vazio) {
      raiz.append(estadoVazio(vazio))
      return
    }

    const lista = ordenadas()
    const totalPaginas = Math.max(Math.ceil(lista.length / porPagina), 1)
    if (pagina > totalPaginas) pagina = totalPaginas
    const visiveis = paginavel
      ? lista.slice((pagina - 1) * porPagina, pagina * porPagina)
      : lista

    /* Tabela (desktop e tablets horizontais) */
    const cabecalho = h(
      'tr',
      {},
      colunas.map((coluna) => {
        const ordenavel = Boolean(coluna.ordenar)
        const ativa = ordenacao?.chave === coluna.chave
        const direcao = ativa ? ordenacao.direcao : null
        const th = h(
          'th',
          {
            scope: 'col',
            class: [
              CLASSE_ALINHAMENTO[coluna.alinhamento] ?? 'al-esquerda',
              coluna.largura ?? '',
              coluna.ocultarMobile ? 'col-oculta-mobile' : '',
            ].join(' '),
            'aria-sort': ativa ? (direcao === 'asc' ? 'ascending' : 'descending') : null,
          },
          ordenavel
            ? h(
                'button',
                {
                  type: 'button',
                  class: `tabela-ordenar${ativa ? ' tabela-ordenar--ativa' : ''}`,
                  onClick: () => {
                    ordenacao =
                      ordenacao?.chave === coluna.chave
                        ? { chave: coluna.chave, direcao: ordenacao.direcao === 'asc' ? 'desc' : 'asc' }
                        : { chave: coluna.chave, direcao: 'asc' }
                    renderizar()
                  },
                },
                coluna.cabecalho,
                h('span', {
                  class: 'tabela-ordenar-icone',
                  innerHTML: icone(
                    ativa ? (direcao === 'asc' ? 'ArrowUp' : 'ArrowDown') : 'ArrowUpDown',
                    'ic ic--12'
                  ),
                })
              )
            : h(
                'span',
                { class: 'tabela-cabecalho-texto' },
                coluna.cabecalho,
                !coluna.cabecalho && h('span', { class: 'sr-only' }, 'Ações')
              )
        )
        return th
      })
    )

    const corpo = h(
      'tbody',
      {},
      visiveis.map((linha) =>
        h(
          'tr',
          { class: 'tabela-linha' },
          colunas.map((coluna) =>
            h(
              'td',
              {
                class: [
                  CLASSE_ALINHAMENTO[coluna.alinhamento] ?? 'al-esquerda',
                  coluna.alinhamento === 'direita' ? 'tnum' : '',
                  coluna.ocultarMobile ? 'col-oculta-mobile' : '',
                ].join(' '),
              },
              coluna.render(linha)
            )
          )
        )
      )
    )

    const tabela = h('table', { class: 'tabela' }, h('thead', { class: 'tabela-cabecalho' }, cabecalho), corpo)

    raiz.append(
      h(
        'div',
        { class: `tabela-rolagem${renderLinhaMobile ? ' sozinha-desktop' : ''}` },
        tabela
      )
    )

    /* Cartões no celular */
    if (renderLinhaMobile) {
      raiz.append(
        h(
          'ul',
          { class: 'tabela-cartoes-mobile' },
          visiveis.map((linha) => h('li', { class: 'tabela-cartao-mobile' }, renderLinhaMobile(linha)))
        )
      )
    }

    if (paginavel && lista.length > porPagina) {
      raiz.append(
        paginacao({
          pagina,
          totalItens: lista.length,
          porPagina,
          onMudarPagina: (nova) => {
            pagina = nova
            renderizar()
          },
          rotuloSingular,
          rotuloPlural,
        })
      )
    }
  }

  /** Troca as linhas mantendo ordenação e página atuais. */
  function atualizar(novasLinhas) {
    dadosAtuais = novasLinhas
    renderizar()
  }

  renderizar()
  return { raiz, atualizar }
}
