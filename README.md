# AI-Powered-DEV-Agent


1. src/config/aiConfig.js — Client Multi-Tenant Initialization

        • Humne kya kiya: Humne ek hi file mein OpenAI aur Google Gemini dono ke SDKs ko import kiya aur unke instances banaye.

        • Kyun kiya (Reasoning): Industry standard ke mutabiq, aapka application Model-Agnostic hona chahiye (yani kisi ek AI company ka gulaam nahi hona chahiye). Kal ko agar Google apna naya sasta model nikalta hai, ya OpenAI ke servers down ho jaate hain, toh aapko poore code mein changes nahi karne padenge. Aap sirf is ek config file mein aakar MODEL_MAPPING ki values badal denge, aur aapka poora system ek jhatke mein naye model par switch ho jayega.

2. src/middlewares/modelRouter.js — The Logic Traffic Cop 🚦

        • Humne kya kiya: Humne Express ka ek custom middleware banaya jo request controller tak pahonchne se pehle user ke input string (prompt) ko scan karta hai.

        • Kyun kiya (Reasoning): Humne yahan complexIndicators naam ka ek array banaya (['analyze repo', 'compile portfolio', ...]). Middleware .some() function ka use karke user ke prompt ko check karta hai.

        • Critical Concept (Request Mutation): Agar keyword match hota hai, toh hum req.selectedAIModel = 'gpt-4o' set karte hain. Express mein request object (req) ko mutate (modify) karna ek powerful pattern hai. Iska matlab hai ki hum request ke sath ek "meta-tag" (flag) chipka rahe hain, jo aage jaakar controller ko batayega ki use kaunsa raasta chunna hai. Isse hamara logic pipeline clean rehta hai.



3. src/controllers/agentController.js — Execution Gatekeeper

        • Humne kya kiya: Is controller mein humne if/else block chalaya jo middleware dwara set kiye gaye req.selectedAIModel ko padhta hai aur uske mutabiq sahi client (openaiClient ya geminiClient) ko call karta hai.
        
        • Kyun kiya (Reasoning): Yahan dhyan dijiye, humne premium model mein temperature: 0.2 set kiya hai. Kyun? Kyunki jab user code analysis ya portfolio compilation jaisa complex kaam karega, toh hamein AI se "creativity" ya kahaniyan nahi chahiye. Hamein strictly structured, deterministic aur accurate data chahiye.
        

4. src/routes/agentRoutes.js — Decoupled Endpoint Security

        • Humne kya kiya: router.post('/process-query', modelRouterMiddleware, handleAgentExecution);

        • Kyun kiya (Reasoning): Humne route handler mein controller se pehle modelRouterMiddleware ko pass kiya hai. Yeh Express ka Middleware Chaining Pattern hai. Iska fayda yeh hai ki controller ko khud dimaag nahi lagana padta ki use kaunsa model chalana hai. Controller ko ekdam saaf, pre-processed data milta hai. Is design pattern ko Separation of Concerns (SoC) kehte hain—routing ka kaam router ka, validation/routing decision middleware ka, aur execution controller ka.
