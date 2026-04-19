const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const getModel = () => genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

const generateText = async (prompt) => {
    const model = getModel();
    const result = await model.generateContent(prompt);
    return result.response.text();
};

const generateFromImage = async (prompt, imageBase64, mimeType = 'image/jpeg') => {
    const model = getModel();
    const result = await model.generateContent([
        prompt,
        {
            inlineData: {
                data: imageBase64,
                mimeType,
            },
        },
    ]);
    return result.response.text();
};

module.exports = { generateText, generateFromImage };