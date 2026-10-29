/**
 * Login (pages/login.html).
 *
 * A interface é preservada, mas a autenticação só é concluída quando a API
 * real está configurada. Nenhuma credencial fictícia é aceita ou simulada.
 */

import { iniciarStore, acoes } from '../app/store.js'
import { entrarSessao, iniciarSessao, sessaoAtual } from '../app/sessao.js'
import { navegar, caminho } from '../app/rotas.js'
import { toast } from '../components/toast.js'
import { marcaLinhaFina } from '../components/layout.js'
import { h } from '../components/dom.js'
import { icone } from '../components/icons.js'
import { botao, campo, criarInput } from '../components/ui.js'
import { email as validarEmail, vazio } from '../utils/validation.js'

iniciarStore()
iniciarSessao()

// Já logado? Vai direto para a visão geral.
if (sessaoAtual()) navegar('dashboard', null, { substituir: true })

const DESTAQUES = [
  { icone: 'ClipboardList', texto: 'Ordens de serviço com prazos e provas intermediárias' },
  { icone: 'Scissors', texto: 'Catálogo de serviços com tempo estimado de execução' },
  { icone: 'CalendarDays', texto: 'Agenda de entregas, provas e folgas do ateliê' },
  { icone: 'Store', texto: 'Vitrine pública para as clientes do ateliê' },
]

const destino = document.getElementById('pagina')
if (destino) renderizar()

function renderizar() {
  const estado = {
    email: '',
    senha: '',
    mostrarSenha: false,
    enviando: false,
    erros: {},
  }

  const campoEmail = criarInput({ type: 'email', autocomplete: 'username', placeholder: 'voce@atelie.com.br', value: estado.email })
  const campoSenha = criarInput({ type: 'password', autocomplete: 'current-password', placeholder: '••••••••', value: estado.senha })
  const botaoOlho = h('button', {
    type: 'button',
    class: 'login-olho',
    'aria-label': 'Mostrar senha',
    innerHTML: icone('Eye', 'ic ic--16'),
    onClick: () => {
      estado.mostrarSenha = !estado.mostrarSenha
      campoSenha.type = estado.mostrarSenha ? 'text' : 'password'
      botaoOlho.setAttribute('aria-label', estado.mostrarSenha ? 'Ocultar senha' : 'Mostrar senha')
      botaoOlho.innerHTML = icone(estado.mostrarSenha ? 'EyeOff' : 'Eye', 'ic ic--16')
    },
  })

  const emailCampo = campo({ label: 'E-mail', obrigatorio: true, controle: campoEmail })
  const senhaCampo = campo({ label: 'Senha', obrigatorio: true, controle: campoSenha })

  campoEmail.addEventListener('input', () => {
    estado.email = campoEmail.value
    if (estado.erros.email) {
      estado.erros.email = ''
      emailCampo.definirErro('')
    }
  })
  campoSenha.addEventListener('input', () => {
    estado.senha = campoSenha.value
    if (estado.erros.senha) {
      estado.erros.senha = ''
      senhaCampo.definirErro('')
    }
  })

  // Envelopa o campo de senha com o botão de olho (fora do controle).
  const senhaComOlho = h('div', { class: 'login-senha-caixa' })
  senhaCampo.raiz.insertBefore(senhaComOlho, campoSenha)
  senhaComOlho.append(campoSenha, botaoOlho)

  const botaoEnviar = botao({
    tipo: 'submit',
    tamanho: 'lg',
    classe: 'largura-total',
    children: ['Entrar'],
  })

  const formulario = h(
    'form',
    {
      novalidate: '',
      class: 'pilha-4',
      onSubmit: async (evento) => {
        evento.preventDefault()
        const erros = {
          email: validarEmail(estado.email, 'Informe um e-mail válido'),
          senha: vazio(estado.senha, 'Digite sua senha'),
        }
        estado.erros = erros
        emailCampo.definirErro(erros.email)
        senhaCampo.definirErro(erros.senha)
        if (erros.email || erros.senha) {
          toast.erro('Revise os campos destacados para entrar.')
          return
        }
        estado.enviando = true
        botaoEnviar.disabled = true
        botaoEnviar.replaceChildren(
          h('span', { class: 'btn-icone-el girar', innerHTML: icone('Loader2', 'ic ic--16') }),
          'Entrando…'
        )
        const resultado = await acoes.autenticacao.entrar({
          email: estado.email.trim(),
          senha: estado.senha,
        })

        botaoEnviar.disabled = false
        botaoEnviar.replaceChildren('Entrar')

        if (!resultado.ok) {
          estado.enviando = false
          toast.aviso(resultado.erro)
          return
        }

        entrarSessao(resultado.data?.usuario ?? resultado.data ?? null)
        toast.sucesso('Sessão iniciada.')
        navegar('dashboard', null, { substituir: true })
      },
    },
    emailCampo.raiz,
    senhaCampo.raiz,
    botaoEnviar
  )

  destino.replaceChildren(
    h(
      'div',
      { class: 'login-pagina' },
      /* Painel da marca */
      h(
        'aside',
        { class: 'login-painel' },
        h('div', { class: 'login-arte', 'aria-hidden': 'true', innerHTML: arteCostura() }),
        h(
          'div',
          { class: 'login-painel-conteudo' },
          marcaLinhaFina({ tamanho: 'lg' }),
          h('p', { class: 'login-apresentacao' },
            'Ordens de serviço, clientes, orçamentos e prazos do ateliê — costurados em um só lugar.'
          )
        ),
        h(
          'ul',
          { class: 'login-destaques' },
          DESTAQUES.map(({ icone: nome, texto }) =>
            h(
              'li',
              { class: 'login-destaque' },
              h('span', { class: 'login-destaque-icone', innerHTML: icone(nome, 'ic ic--16') }),
              texto
            )
          )
        ),
        h('p', { class: 'login-nota-academica' }, 'Interface do Linha Fina — a autenticação será conectada ao back-end real.')
      ),
      /* Formulário */
      h(
        'main',
        { class: 'login-formulario' },
        h(
          'div',
          { class: 'login-cartao' },
          h('div', { class: 'login-marca-mobile' }, marcaLinhaFina({ tamanho: 'lg' })),
          h('h1', { class: 'login-titulo' }, 'Entrar no ateliê'),
          h('p', { class: 'login-subtitulo' }, 'Acompanhe a bancada de onde você estiver.'),
          formulario,
          h(
            'div',
            { class: 'login-aviso' },
            h('span', { class: 'login-aviso-icone', innerHTML: icone('Sparkles', 'ic ic--16') }),
            h(
              'p',
              { class: 'login-aviso-texto' },
              h('strong', {}, 'Autenticação pendente.'),
              ' As credenciais serão enviadas à API somente quando a integração estiver configurada. Nenhuma senha é armazenada neste navegador.'
            )
          ),
          h(
            'p',
            { class: 'login-link-vitrine' },
            'Quer só espiar? ',
            h('a', { href: caminho('vitrine-publica'), class: 'link-destacado' }, 'Veja a vitrine pública')
          )
        )
      )
    )
  )
}

/** Costura decorativa de fundo do painel da marca (SVG do LoginPage original). */
function arteCostura() {
  return `<svg class="login-arte-svg" viewBox="0 0 400 400" aria-hidden="true">
    <path d="M60 210 C 120 210, 105 90, 190 90 C 275 90, 258 210, 320 210" fill="none"
          stroke="var(--lf-primary)" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="1 14" opacity="0.6"></path>
    <path d="M40 260 C 130 260, 118 130, 210 130 C 302 130, 290 260, 372 260" fill="none"
          stroke="var(--lf-azure)" stroke-width="2" stroke-linecap="round" stroke-dasharray="1 12" opacity="0.4"></path>
  </svg>`
}
