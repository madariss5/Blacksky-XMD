const moment = require('moment-timezone');
const logger = require('pino')();

// Utility to get formatted uptime
const getUptime = () => {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    return `${hours}h ${minutes}m ${seconds}s`;
};

// Get timestamp for messages
const getTimestamp = () => {
    return moment().format('YYYY-MM-DD HH:mm:ss');
};

// Clean JID (remove unwanted parts from WhatsApp ID)
const cleanJid = (jid) => {
    if (!jid) return jid;
    return jid.split('@')[0];
};

// Format file size
const formatSize = (size) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

// Sleep utility
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Random number generator
const randomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

module.exports = {
    getUptime,
    getTimestamp,
    cleanJid,
    formatSize,
    sleep,
    randomInt,
    logger
};