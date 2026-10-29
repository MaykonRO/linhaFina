/**
 * Modal de cadastro e edição de clientes.
 *
 * Usado pela lista (nova cliente / editar linha) e pelo perfil da cliente.
 * A ficha de medidas NÃO fica aqui — ela vive no perfil e é editada inline.
 */

import { h } from './dom.js'
import { icone } from './icons.js'
import { abrirModal } from './modal.js'
import { botao, campo, criarInput, criarTextarea } from './ui.js'
import { toast } from './toast.js'
import { acoes } from '../app/store.js'
import { formatarTelefone } from '../utils/format.js'
import { email as validarEmail, telefone as validarTelefone, vazio, validarCampo } from '../utils/validation.js'

export function abrirModalCliente({ cliente = null, onFechar }) {
  const edicao = Boolean(cliente)
  const dados = {
    nome: cliente?.nome ?? '',
    telefone: cliente?.telefone ? formatarTelefone(cliente.telefone) : '',
    email: cliente?.email ?? '',
    cidade: cliente?.cidade ?? '',
    observacoes: cliente?.observacoes ?? '',
  }

  const inputNome = criarInput({ placeholder: 'Nome completo', value: dados.nome, autocomplete: 'off' })
  const inputTelefone = criarInput({ type: 'tel', placeholder: '(11) 98765-4321', value: dados.telefone, autocomplete: 'off' })
  const inputEmail = criarInput({ type: 'email', placeholder: 'nome@email.com', value: dados.email, autocomplete: 'off' })
  const inputCidade = criarInput({ placeholder: 'Cidade da cliente', value: dados.cidade, autocomplete: 'off' })
  const textareaObs = criarTextarea({ placeholder: 'Preferências, alergias, combinados…', rows: 3, value: dados.observacoes })

  const campoNome = campo({ label: 'Nome', obrigatorio: true, controle: inputNome, classe: 'campo-largo' })
  const campoTelefone = campo({ label: 'Telefone', obrigatorio: true, controle: inputTelefone })
  const campoEmail = campo({ label: 'E-mail', obrigatorio: true, controle: inputEmail })
  const campoCidade = campo({ label: 'Cidade', controle: inputCidade })
  const campoObs = campo({ label: 'Observações', controle: textareaObs, classe: 'campo-largo' })

  /** Aceita dígitos livres e formata a máscara na saída do campo. */
  inputTelefone.addEventListener('blur', () => {
    const digitos = inputTelefone.value.replace(/\D/g, '')
    if (!digitos) return
    inputTelefone.value = formatarTelefone(inputTelefone.value)
  })

  const botaoSalvar = botao({
    tipo: 'submit',
    children: [edicao ? 'Salvar alterações' : 'Cadastrar cliente'],
  })

  const modal = abrirModal({
    titulo: edicao ? 'Editar cadastro' : 'Nova cliente',
    descricao: edicao
      ? 'Atualize os dados de contato da cliente.'
      : 'Cadastre os dados de contato da nova cliente.',
    tamanho: 'md',
    icone: 'Users',
    onFechar,
    conteudo: h('form', {
      novalidate: '',
      class: 'pilha-4',
      onSubmit: async (evento) => {
        evento.preventDefault()
        const validacao = validarCampo({
          nome: vazio(inputNome.value, 'Informe o nome da cliente'),
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
          cidade: inputCidade.value.trim(),
          observacoes: textareaObs.value.trim(),
        }

        botaoSalvar.disabled = true
        botaoSalvar.setAttribute('aria-busy', 'true')
        botaoSalvar.replaceChildren(
          h('span', { class: 'btn-icone-el girar', innerHTML: icone('Loader2', 'ic ic--16') }),
          'Salvando…'
        )

        const resultado = await (edicao
          ? acoes.clientes.atualizar(cliente.id, payload)
          : acoes.clientes.criar({ ...payload, medidas: null }))

        if (resultado.ok) {
          toast.sucesso(edicao ? 'Alterações salvas.' : 'Cliente cadastrada com sucesso.')
          modal.fechar()
          onFechar?.()
        } else {
          toast.aviso(resultado.erro)
          botaoSalvar.disabled = false
          botaoSalvar.removeAttribute('aria-busy')
          botaoSalvar.replaceChildren(edicao ? 'Salvar alterações' : 'Cadastrar cliente')
        }
      },
    },
      h('div', { class: 'grade-form' },
        campoNome.raiz,
        campoTelefone.raiz,
        campoEmail.raiz,
        campoCidade.raiz,
        campoObs.raiz
      ),
      h('div', { class: 'confirmar-acoes borda-superior' },
        botao({ variante: 'secundario', type: 'button', children: ['Cancelar'], onClick: () => modal.fechar() }),
        botaoSalvar
      )
    ),
  })

  return modal
}
