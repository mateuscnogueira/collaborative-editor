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
    updateDocumentUseCase
  );

  wss.on("connection", (ws, request) => {

    const url = new URL(
      request.url || "/",
      "http://localhost"
    );

    const userId =
      url.searchParams.get("userId") || "anonymous";

    webSocketController.handleConnection(
      ws,
      userId,
      clients
    );
  });
}