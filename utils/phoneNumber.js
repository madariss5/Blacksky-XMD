// Phone number formatting utilities
const formatPhoneNumber = (phone) => {
    if (!phone) return '';

    // Remove any @s.whatsapp.net or @g.us suffix
    const cleanNumber = phone.split('@')[0];

    // Remove any non-numeric characters except '+'
    return cleanNumber.replace(/[^\d+]/g, '');
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

module.exports = {
    formatPhoneNumber,
    addWhatsAppSuffix,
    isGroupID,
    formatOwnerNumbers
};