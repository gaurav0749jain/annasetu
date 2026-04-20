const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const MODELS = [
    process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
];

const generateText = async (prompt, retries = 3) => {
    for (let i = 0; i < retries; i++) {
        const modelName = MODELS[Math.min(i, MODELS.length - 1)];
        try {
            console.log(`Trying Gemini model: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            return result.response.text();
        } catch (err) {
            console.error(`Gemini ${modelName} failed:`, err.status, err.message?.substring(0, 100));
            const shouldRetry = [503, 429, 404].includes(err.status) ||
                err.message?.includes('503') ||
                err.message?.includes('429') ||
                err.message?.includes('404') ||
                err.message?.includes('not found');
            if (shouldRetry && i < retries - 1) {
                const waitTime = (i + 1) * 3000;
                console.log(`Retrying with next model in ${waitTime / 1000}s...`);
                await sleep(waitTime);
                continue;
            }
            throw err;
        }
    }
};

const generateFromImage = async (prompt, imageBase64, mimeType = 'image/jpeg', retries = 3) => {
    const imageModels = [
        process.env.GEMINI_MODEL || 'gemini-1.5-flash',
        'gemini-1.5-flash',
        'gemini-1.5-pro',
    ];
    for (let i = 0; i < retries; i++) {
        const modelName = imageModels[Math.min(i, imageModels.length - 1)];
        try {
            console.log(`Trying Gemini Vision model: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent([
                prompt,
                { inlineData: { data: imageBase64, mimeType } },
            ]);
            return result.response.text();
        } catch (err) {
            console.error(`Gemini Vision ${modelName} failed:`, err.status, err.message?.substring(0, 100));
            const shouldRetry = [503, 429, 404].includes(err.status) ||
                err.message?.includes('503') ||
                err.message?.includes('429') ||
                err.message?.includes('404') ||
                err.message?.includes('not found');
            if (shouldRetry && i < retries - 1) {
                const waitTime = (i + 1) * 3000;
                console.log(`Retrying Vision with next model in ${waitTime / 1000}s...`);
                await sleep(waitTime);
                continue;
            }
            throw err;
        }
    }
};

module.exports = { generateText, generateFromImage };