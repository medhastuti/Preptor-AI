import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import fetch from "node-fetch";

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Debug Middleware
app.use((req, res, next) => {
  console.log(`➡️  ${req.method} ${req.path}`);
  next();
});

// Test Route
app.get("/api/test", (req, res) => {
  res.json({
    message: "Backend OK",
    keyLoaded: !!process.env.GENAI_API_KEY,
  });
});

// AI Route
app.post("/api/generate", async (req, res) => {
  console.log("API HIT:", req.body);
  console.log("API Key loaded:", !!process.env.GENAI_API_KEY);

  try {
    const apiKey = process.env.GENAI_API_KEY;
    if (!apiKey) {
      console.error("❌ API Key not found in environment");
      return res.status(500).json({ error: "API key not configured" });
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(req.body),
      }
    );

    console.log("API Response Status:", response.status);
    const raw = await response.json();
    console.log("Raw API response:", JSON.stringify(raw).substring(0, 500));

    const text =
      raw?.choices?.[0]?.message?.content ||
      raw?.candidates?.[0]?.content?.parts?.[0]?.text ||
      raw?.candidates?.[0]?.output_text ||
      raw?.text ||
      "AI did not return any content.";

    console.log("Extracted text:", text.substring(0, 200));
    res.json({ content: text });

  } catch (err) {
    console.error("AI Error:", err);
    res.status(500).json({ error: "AI request failed: " + err.message });
  }
});


app.listen(port, () => {
  console.log(`🚀 Backend running on http://localhost:${port}`);
});
