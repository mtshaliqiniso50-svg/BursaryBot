const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Mobile-optimized get all bursaries
router.get('/bursaries', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * limit;
        
        const [rows] = await pool.query(
            `SELECT id, name, provider, description, field_of_study, 
                    min_average, max_income, province, deadline, apply_link 
             FROM bursaries 
             WHERE is_active = true 
             ORDER BY deadline ASC 
             LIMIT ? OFFSET ?`,
            [limit, offset]
        );
        
        const [countResult] = await pool.query(
            'SELECT COUNT(*) as total FROM bursaries WHERE is_active = true'
        );
        
        res.json({
            success: true,
            data: rows,
            pagination: {
                page: page,
                limit: limit,
                total: countResult[0].total,
                hasMore: rows.length === limit
            }
        });
    } catch (error) {
        console.error('Error fetching mobile bursaries:', error);
        res.status(500).json({ success: false, message: 'Error fetching bursaries' });
    }
});

// Get single bursary
router.get('/bursaries/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM bursaries WHERE id = ? AND is_active = true',
            [req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Bursary not found' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Error fetching bursary:', error);
        res.status(500).json({ success: false, message: 'Error fetching bursary details' });
    }
});

// Search bursaries
router.get('/search', async (req, res) => {
    try {
        const query = req.query.q || '';
        const searchTerm = `%${query}%`;
        
        const [rows] = await pool.query(
            `SELECT id, name, provider, description, deadline, apply_link 
             FROM bursaries 
             WHERE is_active = true 
             AND (name LIKE ? OR provider LIKE ? OR description LIKE ? OR field_of_study LIKE ?)
             ORDER BY deadline ASC 
             LIMIT 20`,
            [searchTerm, searchTerm, searchTerm, searchTerm]
        );
        
        res.json({ success: true, count: rows.length, data: rows });
    } catch (error) {
        console.error('Error searching bursaries:', error);
        res.status(500).json({ success: false, message: 'Error searching bursaries' });
    }
});

// Mobile HTML View
router.get('/', async (req, res) => {
    try {
        const [bursaries] = await pool.query(
            'SELECT * FROM bursaries WHERE is_active = true ORDER BY deadline ASC LIMIT 50'
        );
        
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=yes">
                <title>BursaryBot - Bursaries</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        background: #f5f5f5;
                        padding: 16px;
                    }
                    .header {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 20px;
                        border-radius: 12px;
                        margin-bottom: 16px;
                    }
                    .header h1 { font-size: 24px; font-weight: 600; }
                    .header p { opacity: 0.9; margin-top: 4px; }
                    .search-box {
                        width: 100%;
                        padding: 12px;
                        border: 2px solid #ddd;
                        border-radius: 8px;
                        font-size: 16px;
                        margin-bottom: 16px;
                    }
                    .search-box:focus { outline: none; border-color: #667eea; }
                    .bursary-card {
                        background: white;
                        border-radius: 12px;
                        padding: 16px;
                        margin-bottom: 16px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }
                    .bursary-card h3 { font-size: 18px; color: #333; margin-bottom: 4px; }
                    .bursary-card .provider { color: #666; font-size: 14px; }
                    .bursary-card .deadline { color: #e74c3c; font-size: 14px; margin-top: 8px; }
                    .bursary-card .field {
                        display: inline-block;
                        background: #667eea;
                        color: white;
                        padding: 4px 12px;
                        border-radius: 20px;
                        font-size: 12px;
                        margin-top: 8px;
                    }
                    .apply-btn {
                        display: inline-block;
                        background: #667eea;
                        color: white;
                        padding: 8px 20px;
                        border-radius: 8px;
                        text-decoration: none;
                        margin-top: 12px;
                        font-size: 14px;
                    }
                    .apply-btn:active { opacity: 0.8; }
                    .stats {
                        display: flex;
                        justify-content: space-around;
                        background: white;
                        padding: 16px;
                        border-radius: 12px;
                        margin-bottom: 16px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }
                    .stats .number { font-size: 20px; font-weight: bold; color: #667eea; }
                    .stats .label { font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>🎓 BursaryBot</h1>
                    <p>Find and apply for bursaries</p>
                </div>
                <div class="stats">
                    <div><div class="number">${bursaries.length}</div><div class="label">Available</div></div>
                    <div><div class="number">${bursaries.filter(b => new Date(b.deadline) > new Date()).length}</div><div class="label">Active</div></div>
                    <div><div class="number">${new Set(bursaries.map(b => b.provider)).size}</div><div class="label">Providers</div></div>
                </div>
                <input type="text" class="search-box" id="searchInput" placeholder="🔍 Search bursaries..." onkeyup="searchBursaries()">
                <div id="bursariesList">
                    ${bursaries.map(b => `
                        <div class="bursary-card" data-name="${b.name.toLowerCase()}" data-provider="${b.provider.toLowerCase()}">
                            <h3>${b.name}</h3>
                            <div class="provider">🏢 ${b.provider}</div>
                            <div class="field">${b.field_of_study || 'All Fields'}</div>
                            <div class="deadline">⏰ Deadline: ${new Date(b.deadline).toLocaleDateString()}</div>
                            <a href="${b.apply_link}" target="_blank" class="apply-btn">Apply Now →</a>
                        </div>
                    `).join('')}
                </div>
                <script>
                    function searchBursaries() {
                        const input = document.getElementById('searchInput');
                        const filter = input.value.toLowerCase();
                        const cards = document.getElementsByClassName('bursary-card');
                        for (let card of cards) {
                            const name = card.getAttribute('data-name');
                            const provider = card.getAttribute('data-provider');
                            card.style.display = (name.includes(filter) || provider.includes(filter)) ? '' : 'none';
                        }
                    }
                </script>
            </body>
            </html>
        `);
    } catch (error) {
        console.error('Error serving mobile view:', error);
        res.status(500).send('Error loading bursaries');
    }
});

module.exports = router;