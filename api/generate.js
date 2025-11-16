export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("🔄 API Handler called with body:", req.body);
    const apiKey = process.env.GENAI_API_KEY;
    console.log("🔑 API Key loaded:", !!apiKey);

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

    console.log("📡 API Response Status:", response.status);
    const raw = await response.json();
    console.log("📦 Raw API response:", JSON.stringify(raw).substring(0, 500));

    if (!response.ok) {
      console.error("❌ API Error Response:", raw);
      const errorMessage = raw?.error?.message || raw?.error || "Unknown API error";
      return res.status(response.status).json({ error: `API Error: ${errorMessage}` });
    }

    // Extract text from the response - Google API returns in OpenAI format
    console.log("🔍 Checking choices:", !!raw?.choices);
    console.log("🔍 Checking choices[0]:", !!raw?.choices?.[0]);
    console.log("🔍 Checking message:", !!raw?.choices?.[0]?.message);
    console.log("🔍 Checking message.content:", !!raw?.choices?.[0]?.message?.content);
    
    const text =
      raw?.choices?.[0]?.message?.content ||
      raw?.candidates?.[0]?.content?.parts?.[0]?.text ||
      raw?.candidates?.[0]?.output_text ||
      raw?.text ||
      "AI did not return any content.";

    console.log("✅ Final extracted text length:", text.length);
    console.log("✅ Final extracted text (first 300 chars):", text.substring(0, 300));
    
    // Return in the format frontend expects
    return res.status(200).json({ content: text });
  } catch (error) {
    console.error("❌ Vercel API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: "AI request failed: " + errorMessage });
  }
}
