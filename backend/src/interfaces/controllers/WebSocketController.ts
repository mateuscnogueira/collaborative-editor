import WebSocket from "ws";
import { UpdateDocumentUseCase } from "../../application/use_cases/UpdateDocumentUseCase";
import { TextChange } from "../../domain/entities/TextChange";
import { TextChangeDTO } from "../dto/TextChangeDTO";
import { SystemEventDTO } from "../dto/SystemEventDTO";
import { DocumentMemoryService } from "../../services/DocumentMemoryService";


// Controller responsável por gerenciar a comunicação em tempo real entre os clientes conectados através do WebSocket.
export class WebSocketController {

  constructor(
    // Caso de uso responsável por atualizar o documento e disparar o processo de versionamento.
    private updateDocumentUseCase: UpdateDocumentUseCase,

    // Serviço responsável por manter o documento atual em memória.
    private documentService: DocumentMemoryService

  ) {}

  // Método chamado sempre que um novo cliente estabelece uma conexão WebSocket com o servidor.
  handleConnection(
    ws: WebSocket,
    userId: string,
    // Map que mantém todos os clientes conectados associados aos seus respectivos usuários.
    clients: Map<WebSocket, string>

  ): void {

    // Adiciona o novo usuário na lista de conexões ativas.
    clients.set(ws, userId);
    console.log(`🔌 ${userId} conectado (${clients.size} online)`);

    // Recupera usuários que já estavam conectados antes deste usuário entrar.
    const currentUsers = Array.from(clients.values()).filter(user => user !== userId);

    // Envia para o novo usuário a informação de quem já estava online.
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

    // Quando um usuário entra, ele recebe o estado atual do documento (seu conteúdo)
    const currentDocument = this.documentService.getCurrentDocument("document-001");

    const documentState = {
      type: "document-state",
      documentId: currentDocument.id,
      content: currentDocument.content,
      timestamp: new Date().toISOString()
    };

    // Envia o conteúdo atual somente para o usuário que acabou de conectar.
    ws.send(JSON.stringify(documentState));

    const connectedMessage: SystemEventDTO = {
      type: "system",
      message: `Bem-vindo, ${userId}!`,
      timestamp: new Date().toISOString()
    };

    ws.send(JSON.stringify(connectedMessage));

    // Cria um evento avisando todos os usuários que um novo participante entrou.
    const userConnectedEvent: SystemEventDTO = {
      type: "user-connected",
      message: `${userId} entrou no documento.`,
      userId,
      onlineUsers: clients.size,
      timestamp: new Date().toISOString()
    };

    const connectedPayload = JSON.stringify(userConnectedEvent);

    // Envia a atualização para todos os clientes conectados.
    clients.forEach((_, client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(connectedPayload);
      }
    });

    // Evento disparado quando o cliente envia uma mensagem.
    ws.on("message", (message) => {

      // Converte a mensagem recebida do formato JSON para um objeto TypeScript.
      const dto = JSON.parse(message.toString()) as TextChangeDTO;

      // Transforma o DTO recebido em uma entidade de domínio.
      const change = new TextChange(
        dto.documentId,
        dto.userId,
        dto.content,
        dto.cursorPosition,
        new Date(dto.timestamp)
      );

      // atualizar documento e enviar snapshot para processamento.
      this.updateDocumentUseCase.execute(change);

      // Envia a alteração recebida para os outros usuários.
      const payload = JSON.stringify(dto);

      clients.forEach((_, client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload);
        }
      });
    });

    // Evento disparado quando um usuário fecha a conexão.
    ws.on("close", () => {

      // Remove o usuário da lista de conexões ativas.
      clients.delete(ws);
      console.log(`❌ ${userId} desconectado (${clients.size} online)`);

      // Cria evento informando que um usuário saiu.
      const disconnectedEvent: SystemEventDTO = {
        type: "user-disconnected",
        message: `${userId} saiu do documento.`,
        userId,
        onlineUsers: clients.size,
        timestamp: new Date().toISOString()
      };

      const payload = JSON.stringify(disconnectedEvent);

      // Notifica os usuários restantes sobre a saída.
      clients.forEach((_, client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload);
        }
      });
    });
  }
}