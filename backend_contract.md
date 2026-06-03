# Bullet Overflow - Contrato Inicial de Integração Client ↔ Backend

## Visão Geral

O cliente Godot é responsável apenas pela execução da partida e renderização do jogo.

Autenticação, OAuth, criação de sessão, matchmaking, ranking e leaderboard são responsabilidades da aplicação web e do backend.

O Godot deve receber uma sessão já pronta e conectar ao servidor multiplayer utilizando os dados fornecidos.

---

# Dados Necessários para Iniciar uma Partida

Antes de iniciar uma partida, o cliente precisa receber algo equivalente a:

```json
{
  "match_id": "match_123",
  "player_slot": 1,
  "arena_id": "arena_01",
  "seed": 123456,
  "server_url": "wss://example.com/game",
  "players": [
    {
      "user_id": "user_a",
      "slot": 1,
      "character_id": "character_01"
    },
    {
      "user_id": "user_b",
      "slot": 2,
      "character_id": "character_02"
    }
  ]
}
```

## Descrição dos Campos

| Campo       | Descrição                                         |
| ----------- | ------------------------------------------------- |
| match_id    | Identificador único da partida                    |
| player_slot | Slot controlado por este cliente                  |
| arena_id    | Arena selecionada                                 |
| seed        | Seed utilizada para randomizações determinísticas |
| server_url  | Endereço do servidor multiplayer                  |
| players     | Lista dos participantes da partida                |

---

# Seleção de Arena

A seleção da arena será feita na aplicação web antes do início da partida.

O Godot apenas recebe o identificador da arena e carrega a cena correspondente.

Exemplo:

```json
{
  "arena_id": "arena_01"
}
```

Escopo atual do projeto:

* arena_01
* arena_02
* arena_03

Não existe previsão de geração procedural de mapas.

---

# Seleção de Personagem

A seleção de personagem será feita na aplicação web antes do início da partida.

O cliente receberá o personagem escolhido através da sessão.

Exemplo:

```json
{
  "character_id": "character_01"
}
```

O Godot utilizará esse identificador para carregar os dados do personagem correspondente.

---

# Sistemas Atualmente Implementados no Cliente

## Jogador

* Movimento
* Dash
* Disparo
* Recarga
* Sistema de morte
* Sistema de animações

## Projéteis

* Direção
* Tempo de vida
* Ricochete em paredes
* Identificação do jogador que disparou

## Powerups

Powerups atualmente implementados:

| Tipo        | Efeito                             |
| ----------- | ---------------------------------- |
| RAPID_FIRE  | Redução do cooldown de tiro        |
| SPEED_BOOST | Aumento da velocidade de movimento |
| SHIELD      | Bloqueia um disparo recebido       |

## Fluxo de Partida

* Início de rodada
* Fim de rodada
* Controle de placar
* Respawn dos jogadores entre rodadas

---

# Pacote de Input (Cliente → Servidor)

O cliente foi estruturado para trabalhar com Input Snapshots.

Formato sugerido:

```json
{
  "type": "input",
  "tick": 0,
  "move_x": 0,
  "move_y": 0,
  "aim_x": 0,
  "aim_y": 0,
  "shoot": false,
  "dash": false,
  "reload": false
}
```

Observação:

O cliente deve enviar intenções do jogador e não posições finais.

A movimentação e validação devem ser autoritativas no servidor.

---

# Snapshot de Estado (Servidor → Cliente)

Formato sugerido:

```json
{
  "type": "snapshot",
  "tick": 0,
  "players": [],
  "projectiles": [],
  "powerups": []
}
```

O servidor é responsável por determinar o estado válido da partida.

---

# Evento de Spawn de Powerup

Formato sugerido:

```json
{
  "type": "powerup_spawn",
  "powerup_type": 1,
  "spawn_index": 3
}
```

Observações:

* Os pontos de spawn de powerup já existem nas arenas.
* O cliente prefere receber um índice de spawn ao invés de coordenadas.
* Isso garante sincronização simples entre cliente e servidor.

---

# Evento de Fim de Rodada

Formato sugerido:

```json
{
  "type": "round_end",
  "winner_slot": 1,
  "score_p1": 2,
  "score_p2": 1
}
```

---

# Observações Gerais

* O cliente já possui estrutura preparada para multiplayer através de Input Snapshots.
* As arenas possuem Spawn Points para jogadores e Powerup Spawn Points para itens.
* A seleção de personagem será feita fora do Godot.
* A seleção de arena será feita fora do Godot.
* O Godot apenas consome os dados da sessão e executa a partida.
* O protocolo final pode ser ajustado em conjunto durante a integração.
* O escopo do projeto permanecerá limitado às três arenas e aos sistemas atualmente implementados.
