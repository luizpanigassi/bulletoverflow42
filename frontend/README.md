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
│   ├── GodotCanvas.tsx     # Ponte JavaScript/WASM que injeta a sessão na Godot
│   ├── TermsModal.tsx      # Modal isolado com o texto oficial dos Termos de Serviço
│   └── PrivacyModal.tsx    # Modal isolado com a Política de Privacidade do projeto
├── pages/
│   ├── LoginPage.tsx       # Tela de Autenticação com abas (Login/Cadastro) e controle de Termos
│   ├── ProfilePage.tsx     # Painel de estatísticas e lista de amigos (Model Friendship)
│   ├── Menu.tsx            # Central de seleção de modos de missão baseada no soldado logado
│   ├── AiTrainingPage.tsx  # Orquestrador local para inicialização de partidas contra o Bot
│   ├── LeaderboardPage.tsx # Painel síncrono que consome a API REST do Postgres
│   └── MatchmakingPage.tsx # Orquestrador do ciclo de vida do WebSocket de Fila PvP
├── App.tsx                 # Centralizador do roteamento dinâmico e barreiras de acesso
├── index.css               # Diretivas globais do Tailwind v4 e resets da Godot
└── main.tsx                # Ponto de entrada do ciclo de renderização do React
```

---

## 🔐 Sistema de Autenticação e Proteção de Rotas

O frontend está totalmente preparado para se integrar às rotas do módulo de autenticação (`auth.routes.ts`) do servidor. Atualmente, o fluxo funciona da seguinte forma:

### 1. Guardas de Rotas (`ProtectedRoute`)
- Criamos um componente de barreira no `App.tsx`. Se um usuário tentar acessar diretamente o Menu Principal (`/`), a Fila (`/jogar`), o Treino (`/treino-ia`) ou o Perfil (`/perfil`) sem estar autenticado, o React o redireciona automaticamente via histórico para a página de `/login`.

### 2. Fluxo de Sessão Local e Cadastro (Conformidade Legal)
- **Login/Cadastro Alternável**: A tela `LoginPage.tsx` centraliza os dois fluxos através de abas interativas (*Tabs*).
- **Conformidade Legal**: No fluxo de cadastro, torna-se obrigatório o aceite do Checkbox de Termos e Privacidade. Os textos oficiais foram isolados em subcomponentes reutilizáveis (`TermsModal` e `PrivacyModal`) e rodam sobrepostos em tela por meio de um efeito desfocado (*backdrop blur*), sem desviar o usuário da página.
- **Formulário Seguro**: Utiliza a API moderna do React 19 (`React.SyntheticEvent`) para gerenciar o envio seguro de formulários. Ele extrai a primeira parte do e-mail antes do `@` para gerar o Nickname temporário do soldado e salvar no `localStorage`.
- **OAuth 42**: Botão visual pré-configurado e pronto na interface para disparar o redirecionamento ao endpoint `GET /auth/42` assim que o backend implementar a integração com a API da Intra 42.

### 3. Painel de Perfil (`ProfilePage`)
- Exibe os dados do usuário autenticado coletados de forma segura do navegador.
- Contém a estrutura de blocos visuais pronta para receber o histórico de vitórias do banco (`Model Match`) e a listagem de relacionamentos (`Model Friendship` com status `PENDING`, `ACCEPTED` ou `BLOCKED`) desenhada conforme as regras do Prisma.
- Botão "Sair da Conta" integrado para limpar completamente os tokens e estados do navegador antes de deslogar o jogador.

---

## 🎮 Arquitetura de Fluxos de Jogo e Modos de Missão

O Menu Principal (`Menu.tsx`) atua como uma central de seleção de modos, desacoplando a busca imediata de partidas e abrindo espaço para novas funcionalidades organizadas por Cards responsivos:

- **Modo Combate Online (PvP)**: Direciona o jogador para a fila estável do WebSocket gerenciada pelo Fastify na rota `/jogar`.
- **Modo Simulação contra IA (Treino Offline)**: Rota dedicada `/treino-ia` que instancia o `GodotCanvas` de forma puramente local. Cria metadados estáticos (`mode: "local"`, `is_bot: true`) e injeta uma semente randômica sincronizada no ecossistema do cliente para disparar o comportamento do bot sem depender de conexões de rede.

---

## 🚀 Fluxos de Integração Existentes

### 1. Comunicação HTTP (Para o Desenvolvedor Backend)
- **Leaderboard (`GET /leaderboard`)**: Consome a rota real do Fastify. Possui tratamento nativo para estados de *Loading* (espera do banco de verdade) e *Error boundaries* visuais com cores customizadas para o pódio (1º, 2º e 3º lugares) caso a central do servidor local caia ou esteja offline.

### 2. Fluxo de Fila via WebSocket (Para o Desenvolvedor Backend)
- A tela `MatchmakingPage` abre uma conexão estável em `ws://127.0.0.1:3000/matchmaking/queue?userId=...` injetando o apelido tratado do jogador vindo diretamente do seu perfil logado (sem espaços).
- Possui **função de limpeza (cleanup)**: se o jogador clicar em voltar ou fechar a aba do navegador no Linux, o socket é encerrado no evento e o Fastify o remove da fila FIFO instantaneamente.
- Escuta o payload do tipo `match_found` enviado por `notifyMatchFound` do servidor para capturar os parâmetros dinâmicos.

### 3. Ponte de Inicialização do Jogo e Ajustes de Contenção (Para o Desenvolvedor Godot)
Assim que o evento `match_found` do servidor sinaliza o pareamento (ou quando o modo treino local inicia), o React monta o `GodotCanvas` repassando metadados estruturados via `window.initGameSession(JSON.stringify(session))`.

Para solucionar o comportamento nativo de tela cheia agressivo da exportação Web da Godot 4.4 (que aplica estilos inline e quebra o layout da SPA), implementamos as seguintes correções de engenharia:
- **Nitidez Gráfica vs Layout**: Mantivemos a política de redimensionamento dinâmico da Engine ativa (`canvasResizePolicy`), impedindo o efeito embaçado/pixelado causado por resoluções estáticas esticadas pelo navegador.
- **Isolamento de Contexto (`isolation: 'isolate'`)**: O contêiner pai no React cria um novo contexto de empilhamento, blindando o restante da interface contra vazamentos de renderização do WebAssembly.
- **Sobrescrita Rígida de Estilos inline (`src/index.css`)**: Injetamos regras globais com especificidade máxima (`!important`) direcionadas a `.godot-wrapper canvas`. Isso anula as injeções automáticas de `position: absolute`, `top` e `left` geradas pelo script `/godot/index.js`, travando o canvas rigorosamente dentro do grid responsivo de proporção 16/9 (`aspect-video`) delimitado pelo Tailwind.

---

## 💻 Como Rodar o Frontend Localmente (Linux)

1. Certifique-se de que o backend está rodando e servindo `build/web/` em `/play/` — o frontend carrega a Godot direto de lá, não tem mais cópia própria.
2. Instale as dependências puras do projeto:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento do Vite:
   ```bash
   npm run dev
   ```
