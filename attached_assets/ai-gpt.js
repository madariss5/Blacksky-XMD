const OpenAI = require('openai');
const logger = require('pino')();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Keep track of user conversations
const conversationHistory = new Map();

// Maximum conversation history length
const MAX_HISTORY_LENGTH = 10;

async function chatWithGPT(userId, message) {
    try {
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
                content: 'You are BLACKSKY-MD, a helpful and friendly WhatsApp bot assistant. ' +
                         'Provide clear, concise, and engaging responses. ' +
                         'Keep responses under 2000 characters.'
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
            model: "gpt-3.5-turbo",
            messages: messages,
            max_tokens: 800,
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
        throw new Error(`OpenAI API Error: ${error.message}`);
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