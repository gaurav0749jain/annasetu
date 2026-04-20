const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const MODELS = [
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite-preview-06-17',
    'gemini-2.5-flash-preview-05-20',
];

const generateText = async (prompt, retries = 3) => {
    for (let i = 0; i < retries; i++) {
        const modelName = MODELS[Math.min(i, MODELS.length - 1)];
        try {
            console.log(`Trying Gemini model: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            console.log(`Success with: ${modelName}`);
            return result.response.text();
        } catch (err) {
            console.error(`${modelName} failed:`, err.status, err.message?.substring(0, 100));
            if (i < retries - 1) {
                await sleep(3000);
                continue;
            }
            throw err;
        }
    }
};

const generateFromImage = async (prompt, imageBase64, mimeType = 'image/jpeg', retries = 3) => {
    for (let i = 0; i < retries; i++) {
        const modelName = MODELS[Math.min(i, MODELS.length - 1)];
        try {
            console.log(`Trying Gemini Vision: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent([
                prompt,
                { inlineData: { data: imageBase64, mimeType } },
            ]);
            console.log(`Vision success with: ${modelName}`);
            return result.response.text();
        } catch (err) {
            console.error(`Vision ${modelName} failed:`, err.status, err.message?.substring(0, 100));
            if (i < retries - 1) {
                await sleep(3000);
                continue;
            }
            throw err;
        }
    }
};

module.exports = { generateText, generateFromImage };