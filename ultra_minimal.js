const express = require('express');
const app = express();

// Single test endpoint
app.get('/', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Create server with explicit binding
const server = app.listen(5000, '0.0.0.0', () => {
    // Log complete binding details
    const addr = server.address();
    console.log('Server binding details:', {
        address: addr.address,
        port: addr.port,
        family: addr.family
    });
    
    // Log all relevant environment variables
    console.log('Environment details:', {
        PORT: process.env.PORT,
        REPL_ID: process.env.REPL_ID,
        REPL_SLUG: process.env.REPL_SLUG,
        REPL_OWNER: process.env.REPL_OWNER,
        NODE_ENV: process.env.NODE_ENV
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
