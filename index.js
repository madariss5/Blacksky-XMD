const express = require('express');
const app = express();

// Basic route
app.get('/', (req, res) => {
    res.send('Server is running');
});

// Start server with error handling
app.listen(5000, '0.0.0.0', () => {
    console.log('Server started on port 5000');
}).on('error', (err) => {
    console.error('Server failed to start:', err);
    process.exit(1);
});