# Registro de Decisões Arquiteturais (ADR)

## ADR 01: Comunicação Cliente-Servidor em Tempo Real

**Status**: Aceito

> Contexto

O sistema precisa permitir edição colaborativa, onde alterações realizadas por um usuário devem ser propagadas imediatamente para todos os outros usuários conectados.

A comunicação precisa ser bidirecional, pois o cliente envia alterações e também recebe atualizações.

> Decisão

Utilização de WebSockets para comunicação bidirecional em tempo real, evitando o overhead de requisições Polling e permitindo envio/recebimento contínuo.

> Alternativas Consideradas

- Polling HTTP tradicional;
- Server-Sent Events (SSE);
- WebSockets.

> Justificativa da escolha

- Escolhi WebSockets porque:
   - permitem comunicação bidirecional em tempo real entre cliente e servidor, característica essencial para edição colaborativa.
   - mantêm uma conexão persistente, evitando múltiplas requisições HTTP desnecessárias.

- Descartei Polling porque:
   - gera várias requisições mesmo quando não existem alterações;
   - aumenta consumo de recursos do servidor.

- Descartei SSE porque:
   - possui comunicação apenas servidor → cliente;
   - não atende ao envio de alterações feitas pelos usuários.

> Consequências

- Positivas
   - baixa latência;
   - comunicação eficiente;
   - sincronização imediata dos usuários.

- Negativas
   - exige gerenciamento de conexões abertas;
   - necessita tratar reconexões e desconexões.

---

## ADR 02: Mensageria Interna e Processamento Assíncrono

**Status**: Aceito

> Contexto

Após uma alteração no documento, o sistema precisa criar uma nova versão persistida.

> Decisão 

Utilização de RabbitMQ (AMQP) para desacoplar a API principal da responsabilidade de escrita definitiva em disco, garantindo tolerância a falhas do serviço de persistência.

Esse processamento não deve bloquear a comunicação em tempo real dos usuários.

> Alternativas Consideradas

- Processamento síncrono dentro do Backend;
- Redis Pub/Sub;
- RabbitMQ utilizando AMQP;
- gRPC.

> Justificativa da escolha

- Escolhi RabbitMQ porque:
   - possui filas persistentes, garantindo que mensagens permaneçam disponíveis caso o Worker esteja temporariamente indisponível.
   - permite desacoplamento entre o Backend e o processamento de persistência.


- Descartei Redis Pub/Sub porque:
   - mensagens são voláteis;
   - caso o consumidor esteja indisponível, eventos podem ser perdidos.

- Descartei processamento síncrono porque:
   - aumentaria o tempo de resposta do Backend;
   - misturaria responsabilidades.

- Descartei gRPC porque:
   - é mais adequado para comunicação serviço-serviço;
   - não oferece as características de fila persistente necessárias neste cenário.

> Consequências

- Positivas
   - processamento desacoplado;
   - maior tolerância a falhas;
   - possibilidade de escalar Workers.

- Negativas
   - aumenta complexidade da infraestrutura;
   - exige monitoramento do broker.

---

## ADR 03: Organização Arquitetural

> Contexto

A utilização de protocolos como WebSocket e AMQP poderia acoplar diretamente regras de negócio às tecnologias externas.

> Decisão 

Foi utilizada uma organização baseada nos princípios da Clean Architecture.

> Decisões de Design

**Controllers**

- Responsáveis por receber dados externos: ```interfaces/controllers```

- Exemplo: ```WebSocketController```

Recebe mensagens WebSocket, transforma em entidades de domínio e encaminha para os casos de uso.

---

**Use Cases**

A lógica de negócio permanece isolada: ```application/use_cases```

Exemplo:```UpdateDocumentUseCase```

O caso de uso não conhece detalhes do WebSocket ou RabbitMQ.

---

**Infrastructure**

Responsável pelas implementações externas: ```infrastructure/rabbitmq```, ``` infrastructure/websocket```, ```infrastructure/persistence```

Exemplo: ```RabbitMQPublisher```

Responsável apenas pela comunicação com o broker.

---

## ADR 04: Gerenciamento de Estado com Cache Distribuído

**Status**: Aceito

> Contexto

Bancos de dados relacionais sofrem com concorrência massiva, gerando gargalos de I/O em disco sob alta carga.

> Decisão

Adoção do Redis para armazenar o estado ativo do documento.

> Justificativa

O acesso à memória RAM do Redis reduz drasticamente a latência e permite escalar o backend horizontalmente de forma stateless.

---

## ADR 05: Consistência com Transactional Outbox

**Status**: Aceito

> Contexto

O envio direto de mensagens para o RabbitMQ após alteração de estado gera o risco de Dual-Write (Escrita Dupla), podendo causar perda de dados em quedas de rede.

> Decisão

Implementação do padrão Transactional Outbox utilizando um banco SQLite local no Backend e um Polling Publisher.

> Justificativa

Em sistemas distribuídos web, o modelo ACID/2PC degrada a performance. O Outbox garante Eventual Consistency (Modelo BASE) com alta disponibilidade, assegurando que a mensagem chegue à fila sem travar a aplicação do usuário.