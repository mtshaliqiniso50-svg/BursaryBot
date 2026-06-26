const express = require('express');
const auth = require('../middleware/auth');
const db = require('../config/database'); // Changed from './config/db' to './config/database'
const generateAIResponse = require('../utils/aiAssistant');
const router = express.Router();

// POST /api/chat - Send message and get AI response
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
            const connection = await db.getConnection();
            const [profiles] = await connection.query(
                'SELECT * FROM student_profiles WHERE user_id = ?',
                [req.user.id]
            );
            connection.release();
            profile = profiles[0] || {};
            console.log('Profile:', profile.field_of_study || 'No field set');
        } catch (dbError) {
            console.log('DB error:', dbError.message);
        }
        
        // Generate AI response using the Groq SDK
        let aiReply;
        try {
            aiReply = await generateAIResponse(message, profile);
            console.log('AI Reply length:', aiReply.length);
        } catch (aiError) {
            console.error('AI Generation Error:', aiError);
            // Fallback to smart response if AI fails
            aiReply = getSmartResponse(message, profile);
        }
        
        // Save to history
        try {
            const connection = await db.getConnection();
            await connection.query(
                'INSERT INTO chat_history (user_id, question, answer) VALUES (?, ?, ?)',
                [req.user.id, message, aiReply]
            );
            connection.release();
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

// GET /api/chat/history - Get chat history
router.get('/history', auth, async (req, res) => {
    console.log('📜 Chat history requested');
    
    try {
        const connection = await db.getConnection();
        const [history] = await connection.query(
            'SELECT * FROM chat_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
            [req.user.id]
        );
        connection.release();
        
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

// GET /api/chat/recommendations - Get bursary recommendations
router.get('/recommendations', auth, async (req, res) => {
    console.log('📋 Recommendations requested');
    
    try {
        const connection = await db.getConnection();
        
        // Get user profile
        const [profile] = await connection.query(
            `SELECT field_of_study, average_mark, province, parent_income 
             FROM student_profiles 
             WHERE user_id = ?`,
            [req.user.id]
        );
        
        if (profile.length === 0) {
            connection.release();
            return res.status(404).json({
                success: false,
                message: 'Please complete your profile first'
            });
        }

        const userProfile = profile[0];
        
        // Find matching bursaries
        let query = `
            SELECT * FROM bursaries 
            WHERE is_active = true 
            AND (field_of_study = ? OR field_of_study = 'All' OR ? IS NULL)
        `;
        let params = [userProfile.field_of_study, userProfile.field_of_study];
        
        if (userProfile.average_mark) {
            query += ` AND min_average <= ?`;
            params.push(userProfile.average_mark);
        }
        
        if (userProfile.province && userProfile.province !== 'Any') {
            query += ` AND (province = ? OR province = 'Any')`;
            params.push(userProfile.province);
        }
        
        query += ` ORDER BY deadline ASC LIMIT 10`;
        
        const [recommendations] = await connection.query(query, params);
        connection.release();

        res.json({
            success: true,
            count: recommendations.length,
            data: recommendations,
            message: recommendations.length === 0 ? 
                'No matching bursaries found. Try updating your profile.' : 
                'Recommendations based on your profile'
        });

    } catch (error) {
        console.error('Recommendation error:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting recommendations'
        });
    }
});

// DELETE /api/chat/history/:id - Delete a chat history entry
router.delete('/history/:id', auth, async (req, res) => {
    try {
        const connection = await db.getConnection();
        await connection.query(
            'DELETE FROM chat_history WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        connection.release();
        
        res.json({
            success: true,
            message: 'Chat history deleted successfully'
        });
    } catch (error) {
        console.error('Delete chat error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting chat history'
        });
    }
});

// ============================================
// SMART RESPONSE FALLBACK (when AI is unavailable)
// ============================================
function getSmartResponse(message, profile) {
    const msg = message.toLowerCase();
    
    // ========== BURSARY RECOMMENDATIONS ==========
    if (msg.includes('what bursary') || msg.includes('which bursary') || msg.includes('find bursary') || msg.includes('recommend')) {
        const field = profile?.field_of_study || 'your field';
        
        if (field === 'IT' || field === 'Information Technology') {
            return `🎓 Based on your IT profile, here are specific bursaries you should apply for:\n\n💻 **IT Bursaries:**\n• IT Excellence Bursary (TechSA) - 65%+ average required\n• Sasol IT Bursary - For software development\n• BANKSETA IT Bursary - For banking technology\n• Microsoft Learn Bursary - For cloud and AI\n\n📅 Deadlines are coming up soon. Would you like me to help you find application links?`;
        } else if (field === 'Agriculture') {
            return `🌾 Based on your Agriculture profile, here are specific bursaries:\n\n• Agriculture Development Fund (AgriSA) - 60%+ average\n• Rural Farming Bursary (LandBank) - For rural students\n• AgriTech Innovation Bursary - For agritech students\n\nWould you like more details about any of these?`;
        } else if (field === 'Public Management' || field === 'Public Administration') {
            return `🏛️ Based on your Public Management profile, here are specific bursaries:\n\n• Public Service Leadership (DPSA) - 65%+ average\n• Municipal Management (SALGA) - For local government\n• Government Administration Fund - For policy studies\n\nWould you like help with the application process?`;
        } else {
            return `🎓 Here are general bursaries you can apply for:\n\n• NSFAS - For students from low-income households (income below R350k)\n• Funza Lushaka - For teaching students\n• Sasol Foundation - For STEM students\n• IT Excellence Bursary - For IT students\n\nWhat field are you studying? I can give you more specific recommendations.`;
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
        return `💻 **IT Bursaries for 2026:**\n\n1. **IT Excellence Bursary** - TechSA\n   • Requirement: 65%+ average\n   • Covers: Tuition, laptop, books\n   • Deadline: 30 November 2026\n\n2. **Sasol IT Bursary**\n   • Requirement: 65%+ average\n   • Covers: Full tuition + allowance\n   • Deadline: 31 December 2026\n\n3. **BANKSETA Bursary**\n   • For banking technology students\n   • Includes internship opportunity\n\n4. **Microsoft Learn Bursary**\n   • For cloud and AI students\n   • Includes certification\n\nWould you like the application links for any of these?`;
    }
    
    // ========== MOTIVATION LETTER HELP ==========
    if (msg.includes('motivation letter') || msg.includes('cover letter') || msg.includes('motivational letter')) {
        return `✍️ **How to write a winning motivation letter:**\n\n**Structure:**\n1. Introduction - Who you are and what you're studying\n2. Academic achievements - Your marks and awards\n3. Why you need this bursary - Financial situation\n4. Your career goals - What you want to achieve\n5. Closing - Thank you and call to action\n\n**Tips:**\n• Be specific about your goals\n• Show passion for your field\n• Proofread before submitting\n• Personalize for each bursary\n\n**Sample Opening:**\n"Dear Selection Committee,\n\nI am writing to express my strong interest in the IT Excellence Bursary. As a second-year IT student at DUT with a 68% average, I am passionate about software development..."\n\nWant me to provide a complete template?`;
    }
    
    // ========== DOCUMENTS NEEDED ==========
    if (msg.includes('document') || msg.includes('what do i need') || msg.includes('required documents') || msg.includes('paperwork')) {
        return `📄 **Standard documents required for bursary applications:**\n\n✅ Certified copy of ID (not older than 3 months)\n✅ Latest academic results/transcript\n✅ Proof of household income (parents' payslips or affidavit)\n✅ Motivation letter\n✅ Acceptance letter from institution\n✅ CV (for some bursaries)\n✅ Proof of registration (for some bursaries)\n\n**Pro tip:** Get these documents ready NOW so you can apply immediately when bursaries open!\n\nNeed help with any specific document?`;
    }
    
    // ========== APPLICATION PROCESS ==========
    if (msg.includes('how to apply') || msg.includes('application process') || msg.includes('apply for') || msg.includes('steps')) {
        return `📝 **Step-by-step application process:**\n\n1️⃣ **Research** - Find bursaries that match your profile\n2️⃣ **Prepare documents** - Gather ID, results, proof of income\n3️⃣ **Write motivation letter** - Personalize for each bursary\n4️⃣ **Complete online form** - Fill in all details carefully\n5️⃣ **Submit before deadline** - Don't wait until last minute\n6️⃣ **Follow up** - Check email for updates\n\n**Pro tips:**\n• Apply to multiple bursaries\n• Keep copies of all applications\n• Follow up after 2 weeks if no response\n\nNeed help with any specific step?`;
    }
    
    // ========== DEADLINES ==========
    if (msg.includes('deadline') || msg.includes('closing date') || msg.includes('due date')) {
        return `⏰ **Important 2026 Bursary Deadlines:**\n\n• NSFAS: 31 January 2026\n• Funza Lushaka: 28 February 2026\n• Sasol: 31 December 2026\n• IT Excellence: 30 November 2026\n• Agriculture Development: 31 October 2026\n• Public Service: 15 December 2026\n\n⚠️ Apply early! Many bursaries close before the advertised date.\n\nWould you like reminders for specific bursaries?`;
    }
    
    // ========== NSFAS ==========
    if (msg.includes('nsfas') || msg.includes('financial aid')) {
        return `🏛️ **NSFAS Information:**\n\n**What is NSFAS?**\nNational Student Financial Aid Scheme for South African students.\n\n**Eligibility:**\n• South African citizen\n• Household income below R350,000 per year\n• Accepted at a public university or TVET college\n\n**What it covers:**\n• Tuition fees\n• Accommodation\n• Books and learning materials\n• Living allowance\n\n**How to apply:**\n1. Visit www.nsfas.org.za\n2. Create an account\n3. Complete the online application\n4. Upload required documents\n\n📅 Application opens: September 2025\n📅 Deadline: 31 January 2026\n\nNeed more details?`;
    }
    
    // ========== GREETINGS ==========
    if (msg.match(/^(hello|hi|hey|good morning|good afternoon|good evening|howdy|yo|sup)/i)) {
        const hour = new Date().getHours();
        let greeting = 'Hello';
        if (hour < 12) greeting = 'Good morning';
        else if (hour < 17) greeting = 'Good afternoon';
        else greeting = 'Good evening';
        
        return `${greeting}! 👋 I'm BursaryBot, your personal AI assistant for finding bursaries and study advice. \n\nI can help you with:\n• Finding bursaries for your field\n• Checking eligibility\n• Application guidance\n• Motivation letters\n\nWhat would you like to know today?`;
    }
    
    // ========== THANK YOU ==========
    if (msg.includes('thank') || msg.includes('thanks')) {
        return `You're welcome! 😊 \n\nIs there anything else I can help you with? \n\n💡 Remember to check your profile settings for better recommendations!\n\n📱 You can also view all bursaries on our mobile page.`;
    }
    
    // ========== HELP ==========
    if (msg.includes('help') || msg.includes('what can you do') || msg.includes('commands')) {
        return `🤖 **I can help you with:**\n\n📋 **Bursary Help:**\n• "Find bursaries for IT"\n• "What bursaries are available?"\n• "NSFAS information"\n\n✅ **Eligibility:**\n• "Do I qualify for NSFAS?"\n• "Check my eligibility"\n\n📝 **Applications:**\n• "How to write a motivation letter?"\n• "What documents do I need?"\n• "How to apply for a bursary?"\n\n⏰ **Deadlines:**\n• "When are the deadlines?"\n\nTry asking me anything! I'm here to help you succeed. 💪`;
    }
    
    // ========== ABOUT ==========
    if (msg.includes('who are you') || msg.includes('what are you') || msg.includes('tell me about yourself')) {
        return `🤖 **About BursaryBot:**\n\nI'm BursaryBot, an AI-powered assistant designed to help South African students find and apply for bursaries.\n\n**My mission:** To make bursary information accessible and help students achieve their educational dreams.\n\n**I'm powered by:**\n• Groq AI for intelligent responses\n• A database of South African bursaries\n• Student profiles for personalized recommendations\n\n**Fun fact:** I can help you write motivation letters, check eligibility, and find the perfect bursary for your field!\n\nWant to get started? Ask me anything! 🚀`;
    }
    
    // ========== DEFAULT RESPONSE ==========
    return `🤔 I'm not sure I understood your question. Could you rephrase?\n\nHere are things I can help with:\n• "What bursaries can I apply for?"\n• "Do I qualify for NSFAS?"\n• "How to write a motivation letter?"\n• "What documents do I need?"\n• "Find IT bursaries for me"\n• "Check my eligibility"\n\nWhat would you like to know? 😊`;
}

module.exports = router;