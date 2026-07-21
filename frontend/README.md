# 🎮 Bullet Overflow — Frontend Client

Este é o repositório do cliente web do jogo **Bullet Overflow**, desenvolvido em **React 19**, **TypeScript** e **Vite**. A interface foi estilizada utilizando **Tailwind CSS v4** focado em performance absoluta e experiência SPA (Single Page Application) sem sobrecarga de linters na inicialização.

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
│   ├── LoginPage.tsx       # Tela de Autenticação e persistência (React 19 SyntheticEvent)
│   ├── ProfilePage.tsx     # Painel de estatísticas e lista de amigos (Model Friendship)
│   ├── Menu.tsx            # Tela inicial, gerenciamento de Nickname e persistência local
│   ├── LeaderboardPage.tsx # Painel síncrono que consome a API REST do Postgres
│   └── MatchmakingPage.tsx # Orquestrador do ciclo de vida do WebSocket de Fila
├── App.tsx                 # Centralizador do roteamento dinâmico do cliente (SPA)
├── index.css               # Diretivas globais do Tailwind v4
└── main.tsx                # Ponto de entrada do ciclo de renderização do React
```

---

## 🔐 Sistema de Autenticação e Proteção de Rotas

O frontend está totalmente preparado para se integrar às rotas do módulo de autenticação (`auth.routes.ts`) do servidor. Atualmente, o fluxo funciona da seguinte forma:

### 1. Guardas de Rotas (`ProtectedRoute`)
- Criamos um componente de barreira no `App.tsx`. Se um usuário tentar acessar diretamente o Menu Principal (`/`), a Fila (`/jogar`) ou o Perfil (`/perfil`) sem estar autenticado, o React o redireciona automaticamente via histórico para a página de `/login`.

### 2. Fluxo de Sessão Local (Substituição de Stubs)
- **Login Local**: Captura e-mail e senha. Utiliza a API moderna do React 19 (`React.SyntheticEvent`) para gerenciar o envio seguro do formulário. Ele extrai a primeira parte do e-mail antes do `@` para gerar o Nickname temporário do soldado e salvar no `localStorage`.
- **OAuth 42**: Botão visual pré-configurado e pronto na interface para disparar o redirecionamento ao endpoint `GET /auth/42` assim que o backend implementar a integração com a API da Intra 42.

### 3. Painel de Perfil (`ProfilePage`)
- Exibe os dados do usuário autenticado coletados de forma segura do navegador.
- Contém a estrutura de blocos visuais pronta para receber o histórico de vitórias do banco (`Model Match`) e a listagem de relacionamentos (`Model Friendship` com status `PENDING`, `ACCEPTED` ou `BLOCKED`) desenhada conforme as regras do Prisma.
- Botão "Sair da Conta" integrado para limpar completamente os tokens e estados do navegador antes de deslogar o jogador.

---

## 🚀 Fluxos de Integração Existentes

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
