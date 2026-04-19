const { generateText } = require('./gemini');

const autoFillListing = async (req, res) => {
    try {
        const { foodName, quantity, unit, donorType, listingType, eventType } = req.body;

        const prompt = `
You are an AI assistant for AnnaSetu, a food waste management platform in India.
A ${donorType || 'individual'} wants to donate food.

Food details:
- Food name: ${foodName}
- Quantity: ${quantity} ${unit || 'plates'}
- Listing type: ${listingType || 'regular'}
${listingType === 'event' ? `- Event type: ${eventType}` : ''}

Generate a complete food listing in JSON format with these exact fields:
{
  "title": "short attractive title (max 8 words)",
  "description": "helpful description mentioning food type, taste, freshness, best for (2-3 sentences)",
  "category": "one of: cooked, raw, packaged, bakery, fruits, vegetables, other",
  "tags": ["tag1", "tag2", "tag3"],
  "pickupTips": "one helpful tip for pickup",
  "estimatedMeals": number
}

Respond with ONLY valid JSON, no extra text.
    `;

        const response = await generateText(prompt);
        const cleaned = response.replace(/```json|```/g, '').trim();
        const data = JSON.parse(cleaned);
        res.json({ success: true, data });
    } catch (error) {
        console.error('AutoFill error:', error);
        res.status(500).json({ message: 'AI auto-fill failed', error: error.message });
    }
};

const predictFoodSafety = async (req, res) => {
    try {
        const { foodType, category, preparedAt, storageMethod, weather, quantity } = req.body;

        const prompt = `
You are a food safety expert AI for AnnaSetu food donation platform in India.

Food details:
- Food type: ${foodType} (veg/non-veg)
- Category: ${category}
- Prepared at: ${preparedAt}
- Storage method: ${storageMethod || 'room temperature'}
- Current weather: ${weather || 'normal'}
- Quantity: ${quantity}

Analyze and respond in JSON format:
{
  "safeHours": number (how many hours food is safe to consume),
  "safeUntil": "human readable time description",
  "riskLevel": "low/medium/high",
  "storageAdvice": "one specific storage tip",
  "warningSign": "what signs indicate food has gone bad",
  "recommendation": "overall recommendation in one sentence"
}

Respond with ONLY valid JSON, no extra text.
    `;

        const response = await generateText(prompt);
        const cleaned = response.replace(/```json|```/g, '').trim();
        const data = JSON.parse(cleaned);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Safety predictor error:', error);
        res.status(500).json({ message: 'Safety prediction failed', error: error.message });
    }
};

module.exports = { autoFillListing, predictFoodSafety };