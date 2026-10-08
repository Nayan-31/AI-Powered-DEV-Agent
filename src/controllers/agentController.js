import { geminiClient, mistralClient, MODEL_MAPPING } from '../config/aiconfig.js';
import { githubToolDefinition, executeGitHubTool } from '../tools/githubTool.js';

export const handleAgentExecution = async (req, res) => {
    try {
        const { prompt } = req.body;
        const targetModel = req.selectedAIModel;

        if (targetModel === MODEL_MAPPING.PREMIUM_CORE) {
            console.log(`[⚡ CORE_EXECUTION]: Activating Mistral Advanced Orchestration Flow with Tools...`);

            // 1. First LLM Hit: Passing the tool blueprints inside the API call contract
            const mistralResponse = await mistralClient.chat.complete({
                model: targetModel,
                messages: [{ role: 'user', content: prompt }],
                tools: [{ type: 'function', function: githubToolDefinition }], // Injecting tool blueprint
                temperature: 0.2
            });

            const message = mistralResponse.choices[0].message;

            // 2. Check if the AI model wants to execute a Tool (Intent Detection Loop)
            if (message.toolCalls && message.toolCalls.length > 0) {
                const toolCall = message.toolCalls[0];
                const functionName = toolCall.function.name;
                
                // Parsing the arguments string safely into clean JavaScript objects
                const functionArgs = JSON.parse(toolCall.function.arguments);

                console.log(`[🤖 AI_INTENT_DETECTED]: Model wants to call tool: [${functionName}] with args:`, functionArgs);

                if (functionName === 'fetch_github_profile') {
                    
                    // 🛡️ SECURITY ENFORCEMENT POINT: In production, verify user permissions before running
                    // e.g., if (req.user.id !== authorizedId) return error;

                    // 3. Backend executes the actual function safely
                    const toolResultData = await executeGitHubTool(functionArgs);

                    // 4. Second LLM Hit: Feeding the true execution results back to the AI model
                    const finalMistralResponse = await mistralClient.chat.complete({
                        model: targetModel,
                        messages: [
                            { role: 'user', content: prompt },
                            message, // Sending the initial AI tool call intent choice back for chain tracking
                            {
                                role: 'tool',
                                name: functionName,
                                content: JSON.stringify(toolResultData),
                                toolCallId: toolCall.id // Linking the response onto the specific call instance id
                            }
                        ]
                    });

                    return res.status(200).json({
                        success: true,
                        intelligenceTierAllocated: req.intelligenceTier,
                        modelExecuted: targetModel,
                        actionExecuted: 'TOOL_CALL_CYCLE_COMPLETE',
                        toolUsed: functionName,
                        rawToolOutputData: toolResultData,
                        data: finalMistralResponse.choices[0].message.content
                    });
                }
            }

            // If no tool call was required, return standard text generation directly
            return res.status(200).json({
                success: true,
                intelligenceTierAllocated: req.intelligenceTier,
                modelExecuted: targetModel,
                actionExecuted: 'STANDARD_TEXT_GENERATION',
                data: message.content
            });

        } else {
            // Free Tier Google Gemini Rapid chat execution engine
            console.log(`[⚡ RAPID_EXECUTION]: Activating Gemini Free Text Processor Flow...`);
            const economyCompletion = await geminiClient.models.generateContent({
                model: targetModel,
                contents: prompt,
            });

            return res.status(200).json({
                success: true,
                intelligenceTierAllocated: req.intelligenceTier,
                modelExecuted: targetModel,
                actionExecuted: 'GEMINI_STANDARD_GENERATION',
                data: economyCompletion.text
            });
        }

    } catch (error) {
        console.error('[AGENT_CONTROLLER_CRITICAL_EXCEPTION]:', error);
        return res.status(500).json({
            success: false,
            error: 'AI runtime Tool Calling backend flow failed.',
            message: error.message
        });
    }
};
