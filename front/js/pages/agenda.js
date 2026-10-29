/**
 * Agenda (pages/agenda.html) — calendário do ateliê com visões diária,
 * semanal e mensal.
 *
 * Os eventos (entregas, provas, OS atrasadas no dia de hoje e folgas) vêm de
 * eventosEntre(); a página nunca deriva nada na mão. Cores por tipo SEMPRE
 * de TIPOS_EVENTO.
 */

import { iniciarApp, recarregarDados } from '../app/boot.js'
import { obterDb, obterEstadoRequisicao, ESTADO_REQUISICAO, assinarStore } from '../app/store.js'
import { blocoEstadoRequisicao, avisoSemIntegracao } from '../components/estados.js'
import { caminho } from '../app/rotas.js'
import { h } from '../components/dom.js'
import { icone } from '../components/icons.js'
import { pageHeader, badge, botao, botaoLink, abas, estadoVazio } from '../components/ui.js'
import { abrirModal } from '../components/modal.js'
import { eventosEntre, funcionaria, servico } from '../services/estatisticas.js'
import {
  adicionarDias, descreverPrazo, diferencaDias, formatarData, formatarDataLonga,
  formatarDiaMes, formatarDiaSemana, formatarMesAno, formatarMoeda, hojeISO,
} from '../utils/format.js'
import { STATUS_OS, TIPOS_EVENTO } from '../utils/status.js'

const DIAS_CURTOS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

const ABAS_VISAO = [
  { id: 'dia', rotulo: 'Dia' },
  { id: 'semana', rotulo: 'Semana' },
  { id: 'mes', rotulo: 'Mês' },
]

const ICONES_EVENTO = {
  [TIPOS_EVENTO.entrega.id]: 'PackageCheck',
  [TIPOS_EVENTO.prova.id]: 'Shirt',
  [TIPOS_EVENTO.atraso.id]: 'TriangleAlert',
  [TIPOS_EVENTO.folga.id]: 'CalendarOff',
}

/* ---------------- Aritética local de períodos ---------------- */

/** Soma n meses a uma data ISO, prendendo o dia ao último dia do mês alvo. */
function adicionarMeses(iso, n) {
  const [ano, mes, dia] = iso.split('-').map(Number)
  const alvo = new Date(ano, mes - 1 + n, 1)
  const ultimoDia = new Date(alvo.getFullYear(), alvo.getMonth() + 1, 0).getDate()
  const diaFinal = Math.min(dia, ultimoDia)
  const mesFinal = String(alvo.getMonth() + 1).padStart(2, '0')
  const diaTexto = String(diaFinal).padStart(2, '0')
  return `${alvo.getFullYear()}-${mesFinal}-${diaTexto}`
}

/** Domingo da semana que contém a data ISO. */
function inicioDaSemana(iso) {
  const diaSemana = new Date(`${iso}T12:00:00`).getDay()
  return adicionarDias(iso, -diaSemana)
}

const capitalizar = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1)
const nomeMes = (iso) => formatarMesAno(iso).split(' de ')[0]

/** "16–22 de março" (ou "30 de março – 5 de abril" quando o mês muda). */
function rotuloSemana(inicio, fim) {
  const mesInicio = nomeMes(inicio)
  const mesFim = nomeMes(fim)
  const diaInicio = Number(inicio.slice(8, 10))
  const diaFim = Number(fim.slice(8, 10))
  if (mesInicio === mesFim) return `${diaInicio}–${diaFim} de ${mesInicio}`
  return `${diaInicio} de ${mesInicio} – ${diaFim} de ${mesFim}`
}

/** "sexta, 20 de março" (sem o ano). */
function rotuloDia(iso) {
  const semana = formatarDiaSemana(iso).replace('-feira', '')
  const data = formatarDataLonga(iso).replace(/ de \d{4}$/, '')
  return `${semana}, ${data}`
}


class PaginaAgenda {
  iniciar() {
    this.visao = 'mes'
    this.base = hojeISO()
    this.destino = document.getElementById('pagina')
    this.renderizar()
  }

  mover(delta) {
    if (this.visao === 'dia') this.base = adicionarDias(this.base, delta)
    else if (this.visao === 'semana') this.base = adicionarDias(this.base, delta * 7)
    else this.base = adicionarMeses(this.base, delta)
    this.renderizar()
  }

  abrirDia(iso) {
    this.base = iso
    this.visao = 'dia'
    this.renderizar()
  }

  renderizar() {
    const db = obterDb()
    const hoje = hojeISO()
    const inicioSemana = inicioDaSemana(this.base)
    const rotulo =
      this.visao === 'mes'
        ? capitalizar(formatarMesAno(this.base))
        : this.visao === 'semana'
          ? rotuloSemana(inicioSemana, adicionarDias(inicioSemana, 6))
          : rotuloDia(this.base)

    const areaVisoes = h('div', { class: 'agenda-area-visoes' })

    const renderizarVisao = () => {
      if (this.visao === 'mes') areaVisoes.replaceChildren(this.visaoMensal(db, hoje))
      if (this.visao === 'semana') areaVisoes.replaceChildren(this.visaoSemanal(db, hoje))
      if (this.visao === 'dia') areaVisoes.replaceChildren(this.visaoDiaria(db))
    }
    renderizarVisao()

    const requisicao = obterEstadoRequisicao()
    const blocoEstado = blocoEstadoRequisicao({
      status: requisicao.status,
      erro: requisicao.erro,
      onTentar: () => recarregarDados(),
    })
    const avisoIntegracao = requisicao.status === ESTADO_REQUISICAO.SEM_INTEGRACAO ? avisoSemIntegracao() : null

    this.destino.replaceChildren(
      h('div', { class: 'pilha-6 animar-entrada' },
        pageHeader({
          titulo: 'Agenda',
          descricao: 'Entregas, provas e folgas registrados em um só calendário.',
        }),
        avisoIntegracao,
        blocoEstado,
        !blocoEstado && h('section', { class: 'card-surface cartao-agenda' },
          h('nav', { class: 'agenda-navegacao', 'aria-label': 'Navegação do calendário' },
            h('div', { class: 'agenda-navegacao-botoes' },
              botao({ variante: 'fantasma', tamanho: 'sm', classe: 'botao-quadrado', 'aria-label': 'Período anterior', onClick: () => this.mover(-1), children: [h('span', { class: 'ic-caixa', innerHTML: icone('ChevronLeft', 'ic ic--16') })] }),
              botao({ variante: 'fantasma', tamanho: 'sm', classe: 'botao-quadrado', 'aria-label': 'Próximo período', onClick: () => this.mover(1), children: [h('span', { class: 'ic-caixa', innerHTML: icone('ChevronRight', 'ic ic--16') })] }),
              botao({ variante: 'secundario', tamanho: 'sm', children: ['Hoje'], onClick: () => { this.base = hoje; this.renderizar() } }),
              h('h2', { class: 'agenda-rotulo' }, rotulo)
            ),
            abas({
              lista: ABAS_VISAO,
              ativa: this.visao,
              onMudar: (id) => {
                this.visao = id
                this.renderizar()
              },
            })
          ),
          h('div', { class: 'stitch stitch--soft' }),
          areaVisoes,
          h('footer', { class: 'agenda-legenda' },
            Object.values(TIPOS_EVENTO).map((tipo) =>
              h('span', { class: 'agenda-legenda-item' },
                h('span', { class: 'agenda-legenda-marcador', style: { backgroundColor: tipo.cor } }),
                tipo.rotulo
              )
            )
          )
        )
      )
    )
  }

  /* ------------------------------ Visão mensal ------------------------------ */

  visaoMensal(db, hoje) {
    const primeiroDia = `${this.base.slice(0, 7)}-01`
    const recuo = new Date(`${primeiroDia}T12:00:00`).getDay()
    const inicio = adicionarDias(primeiroDia, -recuo)
    const dias = Array.from({ length: 42 }, (_, i) => adicionarDias(inicio, i))
    const mesVisivel = this.base.slice(0, 7)

    const porDia = new Map()
    for (const evento of eventosEntre(db, inicio, dias[dias.length - 1])) {
      const lista = porDia.get(evento.data)
      if (lista) lista.push(evento)
      else porDia.set(evento.data, [evento])
    }

    return h('div', {},
      h('div', { class: 'agenda-dias-semana' },
        DIAS_CURTOS.map((dia) => h('span', { class: 'agenda-dia-nome' }, dia))
      ),
      h('div', { class: 'agenda-grade-mes' },
        dias.map((iso) => this.celulaDia(iso, porDia.get(iso) ?? [], iso.slice(0, 7) === mesVisivel, iso === hoje))
      ),
      porDia.size === 0
        ? h('div', { class: 'agenda-sem-eventos' },
            estadoVazio({
              icone: 'CalendarX2',
              titulo: 'Nenhum compromisso neste período',
              descricao: 'Entregas, provas e folgas reais aparecerão aqui quando forem registrados pela API.',
            })
          )
        : null
    )
  }

  celulaDia(iso, eventos, doMes, eHoje) {
    const folga = eventos.some((e) => e.tipo.id === TIPOS_EVENTO.folga.id)
    // O chip "Fechado" tem prioridade sobre eventos de OS no dia de folga.
    const ordenados = [...eventos].sort(
      (a, b) => Number(b.tipo.id === TIPOS_EVENTO.folga.id) - Number(a.tipo.id === TIPOS_EVENTO.folga.id)
    )
    const visiveis = ordenados.slice(0, 3)
    const extras = eventos.length - visiveis.length

    return h('button', {
      type: 'button',
      onClick: () => this.abrirDia(iso),
      class: `celula-dia${folga ? ' celula-dia--folga' : ''}`,
    },
      h('span', { class: 'sr-only' }, `Ver compromissos de ${formatarDataLonga(iso)}.`),
      h('span', {
        class: `celula-dia-numero tnum${eHoje ? ' celula-dia-numero--hoje' : ''}${doMes ? '' : ' celula-dia-numero--fora'}`,
      }, Number(iso.slice(8, 10))),
      h('span', { class: 'celula-dia-eventos' },
        visiveis.map((evento) => this.chipMes(evento)),
        extras > 0 && h('span', { class: 'celula-dia-extras tnum' }, `+${extras}`)
      )
    )
  }

  /** Chip compacto do mês: dot da cor do tipo + nome curto (só dot no mobile). */
  chipMes(evento) {
    const folga = evento.tipo.id === TIPOS_EVENTO.folga.id
    const nome = folga ? 'Fechado' : evento.os.tipoPeca
    const dica = folga ? 'Ateliê fechado' : `${evento.titulo} — ${evento.clienteNome}`
    return h('span', { title: dica, class: `chip-mes${folga ? ' chip-mes--folga' : ''}` },
      h('span', { class: 'chip-mes-marcador', style: { backgroundColor: evento.tipo.cor } }),
      h('span', { class: 'chip-mes-nome' }, nome)
    )
  }

  /* ------------------------------ Visão semanal ------------------------------ */

  visaoSemanal(db, hoje) {
    const inicio = inicioDaSemana(this.base)
    const dias = Array.from({ length: 7 }, (_, i) => adicionarDias(inicio, i))

    return h('div', { class: 'agenda-rolagem-semana', role: 'region', 'aria-label': 'Eventos da semana', tabindex: '0' },
      h('div', { class: 'agenda-grade-semana' },
        dias.map((iso) => {
          const eHoje = iso === hoje
          return h('div', { class: `coluna-semana${eHoje ? ' coluna-semana--hoje' : ''}` },
            h('button', {
              type: 'button',
              onClick: () => this.abrirDia(iso),
              'aria-label': `Abrir ${formatarDataLonga(iso)}`,
              class: 'coluna-semana-cabecalho',
            },
              h('span', { class: `coluna-semana-dia-semana${eHoje ? ' texto-primary-claro' : ''}` },
                formatarDiaSemana(iso).slice(0, 3)
              ),
              h('span', { class: `coluna-semana-data tnum${eHoje ? ' texto-primary-claro' : ''}` },
                formatarDiaMes(iso)
              )
            ),
            this.eventosDoDia(db, iso, { compacto: true })
          )
        })
      )
    )
  }

  /* ------------------------------ Visão diária ------------------------------ */

  visaoDiaria(db) {
    const dia = this.base
    const contagem = eventosEntre(db, dia, dia).length

    return h('div', { class: 'visao-diaria' },
      h('div', { class: 'visao-diaria-cabecalho' },
        h('h3', { class: 'visao-diaria-titulo' },
          h('span', { class: 'capitalizar' }, formatarDiaSemana(dia)),
          h('span', { class: 'visao-diaria-separador', 'aria-hidden': 'true' }, '·'),
          formatarDataLonga(dia)
        ),
        h('span', { class: 'visao-diaria-contagem tnum' },
          contagem === 0 ? 'Nenhum compromisso' : `${contagem} compromisso${contagem > 1 ? 's' : ''}`
        )
      ),
      this.eventosDoDia(db, dia)
    )
  }

  /* ------------------------------ Eventos do dia ------------------------------ */

  eventosDoDia(db, dia, { compacto = false } = {}) {
    const eventos = eventosEntre(db, dia, dia)

    if (eventos.length === 0) {
      return compacto
        ? h('p', { class: 'evento-compacto-vazio' }, 'Sem eventos')
        : estadoVazio({
            icone: 'CalendarX2',
            titulo: 'Nenhum compromisso neste dia',
            descricao: 'Este dia não possui compromissos registrados. Entregas e provas reais aparecerão aqui após a integração.',
          })
    }

    if (compacto) {
      return h('div', { class: 'pilha-2' },
        eventos.map((evento) => this.eventoCompacto(evento))
      )
    }

    return h('div', { class: 'pilha-3' },
      eventos.map((evento) =>
        evento.tipo.id === TIPOS_EVENTO.folga.id
          ? this.cartaoFolga(evento)
          : this.cartaoEvento(evento)
      )
    )
  }

  cartaoEvento(evento) {
    const os = evento.os
    return h('button', {
      type: 'button',
      onClick: () => this.abrirDetalhe(evento),
      class: 'cartao-evento',
    },
      h('span', {
        class: 'cartao-evento-icone',
        style: { backgroundColor: `${evento.tipo.cor}26`, color: evento.tipo.cor },
        innerHTML: icone(ICONES_EVENTO[evento.tipo.id], 'ic ic--18'),
      }),
      h('span', { class: 'cartao-evento-textos' },
        h('span', { class: 'cartao-evento-titulo texto-truncado' }, evento.titulo),
        h('span', { class: 'cartao-evento-cliente texto-truncado' }, evento.clienteNome),
        h('span', { class: 'cartao-evento-detalhe texto-truncado' },
          os.tipoPeca,
          h('span', { class: 'cartao-evento-separador', 'aria-hidden': 'true' }, '·'),
          h('span', { class: 'tnum' }, os.codigo)
        )
      ),
      badge({ status: STATUS_OS[os.status], classe: 'cartao-evento-badge' })
    )
  }

  cartaoFolga(evento) {
    return h('div', { class: 'cartao-folga' },
      h('span', { class: 'cartao-folga-icone', innerHTML: icone('CalendarOff', 'ic ic--18') }),
      h('span', {},
        h('span', { class: 'cartao-folga-titulo' }, evento.titulo),
        h('span', { class: 'cartao-folga-texto' }, 'Sem atendimento neste dia — provas e entregas não são programadas.')
      )
    )
  }

  eventoCompacto(evento) {
    if (evento.tipo.id === TIPOS_EVENTO.folga.id) {
      return h('div', { class: 'evento-compacto evento-compacto--folga' },
        h('span', { class: 'evento-compacto-marcador', style: { backgroundColor: evento.tipo.cor } }),
        h('span', { class: 'evento-compacto-nome texto-truncado' }, evento.titulo)
      )
    }
    return h('button', {
      type: 'button',
      onClick: () => this.abrirDetalhe(evento),
      title: `${evento.titulo} — ${evento.clienteNome}`,
      class: 'evento-compacto evento-compacto--clicavel',
    },
      h('span', { class: 'evento-compacto-topo' },
        h('span', { class: 'evento-compacto-marcador', style: { backgroundColor: evento.tipo.cor } }),
        h('span', { class: 'evento-compacto-textos' },
          h('span', { class: 'evento-compacto-titulo texto-truncado' }, evento.titulo),
          h('span', { class: 'evento-compacto-cliente texto-truncado' }, evento.clienteNome)
        )
      ),
      badge({ status: evento.tipo })
    )
  }

  /* ------------------------------ Modal de detalhe ------------------------------ */

  abrirDetalhe(evento) {
    const db = obterDb()
    const os = evento.os
    const prazo = descreverPrazo(os.dataPrevistaEntrega)
    const vencida = diferencaDias(hojeISO(), os.dataPrevistaEntrega) < 0

    const linha = (rotulo, valor) =>
      h('div', { class: 'linha-resumo' },
        h('dt', { class: 'texto-faint-pequeno' }, rotulo),
        h('dd', { class: 'linha-resumo-valor texto-truncado' }, valor)
      )

    abrirModal({
      titulo: os.codigo,
      descricao: evento.titulo,
      icone: ICONES_EVENTO[evento.tipo.id],
      tamanho: 'md',
      conteudo: h('div', { class: 'pilha-4' },
        h('dl', { class: 'lista-resumo' },
          linha('Cliente', evento.clienteNome),
          linha('Peça', os.tipoPeca),
          linha('Serviço', servico(db, os.servicoId)?.nome ?? '—'),
          linha('Status', badge({ status: STATUS_OS[os.status] })),
          linha('Previsão de entrega',
            h('span', { class: 'tnum' },
              formatarData(os.dataPrevistaEntrega),
              h('span', { class: vencida ? 'text-perigo' : 'texto-faint' }, ` (${prazo})`)
            )
          ),
          linha('Responsável', funcionaria(db, os.responsavelId)?.nome ?? '—'),
          linha('Valor', h('span', { class: 'tnum' }, formatarMoeda(os.valorFinal)))
        ),
        h('div', { class: 'confirmar-acoes' },
          botao({ variante: 'secundario', children: ['Fechar'], onClick: () => modal.fechar() }),
          botaoLink({ para: caminho('ordens-servico', { os: os.id }), children: ['Abrir OS'] })
        )
      ),
    })
  }
}

// Inicialização no fim do arquivo: as classes/constantes do módulo
// precisam estar definidas antes do primeiro uso.
const app = iniciarApp('agenda')
if (app) {
  const pagina = new PaginaAgenda()
  assinarStore(() => pagina.renderizar())
  pagina.iniciar()
}
