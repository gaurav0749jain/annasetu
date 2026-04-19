const { generateText } = require('./gemini');

const chatWithBot = async (req, res) => {
    try {
        const { message, userRole, conversationHistory } = req.body;

        const historyText = conversationHistory
            ? conversationHistory.slice(-6).map(m => `${m.role}: ${m.content}`).join('\n')
            : '';

        const prompt = `
You are AnnaSetu AI Assistant, a helpful chatbot for a food waste management platform in India.
You help users donate food, claim food, track pickups, and reduce food waste.

The user is a: ${userRole || 'visitor'}

Platform features:
- Donors can list surplus food from homes, restaurants, weddings, parties, offices
- Receivers (NGOs/shelters) can claim food listings
- Volunteers pick up and deliver food
- Real-time chat between all parties
- AI-powered food safety checker
- Impact tracking (meals saved, CO2 reduced)

${historyText ? `Recent conversation:\n${historyText}\n` : ''}

User message: ${message}

Respond helpfully in 2-4 sentences. Be friendly, concise, and specific to the platform.
If asked about food safety, give practical advice.
If asked how to use the platform, give step-by-step guidance based on their role.
    `;

        const response = await generateText(prompt);
        res.json({ success: true, reply: response });
    } catch (error) {
        console.error('Chatbot error:', error);
        res.status(500).json({ message: 'Chatbot failed', error: error.message });
    }
};

module.exports = { chatWithBot };