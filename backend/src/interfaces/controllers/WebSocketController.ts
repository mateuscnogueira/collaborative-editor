import WebSocket from "ws";

import { UpdateDocumentUseCase } from "../../application/use_cases/UpdateDocumentUseCase";

import { TextChange } from "../../domain/entities/TextChange";

import { TextChangeDTO } from "../dto/TextChangeDTO";

import { SystemEventDTO } from "../dto/SystemEventDTO";

export class WebSocketController {

  constructor(
    private updateDocumentUseCase: UpdateDocumentUseCase
  ) {}

  handleConnection(
    ws: WebSocket,
    userId: string,
    clients: Map<WebSocket, string>
  ): void {

    clients.set(ws, userId);

    console.log(
      `🔌 ${userId} conectado (${clients.size} online)`
    );

    const connectedMessage: SystemEventDTO = {
      type: "system",
      message: `Bem-vindo, ${userId}!`,
      timestamp: new Date().toISOString()
    };

    ws.send(
      JSON.stringify(connectedMessage)
    );

    const userConnectedEvent: SystemEventDTO = {
      type: "user-connected",
      message: `${userId} entrou no documento.`,
      userId,
      onlineUsers: clients.size,
      timestamp: new Date().toISOString()
    };

    const connectedPayload =
      JSON.stringify(userConnectedEvent);

    clients.forEach((_, client) => {

      if (client.readyState === WebSocket.OPEN) {
        client.send(connectedPayload);
      }
    });

    ws.on("message", (message) => {

      const dto = JSON.parse(
        message.toString()
      ) as TextChangeDTO;

      const change = new TextChange(
        dto.documentId,
        dto.userId,
        dto.content,
        dto.cursorPosition,
        new Date(dto.timestamp)
      );

      this.updateDocumentUseCase.execute(change);

      const payload = JSON.stringify(dto);

      clients.forEach((_, client) => {

        if (client.readyState === WebSocket.OPEN) {
          client.send(payload);
        }
      });
    });

    ws.on("close", () => {

      clients.delete(ws);

      console.log(
        `❌ ${userId} desconectado (${clients.size} online)`
      );

      const disconnectedEvent: SystemEventDTO = {
        type: "user-disconnected",
        message: `${userId} saiu do documento.`,
        userId,
        onlineUsers: clients.size,
        timestamp: new Date().toISOString()
      };

      const payload =
        JSON.stringify(disconnectedEvent);

      clients.forEach((_, client) => {

        if (client.readyState === WebSocket.OPEN) {
          client.send(payload);
        }

      });
    });
  }
}