# Certificados locais para HTTPS em rede interna

Este diretório contém os arquivos e instruções para gerar certificados locais usados pelo Nginx no ambiente Docker do projeto.

## Objetivo

Esses certificados servem para habilitar HTTPS durante desenvolvimento e testes em rede local, por exemplo acessando a aplicação por `https://localhost:8443` ou por um IP da LAN como `https://192.168.15.99:8443`.

## Arquivos deste diretório

- `local.crt`: certificado público usado pelo Nginx.
- `local.key`: chave privada correspondente ao certificado.
- `openssl-local.cnf`: configuração OpenSSL com os nomes DNS e IPs no SAN.
- `README.md`: instruções de geração e instalação.

## Importante

- Nunca compartilhe ou versione `local.key`.
- O arquivo `local.crt` pode ser distribuído para outros computadores da rede para instalação como certificado confiável.
- Se o IP da máquina host mudar, o certificado pode precisar ser regenerado.
- Se você quiser acessar a aplicação por outro hostname ou IP, também precisará incluir esse valor no `openssl-local.cnf` antes de gerar o certificado.

## Como gerar um novo certificado

Edite o arquivo `openssl-local.cnf` e ajuste os valores necessários em `CN` e `subjectAltName`.

Exemplo de SAN:

```ini
[alt_names]
DNS.1 = localhost
DNS.2 = transcendence.local
IP.1 = 127.0.0.1
IP.2 = 192.168.15.99

## Depois gere o certificado dentro da pasta com o comando:

openssl req -x509 -nodes -days 825 -newkey rsa:2048 \
  -keyout local.key \
  -out local.crt \
  -config openssl-local.cnf
