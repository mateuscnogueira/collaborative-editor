import { createClient } from 'redis';

// pega a URL que foi configurada no docker-compose
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redisClient = createClient({
    url: redisUrl
});

redisClient.on('error', (err) => {
    console.error('❌ Erro no cliente Redis:', err);
});

redisClient.on('connect', () => {
    console.log('✅ Conectado ao Redis com sucesso!');
});

// iniciar a conexão
export const connectRedis = async () => {
    try {
        await redisClient.connect();
    } catch (error) {
        console.error('Falha ao conectar no Redis:', error);
    }
};

export default redisClient;