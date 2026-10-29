/**
 * Equipe (pages/equipe.html) — cadastro das integrantes do ateliê e
 * distribuição de trabalho.
 *
 * Indicadores vêm de cargaEquipe(); autenticação e permissões reais
 * ficarão no back-end.
 */

import { iniciarApp, recarregarDados } from '../app/boot.js'
import { obterDb, acoes, assinarStore, obterEstadoRequisicao, ESTADO_REQUISICAO } from '../app/store.js'
import { blocoEstadoRequisicao, avisoSemIntegracao } from '../components/estados.js'
import { toast } from '../components/toast.js'
import { h } from '../components/dom.js'
import { icone } from '../components/icons.js'
import { pageHeader, badge, botao, avatar, estadoVazio, campo, criarInput, criarSelect } from '../components/ui.js'
import { abrirModal } from '../components/modal.js'
import { confirmar } from '../components/confirm.js'
import { cargaEquipe } from '../services/estatisticas.js'
import { formatarMoeda } from '../utils/format.js'
import { HEX, STATUS_FUNCIONARIA } from '../utils/status.js'
import { validarCampo, vazio } from '../utils/validation.js'

const ROTULO_PAPEL = {
  dono: 'Dono',
  admin: 'Admin',
  lider: 'Líder',
  funcionario: 'Funcionária',
  atendimento: 'Atendimento',
}

const COR_PONTO_STATUS = {
  disponivel: HEX.success,
  em_servico: HEX.info,
  afastada: HEX.faint,
}

const FORM_INICIAL = {
  nome: '', cargo: '', papel: 'funcionario', status: 'disponivel', especialidade: '',
}


class PaginaEquipe {
  iniciar() {
    this.destino = document.getElementById('pagina')
    this.renderizar()
  }

  renderizar() {
    const db = obterDb()
    const carga = cargaEquipe(db)

    const acaoNovoBotao = botao({ icone: 'UserPlus', children: ['Nova funcionária'], onClick: () => this.abrirModal('criar', null) })

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
          titulo: 'Equipe',
          descricao: 'Costureiras e atendimento que conduzem o ateliê.',
          acoes: [acaoNovoBotao],
        }),
        avisoIntegracao,
        blocoEstado,
        !blocoEstado && (carga.length === 0
          ? estadoVazio({
              icone: 'Users',
              titulo: 'Nenhuma funcionária cadastrada.',
              descricao: 'Use a ação acima para cadastrar a equipe quando a integração estiver disponível.',
              acao: botao({ icone: 'UserPlus', children: ['Nova funcionária'], onClick: () => this.abrirModal('criar', null) }),
            })
          : h('div', {},
              h('div', { class: 'grade grade-equipe' },
                carga.map((item) => this.cartaoFuncionaria(item))
              ),
              h('section', { class: 'card-surface cartao-padrao' },
                h('div', { class: 'cartao-titulo' },
                  h('div', {},
                    h('h2', { class: 'cartao-rotulo' }, 'Distribuição de trabalho'),
                    h('p', { class: 'cartao-subtitulo' }, 'OS ativas por integrante, conforme os registros reais da API.')
                  )
                ),
                h('ul', { class: 'lista-carga' },
                  carga.map(({ funcionaria: f, osAtivas }) =>
                    h('li', { class: 'item-carga' },
                      h('div', { class: 'linha-entre' },
                        h('span', { class: 'item-carga-nome' },
                          avatar({ nome: f.nome, tamanho: 'sm' }),
                          h('span', { class: 'texto-truncado texto-medio' }, f.nome)
                        ),
                        h('span', { class: 'tnum item-carga-contagem' }, `${osAtivas} OS ativa${osAtivas === 1 ? '' : 's'}`)
                      )
                    )
                  )
                )
              )
            )),

        h('p', { class: 'nota-informativa' },
          h('span', { class: 'ic-caixa', innerHTML: icone('Info', 'ic ic--14') }),
          'Sem integração: autenticação, papéis e permissões reais serão controlados pelo back-end.'
        )
      )
    )
  }

  cartaoFuncionaria(item) {
    const { funcionaria: f, osAtivas, entreguesNoMes, valorEmProducao, atrasadas } = item

    const dado = (rotulo, valor) =>
      h('div', {},
        h('dt', { class: 'texto-faint-pequeno' }, rotulo),
        h('dd', { class: 'tnum dado-numerico' }, valor)
      )

    return h('article', { class: 'card-surface cartao-funcionaria' },
      h('div', { class: 'cartao-funcionaria-topo' },
        avatar({ nome: f.nome, tamanho: 'lg', comPonto: true, corPonto: COR_PONTO_STATUS[f.status] ?? HEX.faint }),
        h('div', { class: 'cartao-funcionaria-identificacao' },
          h('h2', { class: 'texto-truncado nome-funcionaria' }, f.nome),
          h('p', { class: 'texto-truncado cargo-funcionaria' }, f.cargo || 'Sem cargo definido'),
          h('div', { class: 'envoltura-badges' },
            badge({ variante: 'neutral', rotulo: ROTULO_PAPEL[f.papel] ?? 'Funcionária' }),
            badge({ status: STATUS_FUNCIONARIA[f.status] })
          )
        )
      ),

      f.especialidade && h('p', { class: 'especialidade-funcionaria' }, f.especialidade),

      h('dl', { class: 'grade-funcionaria-stats' },
        dado('OS ativas', osAtivas),
        h('div', {},
          h('dt', { class: 'texto-faint-pequeno' }, 'Valor em produção'),
          h('dd', { class: 'tnum dado-numerico texto-truncado' }, formatarMoeda(valorEmProducao))
        ),
        dado('Entregues no mês', entreguesNoMes),
        h('div', {},
          h('dt', { class: 'texto-faint-pequeno' }, 'Atrasadas'),
          h('dd', { class: 'tnum dado-numerico' },
            atrasadas > 0 && h('span', { class: 'ic-caixa text-perigo', innerHTML: icone('TriangleAlert', 'ic ic--14') }),
            h('span', { class: atrasadas > 0 ? 'text-perigo' : '' }, atrasadas)
          )
        )
      ),

      h('div', { class: 'cartao-funcionaria-acoes' },
        botao({
          variante: 'fantasma', tamanho: 'sm', icone: 'Pencil', children: ['Editar'],
          onClick: () => this.abrirModal('editar', f),
        }),
        botao({
          variante: 'fantasma', tamanho: 'sm', icone: 'Trash2', children: ['Remover'],
          onClick: () => this.confirmarRemocao(f),
        })
      )
    )
  }

  abrirModal(modo, funcionaria) {
    const dados = funcionaria
      ? {
          nome: funcionaria.nome ?? '',
          cargo: funcionaria.cargo ?? '',
          papel: funcionaria.papel ?? 'funcionario',
          status: funcionaria.status ?? 'disponivel',
          especialidade: funcionaria.especialidade ?? '',
        }
      : { ...FORM_INICIAL }
    const erros = {}

    const inputNome = criarInput({ placeholder: 'Nome completo', value: dados.nome })
    const inputCargo = criarInput({ placeholder: 'Ex.: Costureira sênior', value: dados.cargo })
    const inputEspecialidade = criarInput({ placeholder: 'Ex.: Vestidos de festa e noiva', value: dados.especialidade })

    const selectPapel = criarSelect({
      valor: dados.papel,
      opcoes: Object.entries(ROTULO_PAPEL).map(([id, rotulo]) => ({ value: id, rotulo })),
    })
    const selectStatus = criarSelect({
      valor: dados.status,
      opcoes: Object.values(STATUS_FUNCIONARIA).map((status) => ({ value: status.id, rotulo: status.rotulo })),
    })

    const campoNome = campo({ label: 'Nome', obrigatorio: true, controle: inputNome, classe: 'campo-largo' })
    const campoCargo = campo({ label: 'Cargo', controle: inputCargo })
    const campoPapel = campo({ label: 'Papel', controle: selectPapel })
    const campoStatus = campo({ label: 'Status', controle: selectStatus })
    const campoEspecialidade = campo({ label: 'Especialidade', controle: inputEspecialidade })

    inputNome.addEventListener('input', () => {
      if (erros.nome) {
        erros.nome = ''
        campoNome.definirErro('')
      }
    })

    const modal = abrirModal({
      titulo: modo === 'criar' ? 'Nova funcionária' : 'Editar funcionária',
      descricao: modo === 'criar'
        ? 'Cadastre uma integrante da equipe do ateliê.'
        : `Ajuste os dados de ${funcionaria?.nome ?? ''}.`,
      icone: modo === 'criar' ? 'UserPlus' : 'Pencil',
      tamanho: 'md',
      conteudo: h('form', {
        novalidate: '', class: 'grade-form',
        onSubmit: async (evento) => {
          evento.preventDefault()
          const payload = {
            nome: inputNome.value,
            cargo: inputCargo.value,
            papel: selectPapel.value,
            status: selectStatus.value,
            especialidade: inputEspecialidade.value,
          }
          const validacao = validarCampo({
            nome: vazio(payload.nome, 'Informe o nome da funcionária'),
          })
          campoNome.definirErro(validacao.erros.nome)
          if (!validacao.valido) return

          if (modo === 'editar') {
            const resultado = await acoes.equipe.atualizar(funcionaria.id, payload)
            if (resultado.ok) {
              toast.sucesso('Dados da funcionária atualizados.')
              modal.fechar()
            } else {
              toast.aviso(resultado.erro)
            }
          } else {
            const resultado = await acoes.equipe.criar(payload)
            if (resultado.ok) {
              toast.sucesso('Funcionária cadastrada na equipe.')
              modal.fechar()
            } else {
              toast.aviso(resultado.erro)
            }
          }
        },
      },
        campoNome.raiz,
        campoCargo.raiz,
        campoPapel.raiz,
        campoStatus.raiz,
        campoEspecialidade.raiz,
        h('div', { class: 'confirmar-acoes borda-superior campo-largo' },
          botao({ variante: 'secundario', type: 'button', children: ['Cancelar'], onClick: () => modal.fechar() }),
          botao({ tipo: 'submit', children: [modo === 'criar' ? 'Cadastrar' : 'Salvar alterações'] })
        )
      ),
    })
  }

  confirmarRemocao(funcionaria) {
    confirmar({
      titulo: `Remover ${funcionaria?.nome ?? 'funcionária'}?`,
      descricao: 'Funcionárias com OS atribuídas não podem ser removidas — o sistema bloqueia a exclusão até as ordens serem reatribuídas. Esta ação não pode ser desfeita.',
      rotuloConfirmar: 'Remover',
      onConfirmar: async () => {
        const resultado = await acoes.equipe.remover(funcionaria.id)
        if (!resultado.ok) {
          toast.aviso(resultado.erro)
          return false
        }
        toast.sucesso(`${funcionaria.nome} foi removida da equipe.`)
        return true
      },
    })
  }
}

// Inicialização no fim do arquivo: as classes/constantes do módulo
// precisam estar definidas antes do primeiro uso.
const app = iniciarApp('equipe')
if (app) {
  const pagina = new PaginaEquipe()
  assinarStore(() => pagina.renderizar())
  pagina.iniciar()
}
