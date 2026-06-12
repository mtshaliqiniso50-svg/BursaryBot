const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const router = express.Router();

/*
=========================================
REGISTER
=========================================
*/
router.post('/register', async (req, res) => {

    try {
        let {
            username,
            email,
            phone,
            password
        } = req.body;

        // Remove unnecessary spaces
        username = username?.trim();
        email = email?.trim().toLowerCase();
        phone = phone?.trim();

        // Required fields
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username, email and password are required'
            });
        }

        // Password validation
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email address'
            });
        }

        // Check existing email or username
        const [existingUsers] = await db.query(
            `SELECT id FROM users WHERE email = ? OR username = ?`,
            [email, username]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Username or email already exists'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user
        const [result] = await db.query(
            `INSERT INTO users (username, email, phone, password) VALUES (?, ?, ?, ?)`,
            [username, email, phone || null, hashedPassword]
        );

        // Generate token
        const token = jwt.sign(
            { id: result.insertId, email: email, username: username },
            process.env.JWT_SECRET || 'bursarybot_secret',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'Account created successfully!',
            token: token,
            user: {
                id: result.insertId,
                username: username,
                email: email
            }
        });

    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed: ' + error.message
        });
    }
});

/*
=========================================
LOGIN - Accepts Email OR Username
=========================================
*/
router.post('/login', async (req, res) => {

    try {
        // Get credentials - supports both 'username' or 'email' field names
        const loginValue = req.body.username || req.body.email;
        const password = req.body.password;

        if (!loginValue || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username/Email and password are required'
            });
        }

        // Search by either username or email
        const [users] = await db.query(
            `SELECT * FROM users WHERE username = ? OR email = ?`,
            [loginValue, loginValue]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        const user = users[0];
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                username: user.username,
                role: user.role || 'student'
            },
            process.env.JWT_SECRET || 'bursarybot_secret',
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: `Welcome back, ${user.username}!`,
            token: token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role || 'student'
            }
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed: ' + error.message
        });
    }
});

module.exports = router;