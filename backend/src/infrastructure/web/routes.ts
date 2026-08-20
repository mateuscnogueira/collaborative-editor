import { Router } from "express";

const routes = Router();

// Rota de teste da API
routes.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        service: "Collaborative Editor Backend"
    });
});

export { routes };