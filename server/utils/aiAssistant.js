const Groq = require('groq-sdk');

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

const generateAIResponse = async (message, profile = {}) => {

    try {

        if (!process.env.GROQ_API_KEY) {
            return `
Groq AI is not configured.

Please add your GROQ_API_KEY to the .env file.
`;
        }

        const prompt = `
You are BursaryBot, an intelligent AI assistant for South African students.

Your responsibilities:

- Help students find bursaries
- Explain NSFAS
- Help write motivation letters
- Explain application requirements
- Give study advice
- Give career guidance
- Answer general student questions
- Be conversational and friendly

Student Profile:

Field of Study: ${profile.field_of_study || 'Unknown'}
Province: ${profile.province || 'Unknown'}
Average Mark: ${profile.average_mark || 'Unknown'}
Parent Income: ${profile.parent_income || 'Unknown'}

Student Question:

${message}
`;

        const completion =
            await groq.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 800
            });

        return completion.choices[0].message.content;

    } catch (error) {

        console.error('Groq Error:', error);

        return `
I encountered an issue while generating a response.

Please try again in a moment.
`;
    }
};

module.exports = generateAIResponse;