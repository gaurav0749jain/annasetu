const { generateFromImage } = require('./gemini');

const analyzeFoodImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image uploaded' });
        }

        const imageBuffer = req.file.buffer;
        const imageBase64 = imageBuffer.toString('base64');
        const mimeType = req.file.mimetype;

        const prompt = `
You are a food recognition AI for AnnaSetu, a food donation platform in India.

Analyze this food image and respond in JSON format:
{
  "foodName": "name of the food item",
  "category": "one of: cooked, raw, packaged, bakery, fruits, vegetables, other",
  "foodType": "veg or non-veg",
  "estimatedServings": number,
  "freshnessLevel": "fresh/good/acceptable/poor",
  "freshnessScore": number between 0-100,
  "description": "2 sentence description of what you see",
  "tags": ["tag1", "tag2", "tag3"],
  "donationSuitable": true or false,
  "reason": "why it is or isn't suitable for donation"
}

Respond with ONLY valid JSON, no extra text.
    `;

        const response = await generateFromImage(prompt, imageBase64, mimeType);
        const cleaned = response.replace(/```json|```/g, '').trim();
        const data = JSON.parse(cleaned);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Image analysis error:', error);
        res.status(500).json({ message: 'Image analysis failed', error: error.message });
    }
};

module.exports = { analyzeFoodImage };