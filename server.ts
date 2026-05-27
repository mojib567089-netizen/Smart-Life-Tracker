import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import * as dotenv from "dotenv";

dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();
  
  // Increase payload limit for base64 images
  app.use(express.json({ limit: '50mb' }));

  // Initialize Gemini
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API Route: Categorize Document
  app.post("/api/documents/categorize", async (req, res) => {
    try {
      const { base64Data, mimeType } = req.body;
      if (!base64Data) return res.status(400).json({ error: "Missing base64Data" });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            inlineData: {
              data: base64Data.split(',')[1] || base64Data,
              mimeType: mimeType || "image/jpeg"
            }
          },
          { text: "Analyze this document. Identify what type of document it is (e.g., ID Card, Land Document, Utility Bill, Medical Record, Receipt, or Other). Also extract 3-5 important search keywords from it (like names, account numbers, titles)." }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING, description: "The document category." },
              keywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Extracted keywords." },
              summary: { type: Type.STRING, description: "A very short 1-sentence summary of what this document is." }
            },
            required: ["category", "keywords", "summary"]
          }
        }
      });
      res.json(JSON.parse(response.text || "{}"));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to categorize document." });
    }
  });

  // API Route: Parse Prescription
  app.post("/api/reminders/parse-prescription", async (req, res) => {
    try {
      const { base64Data, mimeType } = req.body;
      if (!base64Data) return res.status(400).json({ error: "Missing base64Data" });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            inlineData: {
              data: base64Data.split(',')[1] || base64Data,
              mimeType: mimeType || "image/jpeg"
            }
          },
          { text: "Extract medication reminder details from this prescription. For each medicine, provide its name and the times it should be taken (e.g., morning, noon, night). If no times are present, guess a standard schedule." }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                medicineName: { type: Type.STRING },
                scheduleInfos: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Array of english words corresponding to time to take it e.g., 'Morning', 'Night'" }
              },
              required: ["medicineName", "scheduleInfos"]
            }
          }
        }
      });
      res.json(JSON.parse(response.text || "[]"));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to parse prescription." });
    }
  });

  // API Route: Parse Item Location
  app.post("/api/items/parse-location", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) return res.status(400).json({ error: "Missing text" });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Extract the item and its location from the following text (may be in Bengali or English). Text: "${text}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              itemName: { type: Type.STRING, description: "Name of the item (in Bengali if input is Bengali)" },
              location: { type: Type.STRING, description: "Where it is placed (in Bengali if input is Bengali)" }
            },
            required: ["itemName", "location"]
          }
        }
      });
      res.json(JSON.parse(response.text || "{}"));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to parse item location." });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Support Express 4 fallback catch-all
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
