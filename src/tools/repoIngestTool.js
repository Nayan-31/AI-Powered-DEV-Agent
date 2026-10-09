import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { mistralClient } from '../config/aiconfig.js';
import { pineconeClient, PINECONE_INDEX_NAME } from '../config/pineconeConfig.js';
import dotenv from 'dotenv';

// 1. Environment variables load kar rahe hain
dotenv.config();

// ==========================================
// TOOL BLUEPRINT (AI MENU CARD)
// ==========================================
// AI isko padh kar samajh jayega ki ye tool kya karta hai aur isko kaunse parameters chahiye
export const repoIngestToolDefinition = {
    name: 'ingest_repo_to_vectordb',
    description: 'Fetches repository readme, chunks it, generates vectors, and saves them to Pinecone DB.',
    parameters: {
        type: 'object',
        properties: { username: { type: 'string' }, repo: { type: 'string' } },
        required: ['username', 'repo']
    }
};

// ==========================================
// ASLI EXECUTION LOGIC
// ==========================================
export const executeRepoIngestion = async ({ username, repo }) => {
    try {
        
        // STEP 1: GitHub API se README data fetch karna
        console.log(`[📦 REPO]: Fetching ${username}/${repo}...`);
        const response = await fetch(`https://api.github.com/repos/${username}/${repo}/readme`);
        
        // Agar repo public nahi hai ya exist nahi karti, toh fail kar do
        if (!response.ok) return { error: `Repo not found.` };

        const data = await response.json();
        
        // GitHub data base64 format mein bhejta hai, usko normal text (utf-8) mein convert kar rahe hain
        const rawContent = Buffer.from(data.content, 'base64').toString('utf-8');

        // STEP 2: Text Chunking (Bade text ke chhote tukde karna)
        console.log(`[🔪 CHUNKING]: Langchain text ko chunks mein tod raha hai...`);
        
        // Langchain ka splitter use kar rahe hain (1000 characters ka ek tukda, 200 ka overlap taaki context miss na ho)
        const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
        const chunks = await splitter.createDocuments([rawContent]);
        
        // Array se sirf text content bahar nikal rahe hain
        const chunkTexts = chunks.map(chunk => chunk.pageContent);

        // STEP 3: Embeddings Generate Karna (Text ko Vectors/Numbers mein convert karna)
        console.log(`[🧠 EMBEDDING]: Calling Mistral Embed API...`);
        const embeddingResponse = await mistralClient.embeddings.create({
            model: 'mistral-embed',
            inputs: chunkTexts // Mistral API ko saare chunks ek sath bhej diye
        });

        // STEP 4: Pinecone DB ke liye Data Prepare Karna
        const vectorsToUpsert = [];
        const embeddingsData = embeddingResponse.data || [];

        // Loop chala kar Pinecone ke strict format mein data set kar rahe hain
        for (let i = 0; i < embeddingsData.length; i++) {
            const item = embeddingsData[i];
            
            // Mistral se aaye hue array ko explicitly JavaScript 'Number' type mein force convert kar rahe hain
            const numericVector = Array.from(item.embedding || item.values || []).map(Number);
            
            if (numericVector.length > 0) {
                vectorsToUpsert.push({
                    id: `${username}-${repo}-chunk-${i}`, // Har chunk ke liye ek unique ID
                    values: numericVector,                // 1024 dimensions wala number array
                    metadata: { repoName: repo, text: chunkTexts[i] } // Original text bhi save kar rahe hain taaki search ke baad answer padh sakein
                });
            }
        }

        console.log(`[VECTORS]: Prepared ${vectorsToUpsert.length} vectors.`);

        // STEP 5: Pinecone SDK Bypass (Direct HTTP POST Upload)
        console.log(`[DATABASE]: Fetching Cloud Host URL...`);
        
        // SDK use karke sirf tumhare index ka actual backend URL nikal rahe hain
        const indexInfo = await pineconeClient.describeIndex(PINECONE_INDEX_NAME);
        const host = indexInfo.host; 
        
        // REST API endpoint ready kiya
        const pineconeApiUrl = `https://${host}/vectors/upsert`;
        const pineconeApiKey = process.env.PINECONE_API_KEY;

        console.log(`[🚀 DIRECT UPLOAD]: Sending raw HTTP POST to Pinecone bypassing SDK...`);
        
        // SDK validator bugs se bachne ke liye direct cloud ko data POST kar rahe hain
        const pineconeResponse = await fetch(pineconeApiUrl, {
            method: 'POST',
            headers: {
                'Api-Key': pineconeApiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                vectors: vectorsToUpsert
            })
        });

        // Agar Pinecone cloud ne data reject kar diya (jaise dimension mismatch), toh error throw karo
        if (!pineconeResponse.ok) {
            const errText = await pineconeResponse.text();
            throw new Error(`Pinecone Server Rejected (Direct HTTP): ${pineconeResponse.status} - ${errText}`);
        }

        // STEP 6: Success! AI Agent ko result wapas bhejna
        console.log(`[✅ SUCCESS]: All ${vectorsToUpsert.length} chunks saved to Vector DB!`);
        return {
            success: true,
            message: `Saved ${vectorsToUpsert.length} embeddings to Pinecone successfully.`
        };

    } catch (error) {
        // Kisi bhi step par code crash hua toh agent ko clean error message bhej do
        console.error("[🚨 INGESTION ERROR]:", error);
        return { error: `Ingestion failed: ${error.message}` };
    }
};