// Phone number formatting utilities
const formatPhoneNumber = (phone) => {
    if (!phone) return '';

    // Remove any @s.whatsapp.net or @g.us suffix
    const cleanNumber = phone.split('@')[0];

    // Remove any device IDs in JIDs
    const baseNumber = cleanNumber.split(':')[0];

    // Remove any non-numeric characters except '+'
    const formattedNumber = baseNumber.replace(/[^\d+]/g, '');

    // Remove leading '+' if present
    return formattedNumber.startsWith('+') ? formattedNumber.slice(1) : formattedNumber;
};

const addWhatsAppSuffix = (phone) => {
    const cleanNumber = formatPhoneNumber(phone);
    return cleanNumber ? `${cleanNumber}@s.whatsapp.net` : '';
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
    return '+' + cleanNumber.replace(/(\d{2})(\d{3})(\d{3})(\d{4})/, '$1 $2 $3 $4');
};

module.exports = {
    formatPhoneNumber,
    addWhatsAppSuffix,
    isGroupID,
    formatOwnerNumbers,
    formatDisplayNumber
};