// ==========================================
// TOOL BLUEPRINT (AI MENU CARD)
// ==========================================
// Ye JSON schema AI (Mistral/Gemini) ke padhne ke liye hai. AI code nahi padh sakta, 
// isliye hum usko is format mein batate hain ki humare paas kya tool hai.
export const githubToolDefinition = {
    name: 'fetch_github_profile', // AI is exact naam ko pukaarega jab usko ye tool chalana hoga
    description: 'Fetches public profile data, bio, and repository metrics from a specified GitHub username.', // AI is line ko padh kar decide karta hai ki ye tool kab use karna hai
    parameters: {
        type: 'object',
        properties: {
            username: {
                type: 'string',
                description: 'The exact GitHub username handle (e.g., Nayan-31)' // AI ko hint de rahe hain ki username kaisa dikhta hai
            }
        },
        required: ['username'] // Iske bina tool chal hi nahi sakta, username dena compulsory hai
    }
};

// ==========================================
// ASLI EXECUTION LOGIC (Backend Function)
// ==========================================
// Jab AI tool select karta hai, tab humara 'toolRegistry' is function ko call karta hai
export const executeGitHubTool = async (args) => {
    // 1. Argument Extract karna: AI ne jo JSON argument bheja hai, usme se username nikal lo
    const { username } = args;
    
    // 2. Safety Check: Agar kisi wajah se username empty aa gaya, toh function yahin rok do (Crash se bachne ke liye)
    if (!username) {
        throw new Error("Missing required 'username' parameter payload for GitHub execution.");
    }

    console.log(`[TOOL_EXECUTION_LOG]: Securely hitting GitHub API for user: [${username}]`);

    try {
        // STEP 1: Live Network Call
        // Node.js ka inbuilt fetch use karke GitHub ki official API ko hit kar rahe hain
        const response = await fetch(`https://api.github.com/users/${username}`);
        
        // STEP 2: Graceful Error Handling
        // Agar user ne galat naam daal diya jo GitHub par nahi hai (e.g., 404 status), 
        // toh hum server crash nahi karte, balki AI ko ek clean error bhej dete hain.
        if (!response.ok) {
            return { error: `GitHub profile data fetch failed with code status: ${response.status}` };
        }

        // STEP 3: Data Parsing
        // API se jo data aaya hai, use JavaScript JSON object mein convert kar rahe hain
        const data = await response.json();
        
        // STEP 4: Token Optimization (Smart Filtering)
        // GitHub API ek user ki 50+ details bhejti hai (jaise node_id, gravatar_id, events_url aadi).
        // Agar hum wo sab AI ko bhejenge toh "Tokens" (AI API ka limit/paisa) waste hoga aur error aa sakta hai.
        // Isliye hum sirf kaam ki 5 cheezein nikal kar return kar rahe hain.
        return {
            name: data.name,
            bio: data.bio,
            publicRepos: data.public_repos,
            followers: data.followers,
            profileUrl: data.html_url
        };
    } catch (err) {
        // Agar internet issue ya API fail hui, toh catch block AI ko bata dega ki network error aaya hai
        return { error: `Internal execution network error: ${err.message}` };
    }
};