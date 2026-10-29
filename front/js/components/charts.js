/**
 * Gráficos do Linha Fina em SVG puro — substituem o Recharts com o mesmo tema.
 *
 * - graficoEvolucao: área com 1–2 séries (ex.: faturamento/recebido por mês)
 * - graficoDonut: distribuição com legenda acessível embaixo
 * - graficoBarras: comparativo por categoria
 *
 * Cores sempre hex (SVG não resolve var()); veja utils/status.js → HEX.
 * Reagem a redimensionamento via ResizeObserver (re-render interno).
 */

import { h } from './dom.js'
import { estadoVazio } from './ui.js'
import { formatarMoeda } from '../utils/format.js'

let sequencia = 0

const COR_EIXO = '#716C85'
const COR_GRADE = '#2E2A3E'
const COR_CURSOR = '#3d3752'

function rotuloCompacto(valor) {
  if (Math.abs(valor) >= 1000) {
    return `${(valor / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil`
  }
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(valor)
}

/** Máximo "arredondado" para os ticks do eixo Y (passos 1/2/5 × 10^k). */
function maximoAgradavel(valor) {
  if (valor <= 0) return 1
  const expoente = Math.floor(Math.log10(valor))
  const fracao = valor / 10 ** expoente
  const passo = fracao <= 1 ? 1 : fracao <= 2 ? 2 : fracao <= 5 ? 5 : 10
  return passo * 10 ** expoente
}

function criarTooltip() {
  const no = h('div', { class: 'grafico-tooltip pop-surface', hidden: '' })
  return no
}

function montarConteudoTooltip(rotulo, itens, formatador) {
  return h(
    'div',
    { class: 'grafico-tooltip-conteudo' },
    rotulo && h('p', { class: 'grafico-tooltip-rotulo' }, rotulo),
    h(
      'ul',
      { class: 'grafico-tooltip-lista' },
      itens.map((item) =>
        h(
          'li',
          { class: 'grafico-tooltip-item' },
          h('span', {
            class: 'grafico-tooltip-marcador',
            style: { backgroundColor: item.cor },
          }),
          h('span', { class: 'grafico-tooltip-nome' }, `${item.nome}:`),
          h('span', { class: 'grafico-tooltip-valor tnum' }, formatador(item.valor))
        )
      )
    )
  )
}

function posicionarTooltip(tooltip, alvo, container) {
  const retanguloContainer = container.getBoundingClientRect()
  const retanguloAlvo = alvo.getBoundingClientRect()
  tooltip.removeAttribute('hidden')
  const larguraTooltip = tooltip.offsetWidth
  let esquerda = retanguloAlvo.left - retanguloContainer.left + retanguloAlvo.width / 2 - larguraTooltip / 2
  esquerda = Math.max(6, Math.min(esquerda, retanguloContainer.width - larguraTooltip - 6))
  const topo = retanguloAlvo.top - retanguloContainer.top - tooltip.offsetHeight - 10
  tooltip.style.left = `${esquerda}px`
  tooltip.style.top = `${topo < 6 ? topo + tooltip.offsetHeight + retanguloAlvo.height + 20 : topo}px`
}

/* ------------------------------------------------------------------ */
/* Gráfico de evolução (área)                                          */
/* ------------------------------------------------------------------ */

export function graficoEvolucao({
  dados,
  campoX = 'rotulo',
  series = [],
  altura = 260,
  formatador = formatarMoeda,
  ariaRotulo = 'Gráfico de evolução',
  classe = '',
  semDados = false,
  mensagemVazio = 'Os indicadores serão exibidos quando houver dados disponíveis.',
}) {
  if (semDados || !dados?.length) {
    return estadoVazio({
      icone: 'ChartNoAxesCombined',
      titulo: 'Sem indicadores para exibir',
      descricao: mensagemVazio,
    })
  }

  const id = `evo-${(sequencia += 1)}`
  const container = h('div', {
    class: `grafico-evolucao${classe ? ` ${classe}` : ''}`,
    role: 'img',
    'aria-label': `${ariaRotulo}: ${series.map((s) => s.nome).join(', ')} por ${
      campoX === 'rotulo' ? 'mês' : campoX
    }.`,
    style: { height: `${altura}px` },
  })
  const tooltip = criarTooltip()
  container.append(tooltip)
  let larguraAnterior = 0

  function desenhar() {
    const largura = container.clientWidth || 600
    if (Math.abs(largura - larguraAnterior) < 2 && container.querySelector('svg')) return
    larguraAnterior = largura
    container.querySelectorAll('svg').forEach((no) => no.remove())

    const margens = { topo: 8, direita: 8, base: 22, esquerda: 64 }
    const larguraUtil = Math.max(largura - margens.esquerda - margens.direita, 10)
    const alturaUtil = Math.max(altura - margens.topo - margens.base, 10)
    const n = dados.length || 1
    const passoX = larguraUtil / n

    const maiorValor = Math.max(
      1,
      ...dados.flatMap((d) => series.map((s) => Number(d[s.chave]) || 0))
    )
    const limite = maximoAgradavel(maiorValor * 1.08)
    const y = (valor) => margens.topo + alturaUtil - (valor / limite) * alturaUtil
    const x = (indice) => margens.esquerda + passoX * (indice + 0.5)

    const partes = []
    partes.push(
      `<defs>${series
        .map(
          (s) =>
            `<linearGradient id="grad-${id}-${s.chave}" x1="0" y1="0" x2="0" y2="1">
               <stop offset="0%" stop-color="${s.cor}" stop-opacity="0.28"></stop>
               <stop offset="100%" stop-color="${s.cor}" stop-opacity="0.02"></stop>
             </linearGradient>`
        )
        .join('')}</defs>`
    )

    // Grade horizontal + rótulos do eixo Y (5 passos).
    const passosGrade = 5
    for (let i = 0; i <= passosGrade; i += 1) {
      const valor = (limite / passosGrade) * i
      const yy = y(valor)
      partes.push(
        `<line x1="${margens.esquerda}" x2="${largura - margens.direita}" y1="${yy}" y2="${yy}"
               stroke="${COR_GRADE}" stroke-dasharray="3 6"></line>`
      )
      partes.push(
        `<text x="${margens.esquerda - 8}" y="${yy}" fill="${COR_EIXO}" font-size="11"
               text-anchor="end" dominant-baseline="middle">${rotuloCompacto(valor)}</text>`
      )
    }

    // Rótulos do eixo X.
    dados.forEach((d, i) => {
      partes.push(
        `<text x="${x(i)}" y="${altura - margens.base + 16}" fill="${COR_EIXO}" font-size="11"
               text-anchor="middle">${d[campoX] ?? ''}</text>`
      )
    })

    // Áreas e linhas por série.
    for (const s of series) {
      const pontos = dados.map((d, i) => [x(i), y(Number(d[s.chave]) || 0)])
      if (pontos.length === 0) continue
      const baseY = margens.topo + alturaUtil
      const linha = pontos.map((p) => `${p[0]},${p[1]}`).join(' L ')
      partes.push(
        `<path d="M ${pontos[0][0]},${baseY} L ${linha} L ${pontos[pontos.length - 1][0]},${baseY} Z"
               fill="url(#grad-${id}-${s.chave})"></path>`
      )
      partes.push(
        `<path d="M ${linha}" fill="none" stroke="${s.cor}" stroke-width="2"
               stroke-linejoin="round" stroke-linecap="round"></path>`
      )
    }

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('viewBox', `0 0 ${largura} ${altura}`)
    svg.setAttribute('width', '100%')
    svg.setAttribute('height', altura)
    svg.innerHTML = partes.join('')

    // Cursor vertical + áreas de hover.
    const cursor = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    cursor.setAttribute('y1', margens.topo)
    cursor.setAttribute('y2', margens.topo + alturaUtil)
    cursor.setAttribute('stroke', COR_CURSOR)
    cursor.setAttribute('stroke-width', '1')
    cursor.setAttribute('opacity', '0')
    svg.append(cursor)

    dados.forEach((d, i) => {
      const area = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      area.setAttribute('x', String(margens.esquerda + passoX * i))
      area.setAttribute('y', String(margens.topo))
      area.setAttribute('width', String(passoX))
      area.setAttribute('height', String(alturaUtil))
      area.setAttribute('fill', 'transparent')
      area.addEventListener('mouseenter', () => {
        cursor.setAttribute('x1', String(x(i)))
        cursor.setAttribute('x2', String(x(i)))
        cursor.setAttribute('opacity', '0.7')
        limpar(tooltip)
        tooltip.append(
          montarConteudoTooltip(
            d[campoX] ?? '',
            series.map((s) => ({ nome: s.nome, cor: s.cor, valor: Number(d[s.chave]) || 0 })),
            formatador
          )
        )
        posicionarTooltip(tooltip, area, container)
      })
      area.addEventListener('mouseleave', () => {
        cursor.setAttribute('opacity', '0')
        tooltip.setAttribute('hidden', '')
      })
      svg.append(area)
      // Ponto ativo no topo da primeira série (como o activeDot do Recharts).
    })

    container.insertBefore(svg, tooltip)
  }

  desenhar()
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(desenhar).observe(container)
  }
  return container
}

function limpar(no) {
  while (no.firstChild) no.removeChild(no.firstChild)
}

/* ------------------------------------------------------------------ */
/* Gráfico donut (distribuição)                                        */
/* ------------------------------------------------------------------ */

export function graficoDonut({
  dados = [],
  altura = 240,
  centroRotulo = '',
  centroValor = '',
  formatador = formatarMoeda,
  ariaRotulo = 'Gráfico de distribuição',
  classe = '',
  semDados = false,
  mensagemVazio = 'Os indicadores serão exibidos quando houver dados disponíveis.',
}) {
  if (semDados || !dados.length) {
    return estadoVazio({
      icone: 'ChartPie',
      titulo: 'Sem distribuição para exibir',
      descricao: mensagemVazio,
    })
  }

  const total = dados.reduce((t, d) => t + d.valor, 0)

  const legenda = h(
    'ul',
    { class: 'donut-legenda' },
    dados.map((d) =>
      h(
        'li',
        { class: 'donut-legenda-item' },
        h('span', { class: 'donut-legenda-nome' },
          h('span', { class: 'donut-legenda-marcador', style: { backgroundColor: d.cor } }),
          d.nome),
        h('span', { class: 'donut-legenda-valor tnum' },
          total > 0 ? `${Math.round((d.valor / total) * 100)}%` : formatador(d.valor))
      )
    )
  )

  const areaGrafico = h('div', { class: 'donut-area', role: 'img', 'aria-label': ariaRotulo, style: { height: `${altura}px` } })
  const centro = h(
    'div',
    { class: 'donut-centro' },
    h('p', { class: 'donut-centro-valor tnum' }, centroValor),
    h('p', { class: 'donut-centro-rotulo' }, centroRotulo)
  )

  const tooltip = criarTooltip()
  areaGrafico.append(tooltip, centro)

  function desenhar() {
    areaGrafico.querySelectorAll('svg').forEach((no) => no.remove())
    const lado = Math.min(areaGrafico.clientWidth || altura, altura)
    const raioExterno = lado * 0.44
    const raioInterno = raioExterno * (62 / 88)
    const centroX = lado / 2
    const centroY = lado / 2
    const anguloFole = 3 // paddingAngle em graus
    const vazio = total <= 0

    const partes = []
    if (vazio) {
      partes.push(
        `<circle cx="${centroX}" cy="${centroY}" r="${(raioExterno + raioInterno) / 2}"
                 fill="none" stroke="${COR_GRADE}" stroke-width="${raioExterno - raioInterno}" opacity="0.5"></circle>`
      )
    } else {
      let inicio = -90
      dados.forEach((d) => {
        const fatia = (d.valor / total) * 360
        const fim = inicio + fatia
        const a1 = Math.max(inicio + fatia > 360 - anguloFole ? inicio : inicio + anguloFole / 2, inicio)
        const b1 = fim - anguloFole / 2
        const comeco = a1 > b1 ? (inicio + fim) / 2 : a1
        const final = a1 > b1 ? (inicio + fim) / 2 : b1
        const rad = (graus) => (graus * Math.PI) / 180
        const pontoExterno = (ang, raio) => `${centroX + raio * Math.cos(rad(ang))},${centroY + raio * Math.sin(rad(ang))}`
        const arcoExterno =
          final - comeco > 180 ? 1 : 0
        const d1 = `M ${pontoExterno(comeco, raioExterno)}
                    A ${raioExterno} ${raioExterno} 0 ${arcoExterno} 1 ${pontoExterno(final, raioExterno)}
                    L ${pontoExterno(final, raioInterno)}
                    A ${raioInterno} ${raioInterno} 0 ${arcoExterno} 0 ${pontoExterno(comeco, raioInterno)} Z`
        partes.push(
          `<path d="${d1}" fill="${d.cor}" data-fatia="${d.nome}"></path>`
        )
        inicio = fim
      })
    }

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('viewBox', `0 0 ${lado} ${lado}`)
    svg.setAttribute('width', '100%')
    svg.setAttribute('height', lado)
    svg.innerHTML = partes.join('')

    svg.querySelectorAll('[data-fatia]').forEach((fatia) => {
      const nome = fatia.getAttribute('data-fatia')
      const item = dados.find((d) => d.nome === nome)
      fatia.addEventListener('mouseenter', () => {
        limpar(tooltip)
        tooltip.append(
          montarConteudoTooltip('', [{ nome: item.nome, cor: item.cor, valor: item.valor }], formatador)
        )
        posicionarTooltip(tooltip, fatia, areaGrafico)
      })
      fatia.addEventListener('mouseleave', () => tooltip.setAttribute('hidden', ''))
    })

    areaGrafico.insertBefore(svg, tooltip)
  }

  desenhar()
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(desenhar).observe(areaGrafico)
  }

  return h('div', { class: `grafico-donut${classe ? ` ${classe}` : ''}` }, areaGrafico, legenda)
}

/* ------------------------------------------------------------------ */
/* Gráfico de barras                                                   */
/* ------------------------------------------------------------------ */

export function graficoBarras({
  dados,
  campoX = 'rotulo',
  series = [],
  altura = 260,
  formatador = formatarMoeda,
  ariaRotulo = 'Gráfico de barras',
  classe = '',
  semDados = false,
  mensagemVazio = 'Os indicadores serão exibidos quando houver dados disponíveis.',
}) {
  if (semDados || !dados?.length) {
    return estadoVazio({
      icone: 'ChartBar',
      titulo: 'Sem dados para comparar',
      descricao: mensagemVazio,
    })
  }

  const container = h('div', {
    class: `grafico-barras${classe ? ` ${classe}` : ''}`,
    role: 'img',
    'aria-label': ariaRotulo,
    style: { height: `${altura}px` },
  })
  const tooltip = criarTooltip()
  container.append(tooltip)
  let larguraAnterior = 0

  function desenhar() {
    const largura = container.clientWidth || 600
    if (Math.abs(largura - larguraAnterior) < 2 && container.querySelector('svg')) return
    larguraAnterior = largura
    container.querySelectorAll('svg').forEach((no) => no.remove())

    const margens = { topo: 8, direita: 8, base: 22, esquerda: 48 }
    const larguraUtil = Math.max(largura - margens.esquerda - margens.direita, 10)
    const alturaUtil = Math.max(altura - margens.topo - margens.base, 10)
    const n = dados.length || 1
    const banda = larguraUtil / n
    const larguraBarra = Math.min(44, Math.max(banda * 0.6 - 4, 4))
    const espacamento = 4

    const maiorValor = Math.max(
      1,
      ...dados.flatMap((d) => series.map((s) => Number(d[s.chave]) || 0))
    )
    const limite = maximoAgradavel(maiorValor * 1.08)
    const y = (valor) => margens.topo + alturaUtil - (valor / limite) * alturaUtil
    const centroBanda = (i) => margens.esquerda + banda * (i + 0.5)

    const partes = []
    const passosGrade = 5
    for (let i = 0; i <= passosGrade; i += 1) {
      const valor = (limite / passosGrade) * i
      const yy = y(valor)
      partes.push(
        `<line x1="${margens.esquerda}" x2="${largura - margens.direita}" y1="${yy}" y2="${yy}"
               stroke="${COR_GRADE}" stroke-dasharray="3 6"></line>`
      )
      partes.push(
        `<text x="${margens.esquerda - 8}" y="${yy}" fill="${COR_EIXO}" font-size="11"
               text-anchor="end" dominant-baseline="middle">${rotuloCompacto(valor)}</text>`
      )
    }
    dados.forEach((d, i) => {
      partes.push(
        `<text x="${centroBanda(i)}" y="${altura - margens.base + 16}" fill="${COR_EIXO}"
               font-size="11" text-anchor="middle">${d[campoX] ?? ''}</text>`
      )
    })

    const cursor = document.createElementNS('http://www.w3.org/2000/svg', 'rect')

    dados.forEach((d, i) => {
      const larguraGrupo = series.length * larguraBarra + (series.length - 1) * espacamento
      const inicioGrupo = centroBanda(i) - larguraGrupo / 2
      series.forEach((s, indiceSerie) => {
        const valor = Number(d[s.chave]) || 0
        const xBarra = inicioGrupo + indiceSerie * (larguraBarra + espacamento)
        const yBarra = y(valor)
        const raioTopo = Math.min(6, larguraBarra / 2)
        partes.push(
          `<rect x="${xBarra}" y="${yBarra}" width="${larguraBarra}" height="${Math.max(
            margens.topo + alturaUtil - yBarra,
            0
          )}" rx="${raioTopo}" ry="${raioTopo}" fill="${s.cor}"></rect>`
        )
      })
    })

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('viewBox', `0 0 ${largura} ${altura}`)
    svg.setAttribute('width', '100%')
    svg.setAttribute('height', altura)
    svg.innerHTML = partes.join('')

    dados.forEach((d, i) => {
      const area = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      area.setAttribute('x', String(margens.esquerda + banda * i))
      area.setAttribute('y', String(margens.topo))
      area.setAttribute('width', String(banda))
      area.setAttribute('height', String(alturaUtil))
      area.setAttribute('fill', 'rgba(139,92,246,0.08)')
      area.setAttribute('opacity', '0')
      area.addEventListener('mouseenter', () => {
        area.setAttribute('opacity', '1')
        limpar(tooltip)
        tooltip.append(
          montarConteudoTooltip(
            d[campoX] ?? '',
            series.map((s) => ({ nome: s.nome, cor: s.cor, valor: Number(d[s.chave]) || 0 })),
            formatador
          )
        )
        posicionarTooltip(tooltip, area, container)
      })
      area.addEventListener('mouseleave', () => {
        area.setAttribute('opacity', '0')
        tooltip.setAttribute('hidden', '')
      })
      svg.append(area)
    })

    container.insertBefore(svg, tooltip)
  }

  desenhar()
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(desenhar).observe(container)
  }
  return container
}
