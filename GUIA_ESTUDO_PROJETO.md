# Guia de Estudo do Projeto

## Collaborative Editor

---

# 1. Visão Geral da Arquitetura


O sistema possui dois serviços principais:


## Backend

Responsável pela aplicação principal.

Local:

```
backend/
```


Responsabilidades:

- WebSocket;
- gerenciamento de usuários;
- atualização dos documentos;
- publicação de eventos.


---

## Worker

Serviço independente.


Local:

```
worker/
```


Responsabilidades:

- consumir mensagens RabbitMQ;
- salvar versões;
- processamento assíncrono.


---

# 2. Fluxo Completo da Aplicação


## Usuário conecta


Fluxo:


```
Browser

↓

WebSocketController

↓

WebSocketServer

↓

Lista de clientes conectados
```


Arquivo:

```
backend/src/interfaces/controllers/WebSocketController.ts
```


---

# 3. Fluxo de edição


Usuário altera texto.


Mensagem:


```json
{
"type":"text-change",
"documentId":"document-001",
"userId":"mateus",
"content":"novo texto"
}
```


Fluxo:


```
Cliente

↓

WebSocketController

↓

TextChange

↓

UpdateDocumentUseCase

↓

DocumentMemoryService

↓

RabbitMQPublisher

↓

RabbitMQ
```


---

# 4. UpdateDocumentUseCase


Arquivo:


```
backend/src/application/use_cases/UpdateDocumentUseCase.ts
```


Responsabilidade:


1. Atualizar documento em memória.

2. Criar uma versão.

3. Publicar versão no RabbitMQ.


Não conhece:

- WebSocket;
- RabbitMQ real;
- SQLite.


Isso mantém a regra de negócio isolada.


---

# 5. DocumentMemoryService


Arquivo:


```
backend/src/services/DocumentMemoryService.ts
```


Responsabilidade:

Manter documentos ativos em memória.


Utiliza:

```typescript
Map<string, Document>
```


Exemplo:


```
document-001

{
 title:"Documento",
 content:"texto"
}
```


---

# 6. RabbitMQ


Arquivo:


```
backend/src/infrastructure/rabbitmq/RabbitMQPublisher.ts
```


Responsabilidade:

Enviar mensagens:


```typescript
channel.sendToQueue()
```


Fila:


```
document_versions
```


---

# 7. Worker


Entrada:

```
RabbitMQ
```


Arquivo:


```
DocumentVersionConsumer.ts
```


Fluxo:


```
RabbitMQ

↓

Consumer

↓

SaveDocumentVersionUseCase

↓

SQLiteDocumentVersionRepository

↓

database.sqlite
```


---

# 8. Clean Architecture


## Domain


Contém regras do negócio.


Exemplo:


```
domain/entities
```


Classes:


```
Document.ts

TextChange.ts

DocumentVersion.ts
```


Não dependem de frameworks.


---

## Application


Contém casos de uso.


Exemplo:


```
UpdateDocumentUseCase
```


Responsável por coordenar operações.


---

## Interfaces


Entrada e saída da aplicação.


Exemplo:


```
WebSocketController
```


Recebe dados externos.


---

## Infrastructure


Código dependente de tecnologia.


Exemplo:


```
RabbitMQPublisher

SQLiteRepository

WebSocket setup
```


---

# 9. Tecnologias e justificativas


# WebSocket


## Por que usar?


Porque o problema exige:

- baixa latência;
- comunicação bidirecional.


## Por que não Polling?


Porque causaria:


```
Cliente pergunta

Servidor responde "nada mudou"

Cliente pergunta novamente
```


Gasto desnecessário.


---

## Por que não SSE?


SSE:


```
Servidor → Cliente
```


Nosso caso:


```
Cliente ↔ Servidor
```

Precisamos enviar alterações.

---

# RabbitMQ

## Por que usar?

Porque precisamos:

- fila;
- garantia de entrega;
- desacoplamento.


---

## Por que não Redis Pub/Sub?


Redis Pub/Sub:

```
Publica

↓

Consumidor offline

↓

Mensagem perdida
```

RabbitMQ:

```
Publica

↓

Fila persistente

↓

Consumidor processa depois
```

---

# Docker

Arquivo:

```
docker-compose.yml
```

Serviços:

```
backend

worker

rabbitmq
```

Comando:

```
docker compose up -d
```

---

# Perguntas possíveis do professor

## 1. Por que usar WebSocket?

Resposta:

"Porque precisamos de comunicação bidirecional em tempo real. O usuário envia alterações e recebe alterações dos demais usuários mantendo uma conexão persistente."

---

## 2. Por que não usar REST?

Resposta:

"REST funciona através de requisição e resposta. Para colaboração em tempo real seria necessário polling, causando overhead."

---

## 3. Qual a função do RabbitMQ?

Resposta:

"Desacoplar o processamento de persistência do backend principal. O backend publica eventos e o worker processa posteriormente."

---

## 4. O que acontece se o Worker cair?

Resposta:

"A mensagem permanece na fila RabbitMQ porque ela é persistente. Quando o Worker retornar, ele poderá consumir novamente."

---

## 5. Onde está implementada a comunicação WebSocket?

Resposta:

```
interfaces/controllers/WebSocketController.ts
```

---

## 6. Onde o documento é atualizado?

Resposta:

```
application/use_cases/UpdateDocumentUseCase.ts
```

Método:

```
execute()
```

---

## 7. Onde a mensagem RabbitMQ é enviada?

Resposta:

```
RabbitMQPublisher.ts
```

Método:

```
publish()
```

---

## 8. Onde a versão é salva?

Resposta:

```
worker/src/infrastructure/persistence
```

Classe:

```
SQLiteDocumentVersionRepository
```

---

## 9. Por que separar Backend e Worker?

Resposta:
"Para evitar que operações demoradas bloqueiem o servidor responsável pela comunicação em tempo real."

---

## 10. Como o Docker sabe a ordem de inicialização?

Resposta:
"Foi configurado healthcheck no RabbitMQ. Backend e Worker aguardam o broker estar saudável antes de iniciar."