# Linha Fina — gestão para ateliês de costura

Front-end do **Linha Fina**, sistema de gestão para ateliês de costura:
ordens de serviço, clientes com ficha de medidas, catálogo de serviços, orçamentos,
agenda de entregas e provas, equipe, vitrine pública e financeiro.

Esta etapa contém **somente a interface**. Não há seed, dados fictícios, banco local,
autenticação simulada ou persistência de negócio no navegador. As páginas carregam
os registros pela futura API REST em Java + Spring Boot (com PostgreSQL) e apresentam
estados honestos de carregamento, vazio, erro e integração pendente.

## Como executar

O site é **HTML + CSS + JavaScript puro, sem build e sem dependências**. Basta servir
a pasta por HTTP (módulos ES exigem servidor — não abra por `file://`).

Esta pasta é a raiz do front-end dentro do repositório (`front/`). Todos os
caminhos são relativos, então o site funciona em qualquer subpasta.

**Com Node.js 18+ (recomendado):**

```bash
cd front
node server.mjs        # http://localhost:5180
```

Alternativas:

```bash
# Python
python -m http.server 5180

# npx (baixa um servidor estático na hora)
npx serve -l 5180 .
```

Abra **http://localhost:5180**. A "Visão geral" (dashboard) fica em `index.html`;
as demais páginas estão em `pages/`.

> No XAMPP, a URL passa a ser `http://localhost/linha-fina/front/`.

## Stack

- **HTML5** — páginas estáticas com navegação convencional (`index.html` + `pages/*.html`)
- **CSS3** — design system próprio em `css/` (tokens, componentes, layout, páginas); sem frameworks
- **JavaScript (ES6+)** — módulos ES nativos, sem bundler, sem React/Vue/jQuery
- **Gabarito** (Fontsource, arquivos locais em `assets/fonts/`) — tipografia com alma de modelagem
- **Ícones Lucide** — SVGs inline gerados em `js/components/icons.js` (zero dependência em runtime)
- **Gráficos SVG próprios** — `js/components/charts.js` (área, donut e barras com o tema)
- Back-end futuro: **Java + Spring Boot (REST) + PostgreSQL** — explicitamente fora desta etapa

## Estrutura

```text
front/                      # raiz do front-end dentro do repositório
├── index.html              # Visão geral (dashboard) — entrada da área administrativa
├── server.mjs              # Servidor estático mínimo (Node puro, sem dependências)
├── pages/                  # Demais páginas
│   ├── login.html          #   Login (pública; integração real pendente)
│   ├── vitrine-publica.html#   Vitrine pública do ateliê (pública)
│   ├── agenda.html         #   Agenda com visões dia/semana/mês
│   ├── ordens-servico.html #   Listagem de OS (drawer de detalhes, filtros, abas)
│   ├── ordem-servico-form.html # Criação/edição de OS (?id=…, ?cliente=…)
│   ├── orcamentos.html    #   Orçamentos (aprovar, recusar, converter em OS, duplicar)
│   ├── clientes.html       #   Lista de clientes (busca, situação financeira)
│   ├── cliente-detalhe.html#   Perfil + ficha de medidas (?id=…)
│   ├── servicos.html       #   Catálogo de serviços
│   ├── vitrine.html        #   Gestão da vitrine pública
│   ├── equipe.html         #   Equipe e distribuição de trabalho
│   ├── financeiro.html     #   Pagamentos e evolução financeira
│   ├── relatorios.html     #   Indicadores por período
│   ├── configuracoes.html  #   Ateliê, horários, folgas e preferências
│   └── nao-encontrada.html #   404 no tom do sistema
├── css/
│   ├── fonts.css           # @font-face Gabarito (self-hosted)
│   ├── variables.css       # Design tokens (paleta oficial)
│   ├── reset.css           # Reset enxuto
│   ├── global.css          # Base, costura (.stitch), campos, badges, utilidades
│   ├── layout.css          # Shell: sidebar, header, gaveta mobile, marca
│   ├── components.css      # Botões, cards, tabelas, modais, drawer, toasts…
│   └── pages.css           # Blocos específicos por página
├── js/
│   ├── app/                # boot, store (dados), sessão, rotas
│   ├── components/         # UI compartilhada: dom, icons, ui, toast, modal,
│   │                       #   drawer, confirm, datatable, charts, layout, arte
│   ├── pages/              # Um controlador por página (dashboard, agenda…)
│   ├── services/
│   │   ├── api/            # Cliente HTTP e módulos por entidade (fetch nativo)
│   │   └── estatisticas.js # Derivações puras sobre os registros reais
│   └── utils/              # Formatação pt-BR, status, validação
└── assets/
    ├── fonts/              # Gabarito woff2 (latin + latin-ext)
    └── favicon.svg
```

## Camada de dados e a futura API

- **Páginas → `js/app/store.js` → módulos de entidade → cliente HTTP → API REST.**
- O store inicia com coleções vazias e expõe estados explícitos:
  `carregando`, `carregado`, `vazio`, `erro` e `sem-integracao`.
- Mutações são assíncronas e retornam
  `{ ok, status, data, error }`; nunca lançam exceções não tratadas nem exibem
  sucesso falso.
- Os indicadores são derivações puras dos registros recebidos, em
  `js/services/estatisticas.js`.
- O navegador guarda apenas a preferência visual
  `linha-fina:sidebar-recolhida`. Nenhum dado de cliente, OS, orçamento,
  pagamento, equipe ou sessão é persistido localmente.

### Estados exibidos por cada situação

| Situação                                  | O que a tela mostra                                                              |
| ----------------------------------------- | -------------------------------------------------------------------------------- |
| API não configurada                       | aviso de integração pendente; nenhuma requisição é disparada; nenhum número fictício |
| API configurada, ainda carregando         | estado de carregamento com "Tentar novamente" ao lado do erro                   |
| API configurada, sem registros            | aviso "a API respondeu, mas não há registros" + estado vazio por tabela/página   |
| API configurada, com registros            | conteúdo real derivado dos registros                                              |
| Falha de comunicação ou erro HTTP         | bloco de erro com o motivo e botão "Tentar novamente" (`recarregarDados()`)      |
| Operação em andamento                     | barra global de status + botão desabilitado com spinner                          |
| Operação concluída pela API               | barra de sucesso + `toast` — somente após `resultado.ok`                         |
| Operação não concluída                    | barra de erro com a mensagem real; **nunca** mensagem de sucesso                  |

Em falha de comunicação, os indicadores financeiros exibem `—` (nunca `R$ 0,00`),
para que uma falha de rede não pareça um resultado real.

### Navegação e deep-links

- Todas as URLs internas são montadas por `caminho()` em `js/app/rotas.js`, que
  resolve o caminho relativo à página atual (`pages/agenda.html` a partir da
  raiz, `agenda.html` a partir de `pages/`). Nenhum link é escrito à mão.
- Páginas filhas mantêm o item do menu-pai destacado (`ordem-servico-form`
  → *Ordens de serviço*, `cliente-detalhe` → *Clientes*).
- Deep-links que dependem de dados reais (`?id=` para editar uma OS, `?os=`
  para abrir o drawer, `?cliente=` para pré-selecionar) **esperam a resposta da
  API**. Enquanto a carga está em andamento a página mostra o estado de
  carregamento; só afirma "não encontrada" depois de a API responder.
- Registros incompletos (campo ausente na resposta) não derrubam a página:
  buscas e ordenações usam `textoSeguro`, `contemTexto` e `compararTexto`
  (`js/utils/format.js`).

### Configuração em runtime

O navegador não lê `.env` diretamente. Antes de carregar os módulos da aplicação,
defina a configuração no HTML de execução ou em um script carregado antes deles:

```html
<script>
  window.LF_API_CONFIG = {
    baseUrl: 'http://localhost:8080/api',
    timeoutMs: 10000,
    credentials: 'include',
    headers: {}
  }
</script>
```

As rotas também são configuráveis e **não estão fixadas neste projeto** porque o
contrato do Spring Boot ainda não foi confirmado:

```html
<script>
  window.LF_API_ENDPOINTS = {
    'clientes.listar': '/clientes',
    'clientes.criar': '/clientes',
    'clientes.obter': '/clientes/{id}',
    // demais chaves conforme o contrato REST oficial
  }
</script>
```

Sem rota configurada, a operação não executa `fetch` e a interface informa que a
integração está pendente. A lista completa de chaves lógicas está em
`js/services/api/index.js`.

## Recursos que aguardam o back-end real

- Autenticação, sessão, papéis e permissões.
- CRUD autoritativo de clientes, serviços, OS, orçamentos, equipe, vitrine e
  configurações.
- Códigos sequenciais, IDs, transições de status, conversão de orçamento, cálculo
  financeiro, pagamentos, cobrança e recorrência.
- Prazos oficiais, prioridade de fila e notificações enviadas.
- Exportação CSV/PDF e relatórios persistidos pelo servidor.
- Horário de funcionamento oficial e dias de folga (o padrão do front-end
  significa "não informado" e não fecha o ateliê por conta própria).
- Fechamento real do ateliê na agenda e cálculo oficial do valor final da OS.

A interface preserva formulários, validações e feedback de operação, mas sinaliza
explicitamente quando a API ainda não está disponível.

## Auditoria funcional

A auditoria percorre todas as páginas em quatro estados reais da API
(`sem-integração`, `vazio`, `erro` e `com dados`) e em quatro larguras
(390, 768, 1280 e 1920 px). O que foi verificado:

| Verificação | Resultado |
| ----------- | --------- |
| Links internos de todas as páginas | 151 verificados, 0 quebrados |
| Navegação mobile (gaveta, busca, recolher sidebar) | 0 problemas |
| Abas (agenda, OS, orçamentos, relatórios) | `aria-selected`, `tab--ativa`, `tabindex` e conteúdo conferidos |
| Deep-links (`?id=`, `?os=`, `?cliente=`) | carregam após a resposta da API |
| Item de menu destacado em sub-páginas | correto em todas |
| Buscas, filtros, ordenação, paginação e switches | produzem efeito observável |
| Erros de console e `pageerror` | 0 nos quatro estados |
| Overflow horizontal da página | 0 nas quatro larguras |
| Acessibilidade (axe-core) | 0 violações |
| Sintaxe de todos os módulos JS | 41 arquivos, 0 falhas |

As abas **não estavam quebradas**: o defeito real era a resolução de caminhos
em `js/app/rotas.js`, que fazia todo link do menu responder **404** a partir de
qualquer página em `pages/`. Os demais pontos corrigidos na auditoria foram o
destaque do menu-pai em sub-páginas, os *deep-links* que dependiam da API, os
switches que não atualizavam o próprio estado e o tratamento de registros
incompletos vindos da API.
