const { GoogleGenAI } = require("@google/genai");

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function main() {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "Who is the PM of india?",
            config: {
                thinkingConfig: {
                    thinkingBudget: 0 // Disable thinking
                }
            }
        });
        console.log(response.text);
    } catch (error) {
        console.log(error);

    }
}

function connectToGenAi() {
   // main();
};

module.exports = {
    connectToGenAi
};