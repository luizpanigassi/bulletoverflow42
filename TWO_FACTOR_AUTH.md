# 2FA por email — como funciona

Documento focado especificamente no fluxo de 2FA opcional no login. Pra
resto da autenticação (hash de senha, JWT, proteção de rota), ver `AUTH.md`.

## Fluxo

O 2FA é uma **configuração da conta** (`User.twoFactorEnabled`, ligada ou
desligada no perfil), não mais uma checkbox marcada a cada tentativa de
login — se a conta tem 2FA ativado, todo login passa pelo código por email,
sem exceção.

1. `POST /auth/login` com `{ email, password }`.
2. Servidor verifica email+senha normalmente. Se bater **e** `user.twoFactorEnabled` for `true`:
   - gera um código numérico de 6 dígitos (`generateTwoFactorCode`,
     `server/src/auth/two-factor.ts`);
   - salva em `User.twoFactorCode` + `twoFactorCodeExpiresAt` (10 minutos
     de validade — `TWO_FACTOR_CODE_TTL_MINUTES`);
   - manda por email (`sendTwoFactorEmail`, via nodemailer — ver seção
     SMTP abaixo);
   - responde `{ requires2fa: true, userId }`, **sem token ainda**.
3. Frontend troca a tela de login pela tela de "digite o código"
   (`LoginPage.tsx`).
4. `POST /auth/login/verify-2fa` com `{ userId, code }`:
   - confere se `twoFactorCodeExpiresAt` não passou e se `code` bate;
   - se ok, **limpa** `twoFactorCode`/`twoFactorCodeExpiresAt` (código não é
     reutilizável) e emite o JWT normal (`signSession`), retornando
     `{ token, user }` no mesmo formato do login direto.

Contas com `twoFactorEnabled: false` (padrão) fazem login direto, sem esse
passo extra.

### Ligando/desligando o 2FA (`PATCH /users/:id`)

`ProfilePage.tsx` expõe um toggle que chama
`PATCH /users/:id` com `{ twoFactorEnabled: boolean }` (rota protegida por
`requireAuth`, só o dono da conta pode mudar a própria configuração).

## Schema

```prisma
model User {
  // ...
  twoFactorEnabled       Boolean  @default(false)
  twoFactorCode          String?
  twoFactorCodeExpiresAt DateTime?
}
```

Migrations: `server/prisma/migrations/20260806003953_add_two_factor_auth`
(código/expiração) e `20260814050000_add_two_factor_enabled` (o toggle por
conta).

## Envio de email (SMTP)

`server/src/auth/two-factor.ts` usa **nodemailer**. O transporte é escolhido
em `getTransporter()`, uma única vez por processo (cacheado em
`transporterPromise`):

- **Com `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS` preenchidos no `.env`**: usa
  esse SMTP de verdade — o email chega na caixa real do destinatário.
- **Sem essas variáveis**: cai automaticamente numa conta de teste
  **Ethereal** (`nodemailer.createTestAccount()`) — não entrega em caixa
  real, só gera um link de preview, logado no console
  (`[2FA] email enviado para ... — preview: https://ethereal.email/...`).
  Não precisa de nenhuma credencial pra esse modo.

### Variáveis (`server/.env`, nunca commitado — ver `.env.example`)

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<email da conta>
SMTP_PASS=<senha de app, não a senha normal da conta>
SMTP_FROM="Bullet Overflow <email da conta>"
```

Hoje configurado com Gmail (`bulletoverflow3@gmail.com` + senha de app),
testado e confirmado entregando de verdade (código chegou na caixa real e
validou certinho via `/auth/login/verify-2fa`).

### Gerando a senha de app do Gmail

1. Ativar Verificação em duas etapas na conta:
   `myaccount.google.com/security`.
2. Gerar a senha de app: `myaccount.google.com/apppasswords` — usar essa
   senha de 16 caracteres em `SMTP_PASS`, **não** a senha normal da conta.
3. Contas **muito novas** podem ser bloqueadas pelo Google ao tentar gerar
   a senha de app ("configuração não disponível pra sua conta") — é uma
   proteção anti-abuso temporária, costuma liberar sozinha depois de um
   tempo de uso normal da conta. Usar uma conta já estabelecida evita esse
   bloqueio.

### Docker

`docker/.env` (untracked, usado pelo `docker-compose.app.yml` via
`env_file:`) precisa das mesmas 5 variáveis — o compose já repassa tudo
pro container automaticamente, sem precisar listar em `environment:`.
**Lembrar de rebuildar** (`--build`) depois de editar código do backend —
só reiniciar o container reusa a imagem antiga.

## Frontend

- `ProfilePage.tsx` — toggle "Autenticação em 2 fatores (2FA)" que liga/desliga
  a conta via `PATCH /users/:id`.
- `LoginPage.tsx` — não decide mais nada sobre 2FA; se o login retornar
  `requires2fa` (porque a conta tem o toggle ligado), a tela troca pra um
  campo de código de 6 dígitos + botão "Confirmar código" (chama
  `verify-2fa`) e um "Voltar" (cancela, volta pro formulário normal).

## O que falta / limitações

- Não tem reenvio de código (se expirar, precisa refazer o login do zero).
- Não tem limite de tentativas de código errado (sem rate limit/lockout).
- Provedor SMTP real é Gmail pessoal — não é o ideal pra produção de
  verdade (nem escala nem é a prática recomendada), mas funciona bem pro
  estágio atual do projeto. Serviços como Brevo/SendGrid seriam a
  alternativa mais "correta" se o projeto crescer.
