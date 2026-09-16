# Roteiro de Apresentação
## Collaborative Editor

---

# 1. Introdução (1-2 minutos)

## Objetivo do projeto

O projeto consiste em um editor colaborativo de documentos em tempo real.

O sistema permite que múltiplos usuários:

- acessem um mesmo documento;
- editem simultaneamente;
- visualizem usuários conectados;
- recebam atualizações instantâneas;
- armazenem versões do documento.


## Problema arquitetural

Os principais desafios identificados foram:

1. Comunicação em tempo real entre usuários.

2. Sincronização das alterações realizadas por diferentes clientes.

3. Processamento assíncrono para salvar versões sem bloquear a edição.

4. Organização da aplicação utilizando uma arquitetura escalável.


---

# 2. Apresentação da Arquitetura

Mostrar a estrutura:

```
Cliente Web
    |
    |
 WebSocket
    |
    |
 Backend
    |
    |
 RabbitMQ
    |
    |
 Worker
    |
    |
 SQLite
```


Explicar:

"O cliente mantém uma conexão WebSocket com o Backend. O Backend é responsável pela comunicação em tempo real. Quando uma alteração ocorre, uma nova versão do documento é enviada para uma fila RabbitMQ. O Worker consome essa mensagem e realiza a persistência no SQLite."


---

# 3. Tecnologias Utilizadas


## Backend

Tecnologias:

- Node.js
- TypeScript
- Express
- WebSocket


Responsabilidade:

- receber usuários;
- controlar conexões;
- processar alterações;
- distribuir eventos.


---

## WebSocket

Mostrar:

```
backend/src/interfaces/controllers/WebSocketController.ts
```


Explicar:

"O WebSocket foi utilizado porque precisamos de comunicação bidirecional. O usuário envia alterações e recebe alterações de outros usuários através da mesma conexão."


---

## RabbitMQ

Mostrar:

```
backend/src/infrastructure/rabbitmq
```


Explicar:

"O RabbitMQ foi utilizado para desacoplar o processamento de persistência da comunicação em tempo real."


Fluxo:

```
Backend
   |
   |
publish()
   |
   |
RabbitMQ Queue
   |
   |
Worker consume()
```


---

## Worker

Mostrar:

```
worker/src/interfaces/consumers/DocumentVersionConsumer.ts
```


Explicar:

"O Worker funciona de forma independente. Ele recebe mensagens da fila e salva as versões do documento."


---

## SQLite

Mostrar:

```
worker/src/infrastructure/persistence
```


Explicar:

"O SQLite foi escolhido por ser suficiente para armazenar as versões geradas pelo sistema sem necessidade de um banco distribuído."


---

# 4. Demonstração prática

## Subir aplicação

Mostrar:

```
docker compose up -d
```


Explicar:

"Todos os serviços são iniciados pelo Docker Compose."


---

## Teste 1 - Usuários online

Abrir:

```
localhost:3000
```


Criar:

Usuário:

```
Mateus
```


Nova aba:

```
João
```


Mostrar:

- ambos aparecem online;
- evento de conexão é enviado.


---

## Teste 2 - Edição colaborativa


Usuário Mateus escreve:

```
Olá mundo
```


Mostrar:

- João recebe alteração instantaneamente.


---

## Teste 3 - Mensageria


Mostrar logs:


Backend:

```
📨 Snapshot enviado para RabbitMQ
```


Worker:

```
👂 Worker aguardando mensagens
```


Explicar:

"A alteração foi enviada para uma fila e processada pelo Worker."


---

# 5. Arquitetura Interna

Explicar Clean Architecture:


```
interfaces
    |
application
    |
domain
    |
infrastructure
```


Cada camada possui uma responsabilidade.


---

# 6. ADR - Decisões Arquiteturais


## WebSocket

Escolhido porque:

- comunicação bidirecional;
- baixa latência;
- adequado para colaboração.


Descartado:

Polling:

- excesso de requisições.


SSE:

- somente servidor envia.


---

## RabbitMQ

Escolhido porque:

- possui filas persistentes;
- desacopla serviços;
- permite processamento assíncrono.


Descartado:

Redis Pub/Sub:

- mensagens podem ser perdidas.


---

# 7. Encerramento

Finalizar:

"O projeto utiliza comunicação em tempo real através de WebSockets e processamento assíncrono através de RabbitMQ, mantendo o backend desacoplado e preparado para escalabilidade."