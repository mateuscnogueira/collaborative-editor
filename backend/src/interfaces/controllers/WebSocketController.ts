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
    clients: Set<WebSocket>
  ): void {

    clients.add(ws);

    console.log(
      `🔌 Cliente conectado (${clients.size} online)`
    );

    const connectedMessage: SystemEventDTO = {
        type: "system",
        message: "Conectado ao servidor colaborativo.",
        timestamp: new Date().toISOString()
    };

    ws.send(
      JSON.stringify(connectedMessage)
    );

    ws.on("message", (message) => {

      const dto =
        JSON.parse(
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

      clients.forEach((client) => {

        if (
          client.readyState === WebSocket.OPEN
        ) {
          client.send(payload);
        }
      });
    });

    ws.on("close", () => {

      clients.delete(ws);

      console.log(
        `❌ Cliente desconectado (${clients.size} online)`
      );
    });
  }
}