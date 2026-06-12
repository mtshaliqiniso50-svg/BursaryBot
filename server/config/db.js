const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

// Create connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '@SpheH2blevel4',
    database: process.env.DB_NAME || 'bursarybot_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

const promisePool = pool.promise();

// Test connection
const testConnection = async () => {
    try {
        const connection = await promisePool.getConnection();
        console.log('✅ MySQL database connected successfully');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ MySQL connection failed:', error.message);
        console.log('\n📌 Troubleshooting:');
        console.log('1. Make sure MySQL is running');
        console.log('2. Check your .env credentials');
        console.log('3. Run the database.sql file first');
        return false;
    }
};

testConnection();

module.exports = promisePool;