import { MODEL_MAPPING } from "../config/aiconfig.js"

export const modelRoutingMiddleware = (req , res , next) => {
   const {prompt} = req.body

   if(!prompt || typeof prompt !== 'string'){
     return res.status(400).json({
        error : "valid prompt parameter required"
     })
   }

   const complexIndicators = [
     'analyze repo', 'compile portfolio', 'structural check', 
     'validate architecture', 'evaluate codebase', 'match metrics', 'optimize'
   ]

   const isComplexRequest = complexIndicators.some(indicators => 
   prompt.toLowerCase().includes(indicators)
   )

    if (isComplexRequest) {
        req.selectedAIModel = MODEL_MAPPING.PREMIUM_CORE;
        req.intelligenceTier = 'MISTRAL_PREMIUM_REASONING_TIER';
    } else {
        req.selectedAIModel = MODEL_MAPPING.ECONOMY_CORE;
        req.intelligenceTier = 'GEMINI_FREE_FAST_TIER';
    }

    console.log(`[MODEL_ROUTER_LOG]: Mapped to [${req.selectedAIModel}] under [${req.intelligenceTier}]`);
    next();
}