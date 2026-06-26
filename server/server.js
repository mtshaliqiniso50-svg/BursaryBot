const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const profileRoutes = require('./routes/profile');
const uploadRoutes = require('./routes/upload');
const bursaryRoutes = require('./routes/external-bursaries');
const mobileRoutes = require('./routes/mobile');

const app = express();

// ============================================
// MIDDLEWARE
// ============================================

// Rate limiting to prevent abuse
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

// CORS - Allow all devices
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 📝 ${req.method} ${req.url} from ${req.ip}`);
    next();
});

// ============================================
// STATIC FILES
// ============================================

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../BBot/uploads')));
// Serve frontend files
app.use(express.static(path.join(__dirname, '../BBot')));

// ============================================
// API ROUTES
// ============================================

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/external-bursaries', bursaryRoutes);
app.use('/api/mobile', mobileRoutes);

// ============================================
// HEALTH CHECK
// ============================================

app.get('/api/health', async (req, res) => {
    try {
        const db = require('./config/database');
        const connection = await db.getConnection();
        connection.release();
        
        res.json({
            success: true,
            status: 'healthy',
            database: 'connected',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            server: 'BursaryBot API v1.0.0'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            status: 'unhealthy',
            database: 'disconnected',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// ============================================
// FRONTEND ROUTES
// ============================================

// Default route - serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../BBot/index.html'));
});

// Handle HTML files
app.get('/*.html', (req, res) => {
    const fileName = req.params[0] + '.html';
    const filePath = path.join(__dirname, '../BBot', fileName);
    res.sendFile(filePath);
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `API endpoint ${req.url} not found`
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.stack);
    
    // Multer error handling
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            success: false,
            message: 'File too large. Maximum size is 5MB.'
        });
    }
    
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log('\n' + '═'.repeat(60));
    console.log('🚀 BURSARYBOT SERVER IS RUNNING!');
    console.log('═'.repeat(60));
    console.log(`📍 Port:           ${PORT}`);
    console.log(`📍 Environment:    ${process.env.NODE_ENV || 'development'}`);
    console.log(`📍 Database:       ${process.env.DB_NAME || 'bursarybot_db'}`);
    console.log('\n📋 Available Endpoints:');
    console.log(`   🏠 Frontend:       http://localhost:${PORT}`);
    console.log(`   🔌 API Base:       http://localhost:${PORT}/api`);
    console.log(`   💚 Health Check:   http://localhost:${PORT}/api/health`);
    console.log(`   📱 Mobile View:    http://localhost:${PORT}/api/mobile`);
    console.log(`   📋 Bursaries:      http://localhost:${PORT}/api/external-bursaries`);
    console.log(`   🔐 Auth:           http://localhost:${PORT}/api/auth`);
    console.log('═'.repeat(60));
    console.log('🎯 Ready for requests!\n');
});

// ============================================
// TEST DATABASE CONNECTION ON STARTUP
// ============================================

const db = require('./config/database');
(async () => {
    try {
        console.log('🔄 Testing database connection...');
        const connected = await db.testConnection();
        if (connected) {
            // Check tables
            const connection = await db.getConnection();
            const [tables] = await connection.query('SHOW TABLES');
            console.log(`📋 Tables found: ${tables.length}`);
            connection.release();
        }
    } catch (error) {
        console.error('❌ Database check failed:', error.message);
    }
})();

module.exports = app;