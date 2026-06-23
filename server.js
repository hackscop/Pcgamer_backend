require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Load the isolated PC Gamer Inventory
let inventoryData = [];
try {
    inventoryData = JSON.parse(fs.readFileSync("./Inventory.json", "utf8"));
} catch (error) {
    console.error("Error loading inventory.json. Ensure the file exists.", error);
}

// Initialize Google Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Enable the AI to search the live internet
const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash", 
    tools: [{ googleSearch: {} }] 
});

// THE UPDATED SYSTEM PROMPT
const systemPrompt = `You are the ultimate AI tech expert and virtual sales assistant for The PC Gamer 254.

YOUR CAPABILITIES (NO RESTRICTIONS):
1. You are a genius regarding all PC hardware, consoles, streaming gear, professional workstations, and gaming.
2. Answer ANY question the user asks. Use your Google Search tool to get the latest data.

YOUR STORE INVENTORY:
Here is your current stock:
${JSON.stringify(inventoryData)}

CRITICAL INSTRUCTION - ORDER OF RESPONSE:
If a user asks about a specific item, GPU, or product (e.g., "Tell me about the 4070" or "Compare 5060 Ti and 4070"):
1. FIRST, immediately acknowledge if the specific items mentioned are IN STOCK or OUT OF STOCK at PC Gamer 254 based on your inventory list. (e.g., "To answer your question quickly: We currently have the 4070 Ti Super in stock, but the 5060 Ti is not currently in our inventory.")
2. THEN, after clarifying stock, provide your expert comparison, specifications, and full answers to their question.
3. Never refuse to answer a tech question.`;

app.post("/api/chat", async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Message text is required." });
        }

        const chat = model.startChat({
            history: [
                { role: "user", parts: [{ text: systemPrompt }] },
                { role: "model", parts: [{ text: "Understood. I will always state whether an item is in stock first, and then I will provide an unrestricted, expert answer." }] }
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
