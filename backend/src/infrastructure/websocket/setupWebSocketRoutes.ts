import { WebSocketServer, WebSocket } from "ws";
import { WebSocketController } from "../../interfaces/controllers/WebSocketController";
import { UpdateDocumentUseCase } from "../../application/use_cases/UpdateDocumentUseCase";
import { DocumentMemoryService } from "../../services/DocumentMemoryService";
import { RabbitMQPublisher } from "../rabbitmq/RabbitMQPublisher";

export function setupWebSocketRoutes(wss: WebSocketServer): void {

  const clients = new Map<WebSocket, string>();
  const documentRepository = new DocumentMemoryService();
  const publisher = new RabbitMQPublisher();

  const updateDocumentUseCase = new UpdateDocumentUseCase(
    documentRepository,
    publisher
  );

  const webSocketController = new WebSocketController(
    updateDocumentUseCase,
    documentRepository
  );

  // 1. Adicionamos o 'async' aqui no callback
  wss.on("connection", async (ws, request) => {

    const url = new URL(request.url || "/","http://localhost");
    const userId = url.searchParams.get("userId") || "anonymous";

    // 2. Envolvemos a chamada em um try/catch e adicionamos o 'await'
    try {
        await webSocketController.handleConnection(
          ws,
          userId,
          clients
        );
    } catch (error) {
        console.error(`Erro ao estabelecer conexão para o usuário ${userId}:`, error);
    }
  });
}