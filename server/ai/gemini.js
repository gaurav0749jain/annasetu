const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const MODELS = [
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash-8b',
];

const generateText = async (prompt, retries = 4) => {
    for (let i = 0; i < retries; i++) {
        const modelName = MODELS[Math.min(i, MODELS.length - 1)];
        try {
            console.log(`Trying Gemini model: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            console.log(`Success with model: ${modelName}`);
            return result.response.text();
        } catch (err) {
            console.error(`Gemini ${modelName} failed:`, err.status, err.message?.substring(0, 150));
            if (i < retries - 1) {
                const waitTime = 2000;
                console.log(`Retrying with next model in ${waitTime / 1000}s...`);
                await sleep(waitTime);
                continue;
            }
            throw err;
        }
    }
};

const generateFromImage = async (prompt, imageBase64, mimeType = 'image/jpeg', retries = 4) => {
    for (let i = 0; i < retries; i++) {
        const modelName = MODELS[Math.min(i, MODELS.length - 1)];
        try {
            console.log(`Trying Gemini Vision model: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent([
                prompt,
                { inlineData: { data: imageBase64, mimeType } },
            ]);
            console.log(`Vision success with model: ${modelName}`);
            return result.response.text();
        } catch (err) {
            console.error(`Gemini Vision ${modelName} failed:`, err.status, err.message?.substring(0, 150));
            if (i < retries - 1) {
                const waitTime = 2000;
                console.log(`Retrying Vision with next model in ${waitTime / 1000}s...`);
                await sleep(waitTime);
                continue;
            }
            throw err;
        }
    }
};

module.exports = { generateText, generateFromImage };