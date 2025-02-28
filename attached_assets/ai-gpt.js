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

// Simple local response patterns
const localResponses = {
    greetings: {
        patterns: ['hello', 'hi', 'hey', 'how are you'],
        responses: [
            "Hello! I'm your WhatsApp assistant. How can I help you today?",
            "Hi there! I'm here to help. What can I do for you?",
            "Hey! I'm ready to assist you. What would you like to know?"
        ]
    },
    thanks: {
        patterns: ['thank', 'thanks', 'appreciate'],
        responses: [
            "You're welcome! Let me know if you need anything else.",
            "Glad I could help! Feel free to ask more questions.",
            "Anytime! I'm here if you need further assistance."
        ]
    },
    help: {
        patterns: ['help', 'what can you do', 'commands'],
        responses: [
            "I can help with various tasks! Try asking me questions, or use commands like .daily for rewards.",
            "I'm here to assist! You can ask me questions or use economy commands like .work and .daily.",
            "Need help? I can answer questions and help you with game features. Just ask!"
        ]
    }
};

function getLocalResponse(message) {
    message = message.toLowerCase();

    for (const [category, data] of Object.entries(localResponses)) {
        if (data.patterns.some(pattern => message.includes(pattern))) {
            return data.responses[Math.floor(Math.random() * data.responses.length)];
        }
    }

    return null;
}

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
        "I'm currently in local mode. I can help with basic queries!",
        "I'm operating offline right now, but I'll try my best to help!",
        "My advanced AI is taking a break, but I can still assist with simple questions!"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
}

async function chatWithGPT(userId, message) {
    try {
        // Try local response first
        const localResponse = getLocalResponse(message);
        if (localResponse) {
            return localResponse;
        }

        // Check circuit breaker
        if (isCircuitOpen) {
            const now = Date.now();
            if (now - lastErrorTime > CIRCUIT_RESET_TIMEOUT) {
                isCircuitOpen = false;
            } else {
                return getFallbackResponse();
            }
        }

        // Check rate limit
        if (!checkRateLimit(userId)) {
            return "I'm getting too many requests. Please wait a minute before trying again.";
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
            max_tokens: 150,
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
            return getFallbackResponse();
        }

        return getFallbackResponse() + "\nTry asking something simple like 'hello' or 'help'!";
    }
}

function clearConversation(userId) {
    conversationHistory.delete(userId);
    return "Conversation history cleared! Let's start fresh.";
}

module.exports = {
    chatWithGPT,
    clearConversation
};