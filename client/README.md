# Bullet Overflow - Client (GDD + Integracao)

## 1) Fluxo Web (OAuth) -> Godot HTML

Objetivo: manter o login e OAuth no site e apenas entregar a sessao para o jogo. Implementado (login local + OAuth 42, ver `AUTH.md` na raiz do repo).

### Fluxo real
1. Usuario acessa a pagina web e loga (email/senha ou OAuth 42).
2. Frontend guarda o token de sessao e entra no matchmaking (ou modo treino).
3. Backend forma o par e retorna `match_id` e dados basicos da sessao via WebSocket (`match_found`).
4. Frontend embute o jogo HTML (`GodotCanvas.tsx`) e injeta os parametros de sessao no Godot via `window.initGameSession(...)`.

### Como passar dados para o Godot
Opcoes simples e estaveis:
- Query string no HTML exportado (ex: `?token=...&match_id=...`).
- JS bridge chamando um metodo exposto no Godot (HTML5) para setar a sessao.

### Responsabilidades claras
- Web: autenticar, receber token, chamar backend, armazenar leaderboard.
- Godot: receber sessao pronta e rodar a partida.

---

## 2) GDD (Game Design Document)

### 2.1 Visao geral
- Genero: top-down arena shooter vs.
- Jogadores: 2 players.
- Objetivo: eliminar o oponente para pontuar.

### 2.2 Core loop
1. Lobby e selecao de personagem.
2. Arena sorteada.
3. Round inicia e players se enfrentam.
4. Vencedor pontua.
5. Nova rodada com arena sorteada novamente.

### 2.3 Mecanicas principais
- Movimento 8 direcoes.
- Dash com cooldown.
- Tiro com municao e recarga.
- Balas quicam nas paredes (bounce espelhado).
- Tempo de vida das balas: 3s.

### 2.4 Power ups (3 tipos)
1. Rapid Fire: reduz cooldown de tiro por X segundos.
2. Shield: absorve 1 impacto de bala.
3. Speed Boost: aumenta velocidade de movimento por X segundos.

Regras:
- Spawn aleatorio na arena.
- Duracao limitada e sem stacking.
- Coleta por colisao com o player.

### 2.5 Arenas
- Total: 3 arenas.
- Selecao: aleatoria a cada round.
- Cada arena tem layout e cobertura distintos.

### 2.6 Multiplayer e leaderboard
- Multiplayer online com servidor autoritativo.
- Leaderboard global separado do modo treino.
- Ranking baseado em vitorias, K/D ou pontos por partida.

### 2.7 Modo treino (AI)
- Singleplayer local.
- Oponente AI simples (path + aim).
- Nenhum resultado do treino vai para o leaderboard.

### 2.8 Dados de sessao (base)
- match_id
- user_id
- player_slot
- character_id
- arena_id
- seed da partida

### 2.9 Requisitos de UX
- UI simples: vida, municao, cooldowns.
- Feedback claro de power ups ativos.
- Indicador de arena e placar.

---

## 3) Notas de implementacao (sem codigo)
- Backend deve fornecer a sessao e autenticar usuario.
- Godot deve consumir sessao pronta e iniciar o jogo.
- Arena e spawns devem ser deterministas com `session_seed`.
- Leaderboard deve ser atualizado apenas em partidas online.
