# Bullet Overflow - Contrato de Integração Cliente ↔ Backend

## Visão Geral

O projeto utiliza autenticação e gerenciamento de sessão pela aplicação web.

O cliente Godot não realiza login nem OAuth diretamente. Toda autenticação é responsabilidade do frontend web e do backend.

Após a autenticação, o backend fornece os dados necessários para que o cliente Godot inicie a partida.

## Requisitos do backend

O backend precisa entregar uma sessão com URL de WebSocket pronta para uso, além dos dados da partida. O cliente Godot é apenas consumidor da sessão e dos eventos de jogo.

O backend também precisa atuar como autoridade de gameplay em partidas online:

* validar inputs
* simular movimento
* simular tiros, projéteis, powerups e colisões
* manter a posição autoritativa dos jogadores
* enviar estados frequentes para o cliente

### Inicialização no Navegador (Web Bridge)

Quando o jogo é executado em um navegador (Web build), o frontend do site/plataforma deve enviar as informações de sessão/partida invocando a função callback exposta globalmente pelo cliente Godot:

`window.initGameSession(dados_da_sessao)`

Essa chamada pode receber um objeto JavaScript ou uma string JSON contendo os dados descritos na seção **Dados de Sessão** abaixo.

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
  "mode": "online",
  "match_id": "match_123",
  "arena_id": "arena_01",
  "seed": 123456,
  "host_id": "host_001",
  "websocket_url": "wss://game.example.com/matches/match_123",
  "game_type": "pvp",

  "players": [
	{
	  "user_id": "user_001",
	  "username": "Username da pessoa",
	  "slot": 1,
	"character_id": "character_01",
	"ready": true,
	"is_bot": false
	},
	{
	  "user_id": "user_002",
	  "username": "Username da pessoa",
	  "slot": 2,
	"character_id": "character_02",
	"ready": true,
	"is_bot": false
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

O cliente mapeia esses ids para as cenas internas do Godot.

## websocket_url

URL do WebSocket da partida.

Exemplo:

```json
{
  "websocket_url": "wss://game.example.com/matches/match_123"
}
```

Esse campo é obrigatório para partidas online reais.

## mode

Para partidas online, o backend deve enviar `online`.

## game_type

Para o fluxo atual de PvP 1x1, o backend deve enviar `pvp`.

## host_id

Identificador do host ou sala. Pode ser vazio se o backend não precisar expor esse valor ao cliente.

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

O cliente Godot mapeia este campo diretamente para seus recursos internos.

Valores válidos atualmente:

* `adventurer`
* `crimson_warrior`
* `explorer`

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

O cliente envia entradas de controle junto com sua posição atual.

Formato esperado:

```json
{
  "type": "player_input",
  "player_slot": 1,

  "position_x": 150.0,
  "position_y": 300.0,

  "move_x": 0,
  "move_y": -1,

  "aim_x": 1,
  "aim_y": 0,

  "shoot": false,
  "dash": false,
  "reload": false
}
```

O servidor utiliza `position_x` e `position_y` para repassar o estado do jogador ao oponente e para validar colisões com projéteis. O cliente é responsável pela simulação local do próprio movimento — o servidor confia na posição recebida, podendo aplicar validações básicas como verificar deslocamento máximo por frame.

O backend deve aceitar uma taxa de entrada de **até 60 mensagens por segundo por jogador** (o client envia 1 input por `_physics_process`, que roda a 60Hz por padrão no Godot). Em uma partida 1x1 isso representa no máximo ~120 msgs/s no total, carga desprezível para o MVP. 30/s deve ser tratado como piso mínimo de compatibilidade, não como o valor real de operação.

## Wrap autoritativo

Como o cliente ainda detecta wrap localmente, o backend deve aceitar também o evento:

```json
{
  "type": "player_wrapped",
  "player_slot": 1,
  "new_pos_x": 100,
  "new_pos_y": 200
}
```

Ao receber esse evento, o backend deve atualizar a posição autoritativa do jogador e refletir essa posição no próximo `player_state`.

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

## Estados que o backend precisa emitir

O cliente espera receber, no mínimo, os seguintes eventos via WebSocket:

* `match_start`
* `round_start`
* `player_spawn`
* `player_state`
* `player_died`
* `projectile_spawn`
* `projectile_destroy`
* `powerup_spawn`
* `powerup_collected`
* `powerup_removed`
* `round_end`
* `match_end`
* `score_update`

### player_state

Esse evento deve ser enviado com frequência suficiente para manter a movimentação estável, idealmente 30 vezes por segundo por jogador.

Formato esperado:

```json
{
  "type": "player_state",
  "player_slot": 1,
  "position_x": 100,
  "position_y": 200,
  "velocity_x": 0,
  "velocity_y": 0,
  "aim_x": 1,
  "aim_y": 0,
  "hp": 1,
  "shield_active": false
}
```

### player_spawn

```json
{
  "type": "player_spawn",
  "player_slot": 1,
  "position_x": 100,
  "position_y": 200
}
```

### projectile_spawn

```json
{
  "type": "projectile_spawn",
  "projectile_id": "proj_01_123",
  "owner_slot": 1,
  "position_x": 100,
  "position_y": 200,
  "direction_x": 1,
  "direction_y": 0,
  "speed": 700
}
```

### powerup_spawn

```json
{
  "type": "powerup_spawn",
  "powerup_id": 1,
  "powerup_type": 0,
  "position_x": 500,
  "position_y": 300
}
```

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
  "powerup_id": 1,
  "powerup_type": 0,
  "position_x": 500,
  "position_y": 300
}
```

`powerup_id` é inteiro (gerado e controlado pelo backend). `powerup_type` é o índice do enum `PowerupTypes.Type`: `0 = RAPID_FIRE`, `1 = SPEED_BOOST`, `2 = SHIELD`. O client não resolve nomes de string para powerups — qualquer envio como `"RAPID_FIRE"` será rejeitado na conversão (`int()` falha).

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
  "direction_y": 0.0,

  "speed": 0.0,
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
  "powerup_type": 0
}
```

`powerup_type` segue o mesmo enum inteiro descrito na seção de spawn (`0 = RAPID_FIRE`, `1 = SPEED_BOOST`, `2 = SHIELD`).

O cliente aplica localmente os efeitos visuais e mecânicos correspondentes ao powerup recebido, e depois remove o powerup

```json
{
  "type": "powerup_removed",
  "powerup_id": 1
}
```
---

## Fim de Rodada

```json
{
  "type": "round_end",
  "winner_slot": 1,
  "player1_score": 3,
  "player2_score": 2
}
```

> **Nota de implementação atual:** o client hoje **ignora** `player1_score`/`player2_score` neste evento. Ele reconstrói o placar localmente (incrementa +1 para o vencedor a cada `round_end` recebido), confiando apenas em `winner_slot`. Os campos de placar estão documentados aqui pelo formato correto para consistência e para permitir uma futura correção (resync de placar caso um evento se perca), mas isso ainda não está implementado no client.

---

## Atualização de Placar

```json
{
  "type": "score_update",
  "player1_score": 4,
  "player2_score": 3
}
```

---

## Fim de Partida

```json
{
  "type": "match_end",
  "winner_slot": 1,
  "player1_score": 5,
  "player2_score": 3
}
```

> **Nota de implementação atual:** o client hoje **não tem nenhum listener funcional** para este evento em modo online. O fim de partida é decidido inteiramente client-side, dentro de `game_manager.end_round()`, comparando o placar local reconstruído contra `SCORE_TO_WIN`. O evento `match_end` enviado pelo backend é recebido, convertido (`MatchState.from_dict`) e emitido via `GameEvents.match_ended`, mas nada está conectado a esse sinal no fluxo de fim de partida — ou seja, **o servidor não controla quando a partida online termina**, apesar do contrato dizer que é autoritativo. Isso é uma lacuna conhecida que precisa ser corrigida no client (ver pendências de sincronização).

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
