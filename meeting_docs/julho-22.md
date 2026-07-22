# Bullet Overflow - Reunião de Projeto
**Data:** 22/07/2026  
**Participantes:** Luiz, João, Thiago, Lilian

---

# Objetivo

Alinhar o andamento do desenvolvimento, revisar o progresso de cada integrante e definir prioridades para a próxima etapa do projeto.

---

# Status Geral

O projeto já possui uma base funcional composta por:

- Backend principal
- Cliente do jogo em Godot
- Frontend com telas principais
- Docker inicial
- Documentação inicial (ToS, Privacy Policy)

A partir deste ponto, o foco passa a ser **integração entre todos os componentes**, estabilização do ambiente e início dos testes multiplayer.

---

# Decisões da Reunião

## Fluxo do usuário

O fluxo definitivo da aplicação será:

```

Login
↓
Menu Principal
├── Matchmaking
├── Leaderboard
├── Friends
└── Configurações (futuro)
↓
Matchmaking
↓
Jogo (Godot)

```

Antes da parte visual ficar refinada, a prioridade é garantir que todo o fluxo esteja funcionando corretamente.

---

## Frontend (Lilian)

### Status

Concluídas:

- Login
- Cadastro
- Termos de Serviço

O jogo Godot já está embutido no frontend, porém existem problemas de alinhamento da visualização que precisam ser corrigidos.

### Próximos passos

- Corrigir o embed do Godot
- Implementar Menu Principal
- Ajustar fluxo Login → Menu → Matchmaking → Jogo
- Validar integração com o backend

Toda evolução deverá continuar documentada no `README.md` do frontend.

---

## Backend (João)

### Status

- Bug fixes concluídos
- Início do desenvolvimento do banco de dados
- Estrutura inicial para:
    - Friends
    - Leaderboard

### Próximos passos

- Abrir Pull Requests dos bug fixes atuais
- Após merge, criar nova branch para o desenvolvimento do banco de dados
- Evitar desenvolvimento direto na `main`

---

## Infraestrutura (Thiago)

### Status

Docker básico configurado.

Problemas encontrados:

- Docker Compose apresenta falhas em Mac
- Docker Compose apresenta falhas no WSL

### Próximos passos

- Corrigir Docker Compose
- Configurar Nginx
- Permitir testes multiplayer entre duas máquinas
- Migrar posteriormente de certificado autoassinado para Let's Encrypt
- Criar documentação em `docker.md`

---

## Coordenação

Foi definido que toda integração continuará sendo acompanhada continuamente.

Qualquer bloqueio técnico deverá ser comunicado imediatamente ao grupo para evitar atrasos acumulados.

---

# Comunicação

Foi alinhado entre todos que:

- bloqueios devem ser comunicados assim que aparecerem;
- não é necessário esperar resolver um problema sozinho para pedir ajuda;
- pequenas atualizações já são suficientes para permitir o planejamento da equipe.

A comunicação será feita preferencialmente pelo grupo do projeto.

---

# Prazo

## Meta interna

**Final de agosto**

Objetivo:

- projeto funcional;
- integração completa;
- tempo reservado para testes;
- tempo para preparação da defesa da 42.

---

# Próximas Entregas

## João

- [ ] Abrir PR dos bug fixes
- [ ] Criar nova branch do banco
- [ ] Desenvolver Friends
- [ ] Desenvolver Leaderboard

---

## Thiago

- [ ] Corrigir Docker Compose
- [ ] Configurar Nginx
- [ ] Configurar Let's Encrypt
- [ ] Criar `docker.md`
- [ ] Validar testes multiplayer

---

## Lilian

- [ ] Corrigir embed do Godot
- [ ] Criar Menu Principal
- [ ] Integrar fluxo Login → Menu → Matchmaking
- [ ] Atualizar documentação do frontend

---

## Luiz

- [ ] Revisar Pull Requests
- [ ] Acompanhar integração entre frontend, backend e Godot
- [ ] Apoiar resolução de bloqueios técnicos
- [ ] Manter documentação das reuniões

---

# Riscos

## Alto

- Docker Compose ainda não funciona corretamente em todos os ambientes.
- Integração Godot ↔ Frontend ainda apresenta problemas visuais.

## Médio

- Banco de dados ainda está em desenvolvimento.
- Multiplayer depende da estabilização da infraestrutura.

## Baixo

- Funcionalidades secundárias (Friends, Leaderboard e futuras telas) podem ser implementadas após o fluxo principal estar estável.

---

# Dependências

| Tarefa | Depende de |
|---------|------------|
| Integração Frontend | Backend estável |
| Testes Multiplayer | Docker + Nginx |
| Friends | Banco de Dados |
| Leaderboard | Banco de Dados |
| Fluxo completo | Integração Godot + Frontend |

---

# Próxima reunião

Objetivos esperados:

- Revisar Pull Requests
- Validar Docker
- Demonstrar integração Godot + Frontend
- Revisar progresso do banco de dados
- Atualizar riscos e cronograma

---

> **Resumo:** a equipe definiu como prioridade absoluta concluir a integração entre os componentes do projeto, mantendo comunicação constante sobre bloqueios e trabalhando com meta de conclusão até o final de agosto para garantir tempo suficiente de testes e preparação da defesa.