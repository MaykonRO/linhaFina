# Product

<!-- impeccable:product-schema 1 -->

## Platform
web

## Stack
HTML5 + CSS3 + JavaScript ES6+ puro, módulos ES nativos, sem framework, bundler ou etapa de build. Ícones Lucide como SVG inline e gráficos SVG próprios. Back-end futuro: Java + Spring Boot (REST) + PostgreSQL, explicitamente fora desta etapa.

## Users
Primário: a dona e a equipe de um pequeno ateliê de costura brasileiro (costureiras e atendimento), gerenciando ordens de serviço no dia a dia, em desktop e celular. Autenticação, sessão e papéis futuros serão definidos pelo back-end. Secundário: clientes finais do ateliê vendo a vitrine pública.

## Product Purpose
O Linha Fina gerencia o fluxo do ateliê: ordens de serviço (OS), clientes com ficha de medidas, catálogo de serviços, orçamentos, agenda de entregas e provas, equipe, vitrine pública e financeiro. Esta etapa entrega a interface completa, navegável e pronta para receber a API REST Spring Boot, sem dados de negócio fictícios ou simulações de operação.

## Positioning
Fluxo construído sobre os rituais específicos de ateliê: prova intermediária, ficha de medidas, conversão orçamento→OS e acompanhamento de ordens. Ferramentas genéricas de gestão não carregam essas etapas.

## Operating Context
Somente front-end. O estado nasce vazio e é carregado da API real. Não há seed, repositório simulado, autenticação fictícia ou persistência de negócio no navegador. A única preferência local é `linha-fina:sidebar-recolhida`. A interface fica em pt-BR.

## Capabilities and Constraints
- 14 áreas: dashboard, OS (listar/criar/editar/cancelar), clientes (+ medidas), serviços, orçamentos (aprovar/recusar/converter), agenda (dia/semana/mês), equipe, vitrine pública + administração, financeiro, relatórios, configurações e login.
- Sem back-end nesta etapa: ações dependem da API e informam claramente quando a integração está pendente.
- Sem pagamentos reais, cobrança, conversão efetiva, avanço de status ou geração de arquivos até a API responder.
- Dados coerentes entre páginas; todos os indicadores derivam dos mesmos registros reais.
- A troca da camada de dados deve exigir alteração mínima nas páginas.

## Brand Commitments
Nome: Linha Fina. Paleta exata: fundo #121018, superfície #1B1826, elevado #242033, borda #2E2A3E, texto #F2EFFA / #B2AEC2 / #716C85, roxo #8B5CF6 (hover #6D3FD1), azul #3B82F6, status #4F9D69 / #D9A441 / #E24C6B / #3B82F6, auxiliares #2DD4BF / #F472B6 / #38BDF8 / #A78BFA / #FB923C / #818CF8. Tema escuro violeta, roxo como cor de ação primária e seleção. Proibido: gradientes exagerados, neon, glass indiscriminado, textura granulada, grandes áreas em roxo saturado. Logotipo tipográfico + símbolo minimalista de costura (linha/agulha).

## Evidence on Hand
Não existem fotos, dados ou ativos de marca reais. Imagens de peças são ilustrações autorais sintéticas, identificadas como ilustrações e nunca apresentadas como trabalhos reais do ateliê.

## Product Principles
1. Precisão e calma: o console lê o dia do ateliê de relance; números tabulares e sempre atuais.
2. Um conjunto de dados coerente: toda página deriva dos mesmos registros reais; nenhum número fixo em página.
3. Honestidade operacional: estados vazios, erro, carregamento e integração pendente são explícitos; sucesso só aparece após resposta real da API.
4. Seam para a API futura: componentes nunca tocam armazenamento diretamente; store e módulos de entidade são a fronteira.
5. Ofício consistente: uma linguagem de componentes, vocabulário de cores de status e estados operacionais reais.

## Accessibility & Inclusion
Contraste AA sobre superfícies escuras, foco de teclado visível, alvos de toque adequados, tabelas utilizáveis a 390 px, respeito a `prefers-reduced-motion`.
