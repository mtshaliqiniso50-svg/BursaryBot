const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const profileRoutes = require('./routes/profile');
const uploadRoutes = require('./routes/upload');
const bursaryRoutes = require('./routes/external-bursaries');

const app = express();

app.use(cors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
// IMPORTANT: Uploads folder should be inside BBot
app.use('/uploads', express.static(path.join(__dirname, '../BBot/uploads')));
app.use(express.static(path.join(__dirname, '../BBot')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/external-bursaries', bursaryRoutes);

// Default route - serve index.html from BBot folder
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../BBot/index.html'));
});

// Handle all other routes - serve the requested HTML file
app.get('/*.html', (req, res) => {
    const fileName = req.params[0] + '.html';
    res.sendFile(path.join(__dirname, '../BBot', fileName));
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📱 Frontend: http://localhost:${PORT}`);
    console.log(`🔌 API: http://localhost:${PORT}/api`);
});

// Test database connection
const db = require('./config/db');
(async () => {
    try {
        const connection = await db.getConnection();
        console.log('✅ Database connected successfully');
        connection.release();
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
    }
})();