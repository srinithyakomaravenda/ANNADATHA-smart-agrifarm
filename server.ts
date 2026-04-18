import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini AI Setup (Server-side)
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

  // API Route for AI Advice
  app.post("/api/advice", async (req, res) => {
    try {
      const { 
        soilType, ph, n, p, k, land, tmp, rain, season, irrigation, topCrops, bestCrop, yield: estYield, profit, lang 
      } = req.body;

      const langNameMap: Record<string, string> = {
        en: 'English',
        te: 'Telugu',
        hi: 'Hindi'
      };

      const prompt = `You are ANNADATA, an expert agricultural AI advisor for farmers in India.
      Your task is to provide expert farming advice based on provided data.
      
      CRITICAL: You MUST write your entire response ONLY in the ${langNameMap[lang]} language using ${lang === 'en' ? 'Latin' : 'appropriate native'} script. 
      Do NOT use any English words if the language is Telugu or Hindi.
      
      Farmer's Data:
      - Soil Type: ${soilType}
      - Soil pH: ${ph}
      - Nutrients: Nitrogen: ${n}, Phosphorus: ${p}, Potassium: ${k}
      - Environment: Temp: ${tmp}°C, Rainfall: ${rain}mm
      - Season: ${season}, Irrigation: ${irrigation}
      - Recommended Crop: ${bestCrop}
      - Potential Profit: ₹${profit.toLocaleString('en-IN')}
      
      Response Format (Strictly in ${langNameMap[lang]}):
      1. Explanation: Why ${bestCrop} is the best choice for this soil and climate.
      2. Four specific farming tips to increase yield for ${bestCrop}.
      3. Risk advisory: Two risks (pests or weather) to watch for.
      4. Market tip: Best time to sell for profit.

      Rules:
      - Write in plain text. 
      - Do NOT use markdown symbols like * or #.
      - Use 3-4 short, clear paragraphs.
      - LANGUAGE: ${langNameMap[lang]} ONLY.`;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      res.json({ advice: result.text });
    } catch (error) {
      console.error("Gemini Error:", error);
      res.status(500).json({ error: "Failed to generate AI advice" });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
