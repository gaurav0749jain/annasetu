const { generateText } = require('./gemini');
const Listing = require('../models/Listing');
const Pickup = require('../models/Pickup');

const generateImpactReport = async (req, res) => {
    try {
        const donorId = req.user._id;
        const donorName = req.user.name;
        const donorType = req.user.donorType;

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const listings = await Listing.find({
            donor: donorId,
            createdAt: { $gte: startOfMonth },
        });

        const deliveredPickups = await Pickup.find({
            donor: donorId,
            status: 'delivered',
            createdAt: { $gte: startOfMonth },
        });

        const totalListings = listings.length;
        const totalDelivered = deliveredPickups.length;
        const totalMeals = listings.reduce((sum, l) => sum + (l.mealsCount || l.quantity), 0);
        const co2Saved = (totalMeals * 0.5 * 2.5).toFixed(2);
        const month = now.toLocaleString('default', { month: 'long', year: 'numeric' });

        const prompt = `
You are writing a warm, inspiring monthly impact report for a food donor on AnnaSetu platform.

Donor details:
- Name: ${donorName}
- Type: ${donorType}
- Month: ${month}
- Food listings created: ${totalListings}
- Successful deliveries: ${totalDelivered}
- Total meals donated: ${totalMeals}
- CO2 saved: ${co2Saved} kg

Write a personalized 3-paragraph impact report:
1. Paragraph 1: Celebrate their contribution with specific numbers
2. Paragraph 2: Describe the real-world impact on communities
3. Paragraph 3: Motivate them to continue with an inspiring closing

Make it warm, personal, and specific. Mention India's food waste context.
Use their name. Keep it under 200 words total.
    `;

        const report = await generateText(prompt);

        res.json({
            success: true,
            report,
            stats: {
                month,
                totalListings,
                totalDelivered,
                totalMeals,
                co2Saved,
            },
        });
    } catch (error) {
        console.error('Report error:', error);
        res.status(500).json({ message: 'Report generation failed', error: error.message });
    }
};

module.exports = { generateImpactReport };