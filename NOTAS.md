# 🗺️ Plano de Arquitetura e Divisão de Tarefas - ft_transcendence

Este documento detalha a divisão estratégica de responsabilidades para a equipe de 4 integrantes, mapeando os papéis de gestão exigidos pelo PDF oficial.

---

## 👥 Papéis e Atribuições Técnicas

### 🧑‍💻 1. Luiz (Game Client)
*   **Papel de Gestão:** Product Owner (PO)
*   **Foco Técnico:** Godot Engine (GDScript) & WebAssembly (HTML5 Canvas)
*   **Responsabilidades:**
    *   Desenvolver o loop principal do jogo de forma isolada e local.
    *   Criar mecânicas de colisão, física de movimentação e habilidades especiais dos personagens.
    *   Desenvolver o módulo de **Inimigo de IA** para o modo Single Player (Treino).
    *   Exportar o projeto final da Godot em WebAssembly estático para ser embutido na página web.
    *   Garantir IDs estáveis de texto no código para comunicação com a Web.

### 🧑‍💻 2. Lilian (Fullstack Web & Integration)
*   **Papel de Gestão:** Technical Lead / Architect
*   **Foco Técnico:** Frontend (Next.js/React) & Tempo Real (Node.js + WebSockets)
*   **Responsabilidades:**
    *   **Frontend UI:** Desenvolver a interface web onde o jogo será embutido usando um elemento `<canvas>`.
    *   **Lógica de Matchmaking (Frontend):** Criar as telas dinâmicas de busca de partida e lobby de espera.
    *   **Servidor de Sockets (Backend):** Desenvolver o servidor de **WebSockets** em Node.js para gerenciar salas em tempo real e rotear as posições de raquetes/inputs dos jogadores pela rede.
    *   **Integração:** Injetar dados iniciais via JSON na Godot e capturar o JSON de resultado final da partida emitido pela engine para enviar ao banco de dados.

### 🧑‍💻 3. Thiago (Cybersecurity & DevOps)
*   **Papel de Gestão:** QA / DevOps Lead
*   **Foco Técnico:** Infraestrutura de Servidores, Redes Seguras & Banco de Dados (PostgreSQL)
*   **Responsabilidades:**
    *   **Infraestrutura:** Criar o ambiente multicontêiner usando `docker-compose`.
    *   **Proxy Reverso & TLS:** Configurar o Nginx para servir o frontend e backend obrigatoriamente através de conexões seguras **HTTPS/TLS**.
    *   **Cybersecurity:** Implementar um **WAF (Web Application Firewall)** para proteção do backend contra injeções SQL e ataques XSS.
    *   **Persistência:** Instalar e gerenciar o banco de dados **PostgreSQL** em um volume Docker seguro.

### 🧑‍💻 4. João (Backend Core & Web UI)
*   **Papel de Gestão:** Project Manager / Scrum Master
*   **Foco Técnico:** Backend REST API (Node.js / Express ou NestJS) & Autenticação
*   **Responsabilidades:**
    *   **Modelagem de Dados:** Estruturar o banco usando um **ORM** (como Prisma ou TypeORM) para gerenciar tabelas de Usuários, Amigos, Bloqueios e Histórico de Partidas.
    *   **Segurança de Login:** Implementar criptografia de senhas usando técnicas de *Hashing* e *Salting* robustas.
    *   **Autenticação em Dois Fatores (2FA):** Gerar QR Codes e validar tokens temporários para o login seguro do usuário.
    *   **OAuth2 (Login 42):** Integrar a API da 42 para autenticação externa dos alunos.
    *   **API REST:** Criar as rotas que alimentam o painel de histórico do usuário e a tabela de classificação (*Leaderboard*).
    *   **Suporte Frontend:** Auxiliar na criação das telas estáticas/formulários do site (Páginas de Perfil, Termos de Serviço e Políticas de Privacidade).

---

## 📈 Resumo do Escopo para Avaliação (14 Pontos)

1.  **Framework Frontend + Backend (Node/React/Next.js):** 2 pontos
2.  **Uso de ORM no Banco de Dados (PostgreSQL):** 1 ponto
3.  **Módulo de Jogo Web Completo (Godot via WebAssembly):** 2 pontos
4.  **Jogadores Remotes (Multiplayer via WebSockets):** 2 pontos
5.  **Inimigo de IA (Modo treino/singleplayer na Godot):** 2 pontos
6.  **Gerenciamento de Usuário Padrão (Perfil/Amigos/Chat):** 2 pontos
7.  **Autenticação Remota (OAuth - Login 42):** 1 ponto
8.  **Histórico de Partidas e Estatísticas:** 1 ponto
9.  **Sistema de Torneio (Chaveamento/Brackets):** 1 ponto

⚠️ *Nota: O escopo evita o uso do módulo de Blockchain para garantir compatibilidade nativa com o Server-Side Rendering (SSR) e otimizar o tempo de desenvolvimento da equipe.*
