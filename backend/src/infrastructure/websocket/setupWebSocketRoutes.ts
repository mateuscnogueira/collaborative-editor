import { WebSocketServer } from "ws";

export function setupWebSocketRoutes(wss: WebSocketServer): void {

    wss.on("connection", (ws) => {

        console.log("✅ Cliente conectado via WebSocket.");

        ws.on("close", () => {
            console.log("Cliente desconectado.");
        });

    });

}