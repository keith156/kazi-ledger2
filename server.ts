import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: "20mb" }));

// Initialize Gemini Server-Side ONLY
const getApiKey = () => process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey: getApiKey() });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    intent: { type: Type.STRING },
    transaction: {
      type: Type.OBJECT,
      properties: {
        type: { type: Type.STRING },
        amount: { type: Type.NUMBER },
        category: { type: Type.STRING },
        counterparty: { type: Type.STRING },
        description: { type: Type.STRING },
      },
    },
    query_answer: { type: Type.STRING },
  },
  required: ["intent"],
};

// --- API ROUTES ---
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/gemini/parse", async (req, res) => {
  const { input, context } = req.body;
  const prompt = `
    Kazi Ledger Fast Mode: Analyze "${input}".
    Context: ${context}
    
    If RECORD:
    - INCOME: "Sold 3 sodas for 5000" -> 5000, "Sales", "Customer"
    - EXPENSE: "Paid 10000 for rent" -> 10000, "Rent"
    - DEBT: "Lent 2000 to John" -> 2000, DEBT, "John"
    - DEBT_PAYMENT: "John paid 500" -> 500, DEBT_PAYMENT, "John"

    If QUERY: Answer directly based on context.
    Return structured JSON.
  `;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        thinkingConfig: { thinkingBudget: 0 }
      },
    });
    res.json(JSON.parse(response.text || "{}"));
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post("/api/gemini/analyzeReceipt", async (req, res) => {
  const { base64Image } = req.body;
  const prompt = `
    Analyze receipt. Extract:
    - Type (EXPENSE/INCOME)
    - Total Amount
    - Category
    - Merchant/Counterparty
    - Brief description
    Return JSON.
  `;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image } },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        thinkingConfig: { thinkingBudget: 0 }
      },
    });
    res.json(JSON.parse(response.text || "{}"));
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post("/api/gemini/insights", async (req, res) => {
  const { context } = req.body;
  const prompt = `
    Analyze: "${context}"
    Provide 3 business insights. 
    EXACTLY 5 WORDS OR LESS EACH.
    Format as JSON array of strings.
  `;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } },
        thinkingConfig: { thinkingBudget: 0 }
      },
    });
    res.json(JSON.parse(response.text || "[]"));
  } catch (error) {
    res.json(["Daily sales help growth.", "Track debt consistently.", "Monitor your weekly totals."]);
  }
});

async function startServer() {
  const PORT = process.env.PORT || 3000;

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files from 'dist' in production
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
export default app;
