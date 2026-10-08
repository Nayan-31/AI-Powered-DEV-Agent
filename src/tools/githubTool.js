/**
 * 1. Standard Tool Definition Schema Contract for the LLM
 * Tells the AI what the function does and what parameters it strictly expects.
 */
export const githubToolDefinition = {
    name: 'fetch_github_profile',
    description: 'Fetches public profile data, bio, and repository metrics from a specified GitHub username.',
    parameters: {
        type: 'object',
        properties: {
            username: {
                type: 'string',
                description: 'The exact GitHub username handle (e.g., Nayan-31)'
            }
        },
        required: ['username']
    }
};

/**
 * 2. Pure Backend Execution Function
 * Performs the actual live secure network operations when requested by the application layer logic.
 */
export const executeGitHubTool = async (args) => {
    const { username } = args;
    
    if (!username) {
        throw new Error("Missing required 'username' parameter payload for GitHub execution.");
    }

    console.log(`[📦 TOOL_EXECUTION_LOG]: Securely hitting GitHub API for user: [${username}]`);

    try {
        // Hitting live GitHub REST endpoints to pull user data metrics
        const response = await fetch(`https://api.github.com/users/${username}`);;
        
        if (!response.ok) {
            return { error: `GitHub profile data fetch failed with code status: ${response.status}` };
        }

        const data = await response.json();
        
        // Extracting only clean, necessary parameters to save context token space
        return {
            name: data.name,
            bio: data.bio,
            publicRepos: data.public_repos,
            followers: data.followers,
            profileUrl: data.html_url
        };
    } catch (err) {
        return { error: `Internal execution network error: ${err.message}` };
    }
};
