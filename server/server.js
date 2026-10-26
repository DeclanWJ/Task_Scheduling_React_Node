const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors())
app.use(express.json());

// API Routes
app.get('/api/message', (req, res) => {
    res.json({text: 'Node.js backend'});
});

app.listen(PORT, () =>{
    console.log('Server is running on port ${PORT}');
});