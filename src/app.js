import express from 'express';
import dotenv from 'dotenv';
import agentRoutes from './routes/agentRoutes.js'; // Importing your signboard file

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to parse incoming raw json formats configuration payload strings
app.use(express.json());

// Mounting the modular route sub-system onto the root execution app path
app.use('/api/v1/agent', agentRoutes);

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', message: 'Codex Server Dynamic Routes Connected Successfully' });
});

app.listen(PORT, () => {
    console.log(`================================================================`);
    console.log(`🚀 [ROUTING CONTEXT ACTIVE]: Signboards mapped via src/routes/`);
    console.log(`📡 [ENDPOINT URL]: http://localhost:${PORT}/api/v1/agent/process-query`);
    console.log(`================================================================`);
});
