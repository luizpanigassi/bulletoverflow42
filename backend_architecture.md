# Bullet Overflow - Backend Architecture Guide

## Objetivo

Este documento descreve a arquitetura recomendada para implementação do backend do Bullet Overflow.

O objetivo é servir como guia de desenvolvimento para os membros da equipe, complementando o documento `backend_contract.md`.

O contrato define a comunicação entre cliente e servidor.

Este documento define como o servidor pode ser estruturado internamente.

---

# Filosofia do Projeto

O backend deve priorizar:

* Simplicidade
* Clareza
* Facilidade de manutenção
* Entrega rápida do MVP

Evitar:

* Microservices
* Arquiteturas complexas
* Sistemas genéricos desnecessários
* Otimizações prematuras

O foco é entregar uma experiência multiplayer estável para partidas 1x1.

---

# Stack Recomendada

## Linguagem

TypeScript

Motivos:

* Tipagem forte
* Excelente suporte para WebSocket
* Facilidade de contratação
* Grande quantidade de documentação

---

## Runtime

Node.js

---

## Web Framework

Fastify

Responsável por:

* Endpoints HTTP
* OAuth
* APIs administrativas

---

## Comunicação em Tempo Real

WebSocket

Responsável por:

* Comunicação durante partidas
* Troca de eventos entre servidor e cliente

---

## Banco de Dados

PostgreSQL

Responsável por:

* Usuários
* Ranking
* Histórico de partidas

---

## ORM

Prisma

Responsável por:

* Mapeamento do banco
* Migrações
* Queries

---

# Estrutura Recomendada

src/

├── auth/
│
├── matchmaking/
│
├── matches/
│
├── game/
│
├── websocket/
│
├── leaderboard/
│
├── database/
│
└── main.ts

---

# Responsabilidades dos Módulos

## Auth

Responsável por:

* OAuth
* Login
* Sessões de usuário

Não deve conter lógica de gameplay.

---

## Matchmaking

Responsável por:

* Fila de jogadores
* Formação de partidas
* Criação de match_id

Ao encontrar dois jogadores:

* cria uma Match
* remove ambos da fila

---

## Match

Representa uma partida em andamento.

Responsável por:

* Estado atual
* Rodada atual
* Pontuação
* Jogadores conectados

Cada Match possui:

* match_id
* players
* score
* game_state

---

## Game Simulation

Responsável por:

* Movimento
* Disparos
* Projéteis
* Powerups
* Colisões

Toda lógica de gameplay deve existir aqui.

O cliente nunca é autoridade.

---

## WebSocket

Responsável por:

* Receber inputs
* Enviar eventos
* Gerenciar conexões

Não deve conter lógica de gameplay.

---

## Leaderboard

Responsável por:

* Ranking
* Histórico
* Estatísticas

Executado apenas após o término da partida.

---

# Fluxo Geral do Multiplayer

Jogador conecta
↓
Entra na fila
↓
Matchmaking encontra adversário
↓
Match criada
↓
Servidor envia match_start
↓
Partida inicia
↓
Clientes enviam player_input
↓
Servidor simula gameplay
↓
Servidor envia eventos
↓
Partida termina
↓
Ranking atualizado

---

# Tick Rate

O servidor executa uma simulação fixa.

Valor recomendado:

30 ticks por segundo

Intervalo:

33 ms

---

# Loop de Simulação

A cada tick:

1. Receber inputs pendentes

2. Atualizar movimento dos jogadores

3. Atualizar projéteis

4. Verificar colisões

5. Verificar mortes

6. Verificar fim de rodada

7. Gerar eventos

8. Enviar atualizações aos clientes

---

# Autoridade do Servidor

O servidor é a única autoridade da partida.

O cliente nunca:

* decide dano
* decide mortes
* decide powerups
* decide placar
* decide vencedor

O cliente apenas:

* envia inputs
* exibe estados recebidos

---

# MVP Obrigatório

A primeira versão do backend deve conter apenas:

✓ OAuth

✓ Matchmaking

✓ WebSocket

✓ Movimento

✓ Disparo

✓ Projéteis

✓ Morte

✓ Sistema de Rodadas

✓ Melhor de Cinco

✓ Ranking

---

# Funcionalidades Fora do MVP

Não implementar inicialmente:

* Replay
* Spectator Mode
* Reconexão
* Chat
* Clãs
* Torneios
* Estatísticas avançadas
* Matchmaking por região
* Partidas customizadas

Essas funcionalidades devem ser consideradas pós-MVP.

---

# Ordem Recomendada de Desenvolvimento

## Etapa 1

Servidor sobe corretamente.

Objetivo:

Exibir:

Server Running

---

## Etapa 2

WebSocket funcionando.

Objetivo:

Cliente conecta.

---

## Etapa 3

Receber player_input.

Objetivo:

Logar inputs recebidos.

---

## Etapa 4

Criar MatchManager.

Objetivo:

Criar partidas.

---

## Etapa 5

Implementar player_state.

Objetivo:

Replicar posição dos jogadores.

---

## Etapa 6

Implementar projéteis.

Objetivo:

Criar e destruir tiros.

---

## Etapa 7

Implementar mortes.

Objetivo:

Encerrar rodadas.

---

## Etapa 8

Implementar sistema de pontuação.

Objetivo:

Determinar vencedor da partida.

---

## Etapa 9

Implementar ranking.

Objetivo:

Persistir resultados.

---

## Etapa 10

Integrar frontend web.

Objetivo:

Fluxo completo de autenticação e partida. O frontend web realiza o matchmaking e, ao definir os dados de sessão, deve passá-los para o cliente Godot via a função exposta globalmente no navegador: `window.initGameSession(dados_da_sessao)`.

---

# Definição de Sucesso

O backend será considerado funcional quando:

* Dois jogadores conseguirem se conectar.
* Uma partida iniciar.
* Os jogadores puderem se mover.
* Os tiros funcionarem.
* As rodadas encerrarem corretamente.
* O vencedor receber pontos de ranking.
* O resultado permanecer salvo no banco.

Todo o restante é considerado evolução futura.
