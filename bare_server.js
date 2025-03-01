const http = require('http');
const os = require('os');

// Create a basic HTTP server
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString()
    }));
});

// Log all network interfaces
console.log('Available network interfaces:', os.networkInterfaces());

// Log all environment variables
console.log('Environment variables:', {
    PORT: process.env.PORT,
    REPL_ID: process.env.REPL_ID,
    REPL_SLUG: process.env.REPL_SLUG,
    REPL_OWNER: process.env.REPL_OWNER,
    NODE_ENV: process.env.NODE_ENV,
    HOME: process.env.HOME,
    PATH: process.env.PATH
});

// Bind server with detailed error handling
server.listen(5000, '0.0.0.0', () => {
    const addr = server.address();
    console.log('Server started successfully:', {
        address: addr.address,
        port: addr.port,
        family: addr.family,
        pid: process.pid
    });
});

server.on('error', (error) => {
    console.error('Server error:', error);
    if (error.code === 'EADDRINUSE') {
        console.error('Port 5000 is already in use');
        process.exit(1);
    }
});

// Keep the process running
process.on('SIGTERM', () => {
    console.log('Received SIGTERM signal');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
