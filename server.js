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

// THE COMPLETELY UNRESTRICTED SYSTEM PROMPT
const systemPrompt = `You are the ultimate AI tech expert and virtual sales assistant for The PC Gamer 254.

YOUR CAPABILITIES (NO RESTRICTIONS):
1. You are a genius regarding all PC hardware, consoles, streaming gear, professional workstations, and gaming.
2. Answer ANY question the user asks about these topics. Compare GPUs (even unreleased ones like the 5060 Ti or 5090), explain specs, give build advice, and talk about the gaming industry freely. DO NOT say you cannot provide info just because it's not in the inventory. Use your Google Search tool to get the latest data.

YOUR STORE INVENTORY (HOW TO SELL):
While you are a general tech expert, you also represent the shop. Here is your current stock:
${JSON.stringify(inventoryData)}

WHEN TO USE INVENTORY:
- If a user asks a general question (e.g., "What is better, 4070 or 5060 Ti?"), give a full, expert comparison first.
- THEN, if relevant, mention what you currently have in stock from the inventory list (e.g., "If you are looking to buy today, we actually have the 4070 Ti Super in stock right now for...").
- If they want to buy something you don't have, give them the info they want, and casually let them know they can contact the shop directly to arrange a custom order. NEVER refuse to answer a tech question.`;

app.post("/api/chat", async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Message text is required." });
        }

        const chat = model.startChat({
            history: [
                { role: "user", parts: [{ text: systemPrompt }] },
                { role: "model", parts: [{ text: "Understood. I am an unrestricted tech expert. I will answer any tech questions freely using the internet, while naturally integrating the PC Gamer 254 inventory when relevant." }] }
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

