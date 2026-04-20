const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const generateText = async (prompt, retries = 5) => {
    for (let i = 0; i < retries; i++) {
        try {
            console.log(`Gemini text attempt ${i + 1}`);
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const result = await model.generateContent(prompt);
            console.log('Gemini text success!');
            return result.response.text();
        } catch (err) {
            console.error(`Attempt ${i + 1} failed:`, err.status, err.message?.substring(0, 80));
            if (err.status === 503 && i < retries - 1) {
                const wait = (i + 1) * 5000;
                console.log(`503 overloaded, waiting ${wait / 1000}s...`);
                await sleep(wait);
                continue;
            }
            throw err;
        }
    }
};

const generateFromImage = async (prompt, imageBase64, mimeType = 'image/jpeg', retries = 5) => {
    for (let i = 0; i < retries; i++) {
        try {
            console.log(`Gemini vision attempt ${i + 1}`);
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const result = await model.generateContent([
                prompt,
                { inlineData: { data: imageBase64, mimeType } },
            ]);
            console.log('Gemini vision success!');
            return result.response.text();
        } catch (err) {
            console.error(`Vision attempt ${i + 1} failed:`, err.status, err.message?.substring(0, 80));
            if (err.status === 503 && i < retries - 1) {
                const wait = (i + 1) * 5000;
                console.log(`503 overloaded, waiting ${wait / 1000}s...`);
                await sleep(wait);
                continue;
            }
            throw err;
        }
    }
};

module.exports = { generateText, generateFromImage };