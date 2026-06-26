// server/config/db.js
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

// SSL configuration for cloud databases
const sslConfig = process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'false' ? false : true
} : undefined;

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'mysql-37808095-live-da0b.l.aivencloud.com',
    user: process.env.DB_USER || 'avnadmin',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'defaultdb',
    port: parseInt(process.env.DB_PORT) || 17811,
    ssl: sslConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    connectTimeout: 30000
});

console.log('Database pool created with Aiven MySQL');

module.exports = pool;
