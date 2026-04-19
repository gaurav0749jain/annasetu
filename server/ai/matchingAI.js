const { generateText } = require('./gemini');
const User = require('../models/User');
const Pickup = require('../models/Pickup');

const smartMatch = async (req, res) => {
    try {
        const { listingId, foodType, category, quantity, city } = req.body;

        const receivers = await User.find({
            role: 'receiver',
            isApproved: true,
            isVerified: true,
            city: { $regex: city, $options: 'i' },
        }).select('name city _id').limit(10);

        if (receivers.length === 0) {
            return res.json({ success: true, matches: [], message: 'No receivers found in this city' });
        }

        const receiverList = receivers.map((r, i) => `${i + 1}. ${r.name} (${r.city})`).join('\n');

        const prompt = `
You are a smart matching AI for AnnaSetu food donation platform.

A food listing is available:
- Food type: ${foodType}
- Category: ${category}
- Quantity: ${quantity} plates/kg
- City: ${city}

Available receivers (NGOs/shelters):
${receiverList}

Rank all receivers from best to worst match for this donation.
Consider: food type compatibility, location, organization type.

Respond in JSON format:
{
  "rankedReceivers": [
    {
      "rank": 1,
      "name": "receiver name exactly as listed",
      "reason": "one sentence why they are a good match",
      "matchScore": number between 0-100
    }
  ],
  "recommendation": "overall recommendation in one sentence"
}

Respond with ONLY valid JSON, no extra text.
    `;

        const response = await generateText(prompt);
        const cleaned = response.replace(/```json|```/g, '').trim();
        const aiData = JSON.parse(cleaned);

        const matchedReceivers = aiData.rankedReceivers.map(match => {
            const receiver = receivers.find(r => r.name === match.name);
            return {
                ...match,
                receiverId: receiver?._id,
            };
        });

        res.json({ success: true, matches: matchedReceivers, recommendation: aiData.recommendation });
    } catch (error) {
        console.error('Smart match error:', error);
        res.status(500).json({ message: 'Smart matching failed', error: error.message });
    }
};

module.exports = { smartMatch };