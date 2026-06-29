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

## Game Logic

Responsável por:

* Repassar `player_state` de cada jogador ao oponente
* Rastrear projéteis ativos (posição, direção, dono, tempo de vida)
* Detectar colisão de projétil com jogador (distância entre pontos)
* Emitir `player_died` e `round_end` quando colisão confirmada
* Gerenciar spawn, coleta e remoção de powerups
* Controlar o flow de rounds e encerramento da partida

O servidor é autoridade para **lógica de jogo**: mortes, powerups, rounds e placar.

O cliente é autoridade para **posição e movimento**: o servidor confia na posição recebida via `player_input` e a repassa ao oponente. Validações básicas de deslocamento máximo podem ser aplicadas para detectar anomalias.

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
Clientes enviam player_input (com posição atual)
↓
Servidor repassa estado ao oponente e valida lógica de jogo
↓
Servidor envia eventos
↓
Partida termina
↓
Ranking atualizado

---

# Tick Rate

O servidor processa inputs e atualiza o estado do jogo em ciclos fixos.

Valor recomendado:

30 ticks por segundo

Intervalo:

33 ms

---

# Loop de Processamento

A cada tick:

1. Receber inputs pendentes dos dois clientes

2. Repassar `player_state` de cada jogador ao oponente

3. Se `shoot: true`, registrar novo projétil (posição, direção, timestamp)

4. Atualizar posição dos projéteis ativos (trajetória linear: `pos += dir * speed * delta`)

5. Destruir projéteis com mais de 3 segundos de vida

6. Verificar colisão de cada projétil com cada jogador (distância entre pontos < raio de colisão)

7. Se colisão: emitir `player_died` e `round_end`

8. Verificar fim de partida (placar atingiu 5)

---

# Autoridade do Servidor

O servidor é autoridade para lógica de jogo.

O servidor decide:

* colisão de projétil com jogador
* mortes
* powerups (spawn, coleta, remoção)
* placar
* vencedor de round e de partida

O cliente decide:

* própria posição e movimento
* animações e efeitos visuais locais

O cliente envia sua posição a cada input. O servidor confia nessa posição para repassar ao oponente e calcular colisões. Essa abordagem prioriza simplicidade de implementação para o MVP. Validação completa de física server-side é considerada evolução futura.

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
