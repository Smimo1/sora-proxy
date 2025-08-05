const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();
const rateLimit = require("express-rate-limit");
const path = require("path");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,             // limit each IP to 10 requests per minute
  message: { error: "Too many requests, slow down." }
}));

// Serve static frontend
app.use(express.static(path.join(__dirname, "public")));

// Main endpoint for image generation
app.post("/generate-image", async (req, res) => {
  const { prompt, password } = req.body;

  const apiKey = process.env.OPENAI_API_KEY;
  const sharedPassword = process.env.SHARED_PASSWORD;

  if (!apiKey) {
    return res.status(500).json({ error: "Server misconfiguration: missing API key." });
  }

  if (sharedPassword && password !== sharedPassword) {
    return res.status(403).json({ error: "Invalid password." });
  }

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/images/generations",
      {
        prompt,
        n: 1,
        size: "1024x1024"
      },
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      }
    );

    const imageUrl = response.data.data[0].url;
    res.json({ imageUrl });

  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: "Image generation failed." });
  }
});

// Fallback to index.html for unknown routes (optional, if you want SPA routing)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
