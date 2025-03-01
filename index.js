const http = require('http');

// Create HTTP server
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Server is running\n');
});

let port = 5000;
const maxRetries = 3;
let retryCount = 0;

function startServer() {
    try {
        server.listen(port, '0.0.0.0', () => {
            console.log('Server started on port', port);
        });

        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE' && retryCount < maxRetries) {
                console.error(`Port ${port} is in use, trying another port...`);
                retryCount++;
                port++;
                setTimeout(startServer, 1000);
            } else {
                console.error('Server failed to start:', err);
                process.exit(1);
            }
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server
startServer();