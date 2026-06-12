const express = require('express');
const auth = require('../middleware/auth');
const db = require('../config/db');
const generateAIResponse = require('../utils/aiAssistant');
const router = express.Router();

// Intelligent AI response function
function getSmartResponse(message, profile) {
    const msg = message.toLowerCase();
    
    // ========== BURSARY RECOMMENDATIONS ==========
    if (msg.includes('what bursary') || msg.includes('which bursary') || msg.includes('find bursary') || msg.includes('recommend')) {
        const field = profile?.field_of_study || 'your field';
        
        if (field === 'IT') {
            return `🎓 Based on your IT profile, here are specific bursaries you should apply for:\n\n💻 **IT Bursaries:**\n• IT Excellence Bursary (TechSA) - 65%+ average required\n• Sasol IT Bursary - For software development\n• BANKSETA IT Bursary - For banking technology\n• Microsoft Learn Bursary - For cloud and AI\n\n📅 Deadlines are coming up soon. Would you like me to help you find application links?`;
        } else if (field === 'Agriculture') {
            return `🌾 Based on your Agriculture profile, here are specific bursaries:\n\n• Agriculture Development Fund (AgriSA) - 60%+ average\n• Rural Farming Bursary (LandBank) - For rural students\n• AgriTech Innovation Bursary - For agritech students\n\nWould you like more details about any of these?`;
        } else if (field === 'Public Management') {
            return `🏛️ Based on your Public Management profile, here are specific bursaries:\n\n• Public Service Leadership (DPSA) - 65%+ average\n• Municipal Management (SALGA) - For local government\n• Government Administration Fund - For policy studies\n\nWould you like help with the application process?`;
        } else {
            return `🎓 Here are general bursaries you can apply for:\n\n• NSFAS - For students from low-income households (income below R350k)\n• Funza Lushaka - For teaching students\n• Sasol Foundation - For STEM students\n\nWhat field are you studying? I can give you more specific recommendations.`;
        }
    }
    
    // ========== ELIGIBILITY CHECK ==========
    if (msg.includes('eligible') || msg.includes('qualify') || msg.includes('can i get') || msg.includes('do i qualify')) {
        if (profile?.average_mark && profile?.parent_income) {
            let response = `✅ Let me check your eligibility:\n\n`;
            response += `📚 Your average: ${profile.average_mark}%\n`;
            response += `💰 Household income: R${profile.parent_income.toLocaleString()}\n\n`;
            
            if (profile.average_mark >= 70) {
                response += `✅ Your marks are EXCELLENT! You qualify for most bursaries including:\n• IT Excellence Bursary\n• Sasol Bursary\n• Top Achiever Scholarships\n\n`;
            } else if (profile.average_mark >= 60) {
                response += `✅ Your marks are GOOD! You qualify for many bursaries including:\n• NSFAS\n• Funza Lushaka\n• Departmental Bursaries\n\n`;
            } else {
                response += `⚠️ Your marks are below 60%. Focus on improving them. Consider:\n• TVET College bursaries\n• Community-based funding\n\n`;
            }
            
            if (profile.parent_income <= 350000) {
                response += `✅ Your income qualifies for NSFAS and need-based bursaries.`;
            } else {
                response += `⚠️ Your income is above R350k. Focus on merit-based bursaries.`;
            }
            
            return response;
        } else {
            return `To check your eligibility, please complete your profile with:\n\n• Your average marks (%)\n• Your field of study\n• Household income\n\nGo to Profile page to update this information.`;
        }
    }
    
    // ========== IT SPECIFIC BURSARIES ==========
    if (msg.includes('it bursary') || (msg.includes('it') && msg.includes('bursary'))) {
        return `💻 **IT Bursaries for 2026:**\n\n1. **IT Excellence Bursary** - TechSA\n   • Requirement: 65%+ average\n   • Covers: Tuition, laptop, books\n   • Deadline: 30 November 2026\n\n2. **Sasol IT Bursary**\n   • Requirement: 65%+ average\n   • Covers: Full tuition + allowance\n   • Deadline: 31 December 2026\n\n3. **BANKSETA Bursary**\n   • For banking technology students\n   • Includes internship opportunity\n\nWould you like the application links for any of these?`;
    }
    
    // ========== MOTIVATION LETTER HELP ==========
    if (msg.includes('motivation letter') || msg.includes('cover letter')) {
        return `✍️ **How to write a winning motivation letter:**\n\n**Structure:**\n1. Introduction - Who you are and what you're studying\n2. Academic achievements - Your marks and awards\n3. Why you need this bursary - Financial situation\n4. Your career goals - What you want to achieve\n5. Closing - Thank you and call to action\n\n**Tips:**\n• Be specific about your goals\n• Show passion for your field\n• Proofread before submitting\n\nWant me to provide a template?`;
    }
    
    // ========== DOCUMENTS NEEDED ==========
    if (msg.includes('document') || msg.includes('what do i need') || msg.includes('required documents')) {
        return `📄 **Standard documents required for bursary applications:**\n\n✅ Certified copy of ID\n✅ Latest academic results/transcript\n✅ Proof of household income (parents' payslips)\n✅ Motivation letter\n✅ Acceptance letter from institution\n✅ CV (for some bursaries)\n\n**Pro tip:** Get these documents ready NOW so you can apply immediately when bursaries open!`;
    }
    
    // ========== APPLICATION PROCESS ==========
    if (msg.includes('how to apply') || msg.includes('application process') || msg.includes('apply for')) {
        return `📝 **Step-by-step application process:**\n\n1️⃣ **Research** - Find bursaries that match your profile\n2️⃣ **Prepare documents** - Gather ID, results, proof of income\n3️⃣ **Write motivation letter** - Personalize for each bursary\n4️⃣ **Complete online form** - Fill in all details carefully\n5️⃣ **Submit before deadline** - Don't wait until last minute\n6️⃣ **Follow up** - Check email for updates\n\nNeed help with any specific step?`;
    }
    
    // ========== DEADLINES ==========
    if (msg.includes('deadline') || msg.includes('closing date')) {
        return `⏰ **Important 2026 Bursary Deadlines:**\n\n• NSFAS: 31 January 2026\n• Funza Lushaka: 28 February 2026\n• Sasol: 31 December 2026\n• IT Excellence: 30 November 2026\n\n⚠️ Apply early! Many bursaries close before the advertised date.`;
    }
    
    // ========== GREETINGS ==========
    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey') || msg.includes('good morning')) {
        const hour = new Date().getHours();
        let greeting = 'Hello';
        if (hour < 12) greeting = 'Good morning';
        else if (hour < 17) greeting = 'Good afternoon';
        else greeting = 'Good evening';
        
        return `${greeting}! I'm BursaryBot. I can help you find bursaries, check eligibility, and guide you through applications. What would you like to know today?`;
    }
    
    // ========== THANK YOU ==========
    if (msg.includes('thank')) {
        return `You're welcome! 😊 Is there anything else I can help you with? Remember to check your profile settings for better recommendations!`;
    }
    
    // ========== HELP ==========
    if (msg.includes('help') || msg.includes('what can you do')) {
        return `🤖 **I can help you with:**\n\n• Finding bursaries for your specific field\n• Checking if you qualify for bursaries\n• Explaining application requirements\n• Writing motivation letters\n• Listing required documents\n• Providing deadline information\n\nJust ask me anything! For example:\n• "Find IT bursaries for me"\n• "Do I qualify for NSFAS?"\n• "How to write a motivation letter?"`;
    }
    
    // ========== DEFAULT RESPONSE ==========
    return `I'm not sure I understood your question. Could you rephrase?\n\nHere are things I can help with:\n• "What bursaries can I apply for?"\n• "Do I qualify for NSFAS?"\n• "How to write a motivation letter?"\n• "What documents do I need?"\n• "Find IT bursaries"`;
}

// POST /api/chat
router.post('/', auth, async (req, res) => {
    console.log('📨 Chat POST received');
    console.log('User ID:', req.user?.id);
    console.log('Message:', req.body?.message);
    
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ 
                success: false, 
                error: 'Message is required' 
            });
        }
        
        // Get student profile for personalized responses
        let profile = {};
        try {
            const [profiles] = await db.query(
                'SELECT * FROM student_profiles WHERE user_id = ?',
                [req.user.id]
            );
            profile = profiles[0] || {};
            console.log('Profile:', profile.field_of_study || 'No field set');
        } catch (dbError) {
            console.log('DB error:', dbError.message);
        }
        
        // Generate AI response
        const aiReply = await generateAIResponse(
    message, profile );
        console.log('AI Reply length:', aiReply.length);
        
        // Save to history
        try {
            await db.query(
                'INSERT INTO chat_history (user_id, question, answer) VALUES (?, ?, ?)',
                [req.user.id, message, aiReply]
            );
        } catch (saveError) {
            console.log('Could not save to history:', saveError.message);
        }
        
        res.json({
            success: true,
            response: aiReply,
            reply: aiReply
        });
        
    } catch (error) {
        console.error('Chat POST error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Chat failed: ' + error.message 
        });
    }
});

// GET /api/chat/history
router.get('/history', auth, async (req, res) => {
    console.log('📜 Chat history requested');
    
    try {
        const [history] = await db.query(
            'SELECT * FROM chat_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
            [req.user.id]
        );
        
        res.json({
            success: true,
            history: history || []
        });
        
    } catch (error) {
        console.error('Chat history error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to load history' 
        });
    }
});

module.exports = router;