# Collaborative Editor

Sistema de edição colaborativa de documentos em tempo real utilizando WebSocket, RabbitMQ, Worker assíncrono, Cache Distribuído (Redis) e Transações Seguras (Outbox Pattern).

---

# 1. Visão Geral

Este projeto implementa um editor colaborativo onde múltiplos usuários podem acessar um mesmo documento simultaneamente.

Os principais desafios arquiteturais identificados foram:

- manter usuários sincronizados em tempo real;
- permitir comunicação bidirecional entre navegador e servidor;
- garantir leitura instantânea e baixa latência sob alta concorrência;
- evitar processamento pesado dentro da API principal;
- garantir a integridade dos dados e prevenir perda de mensagens em cenários de falha de rede (evitar dual-write).

Para resolver esses desafios, a arquitetura utiliza WebSockets para o tempo real, Redis para gerenciamento de estado em memória, RabbitMQ para processamento assíncrono e o padrão Transactional Outbox (com SQLite) para consistência distribuída.

---

# 2. Arquitetura da Aplicação

```text
Cliente Web
    |
WebSocket
    |
Backend Node.js <---> Redis (Cache de Estado)
    |
    | (Gravação local: Outbox SQLite)
    | (Polling Publisher)
    v
 RabbitMQ
    |
 Worker Node.js
    |
 SQLite (Persistência Final)
```

## Componentes

### Backend

Responsável por:

- receber conexões WebSocket;
- gerenciar usuários conectados;
- atualizar o estado do documento em memória de forma distribuída;
- registrar alterações de forma transacional e publicá-las de maneira resiliente.

Tecnologias:

- Node.js & TypeScript
- Express & ws
- Redis (Cache)
- SQLite (Outbox)

---

### Worker

Responsável por:

- consumir mensagens RabbitMQ;
- salvar o histórico e as versões definitivas dos documentos;
- realizar processamento assíncrono isolado.

Tecnologias:

- Node.js & TypeScript
- SQLite

---

### RabbitMQ

Responsável pela comunicação assíncrona entre:

```
Backend → Worker
```

As versões dos documentos são enviadas para uma fila durável:

```
document_versions
```

---

# 3. Como executar o projeto

## Pré-requisitos

Necessário possuir:

- Docker
- Docker Compose

---

## Executando a aplicação completa

Na raiz do projeto:

```bash
docker compose up -d
```

Esse comando inicia a infraestrutura completa:

- Backend
- Worker
- RabbitMQ
- Redis

---

## Verificar containers ativos

```bash
docker ps
```

Esperado:

```
collaborative-backend
collaborative-worker
collaborative-rabbitmq
collaborative-redis
```

---

## Acessos

Aplicação Web: ```http://localhost:3000```

Interface RabbitMQ: ```http://localhost:15672```
```
user: guest
pass: guest
```

---

# 4. Como testar

## Teste de usuários conectados

1. Abrir a aplicação em uma aba: ```http://localhost:3000```

```
user: mateus
```

2. Abrir uma segunda aba: ```http://localhost:3000```

```
user: nogueira
```

3. Ambos aparecem na lista de usuários online e a sincronização do estado ocorre via Cache Distribuído.

---

## Teste de Resiliência (Outbox)

1. Desligue o container do RabbitMQ:

```
docker stop collaborative-rabbitmq
```

2. Digite um texto no editor

3. Observe os logs do backend armazenando a edição com segurança no banco local

4. Ligue o RabbitMQ novamente 

```
docker start collaborative-rabbitmq
```

5. O sistema enviará automaticamente as mensagens pendentes para o Worker.

---