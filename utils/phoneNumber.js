// Phone number formatting utilities
const logger = require('./logger');

const formatPhoneNumber = (phone) => {
    if (!phone) return '';

    // Log input for debugging
    logger.debug('Formatting phone number:', { input: phone });

    // Remove any @s.whatsapp.net or @g.us suffix
    const cleanNumber = phone.split('@')[0];

    // Remove any device IDs in JIDs
    const baseNumber = cleanNumber.split(':')[0];

    // Remove any non-numeric characters except '+'
    const formattedNumber = baseNumber.replace(/[^\d+]/g, '');

    // Remove leading '+' if present
    const result = formattedNumber.startsWith('+') ? formattedNumber.slice(1) : formattedNumber;

    // Log result for debugging
    logger.debug('Formatted phone number result:', { input: phone, output: result });

    return result;
};

const addWhatsAppSuffix = (phone) => {
    const cleanNumber = formatPhoneNumber(phone);
    const result = cleanNumber ? `${cleanNumber}@s.whatsapp.net` : '';

    // Log for debugging
    logger.debug('Adding WhatsApp suffix:', { input: phone, output: result });

    return result;
};

const isGroupID = (id) => {
    return id?.endsWith('@g.us');
};

const formatOwnerNumbers = (numbers) => {
    if (!Array.isArray(numbers)) {
        numbers = [numbers];
    }
    return numbers.map(num => formatPhoneNumber(num));
};

// Add a display formatting function for user-facing output
const formatDisplayNumber = (phone) => {
    const cleanNumber = formatPhoneNumber(phone);
    if (!cleanNumber) return '';

    // Format with international format (e.g., +49 123 456 7890)
    const displayNumber = '+' + cleanNumber.replace(/(\d{2})(\d{3})(\d{3})(\d{4})/, '$1 $2 $3 $4');

    // Log for debugging
    logger.debug('Formatting display number:', { input: phone, output: displayNumber });

    return displayNumber;
};

module.exports = {
    formatPhoneNumber,
    addWhatsAppSuffix,
    isGroupID,
    formatOwnerNumbers,
    formatDisplayNumber
};