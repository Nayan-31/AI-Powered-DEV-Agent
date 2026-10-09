import { githubToolDefinition, executeGitHubTool } from './githubTool.js';
import { repoIngestToolDefinition, executeRepoIngestion } from './repoIngestTool.js';

// 1. AI Menu Card (Tool Blueprints)
export const aiAvailableTools = [
    { type: 'function', function: githubToolDefinition },
    { type: 'function', function: repoIngestToolDefinition }
];

// 2. Centralized Execution Logic (Traffic Police for tools)
export const executeToolByName = async (functionName, functionArgs) => {
    switch (functionName) {
        case 'fetch_github_profile':
            return await executeGitHubTool(functionArgs);
            
        case 'ingest_repo_to_vectordb':
            return await executeRepoIngestion(functionArgs);
            
        default:
            throw new Error(`[TOOL_ERROR]: ${functionName} is not registered in the system.`);
    }
};