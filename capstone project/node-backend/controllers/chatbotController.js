const Groq = require("groq-sdk");
const { getCustomerShipmentById } = require("../services/userShipmentServices"); // adjust path if needed

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Maintain a simple in-memory conversation history per session
// For production, consider storing in DB or Redis
const conversationStore = {};

const chatWithBot = async (req, res) => {
    try {
        const userId = req.user.id;
        const { message, sessionId } = req.body;

        if (!message) {
            return res.status(400).json({ success: false, message: "Message is required" });
        }

        // Initialize conversation history for this session
        if (!conversationStore[sessionId]) {
            conversationStore[sessionId] = [];
        }

        const history = conversationStore[sessionId];

        // Try to extract shipment code from the message (e.g. SHP-XXXXX)
        const shipmentCodeMatch = message.match(/\bSHP-[A-Z0-9]+\b/i);
        let shipmentContext = "";

        if (shipmentCodeMatch) {
            // Search through user's shipments to find matching shipment_code
            // We use a helper that accepts code instead of id
            try {
                const { Shipment, ShipmentHistory } = require("../models/index.sql");
                const shipment = await Shipment.findOne({
                    where: {
                        shipment_code: shipmentCodeMatch[0].toUpperCase(),
                        user_id: userId,
                    },
                });

                if (shipment) {
                    shipmentContext = `
Here is the real-time shipment data for the user's query:
- Shipment Code: ${shipment.shipment_code}
- Status: ${shipment.status}
- Current Location: ${shipment.current_city || "Not updated yet"}${shipment.current_subregion ? ", " + shipment.current_subregion : ""}
- Pickup From: ${shipment.pickup_city}${shipment.pickup_subregion ? ", " + shipment.pickup_subregion : ""}
- Delivering To: ${shipment.delivery_city}${shipment.delivery_subregion ? ", " + shipment.delivery_subregion : ""}
- Package Type: ${shipment.package_type}
- Weight: ${shipment.weight_kg ? shipment.weight_kg + " kg" : "Not specified"}
- Expected Delivery: ${shipment.expected_delivery_at ? new Date(shipment.expected_delivery_at).toLocaleString() : "Not available"}
- Delayed: ${shipment.is_delayed ? "Yes" : "No"}${shipment.delay_reason ? " - Reason: " + shipment.delay_reason : ""}
Use this data to answer the user's question accurately.
                    `;
                } else {
                    shipmentContext = `The user mentioned shipment code "${shipmentCodeMatch[0]}" but it was not found in their account. Inform them politely.`;
                }
            } catch (err) {
                console.error("Shipment lookup error:", err);
            }
        }

        // System prompt for the LLM
        const systemPrompt = `
You are a helpful and friendly shipment tracking assistant for a logistics and delivery platform.
Your job is to help users track their shipments and answer shipment-related questions.

Rules:
- Only answer shipment/delivery related questions.
- If a user asks something unrelated, politely say you can only help with shipment queries.
- If a user wants to track a shipment, ask them to provide their Shipment Code (format: SHP-XXXXX).
- Be concise, clear and friendly.
- Do not make up shipment data. Only use the data provided to you.
${shipmentContext ? shipmentContext : "- No shipment data has been retrieved yet for this message."}
        `.trim();

        // Add user message to history
        history.push({ role: "user", content: message });

        // Call Groq API
        const completion = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [
                { role: "system", content: systemPrompt },
                ...history,
            ],
            max_tokens: 300,
            temperature: 0.5,
        });

        const botReply = completion.choices[0]?.message?.content || "Sorry, I couldn't process that.";

        // Add bot reply to history
        history.push({ role: "assistant", content: botReply });

        // Keep history limited to last 10 exchanges to avoid token overflow
        if (history.length > 20) {
            conversationStore[sessionId] = history.slice(-20);
        }

        res.status(200).json({
            success: true,
            reply: botReply,
        });

    } catch (error) {
        console.error("Chatbot error:", error);
        res.status(500).json({
            success: false,
            message: "Chatbot failed to respond",
            error: error.message,
        });
    }
};

module.exports = { chatWithBot };