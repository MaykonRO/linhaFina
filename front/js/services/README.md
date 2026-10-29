# Camada de dados do Linha Fina

Páginas **não acessam armazenamento, seeds ou HTTP diretamente**. Use o store
(`js/app/store.js`), as derivações puras de `services/estatisticas.js` e os
módulos de entidade em `services/api/`.

## Store — `js/app/store.js`

```js
import { obterDb, assinarStore, acoes } from '../app/store.js'

const db = obterDb()
const cancelar = assinarStore((db, requisicao, operacao) => {
  // reagimos a dados e aos estados de requisição/operação
})
```

- `iniciarStore()` / `obterDb()` — estado em memória, inicialmente vazio.
- `obterEstadoRequisicao()` — `carregando`, `carregado`, `vazio`, `erro` ou
  `sem-integracao`.
- `obterEstadoOperacao()` — `em-andamento`, `concluida`, `nao-concluida` ou
  `sem-integracao`.
- `assinarStore(fn)` — notifica mudanças de dados, requisição e operação.
- `carregarDados()` — busca as coleções reais; rotas não configuradas não geram
  requisição.
- `recarregarDados()` — repete a leitura; use-o no botão "Tentar novamente"
  do bloco de erro.

### Estados de requisição e o que a tela deve mostrar

| Status           | Significado                                  | Tratamento na interface                                        |
| ---------------- | -------------------------------------------- | -------------------------------------------------------------- |
| `carregando`     | requisições em andamento                      | `estadoCarregando()` (`blocoEstadoRequisicao`)                 |
| `carregado`      | a API respondeu com registros                  | conteúdo real + estados vazios por tabela                      |
| `vazio`          | a API respondeu, mas não há registros          | `avisoSemDados()` + estados vazios específicos por página       |
| `erro`           | falha de comunicação ou erro HTTP              | `estadoErro()` com "Tentar novamente" (→ `recarregarDados()`)   |
| `sem-integracao` | nenhuma rota configurada; nenhum `fetch` saiu | `avisoSemIntegracao()` + aviso de que a ação awaits back-end   |

No estado `erro`, indicadores numéricos mostram `—` (nunca `R$ 0,00`), para que
uma falha de comunicação não pareça um resultado financeiro real.

### Reconciliação após mutações

Depois de uma mutação confirmada pela API, o store relê as coleções
(`sincronizarDados()`) e atualiza a tela com os registros reais. Se a
reconciliação falhar, a mutação continua válida — apenas a releitura é
descartada.

### Configuração com horário não informado

`db.configuracoes.horario` usa `ativo: null` para "horário não informado pela
API". Somente `ativo: false` (confirmado pela API) fecha o ateliê em um dia e
gera evento de folga na agenda. O valor padrão nunca inventa dias fechados.

Todas as ações são assíncronas e retornam uma estrutura estável:

```js
const resultado = await acoes.ordens.criar(dados)

if (resultado.ok) {
  toast.sucesso('Ordem de serviço criada.')
} else {
  toast.aviso(resultado.erro)
}
```

O formato é `{ ok, status, data, erro, codigo?, entidade? }`. Não há exceções não
tratadas e nenhuma ação simula sucesso.

## Ações disponíveis

```js
acoes.clientes.criar(dados)
acoes.clientes.atualizar(id, dados)
acoes.clientes.remover(id)

acoes.servicos.criar(dados)
acoes.servicos.atualizar(id, dados)
acoes.servicos.alternarSituacao(id, ativo)
acoes.servicos.remover(id)

acoes.ordens.criar(dados)
acoes.ordens.atualizar(id, dados)
acoes.ordens.avancarStatus(id)
acoes.ordens.cancelar(id, motivo)
acoes.ordens.marcarPagamento(id, { status, valorPago })

acoes.orcamentos.criar(dados)
acoes.orcamentos.atualizar(id, dados)
acoes.orcamentos.aprovar(id)
acoes.orcamentos.recusar(id, motivo)
acoes.orcamentos.converterEmOS(id)

acoes.equipe.criar(dados)
acoes.equipe.atualizar(id, dados)
acoes.equipe.remover(id)

acoes.vitrine.criar(dados)
acoes.vitrine.atualizar(id, dados)
acoes.vitrine.alternarExibicao(id)
acoes.vitrine.alternarDestaque(id)
acoes.vitrine.remover(id)

acoes.configuracoes.atualizar({ secao: { campo: valor } })
acoes.autenticacao.entrar({ email, senha })
acoes.autenticacao.sair()
```

## Cliente HTTP — `services/api/httpClient.js`

- `fetch` nativo, `method` correto, timeout via `AbortController` e suporte a
  `AbortSignal.any`.
- Tratamento de JSON, texto, `204`, erro HTTP e falha de rede.
- `ErroApi` diferencia erro da API de erro de comunicação.
- `IntegracaoNaoConfiguradaError` impede qualquer requisição quando a chave de
  rota não foi configurada.

## Módulos por entidade — `services/api/index.js`

Os módulos expõem métodos como `listar`, `obter`, `criar`, `atualizar` e
`remover`, conforme a entidade. As chaves abaixo são **nomes lógicos**, não URLs
confirmadas:

```text
clientes.listar, clientes.obter, clientes.criar, clientes.atualizar, clientes.remover
servicos.listar, servicos.obter, servicos.criar, servicos.atualizar,
servicos.alternar-situacao, servicos.remover
ordens-servico.listar, ordens-servico.obter, ordens-servico.criar,
ordens-servico.atualizar, ordens-servico.avancar-status,
ordens-servico.cancelar, ordens-servico.pagamento
orcamentos.listar, orcamentos.obter, orcamentos.criar, orcamentos.atualizar,
orcamentos.aprovar, orcamentos.recusar, orcamentos.converter
funcionarias.listar, funcionarias.criar, funcionarias.atualizar, funcionarias.remover
vitrine.pecas.listar, vitrine.pecas.criar, vitrine.pecas.atualizar,
vitrine.pecas.alternar-exibicao, vitrine.pecas.alternar-destaque,
vitrine.pecas.remover
pagamentos.listar, pagamentos.registrar
relatorios.resumo, relatorios.entregas, relatorios.produtividade
configuracoes.buscar, configuracoes.atualizar
autenticacao.entrar, autenticacao.sair, autenticacao.sessao
```

Configure cada chave em `window.LF_API_ENDPOINTS`. Templates podem usar `{id}`:

```js
window.LF_API_ENDPOINTS = {
  'clientes.listar': '/clientes',
  'clientes.obter': '/clientes/{id}'
}
```

## Configuração — `services/api/config.js`

```js
window.LF_API_CONFIG = {
  baseUrl: 'http://localhost:8080/api',
  timeoutMs: 10000,
  credentials: 'include',
  headers: {}
}
```

`window.LF_API_ENDPOINTS` também é aceito como atalho para `endpoints`. O
`baseUrl` padrão é apenas uma referência de desenvolvimento; ajuste-o em runtime.

## Derivações — `services/estatisticas.js`

As funções são puras e recebem o `db` real:

```js
cliente(db, id), servico(db, id), funcionaria(db, id)
resumoOS(db), osRecentes(db, n), proximasEntregas(db, n)
resumoFinanceiro(db), serieMensal(db, n), listaPagamentos(db)
distribuicaoCategorias(db, n), servicosMaisSolicitados(db, n)
resumoCliente(db, id), pecasDaCliente(db, id), situacaoCliente(db, id)
cargaEquipe(db), eventosEntre(db, de, ate), folgasDoPeriodo(db, de, ate)
notificacoes(db), relatorioEntregas(db), contatoAtelie(db)
```

Elas não inventam registros, índices, percentuais ou fileiras. Coleções vazias
resultam em listas e indicadores vazios.

## Texto vindo da API — `js/utils/format.js`

Um registro real pode chegar incompleto (campo `nome`, `categoria` ou
`clienteNome` ausente). Para que uma linha malformada não derrube a página,
todo texto vindo da API passa por utilitários próprios:

```js
import { textoSeguro, compararTexto, contemTexto } from '../utils/format.js'

textoSeguro(cliente.nome)              // '' quando o campo não existe
contemTexto(cliente.nome, termo)       // busca sem quebrar com null/undefined
compararTexto(a.nome, b.nome)          // ordenação localeCompare segura
```

Use-os em buscas, ordenações e filtros — não aplique `.toLowerCase()` ou
`.localeCompare()` diretamente sobre um campo da API.

## Sessão — `js/app/sessao.js`

```js
iniciarSessao()
sessaoAtual()
entrarSessao(dadosDaApi)
sairSessao()
assinarSessao(fn)
```

A sessão começa nula e não é persistida no navegador. `entrarSessao` apenas recebe
a resposta real de `autenticacaoApi.entrar`; não há identidade ou permissão
fictícia.

## Componentes de estado — `js/components/estados.js`

```js
import {
  estadoCarregando,
  estadoErro,
  estadoSemIntegracao,
  blocoEstadoRequisicao,
  avisoSemIntegracao,
  avisoSemDados,
  barraStatus,
} from '../components/estados.js'
```

- `blocoEstadoRequisicao({ status, erro, onTentar })` — devolve o bloco de
  carregamento ou de erro; `null` quando a requisição deu certo.
- `avisoSemIntegracao()` — aviso de que a API ainda não foi configurada.
- `avisoSemDados()` — aviso de que a API respondeu, mas não há registros.
- `barraStatus()` — barra global (`role="status"`) montada pelo shell; mostra
  "em andamento", "concluída" ou a mensagem de erro da operação.

## Persistência local

Somente a preferência visual `linha-fina:sidebar-recolhida` é guardada em
`localStorage`. Não use armazenamento local para dados de negócio.

As chaves legadas `linha-fina:dados:v1` e `linha-fina:sessao:v1` são removidas
na inicialização do store.
