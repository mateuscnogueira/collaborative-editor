import { WebSocketServer, WebSocket } from "ws";
import { WebSocketController } from "../../interfaces/controllers/WebSocketController";
import { UpdateDocumentUseCase } from "../../application/use_cases/UpdateDocumentUseCase";
import { DocumentMemoryService } from "../../services/DocumentMemoryService";
import { SQLiteOutboxRepository } from "../persistence/SQLiteOutboxRepository";
import { RabbitMQPublisher } from "../rabbitmq/RabbitMQPublisher";
import { PollingPublisher } from "../outbox/PollingPublisher";

export function setupWebSocketRoutes(wss: WebSocketServer): void {
  const clients = new Map<WebSocket, string>();
  
  const documentRepository = new DocumentMemoryService();
  const outboxRepository = new SQLiteOutboxRepository();
  const publisher = new RabbitMQPublisher();

  const updateDocumentUseCase = new UpdateDocumentUseCase(
    documentRepository,
    outboxRepository
  );

  const webSocketController = new WebSocketController(
    updateDocumentUseCase,
    documentRepository
  );

  // Instanciamos e iniciamos o carteiro em background
  const pollingPublisher = new PollingPublisher(outboxRepository, publisher);
  pollingPublisher.start();

  wss.on("connection", async (ws, request) => {
    const url = new URL(request.url || "/", "http://localhost");
    const userId = url.searchParams.get("userId") || "anonymous";

    try {
      await webSocketController.handleConnection(ws, userId, clients);
    } catch (error) {
      console.error(`Erro ao estabelecer conexão para o usuário ${userId}:`, error);
    }
  });
}