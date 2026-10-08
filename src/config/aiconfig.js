import { GoogleGenAI } from '@google/genai';
import { Mistral } from '@mistralai/mistralai';
import dotenv from 'dotenv';

dotenv.config();

export const geminiClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY // Fixed: 'K' capital in apiKey
});

export const mistralClient = new Mistral({
    apiKey: process.env.MISTRAL_API_KEY // Fixed: 'K' capital in apiKey + added 'Y' at the end
});

export const MODEL_MAPPING = {
    PREMIUM_CORE: 'open-mistral-nemo',  // Option 1 (Free + Tool Calling supported)
    ECONOMY_CORE: 'gemini-2.0-flash'       // Rapid processing lightweight model
};