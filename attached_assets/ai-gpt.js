const OpenAI = require('openai');
const logger = require('pino')();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Keep track of user conversations
const conversationHistory = new Map();

// Maximum conversation history length
const MAX_HISTORY_LENGTH = 4; // Reduced from 10 to save tokens

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5;
const userRateLimits = new Map();

// Circuit breaker configuration
let isCircuitOpen = false;
let lastErrorTime = 0;
const CIRCUIT_RESET_TIMEOUT = 5 * 60 * 1000; // 5 minutes

function checkRateLimit(userId) {
    const now = Date.now();
    const userLimit = userRateLimits.get(userId) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };

    if (now > userLimit.resetTime) {
        userLimit.count = 0;
        userLimit.resetTime = now + RATE_LIMIT_WINDOW;
    }

    if (userLimit.count >= MAX_REQUESTS_PER_WINDOW) {
        return false;
    }

    userLimit.count++;
    userRateLimits.set(userId, userLimit);
    return true;
}

function getFallbackResponse() {
    const responses = [
        "I'm currently experiencing high demand. Please try again in a few minutes.",
        "I need a quick break to recharge. Could you ask me again shortly?",
        "My AI services are temporarily busy. I'll be back to help you soon!"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
}

async function chatWithGPT(userId, message) {
    try {
        // Check circuit breaker
        if (isCircuitOpen) {
            const now = Date.now();
            if (now - lastErrorTime > CIRCUIT_RESET_TIMEOUT) {
                isCircuitOpen = false;
            } else {
                throw new Error('Service temporarily unavailable');
            }
        }

        // Check rate limit
        if (!checkRateLimit(userId)) {
            throw new Error('Rate limit exceeded. Please wait a minute before trying again.');
        }

        // Get or initialize conversation history
        if (!conversationHistory.has(userId)) {
            conversationHistory.set(userId, []);
        }
        const history = conversationHistory.get(userId);

        // Add user's message to history
        history.push({
            role: 'user',
            content: message
        });

        // Trim history if too long
        while (history.length > MAX_HISTORY_LENGTH) {
            history.shift();
        }

        // Create messages array with system prompt and history
        const messages = [
            {
                role: 'system',
                content: 'You are a helpful WhatsApp assistant. Be concise and direct.'
            },
            ...history
        ];

        // Make API request with enhanced logging
        logger.info('Making OpenAI API request:', {
            userId,
            messageLength: message.length,
            historyLength: history.length
        });

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo-instruct",
            messages: messages,
            max_tokens: 150, // Reduced from 800 to minimize token usage
            temperature: 0.7,
            presence_penalty: 0.6
        });

        // Get assistant's response
        const assistantResponse = response.choices[0].message.content;

        // Add assistant's response to history
        history.push({
            role: 'assistant',
            content: assistantResponse
        });

        logger.info('Received OpenAI response:', {
            userId,
            responseLength: assistantResponse.length
        });

        return assistantResponse;

    } catch (error) {
        logger.error('Error in chatWithGPT:', {
            error: error.message,
            userId,
            stack: error.stack
        });

        // Update circuit breaker on API errors
        if (error.message.includes('quota') || error.message.includes('rate_limit')) {
            isCircuitOpen = true;
            lastErrorTime = Date.now();
            throw new Error(getFallbackResponse());
        }

        throw new Error(`${getFallbackResponse()} (Error: ${error.message})`);
    }
}

// Function to clear conversation history
function clearConversation(userId) {
    conversationHistory.delete(userId);
    return "Conversation history cleared! Let's start fresh.";
}

module.exports = {
    chatWithGPT,
    clearConversation
};