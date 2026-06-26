const Groq = require('groq-sdk');

// Initialize Groq with API key from environment
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

const generateAIResponse = async (message, profile = {}) => {
    try {
        // Check if API key is configured
        if (!process.env.GROQ_API_KEY) {
            console.warn('⚠️  GROQ_API_KEY not found in environment variables');
            return `
🤖 AI Service Not Configured

Please add your GROQ_API_KEY to the .env file.

You can get your API key from: https://console.groq.com/keys
`;
        }

        // Build the prompt with student context
        const prompt = `
You are BursaryBot, an intelligent AI assistant for South African students.

Your responsibilities:
- Help students find bursaries and funding opportunities
- Explain NSFAS and other financial aid programs
- Help write motivation letters and applications
- Explain application requirements and deadlines
- Give study advice and career guidance
- Answer general student questions
- Be conversational, friendly, and helpful

Student Profile:
- Field of Study: ${profile.field_of_study || 'Not specified'}
- Province: ${profile.province || 'Not specified'}
- Average Mark: ${profile.average_mark || 'Not specified'}%
- Year of Study: ${profile.year_of_study || 'Not specified'}
- Institution: ${profile.institution || 'Not specified'}

Student Question:
${message}

Please provide a helpful, detailed, and encouraging response tailored to this student's profile.
`;

        // Call Groq API
        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile', // or 'mixtral-8x7b-32768'
            messages: [
                {
                    role: 'system',
                    content: 'You are BursaryBot, a helpful AI assistant for South African students. You provide accurate, encouraging, and practical advice about bursaries, education, and career opportunities.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 800,
            top_p: 0.9,
            frequency_penalty: 0.5,
            presence_penalty: 0.5
        });

        // Extract and return the response
        const response = completion.choices[0].message.content;
        return response;

    } catch (error) {
        console.error('❌ Groq API Error:', error.message);
        
        // Provide a friendly fallback response
        return `
😅 Oops! I'm having a moment.

I couldn't connect to my AI brain right now. Here's what you can do:

1. **Check your internet connection** - Make sure you're online
2. **Verify your GROQ_API_KEY** - Check that it's correct in .env
3. **Try again in a moment** - Sometimes I need a quick break

In the meantime, I can still help you with:
- 📋 Viewing available bursaries
- 🔍 Searching for specific opportunities
- 📱 Using the mobile-friendly interface

Please try your question again, or explore the bursaries on our site! 💪
`;
    }
};

module.exports = generateAIResponse;