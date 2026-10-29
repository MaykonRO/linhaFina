/**
 * Vitrine (pages/vitrine.html) — gestão das peças em exposição na página
 * pública do ateliê.
 */

import { iniciarApp, recarregarDados } from '../app/boot.js'
import { obterDb, acoes, assinarStore, obterEstadoRequisicao, ESTADO_REQUISICAO } from '../app/store.js'
import { blocoEstadoRequisicao, avisoSemIntegracao } from '../components/estados.js'
import { caminho } from '../app/rotas.js'
import { toast } from '../components/toast.js'
import { h } from '../components/dom.js'
import { icone } from '../components/icons.js'
import { pageHeader, badge, botao, botaoLink, estadoVazio, campo, criarInput, criarTextarea, criarSelect, interruptor, campoMoeda } from '../components/ui.js'
import { abrirModal } from '../components/modal.js'
import { confirmar } from '../components/confirm.js'
import { artePeca, ARTES } from '../components/arte.js'
import { formatarMoeda, compararTexto } from '../utils/format.js'
import { vazio } from '../utils/validation.js'

const CATEGORIAS = ['Vestidos', 'Alfaiataria', 'Camisas', 'Saias', 'Festa', 'Conjuntos', 'Casacos', 'Noiva']

const VAZIO = {
  nome: '', categoria: '', descricao: '', preco: 0, arte: 'vestido-longo', destaque: false, ativo: true,
}


class PaginaVitrine {
  iniciar() {
    this.destino = document.getElementById('pagina')
    this.renderizar()
  }

  renderizar() {
    const db = obterDb()
    const pecas = [...db.pecas].sort(
      (a, b) => Number(b.destaque) - Number(a.destaque) || compararTexto(a.nome, b.nome)
    )

    const visiveis = db.pecas.filter((p) => p.ativo).length
    const ocultas = db.pecas.length - visiveis
    const destaques = db.pecas.filter((p) => p.destaque).length

    const abrirNova = () => this.abrirForm(null)

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
          titulo: 'Vitrine',
          descricao: 'Peças em exposição na página pública do ateliê.',
          acoes: [
            botaoLink({ para: caminho('vitrine-publica'), variante: 'secundario', icone: 'ExternalLink', children: ['Ver vitrine pública'] }),
            botao({ icone: 'Plus', children: ['Nova peça'], onClick: abrirNova }),
          ],
        }),
        avisoIntegracao,
        blocoEstado,
        !blocoEstado && h('div', { class: 'contadores-vitrine' },
          this.contador(visiveis, 'visíveis'),
          this.contador(ocultas, 'ocultas'),
          this.contador(destaques, 'em destaque')
        ),

        !blocoEstado && (pecas.length === 0
          ? h('section', { class: 'card-surface' },
              estadoVazio({
                icone: 'Shirt',
                titulo: 'Nenhuma peça cadastrada.',
                descricao: 'Use a ação “Nova peça” para cadastrar a primeira peça quando a integração estiver disponível.',
                acao: botao({ icone: 'Plus', children: ['Cadastrar primeira peça'], onClick: abrirNova }),
              })
            )
          : h('ul', { class: 'grade grade-vitrine' },
              pecas.map((peca) =>
                h('li', {},
                  h('article', { class: 'card-surface cartao-peca' },
                    artePeca(peca.arte),
                    h('div', { class: 'cartao-peca-corpo' },
                      h('div', { class: 'cartao-peca-topo' },
                        h('div', { class: 'texto-minimo pilha-1' },
                          h('h2', { class: 'peca-nome' }, peca.nome),
                          badge({ variante: 'neutral', rotulo: peca.categoria, comPonto: false })
                        ),
                        h('span', { class: 'tnum cartao-peca-preco' }, formatarMoeda(peca.preco))
                      ),
                      h('p', { class: 'descricao-linha texto-suave' }, peca.descricao || '—'),
                      h('div', { class: 'cartao-peca-rodape' },
                        interruptor({
                          rotulo: 'Exibir na vitrine',
                          marcado: peca.ativo,
                          onMudar: () => this.alternarExibicao(peca),
                        }),
                        h('div', { class: 'acoes-linha alinhado-direita' },
                          botao({
                            variante: 'fantasma', tamanho: 'sm',
                            'aria-label': `Editar ${peca.nome}`,
                            onClick: () => this.abrirForm(peca),
                            children: [h('span', { class: 'ic-caixa', innerHTML: icone('Pencil', 'ic ic--16') })],
                          }),
                          botao({
                            variante: 'fantasma', tamanho: 'sm',
                            'aria-label': peca.destaque ? `Remover destaque de ${peca.nome}` : `Destacar ${peca.nome}`,
                            onClick: () => this.alternarDestaque(peca),
                            children: [h('span', { class: `ic-caixa ${peca.destaque ? 'estrela-ativa' : 'texto-faint'}`, innerHTML: icone('Star', 'ic ic--16') })],
                          }),
                          botao({
                            variante: 'fantasma', tamanho: 'sm', classe: 'botao-perigo',
                            'aria-label': `Excluir ${peca.nome}`,
                            onClick: () => this.confirmarExclusao(peca),
                            children: [h('span', { class: 'ic-caixa text-perigo', innerHTML: icone('Trash2', 'ic ic--16') })],
                          })
                        )
                      )
                    )
                  )
                )
              )
            ))
      )
    )
  }

  contador(valor, rotulo) {
    return h('p', { class: 'contador-vitrine-item' },
      h('span', { class: 'tnum contador-vitrine-valor' }, valor),
      h('span', { class: 'contador-vitrine-rotulo' }, rotulo)
    )
  }

  async alternarExibicao(peca) {
    const resultado = await acoes.vitrine.alternarExibicao(peca.id)
    if (resultado.ok) toast.sucesso(peca.ativo ? 'Peça oculta da vitrine.' : 'Peça agora visível na vitrine.')
    else toast.aviso(resultado.erro)
  }

  async alternarDestaque(peca) {
    const resultado = await acoes.vitrine.alternarDestaque(peca.id)
    if (resultado.ok) toast.sucesso(peca.destaque ? 'Destaque removido da peça.' : 'Peça marcada como destaque.')
    else toast.aviso(resultado.erro)
  }

  confirmarExclusao(peca) {
    confirmar({
      titulo: 'Excluir peça?',
      descricao: 'Esta ação remove a peça da vitrine pública e não pode ser desfeita.',
      rotuloConfirmar: 'Excluir peça',
      onConfirmar: async () => {
        const resultado = await acoes.vitrine.remover(peca.id)
        if (resultado.ok) {
          toast.sucesso('Peça removida da vitrine.')
          return true
        }
        toast.aviso(resultado.erro)
        return false
      },
    })
  }

  abrirForm(peca) {
    const edicao = Boolean(peca)
    const dados = {
      nome: peca?.nome ?? '',
      categoria: peca?.categoria ?? '',
      descricao: peca?.descricao ?? '',
      preco: peca?.preco ?? 0,
      arte: peca?.arte ?? 'vestido-longo',
      destaque: peca?.destaque ?? false,
      ativo: peca?.ativo ?? true,
    }
    const erros = {}

    const inputNome = criarInput({ placeholder: 'Ex.: Vestido Aurora', value: dados.nome })
    const campoNome = campo({ label: 'Nome', obrigatorio: true, controle: inputNome })

    const selectCategoria = criarSelect({
      valor: dados.categoria,
      opcoes: [{ value: '', rotulo: 'Selecione…' }, ...CATEGORIAS.map((c) => ({ value: c, rotulo: c }))],
    })
    const campoCategoria = campo({ label: 'Categoria', obrigatorio: true, controle: selectCategoria })

    const textareaDescricao = criarTextarea({
      rows: 3,
      placeholder: 'Tecido, modelagem e acabamento da peça…',
      value: dados.descricao,
    })

    const moedaPreco = campoMoeda({ valor: dados.preco, onValor: (novo) => { dados.preco = novo } })
    const campoPreco = campo({ label: 'Preço', dica: 'Exibido na vitrine como "a partir de".', controle: moedaPreco.raiz })

    const selectArte = criarSelect({
      valor: dados.arte,
      opcoes: ARTES.map((a) => ({ value: a.id, rotulo: a.rotulo })),
    })
    const areaPrevia = h('div', { class: 'previa-arte' }, artePeca(dados.arte))
    selectArte.addEventListener('change', () => {
      dados.arte = selectArte.value
      areaPrevia.replaceChildren(artePeca(dados.arte))
    })

    let destaque = dados.destaque
    let ativo = dados.ativo
    const switchDestaque = interruptor({
      rotulo: 'Destaque',
      descricao: 'A peça recebe o selo de destaque e sobe na galeria.',
      marcado: destaque,
      onMudar: (valor) => { destaque = valor },
    })
    const switchAtivo = interruptor({
      rotulo: 'Ativa',
      descricao: 'Peças inativas ficam ocultas da página pública.',
      marcado: ativo,
      onMudar: (valor) => { ativo = valor },
    })

    const limpar = (nomeCampo, campoEl, entrada) =>
      entrada.addEventListener('input', () => {
        if (erros[nomeCampo]) {
          erros[nomeCampo] = ''
          campoEl.definirErro('')
        }
      })
    limpar('nome', campoNome, inputNome)
    limpar('categoria', campoCategoria, selectCategoria)

    const modal = abrirModal({
      titulo: edicao ? 'Editar peça' : 'Nova peça',
      descricao: peca?.nome,
      icone: 'Shirt',
      tamanho: 'lg',
      conteudo: h('form', {
        novalidate: '', class: 'pilha-4',
        onSubmit: async (evento) => {
          evento.preventDefault()
          dados.nome = inputNome.value
          dados.categoria = selectCategoria.value
          dados.descricao = textareaDescricao.value
          dados.destaque = destaque
          dados.ativo = ativo

          erros.nome = vazio(dados.nome, 'Informe o nome da peça')
          erros.categoria = vazio(dados.categoria, 'Selecione a categoria')
          campoNome.definirErro(erros.nome)
          campoCategoria.definirErro(erros.categoria)
          if (erros.nome || erros.categoria) {
            toast.erro('Revise os campos destacados.')
            return
          }

          const payload = {
            ...dados,
            nome: dados.nome.trim(),
            descricao: dados.descricao.trim(),
          }
          const resultado = edicao
            ? await acoes.vitrine.atualizar(peca.id, payload)
            : await acoes.vitrine.criar(payload)
          if (resultado.ok) {
            toast.sucesso(edicao ? 'Peça atualizada.' : 'Peça cadastrada.')
            modal.fechar()
          } else {
            toast.aviso(resultado.erro)
          }
        },
      },
        h('div', { class: 'grade-form' }, campoNome.raiz, campoCategoria.raiz),
        campo({ label: 'Descrição', controle: textareaDescricao }).raiz,
        h('div', { class: 'grade-form' },
          campoPreco.raiz,
          campo({ label: 'Arte', dica: 'Ilustração da galeria pública.', controle: h('div', { class: 'campo-arte' }, selectArte, areaPrevia) }).raiz
        ),
        h('div', { class: 'pilha-4' }, switchDestaque, switchAtivo),
        h('div', { class: 'confirmar-acoes borda-superior' },
          botao({ variante: 'secundario', type: 'button', children: ['Cancelar'], onClick: () => modal.fechar() }),
          botao({ tipo: 'submit', children: [edicao ? 'Salvar alterações' : 'Cadastrar peça'] })
        )
      ),
    })
  }
}

// Inicialização no fim do arquivo: as classes/constantes do módulo
// precisam estar definidas antes do primeiro uso.
const app = iniciarApp('vitrine')
if (app) {
  const pagina = new PaginaVitrine()
  assinarStore(() => pagina.renderizar())
  pagina.iniciar()
}
