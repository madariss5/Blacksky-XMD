const express = require('express');
const app = express();

// Single test endpoint
app.get('/', (req, res) => {
    console.log('Request received at /', {
        headers: req.headers,
        ip: req.ip
    });
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Create server with explicit binding
const server = app.listen(5000, '0.0.0.0', () => {
    const addr = server.address();
    console.log('Server binding details:', {
        address: addr.address,
        port: addr.port,
        family: addr.family,
        pid: process.pid
    });
});

// Basic error handling
server.on('error', (error) => {
    console.error('Server error:', error);
    if (error.code === 'EADDRINUSE') {
        console.error('Port 5000 is already in use');
        process.exit(1);
    }
});
