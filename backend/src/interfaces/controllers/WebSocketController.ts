import WebSocket from "ws";
import { UpdateDocumentUseCase } from "../../application/use_cases/UpdateDocumentUseCase";
import { TextChange } from "../../domain/entities/TextChange";
import { TextChangeDTO } from "../dto/TextChangeDTO";
import { SystemEventDTO } from "../dto/SystemEventDTO";
import { DocumentMemoryService } from "../../services/DocumentMemoryService";

export class WebSocketController {

  constructor(
    private updateDocumentUseCase: UpdateDocumentUseCase,
    private documentService: DocumentMemoryService
  ) {}

  // 1. Transformamos o handleConnection em async (assíncrono), pois agora ele precisa 
  // aguardar a busca do estado atual do documento no Redis (Cache).
  async handleConnection(
    ws: WebSocket,
    userId: string,
    clients: Map<WebSocket, string>
  ): Promise<void> {

    // 2. Registro do novo cliente no mapa de conexões ativas
    clients.set(ws, userId);
    console.log(`🔌 ${userId} conectado (${clients.size} online)`);

    // 3. Notifica o novo usuário sobre quem já está online
    const currentUsers = Array.from(clients.values()).filter(user => user !== userId);
    currentUsers.forEach(user => {
      const existingUserEvent: SystemEventDTO = {
        type: "user-connected",
        message: `${user} já está conectado.`,
        userId: user,
        onlineUsers: clients.size,
        timestamp: new Date().toISOString()
      };
      ws.send(JSON.stringify(existingUserEvent));
    });

    // 4. RECUPERAÇÃO DO CACHE: Buscamos o documento do Redis.
    // Adicionamos o 'await' pois a comunicação com o Redis é uma Promise.
    const currentDocument = await this.documentService.getCurrentDocument("document-001");

    const documentState = {
        type: "document-state",
        documentId: currentDocument.id,
        content: currentDocument.content,
        timestamp: new Date().toISOString()
    };

    // 5. Envia o conteúdo recuperado do Cache para quem acabou de entrar
    ws.send(JSON.stringify(documentState));

    // 6. Mensagem de boas-vindas para o próprio usuário
    const connectedMessage: SystemEventDTO = {
      type: "system",
      message: `Bem-vindo, ${userId}!`,
      timestamp: new Date().toISOString()
    };
    ws.send(JSON.stringify(connectedMessage));

    // 7. Notifica os OUTROS usuários que alguém novo entrou
    const userConnectedEvent: SystemEventDTO = {
      type: "user-connected",
      message: `${userId} entrou no documento.`,
      userId,
      onlineUsers: clients.size,
      timestamp: new Date().toISOString()
    };

    const connectedPayload = JSON.stringify(userConnectedEvent);
    clients.forEach((_, client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(connectedPayload);
      }
    });

    // 8. LISTENERS: O que acontece quando o usuário digita algo
    // Tornamos o callback do evento "message" async para poder usar o await
    ws.on("message", async (message) => {
      const dto = JSON.parse(message.toString()) as TextChangeDTO;

      const change = new TextChange(
        dto.documentId,
        dto.userId,
        dto.content,
        dto.cursorPosition,
        new Date(dto.timestamp)
      );

      try {
          // 9. ATUALIZAÇÃO DO CACHE: Aguardamos a atualização no Redis e o envio para o RabbitMQ
          await this.updateDocumentUseCase.execute(change);

          // 10. BROADCAST: Repassa a alteração de texto para todos os outros clientes conectados
          const payload = JSON.stringify(dto);
          clients.forEach((_, client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(payload);
            }
          });
      } catch (error) {
          console.error("Erro ao processar mensagem do WebSocket:", error);
      }
    });

    // 11. Desconexão e limpeza
    ws.on("close", () => {
      clients.delete(ws);
      console.log(`❌ ${userId} desconectado (${clients.size} online)`);

      const disconnectedEvent: SystemEventDTO = {
        type: "user-disconnected",
        message: `${userId} saiu do documento.`,
        userId,
        onlineUsers: clients.size,
        timestamp: new Date().toISOString()
      };

      const payload = JSON.stringify(disconnectedEvent);
      clients.forEach((_, client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload);
        }
      });
    });
  }
}