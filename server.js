const http = require('http');

// Create HTTP server with a simple response
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Server is running\n');
});

// Try to start server on port 8080
console.log('Attempting to start server on port 8080...');

server.listen(8080, '0.0.0.0', () => {
    console.log('Server successfully started and listening on port 8080');
});

server.on('error', (err) => {
    console.error('Server error occurred:', err.message);
    process.exit(1);
});

// Handle process termination
process.on('SIGTERM', () => {
    server.close(() => {
        console.log('Server shutdown complete');
        process.exit(0);
    });
});