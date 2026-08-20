# Collaborative Editor

Sistema de edição colaborativa de documentos em tempo real utilizando WebSocket, RabbitMQ, Worker assíncrono e persistência de versões.

---

# 1. Visão Geral

Este projeto implementa um editor colaborativo onde múltiplos usuários podem acessar um mesmo documento simultaneamente.

Os principais desafios arquiteturais identificados foram:

- manter usuários sincronizados em tempo real;
- permitir comunicação bidirecional entre navegador e servidor;
- evitar processamento pesado dentro da API principal;
- garantir que versões dos documentos sejam armazenadas mesmo em cenários de falha temporária.

Para resolver esses desafios foram utilizados WebSockets para comunicação em tempo real e RabbitMQ para processamento assíncrono entre serviços.

---

# 2. Arquitetura da Aplicação


```
Cliente Web
    |
    |
 WebSocket
    |
    |
 Backend Node.js
    |
    |
 RabbitMQ
    |
    |
 Worker Node.js
    |
    |
 SQLite
```


## Componentes

### Backend

Responsável por:

- receber conexões WebSocket;
- gerenciar usuários conectados;
- atualizar documentos em memória;
- publicar eventos de versionamento.

Tecnologias:

- Node.js
- TypeScript
- Express
- ws


---

### Worker

Responsável por:

- consumir mensagens RabbitMQ;
- salvar versões dos documentos;
- realizar processamento assíncrono.

Tecnologias:

- Node.js
- TypeScript
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


Esse comando inicia:

- Backend
- Worker
- RabbitMQ


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
```


---

## Acessar aplicação

Abrir:


```
http://localhost:3000
```


---

## Interface RabbitMQ

Disponível em:


```
http://localhost:15672
```


Credenciais:


```
usuário: guest

senha: guest
```


---

# 4. Como testar


## Teste de usuários conectados

1. Abrir a aplicação em uma aba:

```
http://localhost:3000
```

2. Informar usuário:

```
mateus
```


3. Abrir uma segunda aba:

```
http://localhost:3000
```


4. Informar outro usuário:

```
nogueira
```


Resultado esperado:

- ambos aparecem na lista de usuários online;
- ao desconectar uma aba, o usuário é removido.


---

## Teste de edição colaborativa

Com dois usuários conectados:

Usuário 1 escreve:

```
Olá mundo colaborativo
```


Resultado esperado:

- Usuário 2 recebe a alteração imediatamente.


Formato da mensagem WebSocket:


```json
{
  "type": "text-change",
  "documentId": "document-001",
  "userId": "mateus",
  "content": "Olá mundo colaborativo",
  "cursorPosition": 22,
  "timestamp": "2026-08-20T00:10:00Z"
}
```


---

# Registro de Decisões Arquiteturais (ADR)


# ADR 01: Comunicação Cliente-Servidor em Tempo Real


## Status

Aceito


## Contexto

O sistema precisa permitir edição colaborativa, onde alterações realizadas por um usuário devem ser propagadas imediatamente para todos os outros usuários conectados.

A comunicação precisa ser bidirecional, pois o cliente envia alterações e também recebe atualizações.


## Alternativas Consideradas

- Polling HTTP tradicional;
- Server-Sent Events (SSE);
- WebSockets.


## Decisão

Foi escolhido WebSockets.


## Justificativa

Escolhi WebSockets porque:

1. Permitem comunicação bidirecional em tempo real entre cliente e servidor, característica essencial para edição colaborativa.

2. Mantêm uma conexão persistente, evitando múltiplas requisições HTTP desnecessárias.


Descartei Polling porque:

- gera várias requisições mesmo quando não existem alterações;
- aumenta consumo de recursos do servidor.


Descartei SSE porque:

- possui comunicação apenas servidor → cliente;
- não atende ao envio de alterações feitas pelos usuários.


## Consequências


### Positivas

- baixa latência;
- comunicação eficiente;
- sincronização imediata dos usuários.


### Negativas

- exige gerenciamento de conexões abertas;
- necessita tratar reconexões e desconexões.


---

# ADR 02: Mensageria Interna e Processamento Assíncrono


## Status

Aceito


## Contexto

Após uma alteração no documento, o sistema precisa criar uma nova versão persistida.

Esse processamento não deve bloquear a comunicação em tempo real dos usuários.


## Alternativas Consideradas

- Processamento síncrono dentro do Backend;
- Redis Pub/Sub;
- RabbitMQ utilizando AMQP;
- gRPC.


## Decisão

Escolhi por utilizar RabbitMQ com protocolo AMQP.


## Justificativa

Escolhi RabbitMQ porque:

1. Possui filas persistentes, garantindo que mensagens permaneçam disponíveis caso o Worker esteja temporariamente indisponível.

2. Permite desacoplamento entre o Backend e o processamento de persistência.


Descartei Redis Pub/Sub porque:

- mensagens são voláteis;
- caso o consumidor esteja indisponível, eventos podem ser perdidos.


Descartei processamento síncrono porque:

- aumentaria o tempo de resposta do Backend;
- misturaria responsabilidades.


Descartei gRPC porque:

- é mais adequado para comunicação serviço-serviço;
- não oferece as características de fila persistente necessárias neste cenário.


## Consequências


### Positivas

- processamento desacoplado;
- maior tolerância a falhas;
- possibilidade de escalar Workers.


### Negativas

- aumenta complexidade da infraestrutura;
- exige monitoramento do broker.


---

# ADR 03: Organização Arquitetural


## Contexto

A utilização de protocolos como WebSocket e AMQP poderia acoplar diretamente regras de negócio às tecnologias externas.


## Decisão

Foi utilizada uma organização baseada nos princípios da Clean Architecture.


## Decisões de Design


### Controllers

Responsáveis por receber dados externos:

```
interfaces/controllers
```

Exemplo:

```
WebSocketController
```

Recebe mensagens WebSocket, transforma em entidades de domínio e encaminha para os casos de uso.


---

### Use Cases

A lógica de negócio permanece isolada:

```
application/use_cases
```


Exemplo:

```
UpdateDocumentUseCase
```


O caso de uso não conhece detalhes do WebSocket ou RabbitMQ.


---

### Infrastructure

Responsável pelas implementações externas:

```
infrastructure/rabbitmq
infrastructure/websocket
infrastructure/persistence
```


Exemplo:

```
RabbitMQPublisher
```

Responsável apenas pela comunicação com o broker.


---

# 5. Docker

A aplicação completa é executada utilizando:


```bash
docker compose up -d
```


Serviços iniciados:


| Serviço | Porta |
|-|-|
| Backend | 3000 |
| RabbitMQ | 5672 |
| RabbitMQ Management | 15672 |


O Docker Compose também possui healthcheck no RabbitMQ para garantir que Backend e Worker somente iniciem após o broker estar disponível.


---

# 6. Tecnologias utilizadas

- Node.js
- TypeScript
- Express
- WebSocket
- RabbitMQ
- AMQP
- SQLite
- Docker
- Docker Compose