import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';

dotenv.config();

// Safety check taaki bina API key ke server aage na badhe
if (!process.env.PINECONE_API_KEY) {
    throw new Error("Missing PINECONE_API_KEY in .env file");
}

// Pinecone DB se connection establish kar rahe hain
export const pineconeClient = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY
});

// Jo naam tumne dashboard pe Index banate waqt rakha tha (dev-agent-index), wahi yahan likhna hai
export const PINECONE_INDEX_NAME = 'dev-agent-index';