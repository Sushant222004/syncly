const express = require("express");
const router = express.Router();
const ai = require("../config/gemini");

router.post("/ask", async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        message: "Please provide a message.",
      });
    }

    const startTime = Date.now();

    const conversation = [
      ...history.map((item) => ({
        role: item.role === "assistant" ? "model" : "user",
        parts: [{ text: item.text }],
      })),
      {
        role: "user",
        parts: [{ text: message.trim() }],
      },
    ];

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: conversation,
    });

    console.log(`Gemini API response time: ${Date.now() - startTime}ms`);

    res.json({
      reply: response.text,
    });
  } catch (error) {
    console.error("Gemini API error:", error.message);

    const isUnavailable = error.status === 503 || error.status === 429;

    res.status(isUnavailable ? 503 : 500).json({
      message: isUnavailable
        ? "The AI service is busy. Please try again shortly."
        : "Unable to get an AI response right now.",
    });
  }
});

module.exports = router;
