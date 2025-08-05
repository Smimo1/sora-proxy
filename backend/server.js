const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();
const rateLimit = require("express-rate-limit");

const app = express();
app.use(cors());
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SHARED_PASSWORD = process.env.SHARED_PASSWORD || "";

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Too many requests, slow down." }
});
app.use(limiter);

app.post("/generate-image", async (req, res) => {
  const { prompt, password } = req.body;
  if (SHARED_PASSWORD && password !== SHARED_PASSWORD) {
    return res.status(403).json({ error: "Invalid password." });
  }
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/images/generations",
      { prompt, n: 1, size: "1024x1024" },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );
    const imageUrl = response.data.data[0].url;
    res.json({ imageUrl });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Image generation failed." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
