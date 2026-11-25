/** Modal acessível de criação e edição de clientes. */
import { h } from './dom.js'
import { icone } from './icons.js'
import { abrirModal } from './modal.js'
import { botao, campo, criarInput } from './ui.js'
import { toast } from './toast.js'
import { acoes } from '../app/store.js'
import { formatarTelefone } from '../utils/format.js'
import { email as validarEmail, telefone as validarTelefone, vazio, validarCampo } from '../utils/validation.js'

export function abrirModalCliente({ cliente = null, onFechar }) {
  const edicao = Boolean(cliente)
  const inputNome = criarInput({ placeholder: 'Nome completo', value: cliente?.nome ?? '', autocomplete: 'name' })
  const inputTelefone = criarInput({ type: 'tel', inputmode: 'tel', placeholder: '(11) 98765-4321', value: cliente?.telefone ? formatarTelefone(cliente.telefone) : '', autocomplete: 'tel' })
  const inputEmail = criarInput({ type: 'email', placeholder: 'nome@email.com', value: cliente?.email ?? '', autocomplete: 'email' })
  const campoNome = campo({ label: 'Nome', obrigatorio: true, controle: inputNome, classe: 'campo-largo' })
  const campoTelefone = campo({ label: 'Telefone', obrigatorio: true, controle: inputTelefone })
  const campoEmail = campo({ label: 'E-mail', obrigatorio: true, controle: inputEmail })

  inputTelefone.addEventListener('blur', () => {
    if (inputTelefone.value.replace(/\D/g, '')) inputTelefone.value = formatarTelefone(inputTelefone.value)
  })

  const botaoSalvar = botao({ tipo: 'submit', children: [edicao ? 'Salvar alterações' : 'Cadastrar cliente'] })
  const modal = abrirModal({
    titulo: edicao ? 'Editar cliente' : 'Nova cliente',
    descricao: edicao ? 'Atualize os dados de contato.' : 'Cadastre os dados de contato.',
    tamanho: 'md', icone: 'Users', onFechar,
    conteudo: h('form', {
      novalidate: '', class: 'pilha-4',
      onSubmit: async (evento) => {
        evento.preventDefault()
        const validacao = validarCampo({
          nome: vazio(inputNome.value, 'Informe o nome do cliente'),
          telefone: validarTelefone(inputTelefone.value),
          email: validarEmail(inputEmail.value),
        })
        campoNome.definirErro(validacao.erros.nome)
        campoTelefone.definirErro(validacao.erros.telefone)
        campoEmail.definirErro(validacao.erros.email)
        if (!validacao.valido) return

        const payload = {
          nome: inputNome.value.trim(),
          telefone: inputTelefone.value.replace(/\D/g, ''),
          email: inputEmail.value.trim(),
        }
        botaoSalvar.disabled = true
        botaoSalvar.setAttribute('aria-busy', 'true')
        botaoSalvar.replaceChildren(h('span', { class: 'btn-icone-el girar', innerHTML: icone('Loader2', 'ic ic--16') }), 'Salvando…')
        const resultado = edicao
          ? await acoes.clientes.atualizar(cliente.id, payload)
          : await acoes.clientes.criar(payload)

        if (resultado.ok) {
          toast.sucesso(edicao ? 'Cliente atualizado.' : 'Cliente cadastrado com sucesso.')
          modal.fechar()
          return
        }
        toast.aviso(resultado.erro)
        botaoSalvar.disabled = false
        botaoSalvar.removeAttribute('aria-busy')
        botaoSalvar.replaceChildren(edicao ? 'Salvar alterações' : 'Cadastrar cliente')
      },
    },
      h('div', { class: 'grade-form' }, campoNome.raiz, campoTelefone.raiz, campoEmail.raiz),
      h('div', { class: 'confirmar-acoes borda-superior' },
        botao({ variante: 'secundario', type: 'button', children: ['Cancelar'], onClick: () => modal.fechar() }),
        botaoSalvar
      )
    ),
  })
  return modal
}
