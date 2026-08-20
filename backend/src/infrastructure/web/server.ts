import http from "http";
import express from "express";
import cors from "cors";
import path from "path";
import { WebSocketServer } from "ws";

import { routes } from "./routes";
import { setupWebSocketRoutes } from "../websocket/setupWebSocketRoutes";
import { connectRabbitMQ } from "../rabbitmq/rabbitmq";

const app = express();

const PORT = Number(process.env.PORT) || 3000;

// Servidor HTTP
const server = http.createServer(app);

// Servidor WebSocket
const wss = new WebSocketServer({
    server
});

// Middlewares
app.use(cors());
app.use(express.json());

// Arquivos estáticos
app.use(express.static(path.join(__dirname, "../../public")));

// Rotas HTTP
app.use(routes);

// Rotas WebSocket
setupWebSocketRoutes(wss);

// Inicialização
async function start() {
    try {
        await connectRabbitMQ();

        server.listen(PORT, () => {
            console.log(`🚀 Backend iniciado na porta ${PORT}`);
        });

    } catch (error) {
        console.error("Erro ao iniciar aplicação:", error);
        process.exit(1);
    }
}

start();