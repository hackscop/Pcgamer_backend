require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Load the isolated PC Gamer inventory
let inventoryData = [];
try {
    inventoryData = JSON.parse(fs.readFileSync('./inventory.json', 'utf8'));
} catch (error) {
    console.error("Error loading inventory.json. Ensure the file exists.", error);
}

// Initialize Google Gemini
// You need to provide your own API key in the .env file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 

// Hardcoded System Prompt for PC Gamer 254
const systemPrompt = `You are the official AI virtual sales assistant for The PC Gamer 254. 
Your goal is to help customers find the right custom PC builds, components, and accessories. 
Be extremely polite, professional, and highly knowledgeable about PC hardware. 
Do not invent items, brands, or prices. Only recommend items from this provided inventory list:
${JSON.stringify(inventoryData)}
If a user asks for something not in the inventory, politely let them know to contact the shop directly.`;

app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: "Message text is required." });
        }

        const chat = model.startChat({
            history: [
                { role: "user", parts: [{ text: systemPrompt }] },
                { role: "model", parts: [{ text: "Understood. I am ready to assist customers of The PC Gamer 254." }] }
            ]
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();

        res.json({ reply: text });

    } catch (error) {
        console.error("AI Engine Error:", error);
        res.status(500).json({ error: "The AI server is currently offline. Please try again later." });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`PC Gamer 254 AI Engine running cleanly on port ${PORT}`);
});
