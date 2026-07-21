# 🎮 Bullet Overflow — Frontend Client

Este é o repositório do cliente web do jogo **Bullet Overflow**, desenvolvido em **React 19**, **TypeScript** e **Vite (com compilador SWC escrito em Rust)**. A interface foi estilizada utilizando **Tailwind CSS v4** focado em performance absoluta e experiência SPA (Single Page Application) sem sobrecarga de linters na inicialização.

---

## 🛠️ Stack Tecnológica

- **Core**: React 19 + TypeScript (strict mode)
- **Build Tool / Compiler**: Vite
- **Estilização**: Tailwind CSS v4 (configuração direta via import nativo do Vite)
- **Roteamento**: React Router Dom v6
- **Engine de Jogo**: Integração nativa com Godot 4.4 Web via Canvas API

---

## 📁 Estrutura de Arquivos Criada

```text
src/
├── components/
│   └── GodotCanvas.tsx     # Ponte JavaScript/WASM que injeta a sessão na Godot
├── pages/
│   ├── Menu.tsx            # Tela inicial, gerenciamento de Nickname e persistência local
│   ├── LeaderboardPage.tsx # Painel síncrono que consome a API REST do Postgres
│   └── MatchmakingPage.tsx # Orquestrador do ciclo de vida do WebSocket de Fila
├── App.tsx                 # Centralizador do roteamento dinâmico do cliente (SPA)
├── index.css               # Diretivas globais do Tailwind v4
└── main.tsx                # Ponto de entrada do ciclo de renderização do React
```

---

## 🚀 Fluxos de Integração Implementados

### 1. Comunicação HTTP (Para o Desenvolvedor Backend)
- **Leaderboard (`GET /leaderboard`)**: Consome a rota real do Fastify. Possui tratamento nativo para estados de *Loading* (espera do banco de verdade) e *Error boundaries* visuais caso a central do servidor local caia ou esteja offline.

### 2. Fluxo de Fila via WebSocket (Para o Desenvolvedor Backend)
- A tela `MatchmakingPage` abre uma conexão estável em `ws://127.0.0.1:3000/matchmaking/queue?userId=...` injetando o apelido tratado do jogador (sem espaços).
- Possui **função de limpeza (cleanup)**: se o jogador clicar em voltar ou fechar a aba do navegador no Linux, o socket é encerrado no evento e o Fastify o remove da fila FIFO instantaneamente.
- Escuta o payload do tipo `match_found` enviado por `notifyMatchFound` do servidor para capturar os parâmetros dinâmicos.

### 3. Ponte de Inicialização do Jogo (Para o Desenvolvedor Godot)
Assim que o evento `match_found` do servidor sinaliza o pareamento, o React monta o `GodotCanvas` repassando as seguintes propriedades rígidas via semente idêntica:

- Mapeia o `<canvas id="canvas">` imediatamente no DOM para evitar atrasos de carregamento da Engine.
- Transmite via objeto estruturado para o método global `window.initGameSession(JSON.stringify(session))` os metadados sincronizados:
  - `websocket_url`: A URL `ws://` dedicada para aquela partida específica gerenciada pelo Fastify.
  - `seed`: Semente oficial gerada pelo backend para que ambos os cenários/obstáculos fiquem idênticos.
  - `local_player_slot`: Identificador numérico (`1` ou `2`) para o Godot saber quem é o dono do teclado local.

---

## 💻 Como Rodar o Frontend Localmente (Linux)

1. Certifique-se de que a pasta `public/godot/` contém os arquivos de build gerados pelo Godot Web (`index.js`, `index.wasm`, `index.pck`).
2. Instale as dependências puras do projeto:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento do Vite:
   ```bash
   npm run dev
   ```
