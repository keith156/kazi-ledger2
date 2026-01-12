
import { GoogleGenAI, Type } from "@google/genai";
import { AIResponse, TransactionType } from "./types";

// Fix: Use process.env.API_KEY directly in the named parameter object as required
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    intent: {
      type: Type.STRING,
      description: "RECORD for adding a transaction, QUERY for asking about history.",
    },
    transaction: {
      type: Type.OBJECT,
      properties: {
        type: { type: Type.STRING, description: "INCOME, EXPENSE, DEBT, or DEBT_PAYMENT" },
        amount: { type: Type.NUMBER },
        category: { type: Type.STRING },
        counterparty: { type: Type.STRING },
        description: { type: Type.STRING },
      },
    },
    query_answer: {
      type: Type.STRING,
      description: "The answer if the user is asking a question.",
    },
  },
  required: ["intent"],
};

export const parseNaturalLanguage = async (input: string, context: string): Promise<AIResponse> => {
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
        thinkingConfig: { thinkingBudget: 0 } // Disable thinking for max speed
      },
    });

    // Fix: use .text property directly, not as a method call
    return JSON.parse(response.text || "{}") as AIResponse;
  } catch (error) {
    console.error("AI Parsing Error:", error);
    throw error;
  }
};

export const analyzeReceipt = async (base64Image: string): Promise<AIResponse> => {
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
      // Fix: Follow the correct parts structure for multimodal inputs
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        thinkingConfig: { thinkingBudget: 0 } // Speed-optimized
      },
    });

    // Fix: use .text property directly
    return JSON.parse(response.text || "{}") as AIResponse;
  } catch (error) {
    console.error("Vision Analysis Error:", error);
    throw error;
  }
};

export const generateInsights = async (context: string): Promise<string[]> => {
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
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        thinkingConfig: { thinkingBudget: 0 } // Speed-optimized
      },
    });

    // Fix: use .text property directly
    return JSON.parse(response.text || "[]") as string[];
  } catch (error) {
    return ["Daily sales help growth.", "Track debt consistently.", "Monitor your weekly totals."];
  }
};
