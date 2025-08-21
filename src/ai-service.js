// src/ai-service.js

import 'dotenv/config';
import OpenAI from 'openai';

// 1. Load all keys from the environment
const apiKeys = Object.keys(process.env)
  .filter(key => key.startsWith('OPENAI_API_KEY_'))
  .sort()
  .map(key => process.env[key]);

if (apiKeys.length === 0) {
    throw new Error("No OpenAI API keys found in .env file. Please add at least one key (e.g., OPENAI_API_KEY_1).");
}

let currentKeyIndex = 0;

export async function getAiResponse(prompt, jsonMode = false) {
    if (currentKeyIndex >= apiKeys.length) {
        throw new Error("All API keys have been exhausted or are invalid.");
    }

    const currentKey = apiKeys[currentKeyIndex];
    const openai = new OpenAI({ apiKey: currentKey });

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: jsonMode ? "json_object" : "text" },
            temperature: 0.1,
            max_tokens: 4096,
        });
        return response.choices[0].message.content;
    } catch (error) {
        // Check for specific, retry-able errors (rate limit, invalid key)
        if (error.status === 429 || error.status === 401) {
            console.warn(`\n⚠️  API Key ${currentKeyIndex + 1} failed (${error.status} error). Trying next key...`);
            currentKeyIndex++;
            return getAiResponse(prompt, jsonMode); // Recursive call to retry with the next key
        } else {
            // For other errors (like context length), they are not retry-able, so fail immediately.
            console.error("\n❌ A non-retryable API error occurred:", error.message);
            throw error; // Re-throw the original error
        }
    }
}