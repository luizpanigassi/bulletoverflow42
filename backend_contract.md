# Bullet Overflow - Contrato de Integração Cliente ↔ Backend

## Visão Geral

O projeto utiliza autenticação e gerenciamento de sessão pela aplicação web.

O cliente Godot não realiza login nem OAuth diretamente. Toda autenticação é responsabilidade do frontend web e do backend.

Após a autenticação, o backend fornece os dados necessários para que o cliente Godot inicie a partida.

---

# Fluxo Geral

```text
Usuário acessa o site
		↓
Frontend inicia OAuth
		↓
Backend autentica usuário
		↓
Backend cria sessão da partida
		↓
Frontend recebe dados da sessão
		↓
Frontend carrega o jogo Godot
		↓
Godot recebe os dados da sessão
		↓
Partida inicia
```

---

# Dados de Sessão

O cliente Godot espera receber uma sessão contendo:

```json
{
  "match_id": "match_123",
  "arena_id": "arena_01",
  "seed": 123456,

  "players": [
	{
	  "user_id": "user_001",
	  "username": "Username da pessoa",
	  "slot": 1,
	  "character_id": "character_01"
	},
	{
	  "user_id": "user_002",
	  "username": "Username da pessoa",
	  "slot": 2,
	  "character_id": "character_02"
	}
  ]
}
```

---

# Campos Obrigatórios

## match_id

Identificador único da partida.

Exemplo:

```json
{
  "match_id": "match_123"
}
```

---

## arena_id

Arena selecionada para a partida.

Atualmente existem apenas 3 arenas.

Valores válidos:

```text
arena_01
arena_02
arena_03
```

---

## seed

Seed utilizada para elementos determinísticos da partida.

Exemplo:

```json
{
  "seed": 123456
}
```

---

## players

Lista contendo exatamente dois jogadores.

Cada jogador deve possuir:

```json
{
  "user_id": "user_001",
  "slot": 1,
  "character_id": "character_01"
}
```

---

## slot

Define qual jogador é Player 1 e qual é Player 2.

Valores válidos:

```text
1
2
```

---

## character_id

Personagem previamente escolhido pelo jogador na aplicação web.

O cliente Godot apenas consome esse valor.

---

## Campos adicionais do jogador

Cada jogador pode conter os seguintes campos opcionais:

```json
{
  "username": "Nomedousuário",
  "is_bot": false
}
```

### username

Nome exibido pelo cliente durante a partida.

Caso ausente, o cliente poderá utilizar um valor padrão.

### is_bot

Indica se o participante é controlado por IA.

Valores válidos:

```json
true
false
```
## Input do Jogador

O cliente envia apenas entradas de controle.

Formato esperado:

```json
{
  "type": "player_input",

  "move_x": 0,
  "move_y": -1,

  "aim_x": 1,
  "aim_y": 0,

  "shoot": false,
  "dash": false,
  "reload": false
}
```

O servidor é responsável por validar e simular os efeitos dessas entradas.

# Formato da Partida

A partida utiliza o formato "Vai a Cinco".

Regras:

* Cada eliminação encerra a rodada.
* O vencedor da rodada recebe 1 ponto.
* Após um pequeno intervalo uma nova rodada é iniciada.
* A arena permanece a mesma durante toda a partida.
* O primeiro jogador a atingir 5 pontos vence.
* Ao atingir 5 pontos a partida é encerrada.
* O cliente exibe uma tela de vitória antes de retornar ao fluxo de matchmaking.

---

## Sistema de Ranking

Ao término da partida:

* O vencedor recebe +3 pontos de ranking.
* O perdedor recebe -1 ponto de ranking.

O cálculo e persistência do ranking são responsabilidade exclusiva do backend.

O cliente Godot não realiza qualquer cálculo ou atualização de ranking.

---

# Sistema de Arenas

Atualmente existem 3 arenas.

A arena é definida antes do início da partida.

O cliente recebe:

```json
{
  "arena_id": "arena_02"
}
```

e carrega a arena correspondente.

---

# Sistema de Powerups

Existem atualmente 3 powerups:

```text
RAPID_FIRE
SPEED_BOOST
SHIELD
```

### Rapid Fire

Reduz o cooldown entre disparos temporariamente.

### Speed Boost

Aumenta a velocidade de movimentação temporariamente.

### Shield

Bloqueia um impacto de projétil.

---

## Autoridade dos Powerups

O servidor é responsável por:

* Definir quando um powerup aparece.
* Definir qual powerup apareceu.
* Definir onde o powerup apareceu.
* Validar a coleta do powerup.
* Informar aos clientes qual jogador coletou o powerup.

O cliente é responsável por:

* Exibir o powerup na arena.
* Exibir ícones e efeitos visuais.
* Aplicar efeitos locais de gameplay.
* Controlar temporizadores visuais dos buffs.

---

# Multiplayer

O servidor será autoritativo.

O cliente envia apenas entradas do jogador.

Exemplos:

* movimento
* direção de mira
* disparo
* dash
* reload

O servidor valida as ações e replica o estado para os clientes.

---

# Leaderboard

O cliente Godot não atualiza o leaderboard.

Fluxo esperado:

```text
Partida termina
		↓
Backend identifica vencedor
		↓
Backend salva resultado
		↓
Backend atualiza ranking
```

---

# Eventos Esperados

## Início de Partida

```json
{
  "type": "match_start",
  "match_id": "match_123"
}
```
---

## Início do round

```
{
  "type": "round_start",
}
```

---

## Spawn dos players

```
{
  "type": "player_spawn",

  "player_slot": 1,

  "character_id": "adventurer",

  "position_x": 100,
  "position_y": 250
}
```

---

## Spawn de Powerup

Enviado pelo servidor quando um powerup aparece na arena.

```json
{
  "type": "powerup_spawn",
  "powerup_id": "pw_001",
  "powerup_type": "RAPID_FIRE",
  "spawn_point_id": 2
}
```

---

## Replicação de player_state

Define a posição do player, ou seja, onde ele está, não pra onde ele está se movendo

```
{
  "type": "player_state",

  "player_slot": 1,

  "position_x": 150.0,
  "position_y": 300.0,

  "velocity_x": 0.0,
  "velocity_y": 0.0,

  "aim_x": 1.0,
  "aim_y": 0.0
}
```

---

## Spawn do projétil

O servidor define onde o tiro aparece e pra onde ele vai

```
{
  "type": "projectile_spawn",

  "projectile_id": "proj_001",

  "owner_slot": 1,

  "position_x": 100.0,
  "position_y": 250.0,

  "direction_x": 1.0,
  "direction_y": 0.0
}
```

E define quando o projétil é destruído

```
{
  "type": "projectile_destroy",
  "projectile_id": "proj_001"
}
```

---

## Coleta de Powerup

Enviado pelo servidor quando um jogador coleta um powerup.

```json
{
  "type": "powerup_collected",
  "player_slot": 1,
  "powerup_type": "RAPID_FIRE"
}
```

O cliente aplica localmente os efeitos visuais e mecânicos correspondentes ao powerup recebido, e depois remove o powerup

```
{
	"type": "powerup_removed",
	"powerup_id": "pw_001",
}
```
---

## Fim de Rodada

```json
{
  "type": "round_end",
  "winner_slot": 1,
  "score_p1": 3,
  "score_p2": 2
}
```

---

## Atualização de Placar

```json
{
  "type": "score_update",
  "score_p1": 4,
  "score_p2": 3
}
```

---

## Fim de Partida

```json
{
  "type": "match_end",
  "winner_slot": 1,
  "score_p1": 5,
  "score_p2": 3
}
```

---

# Escopo Atual

O projeto atual contempla:

* Multiplayer 1x1
* 3 arenas
* Sistema de rounds
* Formato vai a cinco
* 3 powerups
* OAuth via aplicação web
* Leaderboard global
* Modo treino sem impacto no ranking

Qualquer funcionalidade fora dessa lista deve ser considerada fora do escopo atual do projeto.
