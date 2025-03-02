// Phone number formatting utilities
const formatPhoneNumber = (phone) => {
    if (!phone) return '';

    // Log the input for debugging
    console.log('Formatting phone number:', {
        input: phone,
        hasWhatsAppSuffix: phone.includes('@s.whatsapp.net'),
        hasGroupSuffix: phone.includes('@g.us'),
        containsDeviceId: phone.includes(':')
    });

    // Remove any @s.whatsapp.net or @g.us suffix
    const cleanNumber = phone.split('@')[0];

    // Remove any device IDs in JIDs
    const baseNumber = cleanNumber.split(':')[0];

    // Remove any non-numeric characters except '+'
    const formattedNumber = baseNumber.replace(/[^\d+]/g, '');

    // Log the transformation steps
    console.log('Phone number transformation:', {
        original: phone,
        afterSuffixRemoval: cleanNumber,
        afterDeviceIdRemoval: baseNumber,
        final: formattedNumber
    });

    return formattedNumber;
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