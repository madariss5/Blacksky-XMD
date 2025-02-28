const OpenAI = require('openai');
const logger = require('pino')();

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024.
// do not change this unless explicitly requested by the user
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
            model: "gpt-4o", // Latest model as of May 2024
            messages: messages,
            max_tokens: 500,
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
        throw new Error('Failed to process your message. Please try again later.');
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