// server/config/database.js
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

// SSL configuration for cloud databases
const sslConfig = process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'false' ? false : true
} : undefined;

const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '@SpheH2blevel4',
    database: process.env.DB_NAME || 'bursarybot_db',
    port: parseInt(process.env.DB_PORT) || 3306,
    ssl: sslConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    connectTimeout: 30000
});

const testConnection = async () => {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log('✅ Database connected successfully');
        const [rows] = await connection.query('SELECT DATABASE() as db_name, VERSION() as version');
        console.log(`📊 Connected to: ${rows[0].db_name} (MySQL ${rows[0].version})`);
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    } finally {
        if (connection) connection.release();
    }
};

module.exports = {
    pool: pool,
    getConnection: async () => {
        return await pool.getConnection();
    },
    query: async (sql, params) => {
        try {
            const [rows] = await pool.query(sql, params);
            return rows;
        } catch (error) {
            console.error('Database query error:', error);
            throw error;
        }
    },
    testConnection: testConnection
};