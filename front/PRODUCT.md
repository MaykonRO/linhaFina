# Linha Fina — MVP

## Escopo

Sistema simples de gestão para ateliê de costura, adequado a um projeto acadêmico de Java e Spring Boot.

Mantém somente:

- Login com sessão e logout.
- CRUD de clientes.
- CRUD de ordens de serviço vinculadas a clientes.

## Regras

- Cliente possui nome, telefone e e-mail.
- Cliente com OS vinculada não pode ser excluída.
- OS possui cliente, descrição, valor, data de entrada, previsão e status.
- Status: pendente, em andamento, concluída e cancelada.
- Não há mocks nem persistência de negócio no navegador.

## Interface

- HTML, CSS e JavaScript puro com módulos ES.
- Tema escuro violeta.
- Sidebar com Dashboard, Clientes e Ordens de Serviço.
- Responsividade e componentes reutilizáveis.
- Não existem páginas de orçamentos, serviços, equipe, vitrine, financeiro, relatórios, configurações ou agenda.

## Identidade

Nome: Linha Fina. Paleta preservada: fundo `#121018`, superfície `#1B1826`, elevado `#242033`, borda `#2E2A3E`, texto `#F2EFFA`, roxo `#8B5CF6` e azul `#3B82F6`. Logotipo tipográfico e símbolo minimalista de costura.

## Dados

Frontend e backend usam a mesma API REST. O store carrega clientes e ordens do PostgreSQL e aguarda a resposta real antes de confirmar uma operação.
