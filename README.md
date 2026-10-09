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


Step 2: RAG Pipeline ka Asli Flow Kaise Banega

1.      Code Fetching (Expanding GitHub Tool)
        Pehle hum ek naya GitHub tool banayenge jo sirf profile nahi, balki kisi repository ke andar ki files (jaise app.js, model.js) ka raw text (source code) fetch karega.

2.      Chunking (Code ko chote tukdo mein todna)
        Kyunki LLMs ki ek limit hoti hai (Context Window), hum ek poore repo ko ek sath AI ko nahi de sakte. Hum fetch kiye gaye code ko chote-chote "Chunks" (jaise 500-1000 words ya per-function) mein split karenge. Iske liye langchain ya custom JS functions ka use hoga.

3.      Vector Embeddings (Text to Numbers)
        Jo chunks humne tode hain, AI unhe padh nahi sakta jab tak wo Database mein dhoondhne layaq na ban jayein. Hum ek Embedding Model (jaise Mistral ka mistral-embed jiska error tumhe pehle aaya tha, wo yahan kaam aayega) use karke un code chunks ko Vectors (hazaaron numbers ki ek array) mein convert karenge. Ye numbers code ke meaning aur context ko store karte hain.

4.      Pinecone Vector DB (Store & Semantic Search)
        Ye saare vectors aur unka original code Pinecone mein save ho jayega.
        Jab user prompt dega: "Nayan-31 ke repo mein authentication logic kahan likha hai?"

        Backend is sawal ka Vector banayega.

        Pinecone DB mein search karega ki kaunse code chunks is sawal se sabse zyada match karte hain (Semantic Search).

        Pinecone wo top 3-4 relevant code chunks wapas dega.

        Tumhara modelRouter un 3-4 chunks ko Mistral AI ko dega, aur Mistral unhe padh kar ek perfect summary ya answer generate karega.

        Is pipeline ko start karne ke liye sabse pehla technical step Pinecone par account banakar ek free Vector Index create karna aur @pinecone-database/pinecone package install karna hoga. Agar Pinecone ka API key ready hai, toh hum embeddings generate karne wala naya middleware likhna shuru kar sakte hain.