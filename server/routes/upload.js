const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

// Create uploads folder
const uploadDir = path.join(__dirname, '../../BBot/uploads/profiles');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp/;
        const extname = allowed.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowed.test(file.mimetype);
        if (mimetype && extname) return cb(null, true);
        cb(new Error('Only image files are allowed'));
    }
});

// POST /api/upload/profile-picture - Upload profile picture
router.post('/profile-picture', auth, upload.single('profile_pic'), async (req, res) => {
    console.log('📸 Upload request received');
    
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const filename = `user-${req.user.id}-${Date.now()}.jpg`;
        const filepath = path.join(uploadDir, filename);

        // Resize and optimize image with Sharp
        await sharp(req.file.buffer)
            .resize(300, 300, { fit: 'cover' })
            .jpeg({ quality: 80 })
            .toFile(filepath);

        const imagePath = `/uploads/profiles/${filename}`;

        // Update database
        await db.query(
            'UPDATE users SET profile_pic = ? WHERE id = ?',
            [imagePath, req.user.id]
        );

        res.json({
            success: true,
            message: 'Profile picture updated',
            profile_pic: imagePath
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ success: false, message: 'Upload failed: ' + error.message });
    }
});

// GET /api/upload/profile-picture/:userId - Get profile picture
router.get('/profile-picture/:userId', async (req, res) => {
    try {
        const [users] = await db.query('SELECT profile_pic FROM users WHERE id = ?', [req.params.userId]);
        res.json({ success: true, profile_pic: users[0]?.profile_pic || null });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE /api/upload/profile-picture - Delete profile picture
router.delete('/profile-picture', auth, async (req, res) => {
    try {
        const [users] = await db.query('SELECT profile_pic FROM users WHERE id = ?', [req.user.id]);
        
        if (users[0]?.profile_pic) {
            const oldPath = path.join(__dirname, '../../BBot', users[0].profile_pic);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }
        
        await db.query('UPDATE users SET profile_pic = NULL WHERE id = ?', [req.user.id]);
        
        res.json({ success: true, message: 'Profile picture deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;