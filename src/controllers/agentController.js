// src/controllers/agentController.js
import { geminiClient, mistralClient, MODEL_MAPPING } from '../config/aiconfig.js';
import { aiAvailableTools, executeToolByName } from '../tools/toolRegistry.js'; 

// ==========================================
// MAIN AGENT CONTROLLER (The Traffic Police)
// ==========================================
// Ye function tumhare poore AI system ka "Brain" hai. Frontend se jo bhi sawal aayega, 
// wo yahan aayega aur ye decide karega ki usko kaise handle karna hai.
export const handleAgentExecution = async (req, res) => {
    try {
        // 1. User ka sawal (prompt) nikal lo
        const { prompt } = req.body;
        
        // 2. Routing Bypass (Abhi humne forcefully Mistral set kiya hua hai taaki Gemini ka Quota error na aaye)
        const targetModel = MODEL_MAPPING.PREMIUM_CORE;

        // ==========================================
        // MISTRAL FLOW (Premium / Tool Calling Flow)
        // ==========================================
        if (targetModel === MODEL_MAPPING.PREMIUM_CORE) {
            console.log(`[CORE_EXECUTION]: Activating Mistral Flow...`);

            // STEP 1: First LLM Hit (AI ko Menu Card Dena)
            // Hum Mistral ko user ka sawal bhej rahe hain, aur sath mein bata rahe hain ki 
            // "Hamare paas ye tools (aiAvailableTools) hain, zaroorat pade toh use kar lena."
            const mistralResponse = await mistralClient.chat.complete({ 
                model: targetModel,
                messages: [{ role: 'user', content: prompt }],
                tools: aiAvailableTools, // Registry se direct tools ki list utha li
                temperature: 0.2 // Creativity kam rakhi hai taaki AI strictly code/tools par focus kare
            });

            // AI ka pehla reply pakad liya
            const message = mistralResponse.choices[0].message;
            console.log("message--->" , message)

            // STEP 2: Intent Detection (Kya AI ne kisi tool ki maang ki?)
            // Agar message ke andar 'toolCalls' hai, matlab AI bol raha hai ki "Mujhe answer dene ke liye database/API check karna padega"
            if (message.toolCalls && message.toolCalls.length > 0) {
                console.log(`[ AI_INTENT]: AI wants to execute ${message.toolCalls.length} tool(s).`);

                const toolResultsMessages = []; // Mistral ko wapas bhejne ke liye results ki list
                const rawOutputs = [];          // Postman/Frontend ko bhejne ke liye raw data

                // 🛠️ BUG FIX 1: Missing ID Patch
                // Kabhi kabhi Mistral tool maangta hai par "Ticket ID" (id) bhejna bhool jata hai jisse API crash ho jati hai.
                // Hum khud check kar rahe hain, agar ID nahi hai, toh ek random ID (jaise 'call_a1b2c3') assign kar dete hain.
                message.toolCalls.forEach(tc => {
                    if (!tc.id) {
                        tc.id = `call_${Math.random().toString(36).substring(2, 11)}`;
                    }
                });

                // STEP 3: Execution Loop (AI ne jitne tool mange, sabko ek-ek karke chalao)
                for (const toolCall of message.toolCalls) {
                    const functionName = toolCall.function.name; // Tool ka naam (e.g., 'ingest_repo_to_vectordb')
                    const functionArgs = JSON.parse(toolCall.function.arguments); // Tool ke parameters (e.g., username, repo)

                    console.log(`[⚙️ EXECUTING]: ${functionName} with ID: ${toolCall.id}`, functionArgs);

                    // MAGIC: Humne if-else nahi likha. Seedha toolRegistry ko naam diya aur usne backend mein function chala kar result laakar de diya.
                    const toolResultData = await executeToolByName(functionName, functionArgs);
                    
                    rawOutputs.push(toolResultData); // Frontend ke liye save kar liya

                    // 🛠️ BUG FIX 2: Format result for SDK
                    // SDK ko strictly 'toolCallId' (camelCase) chahiye hota hai. Hum tool ka output is format mein pack kar rahe hain.
                    toolResultsMessages.push({
                        role: 'tool',
                        name: functionName,
                        content: JSON.stringify(toolResultData),
                        toolCallId: toolCall.id 
                    });
                }

                // STEP 4: Second LLM Hit (AI ko result dena aur Final Answer banana)
                // Ab hum Mistral ke paas wapas ja rahe hain aur bol rahe hain: "Tune jo DB/API tool chalane bola tha, uska result ye raha. 
                // Ab is result ko padh aur user ko human language mein samjha de."
                const finalMistralResponse = await mistralClient.chat.complete({
                    model: targetModel,
                    messages: [
                        { role: 'user', content: prompt }, // Original sawal
                        message,                           // AI ki tool maangne wali request (Patch ki hui)
                        ...toolResultsMessages             // Hamare backend se nikla hua tool ka Result
                    ]
                });

                // STEP 5: Final Response to Frontend/Postman
                return res.status(200).json({
                    success: true,
                    intelligenceTierAllocated: req.intelligenceTier,
                    modelExecuted: targetModel,
                    actionExecuted: 'TOOL_CALL_CYCLE_COMPLETE',
                    toolsUsed: message.toolCalls.map(tc => tc.function.name), // Kaun-kaun se tools chale uski list
                    rawToolOutputs: rawOutputs, // Asli JSON data
                    data: finalMistralResponse.choices[0].message.content // AI ka banaya hua human-readable lamba answer
                });
            }

            // Agar Mistral ko laga ki is sawal mein tool ki zaroorat nahi hai (jaise "What is HTML?"),
            // toh seedha answer return kar do.
            return res.status(200).json({
                success: true,
                actionExecuted: 'STANDARD_TEXT_GENERATION',
                data: message.content
            });

        } else {
            // ==========================================
            // GEMINI FLOW (Free / Fast Tier)
            // ==========================================
            // Agar simple task hai aur targetModel Gemini hai, toh bina kisi tool checking ke seedha fast response laakar de do.
            console.log(`[RAPID_EXECUTION]: Activating Gemini Flow...`);
            const economyCompletion = await geminiClient.models.generateContent({
                model: targetModel,
                contents: prompt,
            });

            return res.status(200).json({
                success: true,
                actionExecuted: 'GEMINI_STANDARD_GENERATION',
                data: economyCompletion.text
            });
        }

    } catch (error) {
        // Agar poore process mein internet chala jaye ya DB fat jaye, toh server band nahi hoga, bas ye error phekega.
        console.error('[AGENT_CONTROLLER_CRITICAL_EXCEPTION]:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};