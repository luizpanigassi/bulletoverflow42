# Infraestrutura do projeto Transcendence

Este documento descreve a infraestrutura aplicada ao projeto, o motivo das escolhas técnicas, os principais desafios encontrados e o procedimento de operação para ambiente de desenvolvimento e validação. A stack atual usa um proxy reverso com Nginx e ModSecurity + OWASP CRS, além de backend com autenticação local, 2FA e OAuth 42.

## Visão geral

A infraestrutura expõe a aplicação por um container `waf` baseado em `owasp/modsecurity-crs:nginx`, ouvindo nas portas `8080` e `8443`, conectado à rede externa `transcendence_net`. O WAF roda com `MODSEC_RULE_ENGINE=DetectionOnly`, paranoia 1 e thresholds configurados por ambiente, montando templates do Nginx e um arquivo de override do ModSecurity sem sobrescrever a configuração principal do CRS. 

As regras customizadas atualmente fazem três coisas: habilitam processamento de corpo JSON via `requestBodyProcessor=JSON`, e colocam as rotas `/matchmaking/queue` e `/matches/` em `DetectionOnly` para reduzir interferência no fluxo de websocket e gameplay. Essa abordagem mantém a proteção geral do CRS ativa enquanto reduz o risco de quebra nas rotas mais sensíveis do projeto. 

O backend implementa autenticação tradicional com login/senha, fluxo opcional de 2FA e OAuth com a Intra 42. O fluxo OAuth já possui endpoints de início e callback, troca `code` por token, consulta o perfil do usuário e cria ou atualiza a conta local antes de redirecionar para o frontend com os dados da sessão. 

## Componentes da stack

| Componente | Função | Observações |
|---|---|---|
| WAF (`owasp/modsecurity-crs:nginx`) | Proxy reverso, TLS e inspeção de tráfego | CRS ativo e carregando 932 regras na configuração funcional atual. |
| Nginx templates | Roteamento HTTP/HTTPS e upstream para aplicação | Deve preservar `Host` e `X-Forwarded-Proto` para fluxos de OAuth e navegação pública. |
| ModSecurity override | Regras customizadas do projeto | Ativa JSON e afrouxa inspeção para rotas de matchmaking/matches. |
| Backend | Auth local, 2FA, OAuth 42, emissão de JWT | Expõe `/auth/health`, `/auth/42` e `/auth/42/callback`. |
| Frontend | Login e navegação da aplicação | Já está preparado para disparar o endpoint `GET /auth/42`. |

## Desafios principais

### 1. Integrar WAF sem quebrar a aplicação

O maior desafio foi ativar o ModSecurity com OWASP CRS sem comprometer rotas críticas da aplicação. O projeto usa websocket e payloads JSON, então uma configuração agressiva do CRS poderia bloquear matchmaking, partidas ou outras rotas dinâmicas por falso positivo. 

Outro ponto sensível foi descobrir a forma correta de customizar a imagem `owasp/modsecurity-crs:nginx`. Quando a configuração principal do ModSecurity ou o `setup.conf` eram sobrescritos diretamente, o CRS deixava de carregar corretamente; a configuração estável foi alcançada mantendo a configuração padrão da imagem e aplicando apenas regras adicionais via `modsecurity-override.conf`. 

### 2. Diagnóstico de regras e observabilidade

Durante a ativação do WAF, a diferença entre “container rodando” e “regras realmente carregadas” foi um ponto crítico. O sinal correto de funcionamento foi o log com `rules loaded inline/local/remote: 0/932/0`, o que mostrou que o CRS estava de fato ativo; antes disso, a configuração chegava a subir com apenas `0/3/0`, indicando carregamento incompleto de regras. 

Além disso, o log de auditoria não estava em um arquivo tradicional dentro do container, e a análise prática passou a depender dos logs do próprio container. Isso exige disciplina operacional, porque troubleshooting de segurança agora depende de correlação entre logs de proxy, WAF e backend. 

### 3. Compatibilizar segurança com gameplay em tempo real

Rotas de tempo real são naturalmente mais difíceis de proteger com regras genéricas. Por isso, `/matchmaking/queue` e `/matches/` foram deixadas em `DetectionOnly`, preservando visibilidade sobre tráfego suspeito sem quebrar a experiência do jogo. 

Esse compromisso resolve o problema imediato, mas cria uma responsabilidade futura: revisar periodicamente essas exceções para garantir que não virem pontos cegos permanentes da segurança do sistema. 

### 4. OAuth 42 em ambiente real

O backend exige três variáveis para considerar o OAuth da 42 configurado: `FORTYTWO_CLIENT_ID`, `FORTYTWO_CLIENT_SECRET` e `FORTYTWO_CALLBACK_URL`. O endpoint `/auth/health` já expõe esse diagnóstico com o campo `fortyTwoConfigured`, o que ajuda bastante em testes e deploy.

O principal desafio do OAuth é a dependência de consistência total entre o cadastro na 42 e a infraestrutura exposta publicamente. A callback usada pelo backend precisa ser idêntica à URI cadastrada no provedor, incluindo protocolo, domínio, porta e path; qualquer divergência causa falhas como `redirect_uri mismatch` ou callback inválida. 

### 5. Complexidade operacional

Com proxy/WAF, backend, frontend, banco e autenticação externa, o projeto deixou de ser apenas uma aplicação web simples. Agora há múltiplos pontos de falha, múltiplas fontes de log e dependência de configuração correta de rede, variáveis de ambiente, certificados e headers de proxy. 

Isso aumenta a maturidade do projeto, mas também eleva o custo de manutenção. Qualquer pessoa nova no projeto precisa entender a topologia da stack antes de conseguir depurar algo com segurança. 

## Como subir a infraestrutura

### Aplicação

```bash
cd /caminho/do/projeto
docker compose -f docker/docker-compose.app.yml --env-file docker/.env up -d --build
```

### Proxy/WAF

A rede `transcendence_net` precisa existir antes da subida do compose do proxy, porque ela é declarada como externa. O serviço `waf` usa essa rede para alcançar a aplicação e expor a stack publicamente.

```bash
docker network create transcendence_net || true
docker compose -f docker/docker-compose.proxy.yml --env-file docker/.env up -d
```

## Testes importantes

### Verificar se o WAF carregou corretamente

```bash
docker logs transcendence-waf --tail 20 | grep -i "rules loaded"
```

Resultado esperado: algo como `0/932/0`, indicando que o conjunto de regras do CRS foi carregado corretamente.

### Verificar o health do OAuth

```bash
curl -sk https://SEU_HOST:8443/auth/health
```

Esse endpoint retorna `fortyTwoConfigured`, `callbackUrl` e `frontendUrl`, servindo como primeiro diagnóstico do fluxo OAuth.

### Testar início do OAuth 42

```bash
curl -skI https://SEU_HOST:8443/auth/42
```

Se a configuração estiver correta, a resposta deve ser um redirecionamento para a URL de autorização da 42. O endpoint `/auth/42` monta a URL com base nas credenciais configuradas e redireciona o usuário para o provedor.

### Testar detecção do WAF

```bash
curl -sk -o /dev/null -w "HTTP status: %{http_code}\n" --get https://SEU_HOST:8443/ --data-urlencode "id=1' OR '1'='1"
docker logs transcendence-waf --tail 50 | grep -iE "modsecurity|942100|sqli|anomaly"
```

Em `DetectionOnly`, o esperado é HTTP 200 com log de detecção da regra `942100` para SQL injection. Esse comportamento confirma que o WAF está inspecionando sem bloquear.

## OAuth 42

O fluxo OAuth da aplicação já está preparado no backend. O endpoint `/auth/42` redireciona para a 42, e o endpoint `/auth/42/callback` recebe `code`, consulta o perfil do usuário, cria ou atualiza o cadastro local e redireciona para `/login` no frontend com os parâmetros de autenticação.

Variáveis mínimas esperadas no ambiente do backend:

```env
FORTYTWO_CLIENT_ID=seu_client_id
FORTYTWO_CLIENT_SECRET=seu_client_secret
FORTYTWO_CALLBACK_URL=https://seu-dominio/auth/42/callback
JWT_SECRET=um_segredo_forte
```

A callback precisa refletir exatamente o host público usado no navegador e o cadastro feito na Intra 42. Em ambiente remoto, o teste real do OAuth deve ser feito a partir de um navegador acessando o host público da aplicação, não apenas por SSH.
