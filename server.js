const express = require("express");
const cors = require("cors");
const {
  GoogleGenerativeAI,
} = require("@google/generative-ai");
const html2canvas = require("html2canvas");
const path = require("path");

const app = express();
const PORT = 3001;

// Load Gemini API key
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || 'AIzaSyA-LEDmzNx5NX2xIEvwCnQ-11QaiLA9Sko');

// Enable CORS
app.use(cors());

// Serve static files
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/recipeStream", async (req, res) => {
  const { ingredients, mealType, cuisine, cookingTime, complexity } = req.query;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const prompt = [
    "Generate a recipe that incorporates the following details:",
    `[Ingredients: ${ingredients}]`,
    `[Meal Type: ${mealType}]`,
    `[Cuisine Preference: ${cuisine}]`,
    `[Cooking Time: ${cookingTime}]`,
    `[Complexity: ${complexity}]`,
    "Please provide a detailed recipe, including steps for preparation and cooking. Only use the ingredients provided.",
    "The recipe should highlight the fresh and vibrant flavors of the ingredients.",
    "Also give the recipe a suitable name in its local language based on cuisine preference."
  ].join(" ");

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Send result via SSE
    res.write(`data: ${JSON.stringify({ action: "start" })}\n\n`);
    text.split("\n").forEach(line => {
      res.write(`data: ${JSON.stringify({ action: "chunk", chunk: line })}\n\n`);
    });
    res.write(`data: ${JSON.stringify({ action: "close" })}\n\n`);
    res.end();
  } catch (err) {
    console.error("Gemini error:", err);
    res.write(`data: ${JSON.stringify({ action: "error", error: "Failed to generate recipe." })}\n\n`);
    res.end();
  }

  req.on("close", () => {
    res.end();
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
