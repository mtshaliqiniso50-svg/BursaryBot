const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../config/database');

// Register
router.post('/register', async (req, res) => {
    console.log('📝 Registration request received');
    console.log('Body:', req.body);
    
    try {
        const { username, email, password, full_name, phone, province, year_of_study, average_mark, institution } = req.body;
        
        // Validate input
        if (!username || !email || !password) {
            console.log('❌ Missing required fields');
            return res.status(400).json({
                success: false,
                message: 'Username, email and password are required'
            });
        }
        
        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }
        
        console.log(`👤 Creating user: ${username} (${email})`);
        
        // Get connection
        let connection;
        try {
            connection = await db.getConnection();
        } catch (dbError) {
            console.error('❌ Database connection error:', dbError.message);
            return res.status(500).json({
                success: false,
                message: 'Database connection failed. Please try again later.'
            });
        }
        
        try {
            // Check if user exists
            const [existing] = await connection.query(
                'SELECT id FROM users WHERE username = ? OR email = ?',
                [username, email]
            );
            
            if (existing.length > 0) {
                connection.release();
                console.log('❌ Username or email already exists');
                return res.status(400).json({
                    success: false,
                    message: 'Username or email already exists'
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);
            console.log('✅ Password hashed');
            
            // Create user
            const [result] = await connection.query(
                'INSERT INTO users (username, email, phone, password, role) VALUES (?, ?, ?, ?, ?)',
                [username, email, phone || null, hashedPassword, 'student']
            );
            
            const userId = result.insertId;
            console.log(`✅ User created with ID: ${userId}`);
            
            // Create profile
            await connection.query(
                `INSERT INTO student_profiles 
                 (user_id, full_name, institution, province, year_of_study, average_mark) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [userId, full_name || username, institution || null, province || null, parseInt(year_of_study) || 1, parseFloat(average_mark) || null]
            );
            
            connection.release();
            console.log('✅ Profile created successfully');
            
            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                userId: userId
            });
        } catch (queryError) {
            connection.release();
            console.error('❌ Query error:', queryError);
            throw queryError;
        }
        
    } catch (error) {
        console.error('❌ Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed: ' + error.message
        });
    }
});

// Login
router.post('/login', async (req, res) => {
    console.log('🔐 Login request received');
    console.log('Body:', req.body);
    
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            console.log('❌ Missing username or password');
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }
        
        console.log(`👤 Login attempt for: ${username}`);
        
        let connection;
        try {
            connection = await db.getConnection();
        } catch (dbError) {
            console.error('❌ Database connection error:', dbError.message);
            return res.status(500).json({
                success: false,
                message: 'Database connection failed. Please try again later.'
            });
        }
        
        const [users] = await connection.query(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, username]
        );
        connection.release();
        
        if (users.length === 0) {
            console.log('❌ User not found');
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        
        const user = users[0];
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
            console.log('❌ Invalid password');
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        
        console.log(`✅ User logged in: ${user.username}`);
        
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role || 'student' },
            process.env.JWT_SECRET || 'bursarybot_secret_key_2026',
            { expiresIn: process.env.JWT_EXPIRY || '7d' }
        );
        
        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                phone: user.phone,
                role: user.role || 'student'
            }
        });
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed: ' + error.message
        });
    }
});

module.exports = router;