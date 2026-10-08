import { Router } from "express";
import { modelRoutingMiddleware } from "../middleware/modelRouter.js";
import { handleAgentExecution } from "../controllers/agentController.js";

const router = Router()

router.post('/process-query' , modelRoutingMiddleware , handleAgentExecution)

export default router