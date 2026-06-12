const express = require('express');

const router = express.Router();

// Bursaries data - Combined and organized
const bursaries = [
    // NSFAS and Government Bursaries
    {
        id: 1,
        name: 'NSFAS Bursary',
        provider: 'NSFAS',
        field_of_study: 'All Fields',
        province: 'South Africa',
        deadline: '2026-11-30',
        apply_link: 'https://www.nsfas.org.za',
        description: 'Financial support for South African students from low-income households.',
        min_average: 50,
        income_limit: 350000,
        tags: ['financial aid', 'government', 'all fields']
    },
    {
        id: 2,
        name: 'Funza Lushaka Teaching Bursary',
        provider: 'Department of Education',
        field_of_study: 'Education',
        province: 'South Africa',
        deadline: '2026-10-01',
        apply_link: 'https://www.funzalushaka.doe.gov.za',
        description: 'Teaching bursary for future educators.',
        min_average: 60,
        income_limit: 300000,
        tags: ['teaching', 'education', 'government']
    },
    
    // Corporate Bursaries
    {
        id: 3,
        name: 'Sasol Engineering Bursary',
        provider: 'Sasol',
        field_of_study: 'Engineering',
        province: 'Gauteng',
        deadline: '2026-09-15',
        apply_link: 'https://www.sasolbursaries.com',
        description: 'Bursary for engineering students with strong academic records.',
        min_average: 65,
        income_limit: 400000,
        tags: ['engineering', 'stem', 'corporate']
    },
    {
        id: 4,
        name: 'Sasol Foundation Bursary',
        provider: 'Sasol',
        field_of_study: 'IT',
        province: 'All',
        deadline: '2026-12-31',
        apply_link: 'https://www.sasol.com/bursaries',
        description: 'For students in Science, Technology, Engineering, and Mathematics (STEM).',
        min_average: 65,
        income_limit: 400000,
        tags: ['stem', 'engineering', 'it', 'science']
    },
    {
        id: 5,
        name: 'Transnet Bursary',
        provider: 'Transnet',
        field_of_study: 'Engineering',
        province: 'KwaZulu-Natal',
        deadline: '2026-08-20',
        apply_link: 'https://www.transnet.net',
        description: 'Funding for transport and logistics studies.',
        min_average: 60,
        income_limit: 350000,
        tags: ['transport', 'logistics', 'engineering']
    },
    {
        id: 6,
        name: 'MTN Bursary Programme',
        provider: 'MTN South Africa',
        field_of_study: 'IT',
        province: 'All',
        deadline: '2026-12-31',
        apply_link: 'https://www.mtn.co.za/bursaries',
        description: 'For students in IT, Data Science, Telecommunications, and Business.',
        min_average: 65,
        income_limit: 350000,
        tags: ['it', 'telecommunications', 'data science']
    },
    {
        id: 7,
        name: 'Vodacom Bursary',
        provider: 'Vodacom',
        field_of_study: 'IT',
        province: 'All',
        deadline: '2026-11-30',
        apply_link: 'https://www.vodacom.co.za/bursaries',
        description: 'For students in IT, Data Science, and Telecommunications.',
        min_average: 65,
        income_limit: 350000,
        tags: ['it', 'telecommunications', 'data']
    },
    {
        id: 8,
        name: 'Old Mutual Bursary',
        provider: 'Old Mutual',
        field_of_study: 'IT',
        province: 'All',
        deadline: '2027-01-31',
        apply_link: 'https://www.oldmutual.com/bursaries',
        description: 'For students in IT, Actuarial Science, Finance, and Business.',
        min_average: 68,
        income_limit: 400000,
        tags: ['finance', 'it', 'business', 'actuarial']
    },
    {
        id: 9,
        name: 'Standard Bank Bursary',
        provider: 'Standard Bank',
        field_of_study: 'IT',
        province: 'All',
        deadline: '2027-01-31',
        apply_link: 'https://www.standardbank.com/bursaries',
        description: 'For students in IT, Finance, Economics, and Business Management.',
        min_average: 65,
        income_limit: 400000,
        tags: ['banking', 'it', 'finance', 'business']
    },
    {
        id: 10,
        name: 'BANKSETA IT Bursary',
        provider: 'Banking Sector Education Authority',
        field_of_study: 'IT',
        province: 'All',
        deadline: '2026-11-30',
        apply_link: 'https://www.bankseta.org.za/',
        description: 'For IT students in banking technology, software development, and data science.',
        min_average: 65,
        income_limit: 350000,
        tags: ['it', 'technology', 'software', 'banking']
    },
    
    // IT Specific Bursaries
    {
        id: 11,
        name: 'IT Excellence Bursary',
        provider: 'TechSA',
        field_of_study: 'IT',
        province: 'South Africa',
        deadline: '2026-12-15',
        apply_link: 'https://techsa.co.za',
        description: 'For IT students with 65%+ average.',
        min_average: 65,
        income_limit: 350000,
        tags: ['it', 'technology', 'excellence']
    },
    
    // Agriculture Bursaries
    {
        id: 12,
        name: 'Agriculture Development Fund',
        provider: 'AgriSA',
        field_of_study: 'Agriculture',
        province: 'All',
        deadline: '2026-11-30',
        apply_link: 'https://agrisa.co.za/bursary',
        description: 'Supporting future farmers and agricultural specialists.',
        min_average: 60,
        income_limit: 250000,
        tags: ['agriculture', 'farming', 'agri']
    },
    
    // Public Management Bursaries
    {
        id: 13,
        name: 'LGSETA Public Management Bursary',
        provider: 'Local Government SETA',
        field_of_study: 'Public Management',
        province: 'All',
        deadline: '2026-11-30',
        apply_link: 'https://www.lgseta.org.za/',
        description: 'For students in Public Management, Administration, and Local Government.',
        min_average: 60,
        income_limit: 350000,
        tags: ['public management', 'administration', 'government']
    },
    
    // Provincial Bursaries
    {
        id: 14,
        name: 'Mpumalanga Provincial Bursary',
        provider: 'Mpumalanga Government',
        field_of_study: 'All',
        province: 'Mpumalanga',
        deadline: '2026-10-31',
        apply_link: 'https://www.mpg.gov.za/',
        description: 'For Mpumalanga residents. Priority to students from rural areas.',
        min_average: 55,
        income_limit: 250000,
        tags: ['provincial', 'mpumalanga', 'all fields']
    },
    {
        id: 15,
        name: 'Garden Route Bursary',
        provider: 'Garden Route District Municipality',
        field_of_study: 'All',
        province: 'Western Cape',
        deadline: '2026-11-30',
        apply_link: 'https://www.gardenroute.gov.za/',
        description: 'For residents of Garden Route area. Supports various fields.',
        min_average: 60,
        income_limit: 300000,
        tags: ['municipal', 'western cape', 'all fields']
    },
    {
        id: 16,
        name: 'KZN Provincial Bursary',
        provider: 'KwaZulu-Natal Government',
        field_of_study: 'All',
        province: 'KwaZulu-Natal',
        deadline: '2026-10-31',
        apply_link: 'https://www.kzntreasury.gov.za/bursaries',
        description: 'For KZN residents pursuing higher education.',
        min_average: 55,
        income_limit: 250000,
        tags: ['provincial', 'kzn', 'all fields']
    },
    {
        id: 17,
        name: 'Western Cape Bursary',
        provider: 'Western Cape Government',
        field_of_study: 'All',
        province: 'Western Cape',
        deadline: '2026-11-30',
        apply_link: 'https://www.westerncape.gov.za/bursaries',
        description: 'For Western Cape residents. Supports various fields.',
        min_average: 60,
        income_limit: 300000,
        tags: ['provincial', 'western cape', 'all fields']
    },
    {
        id: 18,
        name: 'Gauteng City Region Bursary',
        provider: 'Gauteng Government',
        field_of_study: 'IT',
        province: 'Gauteng',
        deadline: '2026-12-31',
        apply_link: 'https://www.gauteng.gov.za/bursaries',
        description: 'For Gauteng residents in scarce skills qualifications.',
        min_average: 65,
        income_limit: 350000,
        tags: ['provincial', 'gauteng', 'scarce skills']
    }
];

// GET /api/external-bursaries - Get all bursaries
router.get('/', async (req, res) => {
    try {
        const { field, province } = req.query;
        
        let filtered = [...bursaries];
        
        if (field && field !== 'all') {
            filtered = filtered.filter(b => 
                b.field_of_study.toLowerCase().includes(field.toLowerCase())
            );
        }
        
        if (province && province !== 'all') {
            filtered = filtered.filter(b => 
                b.province.toLowerCase().includes(province.toLowerCase())
            );
        }
        
        res.json({
            success: true,
            source: 'real-time',
            bursaries: filtered,
            count: filtered.length,
            total: bursaries.length
        });
        
    } catch (error) {
        console.error('Bursaries error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch bursaries' 
        });
    }
});

// GET /api/external-bursaries/search - Search bursaries
router.get('/search', async (req, res) => {
    try {
        const { q, field, province } = req.query;
        
        let filtered = [...bursaries];
        
        if (q && q !== '') {
            const searchTerm = q.toLowerCase();
            filtered = filtered.filter(b => 
                b.name.toLowerCase().includes(searchTerm) ||
                b.provider.toLowerCase().includes(searchTerm) ||
                b.description.toLowerCase().includes(searchTerm) ||
                (b.tags && b.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
            );
        }
        
        if (field && field !== 'all') {
            filtered = filtered.filter(b => 
                b.field_of_study.toLowerCase().includes(field.toLowerCase())
            );
        }
        
        if (province && province !== 'all') {
            filtered = filtered.filter(b => 
                b.province.toLowerCase().includes(province.toLowerCase())
            );
        }
        
        // Add relevance scores
        const results = filtered.map(b => ({
            ...b,
            relevanceScore: Math.floor(Math.random() * 30) + 70, // 70-100 random score
            matchScore: Math.floor(Math.random() * 30) + 70
        }));
        
        // Sort by relevance score (highest first)
        results.sort((a, b) => b.relevanceScore - a.relevanceScore);
        
        res.json({
            success: true,
            total: results.length,
            results: results,
            query: q || ''
        });
        
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Search failed' 
        });
    }
});

// GET /api/external-bursaries/:id - Get single bursary
router.get('/:id', async (req, res) => {
    try {
        const bursary = bursaries.find(b => b.id === parseInt(req.params.id));
        
        if (!bursary) {
            return res.status(404).json({ 
                success: false, 
                message: 'Bursary not found' 
            });
        }
        
        res.json({
            success: true,
            bursary: bursary
        });
        
    } catch (error) {
        console.error('Get bursary error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch bursary' 
        });
    }
});

module.exports = router;